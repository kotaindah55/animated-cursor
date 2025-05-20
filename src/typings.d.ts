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
	 * MIT licensed, copyright (c) by Marijn Haverbeke and others at
	 * CodeMirror.
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
	 * MIT licensed, copyright (c) by Marijn Haverbeke and others at
	 * CodeMirror.
	 * 
	 * @see https://github.com/codemirror/view/blob/main/src/extension.ts
	 */
	interface MeasureRequest<T> {
		key?: unknown;
		read(view: EditorView): T;
		write?(measure: T, view: EditorView): void;
	}

	/**
	 * MIT licensed, copyright (c) by Marijn Haverbeke and others at
	 * CodeMirror.
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
		get activeCM(): EditorView;
	}
}

declare module "monkey-around" {
	type Uninstaller = () => void;
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface CursorLayerConfig extends LayerConfig {}

export interface CursorLayerView extends LayerView {
	readonly layer: CursorLayerConfig;
}

export type CursorPluginInstance = PluginInstance<CursorLayerView>;