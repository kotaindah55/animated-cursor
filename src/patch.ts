import { EditorState, SelectionRange } from "@codemirror/state";
import {
	Direction,
	EditorView,
	LayerConfig,
	LayerMarker,
	MeasureRequest,
	PluginInstance,
	ViewUpdate
} from "@codemirror/view";
import { debounce, editorInfoField } from "obsidian";
import { CursorLayerView, CursorPluginInstance } from "src/typings";
import { AnimatedCursorSettings } from "src/main";
import { tableCellFocusChange } from "./cm-extensions";

/** Patch for update handler of cursor layer. */
const layerUpdaterPatch = function (update: ViewUpdate, dom: HTMLElement) {
	if (
		!update.docChanged && !update.selectionSet &&
		update.transactions.some(tr => tr.annotation(tableCellFocusChange) !== undefined)
	) return false;

	let hasTableCellFocused = false,
		tableCellCm = _getTableCellCm(update.startState);
	if (tableCellCm === update.view) return false;

	if (!update.view.hasFocus && tableCellCm?.hasFocus) {
		if (!dom.classList.contains("cm-overTableCell"))
			dom.classList.add("cm-overTableCell");
		hasTableCellFocused = true;
	}
	else if (dom.classList.contains("cm-overTableCell"))
		dom.classList.remove("cm-overTableCell");

	if (
		(update.docChanged || update.selectionSet) &&
		(update.view.hasFocus || hasTableCellFocused)
	) {
		if (dom.classList.contains("cm-blinkLayer"))
			dom.classList.remove("cm-blinkLayer");
		// Debounce the blink.
		_blinkDebouncer(dom);
		return true;
	}

	return false;
}

/**
 * Patch for marker maker of cursor layer.
 * 
 * Taken from, and modified of codemirror/view's `cursorLayer.markers`
 * version. Only be found in its internal API.
 */
const layerMarkersPatch = (settings: AnimatedCursorSettings) => function (view: EditorView) {
	let { state } = view,
		tableCellView: undefined | null | EditorView,
		cursors: _CursorMarker[] = [];
	
	if (!view.hasFocus) tableCellView = _getTableCellCm(state);
	if (tableCellView) ({ state } = tableCellView);
	if (view === tableCellView) return cursors;

	for (let range of state.selection.ranges) {
		// Primary cursor will be drawn as DOM, opposite to what Obsidian
		// implemented, so the primary is able to be animated.
		let isPrimary = range == state.selection.main,
			className = "cm-cursor " + (isPrimary ? "cm-cursor-primary" : "cm-cursor-secondary"),
			cursorMarker = tableCellView
				? _CursorMarker.forTableCellRange(view, tableCellView, className, range, settings.useTransform)
				: _CursorMarker.forRange(view, className, range, settings.useTransform);

		if (cursorMarker)
			cursors.push(cursorMarker);
	}
	return cursors;
}

/** Ensure that it is a layer config. */
function _isLayerConfig(object: object): object is LayerConfig {
	return (
		"above" in object && typeof object.above == "boolean" &&
		(!("class" in object) || typeof object.class == "string") &&
		(!("updateOnDocViewUpdate" in object) || typeof object.updateOnDocViewUpdate == "boolean") &&
		"update" in object && typeof object.update == "function" &&
		"markers" in object && typeof object.markers == "function" &&
		(!("mount" in object) || typeof object.mount == "function") &&
		(!("destroy" in object) || typeof object.destroy == "function")
	);
}

/** Ensure that it is a `MeasureRequest` instance. */
function _isMeasureReq(object: object): object is MeasureRequest<unknown> {
	return (
		"read" in object && typeof object.read == "function" &&
		(!("write" in object) || typeof object.write == "function")
	)
}

/** Ensure that the plugin value is a `CursorLayerView` instance. */
function _isCursorPlugin(instance: PluginInstance): instance is CursorPluginInstance {
	let pluginValue = instance.value;
	return (
		!!pluginValue &&
		"view" in pluginValue && pluginValue.view instanceof EditorView &&
		"layer" in pluginValue && !!pluginValue.layer && _isLayerConfig(pluginValue.layer) &&
		"measureReq" in pluginValue && !!pluginValue.measureReq && _isMeasureReq(pluginValue.measureReq) &&
		"drawn" in pluginValue && pluginValue.drawn instanceof Array &&
		"dom" in pluginValue && pluginValue.dom instanceof HTMLElement &&
		"scaleX" in pluginValue && typeof pluginValue.scaleX == "number" &&
		"scaleY" in pluginValue && typeof pluginValue.scaleY == "number" &&
		"setOrder" in pluginValue && typeof pluginValue.setOrder == "function" &&
		"measure" in pluginValue && typeof pluginValue.measure == "function" &&
		"scale" in pluginValue && typeof pluginValue.scale == "function" &&
		"draw" in pluginValue && typeof pluginValue.draw == "function" &&
		pluginValue.layer.class == "cm-cursorLayer"
	);
}

