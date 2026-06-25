/**
 * Express API 服务器
 *
 * 为前端提供配置文件的读写 API
 * 使用 SQLite 数据库存储，定期同步到文件系统
 *
 * 功能：
 * - GET  /api/data/:path        - 读取 JSON 文件
 * - POST /api/data/:path        - 写入 JSON 到数据库
 * - GET  /api/configs           - 列出所有配置
 * - GET  /api/sync              - 手动触发同步
 * - GET  /api/health            - 健康检查
 *
 * 部署：
 * 1. 安装依赖：npm install express cors better-sqlite3
 * 2. 配置环境变量或在 server 目录创建 .env 文件
 * 3. 启动服务：npm start 或 npm run start:custom
 * 4. 默认端口：8081
 *
 * @requires
 * npm install express cors better-sqlite3
 */

const express = require('express');
const cors = require('cors');
const path = require('path');

// ==================== 配置 ====================

const CONFIG = {
  // API 服务器端口 - 从环境变量获取，默认 8081
  PORT: process.env.VUE_APP_API_PORT || 8081,

  // 服务器基础 URL - 用于 CORS 和日志
  SERVER_BASE_URL: process.env.VUE_APP_SERVER_BASE_URL || 'http://localhost:8080',

  DB_PATH: path.join(__dirname, 'data', 'configs.db'),

  DATA_DIR: path.join(__dirname, '..', 'public', 'data'),

  CORS: {
    origin: process.env.VUE_APP_SERVER_BASE_URL || '*',
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type']
  },

  DIRECTORY_BROWSING: true
};
const DatabaseManager = require('./sqlite-db-manager');

// ==================== Express 应用 ====================

const app = express();

app.use(cors(CONFIG.CORS));

app.use(express.json({ limit: '10mb' }));

app.use((req, res, next) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  next();
});

const serveIndex = require('serve-index');
const serveStatic = express.static(CONFIG.DATA_DIR, {
  index: false,
  setHeaders: (res, path) => {
    if (path.endsWith('.json')) {
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
    }
  }
});

app.use('/data', serveStatic);
app.use('/data', serveIndex(CONFIG.DATA_DIR, {
  icons: true,
  view: 'listing',
  filter: (filename, index) => {
    return true;
  }
}));

// ==================== 数据库管理器 ====================

let dbManager = null;

async function initDatabase() {
  try {
    dbManager = new DatabaseManager(CONFIG.DB_PATH, {
      dataDir: CONFIG.DATA_DIR,
      autoSync: true,
      syncInterval: 10000
    });

    await dbManager.init();
    console.log('✅ 数据库已就绪');

    console.log('📥 检查文件系统中的配置变更...');
    try {
      const syncResult = await dbManager.smartSyncFromFilesystem();

      if (syncResult.imported.length > 0) {
        console.log(`✅ 新导入 ${syncResult.imported.length} 个配置:`);
        syncResult.imported.forEach(item => {
          console.log(`   - ${item.path} → ${item.tableName}`);
        });
      }

      if (syncResult.updated.length > 0) {
        console.log(`🔄 已更新 ${syncResult.updated.length} 个已修改配置:`);
        syncResult.updated.forEach(item => {
          console.log(`   - ${item.path} → ${item.tableName} (${item.action})`);
        });
      }

      if (syncResult.imported.length === 0 && syncResult.updated.length === 0) {
        console.log('ℹ️ 所有配置均为最新，无需同步');
      }

      if (syncResult.skipped.length > 0) {
        console.log(`⏭️ 跳过 ${syncResult.skipped.length} 个配置（已是最新或不符合规范）`);
      }
    } catch (syncError) {
      console.error('⚠️ 智能同步出现问题:', syncError.message);
    }

    console.log('🚀 API 服务器准备就绪');
  } catch (error) {
    console.error('❌ 数据库初始化失败:', error);
    process.exit(1);
  }
}

