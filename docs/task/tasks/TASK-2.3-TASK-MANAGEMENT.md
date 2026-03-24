# Task 2.3: Task Management API

## Metadata
| Field | Value |
|-------|-------|
| **Task ID** | TASK-2.3 |
| **Title** | Task Management API |
| **Priority** | P0 |
| **Estimate** | 6 hours |
| **Owner** | @coder |
| **Status** | TODO |
| **Created** | 2026-03-24 |
| **Sprint** | 2 |
| **Dependencies** | TASK-1.3, TASK-2.1, TASK-2.2 |

## Description
Implement REST APIs for task assignment to individual AI employees or teams, and task tracking throughout its lifecycle.

## API Endpoints

### POST /api/tasks
Create and assign a new task.

**Request Body:**
```json
{
  "title": "Write API documentation",
  "description": "Create comprehensive API docs for the backend endpoints",
  "assigneeType": "employee",
  "assigneeId": "uuid"
}
```

For team assignment:
```json
{
  "title": "Build user authentication",
  "description": "Implement JWT-based auth system",
  "assigneeType": "team",
  "assigneeId": "team-uuid"
}
```

**Response (201):**
```json
{
  "id": "uuid",
  "title": "Write API documentation",
  "description": "Create comprehensive API docs for the backend endpoints",
  "assigneeType": "employee",
  "assigneeId": "uuid",
  "status": "pending",
  "result": null,
  "createdAt": 1711305600,
  "updatedAt": 1711305600,
  "completedAt": null
}
```

### GET /api/tasks
List tasks with filtering.

**Query Parameters:**
- `status`: Filter by status (pending/in_progress/completed/failed)
- `assigneeType`: Filter by assignee type (employee/team)
- `assigneeId`: Filter by specific assignee
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20)

**Response (200):**
```json
{
  "tasks": [
    {
      "id": "uuid",
      "title": "Write API documentation",
      "assigneeType": "employee",
      "assigneeId": "uuid",
      "assigneeName": "Alice",
      "status": "pending",
      "createdAt": 1711305600
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 20,
  "totalPages": 1
}
```

### GET /api/tasks/:id
Get task details.

**Response (200):**
```json
{
  "id": "uuid",
  "title": "Write API documentation",
  "description": "Create comprehensive API docs for the backend endpoints",
  "assigneeType": "employee",
  "assigneeId": "uuid",
  "assigneeName": "Alice",
  "status": "completed",
  "result": "Successfully created API documentation...",
  "createdAt": 1711305600,
  "updatedAt": 1711305800,
  "completedAt": 1711305800
}
```

### PUT /api/tasks/:id
Update a task (title, description, status, result).

**Request Body:**
```json
{
  "status": "in_progress",
  "result": "Started working on the documentation..."
}
```

**Response (200):** Updated task object

### PUT /api/tasks/:id/status
Update task status only.

**Request Body:**
```json
{
  "status": "completed",
  "result": "Task completed successfully"
}
```

**Response (200):** Updated task object

### DELETE /api/tasks/:id
Delete a task.

**Response (204):** No content

## Task Status Flow
```
pending → in_progress → completed
           ↓
          failed
```
- Tasks start in `pending` status
- Status can move to `in_progress` when agent starts working
- Final states: `completed` or `failed`

## Data Validation
- `title`: Required, 1-200 characters
- `description`: Optional, max 5000 characters
- `assigneeType`: Required, must be "employee" or "team"
- `assigneeId`: Required, must reference existing employee or team
- `status`: Must be valid status value
- `result`: Optional, max 10000 characters

## Error Responses
- `400 Bad Request`: Invalid input
- `404 Not Found`: Task, employee, or team not found
- `409 Conflict`: Invalid status transition

## Implementation Details

### Service Layer
Create `backend/src/services/task.service.ts`:
- `createTask(data)`: Create new task
- `getTaskById(id)`: Get task with assignee name
- `listTasks(filters, pagination)`: List with filters
- `updateTask(id, data)`: Update task
- `updateTaskStatus(id, status, result)`: Update status
- `deleteTask(id)`: Delete task
- `validateAssignee(type, id)`: Verify assignee exists

## Acceptance Criteria
- [ ] POST /api/tasks creates task and returns 201
- [ ] GET /api/tasks returns filtered, paginated list
- [ ] GET /api/tasks/:id returns full task details
- [ ] PUT /api/tasks/:id updates task fields
- [ ] PUT /api/tasks/:id/status updates status with result
- [ ] DELETE /api/tasks/:id deletes task
- [ ] Task assignment validates assignee exists
- [ ] Status transitions follow valid flow

## Files to Create/Modify
```
backend/src/
├── services/
│   └── task.service.ts
├── routes/
│   └── tasks.ts
└── index.ts (register routes)
```

## Definition of Done
1. All endpoints respond correctly
2. Task assignment validates assignee type and existence
3. Status updates are validated
4. Completed tasks have completedAt timestamp set
5. Pagination works correctly for list endpoint
6. Tasks for teams can be queried by team ID