/**
 * Get scroller top and left position. Based on CodeMirror's `getBase()`
 * function with some modifications.
 * 
 * MIT licensed, copyright (c) by Marijn Haverbeke and others at
 * CodeMirror.
 * 
 * @see https://github.com/codemirror/view/blob/main/src/layer.ts
 */
function _getBaseCoords(view: EditorView): { top: number, left: number } {
	let scrollerRect = view.scrollDOM.getBoundingClientRect(),
		left = view.textDirection == Direction.LTR
			? scrollerRect.left
			: scrollerRect.right - view.scrollDOM.clientWidth * view.scaleX;

	return {
		top: scrollerRect.top - view.scrollDOM.scrollTop * view.scaleY,
		left: left - view.scrollDOM.scrollLeft * view.scaleX
	}
}

function _getTableCellCm(state: EditorState) {
	let editor = state.field(editorInfoField).editor,
		activeCm = editor?.activeCM;

	if (!editor?.inTableCell) return;

	return activeCm;
}

/**
 * Debounce the cursor blink by delaying its layer element from being
 * blink-animated, instead of changing its animation keyframe each layer
 * update.
 */
const _blinkDebouncer = debounce((layerEl: HTMLElement) => {
	layerEl.addClass("cm-blinkLayer");
}, 350, true);

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
class _CursorMarker implements LayerMarker {
	public readonly className: string;
	public readonly useTransform: boolean;

	public readonly left: number;
	public readonly top: number;
	public readonly height: number;

	constructor(className: string, left: number, top: number, height: number, useTransform: boolean) {
		this.className = className;
		this.left = Math.round(left);
		this.top = Math.round(top);
		this.height = Math.round(height);
		this.useTransform = useTransform;
	}

	public draw(): HTMLElement {
		let cursorEl = document.createElement("div");
		cursorEl.className = this.className;
		this._adjust(cursorEl);
		return cursorEl;
	}

	public update(cursorEl: HTMLElement, prev: _CursorMarker): boolean {
		if (
			prev.className != this.className ||
			prev.useTransform != this.useTransform
		) return false;

		// Reuse previous debouncer.
		this._requestAdjust = prev._requestAdjust ?? this._requestAdjust;
		// Disable throttling for updating process.
		this._requestAdjust(this._adjust, cursorEl);
		return true;
	}

	public eq(other: _CursorMarker): boolean {
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
	public static forRange(view: EditorView, className: string, range: SelectionRange, useTransform: boolean): _CursorMarker | null {
		let cursorPos = view.coordsAtPos(range.head, range.assoc || 1);
		if (!cursorPos) return null;
		let baseCoords = _getBaseCoords(view);
		return new _CursorMarker(
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
	 * @remarks _Table cell use case only._
	 */
	public static forTableCellRange(
		baseView: EditorView,
		tableCellView: EditorView,
		className: string,
		range: SelectionRange,
		useTransform: boolean
	): _CursorMarker | null {
		let cursorPos = tableCellView.coordsAtPos(range.head, range.assoc || 1);
		if (!cursorPos) return null;
		let baseCoords = _getBaseCoords(baseView);
		return new _CursorMarker(
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
	private _adjust = (cursorEl: HTMLElement): void => {
		if (this.useTransform) cursorEl.setCssStyles({
			transform: `translateX(${this.left}px) translateY(${this.top}px)`
		});
		else cursorEl.setCssStyles({
			left: this.left + "px",
			top: this.top + "px"
		});

		cursorEl.setCssStyles({ height: this.height + "px" });
	}

	/**
	 * Debounce the adjuster within 10 miliseconds. Use this to update the
	 * marker.
	 */
	private _requestAdjust = debounce((adjuster: typeof this._adjust, cursorEl: HTMLElement) => {
		adjuster(cursorEl);
	}, 10, false);
}

/** Hook the builtin cursor plugin provided by Obsidian. */
export function hookCursorPlugin(view: EditorView): CursorLayerView | null | undefined {
	// @ts-ignore We ignore view.plugins from being checked because it's
	// labeled internally as a private property.
	let pluginInstances = view.plugins as PluginInstance[];
	return pluginInstances.find(
		(instance): instance is CursorPluginInstance => {
			return !!instance.value && _isCursorPlugin(instance);
		}
	)?.value;
}

/**
 * Patch the cursor plugin and return the original config that can be
 * restored again.
 * 
 * **Should not be executed again after successful hook attemp.**
 */
export function patchCursorPlugin(cursorPlugin: CursorLayerView, settings: AnimatedCursorSettings): LayerConfig {
	// Store the original config.
	let originalConfig = Object.assign({}, cursorPlugin.layer);

	// Patch the update handler.
	cursorPlugin.layer.update = layerUpdaterPatch;

	// Patch the marker generator method.
	cursorPlugin.layer.markers = layerMarkersPatch(settings);

	return originalConfig;
}

/** Restore the cursor layer config to its initial configuration. */
export function unpatchCursorPlugin(targetConfig: LayerConfig, originalConfig: LayerConfig): void {
	Object.assign(targetConfig, originalConfig);
}