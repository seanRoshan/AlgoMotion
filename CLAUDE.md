# AlgoMotion — Algorithm & CS Animation Studio

## Project Overview

Browser-based interactive animation studio for creating, editing, and exporting visual explanations of algorithms, data structures, and CS concepts.

- **Repo**: `seanRoshan/AlgoMotion`
- **Spec**: See `spec.md` for full technical specification
- **Issues**: GitHub Issues with milestones, labels, and dependency tracking

## Tech Stack (pinned versions)

| Technology | Version | Notes |
|---|---|---|
| Next.js (App Router) | 16.x | React 19.2, React Compiler, Turbopack |
| TypeScript | 5.9+ | Strict mode |
| Tailwind CSS | 4.1 | Oxide engine, CSS-first config |
| Pixi.js | 8.16+ | Imperative API (NO @pixi/react) |
| GSAP | 3.14+ | 100% free (Webflow), all plugins |
| Zustand | 5.x | Record<> only, NO Map/Set |
| ELK.js | 0.11+ | Graph layout (NOT Dagre) |
| Monaco Editor | 0.55+ | Code editor |
| shadcn/ui + radix-ui | Latest | Unified radix-ui package |
| Supabase | Latest | Auth + DB + Storage |
| Biome | 2.3+ | Lint + format (NOT eslint/prettier) |
| Vitest | 4.x | Unit/integration tests |
| Playwright | 1.58+ | E2E tests |
| pnpm | 10.x | Package manager |

## Architecture Rules

1. **React handles UI chrome ONLY** — panels, toolbars, menus, modals
2. **Pixi.js via imperative SceneManager** — no React reconciler for canvas
3. **GSAP manipulates Pixi.js displayObjects directly** during playback
4. **Zustand is single source of truth** — all stores must serialize to JSON
5. **Stores use `Record<string, T>` and `string[]`** — NEVER `Map<>` or `Set<>`
6. **Supabase for all cloud services** — Auth, PostgreSQL, Storage (NOT Vercel Blob/KV/Postgres)
7. **Biome for all linting and formatting** — NOT eslint, NOT prettier

## Code Conventions

### Branching
- Feature branches: `feat/issue-{number}-{short-description}`
- Always branch from `main`

### Commits
- Conventional commits: `feat:`, `fix:`, `chore:`, `test:`, `docs:`, `refactor:`
- Reference issue: `feat: add timeline scrubber (#42)`
- Co-author line included automatically

### Code Style
- Biome handles formatting and linting — run `pnpm biome check --write` before committing
- TypeScript strict mode — no `any` unless unavoidable (add `// biome-ignore` with reason)
- Prefer named exports over default exports
- Use `satisfies` for type-safe object literals
- Async/await over raw promises

### Testing
- **TDD**: Write tests BEFORE implementation
- Unit tests: `src/**/*.test.ts` (colocated)
- Integration tests: `tests/integration/`
- E2E tests: `tests/e2e/`
- Minimum coverage: all acceptance criteria from the issue must have corresponding tests

### File Structure
```
src/
├── app/                    # Next.js App Router pages & layouts
├── components/
│   ├── ui/                 # shadcn/ui primitives
│   ├── canvas/             # Pixi.js canvas components
│   ├── editor/             # Monaco editor wrapper
│   ├── timeline/           # Timeline/scrubber UI
│   └── panels/             # Layout panels (sidebar, toolbar, etc.)
├── lib/
│   ├── pixi/               # SceneManager, renderers, display objects
│   ├── gsap/               # TimelineManager, animation engine
│   ├── stores/             # Zustand stores (sceneStore, timelineStore, etc.)
│   ├── dsl/                # Peggy.js parser + AST
│   ├── elk/                # Graph layout engine wrapper
│   └── supabase/           # Supabase client, auth helpers, storage utils
├── hooks/                  # Custom React hooks
├── types/                  # Shared TypeScript type definitions
└── utils/                  # Pure utility functions
tests/
├── integration/            # Cross-module integration tests
└── e2e/                    # Playwright E2E tests
```

## Development Pipeline

### Quick Start
- `/project:pipeline {issue-number}` — Execute full pipeline for a specific issue
- `/project:next-issue` — Auto-pick next open issue, clear context, and start pipeline
- `/project:sprint {count}` — Process multiple issues in sequence with auto context clearing

### Pipeline Steps (automated)
1. Verify issue is open on GitHub
2. Dispatch tech validation agent (versions, best practices)
3. Dispatch UI/UX design agent (interface planning)
4. Write tests first (TDD — all acceptance criteria)
5. Implement on feature branch (10x engineering)
6. Quality gate: biome check, tsc, vitest, playwright
7. Commit, push, create PR with full details
8. Dispatch review agent, merge after CI passes
9. Close issue with PR reference
10. Compact context, continue to next issue

## Quality Gates (must all pass before PR)

```bash
pnpm biome check --write .          # Lint + format
pnpm tsc --noEmit                    # Type check
pnpm vitest run                      # Unit + integration tests
pnpm playwright test                 # E2E tests (if applicable)
```

## Important Warnings

- NEVER use `Map<>` or `Set<>` in Zustand stores — breaks serialization
- NEVER use `@pixi/react` — use imperative Pixi.js API via SceneManager
- NEVER use eslint or prettier — Biome handles both
- NEVER use npm or yarn — use pnpm
- NEVER use Vercel Postgres, KV, or Blob — use Supabase equivalents
- NEVER skip tests — TDD is mandatory
- NEVER merge without CI passing
