---
name: performance-optimization
description: Frontend performance optimization expert for AISTRALE React/Vite applications. Analyzes bundle size, rendering performance, lazy loading, code splitting, image optimization, and Core Web Vitals. Use when optimizing load times, improving performance, or auditing bundle size.
status: ✅ Working
last-validated: 2025-01-27
---

# Performance Optimization

**Status:** ✅
**Last Validated:** 2025-01-27

## Purpose

Invoked when optimizing AISTRALE frontend performance or auditing bundle size. Provides Vite 5 + React 18 performance best practices for Core Web Vitals, code splitting, and rendering optimization in LLM engineering interfaces.

## Bundle Optimization (Vite 5)
- Code splitting by route (`React.lazy()` + `Suspense`)
- Lazy load non-critical components (`const Modal = lazy(() => import('./Modal'))`)
- Tree-shake unused dependencies (Vite does this automatically)
- Use dynamic imports for large libraries (`await import('heavy-lib')`)
- Analyze bundle with `vite-bundle-visualizer` or `rollup-plugin-visualizer`

## Image Optimization
- Use modern formats (WebP, AVIF) with fallbacks
- Lazy load images below the fold (`loading="lazy"`)
- Use responsive images (`srcset`, `sizes` attributes)
- Optimize image dimensions (don't serve 4K for 400px display)
- Use CDN for image delivery (CloudFront, Cloudinary)
- Consider `<picture>` element for art direction

## Rendering Performance (React 18)
- Avoid unnecessary re-renders (`React.memo`, `useMemo`, `useCallback`)
- Use virtualization for long lists (`react-window`, `@tanstack/react-virtual`)
- Debounce/throttle expensive operations (search inputs, scroll handlers)
- Use CSS transforms for animations (`translate3d` for GPU acceleration)
- Minimize layout shifts (CLS) - reserve space for dynamic content
- Use `startTransition` for non-urgent updates (React 18)

## Core Web Vitals (Targets)
- **LCP** (Largest Contentful Paint): < 2.5s
  - Optimize images, preload critical assets, use CDN
- **FID** (First Input Delay): < 100ms
  - Minimize JavaScript execution, use code splitting
- **CLS** (Cumulative Layout Shift): < 0.1
  - Use skeleton screens, reserve space for dynamic content
- **INP** (Interaction to Next Paint): < 200ms
  - Optimize event handlers, use debouncing

## Best Practices (AISTRALE)
- Minimize third-party scripts (analytics, chat widgets)
- Use service workers for caching (Vite PWA plugin)
- Optimize font loading (`font-display: swap` in Tailwind config)
- Remove `console.log` in production (`vite build` strips them)
- Use production builds (`vite build`, not `vite dev`)
- Enable gzip/brotli compression on server
- Implement proper loading states (skeleton screens, spinners)
- Monitor performance with Lighthouse CI or WebPageTest

