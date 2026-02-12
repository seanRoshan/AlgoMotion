export { AlignmentGuideRenderer } from './alignment-guide-renderer';
export { HitTester } from './hit-tester';
export {
	ALIGNMENT_SNAP_THRESHOLD,
	DRAG_THRESHOLD,
	GUIDE_ALPHA,
	GUIDE_COLOR,
	GUIDE_DASH_LENGTH,
	GUIDE_GAP_LENGTH,
	HANDLE_HIT_AREA,
	HANDLE_SIZE,
	MIN_ELEMENT_SIZE,
	NUDGE_LARGE,
	NUDGE_SMALL,
	ROTATION_HANDLE_DISTANCE,
	ROTATION_SNAP_DEGREES,
	SELECTION_STROKE_COLOR,
} from './interaction-constants';
export type { InteractionDeps } from './interaction-manager';
export { InteractionManager } from './interaction-manager';
export type {
	HandlePosition,
	HitTestResult,
	InteractionState,
} from './interaction-state';
export {
	computeBoundingBox,
	getAnchorHandle,
	getHandlePosition,
	HANDLE_CURSORS,
} from './interaction-state';
export { SelectionRenderer } from './selection-renderer';
export type { AlignmentGuide, SnapEngineDeps, SnapResult } from './snap-engine';
export { SnapEngine } from './snap-engine';
