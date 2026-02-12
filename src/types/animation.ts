import type { JsonValue } from './common';

/**
 * Playback status of the animation timeline.
 *
 * Spec reference: Section 6.4
 */
export type PlaybackStatus = 'idle' | 'playing' | 'paused' | 'stopped';

/**
 * Playback speed multiplier.
 *
 * Spec reference: Section 6.4
 */
export type PlaybackSpeed = 0.25 | 0.5 | 1 | 1.5 | 2 | 4;

/**
 * GSAP easing string identifiers.
 *
 * Spec reference: Section 6.4 (keyframe interpolation)
 */
export type KeyframeEasing =
	| 'none'
	| 'power1.in'
	| 'power1.out'
	| 'power1.inOut'
	| 'power2.in'
	| 'power2.out'
	| 'power2.inOut'
	| 'power3.in'
	| 'power3.out'
	| 'power3.inOut'
	| 'back.in'
	| 'back.out'
	| 'back.inOut'
	| 'bounce.in'
	| 'bounce.out'
	| 'bounce.inOut'
	| 'elastic.in'
	| 'elastic.out'
	| 'elastic.inOut'
	| 'linear'
	| string; // Allow custom cubic-bezier or other GSAP easing strings

/**
 * Animatable element properties.
 * Dot-notation paths into SceneElement fields.
 *
 * Spec reference: Section 6.4
 */
export type AnimatableProperty =
	| 'position.x'
	| 'position.y'
	| 'size.width'
	| 'size.height'
	| 'rotation'
	| 'opacity'
	| 'style.fill'
	| 'style.stroke'
	| 'style.strokeWidth'
	| 'style.cornerRadius'
	| 'style.fontSize'
	| 'style.textColor'
	| string; // Allow custom metadata properties

/**
 * A single keyframe in an animation sequence.
 * Represents a property change at a specific time.
 *
 * Spec reference: Section 6.4
 */
export interface Keyframe {
	id: string;
	elementId: string;
	/** Seconds from sequence start */
	time: number;
	/** Dot-notation property path */
	property: AnimatableProperty;
	value: JsonValue;
	easing: KeyframeEasing;
	/** Duration of the transition in seconds */
	duration: number;
}

/**
 * Named time marker on the timeline.
 * Used for labeling animation phases (e.g., "Partition", "Merge").
 *
 * Spec reference: Section 6.4
 */
export interface TimelineMarker {
	time: number;
	label: string;
	color: string;
}

/**
 * Built-in composite animation types.
 *
 * Spec reference: Section 6.3
 */
export type CompositeAnimationType =
	| 'swap'
	| 'highlight'
	| 'fadeIn'
	| 'fadeOut'
	| 'slideIn'
	| 'slideOut'
	| 'pulse'
	| 'shake'
	| 'grow'
	| 'shrink'
	| 'colorTransition'
	| 'pathFollow'
	| 'typewriter'
	| 'cascade';

/**
 * A named sequence of keyframes and markers.
 * The GSAP Timeline instance is runtime-only — this stores the serializable data
 * that the TimelineManager uses to rebuild the GSAP timeline.
 *
 * Spec reference: Section 6.4
 */
export interface AnimationSequence {
	id: string;
	name: string;
	/** Total duration in seconds */
	duration: number;
	keyframes: Keyframe[];
	markers: TimelineMarker[];
}

/**
 * Current playback state for the timeline store.
 */
export interface PlaybackState {
	status: PlaybackStatus;
	speed: PlaybackSpeed;
	/** Current playhead position in seconds */
	currentTime: number;
	/** Whether the animation loops */
	loop: boolean;
}
