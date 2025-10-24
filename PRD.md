# GitHub 仓库排行榜 - 产品需求文档 (PRD)

## 1. 项目概述

### 1.1 产品定位
一个实时的GitHub仓库排行榜平台，允许用户提交GitHub仓库链接，自动抓取并展示仓库的各项统计数据，支持多维度排序和对比。

### 1.2 核心价值
- 为开发者提供直观的仓库数据可视化
- 帮助用户发现优质开源项目
- 提供多维度的仓库对比功能

---

## 2. 技术架构

### 2.1 技术栈

#### 前端
- **框架**: Next.js 14+ (App Router)
- **语言**: TypeScript
- **样式**: Tailwind CSS
- **UI组件**: shadcn/ui 或 Ant Design
- **状态管理**: React Query (数据缓存) + Zustand (全局状态)
- **图表库**: Recharts 或 Chart.js
- **实时更新**: Supabase Realtime

#### 后端 & 数据库
- **BaaS平台**: Supabase
  - PostgreSQL 数据库
  - Row Level Security (RLS)
  - Realtime subscriptions
  - Edge Functions (数据抓取定时任务)
- **API**:
  - GitHub REST API v3
  - GitHub GraphQL API v4 (推荐，减少请求次数)

#### 部署
- **前端**: Vercel
- **后端**: Supabase Cloud
- **定时任务**: Supabase Edge Functions + Cron Jobs

### 2.2 系统架构图

```
┌─────────────────────────────────────────────────────────────┐
│                         用户浏览器                            │
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   提交仓库    │  │  查看排行榜   │  │   实时更新    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                              │
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                    Next.js 前端应用                           │
│                                                               │
│  • 用户界面渲染                                               │
│  • 客户端路由                                                 │
│  • 实时数据订阅 (Supabase Realtime)                          │
└─────────────────────────────────────────────────────────────┘
                              │
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                      Supabase 后端                            │
│                                                               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              PostgreSQL 数据库                        │   │
│  │  • repositories 表                                    │   │
│  │  • repository_stats 表                                │   │
│  │  • user_submissions 表                                │   │
│  │  • invite_codes 表 (邀请码管理)                       │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              Edge Functions                           │   │
│  │  • fetch-github-data: 抓取GitHub数据                  │   │
│  │  • update-rankings: 更新排名                          │   │
│  │  • validate-repo: 验证仓库有效性                      │   │
│  │  • validate-invite-code: 验证邀请码                   │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              Realtime 实时订阅                        │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                      GitHub API                               │
│                                                               │
│  • REST API v3                                                │
│  • GraphQL API v4                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. 数据库设计

### 3.1 数据表结构

#### 表 1: repositories (仓库基本信息)
```sql
CREATE TABLE repositories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  github_id BIGINT UNIQUE NOT NULL,
  owner VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  full_name VARCHAR(511) NOT NULL UNIQUE,
  description TEXT,
  url TEXT NOT NULL,
  homepage TEXT,
  language VARCHAR(100),
  topics TEXT[],
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  last_synced_at TIMESTAMPTZ,

  -- 索引
  INDEX idx_full_name (full_name),
  INDEX idx_github_id (github_id),
  INDEX idx_is_active (is_active)
);
```

#### 表 2: repository_stats (仓库统计数据)
```sql
CREATE TABLE repository_stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  repository_id UUID REFERENCES repositories(id) ON DELETE CASCADE,

  -- 基础统计
  stars_count INTEGER DEFAULT 0,
  forks_count INTEGER DEFAULT 0,
  watchers_count INTEGER DEFAULT 0,
  open_issues_count INTEGER DEFAULT 0,
  open_prs_count INTEGER DEFAULT 0,
  closed_issues_count INTEGER DEFAULT 0,
  closed_prs_count INTEGER DEFAULT 0,

  -- 代码统计
  commits_count INTEGER DEFAULT 0,
  branches_count INTEGER DEFAULT 0,
  releases_count INTEGER DEFAULT 0,
  contributors_count INTEGER DEFAULT 0,
  code_size_kb INTEGER DEFAULT 0,

  -- 活跃度统计
  last_commit_date TIMESTAMPTZ,
  commits_last_month INTEGER DEFAULT 0,
  commits_last_week INTEGER DEFAULT 0,

  -- 元数据
  snapshot_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- 索引
  INDEX idx_repository_id (repository_id),
  INDEX idx_snapshot_date (snapshot_date),
  INDEX idx_stars_count (stars_count DESC),
  INDEX idx_commits_count (commits_count DESC),
  UNIQUE (repository_id, snapshot_date)
);
```

#### 表 3: invite_codes (邀请码管理)
```sql
CREATE TABLE invite_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  max_uses INTEGER, -- NULL表示无限次使用
  current_uses INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ, -- NULL表示永不过期
  created_by VARCHAR(255),

  -- 索引
  INDEX idx_code (code),
  INDEX idx_is_active (is_active),
  INDEX idx_expires_at (expires_at)
);

