# Task Index - AI-WorkHub

> 基于 AI Town (a16z-infra/ai-town) 架构重新设计

## Quick Reference

| Task ID | Title | Priority | Sprint | Status | Dependencies |
|---------|-------|----------|--------|--------|--------------|
| [TASK-1.1](./tasks/TASK-1.1-PROJECT-STRUCTURE.md) | Project Structure Setup | P0 | 1 | TODO | - |
| [TASK-1.2](./tasks/TASK-1.2-DATABASE-SCHEMA.md) | Database Schema Design | P0 | 1 | TODO | TASK-1.1 |
| [TASK-1.3](./tasks/TASK-1.3-PI-MONO-INTEGRATION.md) | pi-mono Integration & LLM | P0 | 1 | TODO | TASK-1.1 |
| [TASK-2.1](./tasks/TASK-2.1-EMPLOYEE-CRUD.md) | AI Employee CRUD API | P0 | 2 | TODO | TASK-1.2 |
| [TASK-2.2](./tasks/TASK-2.2-TEAM-CRUD.md) | AI Team CRUD API | P0 | 2 | TODO | TASK-1.2, TASK-2.1 |
| [TASK-2.3](./tasks/TASK-2.3-TASK-MANAGEMENT.md) | Task Management API | P0 | 2 | TODO | TASK-1.2, TASK-2.1, TASK-2.2 |
| [TASK-3.1](./tasks/TASK-3.1-AGENT-MANAGEMENT.md) | Agent Instance Management | P0 | 3 | TODO | TASK-1.3 |
| [TASK-3.2](./tasks/TASK-3.2-MEMORY-SYSTEM.md) | Memory System | P0 | 3 | TODO | TASK-1.2, TASK-1.3 |
| [TASK-3.3](./tasks/TASK-3.3-REFLECTION-SYSTEM.md) | Reflection System | P1 | 3 | TODO | TASK-3.2 |
| [TASK-3.4](./tasks/TASK-3.4-CONVERSATION-SYSTEM.md) | Conversation System | P0 | 3 | TODO | TASK-3.1, TASK-3.2 |
| [TASK-3.5](./tasks/TASK-3.5-TASK-EXECUTION.md) | Task Execution Engine | P0 | 3 | TODO | TASK-3.1, TASK-3.2 |
| [TASK-3.6](./tasks/TASK-3.6-TEAM-ORCHESTRATION.md) | Team Orchestration | P1 | 3 | TODO | TASK-2.2, TASK-3.1 |
| [TASK-4.1](./tasks/TASK-4.1-MESSAGE-LOGGING.md) | Message Logging System | P0 | 4 | TODO | TASK-3.4 |
| [TASK-4.2](./tasks/TASK-4.2-CONVERSATION-HISTORY-API.md) | Conversation History API | P1 | 4 | TODO | TASK-4.1 |
| [TASK-5.1](./tasks/TASK-5.1-FILE-STORAGE.md) | File Storage System | P0 | 5 | TODO | TASK-3.5 |
| [TASK-5.2](./tasks/TASK-5.2-WORK-PRODUCT-API.md) | Work Product API | P0 | 5 | TODO | TASK-5.1 |
| [TASK-6.1](./tasks/TASK-6.1-FRONTEND-SETUP.md) | Frontend Setup & Design System | P0 | 6 | TODO | TASK-2.3 |
| [TASK-6.2](./tasks/TASK-6.2-EMPLOYEE-MANAGEMENT-UI.md) | Employee Management UI | P0 | 6 | TODO | TASK-6.1 |
| [TASK-6.3](./tasks/TASK-6.3-TEAM-MANAGEMENT-UI.md) | Team Management UI | P0 | 6 | TODO | TASK-6.1 |
| [TASK-6.4](./tasks/TASK-6.4-TASK-ASSIGNMENT-UI.md) | Task Assignment UI | P0 | 6 | TODO | TASK-6.1 |
| [TASK-6.5](./tasks/TASK-6.5-CONVERSATION-VIEWER-UI.md) | Conversation Viewer UI | P1 | 6 | TODO | TASK-6.1 |
| [TASK-6.6](./tasks/TASK-6.6-WORK-PRODUCTS-UI.md) | Work Products Browser UI | P1 | 6 | TODO | TASK-6.1 |
| [TASK-7.1](./tasks/TASK-7.1-E2E-INTEGRATION.md) | End-to-End Integration | P0 | 7 | TODO | TASK-6.6 |
| [TASK-7.2](./tasks/TASK-7.2-ERROR-HANDLING.md) | Error Handling & Edge Cases | P1 | 7 | TODO | TASK-7.1 |
| [TASK-7.3](./tasks/TASK-7.3-UI-POLISH.md) | UI Polish | P2 | 7 | TODO | TASK-7.1 |

---

## Sprint Overview

### Sprint 1: Project Foundation (~10h)
| Task | Description | Hours | Dependencies |
|------|-------------|-------|---------------|
| [TASK-1.1](./tasks/TASK-1.1-PROJECT-STRUCTURE.md) | Project Structure Setup | 2h | - |
| [TASK-1.2](./tasks/TASK-1.2-DATABASE-SCHEMA.md) | Database Schema Design | 4h | TASK-1.1 |
| [TASK-1.3](./tasks/TASK-1.3-PI-MONO-INTEGRATION.md) | pi-mono Integration & LLM | 4h | TASK-1.1 |

