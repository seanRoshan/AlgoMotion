/**
 * Zustand store for Algorithm Race Mode state.
 *
 * Manages race lanes, countdown, winner detection,
 * per-lane speed controls, and shared input data.
 *
 * Spec reference: Section 16.2 (Algorithm Race Mode)
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

// ── Types ──

export type RaceStatus = 'idle' | 'countdown' | 'racing' | 'finished';
export type LaneStatus = 'idle' | 'running' | 'completed';

export interface LaneMetrics {
	currentStep: number;
	totalSteps: number;
	comparisons: number;
	swaps: number;
}

export interface RaceLane {
	id: string;
	algorithmName: string;
	speed: number;
	status: LaneStatus;
	metrics: LaneMetrics;
}

// ── State & Actions ──

export interface RaceState {
	status: RaceStatus;
	lanes: Record<string, RaceLane>;
	laneIds: string[];
	winnerId: string | null;
	countdownValue: number;
	sharedInput: number[];
}

export interface RaceActions {
	addLane: (id: string, algorithmName: string) => void;
	removeLane: (id: string) => void;
	setLaneSpeed: (id: string, speed: number) => void;
	setLaneStatus: (id: string, status: LaneStatus) => void;
	updateLaneMetrics: (id: string, updates: Partial<LaneMetrics>) => void;
	startCountdown: () => void;
	startRace: () => void;
	finishRace: (winnerId: string) => void;
	setCountdownValue: (value: number) => void;
	setSharedInput: (input: number[]) => void;
	reset: () => void;
}

export type RaceStore = RaceState & RaceActions;

const initialState: RaceState = {
	status: 'idle',
	lanes: {},
	laneIds: [],
	winnerId: null,
	countdownValue: 3,
	sharedInput: [],
};

export const useRaceStore = create<RaceStore>()(
	devtools(
		immer((set) => ({
			...initialState,

			addLane: (id, algorithmName) =>
				set((state) => {
					state.lanes[id] = {
						id,
						algorithmName,
						speed: 1,
						status: 'idle',
						metrics: {
							currentStep: 0,
							totalSteps: 0,
							comparisons: 0,
							swaps: 0,
						},
					};
					state.laneIds.push(id);
				}),

			removeLane: (id) =>
				set((state) => {
					delete state.lanes[id];
					state.laneIds = state.laneIds.filter((lid) => lid !== id);
				}),

			setLaneSpeed: (id, speed) =>
				set((state) => {
					const lane = state.lanes[id];
					if (lane) lane.speed = speed;
				}),

			setLaneStatus: (id, status) =>
				set((state) => {
					const lane = state.lanes[id];
					if (lane) lane.status = status;
				}),

			updateLaneMetrics: (id, updates) =>
				set((state) => {
					const lane = state.lanes[id];
					if (lane) {
						Object.assign(lane.metrics, updates);
					}
				}),

			startCountdown: () =>
				set((state) => {
					state.status = 'countdown';
					state.countdownValue = 3;
				}),

			startRace: () =>
				set((state) => {
					state.status = 'racing';
				}),

			finishRace: (winnerId) =>
				set((state) => {
					state.status = 'finished';
					state.winnerId = winnerId;
				}),

			setCountdownValue: (value) =>
				set((state) => {
					state.countdownValue = value;
				}),

			setSharedInput: (input) =>
				set((state) => {
					state.sharedInput = input;
				}),

			reset: () => set(initialState),
		})),
		{ name: 'RaceStore', enabled: process.env.NODE_ENV === 'development' },
	),
);
