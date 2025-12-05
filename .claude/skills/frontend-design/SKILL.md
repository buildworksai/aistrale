---
name: frontend-design
description: Expert frontend design consultant for AISTRALE LLM engineering platform. Provides comprehensive UI/UX design audits focusing on visual hierarchy, typography, spacing, AISTRALE color palette, component design patterns, and professional polish. Use this skill when reviewing designs, creating new interfaces, or when the user requests design improvements. Specializes in corporate/professional aesthetics, SaaS applications, and LLM engineering interfaces.
status: ✅ Working
last-validated: 2025-01-27
---

# Frontend Design Principles

**Status:** ✅
**Last Validated:** 2025-01-27

## Purpose

Invoked when reviewing or creating UI designs for AISTRALE. Provides design system guidelines aligned with AISTRALE branding, color palette (#1565C0 Deep Blue, #FF8F00 Gold, #00ACC1 Teal, #388E3C Green), and corporate/professional aesthetics for LLM engineering interfaces.

## Visual Hierarchy
- Use size, weight, and color to establish clear information hierarchy
- Important elements should be larger, bolder, or more colorful
- Group related elements with proximity and whitespace
- Use consistent spacing scales (4px, 8px, 16px, 24px, 32px, 48px, 64px)

## Typography
- Use max 2-3 font families per project
- Establish a clear type scale (xs, sm, base, lg, xl, 2xl, 3xl, 4xl)
- Line height: 1.5-1.6 for body text, 1.1-1.3 for headings
- Letter spacing: slightly tighter for headings (-0.01em to -0.03em)
- Font weights: 300 (light), 400 (regular), 500 (medium), 600 (semibold), 700 (bold)

## Color Theory (AISTRALE Palette)
- **Primary:** Deep Blue (#1565C0, dark: #0D47A1) - Trust, stability, enterprise
- **Warning:** Gold (#FF8F00, dark: #F57C00) - Attention, premium features
- **Info:** Teal/Electric Blue (#00ACC1, dark: #0097A7) - Information, highlights
- **Success:** Green (#388E3C, dark: #2E7D32) - Confirmations, positive actions
- Use 60-30-10 rule: 60% Deep Blue, 30% neutral grays, 10% accent (Gold/Teal)
- Always ensure 4.5:1 contrast ratio for text (WCAG AA)
- Use Tailwind theme tokens, not hardcoded hex (`bg-blue-600` not `bg-[#1565C0]`)

## Spacing & Layout (Tailwind Scale)
- Spacing scale: 4px base (p-1, m-1), then 4/8/12/16/24/32/48/64px
- Prefer padding over margins for predictability
- Use whitespace generously - don't cram content
- Container max-widths: `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8` (standard)
- Gutters: `gap-4` (mobile), `gap-6` (tablet), `gap-8` (desktop)

## Component Design (Tailwind)
- Cards: `rounded-lg shadow-md p-6` with subtle hover effects
- Buttons: `px-4 py-2 rounded-md` with clear hover/active states
- Forms: Clear labels, helpful placeholders, `ring-2 ring-blue-500` focus states
- Tables: Zebra striping (`even:bg-gray-50`) or hover states, adequate padding
- Icons: 16px-24px for inline, consistent stroke width

## Professional Polish
- Smooth transitions (`transition-all duration-200`)
- Subtle hover effects (`hover:scale-105`)
- Loading states for async actions (skeleton screens)
- Empty states with helpful messaging
- Error states with clear recovery paths
- Toast notifications for user feedback

## Modern Trends (2025)
- Soft shadows and subtle gradients
- Glassmorphism for overlays (`backdrop-blur-sm`)
- Micro-interactions and animations (`animate-*` utilities)
- Bold typography with generous whitespace
- Clean, minimal interfaces for LLM engineering tools

