import { around } from 'monkey-around';
import type { EditorView, LayerConfig, ViewUpdate } from './@codemirror/view';
import { type App, type Debouncer, debounce, MarkdownView } from './obsidian';
import type { AnimatedCursorPlugin } from './main';
import { tableCellFocusChange } from './observer';
import { CursorMarker } from './cursor-marker';
import { getTableCellCM } from './utils';
import type { CursorPlugin } from './types';

/**
 * Debounce the cursor blink by delaying its layer element from being
 * blink-animated, instead of changing its animation keyframe each layer
 * update.
 * 
 * This is according to the cursor blink mechanism in VSCode.
 */
const requestBlink: Debouncer<[layerEl: HTMLElement], void> = debounce(
	layerEl => layerEl.addClass('cm-blinkLayer'),
	350,
	true
);

/**
 * Patch builtin cursor `LayerConfig`.
 */
export function patchCursorLayerConfig(plugin: AnimatedCursorPlugin, cursorLayerConfig: LayerConfig): void {
	plugin.register(around(cursorLayerConfig, {
		// The old method will set animation-duration to the layer directly.
		// This particular patch prevents it.
		mount: () => function (): void {},

		// Patch the update handler.
		update: () => function (update: ViewUpdate, dom: HTMLElement): boolean {
			if (
				!update.docChanged && !update.selectionSet &&
				update.transactions.some(tr => !!tr.annotation(tableCellFocusChange))
			) return false;

			let tableCellCm = getTableCellCM(update.state);
			if (tableCellCm === update.view) return false;

			// Toggle 'cm-overTableCell' class, depends on editor's focus state.
			let tableHasFocus = !update.view.hasFocus && (tableCellCm?.hasFocus ?? false);
			dom.toggleClass('cm-overTableCell', tableHasFocus);

			// Reset the blink layer.
			if (
				(update.docChanged || update.selectionSet) &&
				(update.view.hasFocus || tableHasFocus)
			) {
				dom.removeClass('cm-blinkLayer');
				// Debounce the blink.
				requestBlink(dom);
				return true;
			}

			return false;
		},

		// Patch marker builder.
		markers: () => function (view: EditorView): CursorMarker[] {
			let { state } = view,
				tableCellView: EditorView | undefined,
				cursors: CursorMarker[] = [];
			
			if (!view.hasFocus) tableCellView = getTableCellCM(state);
			if (tableCellView) state = tableCellView.state;
			if (view === tableCellView) return cursors;

			for (let range of state.selection.ranges) {
				// Primary cursor will be drawn as DOM, opposite to what Obsidian
				// implemented, so the primary is able to be animated.
				let isPrimary = range == state.selection.main,
					className = 'cm-cursor ' + (isPrimary ? 'cm-cursor-primary' : 'cm-cursor-secondary');

				let cursorMarker = tableCellView
					? CursorMarker.forTableCellRange(view, tableCellView, className, range, plugin.settings.useTransform)
					: CursorMarker.forRange(view, className, range, plugin.settings.useTransform);

				if (cursorMarker)
					cursors.push(cursorMarker);
			}

			return cursors;
		}
	}));
}

/**
 * Debounce the cursor blink by delaying its layer element from being
 * blink-animated, instead of changing its animation keyframe each layer
 * update.
 * 
 * This is according to the cursor blink mechanism in VSCode.
 */
const blinkDebouncer = debounce((layerEl: HTMLElement) => {
	layerEl.addClass('cm-blinkLayer');
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