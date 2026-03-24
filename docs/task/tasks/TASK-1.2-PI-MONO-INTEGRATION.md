# Task 1.2: pi-mono Integration

## Metadata
| Field | Value |
|-------|-------|
| **Task ID** | TASK-1.2 |
| **Title** | pi-mono Integration |
| **Priority** | P0 |
| **Estimate** | 4 hours |
| **Owner** | @coder |
| **Status** | TODO |
| **Created** | 2026-03-24 |
| **Sprint** | 1 |
| **Dependencies** | TASK-1.1 |

## Description
Integrate pi-mono as the core multi-agent orchestration framework for AI-WorkHub. This task sets up the foundation for all AI agent functionality.

## Requirements

### 1. Install pi-mono
```bash
cd backend
npm install pi-mono
# or if it's a local package, set up as internal dependency
```

### 2. Create Agent Base Configuration
- Create `backend/src/core/agent-config.ts`
- Define agent configuration interface (model, temperature, system prompt, etc.)
- Create default configuration factory

### 3. Create Agent Registry
- Create `backend/src/agents/agent-registry.ts`
- Implement singleton registry for managing agent instances
- Provide methods: register, get, list, remove

### 4. Create Base Agent Class
- Create `backend/src/agents/base-agent.ts`
- Extend pi-mono AgentBase
- Implement core methods:
  - `initialize()`: Setup agent with configuration
  - `processMessage()`: Handle incoming messages
  - `generateResponse()`: Generate AI response
  - `getMemory()`: Retrieve conversation history
  - `saveMemory()`: Store conversation history

### 5. Create Agent Factory
- Create `backend/src/agents/agent-factory.ts`
- Factory function to create agents from Employee database records
- Support different agent types/configurations

### 6. Communication Channel Setup
- Create `backend/src/agents/agent-channel.ts`
- Setup message passing between agents
- Support both sync and async communication

## Acceptance Criteria
- [ ] pi-mono package installed and importable
- [ ] Agent configuration interface defined
- [ ] Agent registry singleton working
- [ ] Base agent class implemented with all core methods
- [ ] Agent factory creates agents from configuration
- [ ] Message passing between agents functional

## Files to Create/Modify
```
backend/src/
├── core/
│   └── agent-config.ts
├── agents/
│   ├── agent-registry.ts
│   ├── base-agent.ts
│   ├── agent-factory.ts
│   └── agent-channel.ts
└── index.ts (update exports)
```

## Technical Notes
- pi-mono is the core agent framework - all agents inherit from it
- Each AI employee in the system maps to an agent instance
- Agent memory should be stored in database for persistence
- Consider using event emitter for agent communication

## Definition of Done
1. `import { Agent } from 'pi-mono'` or equivalent works
2. Can create a new agent instance programmatically
3. Agent registry can list all registered agents
4. Two agents can send messages to each other
5. Agent responses can be generated via the base agent class
