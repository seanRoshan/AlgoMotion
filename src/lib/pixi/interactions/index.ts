export { HitTester } from './hit-tester';
export {
	DRAG_THRESHOLD,
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
