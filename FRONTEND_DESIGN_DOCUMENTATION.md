# LiftMind Frontend Design System Documentation

## Overview
LiftMind is a modern powerlifting AI coach application built with Next.js 15, featuring a dark, professional design system with electric blue and champion gold accents. The design emphasizes performance, strength, and high-tech aesthetics suitable for elite powerlifters.

## Tech Stack
- **Framework**: Next.js 15 with App Router
- **Styling**: Tailwind CSS with custom design tokens
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **Fonts**: Inter (body), Space Grotesk (display)
- **Language**: TypeScript

## Color Palette

### Primary Colors
```css
/* Dark base - deep, professional blacks */
dark-950: #050508  /* Primary background */
dark-900: #0a0a0f  /* Cards, modals */
dark-800: #12121a  /* Input backgrounds */
dark-700: #1a1a24  /* Borders, dividers */
dark-600: #23232e  /* Secondary borders */
dark-500: #2c2c38  /* Hover states */
dark-400: #3a3a48  /* Text on dark */

/* Electric blue - high-tech, sharp, focused */
electric-600: #0084ff  /* Primary buttons */
electric-500: #00a3ff  /* Main accent */
electric-400: #33b5ff  /* Text highlights */
electric-300: #66c7ff  /* Subtle accents */
electric-200: #99d9ff  /* Very light accents */

/* Champion gold - PRs, achievements, elite */
champion-600: #f59e0b  /* Achievement buttons */
champion-500: #fbbf24  /* Secondary accent */
champion-400: #fcd34d  /* Achievement text */
champion-300: #fde68a  /* Light accents */

/* Iron steel - industrial, strong */
iron-600: #4a5568
iron-500: #5a6b7f
iron-400: #6b7c92
iron-300: #8896a8
```

### Text Colors
```css
/* Primary text */
text-white: #ffffff
text-slate-100: #f1f5f9
text-slate-200: #e2e8f0
text-slate-300: #cbd5e1

/* Secondary text */
text-slate-400: #94a3b8
text-slate-500: #64748b
text-slate-600: #475569
```

## Typography

### Font Families
```css
font-sans: ['Inter', 'system-ui', 'sans-serif']
font-display: ['Space Grotesk', 'Inter', 'system-ui', 'sans-serif']
```

### Typography Scale
```css
/* Headers */
.section-header {
  @apply font-display text-3xl md:text-4xl font-bold;
  @apply bg-gradient-to-r from-electric-400 to-champion-400 bg-clip-text text-transparent;
}

/* Gradient text effect */
.gradient-text {
  @apply bg-clip-text text-transparent;
  background-image: linear-gradient(135deg, #00a3ff 0%, #fbbf24 100%);
  background-size: 200% 200%;
  animation: gradientShift 3s ease infinite;
}
```

## Component System

### Button Component
```typescript
// Variants: 'primary' | 'secondary' | 'ghost'
// Sizes: 'sm' | 'md' | 'lg'

<Button variant="primary" size="md">Primary Action</Button>
<Button variant="secondary" size="sm">Secondary</Button>
<Button variant="ghost" size="lg">Ghost Button</Button>
```

**Styles:**
- Primary: Electric blue gradient with hover effects
- Secondary: Dark background with border
- Ghost: Transparent with hover states

### Card Component
```typescript
<Card className="p-6">
  {/* Glass morphism card with backdrop blur */}
</Card>
```

**Features:**
- Glass morphism effect
- Backdrop blur
- Dark semi-transparent background
- Subtle borders

### Input Components
```typescript
// Input with optional label
<Input label="Email" type="email" placeholder="Enter email" />

// Textarea with label
<Textarea label="Notes" rows={3} placeholder="Enter notes..." />

// Select with options
<Select 
  label="Exercise" 
  options={[
    { value: 'squat', label: 'Squat' },
    { value: 'bench', label: 'Bench Press' }
  ]} 
/>
```

**Common Features:**
- Dark backgrounds with electric blue focus states
- Consistent border radius (rounded-xl)
- Focus rings with electric blue
- Label support with proper spacing

### Loading Component
```typescript
<Loading />
```

**Features:**
- Spinning indicator with electric blue color
- Consistent with brand colors

## Layout System

### Root Layout
```typescript
// Fixed background with mesh gradient and grid pattern
<div className="fixed inset-0 bg-mesh-dark opacity-50 pointer-events-none" />
<div className="fixed inset-0 grid-pattern opacity-30 pointer-events-none" />
```

### Navigation
- **Desktop**: Fixed sidebar (64 width units) with glass morphism
- **Mobile**: Bottom navigation bar
- Active states with electric blue gradients and glow effects
- Logo with animated gradient background

### Responsive Design
```css
/* Mobile-first approach */
md:ml-64  /* Desktop sidebar offset */
pb-20 md:pb-0  /* Mobile bottom nav spacing */
```

## Background Effects

### Mesh Gradient
```css
.bg-mesh-dark {
  background: 
    radial-gradient(at 40% 20%, rgba(0, 163, 255, 0.12) 0px, transparent 50%),
    radial-gradient(at 80% 0%, rgba(251, 191, 36, 0.08) 0px, transparent 50%),
    radial-gradient(at 0% 50%, rgba(74, 85, 104, 0.08) 0px, transparent 50%),
    linear-gradient(135deg, #0a0a0f 0%, #1a1a24 100%);
}
```