-- 添加检查约束
ALTER TABLE invite_codes ADD CONSTRAINT check_max_uses
  CHECK (max_uses IS NULL OR max_uses > 0);
ALTER TABLE invite_codes ADD CONSTRAINT check_current_uses
  CHECK (current_uses >= 0);
```

#### 表 4: user_submissions (用户提交记录)
```sql
CREATE TABLE user_submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  repository_id UUID REFERENCES repositories(id) ON DELETE CASCADE,
  invite_code_id UUID REFERENCES invite_codes(id) ON DELETE SET NULL,
  invite_code_used VARCHAR(50) NOT NULL, -- 记录使用的邀请码
  submitter_ip VARCHAR(45),
  user_agent TEXT,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  status VARCHAR(50) DEFAULT 'pending', -- pending, validated, failed

  -- 索引
  INDEX idx_repository_id (repository_id),
  INDEX idx_invite_code_id (invite_code_id),
  INDEX idx_status (status),
  INDEX idx_submitted_at (submitted_at DESC)
);
```

#### 表 5: sync_logs (同步日志)
```sql
CREATE TABLE sync_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  repository_id UUID REFERENCES repositories(id) ON DELETE CASCADE,
  sync_type VARCHAR(50) NOT NULL, -- full_sync, incremental_sync
  status VARCHAR(50) NOT NULL, -- success, failed, in_progress
  error_message TEXT,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  duration_ms INTEGER,

  -- 索引
  INDEX idx_repository_id (repository_id),
  INDEX idx_status (status),
  INDEX idx_started_at (started_at DESC)
);
```

### 3.2 视图 (Views)

#### 视图 1: current_rankings (当前排行榜)
```sql
CREATE VIEW current_rankings AS
SELECT
  r.id,
  r.full_name,
  r.owner,
  r.name,
  r.description,
  r.language,
  r.url,
  rs.stars_count,
  rs.forks_count,
  rs.commits_count,
  rs.branches_count,
  rs.open_issues_count,
  rs.open_prs_count,
  rs.contributors_count,
  rs.code_size_kb,
  rs.last_commit_date,
  rs.commits_last_month,
  RANK() OVER (ORDER BY rs.stars_count DESC) as stars_rank,
  RANK() OVER (ORDER BY rs.commits_count DESC) as commits_rank,
  RANK() OVER (ORDER BY rs.forks_count DESC) as forks_rank
FROM repositories r
JOIN repository_stats rs ON r.id = rs.repository_id
WHERE r.is_active = true
  AND rs.snapshot_date = CURRENT_DATE
ORDER BY rs.stars_count DESC;
```

---

## 4. 功能需求

### 4.1 核心功能

#### 4.1.1 仓库提交功能 (需邀请码)
**用户故事**: 作为用户，我想要使用邀请码提交GitHub仓库链接，以便在排行榜上展示

**功能描述**:
- 用户在首页输入:
  - **邀请码** (必填)
  - GitHub仓库URL (支持多种格式)
    - `https://github.com/owner/repo`
    - `github.com/owner/repo`
    - `owner/repo`
- 前端进行:
  - URL格式验证
  - 邀请码格式验证 (非空)
- 提交后进行后端验证:
  - **验证邀请码有效性**
    - 邀请码是否存在
    - 邀请码是否已激活
    - 邀请码是否已过期
    - 邀请码使用次数是否已达上限
  - 检查仓库是否存在
  - 检查仓库是否已被添加
  - 验证仓库可访问性
- 验证通过后:
  - 更新邀请码使用次数
  - 记录提交信息 (含邀请码ID)
  - 触发数据抓取任务
- 显示提交状态 (邀请码无效、处理中、成功、失败)

