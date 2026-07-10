/**
 * 图层树管理配置加载策略
 *
 * 定义配置加载的标准接口，不同数据源实现不同策略。
 * 树形数据结构使用 parentId 自关联字段构建层级关系。
 */
export class ConfigLoadStrategy {
  async load(configMetadata) {
    throw new Error('子类必须实现 load 方法');
  }

  async save(configMetadata, data) {
    throw new Error('子类必须实现 save 方法');
  }

  getName() {
    return 'ConfigLoadStrategy';
  }
}

/**
 * 配置注册器
 * 用于动态注册配置定义到 DataManager
 */
export class ConfigRegistry {
  constructor() {
    this.registeredConfigs = new Map();
  }

  getDataManager() {
    if (typeof window !== 'undefined' && window.__dataManager__) {
      return window.__dataManager__;
    }
    return null;
  }

  registerConfig(configId, configDefinition) {
    console.log(`[LayerTreeConfigRegistry] 📝 注册配置: ${configId}`);

    this.registeredConfigs.set(configId, {
      id: configId,
      ...configDefinition
    });

    const dataManager = this.getDataManager();
    if (dataManager && dataManager.configDefinitions) {
      dataManager.configDefinitions.set(configId, {
        id: configId,
        ...configDefinition
      });
      console.log(`[LayerTreeConfigRegistry] ✅ 配置已注册到 DataManager: ${configId}`);
    } else {
      console.warn(`[LayerTreeConfigRegistry] ⚠️ DataManager 未就绪，配置将在运行时注册: ${configId}`);
      if (typeof window !== 'undefined') {
        if (!window.__pendingConfigDefinitions__) {
          window.__pendingConfigDefinitions__ = new Map();
        }
        window.__pendingConfigDefinitions__.set(configId, {
          id: configId,
          ...configDefinition
        });
      }
    }
  }

  registerFromMetadata(panelMetadata) {
    if (!panelMetadata || !panelMetadata.configId) {
      console.warn('[LayerTreeConfigRegistry] ⚠️ 无效的面板配置元数据');
      return;
    }

    const configId = panelMetadata.configId;
    let relativePath = panelMetadata.dataSource?.relativePath;

    if (!relativePath) {
      relativePath = this.generateRelativePath(panelMetadata);
    }

    const configDefinition = {
      id: configId,
      name: panelMetadata.panelName || configId,
      fileName: panelMetadata.dataSource?.fileName || `${configId}.json`,
      relativePath: relativePath,
      description: panelMetadata.panelName || configId,
      icon: panelMetadata.panelIcon || '🌳',
      category: 'gis'
    };

    this.registerConfig(configId, configDefinition);
  }

  generateRelativePath(panelMetadata) {
    let folderName = panelMetadata.featureFolder;
    if (!folderName) {
      folderName = panelMetadata.dataSource?.folderName;
    }
    if (!folderName) {
      folderName = panelMetadata.panelId
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join('');
    }

    let fileName = panelMetadata.dataSource?.fileName || panelMetadata.configId;
    if (!fileName.endsWith('.json')) {
      fileName = `${fileName}.json`;
    }

    return `${folderName}/${fileName}`;
  }
}

export const configRegistry = new ConfigRegistry();

/**
 * SQLite 配置加载策略
 * 从 SQLite 数据库加载树形图层配置
 */
export class SQLiteConfigStrategy extends ConfigLoadStrategy {
  constructor() {
    super();
    this.db = null;
  }

  getName() {
    return 'SQLiteConfigStrategy';
  }

  async initDB() {
    if (this.db) return;

    return new Promise((resolve, reject) => {
      if (typeof window === 'undefined') {
        reject(new Error('SQLite 策略只能在浏览器环境中使用'));
        return;
      }

      if (window.sqlitePlugin) {
        window.sqlitePlugin.openDatabase({
          name: 'config.db',
          location: 'default'
        }, (db) => {
          this.db = db;
          resolve();
        }, (error) => {
          reject(error);
        });
      } else if (window.indexedDB) {
        console.warn('[LayerTreeSQLiteConfigStrategy] SQLite 插件不可用，将使用 IndexedDB 作为回退');
        this.db = { type: 'indexeddb' };
        resolve();
      } else {
        reject(new Error('不支持的数据库环境'));
      }
    });
  }

