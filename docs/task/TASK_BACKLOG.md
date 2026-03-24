# Task Backlog - AI-WorkHub

> 基于 AI Town (a16z-infra/ai-town) 架构设计

## Task Priority Legend
- **P0**: Critical (Must have for MVP)
- **P1**: High (Core functionality)
- **P2**: Medium (Important but can be enhanced later)
- **P3**: Low (Nice to have)

---

## Sprint 1: Project Foundation

### Task 1.1: Project Structure Setup
- **Priority**: P0
- **Estimate**: 2 hours
- **Description**: Initialize project structure with frontend, backend, and shared directories
- **Acceptance Criteria**:
  - [ ] Project root structure created
  - [ ] Frontend initialized with React/Next.js + TypeScript
  - [ ] Backend initialized with Node.js/Express + TypeScript
  - [ ] Shared types package created
  - [ ] SQLite + vector extension configured
- **Owner**: @coder
- **Reference**: AI Town `convex/` structure

### Task 1.2: Database Schema Design
- **Priority**: P0
- **Estimate**: 4 hours
- **Description**: Design database schema based on AI Town architecture
- **Tables**:
  - `employees` - AI员工信息
  - `teams` - 团队信息
  - `team_members` - 团队成员关系
  - `tasks` - 任务信息
  - `conversations` - 对话记录
  - `messages` - 消息记录
  - `work_products` - 工作成果
  - `memories` - 记忆存储
  - `memory_embeddings` - 记忆向量
  - `agents` - Agent配置
- **Acceptance Criteria**:
  - [ ] All tables created with correct schema
  - [ ] Vector index on memory_embeddings
  - [ ] Foreign key constraints enforced
- **Owner**: @coder
- **Reference**: AI Town `convex/schema.ts`, `convex/agent/schema.ts`

### Task 1.3: pi-mono Integration
- **Priority**: P0
- **Estimate**: 4 hours
- **Description**: Integrate pi-mono as the core agent framework
- **Acceptance Criteria**:
  - [ ] pi-mono installed and configured
  - [ ] Agent configuration interface defined
  - [ ] Agent registry singleton
  - [ ] LLM provider abstraction (OpenAI/Ollama/Together)
- **Owner**: @coder
- **Reference**: AI Town `convex/util/llm.ts`

---

## Sprint 2: Core Entity Management (CRUD)

### Task 2.1: Employee CRUD API
- **Priority**: P0
- **Estimate**: 6 hours
- **Description**: Implement REST APIs for AI employee management
- **API Endpoints**:
  - POST /api/employees - Create employee
  - GET /api/employees - List employees
  - GET /api/employees/:id - Get employee
  - PUT /api/employees/:id - Update employee
  - DELETE /api/employees/:id - Delete employee
- **Acceptance Criteria**:
  - [ ] CRUD operations work correctly
  - [ ] Employee-Agent mapping (创建员工时创建对应Agent)
- **Owner**: @coder

### Task 2.2: Team CRUD API
- **Priority**: P0
- **Estimate**: 6 hours
- **Description**: Implement REST APIs for team management
- **API Endpoints**:
  - POST /api/teams - Create team
  - GET /api/teams - List teams
  - GET /api/teams/:id - Get team with members
  - PUT /api/teams/:id - Update team
  - DELETE /api/teams/:id - Delete team
  - POST /api/teams/:id/members - Add member
  - DELETE /api/teams/:id/members/:employeeId - Remove member
- **Acceptance Criteria**:
  - [ ] Team CRUD + member management works
- **Owner**: @coder

### Task 2.3: Task Management API
- **Priority**: P0
- **Estimate**: 6 hours
- **Description**: Implement task assignment and tracking APIs
- **API Endpoints**:
  - POST /api/tasks - Create/assign task (to employee or team)
  - GET /api/tasks - List tasks (filter by assignee, status)
  - GET /api/tasks/:id - Get task details
  - PUT /api/tasks/:id - Update task
  - DELETE /api/tasks/:id - Delete task
