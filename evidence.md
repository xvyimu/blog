# Evidence · CH-PERF-006 · client boundary trim (rsc-nav)

| Field | Value |
|-------|--------|
| Branch | `xvyimu/ch-perf-rsc-nav` |
| Date | 2026-07-24 |
| Scope | MagneticCard · RevealOnScroll · SiteBackdropParallax · Header (+ hooks) |
| Stack lock | Next 16 · React 19 · CSP nonce **not** relaxed |

## Changes (boundary evidence)

### Header — client surface net-reduced

| Before | After |
|--------|--------|
| Entire `Header.tsx` was `'use client'` (brand, desktop nav, search, theme, mobile sheet, scroll class) | **RSC shell** `Header.tsx` (async server component): brand + desktop nav + search button as server HTML |
| One client tree hydrates all chrome | Client islands only: `HeaderScrollState` (rAF scroll class), `ThemeToggle`, `MobileNav` (Sheet + `usePathname`) |
| Scroll listener setState every scroll event | `HeaderScrollState` coalesces via rAF + classList toggle (no React re-render of nav) |
| Active desktop link required client pathname | `proxy.ts` stamps `x-pathname` on **every** request (incl. dev); Header reads `headers().get('x-pathname')` |

### SiteBackdropParallax — conditional mount + defer

| Before | After |
|--------|--------|
| Eager client import in root layout | `SiteBackdropParallaxGate` → `next/dynamic(..., { ssr: false })` defers chunk |
| Only `matchMedia` reduce gate inside effect | `usePrefersReducedMotion` **and** `usePrefersFinePointer`; no listeners when either fails |
| `pointermove` without passive | `{ passive: true }` |

### MagneticCard — fewer pointer/rAF paths

| Before | After |
|--------|--------|
| Always attach `onPointerMove` / `onPointerLeave` | Handlers **omitted** when `!motionEnabled` (`reduced` or coarse pointer) |
| Reduced-motion only via hook | + fine-pointer gate; cleanup effect clears transform when motion disabled |

### RevealOnScroll — skip IO on reduced motion

| Before | After |
|--------|--------|
| Always `useInView` → IntersectionObserver | `useInView(..., { enabled: !reduced })` — **no observer** when reduced |
| CSS already forces opacity under reduce | Unchanged; JS path now matches (instant `is-visible`) |

### Hooks

- New: `usePrefersFinePointer` (`(hover: hover) and (pointer: fine)`)
- `useInView` gains `enabled?: boolean` (default true)

## Verification

| Command | Exit |
|---------|------|
| `pnpm typecheck` | **0** |
| `pnpm test` (Vitest) | **0** · **723** tests / **96** files |
| Focused: Header / MagneticCard / Parallax / Reveal / useInView / usePrefersFinePointer | **0** |
| `NEXT_PUBLIC_SITE_URL=https://incca.ccwu.cc pnpm build` | **0** · Next 16.2.11 · 108 routes · Proxy present |

Environment note: local Node **v24.16.0** (engines want 22.x — WARN only).

## Not done (out of scope / red lines)

- No CSP relax / no search engine change / no links schema / no MDX highlight rewrite
- No `git push`
- Desktop active nav still depends on proxy `x-pathname` (soft client navigations re-render RSC with updated header)

## Orca

```text
orca worktree set --worktree active --comment "006 rsc-nav done" --workspace-status in-review --json
```
