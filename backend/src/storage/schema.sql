-- AI-WorkHub Database Schema
-- Based on AI Town (a16z-infra/ai-town) architecture
-- SQLite with better-sqlite3

-- Enable foreign key constraints
PRAGMA foreign_keys = ON;

-- ============================================================
-- employees - AI员工信息
-- ============================================================
CREATE TABLE IF NOT EXISTS employees (
    id              TEXT PRIMARY KEY,
    name            TEXT NOT NULL,
    role            TEXT NOT NULL,
    identity        TEXT,
    plan            TEXT DEFAULT 'free',
    system_prompt   TEXT,
    model           TEXT DEFAULT 'gpt-4',
    temperature     REAL DEFAULT 0.7,
    status          TEXT DEFAULT 'inactive' CHECK(status IN ('inactive', 'active', 'busy')),
    created_at      INTEGER NOT NULL,
    updated_at      INTEGER NOT NULL
);

-- ============================================================
-- teams - 团队信息
-- ============================================================
CREATE TABLE IF NOT EXISTS teams (
    id              TEXT PRIMARY KEY,
    name            TEXT NOT NULL,
    description     TEXT,
    plan            TEXT DEFAULT 'free',
    created_at      INTEGER NOT NULL,
    updated_at      INTEGER NOT NULL
);

-- ============================================================
-- team_members - 团队成员关系
-- ============================================================
CREATE TABLE IF NOT EXISTS team_members (
    team_id         TEXT NOT NULL,
    employee_id     TEXT NOT NULL,
    role            TEXT DEFAULT 'member' CHECK(role IN ('member', 'leader')),
    added_at        INTEGER NOT NULL,
    PRIMARY KEY (team_id, employee_id),
    FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
);

-- ============================================================
-- tasks - 任务信息
-- ============================================================
CREATE TABLE IF NOT EXISTS tasks (
    id              TEXT PRIMARY KEY,
    title           TEXT NOT NULL,
    description     TEXT,
    status          TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'in_progress', 'completed', 'failed')),
    assignee_type   TEXT NOT NULL CHECK(assignee_type IN ('employee', 'team')),
    assignee_id     TEXT NOT NULL,
    result          TEXT,
    created_at      INTEGER NOT NULL,
    updated_at      INTEGER NOT NULL,
    completed_at    INTEGER
);

-- ============================================================
-- conversations - 对话记录
-- ============================================================
CREATE TABLE IF NOT EXISTS conversations (
    id              TEXT PRIMARY KEY,
    room_type       TEXT NOT NULL CHECK(room_type IN ('direct', 'team')),
    room_id         TEXT NOT NULL,
    created_at      INTEGER NOT NULL
);

-- ============================================================
-- messages - 消息记录
-- ============================================================
CREATE TABLE IF NOT EXISTS messages (
    id              TEXT PRIMARY KEY,
    conversation_id TEXT NOT NULL,
    sender_type     TEXT NOT NULL CHECK(sender_type IN ('user', 'agent')),
    sender_id       TEXT NOT NULL,
    content         TEXT NOT NULL,
    created_at      INTEGER NOT NULL,
    FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
);

-- ============================================================
-- work_products - 工作成果
-- ============================================================
CREATE TABLE IF NOT EXISTS work_products (
    id              TEXT PRIMARY KEY,
    task_id         TEXT,
    employee_id     TEXT,
    filename        TEXT NOT NULL,
    filepath        TEXT NOT NULL,
    mime_type       TEXT,
    size_bytes      INTEGER,
    version         INTEGER DEFAULT 1,
    created_at      INTEGER NOT NULL,
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE SET NULL,
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE SET NULL
);

-- ============================================================
-- memories - 记忆存储
-- ============================================================
CREATE TABLE IF NOT EXISTS memories (
    id              TEXT PRIMARY KEY,
    employee_id     TEXT NOT NULL,
    type            TEXT NOT NULL CHECK(type IN ('episodic', 'semantic', 'working')),
    content         TEXT NOT NULL,
    importance      REAL DEFAULT 0.5 CHECK(importance >= 0 AND importance <= 1),
    created_at      INTEGER NOT NULL,
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
);

-- ============================================================
-- memory_embeddings - 记忆向量 (带 Vector Index)
-- ============================================================
CREATE TABLE IF NOT EXISTS memory_embeddings (
    id              TEXT PRIMARY KEY,
    memory_id       TEXT NOT NULL,
    -- embedding stored as JSON array of floats
    -- e.g., '[0.123, -0.456, ...]'
    embedding       TEXT NOT NULL,
    created_at      INTEGER NOT NULL,
    FOREIGN KEY (memory_id) REFERENCES memories(id) ON DELETE CASCADE
);

-- ============================================================
-- agents - Agent配置
-- ============================================================
CREATE TABLE IF NOT EXISTS agents (
    id              TEXT PRIMARY KEY,
    employee_id     TEXT NOT NULL,
    config          TEXT NOT NULL,  -- JSON string with agent config
    status          TEXT DEFAULT 'idle' CHECK(status IN ('idle', 'working', 'chatting', 'error', 'paused', 'stopped')),
    created_at      INTEGER NOT NULL,
    updated_at      INTEGER NOT NULL,
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
);

-- ============================================================
-- Indexes for frequently queried columns
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_employees_status ON employees(status);
CREATE INDEX IF NOT EXISTS idx_tasks_assignee ON tasks(assignee_type, assignee_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_type, sender_id);
CREATE INDEX IF NOT EXISTS idx_memories_employee ON memories(employee_id);
CREATE INDEX IF NOT EXISTS idx_memory_embeddings_memory ON memory_embeddings(memory_id);
CREATE INDEX IF NOT EXISTS idx_work_products_task ON work_products(task_id);
CREATE INDEX IF NOT EXISTS idx_work_products_employee ON work_products(employee_id);
CREATE INDEX IF NOT EXISTS idx_agents_employee ON agents(employee_id);

-- ============================================================
-- Vector Index on memory_embeddings (SQLite fts5 fallback)
-- Using fts5 to simulate vector search capability
-- ============================================================
-- Note: SQLite does not have native vector types.
-- For true vector search, embedding is stored as a JSON float array.
-- Applications should use a dedicated vector DB (e.g., Pinecone, Qdrant)
-- or load extensions like sqlite-vss.
--
-- Here we create an FTS5 virtual table to enable full-text search
-- on memory content (cross-reference via memory_id).
CREATE VIRTUAL TABLE IF NOT EXISTS memory_fts USING fts5(
    memory_id UNINDEXED,
    content,
    content='memories',
    content_rowid='rowid'
);

-- Trigger to keep memory_fts in sync with memories table
CREATE TRIGGER IF NOT EXISTS memory_fts_insert AFTER INSERT ON memories BEGIN
    INSERT INTO memory_fts(rowid, memory_id, content) VALUES (NEW.rowid, NEW.id, NEW.content);
END;

CREATE TRIGGER IF NOT EXISTS memory_fts_delete AFTER DELETE ON memories BEGIN
    INSERT INTO memory_fts(memory_fts, rowid, memory_id, content) VALUES('delete', OLD.rowid, OLD.id, OLD.content);
END;

CREATE TRIGGER IF NOT EXISTS memory_fts_update AFTER UPDATE ON memories BEGIN
    INSERT INTO memory_fts(memory_fts, rowid, memory_id, content) VALUES('delete', OLD.rowid, OLD.id, OLD.content);
    INSERT INTO memory_fts(rowid, memory_id, content) VALUES (NEW.rowid, NEW.id, NEW.content);
END;
