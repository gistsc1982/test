/**
 * SQLite 表名验证与生成工具
 * 
 * SQLite 表名命名规则：
 * 1. 只能包含字母（A-Z, a-z）、数字（0-9）和下划线（_）
 * 2. 不能以数字开头
 * 3. 不能使用 SQLite 保留关键字
 * 4. 表名不区分大小写（内部统一转换为小写）
 * 5. 最大长度通常为 128 字符
 * 
 * 参考：https://www.sqlite.org/lang_keywords.html
 */

/**
 * SQLite 保留关键字列表（SQLite 3.45.0）
 * 这些关键字不能直接作为表名使用，除非用引号括起来
 */
const SQLITE_RESERVED_KEYWORDS = [
  'ABORT', 'ACTION', 'ADD', 'AFTER', 'ALL', 'ALTER', 'AND', 'AS', 'ASC',
  'ATTACH', 'AUTOINCREMENT', 'BEFORE', 'BEGIN', 'BETWEEN', 'BY', 'CASCADE',
  'CASE', 'CAST', 'CHECK', 'COLLATE', 'COLUMN', 'COMMIT', 'CONFLICT', 'CONSTRAINT',
  'CREATE', 'CROSS', 'CURRENT_DATE', 'CURRENT_TIME', 'CURRENT_TIMESTAMP', 'DATABASE',
  'DEFAULT', 'DEFERRABLE', 'DELETE', 'DESC', 'DETACH', 'DISTINCT', 'DROP', 'ELSE',
  'END', 'ESCAPE', 'EXCEPT', 'EXCLUDE', 'EXISTS', 'EXPLAIN', 'FALSE', 'FILTER',
  'FIRST', 'FOLLOWING', 'FOR', 'FOREIGN', 'FROM', 'FULL', 'GLOB', 'GROUP', 'HAVING',
  'IF', 'IGNORE', 'IMMEDIATE', 'IN', 'INDEX', 'INITIALLY', 'INNER', 'INSERT', 'INSTEAD',
  'INTERSECT', 'INTO', 'IS', 'ISNULL', 'JOIN', 'KEY', 'LAST', 'LEFT', 'LIKE', 'LIMIT',
  'MATCH', 'NATURAL', 'NO', 'NOT', 'NOTNULL', 'NULL', 'OF', 'OFFSET', 'ON', 'OR',
  'ORDER', 'OUTER', 'OVER', 'PARTITION', 'PLAN', 'PRIMARY', 'QUERY', 'RAISE', 'RANGE',
  'RECURSIVE', 'REFERENCES', 'REGEXP', 'REINDEX', 'RELEASE', 'RENAME', 'REPLACE',
  'RESTRICT', 'RETURNING', 'RIGHT', 'ROLLBACK', 'ROW', 'SAVEPOINT', 'SELECT', 'SET',
  'TABLE', 'TEMP', 'TEMPORARY', 'THEN', 'TO', 'TRANSACTION', 'TRIGGER', 'TRUE',
  'UNION', 'UNIQUE', 'UPDATE', 'USING', 'VACUUM', 'VALUES', 'VIEW', 'VIRTUAL', 'WHEN',
  'WHERE', 'WINDOW', 'WITH'
];

/**
 * 检查字符串是否是有效的 SQLite 表名
 * @param {string} tableName - 要检查的表名
 * @returns {Object} - 检查结果
 * @returns {boolean} result.valid - 是否有效
 * @returns {string} result.message - 验证消息
 * @returns {string|null} result.suggestion - 建议的有效表名（如果无效）
 */
