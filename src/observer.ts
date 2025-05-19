import { Annotation } from "@codemirror/state";
import { PluginValue, ViewPlugin } from "@codemirror/view";
import { editorInfoField } from "obsidian";

/**
 * Used to tell base `EditorView` that table cell's `EditorView` inside
 * has focus state change.
 */
export const tableCellFocusChange = Annotation.define<boolean>();

/**
 * When injected to the table cell's `EditorView`, it will dispatch
 * `tableCellFocusChange` annot to the base `EditorView` everytime table
 * cell focus state changed. Otherwise, it does nothing.
 */
export const tableCellFocusObserver = ViewPlugin.define(view => {
	let { editor } = view.state.field(editorInfoField),
		pluginValue: PluginValue = {};

	if (editor?.inTableCell && editor.activeCM === view) {
		pluginValue.update = update => {
			if (update.focusChanged) editor.cm.dispatch({
				annotations: tableCellFocusChange.of(view.hasFocus)
			});
		};
	}

	return pluginValue;
});