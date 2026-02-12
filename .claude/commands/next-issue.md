# Auto-Pick Next Issue and Start Pipeline

Operate fully autonomously. Do NOT ask the user for input.

## Step 1: Compact Context

First, tell the user you are clearing context for a fresh start, then use `/compact` to compress the conversation context. This ensures each issue starts with maximum available context window.

## Step 2: Find Next Issue

Query GitHub for the next actionable issue:

```bash
gh issue list --repo seanRoshan/AlgoMotion --state open --json number,title,labels,milestone,body --limit 50
```

### Issue Selection Priority:
1. **Milestone order**: Phase 1 (Foundation) > Phase 2 > Phase 3 > Phase 4 > Phase 5
2. **Within a milestone**: Issues with NO unresolved blockers come first
3. **Within unblocked issues**: Priority label order: `priority:critical` > `priority:high` > `priority:medium` > `priority:low`
4. **Within same priority**: Lower issue number first (earlier issues scaffold later ones)

### Check for Blockers:
For the candidate issue, check if it depends on any unclosed issues:
- Read the issue body for "blocked by", "depends on", or issue references
- If blocked, skip to the next candidate
- Continue until you find an unblocked issue

## Step 3: Start Pipeline

Once you've identified the next issue, announce it:

> Starting pipeline for Issue #{number}: {title}

Then execute the full pipeline by following all steps from `/project:pipeline {number}`.

Read the pipeline command file at `.claude/commands/pipeline.md` and execute every step for the selected issue.

## Step 4: Loop

After the pipeline completes for this issue, automatically repeat from Step 1:
1. Compact context
2. Find next issue
3. Run pipeline
4. Loop

Continue until there are no more actionable issues, then report:
> All actionable issues have been completed or are blocked. Remaining blocked issues: {list}
