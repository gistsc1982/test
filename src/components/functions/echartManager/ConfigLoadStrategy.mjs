/**
 * 配置加载策略接口
 * 定义配置加载的标准接口，不同数据源实现不同策略
 */
export class ConfigLoadStrategy {
  /**
   * 加载配置
   * @param {Object} configMetadata - 配置元数据
   * @returns {Promise<Array>} - 配置数据数组
   */
  async load(configMetadata) {
    throw new Error('子类必须实现 load 方法');
  }

  /**
   * 保存配置
   * @param {Object} configMetadata - 配置元数据
   * @param {Array} data - 要保存的数据
   * @returns {Promise<boolean>} - 是否保存成功
   */
  async save(configMetadata, data) {
    throw new Error('子类必须实现 save 方法');
  }

  /**
   * 获取策略名称
   * @returns {string} - 策略名称
   */
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

  /**
   * 获取 DataManager 实例
   * @returns {Object} DataManager 实例
   */
  getDataManager() {
    // 尝试从 window 获取 DataManager 实例
    if (typeof window !== 'undefined' && window.__dataManager__) {
      return window.__dataManager__;
    }
    
    // 尝试从 JsonConfigPanelBase.mjs 获取 J 实例
    try {
      // 动态导入 JsonConfigPanelBase.mjs
      return null; // 需要在运行时获取
    } catch (e) {
      console.warn('[ConfigRegistry] 无法获取 DataManager 实例');
      return null;
    }
  }

