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
    console.log(`[ConfigRegistry] 📝 注册配置: ${configId}`);
    
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
      console.log(`[ConfigRegistry] ✅ 配置已注册到 DataManager: ${configId}`);
    } else {
      console.warn(`[ConfigRegistry] ⚠️ DataManager 未就绪，配置将在运行时注册: ${configId}`);
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

  registerConfigs(configs) {
    configs.forEach(config => {
      if (config.id) {
        this.registerConfig(config.id, config);
      }
    });
  }

  registerFromMetadata(panelMetadata) {
    if (!panelMetadata || !panelMetadata.configId) {
      console.warn('[ConfigRegistry] ⚠️ 无效的面板配置元数据');
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
      icon: panelMetadata.panelIcon || '📋',
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

if (typeof window !== 'undefined') {
  window.__dataManagerReady__ = new Promise((resolve) => {
    const checkDataManager = () => {
      const dataManager = typeof window.__dataManager__ !== 'undefined' 
        ? window.__dataManager__ 
        : null;
      
      if (dataManager && dataManager.configDefinitions) {
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
        setTimeout(checkDataManager, 100);
      }
    };
    setTimeout(checkDataManager, 100);
  });
}

export class SQLiteConfigStrategy {
  constructor(tableName) {
    this._tableName = tableName;
    this.db = null;
  }

  getName() {
    return 'SQLiteConfigStrategy';
  }

  async _initDB() {
    if (this.db) return;

    return new Promise((resolve) => {
      if (typeof window === 'undefined') {
        resolve();
        return;
      }

      if (window.sqlitePlugin) {
        window.sqlitePlugin.openDatabase({
          name: 'config.db',
          location: 'default'
        }, (db) => {
          this.db = db;
          resolve();
        }, () => {
          this.db = { type: 'indexeddb' };
          resolve();
        });
      } else if (window.indexedDB) {
        this.db = { type: 'indexeddb' };
        resolve();
      } else {
        resolve();
      }
    });
  }

  async load() {
    console.log(`[SQLiteConfigStrategy] 从 SQLite 加载配置: ${this._tableName}`);
    
    try {
      await this._initDB();

      if (this.db?.type === 'indexeddb') {
        return await this._loadFromIndexedDB(this._tableName);
      }

      return new Promise((resolve) => {
        if (!this.db) {
          this._loadFromIndexedDB(this._tableName).then(resolve).catch(() => resolve([]));
          return;
        }

        this.db.transaction((tx) => {
          tx.executeSql(
            `SELECT * FROM ${this._tableName} ORDER BY id`,
            [],
            (tx, results) => {
              const data = [];
              for (let i = 0; i < results.rows.length; i++) {
                data.push(results.rows.item(i));
              }
              console.log(`[SQLiteConfigStrategy] ✅ 从 SQLite 加载成功: ${data.length} 条记录`);
              resolve(data);
            },
            () => {
              this._loadFromIndexedDB(this._tableName).then(resolve).catch(() => resolve([]));
            }
          );
        });
      });
    } catch (error) {
      console.error(`[SQLiteConfigStrategy] ❌ 从 SQLite 加载失败:`, error);
      return await this._loadFromIndexedDB(this._tableName);
    }
  }

  async _loadFromIndexedDB(storeName) {
    return new Promise((resolve) => {
      const request = indexedDB.open('configDB', 1);

      request.onerror = () => {
        console.error('[SQLiteConfigStrategy] ❌ IndexedDB 打开失败');
        resolve([]);
      };

      request.onsuccess = (event) => {
        const db = event.target.result;
        const transaction = db.transaction([storeName], 'readonly');
        const store = transaction.objectStore(storeName);
        const getAllRequest = store.getAll();

        getAllRequest.onsuccess = () => {
          console.log(`[SQLiteConfigStrategy] ✅ 从 IndexedDB 加载成功: ${getAllRequest.result.length} 条记录`);
          resolve(getAllRequest.result);
          db.close();
        };

        getAllRequest.onerror = () => {
          console.error('[SQLiteConfigStrategy] ❌ 从 IndexedDB 加载失败');
          resolve([]);
          db.close();
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

  /**
   * 创建 SQLite 表
   * @param {string} tableName - 表名
   * @param {Array} fieldDefinitions - 字段定义
   * @returns {Promise<void>}
   */
  createTable(tableName, fieldDefinitions) {
    return new Promise((resolve, reject) => {
      if (!this.db || this.db.type === 'indexeddb') {
        resolve();
        return;
      }

      let fields;
      if (!fieldDefinitions || !Array.isArray(fieldDefinitions) || fieldDefinitions.length === 0) {
        fields = `id TEXT PRIMARY KEY, name TEXT, description TEXT`;
      } else {
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
   * 保存配置到 SQLite
   * @param {Object} configMetadata - 配置元数据
   * @param {Array} data - 要保存的数据
   * @returns {Promise<boolean>}
   */
  async save(configMetadata, data) {
    console.log(`[SQLiteConfigStrategy] 💾 保存到 SQLite: ${this._tableName}`);

    try {
      await this._initDB();

      const tableName = configMetadata?.dataSource?.tableName || this._tableName;
      const primaryKey = configMetadata?.dataSource?.primaryKey || 'id';

      if (!this.db || this.db.type === 'indexeddb') {
        return await this._saveToIndexedDB(tableName, data);
      }

      // 保存前先确保表存在
      await this.createTable(tableName, configMetadata?.fieldDefinitions);

      return new Promise((resolve, reject) => {
        this.db.transaction((tx) => {
          // 先清空表
          tx.executeSql(`DELETE FROM ${tableName}`, [], () => {
            if (data.length === 0) {
              console.log(`[SQLiteConfigStrategy] ✅ 保存成功（空数据）`);
              resolve(true);
              return;
            }

            let completed = 0;
            const total = data.length;
            data.forEach((item) => {
              const cleanItem = { ...item };
              delete cleanItem.loaded;
              delete cleanItem.loading;

              const keys = Object.keys(cleanItem);
              const placeholders = keys.map(() => '?').join(',');
              const values = keys.map(k => {
                const v = cleanItem[k];
                // 对象类型转为 JSON 字符串
                return typeof v === 'object' ? JSON.stringify(v) : v;
              });

              tx.executeSql(
                `INSERT INTO ${tableName} (${keys.join(',')}) VALUES (${placeholders})`,
                values,
                () => {
                  completed++;
                  if (completed === total) {
                    console.log(`[SQLiteConfigStrategy] ✅ 保存成功，共 ${total} 条`);
                    resolve(true);
                  }
                },
                (tx, error) => {
                  console.error(`[SQLiteConfigStrategy] ❌ 插入失败:`, error);
                  reject(error);
                }
              );
            });
          }, (tx, error) => {
            // DELETE 失败，可能表不存在，先创建再重试
            this.createTable(tableName, configMetadata?.fieldDefinitions).then(() => {
              if (data.length === 0) {
                resolve(true);
                return;
              }
              let completed = 0;
              const total = data.length;
              data.forEach((item) => {
                const cleanItem = { ...item };
                delete cleanItem.loaded;
                delete cleanItem.loading;
                const keys = Object.keys(cleanItem);
                const placeholders = keys.map(() => '?').join(',');
                const values = keys.map(k => {
                  const v = cleanItem[k];
                  return typeof v === 'object' ? JSON.stringify(v) : v;
                });
                tx.executeSql(
                  `INSERT INTO ${tableName} (${keys.join(',')}) VALUES (${placeholders})`,
                  values,
                  () => { completed++; if (completed === total) { console.log(`[SQLiteConfigStrategy] ✅ 保存成功，共 ${total} 条`); resolve(true); } },
                  (tx2, err2) => { console.error(`[SQLiteConfigStrategy] ❌ 插入失败:`, err2); reject(err2); }
                );
              });
            }).catch(reject);
          });
        });
      });
    } catch (error) {
      console.warn(`[SQLiteConfigStrategy] ⚠️ 保存失败:`, error);
      // 回退到 IndexedDB
      return await this._saveToIndexedDB(configMetadata?.dataSource?.tableName || this._tableName, data);
    }
  }

  /**
   * 保存数据到 IndexedDB
   * @param {string} storeName - 存储名称
   * @param {Array} data - 要保存的数据
   * @returns {Promise<boolean>}
   */
  async _saveToIndexedDB(storeName, data) {
    return new Promise((resolve) => {
      const request = indexedDB.open('configDB', 1);

      request.onerror = (err) => {
        console.warn('[SQLiteConfigStrategy] ⚠️ IndexedDB 打开失败:', err?.target?.error?.message || err?.type || '未知错误',
          '(数据库:', 'configDB', '版本:', 1, ')');
        resolve(false);
      };

      request.onsuccess = (event) => {
        const db = event.target.result;
        // 兜底：store 不存在时升级版本创建（onupgradeneeded 只在版本变化时触发）
        if (!db.objectStoreNames.contains(storeName)) {
          db.close();
          const upgradeRequest = indexedDB.open('configDB', db.version + 1);
          upgradeRequest.onupgradeneeded = (e) => {
            if (!e.target.result.objectStoreNames.contains(storeName)) {
              e.target.result.createObjectStore(storeName, { keyPath: 'id' });
            }
          };
          upgradeRequest.onsuccess = (e2) => {
            const newDb = e2.target.result;
            // 递归重试保存
            const innerSave = (db2) => {
              const txn = db2.transaction([storeName], 'readwrite');
              const st = txn.objectStore(storeName);
              st.clear().onsuccess = () => {
                if (data.length === 0) { resolve(true); db2.close(); return; }
                let done = 0;
                data.forEach(item => {
                  const clean = { ...item }; delete clean.loaded; delete clean.loading;
                  st.put(clean).onsuccess = () => { done++; if (done === data.length) { resolve(true); db2.close(); } };
                });
              };
            };
            innerSave(newDb);
          };
          upgradeRequest.onerror = (e) => {
            console.warn('[SQLiteConfigStrategy] ⚠️ 版本升级后 IndexedDB 打开失败:', e?.target?.error?.message || '未知错误');
            resolve(false);
          };
          return;
        }
        const transaction = db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);

        store.clear().onsuccess = () => {
          if (data.length === 0) {
            console.log('[SQLiteConfigStrategy] ✅ IndexedDB 保存成功（空数据）');
            resolve(true);
            db.close();
            return;
          }

          let completed = 0;
          const total = data.length;
          data.forEach((item) => {
            const cleanItem = { ...item };
            delete cleanItem.loaded;
            delete cleanItem.loading;
            const putRequest = store.put(cleanItem);

            putRequest.onsuccess = () => {
              completed++;
              if (completed === total) {
                console.log(`[SQLiteConfigStrategy] ✅ IndexedDB 保存成功，共 ${total} 条`);
                resolve(true);
                db.close();
              }
            };
            putRequest.onerror = () => {
              console.warn('[SQLiteConfigStrategy] ⚠️ IndexedDB put 失败');
              resolve(false);
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

export class JSONFileConfigStrategy {
  constructor(configName) {
    this._configName = configName;
    this._basePath = '/data/gis';
  }

  getName() {
    return 'JSONFileConfigStrategy';
  }

  async load() {
    const url = `${this._basePath}/${this._configName}/${this._configName}.json`;
    console.log(`[JSONFileConfigStrategy] 从 JSON 文件加载配置: ${url}`);
    
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      console.log(`[JSONFileConfigStrategy] ✅ 从 JSON 文件加载成功: ${data.length} 条记录`);
      return data;
    } catch (error) {
      console.error(`[JSONFileConfigStrategy] ❌ 从 JSON 文件加载失败:`, error);
      return [];
    }
  }
}

export class FallbackConfigStrategy {
  constructor(strategies) {
    this._strategies = strategies;
  }

  getName() {
    return 'FallbackConfigStrategy';
  }

  async load() {
    console.log(`[FallbackConfigStrategy] 开始加载配置，策略链: ${this._strategies.map(s => s.getName()).join(' -> ')}`);

    for (const strategy of this._strategies) {
      try {
        const result = await strategy.load();
        if (result && result.length > 0) {
          console.log(`[FallbackConfigStrategy] ✅ 使用策略: ${strategy.getName()}`);
          return result;
        }
      } catch (error) {
        console.log(`[FallbackConfigStrategy] ⚠️ 策略 ${strategy.getName()} 失败，尝试下一个`);
      }
    }

    console.log('[FallbackConfigStrategy] ⚠️ 所有策略都失败，返回空数组');
    return [];
  }

  /**
   * 保存配置（带回退机制）
   * @param {Object} configMetadata - 配置元数据
   * @param {Array} data - 要保存的数据
   * @returns {Promise<boolean>}
   */
  async save(configMetadata, data) {
    console.log(`[FallbackConfigStrategy] 💾 保存配置，策略链: ${this._strategies.map(s => s.getName()).join(' -> ')}`);

    for (const strategy of this._strategies) {
      try {
        if (typeof strategy.save === 'function') {
          const success = await strategy.save(configMetadata, data);
          if (success) {
            console.log(`[FallbackConfigStrategy] ✅ 保存成功，使用策略: ${strategy.getName()}`);
            return true;
          }
        }
      } catch (error) {
        console.warn(`[FallbackConfigStrategy] ⚠️ 策略 ${strategy.getName()} 保存失败:`, error.message);
      }
    }

    console.warn('[FallbackConfigStrategy] ⚠️ 所有策略保存失败（不影响当前会话，下次加载将回退到 JSON 文件）');
    return false;
  }
}

export class ConfigStrategyFactory {
  createSQLiteStrategy(tableName) {
    return new SQLiteConfigStrategy(tableName);
  }

  createJSONFileStrategy(configName) {
    return new JSONFileConfigStrategy(configName);
  }

  createFallbackStrategy(strategies) {
    return new FallbackConfigStrategy(strategies);
  }
}