### Grid Pattern
```css
.grid-pattern {
  background-image: 
    linear-gradient(rgba(0, 240, 255, 0.05) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0, 240, 255, 0.05) 1px, transparent 1px);
  background-size: 50px 50px;
}
```

## Animation System

### Framer Motion Presets
```typescript
// Page transitions
initial={{ opacity: 0, y: 20 }}
animate={{ opacity: 1, y: 0 }}
exit={{ opacity: 0, scale: 0.95 }}

// Hover effects
whileHover={{ scale: 1.05 }}
whileTap={{ scale: 0.98 }}
```

### Custom Animations
```css
/* Glow effects */
@keyframes glow {
  0% { box-shadow: 0 0 20px rgba(0, 163, 255, 0.5); }
  100% { box-shadow: 0 0 30px rgba(0, 163, 255, 0.8), 0 0 40px rgba(0, 163, 255, 0.4); }
}

/* Gradient text animation */
@keyframes gradientShift {
  0%, 100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
}
```

## Shadow System
```css
/* Neon effects */
shadow-neon: 0 0 20px rgba(0, 163, 255, 0.6)
shadow-neon-lg: 0 0 40px rgba(0, 163, 255, 0.4)

/* Champion effects */
shadow-champion: 0 0 20px rgba(251, 191, 36, 0.6)
shadow-champion-lg: 0 0 40px rgba(251, 191, 36, 0.4)

/* Glass morphism */
shadow-glass: 0 8px 32px 0 rgba(0, 0, 0, 0.37)

/* Glow combinations */
shadow-glow-electric: 0 0 30px rgba(0, 163, 255, 0.3), inset 0 0 30px rgba(0, 163, 255, 0.1)
shadow-glow-champion: 0 0 30px rgba(251, 191, 36, 0.3), inset 0 0 30px rgba(251, 191, 36, 0.1)
```

## Utility Classes

### Glass Morphism
```css
.glass-card {
  @apply bg-dark-800/40 backdrop-blur-xl border border-dark-600/50;
  box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);
}
```

### Neon Border Effect
```css
.neon-border {
  @apply relative;
}

.neon-border::before {
  content: '';
  @apply absolute inset-0 rounded-xl;
  padding: 1px;
  background: linear-gradient(135deg, rgba(0, 163, 255, 0.5), rgba(251, 191, 36, 0.5));
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
}
```

### Power Buttons
```css
.btn-power {
  @apply relative overflow-hidden bg-gradient-to-r from-electric-600 to-electric-500 text-white font-bold px-6 py-3 rounded-xl;
  @apply transition-all duration-300 hover:shadow-neon-lg hover:scale-105;
}

.btn-champion {
  @apply relative overflow-hidden bg-gradient-to-r from-champion-600 to-champion-500 text-dark-950 font-bold px-6 py-3 rounded-xl;
  @apply transition-all duration-300 hover:shadow-champion-lg hover:scale-105;
}
```

### Input Styling
```css
.input-dark {
  @apply bg-dark-800/50 border border-dark-600 text-slate-100 rounded-xl px-4 py-3;
  @apply focus:outline-none focus:border-electric-500 focus:ring-2 focus:ring-electric-500/20;
  @apply placeholder-slate-500 transition-all;
}
```

## Custom Scrollbar
```css
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background-color: #0a0a0f;
}

::-webkit-scrollbar-thumb {
  background-color: #23232e;
  border-radius: 9999px;
}

::-webkit-scrollbar-thumb:hover {
  background-color: #2c2c38;
}
```

## Special Components

### ActionCard
Interactive confirmation cards with gradient backgrounds and action buttons for AI-suggested actions.

### Navigation
Responsive navigation with:
- Desktop: Fixed sidebar with glass morphism
- Mobile: Bottom tab bar
- Active state indicators with glow effects
- Logo with animated background

### MediaUpload
File upload component with drag-and-drop support and preview capabilities.

## Design Principles

1. **Dark-First**: All components designed for dark backgrounds
2. **Glass Morphism**: Subtle transparency and backdrop blur effects
3. **Electric Accents**: Strategic use of electric blue for primary actions
4. **Champion Highlights**: Gold accents for achievements and success states
5. **Smooth Animations**: Framer Motion for all interactions
6. **Responsive**: Mobile-first design with desktop enhancements
7. **Accessibility**: Proper focus states and color contrast
8. **Performance**: Optimized animations and efficient CSS

## Usage Guidelines

### Color Usage
- **Electric Blue**: Primary actions, links, active states
- **Champion Gold**: Achievements, PRs, success states
- **Dark Grays**: Backgrounds, cards, borders
- **White/Light Grays**: Primary text content

### Animation Guidelines
- Use subtle hover effects (scale: 1.05)
- Tap feedback (scale: 0.98)
- Page transitions with opacity and slight movement
- Glow effects for important elements

### Typography Guidelines
- Use `font-display` (Space Grotesk) for headers and branding
- Use `font-sans` (Inter) for body text
- Gradient text for hero elements and important headers
- Consistent text color hierarchy

This design system creates a cohesive, modern, and professional appearance suitable for a high-end powerlifting application while maintaining excellent usability and accessibility.