- **Task Status**: pending → in_progress → completed/failed
- **Acceptance Criteria**:
  - [ ] Tasks can be assigned to individuals or teams
  - [ ] Status transitions tracked
- **Owner**: @coder

---

## Sprint 3: Agent Core (pi-mono)

### Task 3.1: Agent Instance Management
- **Priority**: P0
- **Estimate**: 6 hours
- **Description**: Create and manage AI agent instances
- **Agent Configuration**:
  ```typescript
  interface AgentConfig {
    identity: string      // 身份描述: "我是Alice，后端工程师"
    plan: string          // 当前目标: "完成API文档"
    model: string         // 使用的模型
    temperature: number   // 生成温度
  }
  ```
- **Acceptance Criteria**:
  - [ ] Dynamic agent creation from employee records
  - [ ] Agent state persistence
  - [ ] Agent lifecycle management
- **Owner**: @coder
- **Reference**: AI Town `agentDescription` concept

### Task 3.2: Memory System (记忆系统)
- **Priority**: P0
- **Estimate**: 8 hours
- **Description**: Implement vector-based memory system
- **Memory Types**:
  - `conversation` - 对话记忆
  - `task` - 任务相关记忆
  - `reflection` - 反思记忆（高阶洞察）
- **Acceptance Criteria**:
  - [ ] Store memories with embeddings
  - [ ] Vector search for memory retrieval
  - [ ] Ranking: relevance + recency + importance
  - [ ] Memory importance calculation via LLM
- **Owner**: @coder
- **Reference**: AI Town `convex/agent/memory.ts`

### Task 3.3: Reflection System (反思机制)
- **Priority**: P1
- **Estimate**: 6 hours
- **Description**: Agents reflect on memories to generate insights
- **Flow**:
  1. Collect recent important memories
  2. LLM analyzes patterns
  3. Generate high-level insights
  4. Store as `reflection` type memory
- **Acceptance Criteria**:
  - [ ] Periodic reflection triggered
  - [ ] LLM generates insights from memories
  - [ ] Reflection memories stored separately
- **Owner**: @coder
- **Reference**: AI Town `reflectOnMemories()` function

### Task 3.4: Conversation System (对话系统)
- **Priority**: P0
- **Estimate**: 8 hours
- **Description**: Enable inter-agent communication
- **Conversation Flow**:
  - `startConversation()` - 发起对话，生成开场白
  - `continueConversation()` - 继续对话
  - `leaveConversation()` - 结束对话，生成告别语
- **Prompt Construction**:
  - Agent identity + plan
  - Related memories
  - Previous conversation history
  - Current context
- **Acceptance Criteria**:
  - [ ] Agents can initiate conversations
  - [ ] Messages stored with timestamps
  - [ ] Conversation generates memory
  - [ ] Context-aware response generation
- **Owner**: @coder
- **Reference**: AI Town `convex/agent/conversation.ts`

### Task 3.5: Task Execution Engine
- **Priority**: P0
- **Estimate**: 8 hours
- **Description**: Execute tasks assigned to agents
- **Flow**:
  1. Parse task description
  2. Retrieve relevant memories
  3. Generate execution plan
  4. Execute and store result
  5. Generate work product if applicable
- **Acceptance Criteria**:
  - [ ] Task assignment triggers execution
  - [ ] Relevant memories retrieved
  - [ ] Result stored in task record
  - [ ] Work products created
  - [ ] Timeout and retry handling
- **Owner**: @coder

### Task 3.6: Team Orchestration
- **Priority**: P1
- **Estimate**: 6 hours
- **Description**: Coordinate task distribution across team members
- **Features**:
  - Team-level task assignment
  - Task distribution strategy
  - Team chat room
  - Shared team context
- **Acceptance Criteria**:
  - [ ] Team tasks distributed to members
  - [ ] Team communication channel
  - [ ] Team goal tracking
- **Owner**: @coder

---

## Sprint 4: Communication & Logging

