# Task 6.2: Employee Management UI (Activity Feed)

## Metadata
| Field | Value |
|-------|-------|
| **Task ID** | TASK-6.2 |
| **Title** | Employee Management UI - Activity Feed |
| **Priority** | P0 |
| **Estimate** | 6 hours |
| **Owner** | @coder |
| **Status** | TODO |
| **Created** | 2026-03-24 |
| **Sprint** | 6 |
| **Dependencies** | TASK-6.1 (Frontend Setup & Design System) |

## Design: Activity Feed (实时动态流)

采用 **Activity Feed** 设计方案，以时间线形式展示员工的工作动态、聊天交流等实时状态。

### UI Layout

```
┌─────────────────────────────────────────────────────────────┐
│  员工管理                                    [+ 创建员工]       │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌─ Activity Feed ────────────────────────────────────┐    │
│  │                                                       │    │
│  │  ● Alice                              2分钟前       │    │
│  │  ┌─────────────────────────────────────────────┐  │    │
│  │  │ 🔵 正在编写 API 文档                        │  │    │
│  │  │ ████████████████░░░░░░░░  68%            │  │    │
│  │  │                                             │  │    │
│  │  │ 💬 与 Bob 讨论技术方案                      │  │    │
│  │  │ "我觉得可以用 RESTful 风格..."              │  │    │
│  │  │                                             │  │    │
│  │  │ ✅ 完成用户认证模块                        │  │    │
│  │  └─────────────────────────────────────────────┘  │    │
│  │                                                       │    │
│  │  ● Bob                                   5分钟前      │    │
│  │  ┌─────────────────────────────────────────────┐  │    │
│  │  │ 🟢 空闲                                     │  │    │
│  │  │ 等待新任务...                               │  │    │
│  │  │                                             │  │    │
│  │  │ 💬 与 Alice 讨论技术方案         15分钟前   │  │    │
│  │  │ "好的，我们用 RESTful 风格"                │  │    │
│  │  └─────────────────────────────────────────────┘  │    │
│  │                                                       │    │
│  │  ● Carol                               10分钟前      │    │
│  │  ┌─────────────────────────────────────────────┐  │    │
│  │  │ 🔵 正在设计登录页面 UI                      │  │    │
│  │  │ ████████████░░░░░░░░░░░░  52%            │  │    │
│  │  └─────────────────────────────────────────────┘  │    │
│  │                                                       │    │
│  └───────────────────────────────────────────────────────┘    │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### Activity Types

| Icon | Type | Description |
|------|------|-------------|
| 🔵 | working | 正在执行任务 |
| 🟢 | idle | 空闲等待 |
| 💬 | chatting | 聊天交流中 |
| ✅ | completed | 完成任务 |
| ❌ | failed | 任务失败 |
| 🔄 | retrying | 重试中 |

### Activity Item Data Structure

```typescript
interface Activity {
  id: string
  employeeId: string
  employeeName: string
  type: 'working' | 'idle' | 'chatting' | 'completed' | 'failed' | 'retrying'
  timestamp: number
  data: {
    // For working
    taskTitle?: string
    progress?: number  // 0-100
    
    // For chatting
    partnerName?: string
    messagePreview?: string
    
    // For completed/failed
    taskTitle?: string
    result?: string
  }
}
```

### Component Structure

```
frontend/src/
├── components/
│   ├── employee/
│   │   ├── ActivityFeed.tsx      # 主列表容器
│   │   ├── ActivityCard.tsx     # 单个员工动态卡片
│   │   ├── ActivityItem.tsx     # 单条动态
│   │   ├── EmployeeStatus.tsx   # 状态指示器
│   │   ├── ProgressBar.tsx      # 任务进度条
│   │   └── CreateEmployeeModal.tsx  # 创建员工弹窗
│   └── ui/
│       ├── Badge.tsx            # 已有的 Badge 组件
│       └── Modal.tsx            # 已有的 Modal 组件
└── pages/
    └── employees/
        └── page.tsx             # 员工管理页面
```

### ActivityFeed Component

```tsx
// components/employee/ActivityFeed.tsx
interface ActivityFeedProps {
  activities: Activity[]
  onRefresh: () => void
  isLoading: boolean
}

