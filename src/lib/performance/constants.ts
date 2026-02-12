/**
 * Performance budget constants.
 *
 * Spec reference: Section 10 (Performance Requirements)
 */

/** Maximum elements before performance warning */
export const MAX_ELEMENTS_OPTIMAL = 500;

/** Maximum elements hard limit */
export const MAX_ELEMENTS_LIMIT = 1000;

/** Target frame time in ms (60fps) */
export const TARGET_FRAME_MS = 16;

/** Maximum animation engine step time in ms */
export const MAX_STEP_MS = 50;

/** Maximum IndexedDB save time in ms */
export const MAX_SAVE_MS = 100;

/** Maximum initial bundle size in KB (gzipped) */
export const MAX_BUNDLE_KB = 300;

/** Maximum memory usage in MB */
export const MAX_MEMORY_MB = 512;

/** Debounce delay for performance-sensitive renders */
export const RENDER_DEBOUNCE_MS = 16;

/** Virtual scrolling item height for timeline */
export const VIRTUAL_ITEM_HEIGHT = 32;

/** Number of items to render beyond viewport in virtual lists */
export const VIRTUAL_OVERSCAN = 5;
