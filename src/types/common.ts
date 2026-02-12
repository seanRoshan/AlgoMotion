/** JSON-serializable primitive value */
export type JsonPrimitive = string | number | boolean | null;

/** JSON-serializable value (recursive) */
export type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };

/** 2D position in logical canvas units */
export interface Position {
	x: number;
	y: number;
}

/** 2D size in logical canvas units */
export interface Size {
	width: number;
	height: number;
}

/** Camera state for the canvas viewport */
export interface CameraState {
	x: number;
	y: number;
	zoom: number;
}

/** Shadow definition for element styles */
export interface Shadow {
	x: number;
	y: number;
	blur: number;
	color: string;
}
