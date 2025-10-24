# 文档索引

## 📖 文档分类

### 🚀 快速开始

| 文档 | 用途 | 阅读时间 |
|------|------|---------|
| [README_SYNC.md](README_SYNC.md) | 快速参考和日常使用 | 5 分钟 |
| [SETUP_GUIDE.md](SETUP_GUIDE.md) | 完整配置指南（从零开始） | 15 分钟 |

### 🔧 配置和管理

| 文档 | 用途 |
|------|------|
| [SYNC_SETUP_SUMMARY.md](SYNC_SETUP_SUMMARY.md) | 配置总结和常用命令 |
| [EDGE_FUNCTION_SETUP.md](EDGE_FUNCTION_SETUP.md) | Edge Function 详细说明 |
| [supabase/VAULT_SETUP.md](supabase/VAULT_SETUP.md) | Vault 密钥管理详解 |
| [supabase/CRON_FREQUENCY_GUIDE.md](supabase/CRON_FREQUENCY_GUIDE.md) | 定时任务频率配置 |

### 🔍 故障排查

| 文档 | 用途 |
|------|------|
| [TROUBLESHOOTING.md](TROUBLESHOOTING.md) | 常见问题和解决方案 |

### 📜 SQL 脚本

| 文件 | 用途 | 何时使用 |
|------|------|---------|
| [supabase/migrations/002_setup_cron_jobs.sql](supabase/migrations/002_setup_cron_jobs.sql) | 数据库配置 | 首次配置时 |
| [supabase/VERIFY_SETUP.sql](supabase/VERIFY_SETUP.sql) | 验证配置 | 配置完成后验证 |
| [supabase/UPDATE_CRON_TO_5MIN.sql](supabase/UPDATE_CRON_TO_5MIN.sql) | 更新为 5 分钟频率 | 需要调整频率时 |

### 💻 代码文件

| 文件 | 说明 |
|------|------|
| [supabase/functions/sync-repositories/index.ts](supabase/functions/sync-repositories/index.ts) | Edge Function 主代码 |
| [supabase/functions/sync-repositories/README.md](supabase/functions/sync-repositories/README.md) | Edge Function 文档 |

## 📋 使用场景指南

### 场景 1: 我是新用户，第一次配置

**阅读顺序**:
1. 📖 [SETUP_GUIDE.md](SETUP_GUIDE.md) - 按步骤完成所有配置
2. ✅ 执行 [supabase/VERIFY_SETUP.sql](supabase/VERIFY_SETUP.sql) - 验证配置成功
3. 📌 保存 [README_SYNC.md](README_SYNC.md) - 日后快速参考

### 场景 2: 我已经配置好了，日常使用

**快速参考**:
- 📖 [README_SYNC.md](README_SYNC.md) - 常用命令和操作
- 📊 执行 [supabase/VERIFY_SETUP.sql](supabase/VERIFY_SETUP.sql) - 检查运行状态

### 场景 3: 我想调整同步频率

**操作步骤**:
1. 📘 阅读 [supabase/CRON_FREQUENCY_GUIDE.md](supabase/CRON_FREQUENCY_GUIDE.md)
2. 📝 根据仓库数量选择合适的频率
3. 🔧 在 SQL Editor 中执行相应的 cron 命令

### 场景 4: 遇到问题了

**排查步骤**:
1. 🔍 阅读 [TROUBLESHOOTING.md](TROUBLESHOOTING.md)
2. 📊 执行 [supabase/VERIFY_SETUP.sql](supabase/VERIFY_SETUP.sql) 查看具体问题
3. 🔧 根据问题类型查找对应的解决方案

### 场景 5: 我想了解 Vault 密钥管理

**参考文档**:
- 🔐 [supabase/VAULT_SETUP.md](supabase/VAULT_SETUP.md) - 完整的 Vault 使用指南

### 场景 6: 我想修改 Edge Function 代码

**参考文档**:
- 💻 [supabase/functions/sync-repositories/README.md](supabase/functions/sync-repositories/README.md)
- 📖 [EDGE_FUNCTION_SETUP.md](EDGE_FUNCTION_SETUP.md)

## 🎯 核心概念速查

### 架构
```
pg_cron (定时) → trigger_repository_sync() → Edge Function → GitHub API → Supabase DB
```

### 关键配置
- **频率**: 每 5 分钟（`*/5 * * * *`）
- **Vault 密钥**: `project_url` + `publishable_key`
- **Edge Function**: `sync-repositories`
- **定时任务**: `repository-sync-every-5min`

### 数据流
1. pg_cron 每 5 分钟触发
2. 调用数据库函数 `trigger_repository_sync()`
3. 从 Vault 读取密钥
4. HTTP POST 到 Edge Function
5. Edge Function 调用 GitHub API
6. 更新 `repositories` 和 `repository_stats` 表
7. 记录到 `sync_logs`

### 监控位置
- **定时任务**: `cron.job_run_details`
- **HTTP 请求**: `net.http_request_queue`
- **同步日志**: `sync_logs`
- **Edge Function 日志**: `supabase functions logs sync-repositories`

## 📞 获取帮助

### 检查清单
1. ✅ 扩展已启用（pg_cron, pg_net, vault）
2. ✅ Vault 密钥已配置（project_url, publishable_key）
3. ✅ Edge Function 已部署
4. ✅ 定时任务已调度
5. ✅ GitHub Token 已配置

### 验证命令
```sql
-- 一键验证所有配置
-- 执行文件: supabase/VERIFY_SETUP.sql
```

### 手动测试
```sql
-- 手动触发同步
SELECT trigger_repository_sync();

-- 查看结果
SELECT * FROM net.http_request_queue ORDER BY created DESC LIMIT 1;
SELECT * FROM sync_logs ORDER BY started_at DESC LIMIT 5;
```

## 🔄 更新历史

- **v1.0** - 初始版本，使用 `anon_key`
- **v1.1** - ✅ 更新为使用 `publishable_key`（当前版本）
- 同步频率：每 5 分钟

## 📝 注意事项

- 所有 SQL 脚本都已测试通过 ✅
- 配置使用 `publishable_key` 而不是 `anon_key` ✅
- Edge Function 已部署并测试 ✅
- 定时任务正常运行 ✅

---

💡 **提示**: 如果你是第一次使用，从 [SETUP_GUIDE.md](SETUP_GUIDE.md) 开始！
