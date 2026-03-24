# Task 2.2: AI Team CRUD API

## Metadata
| Field | Value |
|-------|-------|
| **Task ID** | TASK-2.2 |
| **Title** | AI Team CRUD API |
| **Priority** | P0 |
| **Estimate** | 6 hours |
| **Owner** | @coder |
| **Status** | TODO |
| **Created** | 2026-03-24 |
| **Sprint** | 2 |
| **Dependencies** | TASK-1.3, TASK-2.1 |

## Description
Implement REST APIs for AI Team management including create, read, update, delete operations, and team membership management.

## API Endpoints

### POST /api/teams
Create a new team.

**Request Body:**
```json
{
  "name": "Backend Team",
  "description": "Handles backend development tasks"
}
```

**Response (201):**
```json
{
  "id": "uuid",
  "name": "Backend Team",
  "description": "Handles backend development tasks",
  "members": [],
  "createdAt": 1711305600,
  "updatedAt": 1711305600
}
```

### GET /api/teams
List all teams.

**Response (200):**
```json
{
  "teams": [
    {
      "id": "uuid",
      "name": "Backend Team",
      "memberCount": 3,
      "createdAt": 1711305600
    }
  ],
  "total": 1
}
```

### GET /api/teams/:id
Get team details with members.

**Response (200):**
```json
{
  "id": "uuid",
  "name": "Backend Team",
  "description": "Handles backend development tasks",
  "members": [
    {
      "employeeId": "uuid",
      "name": "Alice",
      "role": "member",
      "addedAt": 1711305600
    },
    {
      "employeeId": "uuid",
      "name": "Bob",
      "role": "leader",
      "addedAt": 1711305600
    }
  ],
  "createdAt": 1711305600,
  "updatedAt": 1711305600
}
```

### PUT /api/teams/:id
Update a team.

**Request Body:**
```json
{
  "name": "Backend Engineering Team",
  "description": "Updated description"
}
```

**Response (200):** Updated team object

### DELETE /api/teams/:id
Delete a team.

**Response (204):** No content

### POST /api/teams/:id/members
Add employee to team.

**Request Body:**
```json
{
  "employeeId": "uuid",
  "role": "member"
}
```

**Response (201):**
```json
{
  "teamId": "uuid",
  "employeeId": "uuid",
  "role": "member",
  "addedAt": 1711305600
}
```

### DELETE /api/teams/:id/members/:employeeId
Remove employee from team.

**Response (204):** No content

## Data Validation
- `name`: Required, 1-100 characters
- `description`: Optional, max 500 characters
- `employeeId`: Required for member operations, must exist
- `role`: Optional, defaults to "member", must be "member" or "leader"

## Error Responses
- `400 Bad Request`: Invalid input
- `404 Not Found`: Team or employee not found
- `409 Conflict`: Employee already in team

## Implementation Details

### Service Layer
Create `backend/src/services/team.service.ts`:
- `createTeam(data)`: Create new team
- `getTeamById(id)`: Get team with members
- `listTeams()`: List all teams
- `updateTeam(id, data)`: Update team
- `deleteTeam(id)`: Delete team
- `addMember(teamId, employeeId, role)`: Add employee to team
- `removeMember(teamId, employeeId)`: Remove employee from team
- `getTeamMembers(teamId)`: Get all team members

## Acceptance Criteria
- [ ] POST /api/teams creates team and returns 201
- [ ] GET /api/teams returns list with member counts
- [ ] GET /api/teams/:id returns team with full member list
- [ ] PUT /api/teams/:id updates team
- [ ] DELETE /api/teams/:id deletes team
- [ ] POST /api/teams/:id/members adds employee
- [ ] DELETE /api/teams/:id/members/:employeeId removes employee
- [ ] Cannot add same employee to team twice (409)
- [ ] Deleting team cleans up team_members records

## Files to Create/Modify
```
backend/src/
├── services/
│   └── team.service.ts
├── routes/
│   └── teams.ts
└── index.ts (register routes)
```

## Definition of Done
1. All CRUD endpoints respond correctly
2. Member management works correctly
3. Cannot add duplicate team members
4. Team deletion cascades to team_members
5. Proper authorization: employee must exist before adding to team
