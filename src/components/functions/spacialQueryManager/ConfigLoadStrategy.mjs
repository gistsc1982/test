/**
 * 空间查询管理配置加载策略
 *
 * 提供 ConfigRegistry 用于动态注册配置定义到 DataManager。
 * SpacialQueryManager 主要从 LayerTreeManager 状态中发现 WFS 图层，
 * 但需要注册 configId 到 DataManager 以确保 JsonConfigPanelBase 能正常加载配置。
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
    console.log(`[SpacialQueryConfigRegistry] 📝 注册配置: ${configId}`);

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
      console.log(`[SpacialQueryConfigRegistry] ✅ 配置已注册到 DataManager: ${configId}`);
    } else {
      console.warn(`[SpacialQueryConfigRegistry] ⚠️ DataManager 未就绪，配置将在运行时注册: ${configId}`);
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
      console.warn('[SpacialQueryConfigRegistry] ⚠️ 无效的面板配置元数据');
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
      icon: panelMetadata.panelIcon || '🔍',
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
