/**
 * Constants for canvas element interactions.
 * All pixel values are in screen-space unless noted.
 */

// ── Thresholds ──
export const DRAG_THRESHOLD = 5; // px — dead zone to distinguish click from drag
export const HANDLE_SIZE = 8; // px — visual size of resize handles
export const HANDLE_HIT_AREA = 12; // px — hit area (larger than visual for easier grabbing)
export const ROTATION_HANDLE_DISTANCE = 24; // px above top-center
export const ROTATION_SNAP_DEGREES = 15;
export const NUDGE_SMALL = 1; // px
export const NUDGE_LARGE = 10; // px
export const MIN_ELEMENT_SIZE = 20; // px — minimum element dimension
export const DUPLICATE_OFFSET = 20; // px
export const ALIGNMENT_SNAP_THRESHOLD = 4; // px

// ── Colors ──
export const SELECTION_STROKE_COLOR = 0x3b82f6; // blue-500
export const HANDLE_FILL_COLOR = 0xffffff;
export const HANDLE_STROKE_COLOR = 0x3b82f6;
export const MARQUEE_FILL_COLOR = 0x3b82f6;
export const MARQUEE_FILL_ALPHA = 0.08;
export const MARQUEE_STROKE_COLOR = 0x3b82f6;
export const MARQUEE_STROKE_ALPHA = 0.5;
export const GUIDE_COLOR = 0x3b82f6; // blue-500 (matches selection color)
export const GUIDE_ALPHA = 0.8;
export const GUIDE_DASH_LENGTH = 6; // px — screen-space dash segment length
export const GUIDE_GAP_LENGTH = 4; // px — screen-space gap between dashes
