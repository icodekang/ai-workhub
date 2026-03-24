# Task 1.3: Database Schema Design

## Metadata
| Field | Value |
|-------|-------|
| **Task ID** | TASK-1.3 |
| **Title** | Database Schema Design |
| **Priority** | P0 |
| **Estimate** | 3 hours |
| **Owner** | @coder |
| **Status** | TODO |
| **Created** | 2026-03-24 |
| **Sprint** | 1 |
| **Dependencies** | TASK-1.1 |

## Description
Design and implement the database schema for AI-WorkHub using SQLite. The schema covers employees, teams, tasks, conversations, and work products.

## Requirements

### 1. Database Setup
- Install SQLite dependencies: `better-sqlite3` or `sql.js`
- Create database initialization module
- Setup database file path: `backend/data/ai-workhub.db`

### 2. Table Schemas

#### employees
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | TEXT | PRIMARY KEY | UUID |
| name | TEXT | NOT NULL | Employee name |
| role | TEXT | NOT NULL | Job title/role |
| system_prompt | TEXT | | Agent system prompt |
| model | TEXT | DEFAULT 'gpt-4' | AI model to use |
| temperature | REAL | DEFAULT 0.7 | AI temperature |
| status | TEXT | DEFAULT 'inactive' | inactive/active/busy |
| created_at | INTEGER | NOT NULL | Unix timestamp |
| updated_at | INTEGER | NOT NULL | Unix timestamp |

#### teams
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | TEXT | PRIMARY KEY | UUID |
| name | TEXT | NOT NULL | Team name |
| description | TEXT | | Team description |
| created_at | INTEGER | NOT NULL | Unix timestamp |
| updated_at | INTEGER | NOT NULL | Unix timestamp |

#### team_members
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| team_id | TEXT | FK teams(id) | Team reference |
| employee_id | TEXT | FK employees(id) | Employee reference |
| role | TEXT | DEFAULT 'member' | member/leader |
| added_at | INTEGER | NOT NULL | Unix timestamp |
| PRIMARY KEY | (team_id, employee_id) | | |

#### tasks
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | TEXT | PRIMARY KEY | UUID |
| title | TEXT | NOT NULL | Task title |
| description | TEXT | | Task description |
| assignee_type | TEXT | NOT NULL | 'employee' or 'team' |
| assignee_id | TEXT | NOT NULL | employee_id or team_id |
| status | TEXT | DEFAULT 'pending' | pending/in_progress/completed/failed |
| result | TEXT | | Task execution result |
| created_at | INTEGER | NOT NULL | Unix timestamp |
| updated_at | INTEGER | NOT NULL | Unix timestamp |
| completed_at | INTEGER | | Unix timestamp |

#### conversations
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | TEXT | PRIMARY KEY | UUID |
| room_type | TEXT | NOT NULL | 'direct' or 'team' |
| room_id | TEXT | NOT NULL | direct_room_id or team_id |
| created_at | INTEGER | NOT NULL | Unix timestamp |

#### messages
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | TEXT | PRIMARY KEY | UUID |
| conversation_id | TEXT | FK conversations(id) | Conversation reference |
| sender_type | TEXT | NOT NULL | 'user' or 'agent' |
| sender_id | TEXT | NOT NULL | user_id or employee_id |
| content | TEXT | NOT NULL | Message content |
| created_at | INTEGER | NOT NULL | Unix timestamp |

#### work_products
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | TEXT | PRIMARY KEY | UUID |
| task_id | TEXT | FK tasks(id) | Task reference |
| employee_id | TEXT | FK employees(id) | Creator employee |
| filename | TEXT | NOT NULL | Original filename |
| filepath | TEXT | NOT NULL | Stored file path |
| mime_type | TEXT | | File MIME type |
| size_bytes | INTEGER | | File size |
| version | INTEGER | DEFAULT 1 | Version number |
| created_at | INTEGER | NOT NULL | Unix timestamp |

### 3. Database Access Layer
Create `backend/src/storage/db.ts` with:
- Database connection singleton
- Helper functions for common queries
- Transaction support

### 4. Migration System
- Create initial migration script
- Support future schema migrations

## Acceptance Criteria
- [ ] SQLite database initialized and connectable
- [ ] All 7 tables created with correct schema
- [ ] Foreign key constraints enforced
- [ ] Indexes created for frequently queried columns
- [ ] Database access layer provides CRUD helpers
- [ ] Initial migration runs without errors

## Files to Create/Modify
```
backend/src/storage/
├── db.ts
├── schema.sql
└── migrations/
    └── 001-initial.sql

backend/data/
└── (ai-workhub.db created at runtime)
```

## Technical Notes
- Use UUIDs for all primary keys
- Store timestamps as Unix integers for portability
- Enable foreign keys in SQLite: `PRAGMA foreign_keys = ON`
- Consider using an ORM like Prisma or Drizzle for type safety (optional)

## Definition of Done
1. Database file created at expected path
2. All tables exist with correct schema (verify with `.schema` command)
3. Basic CRUD operations work for employees table
4. Foreign key constraints prevent orphaned records
5. Migrations can be run multiple times safely (idempotent)
