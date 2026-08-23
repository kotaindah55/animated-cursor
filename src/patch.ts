import { around } from 'monkey-around';
import type { EditorView, LayerConfig, ViewUpdate } from './@codemirror/view';
import { EditorSelection } from './@codemirror/state';
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
			let tableCellView: EditorView | undefined,
				selection: EditorSelection,
				cursors: CursorMarker[] = [];

			// It's possible that the main view has lost focus due to the table cell
			// gaining focus.
			if (!view.hasFocus) tableCellView = getTableCellCM(view.state);
			// Omit any cursor from the table cell.
			if (view === tableCellView) return cursors;

			if (tableCellView) {
				// In Obsidian 1.13.7, the value of the table cell's SelectionRange.from
				// may be null. (due to a bug?)
				let tableCellSelection = tableCellView.state.selection;
				if (tableCellSelection.ranges.every(range => Number.isNumber(range.from))) {
					selection = tableCellSelection;
				} else {
					selection = EditorSelection.single(0);
				}
			} else {
				selection = view.state.selection;
			}


			for (let range of selection.ranges) {
				// Primary cursor will be drawn as DOM, opposite to what Obsidian
				// implemented, so the primary is able to be animated.
				let isPrimary = range == selection.main,
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
 * Perform post-patch action. In this case, remove `animation-duration`
 * and `animation-name` CSS properties from cursor layers.
 */
export function adjustCursorLayer(app: App, cursorPlugin: CursorPlugin): void {
	app.workspace.getLeavesOfType('markdown').forEach(leaf => {
		if (leaf.view instanceof MarkdownView) {
			let layer = leaf.view.editor.cm.plugin(cursorPlugin);
			layer?.dom.setCssStyles({
				animationDuration: '',
				animationName: ''
			});
		}
	});
}