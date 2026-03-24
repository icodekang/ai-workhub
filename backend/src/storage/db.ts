/**
 * AI-WorkHub Database Access Layer
 * SQLite with better-sqlite3
 */

import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

declare const __dirname: string;
const DATA_DIR = path.resolve(__dirname, '../../../data');
const DB_PATH = process.env.DB_PATH || path.join(DATA_DIR, 'ai-workhub.db');
const SCHEMA_PATH = path.join(__dirname, 'schema.sql');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Singleton database connection
let _db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!_db) {
    _db = new Database(DB_PATH);
    // Enable foreign key constraints
    _db.pragma('foreign_keys = ON');
    // Enable WAL mode for better concurrency
    _db.pragma('journal_mode = WAL');
    console.log(`[DB] Connected to ${DB_PATH}`);
  }
  return _db;
}

export function closeDb(): void {
  if (_db) {
    _db.close();
    _db = null;
    console.log('[DB] Connection closed');
  }
}

/**
 * Initialize database by running schema SQL
 */
export function initDb(): void {
  const db = getDb();
  const schema = fs.readFileSync(SCHEMA_PATH, 'utf-8');
  db.exec(schema);
  console.log('[DB] Schema initialized');
}

/**
 * Run a migration SQL file
 */
export function runMigration(filePath: string): void {
  const db = getDb();
  const sql = fs.readFileSync(filePath, 'utf-8');
  db.exec(sql);
  console.log(`[DB] Migration applied: ${filePath}`);
}

// ============================================================
// Type Definitions
// ============================================================

export interface Employee {
  id: string;
  name: string;
  role: string;
  identity?: string;
  plan: string;
  system_prompt?: string;
  model: string;
  temperature: number;
  status: 'inactive' | 'active' | 'busy';
  created_at: number;
  updated_at: number;
}

export interface Team {
  id: string;
  name: string;
  description?: string;
  plan: string;
  created_at: number;
  updated_at: number;
}

export interface TeamMember {
  team_id: string;
  employee_id: string;
  role: 'member' | 'leader';
  added_at: number;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  assignee_type: 'employee' | 'team';
  assignee_id: string;
  result?: string;
  created_at: number;
  updated_at: number;
  completed_at?: number;
}

export interface Conversation {
  id: string;
  room_type: 'direct' | 'team';
  room_id: string;
  created_at: number;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_type: 'user' | 'agent';
  sender_id: string;
  content: string;
  created_at: number;
}

export interface WorkProduct {
  id: string;
  task_id?: string;
  employee_id?: string;
  filename: string;
  filepath: string;
  mime_type?: string;
  size_bytes?: number;
  version: number;
  created_at: number;
}

export interface Memory {
  id: string;
  employee_id: string;
  type: 'episodic' | 'semantic' | 'working' | 'conversation' | 'task' | 'reflection' | 'relationship';
  content: string;
  importance: number;
  last_access: number;
  created_at: number;
  data: string; // JSON string with type-specific data
}

export interface MemoryEmbedding {
  id: string;
  memory_id: string;
  embedding: string; // JSON array string: '[0.1, -0.2, ...]'
  created_at: number;
}

export interface Agent {
  id: string;
  employee_id: string;
  config: string; // JSON string
  status: 'idle' | 'working' | 'chatting' | 'error' | 'paused' | 'stopped';
  created_at: number;
  updated_at: number;
}

// ============================================================
// CRUD Helper Functions
// ============================================================

// --- Employees ---
export function createEmployee(emp: Omit<Employee, 'created_at' | 'updated_at'>): Employee {
  const db = getDb();
  const now = Date.now();
  const stmt = db.prepare(`
    INSERT INTO employees (id, name, role, identity, plan, system_prompt, model, temperature, status, created_at, updated_at)
    VALUES (@id, @name, @role, @identity, @plan, @system_prompt, @model, @temperature, @status, @created_at, @updated_at)
  `);
  stmt.run({ ...emp, created_at: now, updated_at: now });
  return getEmployeeById(emp.id)!;
}

export function getEmployeeById(id: string): Employee | undefined {
  return getDb().prepare('SELECT * FROM employees WHERE id = ?').get(id) as Employee | undefined;
}

export function getAllEmployees(): Employee[] {
  return getDb().prepare('SELECT * FROM employees ORDER BY created_at DESC').all() as Employee[];
}

export function updateEmployee(id: string, updates: Partial<Employee>): Employee | undefined {
  const db = getDb();
  const fields = Object.keys(updates).filter(k => k !== 'id' && k !== 'created_at');
  if (fields.length === 0) return getEmployeeById(id);
  const setClause = fields.map(f => `${f} = @${f}`).join(', ');
  const stmt = db.prepare(`UPDATE employees SET ${setClause}, updated_at = @updated_at WHERE id = @id`);
  stmt.run({ ...updates, id, updated_at: Date.now() });
  return getEmployeeById(id);
}

