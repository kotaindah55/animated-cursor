import { Annotation } from "@codemirror/state";
import { EditorView, PluginValue, ViewPlugin } from "@codemirror/view";
import { editorInfoField } from "obsidian";

const LEFT_MOUSE_BTN = 0;

/**
 * Pointing down handler, used for `tableCellObserver`.
 */
const onEditorPointerdown = (view: EditorView) => function (evt: PointerEvent): void {
	if (evt.button !== LEFT_MOUSE_BTN) return;

	// Scan for pointed table.
	let path = evt.composedPath(),
		isTablePointed = path.some(
			target => target instanceof HTMLElement && target.hasClass("table-wrapper")
		);

	if (isTablePointed) {
		let { scrollDOM } = view;
		scrollDOM.addClass("cm-hasTablePointed");
		// Remove the class after releasing the pointer.
		scrollDOM.win.addEventListener("pointerup", () => {
			scrollDOM.removeClass("cm-hasTablePointed");
		}, { once: true });
	}
}

/**
 * Used to tell main `EditorView` that table cell's `EditorView` inside
 * has focus state change.
 */
export const tableCellFocusChange = Annotation.define<boolean>();

/**
 * When injected to the table cell's `EditorView`, it will dispatch
 * `tableCellFocusChange` annot to the main `EditorView` everytime table
 * cell focus state changed. Otherwise, it does nothing.
 * 
 * Additionally, it will add `cm-hasTablePointed` while pointing a table
 * down.
 */
export const tableCellObserver = ViewPlugin.define(view => {
	let { editor } = view.state.field(editorInfoField),
		pluginValue: PluginValue = {},
		pointerHandler: (evt: PointerEvent) => void;

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
		pointerHandler = onEditorPointerdown(view);
		view.dom.addEventListener("pointerdown", pointerHandler, {
			capture: true
		});
		pluginValue.destroy = () => view.dom.removeEventListener(
			'pointerdown', pointerHandler
		);
	}

	return pluginValue;
});