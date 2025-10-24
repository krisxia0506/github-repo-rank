# GitHub 仓库排行榜

一个实时的GitHub仓库排行榜平台，允许用户通过邀请码提交GitHub仓库链接，自动抓取并展示仓库的各项统计数据，支持多维度排序和对比。

## 技术栈

### 前端
- **框架**: Next.js 16 (App Router)
- **语言**: TypeScript
- **样式**: Tailwind CSS 4
- **UI组件**: 自定义组件
- **状态管理**: React Query (数据缓存) + Zustand (全局状态)
- **图表库**: Recharts
- **实时更新**: Supabase Realtime

### 后端 & 数据库
- **BaaS平台**: Supabase
  - PostgreSQL 数据库
  - Row Level Security (RLS)
  - Realtime subscriptions
  - Edge Functions (数据抓取定时任务)
- **API**: GitHub GraphQL API v4

## 功能特性

### 核心功能
- ✅ 邀请码验证系统 (必须提供有效邀请码才能提交仓库)
- ✅ 仓库提交和验证
- ✅ 每分钟自动更新仓库数据
- ✅ 实时排行榜展示
- ✅ 多维度排序 (Stars, Forks, Commits, Issues, PRs等)
- ✅ 仓库详情页
- ✅ 管理员邀请码管理

### 数据统计维度
- Stars 数量
- Forks 数量
- Commits 数量
- Branches 数量
- Issues 数量 (开放/关闭)
- Pull Requests 数量 (开放/关闭)
- 贡献者数量
- 代码大小
- 最近活跃度

## 快速开始

### 前置要求
- Node.js 18+
- pnpm 8+
- Supabase 账号
- GitHub Personal Access Token 或 GitHub App

### 安装步骤