export function ActivityFeed({ activities, onRefresh, isLoading }: ActivityFeedProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-text-primary">
          员工动态
        </h2>
        <button 
          onClick={onRefresh}
          className="p-2 rounded-lg hover:bg-background-tertiary transition-colors"
          disabled={isLoading}
        >
          <RefreshIcon className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Activity Cards by Employee */}
      <div className="space-y-4">
        {activities.map((activity) => (
          <ActivityCard key={activity.id} activity={activity} />
        ))}
      </div>
    </div>
  )
}
```

### ActivityCard Component

```tsx
// components/employee/ActivityCard.tsx
interface ActivityCardProps {
  activity: Activity
}

export function ActivityCard({ activity }: ActivityCardProps) {
  const statusConfig = {
    working: { color: '#f59e0b', icon: '🔵', label: '工作中' },
    idle: { color: '#10b981', icon: '🟢', label: '空闲' },
    chatting: { color: '#6366f1', icon: '💬', label: '聊天中' },
    completed: { color: '#10b981', icon: '✅', label: '已完成' },
    failed: { color: '#ef4444', icon: '❌', label: '失败' },
    retrying: { color: '#f59e0b', icon: '🔄', label: '重试中' },
  }

  const config = statusConfig[activity.type]

  return (
    <div className="
      bg-background-secondary rounded-lg 
      border border-border-subtle
      overflow-hidden
      transition-all duration-200
      hover:border-accent-primary/30 hover:shadow-glow
    ">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border-subtle">
        <Avatar name={activity.employeeName} status={activity.type} size="sm" />
        <div className="flex-1">
          <span className="font-medium text-text-primary">
            {activity.employeeName}
          </span>
        </div>
        <span className="text-xs text-text-tertiary">
          {formatRelativeTime(activity.timestamp)}
        </span>
      </div>

      {/* Activity Items */}
      <div className="p-4 space-y-3">
        <ActivityItem activity={activity} config={config} />
      </div>
    </div>
  )
}
```

### ActivityItem Component

```tsx
// components/employee/ActivityItem.tsx
interface ActivityItemProps {
  activity: Activity
  config: StatusConfig
}

function ActivityItem({ activity, config }: ActivityItemProps) {
  switch (activity.type) {
    case 'working':
      return <WorkingActivity activity={activity} />
    case 'chatting':
      return <ChattingActivity activity={activity} />
    case 'completed':
      return <CompletedActivity activity={activity} />
    case 'idle':
      return <IdleActivity activity={activity} />
    case 'failed':
      return <FailedActivity activity={activity} />
    default:
      return null
  }
}

function WorkingActivity({ activity }: ActivityItemProps) {
  return (
    <div className="flex items-start gap-3">
      <span className="text-lg">{activity.data.emoji || '🔵'}</span>
      <div className="flex-1">
        <div className="flex items-center justify-between">
          <span className="text-sm text-text-primary">
            正在: {activity.data.taskTitle}
          </span>
          <span className="text-xs text-text-secondary">
            {activity.data.progress}%
          </span>
        </div>
        <ProgressBar progress={activity.data.progress || 0} />
      </div>
    </div>
  )
}

function ChattingActivity({ activity }: ActivityItemProps) {
  return (
    <div className="flex items-start gap-3">
      <span className="text-lg">💬</span>
      <div className="flex-1">
        <div className="text-sm text-text-primary">
          与 <span className="font-medium">{activity.data.partnerName}</span> 讨论
        </div>
        {activity.data.messagePreview && (
          <div className="
            mt-1 px-3 py-2 
            bg-background-tertiary rounded-md
            text-sm text-text-secondary italic
          ">
            "{activity.data.messagePreview}"
          </div>
        )}
      </div>
    </div>
  )
}

function CompletedActivity({ activity }: ActivityItemProps) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-lg">✅</span>
      <span className="text-sm text-text-secondary">
        完成 <span className="text-text-primary">{activity.data.taskTitle}</span>
      </span>
    </div>
  )
}

function IdleActivity({ activity }: ActivityItemProps) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-lg">🟢</span>
      <span className="text-sm text-text-secondary">
        {activity.data.message || '等待新任务...'}
      </span>
    </div>
  )
}
```

### ProgressBar Component

```tsx
// components/employee/ProgressBar.tsx
interface ProgressBarProps {
  progress: number  // 0-100
  size?: 'sm' | 'md'
  showLabel?: boolean
}

