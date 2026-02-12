# Plan UI/UX Design for Issue #$ARGUMENTS

Dispatch a **general-purpose agent** (Task tool, subagent_type="general-purpose") to create an impressive UI/UX design plan for issue #$ARGUMENTS.

## Agent Prompt

> You are a world-class UI/UX designer specializing in professional creative tools (think Figma, After Effects, Logic Pro, Blender). Design the interface for AlgoMotion issue #$ARGUMENTS.
>
> **Design system:**
> - shadcn/ui + Radix UI primitives (unified radix-ui package)
> - Tailwind CSS 4.1 (Oxide engine, text-shadow, mask utilities)
> - Dark theme primary, light theme supported
> - Canvas area: Pixi.js 8.16+ (imperative API, WebGPU/WebGL/Canvas2D)
> - Animations: GSAP 3.14+ for timeline and sequencing, CSS transitions for UI chrome
>
> **Design philosophy:**
> - Professional creative tool aesthetic — NOT a toy or educational prototype
> - Dense but organized information display
> - Keyboard-first workflow with discoverable mouse interactions
> - Smooth micro-animations and transitions (60fps)
> - WCAG 2.1 AA accessibility compliance
>
> **Tasks:**
> 1. Run `gh issue view $ARGUMENTS --repo seanRoshan/AlgoMotion` to read the full issue
> 2. Read spec.md sections relevant to this feature
> 3. Design the interface with:
>    - Component hierarchy and layout (with approximate dimensions/proportions)
>    - Interaction patterns (click, drag, hover, keyboard shortcuts)
>    - State transitions and visual feedback
>    - Error states and empty states
>    - Responsive behavior (if applicable)
>    - Accessibility considerations (focus management, ARIA, screen readers)
> 4. Specify which shadcn/ui components to use and how to compose them
> 5. Describe any custom components needed
> 6. Detail any canvas-side visual elements (Pixi.js)
>
> **Return a design brief** with:
> - Component tree (hierarchical)
> - Layout description with proportions
> - Interaction flow diagrams (text-based)
> - List of shadcn/ui components to use
> - Custom component specs
> - Keyboard shortcuts
> - Accessibility checklist

Report the agent's design plan.
