# 快速设置指南

## 1. Supabase 项目设置

### 创建 Supabase 项目

1. 访问 [Supabase Dashboard](https://supabase.com/dashboard)
2. 点击 "New Project"
3. 填写项目信息:
   - Name: `github-repo-rank`
   - Database Password: (创建一个强密码)
   - Region: 选择离你最近的区域
4. 等待项目创建完成 (约 2-3 分钟)

### 获取 API 凭证

1. 进入项目 Settings > API
2. 复制以下信息:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
   - **service_role key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (点击 "Reveal" 显示)

3. 将这些信息填写到 `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...
```

### 执行数据库迁移

**方法一: 使用 Supabase Dashboard (推荐新手)**

1. 打开 Supabase Dashboard
2. 进入 SQL Editor
3. 点击 "New Query"
4. 复制 `supabase/migrations/001_initial_schema.sql` 的全部内容
5. 粘贴到编辑器中
6. 点击 "Run" 执行
7. 确认所有表和视图创建成功

**方法二: 使用 Supabase CLI**

```bash
# 安装 Supabase CLI
npm install -g supabase

# 登录
supabase login

# 链接项目 (在项目设置中找到 Project Ref)
supabase link --project-ref your-project-ref

# 运行迁移
supabase db push
```

### 验证数据库设置

在 Supabase Dashboard 的 Table Editor 中，应该能看到以下表:
- ✅ repositories
- ✅ repository_stats
- ✅ invite_codes
- ✅ user_submissions
- ✅ sync_logs

在 invite_codes 表中应该有一条测试数据:
- code: `WELCOME2025`

---

## 2. GitHub API 设置

### 创建 Personal Access Token

1. 访问 [GitHub Settings > Developer Settings > Personal Access Tokens > Tokens (classic)](https://github.com/settings/tokens)
2. 点击 "Generate new token (classic)"
3. 填写信息:
   - Note: `github-repo-rank`
   - Expiration: 选择有效期
   - 选择权限:
     - ✅ `public_repo` - 访问公开仓库
     - ✅ `read:user` - 读取用户信息
4. 点击 "Generate token"
5. **立即复制** token (离开页面后将无法再次查看)
6. 将 token 添加到 `.env.local`:
```env
GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### 提高 API 限额 (可选 - 推荐)

如果需要更高的 API 限额 (15,000 requests/hour)，可以创建 GitHub App:

1. 访问 [GitHub Settings > Developer Settings > GitHub Apps](https://github.com/settings/apps)
2. 点击 "New GitHub App"
3. 填写基本信息:
   - GitHub App name: `github-repo-rank-app`
   - Homepage URL: `http://localhost:3000`
   - Webhook: 取消勾选 "Active"
4. 设置权限:
   - Repository permissions:
     - Contents: Read-only
     - Metadata: Read-only
5. 点击 "Create GitHub App"
6. 生成私钥:
   - 在 App 设置页面，滚动到 "Private keys" 部分
   - 点击 "Generate a private key"
   - 下载 `.pem` 文件
7. 将 App ID 和私钥添加到 `.env.local`:
```env
GITHUB_APP_ID=123456
GITHUB_APP_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----
...
-----END RSA PRIVATE KEY-----"
```

---

## 3. 本地开发环境设置

### 安装依赖

```bash
pnpm install
```

### 配置环境变量

创建 `.env.local` 文件:
```bash
cp .env.example .env.local
```

确保填写了以下所有变量:
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...
GITHUB_TOKEN=ghp_xxxx...
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

### 启动开发服务器

```bash
pnpm dev
```

访问 [http://localhost:3000](http://localhost:3000) 查看应用。

### 验证设置

1. **数据库连接**: 检查浏览器控制台是否有 Supabase 连接错误
2. **环境变量**: 确保所有必需的环境变量都已设置
3. **TypeScript**: 运行 `pnpm build` 检查是否有类型错误

---

## 4. 设置 Supabase Edge Functions (定时更新)

### 安装 Supabase CLI

```bash
npm install -g supabase
```

### 创建 Edge Function

```bash
# 创建函数
supabase functions new fetch-github-data
supabase functions new validate-repo
supabase functions new validate-invite-code
```

### 配置 Cron Jobs

在 Supabase Dashboard 的 Database > Cron Jobs 中添加:

**每分钟更新活跃仓库**:
```sql
SELECT cron.schedule(
  'update-active-repos',
  '* * * * *',
  $$
  SELECT net.http_post(
    url:='https://your-project.supabase.co/functions/v1/fetch-github-data',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer YOUR_SERVICE_KEY"}'::jsonb,
    body:='{"sync_type": "incremental"}'::jsonb
  ) AS request_id;
  $$
);
```

**每10分钟更新不活跃仓库**:
```sql
SELECT cron.schedule(
  'update-inactive-repos',
  '*/10 * * * *',
  $$
  SELECT net.http_post(
    url:='https://your-project.supabase.co/functions/v1/fetch-github-data',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer YOUR_SERVICE_KEY"}'::jsonb,
    body:='{"sync_type": "inactive"}'::jsonb
  ) AS request_id;
  $$
);
```

---

## 5. 测试邀请码功能

默认邀请码: `WELCOME2025`

### 手动添加新邀请码

在 Supabase Dashboard 的 SQL Editor 中执行:

```sql
INSERT INTO invite_codes (code, description, is_active, max_uses, expires_at)
VALUES (
  'TEST2025',
  '测试邀请码',
  true,
  10,  -- 最多使用10次
  '2025-12-31 23:59:59+00'  -- 2025年12月31日过期
);
```

### 查看邀请码使用情况

```sql
SELECT
  code,
  current_uses,
  max_uses,
  is_active,
  expires_at,
  created_at
FROM invite_codes
ORDER BY created_at DESC;
```

---

## 6. 部署到 Vercel

### 准备部署

1. **初始化 Git 仓库**:
```bash
git init
git add .
git commit -m "Initial commit"
```

2. **推送到 GitHub**:
```bash
git remote add origin https://github.com/your-username/github-repo-rank.git
git push -u origin main
```

### 在 Vercel 部署

1. 访问 [Vercel Dashboard](https://vercel.com/dashboard)
2. 点击 "Import Project"
3. 选择你的 GitHub 仓库
4. 配置环境变量 (从 `.env.local` 复制所有变量)
5. 点击 "Deploy"

### 更新环境变量

部署完成后，更新 `NEXT_PUBLIC_BASE_URL`:
```env
NEXT_PUBLIC_BASE_URL=https://your-project.vercel.app
```

---

## 常见问题排查

### 问题 1: Supabase 连接失败

**错误**: `Invalid Supabase URL` 或 `Missing Supabase environment variables`

**解决方案**:
1. 检查 `.env.local` 文件是否存在
2. 确认环境变量名称正确 (必须以 `NEXT_PUBLIC_` 开头的才能在客户端使用)
3. 重启开发服务器: `pnpm dev`

### 问题 2: GitHub API 限制

**错误**: `API rate limit exceeded`

**解决方案**:
1. 确认 `GITHUB_TOKEN` 已正确配置
2. 检查 GitHub Token 权限
3. 考虑升级到 GitHub App (15,000 requests/hour)

### 问题 3: 数据库表不存在

**错误**: `relation "repositories" does not exist`

**解决方案**:
1. 确认已执行数据库迁移 SQL
2. 在 Supabase Dashboard 的 Table Editor 中检查表是否存在
3. 重新执行 `supabase/migrations/001_initial_schema.sql`

### 问题 4: TypeScript 类型错误

**错误**: `Cannot find module '@/app/types/...'`

**解决方案**:
1. 确认文件路径正确
2. 重启 TypeScript 服务器 (VSCode: Cmd+Shift+P > "TypeScript: Restart TS Server")
3. 检查 `tsconfig.json` 中的 `paths` 配置

---

## 下一步

✅ 环境设置完成后，你可以开始开发:

1. 创建仓库提交表单组件
2. 实现邀请码验证逻辑
3. 集成 GitHub API
4. 创建排行榜展示组件
5. 实现实时更新功能

参考 [README.md](./README.md) 和 [PRD.md](./PRD.md) 获取更多开发指南。
