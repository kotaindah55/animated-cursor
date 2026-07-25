import type { SelectionRange } from './@codemirror/state';
import type { EditorView, LayerMarker } from './@codemirror/view';
import { type Debouncer, debounce } from './obsidian';
import { getBaseCoords } from './utils';

/**
 * Adjust cursor position using information provided by `marker`.
 */
function adjustCursor(marker: CursorMarker, cursorEl: HTMLElement): void {
	// Hack to smooth the movement and remove jittering
	cursorEl.win.requestAnimationFrame(() => {
		let styles: Partial<CSSStyleDeclaration> = {
			height: `${marker.height}px`
		};

		if (marker.useTransform) {
			styles.transform = `translateX(${marker.left}px) translateY(${marker.top}px)`;
		} else {
			styles.left = `${marker.left}px`;
			styles.top = `${marker.top}px`;
		}

		cursorEl.setCssStyles(styles);
	});
}

/**
 * Implementation of `LayerMarker` designated for generating cursor DOM,
 * with ability to debounce the DOM adjuster. Based on CodeMirror's
 * `RectangleMarker` with some modifications.
 * 
 * Copyright (C) 2018-2021 by Marijn Haverbeke <marijn@haverbeke.berlin>
 * and others at CodeMirror. Licensed under MIT.
 * 
 * @see https://github.com/codemirror/view/blob/main/src/layer.ts
 */
export class CursorMarker implements LayerMarker {
	public readonly className: string;
	public readonly useTransform: boolean;

	public readonly left: number;
	public readonly top: number;
	public readonly height: number;

	private requestAdjust?: Debouncer<Parameters<typeof adjustCursor>, void>;

	private constructor(className: string, left: number, top: number, height: number, useTransform: boolean) {
		this.className = className;
		this.useTransform = useTransform;

		// Round the position and the height avoiding using new marker upon mere
		// fractional difference.
		this.left = Math.round(left);
		this.top = Math.round(top);
		this.height = Math.round(height);
	}

	public draw(): HTMLElement {
		let cursorEl = createDiv(this.className);
		adjustCursor(this, cursorEl);
		return cursorEl;
	}

	public update(cursorEl: HTMLElement, prev: CursorMarker): boolean {
		if (
			prev.className != this.className ||
			prev.useTransform != this.useTransform
		) return false;

		// Reuse previous debouncer if any.
		this.requestAdjust = prev.requestAdjust ?? this.requestAdjust ?? debounce(adjustCursor, 10);
		// Disable rapid position change for updating process.
		this.requestAdjust(this, cursorEl);

		return true;
	}

	public eq(other: CursorMarker): boolean {
		return (
			this.left == other.left &&
			this.top == other.top &&
			this.height == other.height &&
			this.className == other.className &&
			this.useTransform == other.useTransform
		);
	}

	/**
	 * Create a cursor marker from selection range. If it's not an empty
	 * range, the function will use its head position as the marker
	 * position.
	 * 
	 * @param range `SelectionRange` that will be calculated and drawn.
	 * @param useTransform If true, use CSS property `transform` instead.
	 */
	public static forRange(view: EditorView, className: string, range: SelectionRange, useTransform: boolean): CursorMarker | null {
		let cursorPos = view.coordsAtPos(range.head, range.assoc || 1);
		if (!cursorPos) return null;

		let baseCoords = getBaseCoords(view);
		return new CursorMarker(
			className,
			cursorPos.left - baseCoords.left,
			cursorPos.top - baseCoords.top,
			cursorPos.bottom - cursorPos.top,
			useTransform
		);
	}

	/**
	 * Similiar to `forRange()`, except it uses `baseView` as base rect
	 * coordinates and `tableCellView` to get the `range` coords.
	 * 
	 * @param range `SelectionRange` that will be calculated and drawn.
	 * @param useTransform If true, use CSS property `transform` instead.
	 * 
	 * @remarks _Table cell use case only._
	 */
	public static forTableCellRange(
		baseView: EditorView,
		tableCellView: EditorView,
		className: string,
		range: SelectionRange,
		useTransform: boolean
	): CursorMarker | null {
		let cursorPos = tableCellView.coordsAtPos(range.head, range.assoc || 1);
		if (!cursorPos) return null;

		let baseCoords = getBaseCoords(baseView);
		return new CursorMarker(
			className,
			cursorPos.left - baseCoords.left,
			cursorPos.top - baseCoords.top,
			cursorPos.bottom - cursorPos.top,
			useTransform
		);
	}
}
