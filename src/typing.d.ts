import { EditorState } from "@codemirror/state";
import { layer, LayerConfig, LayerMarker, LayerView, PluginInstance, PluginValue, ViewPlugin, ViewUpdate } from "@codemirror/view";

declare module "@codemirror/view" {
	type LayerConfig = Parameters<typeof layer>[0];

	/**
	 * MIT licensed, copyright (c) by Marijn Haverbeke and others at
	 * CodeMirror.
	 * 
	 * @see https://github.com/codemirror/view/blob/main/src/extension.ts
	 */
	interface MeasureRequest<T> {
		read(view: EditorView): T;
		write?(measure: T, view: EditorView): void;
		key?: unknown;
	}

	/**
	 * MIT licensed, copyright (c) by Marijn Haverbeke and others at
	 * CodeMirror.
	 * 
	 * @see https://github.com/codemirror/view/blob/main/src/extension.ts
	 */
	interface PluginInstance<T extends PluginValue = PluginValue> {
		mustUpdate: ViewUpdate | null;
		value: T | null;
		spec: ViewPlugin<T> | null;
		update(view: EditorView): PluginInstance<T>;
		destroy(view: EditorView): void;
		deactivate(): void;
	}

	/**
	 * MIT licensed, copyright (c) by Marijn Haverbeke and others at
	 * CodeMirror.
	 * 
	 * @see https://github.com/codemirror/view/blob/main/src/layer.ts
	 */
	interface LayerView extends PluginValue {
		readonly view: EditorView;
		readonly layer: LayerConfig;
		measureReq: MeasureRequest<readonly LayerMarker[]>,
		drawn: readonly LayerMarker[];
		dom: HTMLElement;
		scaleX: number;
		scaleY: number;
		setOrder(state: EditorState): void;
		measure(): readonly LayerMarker[];
		scale(): void;
		draw(markers: readonly LayerMarker[]): void;
	}

	type LayerPluginInstance = PluginInstance<LayerView>;
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface CursorLayerConfig extends LayerConfig {}

export interface CursorLayerView extends LayerView {
	readonly layer: CursorLayerConfig;
}

export type CursorPluginInstance = PluginInstance<CursorLayerView>;