export function ProgressBar({ progress, size = 'md', showLabel = true }: ProgressBarProps) {
  const heights = { sm: 'h-1.5', md: 'h-2' }
  
  return (
    <div className="flex items-center gap-2">
      <div className={`
        flex-1 ${heights[size]} 
        bg-background-tertiary rounded-full 
        overflow-hidden
      `}>
        <div 
          className="h-full rounded-full transition-all duration-300"
          style={{ 
            width: `${progress}%`,
            background: progress < 30 ? '#ef4444' 
                    : progress < 70 ? '#f59e0b' 
                    : '#10b981'
          }}
        />
      </div>
      {showLabel && (
        <span className="text-xs text-text-tertiary w-8 text-right">
          {progress}%
        </span>
      )}
    </div>
  )
}
```

### Employee Page

```tsx
// pages/employees/page.tsx
export default function EmployeesPage() {
  const { employees, activities, isLoading, refresh } = useEmployees()
  
  return (
    <PageContainer>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-text-primary">员工管理</h1>
        <Button onClick={() => openCreateModal()}>
          <PlusIcon className="w-5 h-5 mr-2" />
          创建员工
        </Button>
      </div>
      
      <ActivityFeed 
        activities={activities}
        onRefresh={refresh}
        isLoading={isLoading}
      />
      
      <CreateEmployeeModal 
        isOpen={isCreateModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSuccess={() => {
          setCreateModalOpen(false)
          refresh()
        }}
      />
    </PageContainer>
  )
}
```

### API Integration

```typescript
// hooks/useEmployees.ts
export function useEmployees() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [activities, setActivities] = useState<Activity[]>([])
  const [isLoading, setIsLoading] = useState(false)
  
  const refresh = async () => {
    setIsLoading(true)
    try {
      const [emps, acts] = await Promise.all([
        api.employees.list(),
        api.employees.activities()  // 新增 API
      ])
      setEmployees(emps)
      setActivities(acts)
    } finally {
      setIsLoading(false)
    }
  }
  
  // 轮询更新
  useEffect(() => {
    refresh()
    const interval = setInterval(refresh, 10000)  // 10秒轮询
    return () => clearInterval(interval)
  }, [])
  
  return { employees, activities, isLoading, refresh }
}
```

### Backend API (需要实现)

```typescript
// GET /api/employees/activities
// 返回所有员工的最新动态
interface ActivitiesResponse {
  activities: Activity[]
}

// Activity 聚合逻辑
async function getEmployeeActivities(): Promise<Activity[]> {
  const employees = await db.employees.list()
  
  const activities = await Promise.all(
    employees.map(async (emp) => {
      // 获取员工最新状态
      const latestStatus = await getLatestStatus(emp.id)
      
      // 获取当前任务进度
      const currentTask = await db.tasks.getCurrentForEmployee(emp.id)
      
      // 获取最近对话
      const recentChat = await db.conversations.getRecentForParticipant(emp.id)
      
      // 组合成 Activity
      return buildActivityFromStatus(emp, latestStatus, currentTask, recentChat)
    })
  )
  
  // 按时间排序
  return activities.sort((a, b) => b.timestamp - a.timestamp)
}
```

## Acceptance Criteria

- [ ] Activity Feed 显示所有员工的实时动态
- [ ] 每个员工的动态卡片包含：状态、当前任务、进度、聊天
- [ ] 动态实时更新（轮询或 WebSocket）
- [ ] 创建员工 Modal 正常工作
- [ ] 进度条显示任务完成度
- [ ] 聊天消息显示对话预览
- [ ] 相对时间显示（"2分钟前"）
- [ ] 响应式布局，移动端适配

## Files to Create/Modify

```
frontend/src/
├── components/
│   └── employee/
│       ├── ActivityFeed.tsx      # NEW
│       ├── ActivityCard.tsx      # NEW
│       ├── ActivityItem.tsx      # NEW
│       ├── ProgressBar.tsx       # NEW
│       └── CreateEmployeeModal.tsx  # NEW
├── hooks/
│   └── useEmployees.ts          # UPDATE
└── pages/
    └── employees/
        └── page.tsx             # UPDATE

backend/src/
├── routes/
│   └── employees.ts             # UPDATE - add activities endpoint
└── services/
    └── employee.service.ts     # UPDATE - add getActivities()
```

## Definition of Done

1. Activity Feed 实时显示所有员工状态
2. 工作中的任务显示进度条
3. 聊天中的消息显示对话预览
4. 动态每 10 秒自动刷新
5. 创建员工后即时显示在列表中
6. UI 风格符合简约·高级设计规范