export function deleteEmployee(id: string): boolean {
  const result = getDb().prepare('DELETE FROM employees WHERE id = ?').run(id);
  return result.changes > 0;
}

// --- Teams ---
export function createTeam(team: Omit<Team, 'created_at' | 'updated_at'>): Team {
  const db = getDb();
  const now = Date.now();
  const stmt = db.prepare(`
    INSERT INTO teams (id, name, description, plan, created_at, updated_at)
    VALUES (@id, @name, @description, @plan, @created_at, @updated_at)
  `);
  stmt.run({ ...team, created_at: now, updated_at: now });
  return getTeamById(team.id)!;
}

export function getTeamById(id: string): Team | undefined {
  return getDb().prepare('SELECT * FROM teams WHERE id = ?').get(id) as Team | undefined;
}

export function getAllTeams(): Team[] {
  return getDb().prepare('SELECT * FROM teams ORDER BY created_at DESC').all() as Team[];
}

export function deleteTeam(id: string): boolean {
  const result = getDb().prepare('DELETE FROM teams WHERE id = ?').run(id);
  return result.changes > 0;
}

// --- Team Members ---
export function addTeamMember(teamId: string, employeeId: string, role: 'member' | 'leader' = 'member'): TeamMember {
  const db = getDb();
  const stmt = db.prepare(`
    INSERT OR IGNORE INTO team_members (team_id, employee_id, role, added_at)
    VALUES (@team_id, @employee_id, @role, @added_at)
  `);
  stmt.run({ team_id: teamId, employee_id: employeeId, role, added_at: Date.now() });
  return db.prepare('SELECT * FROM team_members WHERE team_id = ? AND employee_id = ?').get(teamId, employeeId) as TeamMember;
}

export function getTeamMembers(teamId: string): (TeamMember & { employee: Employee })[] {
  const db = getDb();
  return db.prepare(`
    SELECT tm.*, e.id as emp_id, e.name as emp_name, e.role as emp_role, e.status as emp_status
    FROM team_members tm
    JOIN employees e ON e.id = tm.employee_id
    WHERE tm.team_id = ?
  `).all(teamId) as any[];
}

export function removeTeamMember(teamId: string, employeeId: string): boolean {
  const result = getDb().prepare('DELETE FROM team_members WHERE team_id = ? AND employee_id = ?').run(teamId, employeeId);
  return result.changes > 0;
}

// --- Tasks ---
export function createTask(task: Omit<Task, 'created_at' | 'updated_at'>): Task {
  const db = getDb();
  const now = Date.now();
  const stmt = db.prepare(`
    INSERT INTO tasks (id, title, description, status, assignee_type, assignee_id, result, created_at, updated_at, completed_at)
    VALUES (@id, @title, @description, @status, @assignee_type, @assignee_id, @result, @created_at, @updated_at, @completed_at)
  `);
  stmt.run({ ...task, created_at: now, updated_at: now, completed_at: task.completed_at ?? null });
  return getTaskById(task.id)!;
}

export function getTaskById(id: string): Task | undefined {
  return getDb().prepare('SELECT * FROM tasks WHERE id = ?').get(id) as Task | undefined;
}

export function getTasksByAssignee(assigneeType: 'employee' | 'team', assigneeId: string): Task[] {
  return getDb().prepare(
    'SELECT * FROM tasks WHERE assignee_type = ? AND assignee_id = ? ORDER BY created_at DESC'
  ).all(assigneeType, assigneeId) as Task[];
}

export function getTasksByStatus(status: Task['status']): Task[] {
  return getDb().prepare('SELECT * FROM tasks WHERE status = ? ORDER BY created_at DESC').all(status) as Task[];
}

export function updateTask(id: string, updates: Partial<Task>): Task | undefined {
  const db = getDb();
  const now = Date.now();
  const allowed = ['title', 'description', 'status', 'result', 'completed_at'];
  const fields = allowed.filter(f => updates[f as keyof Task] !== undefined);
  if (fields.length === 0) return getTaskById(id);
  const setClause = fields.map(f => `${f} = @${f}`).join(', ');
  const stmt = db.prepare(`UPDATE tasks SET ${setClause}, updated_at = @updated_at WHERE id = @id`);
  stmt.run({ ...updates, id, updated_at: now });
  return getTaskById(id);
}

export function deleteTask(id: string): boolean {
  const result = getDb().prepare('DELETE FROM tasks WHERE id = ?').run(id);
  return result.changes > 0;
}