1. **克隆项目**
\`\`\`bash
git clone <repository-url>
cd github-repo-rank
\`\`\`

2. **安装依赖**
\`\`\`bash
pnpm install
\`\`\`

3. **配置环境变量**

复制 \`.env.example\` 到 \`.env.local\`:
\`\`\`bash
cp .env.example .env.local
\`\`\`

编辑 \`.env.local\` 并填写以下信息:
\`\`\`env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# GitHub API Configuration
GITHUB_TOKEN=your_github_personal_access_token

# Application Configuration
NEXT_PUBLIC_BASE_URL=http://localhost:3000
\`\`\`

4. **设置 Supabase 数据库**

方法一：使用 Supabase CLI (推荐)
\`\`\`bash
# 安装 Supabase CLI
npm install -g supabase

# 登录 Supabase
supabase login

# 链接到你的项目
supabase link --project-ref <your-project-ref>

# 运行迁移
supabase db push
\`\`\`

方法二：手动执行 SQL
- 登录到 Supabase Dashboard
- 进入 SQL Editor
- 复制并执行 \`supabase/migrations/001_initial_schema.sql\` 中的内容

5. **启动开发服务器**
\`\`\`bash
pnpm dev
\`\`\`

访问 [http://localhost:3000](http://localhost:3000) 查看应用。

## 项目结构

\`\`\`
github-repo-rank/
├── app/
│   ├── api/                    # API 路由
│   ├── components/             # React 组件
│   │   ├── ui/                 # 通用 UI 组件
│   │   └── features/           # 功能组件
│   │       ├── ranking/        # 排行榜相关
│   │       ├── submission/     # 提交相关
│   │       └── admin/          # 管理员相关
│   ├── hooks/                  # 自定义 Hooks
│   ├── lib/                    # 工具函数和配置
│   │   └── supabase/           # Supabase 客户端
│   ├── types/                  # TypeScript 类型定义
│   ├── globals.css             # 全局样式
│   ├── layout.tsx              # 根布局
│   └── page.tsx                # 首页
├── supabase/
│   ├── functions/              # Edge Functions
│   └── migrations/             # 数据库迁移文件
├── public/                     # 静态资源
├── .env.example                # 环境变量示例
├── .env.local                  # 本地环境变量 (不提交)
├── next.config.ts              # Next.js 配置
├── tailwind.config.ts          # Tailwind CSS 配置
├── tsconfig.json               # TypeScript 配置
├── package.json                # 项目依赖
├── PRD.md                      # 产品需求文档
└── README.md                   # 项目说明
\`\`\`

## 数据库架构

### 表结构
1. **repositories** - 仓库基本信息
2. **repository_stats** - 仓库统计数据 (支持历史快照)
3. **invite_codes** - 邀请码管理
4. **user_submissions** - 用户提交记录
5. **sync_logs** - 同步日志

### 视图
- **current_rankings** - 当前排行榜 (仅显示当天最新数据)

详细的数据库设计请参考 [PRD.md](./PRD.md#3-数据库设计)。

## GitHub API 配置

### 获取 GitHub Personal Access Token

1. 访问 [GitHub Settings > Developer Settings > Personal Access Tokens](https://github.com/settings/tokens)
2. 点击 "Generate new token (classic)"
3. 选择以下权限:
   - \`public_repo\` - 访问公开仓库
   - \`read:user\` - 读取用户信息
4. 生成并复制 token 到 \`.env.local\`

### 使用 GitHub App (可选 - 更高限额)

GitHub App 提供更高的 API 限额 (15,000 requests/hour)。

1. 创建 GitHub App: [GitHub Settings > Developer Settings > GitHub Apps](https://github.com/settings/apps)
2. 配置权限: Repository permissions > Contents (Read-only)
3. 生成并下载私钥
4. 将 App ID 和私钥添加到 \`.env.local\`

## 邀请码系统

### 默认邀请码
数据库初始化时会自动创建一个测试邀请码:
- Code: \`WELCOME2025\`
- 无限次使用
- 永不过期

### 创建新邀请码
使用 Supabase Dashboard 的 SQL Editor 执行:

\`\`\`sql
INSERT INTO invite_codes (code, description, is_active, max_uses, expires_at)
VALUES (
  'YOUR_CODE_HERE',
  '描述信息',
  true,
  100,  -- 最大使用次数，NULL 表示无限
  '2025-12-31 23:59:59+00'  -- 过期时间，NULL 表示永不过期
);
\`\`\`

## 定时更新策略

项目使用 Supabase Cron Jobs 实现定时更新:

- **活跃仓库** (1周内有更新): 每分钟更新
- **一般仓库**: 每5分钟更新
- **不活跃仓库** (30天无更新): 每30分钟更新

配置 Cron Jobs 请参考 [PRD.md](./PRD.md#64-定时同步策略)。

## 部署

### Vercel 部署 (推荐)

1. **推送代码到 GitHub**
\`\`\`bash
git init
git add .
git commit -m "Initial commit"
git remote add origin <your-github-repo-url>
git push -u origin main
\`\`\`

2. **在 Vercel 导入项目**
- 访问 [Vercel Dashboard](https://vercel.com/dashboard)
- 点击 "Import Project"
- 选择你的 GitHub 仓库
- 配置环境变量 (从 \`.env.local\` 复制)
- 点击 "Deploy"

3. **配置自定义域名** (可选)
- 在 Vercel 项目设置中添加自定义域名
- 更新 \`NEXT_PUBLIC_BASE_URL\` 环境变量

### 环境变量配置
确保在 Vercel 中配置以下环境变量:
- \`NEXT_PUBLIC_SUPABASE_URL\`
- \`NEXT_PUBLIC_SUPABASE_ANON_KEY\`
- \`SUPABASE_SERVICE_ROLE_KEY\`
- \`GITHUB_TOKEN\`
- \`NEXT_PUBLIC_BASE_URL\`

## 开发路线图

- [x] Phase 1: MVP
  - [x] 项目初始化
  - [x] 数据库设计与创建
  - [x] 邀请码系统实现
  - [ ] 仓库提交功能
  - [ ] GitHub API 集成
  - [ ] 每分钟增量更新任务
  - [ ] 排行榜列表展示

- [ ] Phase 2: 增强功能
  - [ ] 多维度排序功能
  - [ ] 实时更新功能
  - [ ] 仓库详情页
  - [ ] 筛选功能
  - [ ] 搜索功能
  - [ ] 移动端优化

- [ ] Phase 3: 高级功能
  - [ ] 历史趋势图表
  - [ ] 用户收藏功能
  - [ ] 仓库对比功能
  - [ ] 数据导出功能
  - [ ] SEO 优化
  - [ ] 多语言支持

## 常见问题

### Q: 如何获取 Supabase 项目凭证?
A:
1. 登录 [Supabase Dashboard](https://supabase.com/dashboard)
2. 创建新项目或选择现有项目
3. 进入 Settings > API
4. 复制 Project URL 和 anon public key

### Q: GitHub API 限制怎么办?
A:
- 使用 GitHub Personal Access Token: 5,000 requests/hour
- 使用 GitHub App: 15,000 requests/hour (推荐)
- 实现智能缓存和批量查询策略

### Q: 数据多久更新一次?
A:
- 新提交的仓库: 立即更新
- 活跃仓库: 每分钟更新
- 一般仓库: 每5分钟更新
- 不活跃仓库: 每30分钟更新

## 贡献

欢迎提交 Issue 和 Pull Request！

## 许可证

MIT License

## 相关文档

- [产品需求文档 (PRD)](./PRD.md)
- [Supabase 文档](https://supabase.com/docs)
- [Next.js 文档](https://nextjs.org/docs)
- [GitHub API 文档](https://docs.github.com/en/graphql)