**技术实现**:
```typescript
// 前端API调用
async function submitRepository(url: string, inviteCode: string) {
  // 1. 先验证邀请码
  const { data: codeValidation, error: codeError } = await supabase.functions.invoke('validate-invite-code', {
    body: { invite_code: inviteCode }
  });

  if (codeError || !codeValidation.valid) {
    throw new Error('邀请码无效或已过期');
  }

  // 2. 验证并提交仓库
  const { data, error } = await supabase.functions.invoke('validate-repo', {
    body: {
      repo_url: url,
      invite_code: inviteCode
    }
  });

  if (!error) {
    // 3. 触发后台抓取
    await supabase.functions.invoke('fetch-github-data', {
      body: { repository_id: data.repository_id }
    });
  }
}
```

**邀请码管理功能** (管理员):
- 创建新邀请码 (设置最大使用次数、过期时间)
- 查看邀请码列表和使用情况
- 启用/禁用邀请码
- 查看通过某个邀请码提交的仓库列表

#### 4.1.2 排行榜展示功能
**用户故事**: 作为用户，我想要查看仓库排行榜，了解各个仓库的统计数据

**功能描述**:
- 展示排行榜列表，默认按Stars数排序
- 每个仓库卡片显示:
  - 仓库名称、描述、主要语言
  - Stars、Forks、Issues、PRs数量
  - Commits数量、分支数量
  - 贡献者数量、代码大小
  - 最后提交时间
  - 排名徽章 (前3名特殊标识)
- 支持分页加载 (虚拟滚动)
- 响应式设计 (移动端适配)

**UI组件结构**:
```
<RankingPage>
  ├── <FilterBar>
  │   ├── <SortSelector>
  │   ├── <LanguageFilter>
  │   └── <TimeRangeFilter>
  ├── <RankingList>
  │   ├── <RepoCard> × N
  │   │   ├── <RepoHeader>
  │   │   ├── <StatsGrid>
  │   │   └── <TrendChart>
  │   └── <LoadMore>
  └── <SubmitButton>
```

#### 4.1.3 多维度排序功能
**用户故事**: 作为用户，我想要按不同指标查看排行，发现不同类型的优质项目

**排序维度**:
1. Stars数量 (默认)
2. Forks数量
3. Commits数量
4. Issues数量
5. PRs数量
6. 分支数量
7. 贡献者数量
8. 最近活跃度 (近30天commits)
9. 代码规模

**技术实现**:
```typescript
// Supabase查询示例
const { data } = await supabase
  .from('current_rankings')
  .select('*')
  .order(sortBy, { ascending: false })
  .range(offset, offset + limit);
```

#### 4.1.4 实时更新功能
**用户故事**: 作为用户，我希望排行榜数据自动更新，无需手动刷新

**功能描述**:
- 使用Supabase Realtime订阅数据变化
- 当有新仓库添加或数据更新时，自动刷新列表
- 显示更新提示 (Toast通知)
- 平滑的动画过渡

**技术实现**:
```typescript
// 订阅实时更新
const subscription = supabase
  .channel('repository_stats')
  .on('postgres_changes',
    { event: 'INSERT', schema: 'public', table: 'repository_stats' },
    (payload) => {
      // 更新本地状态
      queryClient.invalidateQueries(['rankings']);
    }
  )
  .subscribe();
```

#### 4.1.5 仓库详情页
**用户故事**: 作为用户，我想要查看单个仓库的详细信息和历史趋势

**功能描述**:
- 仓库基本信息展示
- 各项指标的历史趋势图
- 最近活跃情况 (commits时间线)
- 贡献者Top榜
- 直接跳转到GitHub仓库

---

## 5. 非功能需求

### 5.1 性能要求
- 首页加载时间 < 2秒
- 排行榜列表渲染 < 1秒
- 支持10,000+仓库数据量
- **数据更新频率: 每分钟**
- 实时UI更新延迟 < 5秒 (通过Supabase Realtime)

### 5.2 安全要求
- **邀请码验证** (必须提供有效邀请码才能提交)
- **邀请码防滥用**:
  - 单个邀请码使用次数限制
  - 邀请码过期时间
  - IP级别限流 (同一IP每小时最多使用5次邀请码)
- 防止重复提交 (同一仓库不能重复添加)
- SQL注入防护 (Supabase RLS + 参数化查询)
- XSS防护 (React自动转义)
- API Rate Limit (GitHub API限制管理)
- **邀请码管理权限** (仅管理员可创建/管理邀请码)

### 5.3 可用性要求
- 99.5%+可用性
- 错误提示友好
- 多语言支持 (中/英)

---

## 6. GitHub API数据抓取策略

### 6.1 API选择
**推荐使用 GitHub GraphQL API v4**，原因:
- 单次请求获取多个数据
- 减少API调用次数
- 更灵活的查询