  async load(configMetadata) {
    console.log(`[LayerTreeSQLiteConfigStrategy] 从 SQLite 加载树形配置: ${configMetadata.panelId}`);

    try {
      await this.initDB();

      const tableName = configMetadata.dataSource?.tableName || configMetadata.panelId;

      if (this.db.type === 'indexeddb') {
        return await this.loadFromIndexedDB(tableName);
      }

      return new Promise((resolve, reject) => {
        this.db.transaction((tx) => {
          tx.executeSql(
            `SELECT * FROM ${tableName} ORDER BY sortOrder, id`,
            [],
            (tx, results) => {
              const data = [];
              for (let i = 0; i < results.rows.length; i++) {
                data.push(results.rows.item(i));
              }
              console.log(`[LayerTreeSQLiteConfigStrategy] ✅ 从 SQLite 加载成功，共 ${data.length} 条`);
              resolve(data);
            },
            (tx, error) => {
              console.warn(`[LayerTreeSQLiteConfigStrategy] ⚠️ 表 ${tableName} 不存在，尝试创建`);
              this.createTreeTable(tableName, configMetadata.fieldDefinitions)
                .then(() => resolve([]))
                .catch(reject);
            }
          );
        });
      });
    } catch (error) {
      console.error(`[LayerTreeSQLiteConfigStrategy] ❌ 加载失败:`, error);
      throw error;
    }
  }

  async save(configMetadata, data) {
    console.log(`[LayerTreeSQLiteConfigStrategy] 保存树形配置到 SQLite: ${configMetadata.panelId}`);

    try {
      await this.initDB();

      const tableName = configMetadata.dataSource?.tableName || configMetadata.panelId;
      const primaryKey = configMetadata.dataSource?.primaryKey || 'id';

      if (this.db.type === 'indexeddb') {
        return await this.saveToIndexedDB(tableName, data);
      }

      return new Promise((resolve, reject) => {
        this.db.transaction((tx) => {
          tx.executeSql(`DELETE FROM ${tableName}`, [], () => {
            if (data.length === 0) {
              console.log('[LayerTreeSQLiteConfigStrategy] ✅ 保存成功（空数据）');
              resolve(true);
              return;
            }

            let completed = 0;
            data.forEach((item) => {
              const keys = Object.keys(item).filter(k => k !== 'loaded' && k !== 'loading' && k !== 'children');
              const placeholders = keys.map(() => '?').join(',');
              const values = keys.map(k => item[k] !== undefined ? item[k] : null);

              tx.executeSql(
                `INSERT INTO ${tableName} (${keys.join(',')}) VALUES (${placeholders})`,
                values,
                () => {
                  completed++;
                  if (completed === data.length) {
                    console.log(`[LayerTreeSQLiteConfigStrategy] ✅ 保存成功，共 ${data.length} 条`);
                    resolve(true);
                  }
                },
                (tx, error) => {
                  console.error(`[LayerTreeSQLiteConfigStrategy] ❌ 保存失败:`, error);
                  reject(error);
                }
              );
            });
          });
        });
      });
    } catch (error) {
      console.error(`[LayerTreeSQLiteConfigStrategy] ❌ 保存失败:`, error);
      throw error;
    }
  }

  /**
   * 创建树形图层管理表（包含 parentId 自关联字段）
   * @param {string} tableName - 表名
   * @param {Array} fieldDefinitions - 字段定义
   * @returns {Promise<void>}
   */
  createTreeTable(tableName, fieldDefinitions) {
    return new Promise((resolve, reject) => {
      // ⭐ 树形结构表：parentId 为自关联字段，引用同一表的 id
      let fields;

      if (!fieldDefinitions || !Array.isArray(fieldDefinitions) || fieldDefinitions.length === 0) {
        fields = `
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          parentId TEXT,
          nodeType TEXT DEFAULT 'layer',
          url TEXT,
          sortOrder INTEGER DEFAULT 0,
          visible INTEGER DEFAULT 1,
          description TEXT,
          icon TEXT
        `;
      } else {
        fields = fieldDefinitions.map(field => {
          let type = 'TEXT';
          if (field.type === 'number') type = 'INTEGER';
          if (field.type === 'boolean') type = 'INTEGER';
          if (field.key === 'id') return `id TEXT PRIMARY KEY`;
          if (field.key === 'parentId') return `parentId TEXT`; // ⭐ 自关联字段
          return `${field.key} ${type}`;
        }).join(',');
      }

      this.db.transaction((tx) => {
        tx.executeSql(
          `CREATE TABLE IF NOT EXISTS ${tableName} (${fields})`,
          [],
          () => {
            console.log(`[LayerTreeSQLiteConfigStrategy] ✅ 树形表 ${tableName} 创建成功（含 parentId 自关联字段）`);
            resolve();
          },
          (tx, error) => {
            console.error(`[LayerTreeSQLiteConfigStrategy] ❌ 创建表失败:`, error);
            reject(error);
          }
        );
      });
    });
  }

