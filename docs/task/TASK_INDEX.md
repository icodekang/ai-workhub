# Task Index - AI-WorkHub

All tasks for the AI-WorkHub project are documented here.

## Quick Reference

| Task ID | Title | Priority | Sprint | Status | Dependencies |
|---------|-------|----------|--------|--------|--------------|
| [TASK-1.1](./tasks/TASK-1.1-PROJECT-STRUCTURE.md) | Project Structure Setup | P0 | 1 | TODO | - |
| [TASK-1.2](./tasks/TASK-1.2-PI-MONO-INTEGRATION.md) | pi-mono Integration | P0 | 1 | TODO | TASK-1.1 |
| [TASK-1.3](./tasks/TASK-1.3-DATABASE-SCHEMA.md) | Database Schema Design | P0 | 1 | TODO | TASK-1.1 |
| [TASK-2.1](./tasks/TASK-2.1-EMPLOYEE-CRUD.md) | AI Employee CRUD API | P0 | 2 | TODO | TASK-1.3 |
| [TASK-2.2](./tasks/TASK-2.2-TEAM-CRUD.md) | AI Team CRUD API | P0 | 2 | TODO | TASK-1.3, TASK-2.1 |
| [TASK-2.3](./tasks/TASK-2.3-TASK-MANAGEMENT.md) | Task Management API | P0 | 2 | TODO | TASK-1.3, TASK-2.1, TASK-2.2 |

## Sprint Overview

### Sprint 1: Project Foundation (~9h)
- [TASK-1.1](./tasks/TASK-1.1-PROJECT-STRUCTURE.md) - Project structure setup (2h)
- [TASK-1.2](./tasks/TASK-1.2-PI-MONO-INTEGRATION.md) - pi-mono integration (4h)
- [TASK-1.3](./tasks/TASK-1.3-DATABASE-SCHEMA.md) - Database schema (3h)

### Sprint 2: Core Entity Management (~18h)
- [TASK-2.1](./tasks/TASK-2.1-EMPLOYEE-CRUD.md) - Employee CRUD API (6h)
- [TASK-2.2](./tasks/TASK-2.2-TEAM-CRUD.md) - Team CRUD API (6h)
- [TASK-2.3](./tasks/TASK-2.3-TASK-MANAGEMENT.md) - Task Management API (6h)

## Documentation Structure

```
docs/
├── task/
│   ├── README.md          # This file
│   ├── PROJECT_OVERVIEW.md # Project overview
│   ├── TASK_BACKLOG.md    # Full task backlog with details
│   └── tasks/
│       ├── TASK-1.1-PROJECT-STRUCTURE.md
│       ├── TASK-1.2-PI-MONO-INTEGRATION.md
│       ├── TASK-1.3-DATABASE-SCHEMA.md
│       ├── TASK-2.1-EMPLOYEE-CRUD.md
│       ├── TASK-2.2-TEAM-CRUD.md
│       └── TASK-2.3-TASK-MANAGEMENT.md
```

## How to Use This Index

1. **Start Development**: Pick the first available task (TASK-1.1)
2. **Track Progress**: Update task status as you work
3. **Check Dependencies**: Ensure prerequisite tasks are complete
4. **Estimate**: Use hour estimates for sprint planning

## Git Commit Convention

All task completions should be committed with:
```
feat: complete TASK-X.X - Title
```

Example:
```
feat: complete TASK-1.1 - Project Structure Setup
```

## Next Steps

After completing Sprint 1 and 2 tasks, proceed to:
- Sprint 3: Agent Core (pi-mono) - Tasks 3.1-3.4
- Sprint 4: Communication Logging - Tasks 4.1-4.2
- Sprint 5: Work Product Management - Tasks 5.1-5.2
- Sprint 6: Frontend - Tasks 6.1-6.6
- Sprint 7: Integration & Polish - Tasks 7.1-7.3