export function validateTableName(tableName) {
  // 1. 检查是否为空
  if (!tableName || typeof tableName !== 'string') {
    return {
      valid: false,
      message: '表名不能为空且必须是字符串',
      suggestion: null
    };
  }

  const trimmedName = tableName.trim();
  
  // 2. 检查长度
  if (trimmedName.length === 0) {
    return {
      valid: false,
      message: '表名不能为空',
      suggestion: null
    };
  }

  if (trimmedName.length > 128) {
    return {
      valid: false,
      message: `表名长度不能超过 128 字符（当前 ${trimmedName.length} 字符）`,
      suggestion: trimmedName.substring(0, 128)
    };
  }

  // 3. 检查是否以数字开头
  if (/^\d/.test(trimmedName)) {
    return {
      valid: false,
      message: '表名不能以数字开头',
      suggestion: `tbl_${trimmedName}`
    };
  }

  // 4. 检查是否包含非法字符
  // 只允许字母、数字和下划线
  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(trimmedName)) {
    const cleanedName = trimmedName.replace(/[^a-zA-Z0-9_]/g, '_');
    const finalName = /^\d/.test(cleanedName) ? `tbl_${cleanedName}` : cleanedName;
    return {
      valid: false,
      message: `表名包含非法字符，只允许字母、数字和下划线`,
      suggestion: finalName
    };
  }

  // 5. 检查是否是保留关键字
  const upperName = trimmedName.toUpperCase();
  if (SQLITE_RESERVED_KEYWORDS.includes(upperName)) {
    return {
      valid: false,
      message: `'${trimmedName}' 是 SQLite 保留关键字，不能直接作为表名`,
      suggestion: `${trimmedName}_tbl`
    };
  }

  // 6. 检查是否以下划线开头（虽然允许，但不推荐）
  if (/^_/.test(trimmedName)) {
    return {
      valid: true,
      message: '表名有效，但不建议以下划线开头',
      suggestion: null
    };
  }

  return {
    valid: true,
    message: '表名有效',
    suggestion: null
  };
}

/**
 * 生成符合 SQLite 规则的表名
 * @param {string} name - 原始名称
 * @param {Object} options - 选项
 * @param {boolean} options.forceLowercase - 是否强制转换为小写（默认 true）
 * @param {boolean} options.replaceSpaces - 是否替换空格（默认 true）
 * @param {string} options.prefix - 前缀（默认空）
 * @param {string} options.suffix - 后缀（默认空）
 * @returns {string} - 符合规则的表名
 */
export function generateValidTableName(name, options = {}) {
  const {
    forceLowercase = true,
    replaceSpaces = true,
    prefix = '',
    suffix = ''
  } = options;

  let result = name;

  // 1. 转换为小写
  if (forceLowercase) {
    result = result.toLowerCase();
  }

  // 2. 替换空格
  if (replaceSpaces) {
    result = result.replace(/\s+/g, '_');
  }

  // 3. 替换非法字符（只保留字母、数字和下划线）
  result = result.replace(/[^a-zA-Z0-9_]/g, '_');

  // 4. 如果以数字开头，添加前缀
  if (/^\d/.test(result)) {
    result = `tbl_${result}`;
  }

  // 5. 如果以下划线开头且有前缀，调整顺序
  if (/^_/.test(result) && prefix) {
    result = `${prefix}${result}`;
  } else if (prefix) {
    result = `${prefix}_${result}`;
  }

  // 6. 添加后缀
  if (suffix) {
    result = `${result}_${suffix}`;
  }

  // 7. 检查是否是保留关键字
  const upperResult = result.toUpperCase();
  if (SQLITE_RESERVED_KEYWORDS.includes(upperResult)) {
    result = `${result}_tbl`;
  }

  // 8. 限制长度
  const maxLength = 128;
  if (result.length > maxLength) {
    result = result.substring(0, maxLength);
  }

  // 9. 移除连续的下划线
  result = result.replace(/_+/g, '_');

  // 10. 移除首尾下划线
  result = result.replace(/^_|_$/g, '');

  // 11. 如果结果为空，使用默认表名
  if (!result) {
    result = 'default_table';
  }

  return result;
}

/**
 * 安全地获取表名（如果原始表名无效，返回建议的表名）
 * @param {string} tableName - 原始表名
 * @returns {Object}
 * @returns {string} result.tableName - 最终使用的表名
 * @returns {boolean} result.wasModified - 是否被修改过
 * @returns {string} result.reason - 修改原因（如果被修改）
 */
export function getSafeTableName(tableName) {
  const validation = validateTableName(tableName);
  
  if (validation.valid) {
    return {
      tableName: tableName.trim(),
      wasModified: false,
      reason: null
    };
  }

  if (validation.suggestion) {
    return {
      tableName: validation.suggestion,
      wasModified: true,
      reason: validation.message
    };
  }

  // 如果没有建议，生成一个安全的表名
  const generated = generateValidTableName(tableName || 'oblique_photography');
  return {
    tableName: generated,
    wasModified: true,
    reason: validation.message || '表名无效，已自动生成安全表名'
  };
}

