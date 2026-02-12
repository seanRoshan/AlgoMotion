import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { SceneElement } from '@/types';
import { ElementRenderer } from './element-renderer';

/**
 * ElementRenderer tests.
 * Uses mock Pixi.js classes since jsdom has no WebGL/WebGPU context.
 * Tests verify correct container creation, property application, and lifecycle.
 */

// biome-ignore lint/suspicious/noExplicitAny: mock Pixi module for testing
let mockPixi: any;

function createMockPixi() {
	// Use regular function constructors (not arrow functions) so `new` works
	function MockContainer(this: Record<string, unknown>) {
		const children: unknown[] = [];
		this.addChild = vi.fn((...args: unknown[]) => children.push(...args));
		this.removeChild = vi.fn();
		this.removeChildren = vi.fn();
		this.destroy = vi.fn();
		this.position = { set: vi.fn(), x: 0, y: 0 };
		this.scale = { set: vi.fn() };
		this.alpha = 1;
		this.angle = 0;
		this.visible = true;
		this.label = '';
		this.cullable = false;
		this.children = children;
	}

	function MockGraphics(this: Record<string, unknown>) {
		this.clear = vi.fn().mockReturnThis();
		this.rect = vi.fn().mockReturnThis();
		this.roundRect = vi.fn().mockReturnThis();
		this.circle = vi.fn().mockReturnThis();
		this.fill = vi.fn().mockReturnThis();
		this.stroke = vi.fn().mockReturnThis();
		this.moveTo = vi.fn().mockReturnThis();
		this.lineTo = vi.fn().mockReturnThis();
		this.bezierCurveTo = vi.fn().mockReturnThis();
		this.poly = vi.fn().mockReturnThis();
		this.closePath = vi.fn().mockReturnThis();
		this.setStrokeStyle = vi.fn().mockReturnThis();
		this.destroy = vi.fn();
	}

	function MockText(this: Record<string, unknown>, opts: { text: string; style: unknown }) {
		this.text = opts.text;
		this.style = opts.style;
		this.anchor = { set: vi.fn() };
		this.position = { set: vi.fn() };
		this.visible = true;
		this.destroy = vi.fn();
	}

	function MockTextStyle(_opts: Record<string, unknown>) {
		return { ..._opts };
	}

	return {
		Container: MockContainer,
		Graphics: MockGraphics,
		Text: MockText,
		TextStyle: MockTextStyle,
	};
}

function makeElement(overrides: Partial<SceneElement> = {}): SceneElement {
	return {
		id: 'test-1',
		type: 'rect',
		position: { x: 100, y: 200 },
		size: { width: 120, height: 80 },
		rotation: 0,
		opacity: 1,
		visible: true,
		locked: false,
		label: 'Test',
		style: {
			fill: '#2a2a4a',
			stroke: '#4a4a6a',
			strokeWidth: 2,
			cornerRadius: 8,
			fontSize: 14,
			fontFamily: 'Inter',
			fontWeight: 500,
			textColor: '#e0e0f0',
		},
		metadata: {},
		...overrides,
	};
}

beforeEach(() => {
	mockPixi = createMockPixi();
});