// ==================== API 路由 ====================

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'API 服务器运行正常',
    timestamp: new Date().toISOString(),
    database: dbManager ? 'connected' : 'disconnected'
  });
});

app.get('/api/data/*', (req, res) => {
  try {
    const relativePath = req.params[0];

    const cleanPath = relativePath.replace(/\.\./g, '');

    const data = dbManager.loadConfig(cleanPath);

    if (data !== null) {
      return res.json({
        success: true,
        source: 'database',
        data: data
      });
    }

    const fs = require('fs');
    const filePath = path.join(CONFIG.DATA_DIR, cleanPath);

    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const fileData = JSON.parse(content);

      res.json({
        success: true,
        source: 'filesystem',
        data: fileData
      });
    } catch (readError) {
      res.status(404).json({
        success: false,
        error: '配置文件不存在'
      });
    }
  } catch (error) {
    console.error('读取配置失败:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.post('/api/data/*', (req, res) => {
  try {
    const relativePath = req.params[0];

    const cleanPath = relativePath.replace(/\.\./g, '');

    if (!cleanPath.endsWith('.json')) {
      return res.status(400).json({
        success: false,
        error: '只允许 .json 文件'
      });
    }

    const { data } = req.body;

    if (data === undefined || data === null) {
      return res.status(400).json({
        success: false,
        error: '缺少数据字段'
      });
    }

    const result = dbManager.saveConfig(cleanPath, data);

    if (result.success) {
      res.json({
        success: true,
        message: '配置已保存',
        ...result
      });
    } else {
      res.status(500).json(result);
    }
  } catch (error) {
    console.error('写入配置失败:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.get('/api/configs', (req, res) => {
  try {
    const configs = dbManager.listConfigs();

    res.json({
      success: true,
      data: configs
    });
  } catch (error) {
    console.error('列出配置失败:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.post('/api/sync', async (req, res) => {
  try {
    const { direction = 'to-file' } = req.body;

    let result;

    if (direction === 'to-file') {
      result = await dbManager.syncToFilesystem();
    } else if (direction === 'from-file') {
      result = await dbManager.syncFromFilesystem();
    } else {
      return res.status(400).json({
        success: false,
        error: '无效的同步方向'
      });
    }

    res.json({
      success: true,
      message: '同步完成',
      result: result
    });
  } catch (error) {
    console.error('同步失败:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.get('/api/stats', (req, res) => {
  try {
    const stats = dbManager.getStats();

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('获取统计失败:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ==================== 错误处理 ====================

app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'API 不存在'
  });
});

app.use((err, req, res, next) => {
  console.error('服务器错误:', err);
  res.status(500).json({
    success: false,
    error: '服务器内部错误'
  });
});

// ==================== 启动服务器 ====================

async function startServer() {
  try {
    await initDatabase();

    app.listen(CONFIG.PORT, () => {
      console.log('====================================');
      console.log('🚀 API 服务器已启动');
      console.log('====================================');
      console.log(`📡 端口: ${CONFIG.PORT}`);
      console.log(`🌐 http://localhost:${CONFIG.PORT}`);
      console.log(`📁 数据目录: ${CONFIG.DATA_DIR}`);
      console.log(`💾 数据库: ${CONFIG.DB_PATH}`);
      console.log('');
      console.log('📝 API 端点:');
      console.log(`   GET  /api/data/:path       - 读取配置`);
      console.log(`   POST /api/data/:path       - 写入配置`);
      console.log(`   GET  /api/configs          - 配置列表`);
      console.log(`   POST /api/sync             - 手动同步`);
      console.log(`   GET  /api/stats            - 统计信息`);
      console.log(`   GET  /api/health           - 健康检查`);
      console.log('====================================');
    });
  } catch (error) {
    console.error('启动失败:', error);
    process.exit(1);
  }
}

startServer();

process.on('SIGINT', async () => {
  console.log('\n👋 服务器正在关闭...');

  if (dbManager) {
    dbManager.close();
  }

  process.exit(0);
});

module.exports = app;