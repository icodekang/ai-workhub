# Task 3.1: Agent Instance Management

## Metadata
| Field | Value |
|-------|-------|
| **Task ID** | TASK-3.1 |
| **Title** | Agent Instance Management |
| **Priority** | P0 |
| **Estimate** | 6 hours |
| **Owner** | @coder |
| **Status** | TODO |
| **Created** | 2026-03-24 |
| **Sprint** | 3 |
| **Dependencies** | TASK-1.3 (pi-mono Integration) |

## Description
Implement dynamic agent creation and lifecycle management based on employee data. Each AI Employee maps to an Agent instance managed by pi-mono.

## AI Town Reference
**Concept**: Agent = identity + plan + memory
**Files**: `convex/agent/schema.ts`, `convex/aiTown/agent.ts`

## Agent Configuration

```typescript
interface AgentConfig {
  identity: string    // "我是Alice，一名后端工程师，擅长Node.js和PostgreSQL"
  plan: string       // "当前目标：完成用户认证模块的API文档"
  model: string      // LLM model to use (e.g., "gpt-4", "llama3")
  temperature: number // Sampling temperature (0.0-2.0)
}

interface AIAgent {
  id: string
  employeeId: string
  name: string
  status: 'idle' | 'working' | 'chatting' | 'error'
  config: AgentConfig
  createdAt: number
  lastActive: number
  
  // Methods
  chat(message: string): Promise<string>
  setPlan(plan: string): void
  getStatus(): AgentStatus
}
```

## Core Components

### 1. Agent Registry
```typescript
// Singleton registry for all active agents
class AgentRegistry {
  private agents: Map<string, AIAgent> = new Map()
  
  // Create agent from employee record
  async createAgent(employee: Employee): Promise<AIAgent> {
    const agent = new PImonoAgent({
      id: generateId(),
      employeeId: employee.id,
      name: employee.name,
      config: {
        identity: employee.identity || `You are ${employee.name}, a ${employee.role}.`,
        plan: employee.plan || 'Complete assigned tasks.',
        model: employee.model || 'gpt-4',
        temperature: employee.temperature || 0.7
      }
    })
    
    this.agents.set(agent.id, agent)
    return agent
  }
  
  get(employeeId: string): AIAgent | undefined
  list(): AIAgent[]
  remove(employeeId: string): void
  getById(agentId: string): AIAgent | undefined
}
```

### 2. Agent Lifecycle

```typescript
// Agent lifecycle management
class AgentLifecycle {
  constructor(
    private registry: AgentRegistry,
    private memorySystem: MemorySystem
  ) {}
  
  async startAgent(employeeId: string): Promise<AIAgent> {
    const employee = await db.employees.get(employeeId)
    if (!employee) throw new Error('Employee not found')
    
    const agent = await this.registry.createAgent(employee)
    return agent
  }
  
  async stopAgent(employeeId: string): Promise<void> {
    const agent = this.registry.get(employeeId)
    if (agent) {
      await this.persistState(agent)
      this.registry.remove(employeeId)
    }
  }
  
  async restartAgent(employeeId: string): Promise<AIAgent> {
    await this.stopAgent(employeeId)
    return this.startAgent(employeeId)
  }
  
  async updateAgentConfig(
    employeeId: string, 
    updates: Partial<AgentConfig>
  ): Promise<AIAgent> {
    const agent = this.registry.get(employeeId)
    if (!agent) throw new Error('Agent not found')
    
    agent.config = { ...agent.config, ...updates }
    await db.employees.update(employeeId, updates)
    return agent
  }
}
```

### 3. Agent Chat Interface

```typescript
// Main chat interface for agents
class AgentChat {
  constructor(
    private registry: AgentRegistry,
    private memorySystem: MemorySystem
  ) {}
  
  async chat(
    employeeId: string,
    message: string,
    context?: { taskId?: string; conversationId?: string }
  ): Promise<string> {
    const agent = this.registry.get(employeeId)
    if (!agent) throw new Error('Agent not found')
    
    // Update status
    agent.status = 'chatting'
    
    try {
      // Get relevant memories
      const memories = await this.memorySystem.searchMemories(
        employeeId,
        message,
        5
      )
      
      // Build context with memories
      const contextPrompt = memories.length > 0
        ? `Relevant memories:\n${memories.map(m => `- ${m.description}`).join('\n')}`
        : ''
      
      // Generate response
      const response = await agent.chat([
        { role: 'system', content: `${agent.config.identity}\n\n${agent.config.plan}` },
        { role: 'system', content: contextPrompt },
        { role: 'user', content: message }
      ])
      
      return response
    } finally {
      agent.status = 'idle'
    }
  }
}
```

## API Integration

### Employee-Agent Mapping
- When employee is created → Agent is instantiated
- When employee is deleted → Agent is stopped and removed
- When employee is updated → Agent config is updated

```typescript
// In EmployeeService
async createEmployee(data: CreateEmployeeDTO): Promise<Employee> {
  const employee = await db.employees.create(data)
  
  // Create corresponding agent
  await agentLifecycle.startAgent(employee.id)
  
  return employee
}

async deleteEmployee(id: string): Promise<void> {
  await agentLifecycle.stopAgent(id)
  await db.employees.delete(id)
}
```

## Acceptance Criteria
- [ ] Agents created from employee records
- [ ] Agent registry singleton manages all agents
- [ ] Agent lifecycle: create, start, stop, restart
- [ ] Agent chat with context (memories)
- [ ] Agent status tracking (idle/working/chatting)
- [ ] Config updates reflected in running agent
- [ ] Graceful handling when employee deleted

## Files to Create
```
backend/src/
├── agents/
│   ├── registry.ts        # AgentRegistry singleton
│   ├── lifecycle.ts       # AgentLifecycle management
│   ├── chat.ts           # AgentChat interface
│   └── index.ts          # Exports
└── services/
    └── employee.service.ts  # Updated with agent lifecycle
```

## Definition of Done
1. Creating employee auto-creates agent
2. Agent can chat with context awareness
3. Agent status accurately reflects state
4. Agent config updates take effect immediately
5. Memory system integration works
6. Proper cleanup when employee deleted
