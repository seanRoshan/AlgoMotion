import { describe, expect, it } from 'vitest';
import { compileDsl } from './compiler';
import { parseDsl } from './parser';

function compile(source: string) {
	const result = parseDsl(source);
	if (!result.ok) {
		throw new Error(`Parse failed: ${result.error.message}`);
	}
	return compileDsl(result.program);
}

describe('DSL Compiler', () => {
	describe('scene compilation', () => {
		it('compiles an empty scene', () => {
			const result = compile('scene "Empty" {}');
			expect(result.scenes).toHaveLength(1);
			expect(result.scenes[0].name).toBe('Empty');
			expect(result.scenes[0].sequence.keyframes).toHaveLength(0);
		});

		it('compiles multiple scenes', () => {
			const result = compile(`
				scene "First" {}
				scene "Second" {}
			`);
			expect(result.scenes).toHaveLength(2);
		});

		it('generates sequence with name', () => {
			const result = compile('scene "Bubble Sort" {}');
			expect(result.scenes[0].sequence.name).toBe('Bubble Sort');
		});
	});

	describe('element declarations', () => {
		it('creates compiled element with correct type and value', () => {
			const result = compile(`
				scene "T" {
					array arr = [5, 3, 8]
				}
			`);
			const elem = result.scenes[0].elements[0];
			expect(elem.elementType).toBe('array');
			expect(elem.name).toBe('arr');
			expect(elem.value).toEqual([5, 3, 8]);
		});

		it('creates element with position', () => {
			const result = compile(`
				scene "T" {
					array arr = [1, 2] at (400, 300)
				}
			`);
			const elem = result.scenes[0].elements[0];
			expect(elem.position).toEqual({ x: 400, y: 300 });
		});
	});

	describe('animation commands', () => {
		it('generates keyframes for highlight', () => {
			const result = compile(`
				scene "T" {
					highlight x color "#FFD700" duration 0.3s
				}
			`);
			const kfs = result.scenes[0].sequence.keyframes;
			expect(kfs.length).toBeGreaterThan(0);
			const fillKf = kfs.find((k) => k.property === 'style.fill');
			expect(fillKf).toBeDefined();
			expect(fillKf?.value).toBe('#FFD700');
		});

		it('generates keyframes for swap', () => {
			const result = compile(`
				scene "T" {
					swap x, y duration 0.5s
				}
			`);
			const kfs = result.scenes[0].sequence.keyframes;
			expect(kfs.length).toBeGreaterThanOrEqual(2);
		});

		it('generates keyframes for mark with color', () => {
			const result = compile(`
				scene "T" {
					mark x color "#4CAF50"
				}
			`);
			const kfs = result.scenes[0].sequence.keyframes;
			const fillKf = kfs.find((k) => k.property === 'style.fill');
			expect(fillKf?.value).toBe('#4CAF50');
		});

		it('advances time after each command', () => {
			const result = compile(`
				scene "T" {
					highlight x duration 0.3s
					highlight y duration 0.5s
				}
			`);
			const kfs = result.scenes[0].sequence.keyframes;
			const times = [...new Set(kfs.map((k) => k.time))];
			expect(times).toHaveLength(2);
			expect(times[0]).toBeLessThan(times[1]);
		});

		it('applies delay option', () => {
			const result = compile(`
				scene "T" {
					highlight x delay 0.5s duration 0.3s
				}
			`);
			const kfs = result.scenes[0].sequence.keyframes;
			expect(kfs[0].time).toBe(0.5);
		});

		it('uses default duration when not specified', () => {
			const result = compile(`
				scene "T" {
					highlight x color "#FFF"
				}
			`);
			const kfs = result.scenes[0].sequence.keyframes;
			expect(kfs[0].duration).toBe(0.3);
		});
	});

	describe('control flow', () => {
		it('unrolls for loops', () => {
			const result = compile(`
				scene "T" {
					for i in 0..3 {
						highlight x duration 0.1s
					}
				}
			`);
			const kfs = result.scenes[0].sequence.keyframes;
			// 3 iterations, each generates keyframes
			expect(kfs.length).toBeGreaterThanOrEqual(3);
		});

		it('evaluates if condition', () => {
			const result = compile(`
				scene "T" {
					let x = 10
					if x > 5 {
						highlight a duration 0.1s
					} else {
						highlight b duration 0.1s
					}
				}
			`);
			const kfs = result.scenes[0].sequence.keyframes;
			const targets = kfs.map((k) => k.elementId);
			expect(targets).toContain('a');
			expect(targets).not.toContain('b');
		});

		it('evaluates while loops', () => {
			const result = compile(`
				scene "T" {
					let i = 0
					while i < 3 {
						highlight x duration 0.1s
						i = i + 1
					}
				}
			`);
			const kfs = result.scenes[0].sequence.keyframes;
			expect(kfs.length).toBeGreaterThanOrEqual(3);
		});
	});

	describe('parallel blocks', () => {
		it('starts all commands at the same time', () => {
			const result = compile(`
				scene "T" {
					parallel {
						highlight a duration 0.5s
						highlight b duration 0.3s
					}
				}
			`);
			const kfs = result.scenes[0].sequence.keyframes;
			const times = kfs.map((k) => k.time);
			// All keyframes should start at time 0
			expect(times.every((t) => t === 0)).toBe(true);
		});

		it('advances time to longest command', () => {
			const result = compile(`
				scene "T" {
					parallel {
						highlight a duration 0.5s
						highlight b duration 0.3s
					}
					highlight c duration 0.1s
				}
			`);
			const kfs = result.scenes[0].sequence.keyframes;
			const cKf = kfs.find((k) => k.elementId === 'c');
			expect(cKf?.time).toBe(0.5);
		});
	});

	describe('wait commands', () => {
		it('advances time without generating keyframes', () => {
			const result = compile(`
				scene "T" {
					wait 1s
					highlight x duration 0.1s
				}
			`);
			const kfs = result.scenes[0].sequence.keyframes;
			expect(kfs[0].time).toBe(1);
		});
	});

	describe('camera commands', () => {
		it('generates zoom marker', () => {
			const result = compile(`
				scene "T" {
					zoom 2 duration 0.5s
				}
			`);
			const markers = result.scenes[0].sequence.markers;
			expect(markers.some((m) => m.label.startsWith('zoom:'))).toBe(true);
		});

		it('generates pan marker', () => {
			const result = compile(`
				scene "T" {
					pan 100, 200 duration 0.5s
				}
			`);
			const markers = result.scenes[0].sequence.markers;
			expect(markers.some((m) => m.label.startsWith('pan:'))).toBe(true);
		});
	});

	describe('audio commands', () => {
		it('generates audio marker', () => {
			const result = compile(`
				scene "T" {
					beep
				}
			`);
			const markers = result.scenes[0].sequence.markers;
			expect(markers.some((m) => m.label === 'audio:beep')).toBe(true);
		});
	});

	describe('sequence duration', () => {
		it('calculates total duration from commands', () => {
			const result = compile(`
				scene "T" {
					highlight x duration 0.3s
					wait 1s
					highlight y duration 0.5s
				}
			`);
			expect(result.scenes[0].sequence.duration).toBe(1.8);
		});
	});

	describe('complex programs', () => {
		it('compiles bubble sort example', () => {
			const result = compile(`
				scene "Bubble Sort" {
					array arr = [5, 3, 8] at (400, 300)

					for i in 0..3 {
						for j in 0..3 - i - 1 {
							highlight arr[j], arr[j + 1] color "#FFD700" duration 0.3s
							if arr[j] > arr[j + 1] {
								swap arr[j], arr[j + 1] duration 0.5s
							}
							unhighlight arr[j], arr[j + 1] duration 0.2s
						}
					}
				}
			`);

			expect(result.scenes[0].name).toBe('Bubble Sort');
			expect(result.scenes[0].elements).toHaveLength(1);
			expect(result.scenes[0].sequence.keyframes.length).toBeGreaterThan(0);
			expect(result.scenes[0].sequence.duration).toBeGreaterThan(0);
		});
	});
});
