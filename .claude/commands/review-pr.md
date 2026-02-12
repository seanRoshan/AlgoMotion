# Review Pull Request #$ARGUMENTS

Dispatch multiple review agents in parallel for a thorough PR review.

## Agent 1: Code Quality Review

Dispatch **feature-dev:code-reviewer** (Task tool) with:

> Review PR #$ARGUMENTS on seanRoshan/AlgoMotion.
> Use `gh pr view $ARGUMENTS --repo seanRoshan/AlgoMotion` and `gh pr diff $ARGUMENTS --repo seanRoshan/AlgoMotion` to examine the PR.
>
> Check for:
> 1. Code quality and readability
> 2. Security vulnerabilities (XSS, injection, etc.)
> 3. CLAUDE.md convention adherence:
>    - No Map/Set in Zustand stores (must use Record<>/string[])
>    - Imperative Pixi.js (no @pixi/react)
>    - Biome for linting (not eslint/prettier)
>    - pnpm (not npm/yarn)
>    - Supabase for cloud services (not Vercel Blob/KV/Postgres)
> 4. TypeScript strictness (no unnecessary `any`)
> 5. Performance concerns (unnecessary re-renders, memory leaks)
> 6. Error handling at system boundaries
>
> Report only HIGH confidence issues that must be fixed.

## Agent 2: Silent Failure Hunt

Dispatch **pr-review-toolkit:silent-failure-hunter** (Task tool) with:

> Review PR #$ARGUMENTS on seanRoshan/AlgoMotion for silent failures, inadequate error handling, and inappropriate fallback behavior.
> Use `gh pr diff $ARGUMENTS --repo seanRoshan/AlgoMotion` to examine changes.

## Agent 3: Test Coverage Analysis

Dispatch **pr-review-toolkit:pr-test-analyzer** (Task tool) with:

> Review PR #$ARGUMENTS on seanRoshan/AlgoMotion for test coverage quality.
> Verify all acceptance criteria from the linked issue have corresponding tests.
> Check for missing edge case tests and integration test gaps.

## After Review

Collect findings from all agents. If any CRITICAL issues found:
1. Fix them on the feature branch
2. Push fixes
3. Re-run quality gate
4. Re-review if needed

If no critical issues:
```bash
gh pr merge $ARGUMENTS --squash --auto --repo seanRoshan/AlgoMotion
```
