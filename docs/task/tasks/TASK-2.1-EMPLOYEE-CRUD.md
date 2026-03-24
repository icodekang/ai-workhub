# Task 2.1: AI Employee CRUD API

## Metadata
| Field | Value |
|-------|-------|
| **Task ID** | TASK-2.1 |
| **Title** | AI Employee CRUD API |
| **Priority** | P0 |
| **Estimate** | 6 hours |
| **Owner** | @coder |
| **Status** | TODO |
| **Created** | 2026-03-24 |
| **Sprint** | 2 |
| **Dependencies** | TASK-1.3 |

## Description
Implement REST APIs for AI Employee management including create, read, update, delete, and list operations.

## API Endpoints

### POST /api/employees
Create a new AI employee.

**Request Body:**
```json
{
  "name": "Alice",
  "role": "Software Engineer",
  "systemPrompt": "You are a helpful software engineer...",
  "model": "gpt-4",
  "temperature": 0.7
}
```

**Response (201):**
```json
{
  "id": "uuid",
  "name": "Alice",
  "role": "Software Engineer",
  "systemPrompt": "You are a helpful software engineer...",
  "model": "gpt-4",
  "temperature": 0.7,
  "status": "inactive",
  "createdAt": 1711305600,
  "updatedAt": 1711305600
}
```

### GET /api/employees
List all employees.

**Query Parameters:**
- `status` (optional): Filter by status (inactive/active/busy)
- `role` (optional): Filter by role

**Response (200):**
```json
{
  "employees": [
    {
      "id": "uuid",
      "name": "Alice",
      "role": "Software Engineer",
      "status": "active",
      "createdAt": 1711305600
    }
  ],
  "total": 1
}
```

### GET /api/employees/:id
Get employee details.

**Response (200):**
```json
{
  "id": "uuid",
  "name": "Alice",
  "role": "Software Engineer",
  "systemPrompt": "You are a helpful software engineer...",
  "model": "gpt-4",
  "temperature": 0.7,
  "status": "active",
  "createdAt": 1711305600,
  "updatedAt": 1711305600
}
```

### PUT /api/employees/:id
Update an employee.

**Request Body:**
```json
{
  "name": "Alice Smith",
  "role": "Senior Software Engineer",
  "systemPrompt": "Updated prompt...",
  "model": "gpt-4-turbo",
  "temperature": 0.8,
  "status": "inactive"
}
```

**Response (200):** Updated employee object

### DELETE /api/employees/:id
Delete an employee.

**Response (204):** No content

**Side Effects:**
- Remove employee from any teams (team_members)
- Consider: Should we also delete associated tasks, conversations, work products?

## Data Validation
- `name`: Required, 1-100 characters
- `role`: Required, 1-50 characters
- `systemPrompt`: Optional, max 10000 characters
- `model`: Optional, must be valid model name
- `temperature`: Optional, 0.0-2.0

## Error Responses
- `400 Bad Request`: Invalid input data
- `404 Not Found`: Employee not found
- `500 Internal Server Error`: Server error

## Implementation Details

### Service Layer
Create `backend/src/services/employee.service.ts`:
- `createEmployee(data)`: Create new employee
- `getEmployeeById(id)`: Get employee by ID
- `listEmployees(filters)`: List with filters
- `updateEmployee(id, data)`: Update employee
- `deleteEmployee(id)`: Delete employee
- `updateEmployeeStatus(id, status)`: Update agent status

### Route Handler
Create `backend/src/routes/employees.ts`:
- Express router with all endpoints
- Input validation middleware
- Error handling wrapper

## Acceptance Criteria
- [ ] POST /api/employees creates employee and returns 201
- [ ] GET /api/employees returns list with pagination
- [ ] GET /api/employees/:id returns employee or 404
- [ ] PUT /api/employees/:id updates and returns 200
- [ ] DELETE /api/employees/:id returns 204
- [ ] All endpoints validate input and return proper errors
- [ ] Employee creation registers agent in agent registry

## Files to Create/Modify
```
backend/src/
├── services/
│   └── employee.service.ts
├── routes/
│   └── employees.ts
└── index.ts (register routes)
```

## Definition of Done
1. All CRUD endpoints respond correctly
2. Invalid input returns 400 with error message
3. Non-existent ID returns 404
4. Employee data persists in database
5. Agent registry is updated on employee create/delete
6. Unit tests pass for service layer