### 6.2 数据抓取流程
```
1. 用户提交仓库 URL + 邀请码
   ↓
2. validate-invite-code Edge Function
   - 验证邀请码有效性
   - 检查使用次数和过期时间
   - 检查IP限流
   ↓
3. validate-repo Edge Function
   - 解析URL提取owner/repo
   - 调用GitHub API验证仓库存在
   - 检查数据库是否已存在
   ↓
4. 创建 repository 记录
   - 更新邀请码使用次数
   - 记录提交信息
   ↓
5. 触发 fetch-github-data Edge Function
   - 获取基础信息 (stars, forks, watchers)
   - 获取commits数量 (默认分支)
   - 获取branches数量
   - 获取open issues数量
   - 获取open PRs数量
   - 获取contributors数量
   - 获取代码大小
   ↓
6. 保存到 repository_stats 表
   ↓
7. 触发 Realtime 更新通知客户端
   ↓
8. 后台定时任务 (每分钟)
   - 轮询需要更新的仓库列表
   - 批量调用GitHub API
   - 更新 repository_stats 表
   - 触发 Realtime 推送更新
```

### 6.3 GraphQL查询示例
```graphql
query GetRepositoryStats($owner: String!, $name: String!) {
  repository(owner: $owner, name: $name) {
    id
    name
    description
    url
    stargazerCount
    forkCount
    watchers { totalCount }
    issues(states: OPEN) { totalCount }
    pullRequests(states: OPEN) { totalCount }
    defaultBranchRef {
      target {
        ... on Commit {
          history { totalCount }
        }
      }
    }
    refs(refPrefix: "refs/heads/") { totalCount }
    releases { totalCount }
    mentionableUsers { totalCount }
    diskUsage
    primaryLanguage { name }
    repositoryTopics(first: 10) {
      nodes { topic { name } }
    }
  }
}
```

### 6.4 定时同步策略
- **新仓库**: 立即全量抓取
- **已存在仓库**: **每分钟增量更新**
  - 更新频率: **60秒/次**
  - 更新内容: stars, forks, watchers, issues, PRs, commits, branches
  - 实现方式: Supabase Cron Job + Edge Function
  - 批量处理: 每次更新20-50个仓库 (避免API限制)
- **不活跃仓库** (30天无更新): 降级为每10分钟更新一次

**定时任务配置**:
```sql
-- Supabase Cron Jobs
-- 每分钟更新活跃仓库
SELECT cron.schedule(
  'update-active-repos',
  '* * * * *', -- 每分钟执行
  $$
  SELECT net.http_post(
    url:='https://your-project.supabase.co/functions/v1/fetch-github-data',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer YOUR_SERVICE_KEY"}'::jsonb,
    body:='{"sync_type": "incremental"}'::jsonb
  ) AS request_id;
  $$
);

-- 每10分钟更新不活跃仓库
SELECT cron.schedule(
  'update-inactive-repos',
  '*/10 * * * *', -- 每10分钟执行
  $$
  SELECT net.http_post(
    url:='https://your-project.supabase.co/functions/v1/fetch-github-data',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer YOUR_SERVICE_KEY"}'::jsonb,
    body:='{"sync_type": "inactive"}'::jsonb
  ) AS request_id;
  $$
);
```

### 6.5 API速率限制处理
- GitHub API限制:
  - REST API: 5,000 requests/hour (认证用户)
  - GraphQL API: 5,000 points/hour
- **每分钟更新的挑战**:
  - 假设100个活跃仓库，每分钟更新需要100次API调用/分钟 = 6,000次/小时
  - **超过GitHub限制，需要优化策略**
- **优化策略**:
  - **使用GitHub App Token** (15,000 requests/hour)
  - **使用GraphQL批量查询** (单次请求获取多个仓库数据)
  - **智能更新队列**:
    - 新提交的仓库: 立即更新
    - 活跃仓库 (1周内有更新): 每分钟轮询
    - 一般仓库: 每5分钟轮询
    - 不活跃仓库 (30天无更新): 每30分钟轮询
  - **请求队列和重试机制**
  - **缓存机制** (减少重复请求)
  - **监控API使用率** (动态调整更新频率)

**示例: GraphQL批量查询**
```graphql
query GetMultipleRepos {
  repo1: repository(owner: "owner1", name: "repo1") {
    ...RepoStats
  }
  repo2: repository(owner: "owner2", name: "repo2") {
    ...RepoStats
  }
  # ... 最多20个仓库/次
}

fragment RepoStats on Repository {
  stargazerCount
  forkCount
  issues(states: OPEN) { totalCount }
  pullRequests(states: OPEN) { totalCount }
}
```

