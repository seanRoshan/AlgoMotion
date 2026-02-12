# Validate Technology Stack for Issue #$ARGUMENTS

Dispatch a **general-purpose agent** (Task tool, subagent_type="general-purpose") to validate the technical approach for issue #$ARGUMENTS.

## Agent Prompt

> You are a senior technical architect validating the implementation approach for AlgoMotion issue #$ARGUMENTS.
>
> **Project tech stack** (pinned versions):
> - Next.js 16.x (App Router, React 19.2, Turbopack)
> - TypeScript 5.9+ (strict mode)
> - Tailwind CSS 4.1 (Oxide engine)
> - Pixi.js 8.16+ (imperative API — NO @pixi/react reconciler)
> - GSAP 3.14+ (100% free, all plugins including ScrollTrigger, MorphSVG, DrawSVG)
> - Zustand 5.x (stores must use Record<string,T> and string[], NEVER Map or Set)
> - ELK.js 0.11+ (graph layout — NOT Dagre which is unmaintained)
> - Monaco Editor 0.55+
> - shadcn/ui + unified radix-ui package + Tailwind 4.1
> - Supabase Auth (@supabase/ssr), PostgreSQL (RLS), Storage (TUS uploads)
> - Biome 2.3+ (lint + format — NOT eslint or prettier)
> - Vitest 4.x + Playwright 1.58+
> - pnpm 10.x (NOT npm or yarn)
>
> **Tasks:**
> 1. Run `gh issue view $ARGUMENTS --repo seanRoshan/AlgoMotion` to read the full issue
> 2. Search the web for the LATEST stable versions of any libraries this issue will use
> 3. Identify best practices, recommended patterns, and common pitfalls for the specific APIs needed
> 4. Check if any architectural constraints from spec.md apply
> 5. Verify the issue description is technically accurate and complete
>
> **Return a technical brief** with:
> - Confirmed library versions to use
> - Recommended API patterns and code examples
> - Potential pitfalls to avoid
> - Any corrections to the issue description
> - Key file paths and modules that will be affected

Report the agent's findings.
