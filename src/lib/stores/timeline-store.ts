import { create } from 'zustand';
import { createJSONStorage, devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type {
	AnimationSequence,
	Keyframe,
	PlaybackSpeed,
	PlaybackState,
	PlaybackStatus,
	TimelineMarker,
} from '@/types';
import { dexieStorage } from './dexie-storage';

export interface TimelineState {
	sequences: Record<string, AnimationSequence>;
	sequenceIds: string[];
	playback: PlaybackState;
	duration: number;
}

export interface TimelineActions {
	addSequence: (sequence: AnimationSequence) => void;
	removeSequence: (id: string) => void;
	updateSequence: (id: string, updates: Partial<AnimationSequence>) => void;
	addKeyframe: (sequenceId: string, keyframe: Keyframe) => void;
	removeKeyframe: (sequenceId: string, keyframeId: string) => void;
	addMarker: (sequenceId: string, marker: TimelineMarker) => void;
	play: () => void;
	pause: () => void;
	stop: () => void;
	seek: (time: number) => void;
	setSpeed: (speed: PlaybackSpeed) => void;
	setStatus: (status: PlaybackStatus) => void;
	toggleLoop: () => void;
	setDuration: (duration: number) => void;
	reset: () => void;
}

export type TimelineStore = TimelineState & TimelineActions;

const initialPlayback: PlaybackState = {
	status: 'idle',
	speed: 1,
	currentTime: 0,
	loop: false,
};

const initialState: TimelineState = {
	sequences: {},
	sequenceIds: [],
	playback: { ...initialPlayback },
	duration: 0,
};

export const useTimelineStore = create<TimelineStore>()(
	devtools(
		persist(
			immer((set) => ({
				...initialState,

				addSequence: (sequence) =>
					set((state) => {
						state.sequences[sequence.id] = sequence;
						state.sequenceIds.push(sequence.id);
					}),

				removeSequence: (id) =>
					set((state) => {
						delete state.sequences[id];
						state.sequenceIds = state.sequenceIds.filter((sid) => sid !== id);
					}),

				updateSequence: (id, updates) =>
					set((state) => {
						const seq = state.sequences[id];
						if (seq) {
							Object.assign(seq, updates);
						}
					}),

				addKeyframe: (sequenceId, keyframe) =>
					set((state) => {
						const seq = state.sequences[sequenceId];
						if (seq) {
							seq.keyframes.push(keyframe);
						}
					}),

				removeKeyframe: (sequenceId, keyframeId) =>
					set((state) => {
						const seq = state.sequences[sequenceId];
						if (seq) {
							seq.keyframes = seq.keyframes.filter((kf) => kf.id !== keyframeId);
						}
					}),

				addMarker: (sequenceId, marker) =>
					set((state) => {
						const seq = state.sequences[sequenceId];
						if (seq) {
							seq.markers.push(marker);
						}
					}),

				play: () =>
					set((state) => {
						state.playback.status = 'playing';
					}),

				pause: () =>
					set((state) => {
						state.playback.status = 'paused';
					}),

				stop: () =>
					set((state) => {
						state.playback.status = 'stopped';
						state.playback.currentTime = 0;
					}),

				seek: (time) =>
					set((state) => {
						state.playback.currentTime = Math.max(0, Math.min(time, state.duration));
					}),

				setSpeed: (speed) =>
					set((state) => {
						state.playback.speed = speed;
					}),

				setStatus: (status) =>
					set((state) => {
						state.playback.status = status;
					}),

				toggleLoop: () =>
					set((state) => {
						state.playback.loop = !state.playback.loop;
					}),

				setDuration: (duration) =>
					set((state) => {
						state.duration = duration;
					}),

				reset: () => set(initialState),
			})),
			{
				name: 'algomotion-timeline',
				storage: createJSONStorage(() => dexieStorage),
				partialize: (state) => ({
					sequences: state.sequences,
					sequenceIds: state.sequenceIds,
					duration: state.duration,
				}),
			},
		),
		{ name: 'TimelineStore', enabled: process.env.NODE_ENV === 'development' },
	),
);
