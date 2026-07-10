/**
 * 配置注册器 - 用于动态注册配置定义到 DataManager
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
    console.log(`[MapGuide ConfigRegistry] 📝 注册配置: ${configId}`);
    this.registeredConfigs.set(configId, { id: configId, ...configDefinition });

    const dataManager = this.getDataManager();
    if (dataManager && dataManager.configDefinitions) {
      dataManager.configDefinitions.set(configId, { id: configId, ...configDefinition });
      console.log(`[MapGuide ConfigRegistry] ✅ 配置已注册到 DataManager: ${configId}`);
    } else {
      if (typeof window !== 'undefined') {
        if (!window.__pendingConfigDefinitions__) {
          window.__pendingConfigDefinitions__ = new Map();
        }
        window.__pendingConfigDefinitions__.set(configId, { id: configId, ...configDefinition });
      }
    }
  }

  registerFromMetadata(panelMetadata) {
    if (!panelMetadata || !panelMetadata.configId) return;

    const configId = panelMetadata.configId;
    let relativePath = panelMetadata.dataSource?.relativePath;
    if (!relativePath) {
      const folderName = panelMetadata.featureFolder
        || panelMetadata.dataSource?.folderName
        || panelMetadata.panelId.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('');
      const fileName = (panelMetadata.dataSource?.fileName || panelMetadata.configId) + '.json';
      relativePath = `${folderName}/${fileName}`;
    }

    this.registerConfig(configId, {
      id: configId,
      name: panelMetadata.panelName || configId,
      fileName: panelMetadata.dataSource?.fileName || `${configId}.json`,
      relativePath: relativePath,
      description: panelMetadata.panelName || configId,
      icon: panelMetadata.panelIcon || '🚗',
      category: 'gis'
    });
  }
}

export const configRegistry = new ConfigRegistry();

if (typeof window !== 'undefined') {
  const checkDataManager = () => {
    const dataManager = window.__dataManager__;
    if (dataManager?.configDefinitions && window.__pendingConfigDefinitions__) {
      window.__pendingConfigDefinitions__.forEach((config, configId) => {
        if (!dataManager.configDefinitions.has(configId)) {
          dataManager.configDefinitions.set(configId, config);
        }
      });
    }
  };
  setTimeout(checkDataManager, 200);
}

// ===================== 配置加载策略 =====================

export class JSONFileConfigStrategy {
  constructor(featureFolder, fileName) {
    this._featureFolder = featureFolder;
    this._fileName = fileName || featureFolder;
  }

  getName() { return 'JSONFileConfigStrategy'; }

  async load() {
    const url = `/data/gis/${this._featureFolder}/${this._fileName}.json`;
    console.log(`[MapGuide JSONStrategy] 📡 加载: ${url}`);
    try {
      const resp = await fetch(url, { cache: 'no-cache' });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const data = await resp.json();
      console.log(`[MapGuide JSONStrategy] ✅ 加载成功: ${data.length} 条`);
      return data;
    } catch (e) {
      console.warn(`[MapGuide JSONStrategy] ⚠️ 加载失败:`, e.message);
      return [];
    }
  }

  async save(configMetadata, data) {
    console.log(`[MapGuide JSONStrategy] 💾 数据已准备保存（${data.length} 条）`);
    return true;
  }
}

export class SQLiteConfigStrategy {
  constructor(tableName) { this._tableName = tableName; this.db = null; }
  getName() { return 'SQLiteConfigStrategy'; }

  async _initDB() {
    if (this.db) return;
    return new Promise((resolve) => {
      if (typeof window === 'undefined') { resolve(); return; }
      if (window.indexedDB) { this.db = { type: 'indexeddb' }; resolve(); }
      else resolve();
    });
  }

  async load() {
    await this._initDB();
    return this._loadFromIndexedDB(this._tableName);
  }

  _loadFromIndexedDB(storeName) {
    return new Promise((resolve) => {
      const req = indexedDB.open('configDB');
      req.onerror = () => resolve([]);
      req.onsuccess = (ev) => {
        const db = ev.target.result;
        try {
          const tx = db.transaction([storeName], 'readonly');
          const store = tx.objectStore(storeName);
          const getAll = store.getAll();
          getAll.onsuccess = () => { resolve(getAll.result); db.close(); };
          getAll.onerror = () => { resolve([]); db.close(); };
        } catch (e) { resolve([]); db.close(); }
      };
      req.onupgradeneeded = (ev) => {
        const db = ev.target.result;
        if (!db.objectStoreNames.contains(storeName)) {
          db.createObjectStore(storeName, { keyPath: 'id' });
        }
      };
    });
  }

  async save(configMetadata, data) {
    await this._initDB();
    const storeName = configMetadata?.dataSource?.tableName || this._tableName;
    return new Promise((resolve) => {
      const req = indexedDB.open('configDB');
      req.onsuccess = (ev) => {
        const db = ev.target.result;
        const tx = db.transaction([storeName], 'readwrite');
        const store = tx.objectStore(storeName);
        store.clear().onsuccess = () => {
          if (!data.length) { resolve(true); db.close(); return; }
          let done = 0;
          data.forEach(item => {
            const clean = JSON.parse(JSON.stringify(item, function (k, v) {
              if (k === 'loaded' || k === 'loading' || k === 'children') return undefined;
              if (v === undefined || typeof v === 'function' || typeof v === 'symbol') return undefined;
              return v;
            }));
            const putReq = store.put(clean);
            putReq.onsuccess = () => { if (++done === data.length) { resolve(true); db.close(); } };
            putReq.onerror = () => { resolve(false); db.close(); };
          });
        };
      };
      req.onupgradeneeded = (ev) => {
        const db = ev.target.result;
        if (!db.objectStoreNames.contains(storeName)) {
          db.createObjectStore(storeName, { keyPath: 'id' });
        }
      };
      req.onerror = () => resolve(false);
    });
  }
}

export class FallbackConfigStrategy {
  constructor(strategies) { this._strategies = strategies; }
  getName() { return 'FallbackConfigStrategy'; }

  async load() {
    for (const s of this._strategies) {
      try {
        const result = await s.load();
        if (result?.length > 0) return result;
      } catch (e) { /* 继续下一个 */ }
    }
    return [];
  }

  async save(configMetadata, data) {
    for (const s of this._strategies) {
      try {
        if (typeof s.save === 'function' && await s.save(configMetadata, data)) return true;
      } catch (e) { /* 继续 */ }
    }
    return false;
  }
}

export class ConfigStrategyFactory {
  static createJSONFileStrategy(featureFolder, fileName) {
    return new JSONFileConfigStrategy(featureFolder, fileName);
  }
  static createSQLiteStrategy(tableName) {
    return new SQLiteConfigStrategy(tableName);
  }
  static createWithFallback(types, featureFolder, fileName, tableName) {
    const strategies = [];
    if (types.includes('sqlite')) strategies.push(new SQLiteConfigStrategy(tableName));
    if (types.includes('json') || types.includes('file')) strategies.push(new JSONFileConfigStrategy(featureFolder, fileName));
    return new FallbackConfigStrategy(strategies);
  }
}