describe('ElementRenderer', () => {
	describe('construction', () => {
		it('creates an instance with Pixi classes', () => {
			const renderer = new ElementRenderer(mockPixi);
			expect(renderer).toBeInstanceOf(ElementRenderer);
		});

		it('starts with empty display objects', () => {
			const renderer = new ElementRenderer(mockPixi);
			expect(renderer.getDisplayObject('nonexistent')).toBeNull();
		});
	});

	describe('createElement', () => {
		it('creates a Container for a rect element', () => {
			const renderer = new ElementRenderer(mockPixi);
			const element = makeElement({ type: 'rect' });
			const container = renderer.createElement(element);
			expect(container).toBeDefined();
		});

		it('creates a Container for a node element', () => {
			const renderer = new ElementRenderer(mockPixi);
			const element = makeElement({ type: 'node', size: { width: 48, height: 48 } });
			const container = renderer.createElement(element);
			expect(container).toBeDefined();
		});

		it('creates a Container for a text element', () => {
			const renderer = new ElementRenderer(mockPixi);
			const element = makeElement({ type: 'text', label: 'Hello World' });
			const container = renderer.createElement(element);
			expect(container).toBeDefined();
		});

		it('creates a Container for an edge element', () => {
			const renderer = new ElementRenderer(mockPixi);
			const element = makeElement({
				type: 'edge',
				metadata: { endX: 200, endY: 300 },
			});
			const container = renderer.createElement(element);
			expect(container).toBeDefined();
		});

		it('creates a Container for an arrow element', () => {
			const renderer = new ElementRenderer(mockPixi);
			const element = makeElement({
				type: 'arrow',
				metadata: { endX: 200, endY: 100 },
			});
			const container = renderer.createElement(element);
			expect(container).toBeDefined();
		});

		it('sets container label to element-{id}', () => {
			const renderer = new ElementRenderer(mockPixi);
			const element = makeElement({ id: 'abc-123', type: 'rect' });
			const container = renderer.createElement(element);
			expect(container.label).toBe('element-abc-123');
		});

		it('applies position to container', () => {
			const renderer = new ElementRenderer(mockPixi);
			const element = makeElement({ position: { x: 50, y: 75 } });
			const container = renderer.createElement(element);
			expect(container.position.set).toHaveBeenCalledWith(50, 75);
		});

		it('applies rotation to container', () => {
			const renderer = new ElementRenderer(mockPixi);
			const element = makeElement({ rotation: 45 });
			const container = renderer.createElement(element);
			expect(container.angle).toBe(45);
		});

		it('applies opacity to container', () => {
			const renderer = new ElementRenderer(mockPixi);
			const element = makeElement({ opacity: 0.5 });
			const container = renderer.createElement(element);
			expect(container.alpha).toBe(0.5);
		});

		it('applies visibility to container', () => {
			const renderer = new ElementRenderer(mockPixi);
			const element = makeElement({ visible: false });
			const container = renderer.createElement(element);
			expect(container.visible).toBe(false);
		});

		it('enables culling on container', () => {
			const renderer = new ElementRenderer(mockPixi);
			const element = makeElement();
			const container = renderer.createElement(element);
			expect(container.cullable).toBe(true);
		});

		it('stores display object in registry', () => {
			const renderer = new ElementRenderer(mockPixi);
			const element = makeElement({ id: 'reg-test' });
			renderer.createElement(element);
			expect(renderer.getDisplayObject('reg-test')).not.toBeNull();
		});
	});

	describe('destroyElement', () => {
		it('removes element from registry', () => {
			const renderer = new ElementRenderer(mockPixi);
			const element = makeElement({ id: 'destroy-test' });
			renderer.createElement(element);
			renderer.destroyElement('destroy-test');
			expect(renderer.getDisplayObject('destroy-test')).toBeNull();
		});

		it('calls destroy on the container', () => {
			const renderer = new ElementRenderer(mockPixi);
			const element = makeElement({ id: 'destroy-call' });
			const container = renderer.createElement(element);
			renderer.destroyElement('destroy-call');
			expect(container.destroy).toHaveBeenCalledWith({ children: true });
		});

		it('handles destroying nonexistent element gracefully', () => {
			const renderer = new ElementRenderer(mockPixi);
			expect(() => renderer.destroyElement('nonexistent')).not.toThrow();
		});
	});

	describe('updateElement', () => {
		it('updates position when changed', () => {
			const renderer = new ElementRenderer(mockPixi);
			const element = makeElement({ id: 'update-pos' });
			renderer.createElement(element);

			const updated = makeElement({ id: 'update-pos', position: { x: 300, y: 400 } });
			renderer.updateElement(updated);

			const container = renderer.getDisplayObject('update-pos');
			expect(container?.position.set).toHaveBeenCalledWith(300, 400);
		});

		it('updates opacity when changed', () => {
			const renderer = new ElementRenderer(mockPixi);
			const element = makeElement({ id: 'update-opacity' });
			renderer.createElement(element);

			const updated = makeElement({ id: 'update-opacity', opacity: 0.3 });
			renderer.updateElement(updated);

			const container = renderer.getDisplayObject('update-opacity');
			expect(container?.alpha).toBe(0.3);
		});

		it('updates rotation when changed', () => {
			const renderer = new ElementRenderer(mockPixi);
			const element = makeElement({ id: 'update-rot' });
			renderer.createElement(element);

			const updated = makeElement({ id: 'update-rot', rotation: 90 });
			renderer.updateElement(updated);

			const container = renderer.getDisplayObject('update-rot');
			expect(container?.angle).toBe(90);
		});

		it('updates visibility when changed', () => {
			const renderer = new ElementRenderer(mockPixi);
			const element = makeElement({ id: 'update-vis' });
			renderer.createElement(element);

			const updated = makeElement({ id: 'update-vis', visible: false });
			renderer.updateElement(updated);

			const container = renderer.getDisplayObject('update-vis');
			expect(container?.visible).toBe(false);
		});

		it('handles update for nonexistent element gracefully', () => {
			const renderer = new ElementRenderer(mockPixi);
			const element = makeElement({ id: 'nonexistent' });
			expect(() => renderer.updateElement(element)).not.toThrow();
		});
	});

	describe('destroyAll', () => {
		it('removes all elements from registry', () => {
			const renderer = new ElementRenderer(mockPixi);
			renderer.createElement(makeElement({ id: 'a' }));
			renderer.createElement(makeElement({ id: 'b' }));
			renderer.createElement(makeElement({ id: 'c' }));

			renderer.destroyAll();

			expect(renderer.getDisplayObject('a')).toBeNull();
			expect(renderer.getDisplayObject('b')).toBeNull();
			expect(renderer.getDisplayObject('c')).toBeNull();
		});
	});

	describe('node rendering', () => {
		it('draws a circle when width equals height', () => {
			const renderer = new ElementRenderer(mockPixi);
			const element = makeElement({
				type: 'node',
				size: { width: 48, height: 48 },
			});
			const container = renderer.createElement(element);
			// The container should have a Graphics child that called circle()
			const graphics = container.children[0];
			// biome-ignore lint/suspicious/noExplicitAny: accessing mock methods
			expect((graphics as any).circle).toHaveBeenCalled();
		});

		it('draws a roundRect when width differs from height', () => {
			const renderer = new ElementRenderer(mockPixi);
			const element = makeElement({
				type: 'node',
				size: { width: 80, height: 48 },
			});
			const container = renderer.createElement(element);
			const graphics = container.children[0];
			// biome-ignore lint/suspicious/noExplicitAny: accessing mock methods
			expect((graphics as any).roundRect).toHaveBeenCalled();
		});

		it('adds a Text child when label is provided', () => {
			const renderer = new ElementRenderer(mockPixi);
			const element = makeElement({
				type: 'node',
				size: { width: 48, height: 48 },
				label: 'A',
			});
			const container = renderer.createElement(element);
			// Should have Graphics + Text children
			expect(container.children.length).toBe(2);
		});
	});

	describe('edge rendering', () => {
		it('draws a line from position to endpoint', () => {
			const renderer = new ElementRenderer(mockPixi);
			const element = makeElement({
				type: 'edge',
				position: { x: 0, y: 0 },
				metadata: { endX: 200, endY: 100 },
			});
			const container = renderer.createElement(element);
			const graphics = container.children[0];
			// biome-ignore lint/suspicious/noExplicitAny: accessing mock methods
			expect((graphics as any).moveTo).toHaveBeenCalled();
			// biome-ignore lint/suspicious/noExplicitAny: accessing mock methods
			expect((graphics as any).lineTo).toHaveBeenCalled();
		});

		it('draws a bezier curve when connectionType is bezier', () => {
			const renderer = new ElementRenderer(mockPixi);
			const element = makeElement({
				type: 'edge',
				position: { x: 0, y: 0 },
				metadata: { endX: 200, endY: 100, connectionType: 'bezier' },
			});
			const container = renderer.createElement(element);
			const graphics = container.children[0];
			// biome-ignore lint/suspicious/noExplicitAny: accessing mock methods
			expect((graphics as any).bezierCurveTo).toHaveBeenCalled();
		});
	});

	describe('arrow rendering', () => {
		it('draws a line with arrowhead', () => {
			const renderer = new ElementRenderer(mockPixi);
			const element = makeElement({
				type: 'arrow',
				position: { x: 0, y: 0 },
				metadata: { endX: 100, endY: 0 },
			});
			const container = renderer.createElement(element);
			const graphics = container.children[0];
			// Should draw line AND arrowhead polygon
			// biome-ignore lint/suspicious/noExplicitAny: accessing mock methods
			expect((graphics as any).moveTo).toHaveBeenCalled();
			// biome-ignore lint/suspicious/noExplicitAny: accessing mock methods
			expect((graphics as any).poly).toHaveBeenCalled();
		});

		it('draws a curved arrow when curved is true', () => {
			const renderer = new ElementRenderer(mockPixi);
			const element = makeElement({
				type: 'arrow',
				position: { x: 0, y: 0 },
				metadata: { endX: 100, endY: 50, curved: true },
			});
			const container = renderer.createElement(element);
			const graphics = container.children[0];
			// biome-ignore lint/suspicious/noExplicitAny: accessing mock methods
			expect((graphics as any).bezierCurveTo).toHaveBeenCalled();
		});
	});

	describe('rect rendering', () => {
		it('draws a rounded rectangle', () => {
			const renderer = new ElementRenderer(mockPixi);
			const element = makeElement({
				type: 'rect',
				size: { width: 120, height: 80 },
			});
			const container = renderer.createElement(element);
			const graphics = container.children[0];
			// biome-ignore lint/suspicious/noExplicitAny: accessing mock methods
			expect((graphics as any).roundRect).toHaveBeenCalled();
			// biome-ignore lint/suspicious/noExplicitAny: accessing mock methods
			expect((graphics as any).fill).toHaveBeenCalled();
			// biome-ignore lint/suspicious/noExplicitAny: accessing mock methods
			expect((graphics as any).stroke).toHaveBeenCalled();
		});

		it('draws a sharp rectangle when cornerRadius is 0', () => {
			const renderer = new ElementRenderer(mockPixi);
			const element = makeElement({
				type: 'rect',
				style: {
					fill: '#2a2a4a',
					stroke: '#4a4a6a',
					strokeWidth: 2,
					cornerRadius: 0,
					fontSize: 14,
					fontFamily: 'Inter',
					fontWeight: 500,
					textColor: '#e0e0f0',
				},
			});
			const container = renderer.createElement(element);
			const graphics = container.children[0];
			// biome-ignore lint/suspicious/noExplicitAny: accessing mock methods
			expect((graphics as any).rect).toHaveBeenCalled();
		});
	});

	describe('text rendering', () => {
		it('creates a Text object with the label', () => {
			const renderer = new ElementRenderer(mockPixi);
			const element = makeElement({
				type: 'text',
				label: 'Hello World',
			});
			const container = renderer.createElement(element);
			// Text element should have 1 child (the Text object)
			expect(container.children.length).toBeGreaterThanOrEqual(1);
		});

		it('handles empty label', () => {
			const renderer = new ElementRenderer(mockPixi);
			const element = makeElement({
				type: 'text',
				label: undefined,
			});
			expect(() => renderer.createElement(element)).not.toThrow();
		});
	});
});