/**
 * 验证配置元数据中的表名配置
 * @param {Object} configMetadata - 配置元数据
 * @returns {Object}
 * @returns {boolean} result.valid - 配置是否有效
 * @returns {string[]} result.errors - 错误列表
 * @returns {string[]} result.warnings - 警告列表
 * @returns {Object} result.safeConfig - 安全的配置对象
 */
export function validateConfigMetadata(configMetadata) {
  const errors = [];
  const warnings = [];
  const safeConfig = { ...configMetadata };

  // 检查配置元数据是否存在
  if (!configMetadata) {
    errors.push('配置元数据不能为空');
    return { valid: false, errors, warnings, safeConfig: null };
  }

  // 检查 panelId
  if (!configMetadata.panelId) {
    errors.push('panelId 不能为空');
  } else if (configMetadata.panelId.length > 64) {
    errors.push(`panelId 长度不能超过 64 字符`);
  }

  // 检查 panelName
  if (!configMetadata.panelName) {
    warnings.push('panelName 为空，建议设置');
  }

  // 检查表名配置
  if (configMetadata.dataSource) {
    const { tableName, primaryKey } = configMetadata.dataSource;

    // 检查表名
    if (!tableName) {
      errors.push('dataSource.tableName 不能为空');
    } else {
      const tableValidation = validateTableName(tableName);
      if (!tableValidation.valid) {
        errors.push(`表名 '${tableName}' 无效: ${tableValidation.message}`);
        
        if (tableValidation.suggestion) {
          warnings.push(`建议使用表名: '${tableValidation.suggestion}'`);
          safeConfig.dataSource = {
            ...safeConfig.dataSource,
            tableName: tableValidation.suggestion
          };
        }
      }
    }

    // 检查主键
    if (!primaryKey) {
      warnings.push('dataSource.primaryKey 为空，将使用默认值 "id"');
      if (!safeConfig.dataSource.primaryKey) {
        safeConfig.dataSource.primaryKey = 'id';
      }
    } else {
      // 主键也需要验证
      const pkValidation = validateTableName(primaryKey);
      if (!pkValidation.valid) {
        errors.push(`主键 '${primaryKey}' 无效: ${pkValidation.message}`);
      }
    }

    // 检查数据源类型
    const validTypes = ['sqlite', 'json', 'api'];
    if (!configMetadata.dataSource.type || !validTypes.includes(configMetadata.dataSource.type)) {
      warnings.push(`dataSource.type 无效或未设置，将使用默认值 "sqlite"`);
      safeConfig.dataSource.type = 'sqlite';
    }
  } else {
    errors.push('dataSource 配置不能为空');
  }

  // 检查字段定义
  if (!configMetadata.fieldDefinitions || !Array.isArray(configMetadata.fieldDefinitions)) {
    errors.push('fieldDefinitions 必须是数组');
  } else {
    configMetadata.fieldDefinitions.forEach((field, index) => {
      if (!field.key) {
        errors.push(`fieldDefinitions[${index}].key 不能为空`);
      } else {
        // 字段名也需要符合 SQLite 规则
        const fieldValidation = validateTableName(field.key);
        if (!fieldValidation.valid) {
          warnings.push(`字段名 '${field.key}' 可能在 SQLite 中引起问题: ${fieldValidation.message}`);
        }
      }
    });
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    safeConfig
  };
}

/**
 * 格式化验证结果为可读消息
 * @param {Object} validationResult - 验证结果
 * @param {boolean} includeWarnings - 是否包含警告
 * @returns {string} - 格式化的消息
 */
export function formatValidationResult(validationResult, includeWarnings = true) {
  const parts = [];

  if (validationResult.errors && validationResult.errors.length > 0) {
    parts.push(`❌ 错误 (${validationResult.errors.length}):`);
    validationResult.errors.forEach((error, index) => {
      parts.push(`  ${index + 1}. ${error}`);
    });
  }

  if (includeWarnings && validationResult.warnings && validationResult.warnings.length > 0) {
    parts.push(`⚠️ 警告 (${validationResult.warnings.length}):`);
    validationResult.warnings.forEach((warning, index) => {
      parts.push(`  ${index + 1}. ${warning}`);
    });
  }

  if (parts.length === 0) {
    return '✅ 验证通过';
  }

  return parts.join('\n');
}