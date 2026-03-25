/**
 * AI-WorkHub Design System - Design Tokens
 *
 * Minimalist Premium Design:
 * - Dark theme, low saturation
 * - Generous whitespace
 * - Smooth micro-animations
 * - Card-based design, 8-16px border radius
 */

export const colors = {
  // Background colors
  background: {
    primary: '#0f0f1a',    // Deep dark
    secondary: '#161625',  // Slightly lighter
    tertiary: '#1e1e2e',   // Card backgrounds
    elevated: '#252536',    // Elevated surfaces
  },

  // Text colors
  text: {
    primary: '#e4e4ed',    // Primary text
    secondary: '#9090a0',  // Secondary text
    muted: '#6060a0',      // Muted text
    inverse: '#0f0f1a',    // Text on light backgrounds
  },

  // Accent colors
  accent: {
    primary: '#6366f1',    // Primary accent (indigo)
    secondary: '#8b5cf6',  // Secondary accent (violet)
    success: '#22c55e',    // Success green
    warning: '#f59e0b',    // Warning amber
    error: '#ef4444',       // Error red
    info: '#3b82f6',       // Info blue
  },

  // Border colors
  border: {
    default: '#2a2a3e',    // Default border
    hover: '#3a3a4e',      // Hover border
    focus: '#6366f1',      // Focus border (accent)
  },

  // Status colors
  status: {
    online: '#22c55e',
    offline: '#6b7280',
    busy: '#ef4444',
    inactive: '#6b7280',
  },

  // Gradients
  gradients: {
    primary: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
    surface: 'linear-gradient(180deg, #1e1e2e 0%, #161625 100%)',
  },
} as const;

export const typography = {
  // Font families
  fontFamily: {
    sans: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    mono: '"SF Mono", Monaco, "Cascadia Code", "Roboto Mono", Consolas, monospace',
  },

  // Font sizes
  fontSize: {
    xs: '0.75rem',    // 12px
    sm: '0.875rem',   // 14px
    base: '1rem',     // 16px
    lg: '1.125rem',   // 18px
    xl: '1.25rem',    // 20px
    '2xl': '1.5rem',  // 24px
    '3xl': '1.875rem', // 30px
    '4xl': '2.25rem', // 36px
  },

  // Font weights
  fontWeight: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },

  // Line heights
  lineHeight: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.75,
  },
} as const;

export const spacing = {
  // Base unit: 4px
  0: '0',
  1: '0.25rem',   // 4px
  2: '0.5rem',    // 8px
  3: '0.75rem',   // 12px
  4: '1rem',      // 16px
  5: '1.25rem',   // 20px
  6: '1.5rem',    // 24px
  8: '2rem',      // 32px
  10: '2.5rem',   // 40px
  12: '3rem',     // 48px
  16: '4rem',     // 64px
  20: '5rem',     // 80px
  24: '6rem',     // 96px
} as const;

export const borderRadius = {
  none: '0',
  sm: '4px',
  md: '8px',
  lg: '12px',
  xl: '16px',
  '2xl': '24px',
  full: '9999px',
} as const;

export const shadows = {
  // Layered depth shadows
  sm: '0 1px 2px rgba(0, 0, 0, 0.3)',
  md: '0 4px 6px rgba(0, 0, 0, 0.3), 0 1px 3px rgba(0, 0, 0, 0.2)',
  lg: '0 10px 15px rgba(0, 0, 0, 0.3), 0 4px 6px rgba(0, 0, 0, 0.2)',
  xl: '0 20px 25px rgba(0, 0, 0, 0.3), 0 8px 10px rgba(0, 0, 0, 0.2)',
  '2xl': '0 25px 50px rgba(0, 0, 0, 0.4)',
  inner: 'inset 0 2px 4px rgba(0, 0, 0, 0.3)',
  glow: '0 0 20px rgba(99, 102, 241, 0.3)',
} as const;

export const transitions = {
  // Transition timing
  duration: {
    fast: '100ms',
    normal: '200ms',
    slow: '300ms',
    slower: '500ms',
  },

  // Easing functions
  easing: {
    default: 'cubic-bezier(0.4, 0, 0.2, 1)',
    easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
    easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
    easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    spring: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
  },
} as const;

export const layout = {
  // Container widths
  container: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  },

  // Sidebar width
  sidebar: {
    collapsed: '64px',
    expanded: '280px',
  },

  // Header height
  header: {
    height: '64px',
  },
} as const;

export const zIndex = {
  dropdown: 100,
  sticky: 200,
  modal: 300,
  toast: 400,
  tooltip: 500,
} as const;

// CSS custom properties export for runtime use
export const cssVariables = {
  '--color-background-primary': colors.background.primary,
  '--color-background-secondary': colors.background.secondary,
  '--color-background-tertiary': colors.background.tertiary,
  '--color-text-primary': colors.text.primary,
  '--color-text-secondary': colors.text.secondary,
  '--color-accent-primary': colors.accent.primary,
  '--color-accent-secondary': colors.accent.secondary,
  '--border-radius-md': borderRadius.md,
  '--border-radius-lg': borderRadius.lg,
  '--shadow-md': shadows.md,
  '--shadow-glow': shadows.glow,
  '--transition-duration-normal': transitions.duration.normal,
  '--transition-easing-default': transitions.easing.default,
} as const;
