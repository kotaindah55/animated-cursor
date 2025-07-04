import { EditorState } from "@codemirror/state";
import { EditorView, ViewUpdate } from "@codemirror/view";
import { debounce, editorInfoField } from "obsidian";
import { around } from "monkey-around";
import { CursorLayerView } from "src/typings";
import { AnimatedCursorSettings } from "src/main";
import { tableCellFocusChange } from "src/observer";
import CursorMarker from "src/cursor-marker";

/**
 * Patch for update handler of cursor layer.
 */
const layerUpdaterPatch = function (update: ViewUpdate, dom: HTMLElement) {
	if (
		!update.docChanged && !update.selectionSet &&
		update.transactions.some(tr => !!tr.annotation(tableCellFocusChange))
	) return false;

	let tableCellCm = getTableCellCm(update.state);
	if (tableCellCm === update.view) return false;

	// Toggle "cm-overTableCell" class, depends on editor's focus state.
	let tableHasFocus = !update.view.hasFocus && (tableCellCm?.hasFocus ?? false);
	dom.toggleClass("cm-overTableCell", tableHasFocus);

	// Reset the blink layer.
	if (
		(update.docChanged || update.selectionSet) &&
		(update.view.hasFocus || tableHasFocus)
	) {
		dom.removeClass("cm-blinkLayer");
		// Debounce the blink.
		blinkDebouncer(dom);
		return true;
	}

	return false;
}

/**
 * Patch for marker maker of cursor layer.
 * 
 * Taken from, and modified of CodeMirror's `cursorLayer.markers`
 * version. Only be found in its internal API.
 * 
 * Copyright (C) 2018-2021 by Marijn Haverbeke <marijn@haverbeke.berlin>
 * and others at CodeMirror. Licensed under MIT.
 * 
 * @see https://github.com/codemirror/view/blob/main/src/draw-selection.ts
 */
const layerMarkersPatch = (settings: AnimatedCursorSettings) => function (view: EditorView) {
	let { state } = view,
		tableCellView: EditorView | undefined,
		cursors: CursorMarker[] = [];
	
	if (!view.hasFocus) tableCellView = getTableCellCm(state);
	if (tableCellView) ({ state } = tableCellView);
	if (view === tableCellView) return cursors;

	for (let range of state.selection.ranges) {
		// Primary cursor will be drawn as DOM, opposite to what Obsidian
		// implemented, so the primary is able to be animated.
		let isPrimary = range == state.selection.main,
			className = "cm-cursor " + (isPrimary ? "cm-cursor-primary" : "cm-cursor-secondary"),
			cursorMarker = tableCellView
				? CursorMarker.forTableCellRange(view, tableCellView, className, range, settings.useTransform)
				: CursorMarker.forRange(view, className, range, settings.useTransform);

		if (cursorMarker)
			cursors.push(cursorMarker);
	}
	return cursors;
}

/**
 * Debounce the cursor blink by delaying its layer element from being
 * blink-animated, instead of changing its animation keyframe each layer
 * update.
 * 
 * This is according to the cursor blink mechanism in VSCode.
 */
const blinkDebouncer = debounce((layerEl: HTMLElement) => {
	layerEl.addClass("cm-blinkLayer");
}, 350, true);

/**
 * Get table cell's `EditorView` in the current editor if any.
 * 
 * @param state Associated `EditorState`.
 */
function getTableCellCm(state: EditorState): EditorView | undefined {
	let editor = state.field(editorInfoField).editor,
		{ activeCM } = editor ?? {};

	if (!editor?.inTableCell) return;

	return activeCM;
}

/**
 * Patch the cursor layer and return the uninstaller to revert the patch.
 * 
 * @returns A patch uninstaller.
 * 
 * @remark **Should not be executed again after successful hook attemp**
 */
export function patchCursorLayer(cursorPlugin: CursorLayerView, settings: AnimatedCursorSettings) {
	return around(cursorPlugin.layer, {
		// Patch the update handler.
		update: () => layerUpdaterPatch,
		// Patch the marker generator method.
		markers: () => layerMarkersPatch(settings)
	});
}