  /**
   * 注册配置定义
   * @param {string} configId - 配置ID
   * @param {Object} configDefinition - 配置定义
   */
  registerConfig(configId, configDefinition) {
    console.log(`[ConfigRegistry] 📝 注册配置: ${configId}`);
    
    this.registeredConfigs.set(configId, {
      id: configId,
      ...configDefinition
    });

    // 尝试注册到 DataManager
    const dataManager = this.getDataManager();
    if (dataManager && dataManager.configDefinitions) {
      dataManager.configDefinitions.set(configId, {
        id: configId,
        ...configDefinition
      });
      console.log(`[ConfigRegistry] ✅ 配置已注册到 DataManager: ${configId}`);
    } else {
      console.warn(`[ConfigRegistry] ⚠️ DataManager 未就绪，配置将在运行时注册: ${configId}`);
      // 存储到 window 供后续使用
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

  /**
   * 批量注册配置定义
   * @param {Array} configs - 配置定义数组
   */
  registerConfigs(configs) {
    configs.forEach(config => {
      if (config.id) {
        this.registerConfig(config.id, config);
      }
    });
  }

  /**
   * 从配置元数据注册
   * @param {Object} panelMetadata - 面板配置元数据
   */
  registerFromMetadata(panelMetadata) {
    if (!panelMetadata || !panelMetadata.configId) {
      console.warn('[ConfigRegistry] ⚠️ 无效的面板配置元数据');
      return;
    }

    const configId = panelMetadata.configId;
    
    // 优先使用配置中指定的 relativePath
    let relativePath = panelMetadata.dataSource?.relativePath;
    
    // 如果没有指定，则自动生成
    if (!relativePath) {
      relativePath = this.generateRelativePath(panelMetadata);
    }
    
    // 根据 panelMetadata 生成配置定义
    const configDefinition = {
      id: configId,
      name: panelMetadata.panelName || configId,
      fileName: panelMetadata.dataSource?.fileName || `${configId}.json`,
      relativePath: relativePath,
      description: panelMetadata.panelName || configId,
      icon: panelMetadata.panelIcon || '📋',
      category: 'gis'
    };

    this.registerConfig(configId, configDefinition);
  }

  /**
   * 根据配置元数据生成相对路径
   * @param {Object} panelMetadata - 面板配置元数据
   * @returns {string} 相对路径
   */
  generateRelativePath(panelMetadata) {
    // 优先使用 featureFolder
    let folderName = panelMetadata.featureFolder;
    
    // 其次使用 dataSource 中的 folderName
    if (!folderName) {
      folderName = panelMetadata.dataSource?.folderName;
    }
    
    // 最后根据 panelId 生成
    if (!folderName) {
      folderName = panelMetadata.panelId
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join('');
    }

    // 使用 dataSource 中的 fileName，否则使用 panelId
    let fileName = panelMetadata.dataSource?.fileName || panelMetadata.configId;

    // 确保文件扩展名
    if (!fileName.endsWith('.json')) {
      fileName = `${fileName}.json`;
    }

    return `${folderName}/${fileName}`;
  }
}

// 创建全局注册器实例
export const configRegistry = new ConfigRegistry();

// 页面加载完成后，将待注册配置同步到 DataManager
if (typeof window !== 'undefined') {
  window.__dataManagerReady__ = new Promise((resolve) => {
    // 监听 DataManager 初始化完成事件
    const checkDataManager = () => {
      // 尝试从全局变量获取 DataManager
      const dataManager = typeof window.__dataManager__ !== 'undefined' 
        ? window.__dataManager__ 
        : null;
      
      if (dataManager && dataManager.configDefinitions) {
        // 同步待注册的配置
        if (window.__pendingConfigDefinitions__) {
          window.__pendingConfigDefinitions__.forEach((config, configId) => {
            if (!dataManager.configDefinitions.has(configId)) {
              dataManager.configDefinitions.set(configId, config);
              console.log(`[ConfigRegistry] ✅ 延迟注册配置到 DataManager: ${configId}`);
            }
          });
        }
        resolve(dataManager);
      } else {
        // 稍后重试
        setTimeout(checkDataManager, 100);
      }
    };
    
    // 立即检查一次
    setTimeout(checkDataManager, 100);
  });
}

/**
 * SQLite 配置加载策略
 * 从 SQLite 数据库加载配置
 */
export class SQLiteConfigStrategy extends ConfigLoadStrategy {
  constructor() {
    super();
    this.db = null;
  }

  getName() {
    return 'SQLiteConfigStrategy';
  }

  /**
   * 初始化数据库连接
   * @returns {Promise<void>}
   */
  async initDB() {
    if (this.db) return;

    return new Promise((resolve, reject) => {
      // 检查是否在浏览器环境
      if (typeof window === 'undefined') {
        reject(new Error('SQLite 策略只能在浏览器环境中使用'));
        return;
      }

      // 尝试加载 SQLite
      if (window.sqlitePlugin) {
        // Cordova/Ionic 环境
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
        // 使用 IndexedDB 作为替代
        console.warn('[SQLiteConfigStrategy] SQLite 插件不可用，将使用 IndexedDB 作为回退');
        this.db = { type: 'indexeddb' };
        resolve();
      } else {
        reject(new Error('不支持的数据库环境'));
      }
    });
  }

  /**
   * 从 SQLite 加载配置
   * @param {Object} configMetadata - 配置元数据
   * @returns {Promise<Array>}
   */
  async load(configMetadata) {
    console.log(`[SQLiteConfigStrategy] 从 SQLite 加载配置: ${configMetadata.panelId}`);

    try {
      await this.initDB();

      const tableName = configMetadata.dataSource?.tableName || configMetadata.panelId;

      if (this.db.type === 'indexeddb') {
        // IndexedDB 回退实现
        return await this.loadFromIndexedDB(tableName);
      }

      return new Promise((resolve, reject) => {
        this.db.transaction((tx) => {
          tx.executeSql(
            `SELECT * FROM ${tableName} ORDER BY id`,
            [],
            (tx, results) => {
              const data = [];
              for (let i = 0; i < results.rows.length; i++) {
                data.push(results.rows.item(i));
              }
              console.log(`[SQLiteConfigStrategy] ✅ 从 SQLite 加载成功，共 ${data.length} 条`);
              resolve(data);
            },
            (tx, error) => {
              console.warn(`[SQLiteConfigStrategy] ⚠️ 表 ${tableName} 不存在，尝试创建`);
              // 表不存在，创建表并返回空数组
              this.createTable(tableName, configMetadata.fieldDefinitions)
                .then(() => resolve([]))
                .catch(reject);
            }
          );
        });
      });
    } catch (error) {
      console.error(`[SQLiteConfigStrategy] ❌ 加载失败:`, error);
      throw error;
    }
  }

  /**
   * 保存配置到 SQLite
   * @param {Object} configMetadata - 配置元数据
   * @param {Array} data - 要保存的数据
   * @returns {Promise<boolean>}
   */
  async save(configMetadata, data) {
    console.log(`[SQLiteConfigStrategy] 保存配置到 SQLite: ${configMetadata.panelId}`);

    try {
      await this.initDB();

      const tableName = configMetadata.dataSource?.tableName || configMetadata.panelId;
      const primaryKey = configMetadata.dataSource?.primaryKey || 'id';

      if (this.db.type === 'indexeddb') {
        return await this.saveToIndexedDB(tableName, data);
      }

      return new Promise((resolve, reject) => {
        this.db.transaction((tx) => {
          // 先清空表
          tx.executeSql(`DELETE FROM ${tableName}`, [], () => {
            // 插入数据
            if (data.length === 0) {
              console.log('[SQLiteConfigStrategy] ✅ 保存成功（空数据）');
              resolve(true);
              return;
            }

            let completed = 0;
            data.forEach((item) => {
              const keys = Object.keys(item).filter(k => k !== 'loaded' && k !== 'loading');
              const placeholders = keys.map(() => '?').join(',');
              const values = keys.map(k => item[k]);

              tx.executeSql(
                `INSERT INTO ${tableName} (${keys.join(',')}) VALUES (${placeholders})`,
                values,
                () => {
                  completed++;
                  if (completed === data.length) {
                    console.log(`[SQLiteConfigStrategy] ✅ 保存成功，共 ${data.length} 条`);
                    resolve(true);
                  }
                },
                (tx, error) => {
                  console.error(`[SQLiteConfigStrategy] ❌ 保存失败:`, error);
                  reject(error);
                }
              );
            });
          });
        });
      });
    } catch (error) {
      console.error(`[SQLiteConfigStrategy] ❌ 保存失败:`, error);
      throw error;
    }
  }

  /**
   * 创建表
   * @param {string} tableName - 表名
   * @param {Array} fieldDefinitions - 字段定义（可选）
   * @returns {Promise<void>}
   */
  createTable(tableName, fieldDefinitions) {
    return new Promise((resolve, reject) => {
      let fields;
      
      // 如果没有 fieldDefinitions，使用默认的配置表结构
      if (!fieldDefinitions || !Array.isArray(fieldDefinitions) || fieldDefinitions.length === 0) {
        // 默认配置表结构：存储面板配置
        fields = `
          id TEXT PRIMARY KEY,
          presets TEXT,
          heightRange TEXT,
          uiConfig TEXT,
          updatedAt TEXT
        `;
      } else {
        // 使用提供的字段定义
        fields = fieldDefinitions.map(field => {
          let type = 'TEXT';
          if (field.type === 'number') type = 'INTEGER';
          if (field.type === 'boolean') type = 'INTEGER';
          if (field.key === 'id') return `id TEXT PRIMARY KEY`;
          return `${field.key} ${type}`;
        }).join(',');
      }

      this.db.transaction((tx) => {
        tx.executeSql(
          `CREATE TABLE IF NOT EXISTS ${tableName} (${fields})`,
          [],
          () => {
            console.log(`[SQLiteConfigStrategy] ✅ 表 ${tableName} 创建成功`);
            resolve();
          },
          (tx, error) => {
            console.error(`[SQLiteConfigStrategy] ❌ 创建表失败:`, error);
            reject(error);
          }
        );
      });
    });
  }

  /**
   * 从 IndexedDB 加载数据
   * @param {string} storeName - 存储名称
   * @returns {Promise<Array>}
   */
  async loadFromIndexedDB(storeName) {
    return new Promise((resolve, reject) => {
      const request = window.indexedDB.open('configDB');

      request.onerror = () => reject(request.error);
      request.onsuccess = (event) => {
        const db = event.target.result;
        const transaction = db.transaction([storeName], 'readonly');
        const store = transaction.objectStore(storeName);
        const getAllRequest = store.getAll();

        getAllRequest.onsuccess = () => {
          console.log(`[SQLiteConfigStrategy] ✅ 从 IndexedDB 加载成功，共 ${getAllRequest.result.length} 条`);
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

  /**
   * 保存数据到 IndexedDB
   * @param {string} storeName - 存储名称
   * @param {Array} data - 要保存的数据
   * @returns {Promise<boolean>}
   */
  async saveToIndexedDB(storeName, data) {
    return new Promise((resolve, reject) => {
      const request = window.indexedDB.open('configDB');

      request.onerror = () => reject(request.error);
      request.onsuccess = (event) => {
        const db = event.target.result;
        const transaction = db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);

        // 先清空存储
        store.clear().onsuccess = () => {
          // 插入数据
          if (data.length === 0) {
            console.log('[SQLiteConfigStrategy] ✅ 保存成功（空数据）');
            resolve(true);
            db.close();
            return;
          }

          let completed = 0;
          data.forEach((item) => {
            const cleanItem = JSON.parse(JSON.stringify(item, function (k, v) {
              if (k === 'loaded' || k === 'loading' || k === 'children') return undefined;
              if (v === undefined || typeof v === 'function' || typeof v === 'symbol') return undefined;
              return v;
            }));
            const putRequest = store.put(cleanItem);

            putRequest.onsuccess = () => {
              completed++;
              if (completed === data.length) {
                console.log(`[SQLiteConfigStrategy] ✅ 保存成功，共 ${data.length} 条`);
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

  /**
   * 检查 Manager 组件的配置文件夹是否存在
   * @param {string} folderName - 功能文件夹名
   * @returns {Promise<boolean>} - 是否存在
   */
  async checkFeatureFolderExists(folderName) {
    try {
      const url = `/data/gis/${folderName}/`;
      const response = await fetch(url, { method: 'HEAD' });
      return response.ok;
    } catch (error) {
      console.warn(`[JSONFileConfigStrategy] 检查文件夹 ${folderName} 失败:`, error);
      return false;
    }
  }

  /**
   * 验证 Manager 组件的配置结构
   * @param {Object} configMetadata - 配置元数据
   * @returns {Promise<Object>} - 验证结果
   */
  async validateManagerStructure(configMetadata) {
    // 检查是否是 Manager 组件
    const isManager = configMetadata.panelId.toLowerCase().includes('manager') || 
                      configMetadata.panelName?.includes('管理');
    
    if (!isManager) {
      return { valid: true, isManager: false, message: '非 Manager 组件，跳过检查' };
    }

    console.log(`[JSONFileConfigStrategy] 🔍 验证 Manager 组件结构: ${configMetadata.panelId}`);

    // 获取功能文件夹名
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

    // 检查配置文件夹是否存在
    const folderExists = await this.checkFeatureFolderExists(folderName);
    
    if (!folderExists) {
      console.warn(`[JSONFileConfigStrategy] ⚠️ Manager 组件 ${configMetadata.panelId} 的配置文件夹不存在: /data/gis/${folderName}/`);
      console.warn(`[JSONFileConfigStrategy] 💡 建议创建文件夹: public/data/gis/${folderName}/`);
    }

    // 检查配置文件是否存在
    let fileName = configMetadata.dataSource?.fileName || folderName;
    try {
      const url = `/data/gis/${folderName}/${fileName}.json`;
      const response = await fetch(url, { method: 'HEAD' });
      
      if (!response.ok) {
        console.warn(`[JSONFileConfigStrategy] ⚠️ Manager 组件 ${configMetadata.panelId} 的配置文件不存在: ${url}`);
        console.warn(`[JSONFileConfigStrategy] 💡 建议创建配置文件: public/data/gis/${folderName}/${fileName}.json`);
      }
    } catch (error) {
      console.warn(`[JSONFileConfigStrategy] ⚠️ 检查配置文件失败:`, error);
    }

    return {
      valid: true,
      isManager: true,
      folderName,
      folderExists,
      message: folderExists ? '配置结构完整' : '配置文件夹不存在'
    };
  }

  /**
   * 从 JSON 文件加载配置
   * @param {Object} configMetadata - 配置元数据
   * @returns {Promise<Array>}
   */
  async load(configMetadata) {
    console.log(`[JSONFileConfigStrategy] 从 JSON 文件加载配置: ${configMetadata.panelId}`);

    try {
      // ⭐ 对 Manager 组件进行结构检查
      const structureResult = await this.validateManagerStructure(configMetadata);
      if (structureResult.isManager && !structureResult.folderExists) {
        console.warn(`[JSONFileConfigStrategy] ⚠️ Manager 组件配置文件夹不存在，将使用默认配置`);
      }

      // 优先使用配置中指定的功能文件夹名（featureFolder）
      // 这是 Vue 文件所在的功能文件夹名
      let folderName = configMetadata.featureFolder;
      
      // 其次使用 dataSource 中指定的文件夹名
      if (!folderName) {
        folderName = configMetadata.dataSource?.folderName;
      }
      
      // 最后根据 panelId 生成文件夹名（转换为 PascalCase）
      if (!folderName) {
        folderName = configMetadata.panelId
          .split('-')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join('');
      }
      
      // 优先使用配置中指定的文件名，否则根据 panelId 推断
      let fileName = configMetadata.dataSource?.fileName;
      if (!fileName) {
        fileName = folderName;
      }
      
      // 构建路径：/data/gis/{功能文件夹名}/{文件名}.json
      const url = `/data/gis/${folderName}/${fileName}.json`;
      console.log(`[JSONFileConfigStrategy] 📡 请求 URL: ${url}`);
      
      const response = await fetch(url, {
        cache: 'no-cache'
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      console.log(`[JSONFileConfigStrategy] ✅ 从 JSON 文件加载成功，共 ${data.length} 条`);
      return data;
    } catch (error) {
      console.error(`[JSONFileConfigStrategy] ❌ 加载失败:`, error);
      return [];
    }
  }

  /**
   * 保存配置到 JSON 文件
   * @param {Object} configMetadata - 配置元数据
   * @param {Array} data - 要保存的数据
   * @returns {Promise<boolean>}
   */
  async save(configMetadata, data) {
    console.log(`[JSONFileConfigStrategy] 保存配置到 JSON 文件: ${configMetadata.panelId}`);

    try {
      // 在浏览器环境中无法直接写入文件，这里只做日志记录
      console.log(`[JSONFileConfigStrategy] ✅ 数据已准备保存（${data.length} 条）`);
      console.log('[JSONFileConfigStrategy] 数据内容:', JSON.stringify(data, null, 2));
      return true;
    } catch (error) {
      console.error(`[JSONFileConfigStrategy] ❌ 保存失败:`, error);
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

  /**
   * 从 API 服务器加载配置
   * @param {Object} configMetadata - 配置元数据
   * @returns {Promise<Array>}
   */
  async load(configMetadata) {
    console.log(`[APIConfigStrategy] 从 API 服务器加载配置: ${configMetadata.panelId}`);

    try {
      const url = `${this.baseURL}/api/data/gis/${configMetadata.panelId}.json`;
      console.log(`[APIConfigStrategy] 📡 请求 URL: ${url}`);

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
        console.log(`[APIConfigStrategy] ✅ 从 API 服务器加载成功，共 ${result.data.length} 条`);
        return result.data;
      } else {
        throw new Error(result.error || '加载数据失败');
      }
    } catch (error) {
      console.error(`[APIConfigStrategy] ❌ 加载失败:`, error);
      throw error;
    }
  }

  /**
   * 保存配置到 API 服务器
   * @param {Object} configMetadata - 配置元数据
   * @param {Array} data - 要保存的数据
   * @returns {Promise<boolean>}
   */
  async save(configMetadata, data) {
    console.log(`[APIConfigStrategy] 保存配置到 API 服务器: ${configMetadata.panelId}`);

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
        console.log(`[APIConfigStrategy] ✅ 保存成功`);
        return true;
      } else {
        console.error(`[APIConfigStrategy] ❌ 保存失败:`, result.error);
        throw new Error(result.error);
      }
    } catch (error) {
      console.error(`[APIConfigStrategy] ❌ 保存失败:`, error);
      throw error;
    }
  }
}

/**
 * 策略工厂
 * 根据配置类型创建对应的策略实例
 */
export class ConfigStrategyFactory {
  /**
   * 创建策略实例
   * @param {string} type - 策略类型: 'sqlite', 'json', 'api'
   * @param {Object} options - 策略选项
   * @returns {ConfigLoadStrategy}
   */
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

  /**
   * 创建带有回退机制的策略链
   * @param {Array<string>} types - 策略类型数组，按优先级排序
   * @param {Object} options - 策略选项
   * @returns {ConfigLoadStrategy}
   */
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

  /**
   * 加载配置（带回退）
   * @param {Object} configMetadata - 配置元数据
   * @returns {Promise<Array>}
   */
  async load(configMetadata) {
    console.log(`[FallbackConfigStrategy] 开始加载配置，策略链: ${this.strategies.map(s => s.getName()).join(' -> ')}`);

    for (let i = 0; i < this.strategies.length; i++) {
      const strategy = this.strategies[i];
      try {
        const data = await strategy.load(configMetadata);
        
        // ⭐ 新增：如果返回空数组，也尝试下一个策略
        if (!data || (Array.isArray(data) && data.length === 0)) {
          console.warn(`[FallbackConfigStrategy] ⚠️ 策略 ${strategy.getName()} 返回空数据，尝试下一个策略`);
          continue;
        }
        
        console.log(`[FallbackConfigStrategy] ✅ 策略 ${strategy.getName()} 成功加载 ${data.length} 条数据`);
        return data;
      } catch (error) {
        console.warn(`[FallbackConfigStrategy] ⚠️ 策略 ${strategy.getName()} 失败，尝试下一个策略:`, error.message);
        if (i === this.strategies.length - 1) {
          // 所有策略都失败
          console.error(`[FallbackConfigStrategy] ❌ 所有策略都失败`);
          return [];
        }
      }
    }

    return [];
  }

  /**
   * 保存配置（只使用第一个策略）
   * @param {Object} configMetadata - 配置元数据
   * @param {Array} data - 要保存的数据
   * @returns {Promise<boolean>}
   */
  async save(configMetadata, data) {
    if (this.strategies.length === 0) {
      throw new Error('没有可用的保存策略');
    }

    // 优先使用第一个策略保存
    const primaryStrategy = this.strategies[0];
    try {
      return await primaryStrategy.save(configMetadata, data);
    } catch (error) {
      console.warn(`[FallbackConfigStrategy] ⚠️ 主策略 ${primaryStrategy.getName()} 保存失败`);
      // 尝试其他策略
      for (let i = 1; i < this.strategies.length; i++) {
        try {
          return await this.strategies[i].save(configMetadata, data);
        } catch (e) {
          console.warn(`[FallbackConfigStrategy] ⚠️ 策略 ${this.strategies[i].getName()} 保存失败`);
        }
      }
      throw error;
    }
  }
}