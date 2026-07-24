import { Annotation } from './@codemirror/state';
import { type EditorView, type PluginValue, ViewPlugin } from './@codemirror/view';
import { editorInfoField } from './obsidian';

const LEFT_MOUSE_BTN = 0;

/**
 * Get `pointerdown` event handler that set `cm-hasTablePointed` class to
 * the current view's scroller.
 * 
 * @param view `EditorView` that will be bound to the handler.
 */
function getPointerDownHandler(view: EditorView): (evt: PointerEvent) => void {
	return evt => {
		if (evt.button !== LEFT_MOUSE_BTN) return;

		let path = evt.composedPath(),
			win = evt.win.window;
		
		// Scan for pointed table.
		let isTablePointed = path.some(target => target instanceof win.HTMLElement && target.hasClass('table-wrapper'));

		if (isTablePointed) {
			let { scrollDOM } = view;
			scrollDOM.addClass('cm-hasTablePointed');
			// Remove the class after releasing the pointer.
			scrollDOM.win.addEventListener('pointerup', () => {
				scrollDOM.removeClass('cm-hasTablePointed');
			}, { once: true });
		}
	};
}

/**
 * Used to tell main `EditorView` that table cell's `EditorView` inside
 * has focus state changed.
 */
export const tableCellFocusChange = Annotation.define<boolean>();

/**
 * When injected to the table cell's `EditorView`, it will dispatch
 * `tableCellFocusChange` annot to the main `EditorView` everytime table
 * cell focus state is changed. Otherwise, it does nothing.
 * 
 * Additionally, it will add `cm-hasTablePointed` while pointing a table
 * down.
 */
export const tableCellObserver = ViewPlugin.define(view => {
	let { editor } = view.state.field(editorInfoField),
		pluginValue: PluginValue = {};

	// Exclusive to table cell EditorView.
	if (editor?.inTableCell && editor.activeCM === view) {
		pluginValue.update = update => {
			if (update.focusChanged) editor.cm.dispatch({
				annotations: tableCellFocusChange.of(view.hasFocus)
			});
		};
	}

	// Exclusive to main EditorView.
	if (editor?.cm === view) {
		let handler = getPointerDownHandler(view);
		view.dom.addEventListener('pointerdown', handler, true);
		pluginValue.destroy = () => view.dom.removeEventListener('pointerdown', handler, true);
	}

	return pluginValue;
});