# Close Issue #$ARGUMENTS

Close the GitHub issue after the PR has been merged.

## Steps

### 1. Verify PR is Merged
```bash
gh pr list --repo seanRoshan/AlgoMotion --state merged --search "$ARGUMENTS"
```

Find the PR that references issue #$ARGUMENTS. If no merged PR exists, STOP — the issue should not be closed.

### 2. Close the Issue
```bash
gh issue close $ARGUMENTS --repo seanRoshan/AlgoMotion --comment "Completed in PR #{pr_number}. All tests passing, CI green."
```

### 3. Cleanup Local Branch
```bash
git checkout main
git pull origin main
git branch -d feat/issue-$ARGUMENTS-*
```

### 4. Report
```
Issue #$ARGUMENTS: CLOSED
─────────────────────────
PR: #{pr_number} (merged)
Branch: cleaned up
```