  async loadFromIndexedDB(storeName) {
    return new Promise((resolve, reject) => {
      const request = window.indexedDB.open('configDB'); // 不指定版本号，使用数据库当前版本

      request.onerror = () => reject(request.error);
      request.onsuccess = (event) => {
        const db = event.target.result;
        const transaction = db.transaction([storeName], 'readonly');
        const store = transaction.objectStore(storeName);
        const getAllRequest = store.getAll();

        getAllRequest.onsuccess = () => {
          console.log(`[LayerTreeSQLiteConfigStrategy] ✅ 从 IndexedDB 加载成功，共 ${getAllRequest.result.length} 条`);
          resolve(getAllRequest.result);
          db.close();
        };
        getAllRequest.onerror = () => reject(getAllRequest.error);
      };
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(storeName)) {
          db.createObjectStore(storeName, { keyPath: 'id' });
        }
      };
    });
  }

  async saveToIndexedDB(storeName, data) {
    return new Promise((resolve, reject) => {
      const request = window.indexedDB.open('configDB'); // 不指定版本号，使用数据库当前版本

      request.onerror = () => reject(request.error);
      request.onsuccess = (event) => {
        const db = event.target.result;
        const transaction = db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);

        store.clear().onsuccess = () => {
          if (data.length === 0) {
            console.log('[LayerTreeSQLiteConfigStrategy] ✅ 保存成功（空数据）');
            resolve(true);
            db.close();
            return;
          }

          let completed = 0;
          data.forEach((item) => {
            // ⭐ 通过 JSON 序列化/反序列化彻底清洗，仅保留结构化克隆兼容的值
            var cloned;
            try {
              cloned = JSON.parse(JSON.stringify(item, function (key, val) {
                if (val === undefined || typeof val === 'function' || typeof val === 'symbol') return undefined;
                if (key === 'loaded' || key === 'loading' || key === 'children') return undefined;
                return val;
              }));
            } catch (jsonErr) {
              console.warn('[LayerTreeSQLiteConfigStrategy] ⚠️ JSON 清洗失败，跳过:', item.id, jsonErr.message);
              completed++;
              if (completed === data.length) { resolve(true); db.close(); }
              return;
            }
            var putRequest = store.put(cloned);

            putRequest.onsuccess = () => {
              completed++;
              if (completed === data.length) {
                console.log(`[LayerTreeSQLiteConfigStrategy] ✅ 保存成功，共 ${data.length} 条`);
                resolve(true);
                db.close();
              }
            };
            putRequest.onerror = () => {
              reject(putRequest.error);
              db.close();
            };
          });
        };
      };
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(storeName)) {
          db.createObjectStore(storeName, { keyPath: 'id' });
        }
      };
    });
  }
}

/**
 * JSON 文件配置加载策略
 * 从 JSON 文件加载配置（作为回退策略）
 */
export class JSONFileConfigStrategy extends ConfigLoadStrategy {
  getName() {
    return 'JSONFileConfigStrategy';
  }

  async checkFeatureFolderExists(folderName) {
    try {
      const url = `/data/gis/${folderName}/`;
      const response = await fetch(url, { method: 'HEAD' });
      return response.ok;
    } catch (error) {
      console.warn(`[LayerTreeJSONFileConfigStrategy] 检查文件夹 ${folderName} 失败:`, error);
      return false;
    }
  }

