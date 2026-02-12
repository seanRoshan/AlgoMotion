import gsap from 'gsap';
import type { AnimatableProperty, AnimationSequence, Keyframe } from '@/types';

/**
 * Core animation engine wrapping GSAP.
 * Builds GSAP timelines from AnimationSequence data,
 * controls playback, and provides frame-accurate seeking.
 *
 * During playback GSAP mutates target objects (Pixi displayObjects)
 * directly — React is NOT involved. On pause/stop, the caller
 * flushes state back to Zustand via the onUpdate callback.
 *
 * Spec reference: Section 9.1 (AnimationEngine)
 */

// biome-ignore lint/suspicious/noExplicitAny: animation targets are generic Pixi-like objects
type AnimationTarget = Record<string, any>;

/**
 * Maps dot-notation property paths to the nested object structure
 * that GSAP targets. Returns the parent object and the final key.
 */
function resolvePropertyPath(
	target: AnimationTarget,
	property: AnimatableProperty,
): { parent: AnimationTarget; key: string } | null {
	const parts = property.split('.');
	let current = target;

	for (let i = 0; i < parts.length - 1; i++) {
		const part = parts[i];
		if (!part || !(part in current)) return null;
		current = current[part];
	}

	const key = parts[parts.length - 1];
	if (!key) return null;

	return { parent: current, key };
}

export class AnimationEngine {
	private masterTimeline: gsap.core.Timeline;
	private targets: Map<string, AnimationTarget> = new Map();
	private _isReversed = false;
	private _isPlaying = false;

	/** Called on every timeline update (for store sync) */
	onUpdate: (() => void) | null = null;

	/** Called when playback completes */
	onComplete: (() => void) | null = null;

	constructor() {
		this.masterTimeline = gsap.timeline({
			paused: true,
			onUpdate: () => this.onUpdate?.(),
			onComplete: () => {
				if (this.masterTimeline.totalDuration() > 0) {
					this._isPlaying = false;
				}
				this.onComplete?.();
			},
		});
	}

	// ── Accessors ──

	get isPlaying(): boolean {
		return this._isPlaying;
	}

	get currentTime(): number {
		return this.masterTimeline.time();
	}

	get totalDuration(): number {
		return this.masterTimeline.totalDuration();
	}

	get speed(): number {
		return this.masterTimeline.timeScale();
	}

	get isReversed(): boolean {
		return this._isReversed;
	}

	// ── Target Management ──

	/**
	 * Register an animation target (e.g. a Pixi displayObject).
	 * The target must have the properties referenced by keyframes.
	 */
	registerTarget(elementId: string, target: AnimationTarget): void {
		this.targets.set(elementId, target);
	}

	/**
	 * Unregister a target.
	 */
	unregisterTarget(elementId: string): void {
		this.targets.delete(elementId);
	}

	// ── Timeline Building ──

	/**
	 * Build the master timeline from an AnimationSequence.
	 * Clears any existing animations first.
	 */
	buildFromSequence(sequence: AnimationSequence): void {
		this.masterTimeline.clear();

		for (const keyframe of sequence.keyframes) {
			this.addKeyframeToTimeline(keyframe);
		}
	}

	/**
	 * Add a single animation for a specific element.
	 */
	addAnimation(elementId: string, properties: gsap.TweenVars, position: number | string): void {
		const target = this.targets.get(elementId);
		if (!target) return;

		this.masterTimeline.to(target, properties, position);
	}

	// ── Playback Controls ──

	play(): void {
		this._isPlaying = true;
		if (this._isReversed) {
			this.masterTimeline.reverse();
		} else {
			this.masterTimeline.play();
		}
	}

	pause(): void {
		this._isPlaying = false;
		this.masterTimeline.pause();
	}

	seek(time: number): void {
		this.masterTimeline.seek(time, false);
	}

	reverse(): void {
		this._isReversed = !this._isReversed;
	}

	setSpeed(multiplier: number): void {
		this.masterTimeline.timeScale(multiplier);
	}

	// ── Frame Rendering ──

	/**
	 * Render the scene at a specific time point.
	 * Used for seeking, scrubbing, and frame capture.
	 */
	renderAtTime(time: number): void {
		// Use progress-based seeking for accuracy
		const duration = this.masterTimeline.totalDuration();
		if (duration === 0) return;

		const progress = Math.max(0, Math.min(1, time / duration));
		this.masterTimeline.progress(progress);
	}

	// ── Cleanup ──

	/**
	 * Clear all timelines but keep targets registered.
	 */
	clear(): void {
		this.masterTimeline.clear();
		this.masterTimeline.invalidate();
	}

	/**
	 * Destroy the engine and release all resources.
	 */
	destroy(): void {
		this.masterTimeline.kill();
		this.targets.clear();
		this.onUpdate = null;
		this.onComplete = null;
	}

	// ── Private ──

	private addKeyframeToTimeline(keyframe: Keyframe): void {
		const target = this.targets.get(keyframe.elementId);
		if (!target) return;

		const resolved = resolvePropertyPath(target, keyframe.property);
		if (!resolved) return;

		const { parent, key } = resolved;
		const tweenVars: gsap.TweenVars = {
			[key]: keyframe.value,
			duration: keyframe.duration,
			ease: keyframe.easing === 'linear' ? 'none' : keyframe.easing,
		};

		this.masterTimeline.to(parent, tweenVars, keyframe.time);
	}
}
