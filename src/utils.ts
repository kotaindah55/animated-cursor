import type { EditorState } from './@codemirror/state';
import {
	type EditorView,
	type PluginInstance,
	type PluginSource,
	type PluginValue,
	Direction,
	ViewPlugin
} from './@codemirror/view';
import { editorInfoField } from './obsidian';

export function isFunction(val: unknown): val is (...args: unknown[]) => unknown {
	return typeof val === 'function';
}

/**
 * Get table cell's `EditorView` in the current editor if any.
 * 
 * @param state Associated `EditorState`.
 */
export function getTableCellCM(state: EditorState): EditorView | undefined {
	let editor = state.field(editorInfoField).editor,
		{ activeCM } = editor ?? {};

	if (!editor?.inTableCell) return;

	return activeCM;
}

/**
 * Get scroller top and left position. Based on CodeMirror's `getBase()`
 * function with some modifications.
 * 
 * Copyright (C) 2018-2021 by Marijn Haverbeke <marijn@haverbeke.berlin>
 * and others at CodeMirror. Licensed under MIT.
 * 
 * @see https://github.com/codemirror/view/blob/main/src/layer.ts
 */
export function getBaseCoords(view: EditorView): { top: number, left: number } {
	let scrollerRect = view.scrollDOM.getBoundingClientRect(),
		left = view.textDirection == Direction.LTR
			? scrollerRect.left
			: scrollerRect.right - view.scrollDOM.clientWidth * view.scaleX;

	return {
		top: scrollerRect.top - view.scrollDOM.scrollTop * view.scaleY,
		left: left - view.scrollDOM.scrollLeft * view.scaleX
	};
}

/**
 * Get `ViewPlugin` from `PluginInstance` with backward compatibilty.
 * 
 * @returns May return `null`.
 */
export function getViewPluginFromInstance<V extends PluginValue, Arg>(
	instance: PluginInstance<V, Arg>
): ViewPlugin<V, Arg> | null {
	// In earlier version of CodeMirror 6, ViewPlugin instance was assigned
	// directly to PluginInstance.spec.
	type Spec = PluginSource<V, Arg> | ViewPlugin<V, Arg>;
	let spec = instance.spec as Spec | null;
	return spec instanceof ViewPlugin
		? spec
		: spec?.plugin ?? null;
}