  async validateManagerStructure(configMetadata) {
    const isManager = configMetadata.panelId.toLowerCase().includes('manager') ||
                      configMetadata.panelName?.includes('管理');

    if (!isManager) {
      return { valid: true, isManager: false, message: '非 Manager 组件，跳过检查' };
    }

    console.log(`[LayerTreeJSONFileConfigStrategy] 🔍 验证 Manager 组件结构: ${configMetadata.panelId}`);

    let folderName = configMetadata.featureFolder;
    if (!folderName) {
      folderName = configMetadata.dataSource?.folderName;
    }
    if (!folderName) {
      folderName = configMetadata.panelId
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join('');
    }

    const folderExists = await this.checkFeatureFolderExists(folderName);

    if (!folderExists) {
      console.warn(`[LayerTreeJSONFileConfigStrategy] ⚠️ Manager 组件 ${configMetadata.panelId} 的配置文件夹不存在: /data/gis/${folderName}/`);
      console.warn(`[LayerTreeJSONFileConfigStrategy] 💡 建议创建文件夹: public/data/gis/${folderName}/`);
    }

    let fileName = configMetadata.dataSource?.fileName || folderName;
    try {
      const url = `/data/gis/${folderName}/${fileName}.json`;
      const response = await fetch(url, { method: 'HEAD' });

      if (!response.ok) {
        console.warn(`[LayerTreeJSONFileConfigStrategy] ⚠️ Manager 组件 ${configMetadata.panelId} 的配置文件不存在: ${url}`);
        console.warn(`[LayerTreeJSONFileConfigStrategy] 💡 建议创建配置文件: public/data/gis/${folderName}/${fileName}.json`);
      }
    } catch (error) {
      console.warn(`[LayerTreeJSONFileConfigStrategy] ⚠️ 检查配置文件失败:`, error);
    }

    return {
      valid: true,
      isManager: true,
      folderName,
      folderExists,
      message: folderExists ? '配置结构完整' : '配置文件夹不存在'
    };
  }