### Task 4.1: Message Logging System
- **Priority**: P0
- **Estimate**: 4 hours
- **Description**: Log all agent conversations
- **Features**:
  - All messages logged with timestamp
  - Participant tracking
  - Searchable by participant/time
- **Acceptance Criteria**:
  - [ ] All messages persisted
  - [ ] Conversation history API
  - [ ] Pagination support
- **Owner**: @coder

### Task 4.2: Conversation History API
- **Priority**: P1
- **Estimate**: 4 hours
- **Description**: API for viewing conversation history
- **Endpoints**:
  - GET /api/conversations/:participantId
  - GET /api/conversations/room/:roomId
  - Search with filters
- **Acceptance Criteria**:
  - [ ] Full conversation thread viewable
  - [ ] Date range filtering
  - [ ] Export conversation
- **Owner**: @coder

---

## Sprint 5: Work Product Management

### Task 5.1: File Storage System
- **Priority**: P0
- **Estimate**: 4 hours
- **Description**: Store AI agent work products
- **Features**:
  - File upload from task execution
  - Metadata storage
  - Version tracking
- **Acceptance Criteria**:
  - [ ] Files stored securely
  - [ ] Metadata indexed
  - [ ] Version history
- **Owner**: @coder

### Task 5.2: Work Product API
- **Priority**: P0
- **Estimate**: 4 hours
- **Description**: API for work product management
- **Endpoints**:
  - GET /api/work-products - List products
  - GET /api/work-products/:id - Get details
  - GET /api/work-products/:id/download - Download
  - DELETE /api/work-products/:id - Delete
  - Filter by employee/team/task
- **Acceptance Criteria**:
  - [ ] Browse and filter products
  - [ ] Preview supported types
  - [ ] Download functionality
- **Owner**: @coder

---

## Sprint 6: Frontend

> **Design Requirement**: 简约·高级 (Minimalist Premium)
> - Dark theme, low saturation
> - Generous whitespace
> - Smooth micro-animations
> - Card-based design, 8-16px border radius

