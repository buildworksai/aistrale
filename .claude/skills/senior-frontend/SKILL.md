---
name: senior-frontend
description: Comprehensive frontend development skill for building modern LLM engineering platform UIs using React 18, TypeScript 5, Vite 5, Tailwind CSS, and React Router DOM. Includes component architecture, performance optimization, state management, and UI best practices for LLM inference interfaces. Use when developing frontend features, optimizing performance, implementing UI components, managing state, or reviewing frontend code.
status: ✅ Working
last-validated: 2025-01-27
---

# Senior Frontend

Complete toolkit for senior frontend with modern tools and best practices for LLM engineering platforms.

## Quick Start

This skill provides comprehensive frontend development guidance for building LLM engineering platform UIs using React, TypeScript, and Vite.

**Key Focus Areas:**
- React component architecture
- TypeScript patterns for type safety
- Vite build optimization
- React Router DOM for routing
- State management patterns
- Performance optimization for LLM interfaces
- AISTRALE branding and design system

## Tech Stack

**Languages:** TypeScript 5, JavaScript
**Frontend:** React 18, Vite 5, React Router DOM
**Styling:** Tailwind CSS
**HTTP Client:** Fetch API (built-in)
**Build Tool:** Vite (not Next.js)
**DevOps:** Docker, GitHub Actions
**Testing:** Vitest (future)

## Development Workflow

### 1. Setup and Configuration

```bash
# Install dependencies
cd frontend
npm install

# Configure environment
cp .env.example .env
```

### 2. Run Development Server

```bash
npm run dev
```

### 3. Build for Production

```bash
npm run build
```

## Best Practices Summary

### Code Quality
- Follow established patterns from `.cursor/rules/`
- Write comprehensive tests
- Use TypeScript strict mode
- Document complex components

### Performance
- Measure before optimizing
- Use code splitting
- Optimize bundle size
- Monitor Core Web Vitals

### Security
- Validate all inputs
- Sanitize user data
- Use secure session cookies
- Handle errors gracefully

### Maintainability
- Write clear code
- Use consistent naming
- Add helpful comments
- Keep it simple

## Common Commands

```bash
# Development (Vite)
npm run dev
npm run build
npm run preview

# Code Quality
npm run lint
npm run type-check
npm run format

# Testing (when implemented)
npm test
```

## Troubleshooting

### Common Issues

- **Build errors:** Check TypeScript errors with `npm run type-check`
- **API connection errors:** Verify VITE_API_URL in `.env`
- **Styling issues:** Check Tailwind config and class names
- **Routing issues:** Verify React Router setup

### Getting Help

- Review `.cursor/rules/` for patterns
- Check React and Vite best practices
- Review browser console for errors
- Check network tab for API issues

## Resources

- **Cursor Rules:** `.cursor/rules/06-typescript-standards.mdc`
- **Testing:** `.cursor/rules/06-testing.mdc`
- **Branding:** `.cursor/rules/19-branding-visual.mdc`
- **Code Quality:** `.cursor/rules/05-code-quality.mdc`

