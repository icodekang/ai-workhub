# Task 6.1: Frontend Project Setup

## Metadata
| Field | Value |
|-------|-------|
| **Task ID** | TASK-6.1 |
| **Title** | Frontend Project Setup |
| **Priority** | P0 |
| **Estimate** | 3 hours |
| **Owner** | @coder |
| **Status** | TODO |
| **Created** | 2026-03-24 |
| **Sprint** | 6 |
| **Dependencies** | TASK-2.3 |

## Description
Initialize React project with design system. This task sets up the foundation for all frontend UI components with a minimalist premium design.

## Design System Requirements

### 1. Color Palette
```
Primary Colors:
- background-primary: #0f0f1a (Deep dark)
- background-secondary: #1a1a2e (Card background)
- background-tertiary: #252542 (Elevated surfaces)

Accent Colors:
- accent-primary: #6366f1 (Indigo - primary actions)
- accent-secondary: #8b5cf6 (Purple - secondary)
- accent-success: #10b981 (Green - success states)
- accent-warning: #f59e0b (Amber - warnings)
- accent-error: #ef4444 (Red - errors)

Text Colors:
- text-primary: #f8fafc (Main text)
- text-secondary: #94a3b8 (Muted text)
- text-tertiary: #64748b (Disabled/placeholder)

Border/Divider:
- border-subtle: #2d2d4a
- border-default: #3d3d5c
```

### 2. Typography
- **Font Family**: Inter (primary), system-ui (fallback)
- **Font Sizes**:
  - xs: 12px
  - sm: 14px
  - base: 16px
  - lg: 18px
  - xl: 20px
  - 2xl: 24px
  - 3xl: 30px
- **Font Weights**: 400 (normal), 500 (medium), 600 (semibold), 700 (bold)

### 3. Spacing System
- Base unit: 4px
- Scale: 1, 2, 3, 4, 5, 6, 8, 10, 12, 16, 20, 24, 32

### 4. Border Radius
- sm: 6px (buttons, inputs)
- md: 8px (cards)
- lg: 12px (modals)
- xl: 16px (large cards)
- full: 9999px (pills, avatars)

### 5. Shadows
```
shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.3)
shadow-md: 0 4px 6px rgba(0, 0, 0, 0.4)
shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.5)
shadow-glow: 0 0 20px rgba(99, 102, 241, 0.3) (for focus states)
```

### 6. Animation Guidelines
- Duration: fast (150ms), normal (200ms), slow (300ms)
- Easing: cubic-bezier(0.4, 0, 0.2, 1)
- Hover transitions: scale(1.02), opacity changes
- Page transitions: fade + subtle slide

## Requirements

### 1. Project Setup
- Initialize Next.js project with TypeScript
- Install dependencies: tailwindcss, framer-motion, lucide-react
- Configure Tailwind with custom design tokens
- Setup `globals.css` with CSS variables

### 2. Design System Components
Create `frontend/src/components/ui/`:
- Button (variants: primary, secondary, ghost, danger)
- Input (with label, error state)
- Card (with hover effects)
- Badge (status indicators)
- Modal (with backdrop blur)
- Avatar (employee avatars)
- Dropdown menu

### 3. Layout Components
Create `frontend/src/components/layout/`:
- Sidebar (navigation)
- Header (page titles, actions)
- PageContainer (consistent padding)

### 4. Shared Components
Create `frontend/src/components/`:
- LoadingSpinner (skeleton loaders)
- EmptyState (no data views)
- ErrorBoundary

## Acceptance Criteria
- [ ] Next.js project with TypeScript configured
- [ ] Tailwind CSS with custom design tokens working
- [ ] Global CSS variables set for all design tokens
- [ ] Base UI components (Button, Input, Card) implemented
- [ ] Components follow design system (colors, spacing, radius)
- [ ] Framer Motion for animations
- [ ] Lucide icons installed and used consistently
- [ ] Layout components (Sidebar, Header) implemented
- [ ] No authentication/login page (per requirements)

## Files to Create/Modify
```
frontend/
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   └── globals.css
│   ├── components/
│   │   ├── ui/
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Badge.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── Avatar.tsx
│   │   │   └── Dropdown.tsx
│   │   └── layout/
│   │       ├── Sidebar.tsx
│   │       ├── Header.tsx
│   │       └── PageContainer.tsx
│   ├── lib/
│   │   └── utils.ts
│   └── hooks/
├── tailwind.config.ts
└── package.json
```

## Design Principles to Follow
1. **Less is More**: Remove unnecessary elements
2. **Focus on Content**: UI serves content, not vice versa
3. **Consistent Spacing**: Use spacing scale consistently
4. **Subtle Depth**: Use shadows and borders to create hierarchy
5. **Polished Interactions**: Every interaction should feel smooth

## Definition of Done
1. All components match design tokens exactly
2. Components have proper hover/active/disabled states
3. Animations are smooth (60fps)
4. Layout is responsive
5. Design system is documented in code comments
