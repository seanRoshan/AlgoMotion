# Sprint: Process $ARGUMENTS Issues in Sequence

Operate fully autonomously. Process up to $ARGUMENTS issues in sequence, clearing context between each one.

## Process

For each issue (up to $ARGUMENTS total):

### 1. Find Next Issue
```bash
gh issue list --repo seanRoshan/AlgoMotion --state open --json number,title,labels,milestone --limit 50
```

Select using priority: Phase 1 > Phase 2 > ... > Phase 5, then by priority label, then by issue number. Skip blocked issues.

### 2. Run Full Pipeline
Execute all steps from the pipeline command (`.claude/commands/pipeline.md`) for the selected issue:
- Verify issue is open
- Dispatch tech validation agent
- Dispatch UI/UX design agent
- Write tests (TDD)
- Implement on feature branch
- Quality gate (biome, tsc, vitest, playwright)
- Commit, push, create PR
- Review, merge, close issue

### 3. Clear Context
After completing each issue:
1. Report completion summary
2. Use `/compact` to clear context
3. Continue to next issue

### 4. Sprint Summary
After all issues are processed (or no more actionable issues remain), report:

```
Sprint Complete
───────────────
Issues completed: {count}
Issues remaining: {count}
Blocked issues: {list with blockers}
PRs created: {list with URLs}
```