  async load(configMetadata) {
    console.log(`[LayerTreeJSONFileConfigStrategy] 从 JSON 文件加载树形配置: ${configMetadata.panelId}`);

    try {
      const structureResult = await this.validateManagerStructure(configMetadata);
      if (structureResult.isManager && !structureResult.folderExists) {
        console.warn(`[LayerTreeJSONFileConfigStrategy] ⚠️ Manager 组件配置文件夹不存在，将使用默认配置`);
      }

      let folderName = configMetadata.featureFolder;
      if (!folderName) {
        folderName = configMetadata.dataSource?.folderName;
      }
      if (!folderName) {
        folderName = configMetadata.panelId
          .split('-')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join('');
      }

      let fileName = configMetadata.dataSource?.fileName;
      if (!fileName) {
        fileName = folderName;
      }

      const url = `/data/gis/${folderName}/${fileName}.json`;
      console.log(`[LayerTreeJSONFileConfigStrategy] 📡 请求 URL: ${url}`);

      const response = await fetch(url, {
        cache: 'no-cache'
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      console.log(`[LayerTreeJSONFileConfigStrategy] ✅ 从 JSON 文件加载成功，共 ${data.length} 条`);
      return data;
    } catch (error) {
      console.error(`[LayerTreeJSONFileConfigStrategy] ❌ 加载失败:`, error);
      return [];
    }
  }

  async save(configMetadata, data) {
    console.log(`[LayerTreeJSONFileConfigStrategy] 保存树形配置到 JSON 文件: ${configMetadata.panelId}`);

    try {
      console.log(`[LayerTreeJSONFileConfigStrategy] ✅ 数据已准备保存（${data.length} 条）`);
      console.log('[LayerTreeJSONFileConfigStrategy] 数据内容:', JSON.stringify(data, null, 2));
      return true;
    } catch (error) {
      console.error(`[LayerTreeJSONFileConfigStrategy] ❌ 保存失败:`, error);
      return false;
    }
  }
}

/**
 * API 服务器配置加载策略
 * 从 API 服务器加载配置
 */
export class APIConfigStrategy extends ConfigLoadStrategy {
  constructor(baseURL = 'http://localhost:8081') {
    super();
    this.baseURL = baseURL;
  }

  getName() {
    return 'APIConfigStrategy';
  }

  async load(configMetadata) {
    console.log(`[LayerTreeAPIConfigStrategy] 从 API 服务器加载树形配置: ${configMetadata.panelId}`);

    try {
      const url = `${this.baseURL}/api/data/gis/${configMetadata.panelId}.json`;
      console.log(`[LayerTreeAPIConfigStrategy] 📡 请求 URL: ${url}`);

      const response = await fetch(url, {
        method: 'GET',
        mode: 'cors',
        cache: 'no-cache'
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();

      if (result.success && result.data) {
        console.log(`[LayerTreeAPIConfigStrategy] ✅ 从 API 服务器加载成功，共 ${result.data.length} 条`);
        return result.data;
      } else {
        throw new Error(result.error || '加载数据失败');
      }
    } catch (error) {
      console.error(`[LayerTreeAPIConfigStrategy] ❌ 加载失败:`, error);
      throw error;
    }
  }

  async save(configMetadata, data) {
    console.log(`[LayerTreeAPIConfigStrategy] 保存树形配置到 API 服务器: ${configMetadata.panelId}`);

    try {
      const url = `${this.baseURL}/api/data/gis/${configMetadata.panelId}.json`;

      const response = await fetch(url, {
        method: 'PUT',
        mode: 'cors',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

      const result = await response.json();

      if (result.success) {
        console.log(`[LayerTreeAPIConfigStrategy] ✅ 保存成功`);
        return true;
      } else {
        console.error(`[LayerTreeAPIConfigStrategy] ❌ 保存失败:`, result.error);
        throw new Error(result.error);
      }
    } catch (error) {
      console.error(`[LayerTreeAPIConfigStrategy] ❌ 保存失败:`, error);
      throw error;
    }
  }
}

/**
 * 策略工厂
 * 根据配置类型创建对应的策略实例
 */
export class ConfigStrategyFactory {
  static create(type, options = {}) {
    switch (type.toLowerCase()) {
      case 'sqlite':
        return new SQLiteConfigStrategy();
      case 'json':
      case 'file':
        return new JSONFileConfigStrategy();
      case 'api':
        return new APIConfigStrategy(options.baseURL);
      default:
        throw new Error(`未知的策略类型: ${type}`);
    }
  }

  static createWithFallback(types, options = {}) {
    return new FallbackConfigStrategy(types, options);
  }
}

/**
 * 回退策略
 * 当主策略失败时自动尝试下一个策略
 */
export class FallbackConfigStrategy extends ConfigLoadStrategy {
  constructor(types, options = {}) {
    super();
    this.strategies = types.map(type => ConfigStrategyFactory.create(type, options));
  }

  getName() {
    return 'FallbackConfigStrategy';
  }

  async load(configMetadata) {
    console.log(`[LayerTreeFallbackConfigStrategy] 开始加载树形配置，策略链: ${this.strategies.map(s => s.getName()).join(' -> ')}`);

    for (let i = 0; i < this.strategies.length; i++) {
      const strategy = this.strategies[i];
      try {
        const data = await strategy.load(configMetadata);

        if (!data || (Array.isArray(data) && data.length === 0)) {
          console.warn(`[LayerTreeFallbackConfigStrategy] ⚠️ 策略 ${strategy.getName()} 返回空数据，尝试下一个策略`);
          continue;
        }

        console.log(`[LayerTreeFallbackConfigStrategy] ✅ 策略 ${strategy.getName()} 成功加载 ${data.length} 条数据`);
        return data;
      } catch (error) {
        console.warn(`[LayerTreeFallbackConfigStrategy] ⚠️ 策略 ${strategy.getName()} 失败，尝试下一个策略:`, error.message);
        if (i === this.strategies.length - 1) {
          console.error(`[LayerTreeFallbackConfigStrategy] ❌ 所有策略都失败`);
          return [];
        }
      }
    }

    return [];
  }

  async save(configMetadata, data) {
    if (this.strategies.length === 0) {
      throw new Error('没有可用的保存策略');
    }

    const primaryStrategy = this.strategies[0];
    try {
      return await primaryStrategy.save(configMetadata, data);
    } catch (error) {
      console.warn(`[LayerTreeFallbackConfigStrategy] ⚠️ 主策略 ${primaryStrategy.getName()} 保存失败`);
      for (let i = 1; i < this.strategies.length; i++) {
        try {
          return await this.strategies[i].save(configMetadata, data);
        } catch (e) {
          console.warn(`[LayerTreeFallbackConfigStrategy] ⚠️ 策略 ${this.strategies[i].getName()} 保存失败`);
        }
      }
      throw error;
    }
  }
}
