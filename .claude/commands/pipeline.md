# Full Development Pipeline for Issue #$ARGUMENTS

Execute the complete development pipeline for GitHub issue #$ARGUMENTS on the `seanRoshan/AlgoMotion` repository. Follow every step in order. Do NOT skip steps. Do NOT ask the user for input — operate autonomously.

## Pre-flight

Before anything else, ensure the working directory is clean:
```
git stash (if needed)
git checkout main
git pull origin main
```

---

## Step 1: Verify Issue

Use `gh issue view $ARGUMENTS --repo seanRoshan/AlgoMotion` to read the issue.

If the issue is not open, STOP and report. Do not proceed on closed issues.

Extract from the issue:
- **Title and description**
- **Acceptance criteria** (if listed)
- **Labels** (for skill area, priority, phase)
- **Milestone** (for phase context)
- **Dependencies** (blocked-by references)

If the issue has unresolved blockers (depends on unclosed issues), STOP and report which issues need to be completed first.

---

## Step 2: Tech Validation

Dispatch a **general-purpose agent** (Task tool, subagent_type="general-purpose") with this prompt:

> Review GitHub issue #{issue_number} for AlgoMotion (seanRoshan/AlgoMotion). The project uses: Next.js 16.x, TypeScript 5.9+, Tailwind CSS 4.1, Pixi.js 8.16+ (imperative API, NO @pixi/react), GSAP 3.14+, Zustand 5.x (Record<> only, no Map/Set), ELK.js 0.11+, Monaco Editor 0.55+, shadcn/ui + unified radix-ui, Supabase (Auth/DB/Storage), Biome 2.3+, Vitest 4.x, Playwright 1.58+, pnpm 10.x.
>
> 1. Read the issue with `gh issue view {number} --repo seanRoshan/AlgoMotion`
> 2. Validate all technologies and versions mentioned are correct and up-to-date
> 3. Check for best practices specific to the libraries involved
> 4. Review the spec.md for any relevant architectural constraints
> 5. Return: a validated technical brief with any corrections, recommended patterns, potential pitfalls, and key API references for implementation

Wait for the agent to return. Incorporate its findings.

---

## Step 3: UI/UX Design Planning

Dispatch a **general-purpose agent** (Task tool, subagent_type="general-purpose") with this prompt:

> You are a senior UI/UX designer. Plan the interface for GitHub issue #{issue_number} on AlgoMotion (seanRoshan/AlgoMotion).
>
> 1. Read the issue with `gh issue view {number} --repo seanRoshan/AlgoMotion`
> 2. Read spec.md to understand the overall application layout and design language
> 3. The app uses shadcn/ui + Radix UI + Tailwind CSS 4.1 for UI chrome
> 4. The canvas area uses Pixi.js 8.16+ (imperative, not React)
> 5. Design must be IMPRESSIVE — think professional creative tools (Figma, After Effects, Logic Pro)
> 6. Consider: layout, component hierarchy, interaction patterns, animations, responsive behavior, keyboard shortcuts, accessibility (WCAG 2.1 AA)
> 7. If this issue involves canvas/animation features, describe the visual representation and interaction model
> 8. Return: component breakdown, layout description, interaction flows, accessibility notes, and any shadcn/ui components to use

Wait for the agent to return. Incorporate its design plan.

---

## Step 4: Create Feature Branch

```bash
git checkout -b feat/issue-$ARGUMENTS-{short-description-from-title}
```

Use a kebab-case short description derived from the issue title.

---

## Step 5: Write Tests First (TDD)

Based on the issue's acceptance criteria, the tech validation, and the UI/UX plan:

1. Create test files BEFORE any implementation code
2. Write comprehensive tests covering:
   - Every acceptance criterion from the issue
   - Edge cases and error states
   - Component rendering (if UI)
   - Store behavior (if state management)
   - Integration between modules (if cross-cutting)
3. Use Vitest for unit/integration tests, Playwright for E2E
4. Tests should be in the appropriate location:
   - Unit tests: colocated as `*.test.ts` or `*.test.tsx`
   - Integration: `tests/integration/`
   - E2E: `tests/e2e/`
5. Run `pnpm vitest run` — tests should FAIL (red phase of TDD)
6. Verify all tests fail for the right reasons (missing implementations, not broken tests)

---

## Step 6: Implement Feature

Now implement the feature to make all tests pass:

1. Follow the architectural decisions in CLAUDE.md strictly
2. Use the component breakdown from the UI/UX design plan
3. Apply the technical guidance from the validation agent
4. Write clean, production-quality code — 10x engineer standards:
   - Clear naming, minimal comments (code should be self-documenting)
   - Proper error boundaries and error handling at system boundaries
   - TypeScript strict mode compliance
   - No `any` types unless absolutely necessary
   - Proper separation of concerns
5. For canvas features: use imperative Pixi.js API via SceneManager pattern
6. For state: use Zustand with Record<string, T> — never Map/Set
7. For UI: use shadcn/ui components with Tailwind CSS 4.1
8. Run tests incrementally as you implement — aim for green on each test

---

## Step 7: Quality Gate

Run ALL quality checks. ALL must pass before proceeding.

```bash
pnpm biome check --write .          # Fix lint + format issues
pnpm tsc --noEmit                    # Type checking
pnpm vitest run                      # All tests
pnpm playwright test                 # E2E tests (if any exist)
```

If any check fails:
1. Fix the issue
2. Re-run the failing check
3. Repeat until all pass

---

## Step 8: Commit and Push

```bash
git add -A
git commit -m "feat: {description} (#{issue_number})"
git push -u origin feat/issue-$ARGUMENTS-{branch-name}
```

Use conventional commit format. Reference the issue number.

---

## Step 9: Create Pull Request

Use `gh pr create` with a detailed description:

```bash
gh pr create --title "{title}" --body "$(cat <<'EOF'
## Summary
{2-3 bullet points describing what was implemented}

## Changes
{List of files changed and what each change does}

## Test Plan
{Description of tests written and what they cover}

## UI/UX
{Description of interface changes, if any}

## Issue
Closes #{issue_number}

---
Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

---

## Step 10: Code Review

Dispatch a **code review agent** (Task tool, subagent_type="feature-dev:code-reviewer") with this prompt:

> Review the pull request just created for AlgoMotion issue #{issue_number}.
> Check: code quality, security vulnerabilities, adherence to CLAUDE.md conventions (especially: no Map/Set in stores, imperative Pixi.js, Biome not eslint, pnpm not npm), test coverage of acceptance criteria, TypeScript strictness, performance concerns.
> Use `gh pr diff` and `gh pr view` to examine the PR.
> Report any critical issues that must be fixed before merge.

If the review agent finds critical issues:
1. Fix them on the feature branch
2. Run quality gate again
3. Push fixes
4. Re-review if needed

---

## Step 11: Merge and Close

After review passes:

```bash
gh pr merge --squash --auto
gh issue close $ARGUMENTS --comment "Completed in PR #{pr_number}"
```

---

## Step 12: Cleanup and Next

```bash
git checkout main
git pull origin main
git branch -d feat/issue-$ARGUMENTS-{branch-name}
```

Report completion summary:
- Issue number and title
- PR number and URL
- Tests written (count)
- Files changed (count)

Then tell the user: "Issue #$ARGUMENTS complete. Run `/project:next-issue` to continue, or `/compact` to clear context first."
