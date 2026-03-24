# AI-WorkHub Project Overview

## Project Name
**AI-WorkHub** - AI Office Simulation Platform

## Project Description
An AI-powered office simulation inspired by AI Town, where each employee is an autonomous AI agent. Users can create AI employees, organize them into teams, and assign tasks to individuals or groups. All AI interactions and outputs are logged and accessible.

## Core Technology Stack
- **Core Framework**: pi-mono (Multi-Agent Orchestration Framework)
- **Frontend**: React/Next.js (No authentication required)
- **Backend**: Node.js API
- **Database**: SQLite/PostgreSQL for conversation logs and task records
- **Storage**: File storage for AI work products

## Design Principles (前端设计要求)
**风格定位**: 简约 · 高级 (Minimalist Premium)

### Design Guidelines
- **配色方案**: 
  - 主色: 深色系 (#1a1a2e, #16213e) 或浅色纯净白 (#fafafa)
  - 强调色: 科技蓝 (#4facfe) 或琥珀金 (#f093fb)
  - 避免过于花哨的颜色，保持克制
- **字体**: 使用高质量无衬线字体 (Inter, SF Pro Display, PingFang SC)
- **布局**: 大量留白，信息密度适中，视觉呼吸感强
- **交互**: 流畅的微动效，hover反馈细腻
- **组件**: 卡片化设计，圆角适中 (8-16px)
- **图标**: 线性图标风格，统一 stroke width

## Key Features

### 1. AI Employee Management
- Create individual AI employees with customizable roles/prompts
- Edit and delete AI employees
- View AI employee profiles and capabilities

### 2. AI Team Management
- Create AI teams and assign employees to teams
- Edit team composition
- Delete teams

### 3. Task Assignment
- Assign tasks to individual AI employees
- Assign tasks to AI teams (distributed across team members)
- Track task status and progress

### 4. Communication & Collaboration
- AI employees can communicate with each other
- All conversations are logged with timestamps
- Conversation history is searchable and viewable

### 5. Work Product Management
- AI employees produce deliverables (files, documents, code, etc.)
- All work products are stored and versioned
- Users can view and download work products

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (React)                      │
│  - Employee Management UI                                │
│  - Team Management UI                                   │
│  - Task Assignment UI                                   │
│  - Chat/Conversation View                               │
│  - Work Products Browser                                │
└─────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────┐
│                    Backend API (Node.js)                 │
│  - Employee CRUD                                        │
│  - Team CRUD                                            │
│  - Task Management                                      │
│  - Conversation Log API                                 │
│  - Work Product API                                     │
└─────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────┐
│                  pi-mono (Agent Core)                   │
│  - Agent Orchestration                                  │
│  - Task Execution                                       │
│  - Inter-agent Communication                            │
│  - Memory Management                                    │
└─────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────┐
│                    Data Layer                            │
│  - SQLite: Conversations, Tasks, Metadata              │
│  - File Storage: Work Products                          │
└─────────────────────────────────────────────────────────┘
```

## Project Structure

```
ai-workhub/
├── docs/
│   └── task/           # Task documentation
├── frontend/           # React frontend
├── backend/            # Node.js API
│   ├── agents/         # pi-mono agent definitions
│   ├── services/       # Business logic
│   └── storage/        # Data access layer
└── shared/             # Shared types and utilities
```

## Development Principles
1. All code changes must be committed to GitHub dev branch
2. Each task must have clear acceptance criteria
3. All AI-agent interactions must be logged