---

## 7. 开发路线图

### Phase 1: MVP (2-3周)
- [ ] 项目初始化 (Next.js + Supabase)
- [ ] 数据库设计与创建 (含邀请码表)
- [ ] **邀请码系统实现**
  - [ ] 邀请码验证API
  - [ ] 邀请码管理界面 (管理员)
- [ ] 基础UI框架搭建
- [ ] 仓库提交功能 (需邀请码)
- [ ] GitHub API集成 (基础数据抓取)
- [ ] **每分钟增量更新任务**
  - [ ] Cron Job配置
  - [ ] 批量更新逻辑
  - [ ] API限流处理
- [ ] 排行榜列表展示 (Stars排序)
- [ ] 部署上线

### Phase 2: 增强功能 (2周)
- [ ] 多维度排序功能
- [ ] 实时更新功能
- [ ] 仓库详情页
- [ ] 筛选功能 (语言、时间范围)
- [ ] 搜索功能
- [ ] 移动端优化

### Phase 3: 高级功能 (2-3周)
- [ ] 历史趋势图表
- [ ] 用户收藏功能
- [ ] 仓库对比功能
- [ ] 数据导出功能
- [ ] SEO优化
- [ ] 多语言支持

---

## 8. 技术风险与解决方案

### 8.1 GitHub API限制
**风险**: 每分钟更新所有仓库可能快速耗尽API配额
**解决方案**:
- **必须使用GitHub App Token** (15,000 requests/hour)
- 实现**智能分级更新策略** (活跃度越高,更新越频繁)
- **GraphQL批量查询** (单次请求最多20个仓库)
- 实时监控API使用率,动态调整更新频率
- 实现请求队列和优先级管理
- 缓存机制减少重复请求

### 8.2 数据一致性
**风险**: 大量并发更新可能导致数据不一致
**解决方案**:
- 使用数据库事务
- 实现乐观锁机制
- 定时数据校验任务

### 8.3 性能瓶颈
**风险**: 数据量增长可能影响查询性能
**解决方案**:
- 数据库索引优化
- 实现分页和虚拟滚动
- 使用Supabase缓存
- CDN加速静态资源

---

## 9. 成功指标

### 9.1 技术指标
- API响应时间 < 500ms (P95)
- 页面加载时间 < 2s
- 数据同步成功率 > 95%
- 系统可用性 > 99.5%

### 9.2 产品指标
- 收录仓库数量
- 日活跃用户数
- 用户提交次数
- 页面停留时间

---

## 10. 附录

### 10.1 环境变量配置
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# GitHub
GITHUB_TOKEN=your_github_personal_access_token
GITHUB_APP_ID=your_app_id (可选)
GITHUB_APP_PRIVATE_KEY=your_private_key (可选)

# 其他
NEXT_PUBLIC_BASE_URL=https://your-domain.com
```

### 10.2 参考资源
- [GitHub REST API文档](https://docs.github.com/en/rest)
- [GitHub GraphQL API文档](https://docs.github.com/en/graphql)
- [Supabase文档](https://supabase.com/docs)
- [Next.js文档](https://nextjs.org/docs)

---

## 关键更新说明

### ✅ 已更新内容

1. **邀请码系统** ✨
   - 新增 `invite_codes` 表管理邀请码
   - 支持设置最大使用次数、过期时间
   - 提交仓库时必须验证邀请码
   - 提供邀请码管理界面 (管理员功能)

2. **每分钟数据更新** ⚡
   - 已存在仓库改为每60秒更新一次
   - 使用Supabase Cron Jobs实现定时任务
   - 智能分级更新策略 (活跃/不活跃仓库差异化)
   - GraphQL批量查询优化API使用

3. **API限制应对方案** 🛡️
   - 必须使用GitHub App Token (15,000/小时限额)
   - 批量查询 (最多20个仓库/次)
   - 动态调整更新频率
   - 实时监控API使用率

---

## 审阅反馈

请重点审阅以下技术细节:

1. **邀请码系统**: 表结构和验证流程是否完善？是否需要更多管理功能？
2. **每分钟更新**: 这个频率是否会带来性能问题？GraphQL批量查询策略是否可行？
3. **API配额管理**: GitHub App Token的15,000/小时是否足够？需要多少个仓库才会超限？
4. **实时推送**: 每分钟更新数百个仓库，Supabase Realtime能否承载？
5. **成本考量**: 高频更新对Supabase和Vercel的成本影响？

期待您的反馈！
