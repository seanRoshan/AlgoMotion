# Implement Feature for Issue #$ARGUMENTS

Implement the feature for issue #$ARGUMENTS following 10x engineer standards. Tests should already exist (TDD green phase).

## Pre-checks

1. Ensure you're on a feature branch: `feat/issue-$ARGUMENTS-*`
2. Ensure tests exist and are failing (TDD red phase complete)
3. Read the issue, tech validation brief, and UI/UX design plan

## Implementation Standards

### Architecture
- Follow CLAUDE.md strictly — especially the architecture rules
- React for UI chrome ONLY
- Pixi.js via imperative SceneManager — NO @pixi/react
- GSAP manipulates Pixi.js objects directly during playback
- Zustand stores: Record<string, T> and string[] — NEVER Map/Set

### Code Quality
- TypeScript strict mode — no `any` unless unavoidable
- Clear, descriptive naming — code should be self-documenting
- Minimal comments — only where logic is non-obvious
- Proper error handling at system boundaries (user input, API calls)
- No over-engineering — implement exactly what the issue asks for
- Prefer named exports
- Use `satisfies` for type-safe object literals

### Performance
- Canvas: maintain 60fps for 500+ elements
- React: avoid unnecessary re-renders — use React.memo, useMemo, useCallback where measured
- Zustand: use selectors to prevent over-subscription
- Lazy load heavy modules (Monaco, FFmpeg, etc.)

### Incremental Progress
- Implement one test at a time — make it pass, then move to the next
- Run tests frequently: `pnpm vitest run`
- Commit logical chunks if the feature is large

## Completion Check

All tests must pass:
```bash
pnpm vitest run
```

If any test still fails, continue implementing until all are green.