### Sprint 2: Core Entity Management (~18h)
| Task | Description | Hours | Dependencies |
|------|-------------|-------|---------------|
| [TASK-2.1](./tasks/TASK-2.1-EMPLOYEE-CRUD.md) | Employee CRUD API | 6h | TASK-1.2 |
| [TASK-2.2](./tasks/TASK-2.2-TEAM-CRUD.md) | Team CRUD API | 6h | TASK-1.2, TASK-2.1 |
| [TASK-2.3](./tasks/TASK-2.3-TASK-MANAGEMENT.md) | Task Management API | 6h | TASK-1.2, TASK-2.1, TASK-2.2 |

### Sprint 3: Agent Core (~42h)
| Task | Description | Hours | Dependencies |
|------|-------------|-------|---------------|
| [TASK-3.1](./tasks/TASK-3.1-AGENT-MANAGEMENT.md) | Agent Instance Management | 6h | TASK-1.3 |
| [TASK-3.2](./tasks/TASK-3.2-MEMORY-SYSTEM.md) | Memory System | 8h | TASK-1.2, TASK-1.3 |
| [TASK-3.3](./tasks/TASK-3.3-REFLECTION-SYSTEM.md) | Reflection System | 6h | TASK-3.2 |
| [TASK-3.4](./tasks/TASK-3.4-CONVERSATION-SYSTEM.md) | Conversation System | 8h | TASK-3.1, TASK-3.2 |
| [TASK-3.5](./tasks/TASK-3.5-TASK-EXECUTION.md) | Task Execution Engine | 8h | TASK-3.1, TASK-3.2 |
| [TASK-3.6](./tasks/TASK-3.6-TEAM-ORCHESTRATION.md) | Team Orchestration | 6h | TASK-2.2, TASK-3.1 |

### Sprint 4: Communication Logging (~8h)
| Task | Description | Hours | Dependencies |
|------|-------------|-------|---------------|
| [TASK-4.1](./tasks/TASK-4.1-MESSAGE-LOGGING.md) | Message Logging System | 4h | TASK-3.4 |
| [TASK-4.2](./tasks/TASK-4.2-CONVERSATION-HISTORY-API.md) | Conversation History API | 4h | TASK-4.1 |

### Sprint 5: Work Product Management (~8h)
| Task | Description | Hours | Dependencies |
|------|-------------|-------|---------------|
| [TASK-5.1](./tasks/TASK-5.1-FILE-STORAGE.md) | File Storage System | 4h | TASK-3.5 |
| [TASK-5.2](./tasks/TASK-5.2-WORK-PRODUCT-API.md) | Work Product API | 4h | TASK-5.1 |

### Sprint 6: Frontend (~33h)
| Task | Description | Hours | Dependencies |
|------|-------------|-------|---------------|
| [TASK-6.1](./tasks/TASK-6.1-FRONTEND-SETUP.md) | Frontend Setup & Design System | 3h | TASK-2.3 |
| [TASK-6.2](./tasks/TASK-6.2-EMPLOYEE-MANAGEMENT-UI.md) | Employee Management UI | 6h | TASK-6.1 |
| [TASK-6.3](./tasks/TASK-6.3-TEAM-MANAGEMENT-UI.md) | Team Management UI | 6h | TASK-6.1 |
| [TASK-6.4](./tasks/TASK-6.4-TASK-ASSIGNMENT-UI.md) | Task Assignment UI | 6h | TASK-6.1 |
| [TASK-6.5](./tasks/TASK-6.5-CONVERSATION-VIEWER-UI.md) | Conversation Viewer UI | 6h | TASK-6.1 |
| [TASK-6.6](./tasks/TASK-6.6-WORK-PRODUCTS-UI.md) | Work Products Browser UI | 6h | TASK-6.1 |

### Sprint 7: Integration & Polish (~16h)
| Task | Description | Hours | Dependencies |
|------|-------------|-------|---------------|
| [TASK-7.1](./tasks/TASK-7.1-E2E-INTEGRATION.md) | End-to-End Integration | 8h | TASK-6.6 |
| [TASK-7.2](./tasks/TASK-7.2-ERROR-HANDLING.md) | Error Handling & Edge Cases | 4h | TASK-7.1 |
| [TASK-7.3](./tasks/TASK-7.3-UI-POLISH.md) | UI Polish | 4h | TASK-7.1 |

---

## AI Town 核心参考文件

| AI Town 文件 | 功能 | AI-WorkHub 对应 Task |
|-------------|------|---------------------|
| `convex/util/llm.ts` | 多LLM提供商支持 | TASK-1.3 |
| `convex/schema.ts` | 数据库Schema | TASK-1.2 |
| `convex/agent/schema.ts` | 记忆类型定义 | TASK-1.2, TASK-3.2 |
| `convex/agent/memory.ts` | 记忆检索与排名 | TASK-3.2 |
| `convex/agent/conversation.ts` | 对话生成 | TASK-3.4 |
| `convex/engine/schema.ts` | 引擎定义 | TASK-3.5 |
| `convex/aiTown/schema.ts` | 世界/玩家/Agent结构 | TASK-2.1, TASK-3.1 |

---

## 开发流程

```
1. @pm 分配任务 → @coder 开发
2. @coder 完成 → commit + push dev
3. @pm 分配 → @review 代码审查
4. @review 发现问题 → @coder 修复
5. @pm 分配 → @test 测试
6. @test 发现问题 → 通知 @coder
7. 每个阶段完成后 → commit + push dev
```

## Git 提交规范

```
feat: 完成 TASK-X.X - 任务标题
fix: 修复 TASK-X.X - 问题描述
docs: 更新文档
refactor: 重构
```