### Task 6.1: Frontend Setup & Design System
- **Priority**: P0
- **Estimate**: 3 hours
- **Description**: Initialize React project with design system
- **Design Tokens**:
  - Colors: Deep dark (#0f0f1a), accent (#6366f1)
  - Typography: Inter font family
  - Spacing: 4px base unit
  - Shadows: Layered depth
- **Components**: Button, Input, Card, Badge, Modal, Avatar
- **Acceptance Criteria**:
  - [ ] Design system implemented
  - [ ] Base components built
  - [ ] Framer Motion animations
  - [ ] Lucide icons
- **Owner**: @coder

### Task 6.2: Employee Management UI
- **Priority**: P0
- **Estimate**: 6 hours
- **Description**: UI for creating/managing AI employees
- **Features**:
  - Employee list view
  - Create/edit form (name, role, identity, plan)
  - Employee profile with memory viewer
  - Status indicator
- **Acceptance Criteria**:
  - [ ] Full CRUD UI
  - [ ] Agent config editing
  - [ ] Memory visualization (optional)
- **Owner**: @coder

### Task 6.3: Team Management UI
- **Priority**: P0
- **Estimate**: 6 hours
- **Description**: UI for creating/managing teams
- **Features**:
  - Team list view
  - Create/edit team
  - Add/remove members
  - Team chat interface
- **Acceptance Criteria**:
  - [ ] Full CRUD UI
  - [ ] Member management
  - [ ] Team conversation view
- **Owner**: @coder

### Task 6.4: Task Assignment UI
- **Priority**: P0
- **Estimate**: 6 hours
- **Description**: UI for assigning and tracking tasks
- **Features**:
  - Task list with filters
  - Create task (select assignee)
  - Task detail with status
  - Task execution progress
- **Acceptance Criteria**:
  - [ ] Assign to employee or team
  - [ ] Status tracking
  - [ ] Result viewer
- **Owner**: @coder

### Task 6.5: Conversation Viewer UI
- **Priority**: P1
- **Estimate**: 6 hours
- **Description**: UI for viewing conversation history
- **Features**:
  - Conversation list
  - Thread view
  - Search functionality
  - Memory indicators
- **Acceptance Criteria**:
  - [ ] Chronological message view
  - [ ] Search conversations
  - [ ] Participant filter
- **Owner**: @coder

### Task 6.6: Work Products Browser UI
- **Priority**: P1
- **Estimate**: 6 hours
- **Description**: UI for browsing work products
- **Features**:
  - Product grid/list view
  - Filter by creator/task
  - Preview for text files
  - Download button
- **Acceptance Criteria**:
  - [ ] Browse products
  - [ ] Preview/download
  - [ ] Delete products
- **Owner**: @coder

---

## Sprint 7: Integration & Polish

### Task 7.1: End-to-End Integration
- **Priority**: P0
- **Estimate**: 8 hours
- **Description**: Connect frontend with backend, test full workflows
- **Test Scenarios**:
  1. Create employee → Agent responds to chat
  2. Create team → Add members → Assign team task
  3. Agent executes task → Result stored → Work product created
  4. Conversations generate memories
- **Acceptance Criteria**:
  - [ ] All features work together
  - [ ] Memory system integrated
  - [ ] Work products downloadable
- **Owner**: @test

### Task 7.2: Error Handling & Edge Cases
- **Priority**: P1
- **Estimate**: 4 hours
- **Description**: Handle errors and edge cases
- **Scenarios**:
  - Agent timeout handling
  - Failed task retry
  - Invalid input validation
  - Empty states
- **Acceptance Criteria**:
  - [ ] Graceful error handling
  - [ ] Retry logic
  - [ ] User-friendly error messages
- **Owner**: @coder

### Task 7.3: UI Polish
- **Priority**: P2
- **Estimate**: 4 hours
- **Description**: Final UI/UX polish
- **Tasks**:
  - Loading states
  - Transition animations
  - Responsive layout
  - Accessibility
- **Acceptance Criteria**:
  - [ ] Polished UI
  - [ ] Smooth animations
  - [ ] Mobile responsive
- **Owner**: @coder

---

## Task Dependencies

```
Sprint 1 (Foundation)
├── TASK-1.1 ──┬── TASK-1.2 ──┬── TASK-1.3
              │              │
              │              └── TASK-2.1 ──┬── TASK-2.2 ──┬── TASK-2.3
              │                           │              │
              │                           │              └── TASK-3.6 (Team Orchestration)
              │                           │
              │                           └── TASK-3.1 ──┬── TASK-3.2 (Memory)
              │                                        │
              │                                        ├── TASK-3.3 (Reflection)
              │                                        │
              │                                        ├── TASK-3.4 (Conversation)
              │                                        │
              │                                        └── TASK-3.5 (Task Execution)
              │
              └── TASK-4.1 ──┬── TASK-4.2
                             │
                             └── TASK-5.1 ──┬── TASK-5.2
                                            │
                                            └── TASK-6.x (Frontend) ──┬── TASK-7.1
                                                                       │
                                                                       ├── TASK-7.2
                                                                       │
                                                                       └── TASK-7.3
```

---

## Total Estimated Hours

| Phase | Hours |
|-------|-------|
| Sprint 1: Project Foundation | 10h |
| Sprint 2: Core Entity Management | 18h |
| Sprint 3: Agent Core (pi-mono) | 42h |
| Sprint 4: Communication Logging | 8h |
| Sprint 5: Work Product Management | 8h |
| Sprint 6: Frontend | 33h |
| Sprint 7: Integration & Polish | 16h |
| **Total** | **135h** |

---

## Key Differences from Initial Design (Based on AI Town)

| Feature | Initial Design | AI Town-Inspired Design |
|---------|---------------|-------------------------|
| Memory | Basic storage | Vector search + ranking |
| Reflection | None | LLM-generated insights |
| Conversation | Simple chat | Context-aware with memories |
| Agent Definition | Just role | Identity + Plan + Memory |
| Simulation | Request-driven | Time-driven engine |
| Task Distribution | Direct assign | Team orchestration |
