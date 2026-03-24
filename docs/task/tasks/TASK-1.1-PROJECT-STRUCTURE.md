# Task 1.1: Project Structure Setup

## Metadata
| Field | Value |
|-------|-------|
| **Task ID** | TASK-1.1 |
| **Title** | Project Structure Setup |
| **Priority** | P0 |
| **Estimate** | 2 hours |
| **Owner** | @coder |
| **Status** | TODO |
| **Created** | 2026-03-24 |
| **Sprint** | 1 |

## Description
Initialize the project structure for AI-WorkHub with frontend (React/Next.js), backend (Node.js/Express), and shared types package.

## Requirements

### 1. Directory Structure
Create the following directory structure:
```
ai-workhub/
├── docs/                  # Documentation
│   └── task/             # Task documentation
├── frontend/             # React frontend application
├── backend/              # Node.js API server
│   ├── agents/           # pi-mono agent definitions
│   ├── services/         # Business logic
│   ├── routes/           # API routes
│   ├── storage/          # Database and file storage
│   └── core/            # Core configurations
└── shared/              # Shared types and utilities
```

### 2. Frontend Setup
- Initialize Next.js/React project in `frontend/`
- Install dependencies: react, react-dom, next, react-router-dom, zustand, axios
- Configure TypeScript
- Create `tsconfig.json` with path aliases

### 3. Backend Setup
- Initialize Node.js project in `backend/`
- Install dependencies: express, cors, dotenv, typescript, ts-node
- Create `tsconfig.json` for backend
- Setup `package.json` with scripts: dev, build, start

### 4. Shared Package Setup
- Initialize TypeScript package in `shared/`
- Create shared types for: Employee, Team, Task, Conversation, WorkProduct
- Export types for use by both frontend and backend

## Acceptance Criteria
- [ ] Project root structure created
- [ ] Frontend initialized with Next.js/React and TypeScript
- [ ] Backend initialized with Express and TypeScript
- [ ] Shared types package created and exportable
- [ ] All `package.json` files have proper scripts (dev, build)
- [ ] TypeScript configurations are compatible across packages

## Technical Notes
- Use npm/yarn workspaces or separate package.json files
- Ensure TypeScript paths alias `@shared/` works in both frontend and backend
- No authentication required for this project

## Files to Create/Modify
```
frontend/
├── package.json
├── tsconfig.json
├── next.config.js
└── src/
    └── app/
        └── page.tsx

backend/
├── package.json
├── tsconfig.json
└── src/
    └── index.ts

shared/
├── package.json
├── tsconfig.json
└── src/
    └── index.ts
```

## Definition of Done
1. All three packages can be built independently
2. Frontend can import types from `@shared/`
3. Backend can import types from `@shared/`
4. Running `npm run dev` in root starts both frontend and backend (optional: use concurrently)