// --- Conversations ---
export function createConversation(conv: Omit<Conversation, 'created_at'>): Conversation {
  const db = getDb();
  const stmt = db.prepare(`
    INSERT INTO conversations (id, room_type, room_id, created_at)
    VALUES (@id, @room_type, @room_id, @created_at)
  `);
  stmt.run({ ...conv, created_at: Date.now() });
  return getConversationById(conv.id)!;
}

export function getConversationById(id: string): Conversation | undefined {
  return getDb().prepare('SELECT * FROM conversations WHERE id = ?').get(id) as Conversation | undefined;
}

export function getConversationsByRoom(roomType: string, roomId: string): Conversation[] {
  return getDb().prepare(
    'SELECT * FROM conversations WHERE room_type = ? AND room_id = ? ORDER BY created_at ASC'
  ).all(roomType, roomId) as Conversation[];
}

export function deleteConversation(id: string): boolean {
  const result = getDb().prepare('DELETE FROM conversations WHERE id = ?').run(id);
  return result.changes > 0;
}

// --- Messages ---
export function createMessage(msg: Omit<Message, 'created_at'>): Message {
  const db = getDb();
  const stmt = db.prepare(`
    INSERT INTO messages (id, conversation_id, sender_type, sender_id, content, created_at)
    VALUES (@id, @conversation_id, @sender_type, @sender_id, @content, @created_at)
  `);
  stmt.run({ ...msg, created_at: Date.now() });
  return getMessageById(msg.id)!;
}

export function getMessageById(id: string): Message | undefined {
  return getDb().prepare('SELECT * FROM messages WHERE id = ?').get(id) as Message | undefined;
}

export function getMessagesByConversation(conversationId: string): Message[] {
  return getDb().prepare(
    'SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at ASC'
  ).all(conversationId) as Message[];
}

export function deleteMessage(id: string): boolean {
  const result = getDb().prepare('DELETE FROM messages WHERE id = ?').run(id);
  return result.changes > 0;
}

// --- Work Products ---
export function createWorkProduct(wp: Omit<WorkProduct, 'created_at'>): WorkProduct {
  const db = getDb();
  const stmt = db.prepare(`
    INSERT INTO work_products (id, task_id, employee_id, filename, filepath, mime_type, size_bytes, version, created_at)
    VALUES (@id, @task_id, @employee_id, @filename, @filepath, @mime_type, @size_bytes, @version, @created_at)
  `);
  stmt.run({ ...wp, created_at: Date.now() });
  return getWorkProductById(wp.id)!;
}

export function getWorkProductById(id: string): WorkProduct | undefined {
  return getDb().prepare('SELECT * FROM work_products WHERE id = ?').get(id) as WorkProduct | undefined;
}

export function getWorkProductsByTask(taskId: string): WorkProduct[] {
  return getDb().prepare('SELECT * FROM work_products WHERE task_id = ? ORDER BY created_at DESC').all(taskId) as WorkProduct[];
}

export function getWorkProductsByEmployee(employeeId: string): WorkProduct[] {
  return getDb().prepare('SELECT * FROM work_products WHERE employee_id = ? ORDER BY created_at DESC').all(employeeId) as WorkProduct[];
}

export function deleteWorkProduct(id: string): boolean {
  const result = getDb().prepare('DELETE FROM work_products WHERE id = ?').run(id);
  return result.changes > 0;
}

// --- Memories ---
export function createMemory(mem: Omit<Memory, 'created_at'>): Memory {
  const db = getDb();
  const stmt = db.prepare(`
    INSERT INTO memories (id, employee_id, type, content, importance, last_access, created_at, data)
    VALUES (@id, @employee_id, @type, @content, @importance, @last_access, @created_at, @data)
  `);
  const now = Date.now();
  stmt.run({ ...mem, created_at: now, last_access: mem.last_access ?? now, data: mem.data ?? '{}' });
  return getMemoryById(mem.id)!;
}

export function getMemoryById(id: string): Memory | undefined {
  return getDb().prepare('SELECT * FROM memories WHERE id = ?').get(id) as Memory | undefined;
}

export function getMemoriesByEmployee(employeeId: string): Memory[] {
  return getDb().prepare(
    'SELECT * FROM memories WHERE employee_id = ? ORDER BY created_at DESC'
  ).all(employeeId) as Memory[];
}

export function updateMemoryLastAccess(id: string, timestamp?: number): boolean {
  const db = getDb();
  const ts = timestamp ?? Date.now();
  const result = db.prepare('UPDATE memories SET last_access = ? WHERE id = ?').run(ts, id);
  return result.changes > 0;
}

export function deleteMemory(id: string): boolean {
  const result = getDb().prepare('DELETE FROM memories WHERE id = ?').run(id);
  return result.changes > 0;
}

