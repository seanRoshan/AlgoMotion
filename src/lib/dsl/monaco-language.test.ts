import { describe, expect, it } from 'vitest';
import { DSL_LANGUAGE_CONFIG, DSL_LANGUAGE_ID, DSL_MONARCH_TOKENIZER } from './monaco-language';

describe('Monaco DSL Language', () => {
	it('exports a valid language ID', () => {
		expect(DSL_LANGUAGE_ID).toBe('algomotion-dsl');
	});

	describe('Monarch tokenizer', () => {
		it('has a root tokenizer state', () => {
			expect(DSL_MONARCH_TOKENIZER.tokenizer.root).toBeDefined();
			expect(DSL_MONARCH_TOKENIZER.tokenizer.root.length).toBeGreaterThan(0);
		});

		it('has a comment tokenizer state', () => {
			expect(DSL_MONARCH_TOKENIZER.tokenizer.comment).toBeDefined();
		});

		it('defines all DSL keywords', () => {
			const keywords = DSL_MONARCH_TOKENIZER.keywords as string[];
			expect(keywords).toContain('scene');
			expect(keywords).toContain('let');
			expect(keywords).toContain('for');
			expect(keywords).toContain('while');
			expect(keywords).toContain('if');
			expect(keywords).toContain('else');
			expect(keywords).toContain('parallel');
		});

		it('defines animation commands', () => {
			const commands = DSL_MONARCH_TOKENIZER.animationCommands as string[];
			expect(commands).toContain('highlight');
			expect(commands).toContain('unhighlight');
			expect(commands).toContain('swap');
			expect(commands).toContain('move');
			expect(commands).toContain('mark');
			expect(commands).toContain('insert');
			expect(commands).toContain('delete');
		});

		it('defines camera commands', () => {
			const commands = DSL_MONARCH_TOKENIZER.cameraCommands as string[];
			expect(commands).toContain('zoom');
			expect(commands).toContain('pan');
			expect(commands).toContain('focus');
		});

		it('defines audio commands', () => {
			const commands = DSL_MONARCH_TOKENIZER.audioCommands as string[];
			expect(commands).toContain('beep');
			expect(commands).toContain('click');
			expect(commands).toContain('success');
			expect(commands).toContain('error');
		});

		it('defines element types', () => {
			const types = DSL_MONARCH_TOKENIZER.elementTypes as string[];
			expect(types).toContain('array');
			expect(types).toContain('tree');
			expect(types).toContain('graph');
			expect(types).toContain('node');
			expect(types).toContain('stack');
			expect(types).toContain('queue');
		});

		it('defines option keywords', () => {
			const options = DSL_MONARCH_TOKENIZER.optionKeywords as string[];
			expect(options).toContain('color');
			expect(options).toContain('duration');
			expect(options).toContain('easing');
			expect(options).toContain('delay');
			expect(options).toContain('stagger');
		});
	});

	describe('language configuration', () => {
		it('defines line comments', () => {
			expect(DSL_LANGUAGE_CONFIG.comments?.lineComment).toBe('//');
		});

		it('defines block comments', () => {
			expect(DSL_LANGUAGE_CONFIG.comments?.blockComment).toEqual(['/*', '*/']);
		});

		it('defines bracket pairs', () => {
			const brackets = DSL_LANGUAGE_CONFIG.brackets;
			expect(brackets).toBeDefined();
			expect(brackets).toHaveLength(3);
		});

		it('defines auto-closing pairs', () => {
			const pairs = DSL_LANGUAGE_CONFIG.autoClosingPairs;
			expect(pairs).toBeDefined();
			expect((pairs as Array<unknown>).length).toBeGreaterThan(0);
		});

		it('defines folding markers', () => {
			expect(DSL_LANGUAGE_CONFIG.folding).toBeDefined();
		});
	});
});
