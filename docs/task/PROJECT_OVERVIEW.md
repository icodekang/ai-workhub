# AI-WorkHub Project Overview

## Project Name
**AI-WorkHub** - AI Office Simulation Platform

## Project Description
An AI-powered office simulation inspired by [AI Town](https://github.com/a16z-infra/ai-town), where each employee is an autonomous AI agent. Users can create AI employees, organize them into teams, and assign tasks to individuals or groups. All AI interactions and outputs are logged and accessible.

> 本项目参考 **a16z-infra/ai-town** 的架构设计，将其从"小镇模拟"场景适配为"AI办公"场景。

---

## AI Town 架构参考

### 核心架构分层

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (React)                          │
│  - 员工管理界面                                               │
│  - 团队管理界面                                               │
│  - 任务分配界面                                               │
│  - 聊天/对话历史查看                                          │
│  - 工作成果物浏览                                             │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Backend API (Node.js)                     │
│  - Employee/Team/Task CRUD                                   │
│  - Conversation Log API                                      │
│  - Work Product API                                          │
│  - Simulation Engine (事件驱动)                               │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│               pi-mono (Agent Orchestration)                  │
│  - Agent Lifecycle Management                                 │
│  - Task Execution                                            │
│  - Inter-agent Communication                                 │
│  - Memory & Reflection System                                │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Data Layer                                │
│  - SQLite: Conversations, Tasks, Metadata                    │
│  - Vector Search: Memory Embeddings                          │
│  - File Storage: Work Products                               │
└─────────────────────────────────────────────────────────────┘
```

### AI Town 关键技术点 (参考实现)

#### 1. Memory System (记忆系统)
AI Town 的核心创新之一。参考 `convex/agent/memory.ts`：

```typescript
// 记忆类型
type MemoryType = 'relationship' | 'conversation' | 'reflection'

// 记忆检索：相关性 + 时效性 + 重要性
async function searchMemories(ctx, playerId, embedding, n) {
  const candidates = await ctx.vectorSearch('memoryEmbeddings', ...)
  const ranked = await rankAndTouchMemories(candidates, n)
  return ranked  // 按 relevance + recency + importance 排序
}
```

**在 AI-WorkHub 中的实现**：
- 员工(Agent) 的每次任务执行和交流都会生成记忆
- 记忆通过 embedding 向量存储到 Vector DB
- 检索时综合考虑：相关性、时效性、重要性
- 支持"反思"(Reflection)机制：从旧记忆中提取高阶洞察

#### 2. Conversation System (对话系统)
参考 `convex/agent/conversation.ts`：

```typescript
// 对话流程
startConversationMessage()  // 开始对话，生成开场白
continueConversationMessage()  // 继续对话
leaveConversationMessage()  // 离开对话，生成告别语

// Prompt 构建包含：
// - 自己的身份 (identity) 和目标 (plan)
// - 对方的信息
// - 相关记忆 (related memories)
// - 历史对话 (previous conversation)
```

**在 AI-WorkHub 中的实现**：
- 员工之间可以相互交流（聊天讨论任务）
- 对话会被记录并生成记忆
- 对话内容可查看、可搜索

#### 3. Agent Definition (Agent 定义)
每个 Agent 有两个关键属性（参考 `agentDescription`）：

```typescript
interface AgentDescription {
  identity: string    // "我是Alice，一名后端工程师，擅长Node.js"
  plan: string       // "我目前的目标是完成API文档"
}
```

**在 AI-WorkHub 中的实现**：
- 每个员工(Employee) 创建时定义 identity 和 plan
- 系统根据这些信息让 AI 生成合理的回复和行为
- 员工可以随时更新自己的目标(plan)

#### 4. Simulation Engine (模拟引擎)
参考 `convex/engine/schema.ts`：

```typescript
// 引擎驱动世界运转
interface Engine {
  currentTime: number        // 当前模拟时间
  lastStepTs: number         // 上一步的时间戳
  running: boolean            // 是否运行中
  generationNumber: number    // 递增序号，确保顺序
}
```

**在 AI-WorkHub 中的实现**：
- 引擎驱动员工的任务执行循环
- 支持暂停/恢复
- 时间驱动的事件处理

---

## 核心功能设计

### 1. AI Employee Management (员工管理)
- 创建员工：name, role, identity, plan, model 配置
- 编辑/删除员工
- 查看员工状态和记忆

### 2. AI Team Management (团队管理)
- 创建团队，添加/移除成员
- 设定团队目标 (team plan)
- 团队内的任务分配

### 3. Task Assignment (任务分配)
- 分配任务给个人或团队
- 任务状态跟踪 (pending → in_progress → completed/failed)
- 任务执行结果存储

### 4. Communication & Collaboration (交流协作)
- 员工之间可以聊天交流
- 所有对话都有记录
- 对话历史可查看、可搜索
- 对话生成员工记忆

### 5. Work Product Management (工作成果管理)
- 员工执行任务产生的文件/文档
- 版本跟踪
- 可查看、可下载

### 6. Memory & Reflection (记忆与反思)
- 向量存储员工记忆
- 检索时综合考虑：相关性、时效性、重要性
- 定期"反思"生成高阶洞察

---

## 技术栈

| 层级 | 技术选型 | 说明 |
|------|----------|------|
| Frontend | React/Next.js | 简约高级 UI |
| Backend | Node.js + Express | REST API |
| Agent Framework | **pi-mono** | 多 Agent 编排框架 |
| Database | SQLite + Vector Extension | 结构化数据 + 向量搜索 |
| File Storage | Local FS | 工作成果物存储 |
| LLM | OpenAI / Ollama / Together.ai | 支持多种 LLM 提供商 |

---

## 项目结构

```
ai-workhub/
├── docs/
│   └── task/              # 任务文档
├── frontend/              # React 前端
│   └── src/
│       ├── components/    # UI 组件
│       ├── pages/         # 页面
│       └── lib/           # 工具函数
├── backend/              # Node.js 后端
│   └── src/
│       ├── agents/        # Agent 核心 (参考 ai-town/convex/agent/)
│       │   ├── memory.ts           # 记忆系统
│       │   ├── conversation.ts     # 对话系统
│       │   ├── reflection.ts       # 反思机制
│       │   └── schema.ts           # Agent 数据表
│       ├── engine/        # 模拟引擎 (参考 ai-town/convex/engine/)
│       ├── services/      # 业务逻辑
│       ├── routes/        # API 路由
│       ├── storage/       # 数据访问层
│       └── core/          # 核心配置
├── shared/               # 共享类型
└── data/                 # 数据文件 (SQLite DB, uploads)
```

---

## 设计原则

### 1. 简约·高级 (Minimalist Premium)
- 深色主题，饱和度低，科技感强
- 大量留白，信息密度适中
- 流畅微动效，hover 反馈细腻
- 卡片化设计，圆角 8-16px

### 2. 开发原则
- 所有代码修改必须提交到 GitHub dev 分支
- 每个任务必须有清晰的验收标准
- 所有 AI-Agent 交互必须记录
- 参考 AI Town 的 memory-based agent 设计

---

## 参考资源

- [AI Town GitHub](https://github.com/a16z-infra/ai-town)
- [Generative Agents Paper](https://arxiv.org/pdf/2304.03442.pdf)
- [Convex Database](https://convex.dev/)