/**
 * Search memories using FTS5 full-text search
 * Note: This is a text search, not vector similarity search.
 * For true vector search, use a dedicated vector database.
 */
export function searchMemories(employeeId: string, query: string): Memory[] {
  const db = getDb();
  return db.prepare(`
    SELECT m.* FROM memories m
    JOIN memory_fts fts ON m.id = fts.memory_id
    WHERE fts.memory_fts MATCH ? AND m.employee_id = ?
    ORDER BY rank
  `).all(query, employeeId) as Memory[];
}

// --- Memory Embeddings ---
export function createMemoryEmbedding(emb: Omit<MemoryEmbedding, 'created_at'>): MemoryEmbedding {
  const db = getDb();
  const stmt = db.prepare(`
    INSERT INTO memory_embeddings (id, memory_id, embedding, created_at)
    VALUES (@id, @memory_id, @embedding, @created_at)
  `);
  stmt.run({ ...emb, created_at: Date.now() });
  return getMemoryEmbeddingById(emb.id)!;
}

export function getMemoryEmbeddingById(id: string): MemoryEmbedding | undefined {
  return getDb().prepare('SELECT * FROM memory_embeddings WHERE id = ?').get(id) as MemoryEmbedding | undefined;
}

export function getEmbeddingsByMemory(memoryId: string): MemoryEmbedding[] {
  return getDb().prepare('SELECT * FROM memory_embeddings WHERE memory_id = ?').all(memoryId) as MemoryEmbedding[];
}

export function deleteMemoryEmbedding(id: string): boolean {
  const result = getDb().prepare('DELETE FROM memory_embeddings WHERE id = ?').run(id);
  return result.changes > 0;
}

/**
 * Vector similarity search (application-level)
 * Loads all embeddings for an employee and computes cosine similarity.
 * For large-scale deployments, use a dedicated vector DB.
 */
export function searchMemoryByVector(
  employeeId: string,
  queryEmbedding: number[],
  topK: number = 5
): Array<{ memory: Memory; similarity: number }> {
  const memories = getMemoriesByEmployee(employeeId);
  const results: Array<{ memory: Memory; similarity: number }> = [];

  for (const mem of memories) {
    const embeddings = getEmbeddingsByMemory(mem.id);
    for (const emb of embeddings) {
      const vec: number[] = JSON.parse(emb.embedding);
      const similarity = cosineSimilarity(queryEmbedding, vec);
      results.push({ memory: mem, similarity });
    }
  }

  return results.sort((a, b) => b.similarity - a.similarity).slice(0, topK);
}

function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;
  let dot = 0, magA = 0, magB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }
  return dot / (Math.sqrt(magA) * Math.sqrt(magB));
}

// --- Agents ---
export function createAgent(agent: Omit<Agent, 'created_at' | 'updated_at'>): Agent {
  const db = getDb();
  const now = Date.now();
  const stmt = db.prepare(`
    INSERT INTO agents (id, employee_id, config, status, created_at, updated_at)
    VALUES (@id, @employee_id, @config, @status, @created_at, @updated_at)
  `);
  stmt.run({ ...agent, created_at: now, updated_at: now });
  return getAgentById(agent.id)!;
}

export function getAgentById(id: string): Agent | undefined {
  return getDb().prepare('SELECT * FROM agents WHERE id = ?').get(id) as Agent | undefined;
}

export function getAgentByEmployee(employeeId: string): Agent | undefined {
  return getDb().prepare('SELECT * FROM agents WHERE employee_id = ?').get(employeeId) as Agent | undefined;
}

export function getAllAgents(): Agent[] {
  return getDb().prepare('SELECT * FROM agents ORDER BY created_at DESC').all() as Agent[];
}

export function updateAgent(id: string, updates: Partial<Agent>): Agent | undefined {
  const db = getDb();
  const allowed = ['config', 'status'];
  const fields = allowed.filter(f => updates[f as keyof Agent] !== undefined);
  if (fields.length === 0) return getAgentById(id);
  const setClause = fields.map(f => `${f} = @${f}`).join(', ');
  const stmt = db.prepare(`UPDATE agents SET ${setClause}, updated_at = @updated_at WHERE id = @id`);
  stmt.run({ ...updates, id, updated_at: Date.now() });
  return getAgentById(id);
}

export function deleteAgent(id: string): boolean {
  const result = getDb().prepare('DELETE FROM agents WHERE id = ?').run(id);
  return result.changes > 0;
}

// ============================================================
// Transaction helper
// ============================================================

export function withTransaction<T>(fn: (db: Database.Database) => T): T {
  const db = getDb();
  return db.transaction(fn)(db);
}
