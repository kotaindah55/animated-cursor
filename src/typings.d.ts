import { EditorState } from "@codemirror/state";
import {
	EditorView,
	layer,
	LayerConfig,
	LayerMarker,
	LayerView,
	PluginInstance,
	PluginValue,
	ViewPlugin,
	ViewUpdate
} from "@codemirror/view";
import "obsidian";
import "monkey-around";

declare module "@codemirror/view" {
	type LayerConfig = Parameters<typeof layer>[0];

	type LayerPluginInstance = PluginInstance<LayerView>;

	/**
	 * Copyright (C) 2018-2021 by Marijn Haverbeke <marijn@haverbeke.berlin>
	 * and others. Licensed under MIT.
	 * 
	 * @see https://github.com/codemirror/view/blob/main/src/layer.ts
	 */
	interface LayerView extends PluginValue {
		readonly layer: LayerConfig;
		readonly view: EditorView;
		dom: HTMLElement;
		drawn: readonly LayerMarker[];
		measureReq: MeasureRequest<readonly LayerMarker[]>,
		scaleX: number;
		scaleY: number;
		draw(markers: readonly LayerMarker[]): void;
		measure(): readonly LayerMarker[];
		scale(): void;
		setOrder(state: EditorState): void;
	}

	/**
	 * Copyright (C) 2018-2021 by Marijn Haverbeke <marijn@haverbeke.berlin>
	 * and others. Licensed under MIT.
	 * 
	 * @see https://github.com/codemirror/view/blob/main/src/extension.ts
	 */
	interface MeasureRequest<T> {
		key?: unknown;
		read(view: EditorView): T;
		write?(measure: T, view: EditorView): void;
	}

	/**
	 * Copyright (C) 2018-2021 by Marijn Haverbeke <marijn@haverbeke.berlin>
	 * and others. Licensed under MIT.
	 * 
	 * @see https://github.com/codemirror/view/blob/main/src/extension.ts
	 */
	interface PluginInstance<T extends PluginValue = PluginValue> {
		mustUpdate: ViewUpdate | null;
		spec: ViewPlugin<T> | null;
		value: T | null;
		deactivate(): void;
		destroy(view: EditorView): void;
		update(view: EditorView): PluginInstance<T>;
	}
}

declare module "obsidian" {
	interface Editor {
		/**
		 * Main CodeMirror's `EditorView` instance of the editor.
		 */
		cm: EditorView;
		/**
		 * Currently active `EditorView` in the editor, either belongs to the
		 * main editor directly or to the table cell.
		 */
		get activeCM(): EditorView;
		/**
		 * Whether the main editor has a nested `EditorView` inside a table cell.
		 */
		get inTableCell(): boolean;
	}

	interface Workspace {
		/**
		 * Triggered when any available editor has its selection changed.
		 */
		on(name: "editor-selection-change", callback: (editor: Editor, info: MarkdownFileInfo) => unknown, ctx?: unknown): EventRef;
	}
}

export interface CursorLayerView extends LayerView {
	readonly layer: LayerConfig;
}

export type CursorPluginInstance = PluginInstance<CursorLayerView>;