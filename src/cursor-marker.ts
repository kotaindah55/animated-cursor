import { SelectionRange } from "@codemirror/state";
import { Direction, EditorView, LayerMarker } from "@codemirror/view";
import { debounce } from "obsidian";

/**
 * Get scroller top and left position. Based on CodeMirror's `getBase()`
 * function with some modifications.
 * 
 * MIT licensed, copyright (c) by Marijn Haverbeke and others at
 * CodeMirror.
 * 
 * @see https://github.com/codemirror/view/blob/main/src/layer.ts
 */
function getBaseCoords(view: EditorView): { top: number, left: number } {
	let scrollerRect = view.scrollDOM.getBoundingClientRect(),
		left = view.textDirection == Direction.LTR
			? scrollerRect.left
			: scrollerRect.right - view.scrollDOM.clientWidth * view.scaleX;

	return {
		top: scrollerRect.top - view.scrollDOM.scrollTop * view.scaleY,
		left: left - view.scrollDOM.scrollLeft * view.scaleX
	}
}

/**
 * Implementation of `LayerMarker` designated for generating cursor DOM,
 * with ability to debounce the DOM adjuster. Based on CodeMirror's
 * `RectangleMarker` with some modifications.
 * 
 * MIT licensed, copyright (c) by Marijn Haverbeke and others at
 * CodeMirror.
 * 
 * @see https://github.com/codemirror/view/blob/main/src/layer.ts
 */
export default class CursorMarker implements LayerMarker {
	public readonly className: string;
	public readonly useTransform: boolean;

	public readonly left: number;
	public readonly top: number;
	public readonly height: number;

	constructor(className: string, left: number, top: number, height: number, useTransform: boolean) {
		this.className = className;
		// Round the position and the height avoiding using new marker upon mere
		// fractional difference.
		this.left = Math.round(left);
		this.top = Math.round(top);
		this.height = Math.round(height);
		this.useTransform = useTransform;
	}

	public draw(): HTMLElement {
		let cursorEl = createDiv(this.className);
		this.adjust(cursorEl);
		return cursorEl;
	}

	public update(cursorEl: HTMLElement, prev: CursorMarker): boolean {
		if (
			prev.className != this.className ||
			prev.useTransform != this.useTransform
		) return false;

		// Reuse previous debouncer.
		this.requestAdjust = prev.requestAdjust ?? this.requestAdjust;
		// Disable rapid position change for updating process.
		this.requestAdjust(this.adjust, cursorEl);
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

	/**
	 * Adjust the marker position. Should not be run immediately in `update`
	 * call, use `requestAdjust` instead.
	 */
	private adjust = (cursorEl: HTMLElement): void => {
		// Hack to smooth the movement and remove jittering
		requestAnimationFrame(() => {
			if (this.useTransform) cursorEl.setCssStyles({
				transform: `translateX(${this.left}px) translateY(${this.top}px)`
			});
			else cursorEl.setCssStyles({
				left: this.left + "px",
				top: this.top + "px"
			});
	
			cursorEl.setCssStyles({ height: this.height + "px" });
		})
	}

	/**
	 * Debounce the adjuster within 10 miliseconds. Use this to update the
	 * marker.
	 */
	private requestAdjust = debounce((adjuster: typeof this.adjust, cursorEl: HTMLElement) => {
		adjuster(cursorEl);
	}, 10, false);
}
