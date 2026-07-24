import {
	type LayerConfig,
	type MeasureRequest,
	type PluginInstance,
	EditorView
} from './@codemirror/view';
import type { CursorPluginInstance } from './types';
import { isFunction } from './utils';

/**
 * Ensure that it is a `LayerConfig`.
 */
function isLayerConfig(obj: object): obj is LayerConfig {
	return (
		'above' in obj && isBoolean(obj.above) &&
		(!('class' in obj) || String.isString(obj.class)) &&
		(!('updateOnDocViewUpdate' in obj) || isBoolean(obj.updateOnDocViewUpdate)) &&
		'update' in obj && isFunction(obj.update) &&
		'markers' in obj && isFunction(obj.markers) &&
		(!('mount' in obj) || isFunction(obj.mount)) &&
		(!('destroy' in obj) || isFunction(obj.destroy))
	);
}

/**
 * Ensure that it is a `MeasureRequest` instance.
 */
function isMeasureReq(obj: object): obj is MeasureRequest<unknown> {
	return (
		'read' in obj && isFunction(obj.read) &&
		(!('write' in obj) || isFunction(obj.write))
	)
}

/**
 * Ensure that the plugin value is a `CursorLayerView` instance.
 */
function isCursorPluginInstance(instance: PluginInstance): instance is CursorPluginInstance {
	let pluginValue = instance.value;
	return (
		!!pluginValue &&
		'view' in pluginValue && pluginValue.view instanceof EditorView &&
		'layer' in pluginValue && !!pluginValue.layer && isLayerConfig(pluginValue.layer) &&
		'measureReq' in pluginValue && !!pluginValue.measureReq && isMeasureReq(pluginValue.measureReq) &&
		'drawn' in pluginValue && Array.isArray(pluginValue.drawn) &&
		'dom' in pluginValue && pluginValue.dom instanceof HTMLElement &&
		'scaleX' in pluginValue && Number.isNumber(pluginValue.scaleX) &&
		'scaleY' in pluginValue && Number.isNumber(pluginValue.scaleY) &&
		'setOrder' in pluginValue && isFunction(pluginValue.setOrder) &&
		'measure' in pluginValue && isFunction(pluginValue.measure) &&
		'scale' in pluginValue && isFunction(pluginValue.scale) &&
		'draw' in pluginValue && isFunction(pluginValue.draw) &&
		pluginValue.layer.class == 'cm-cursorLayer'
	);
}

/**
 * Hook builtin `CursorPluginInstance`.
 */
export function hookCursorPluginInstance(view: EditorView): CursorPluginInstance | undefined {
	// @ts-ignore We ignore view.plugins from being checked because it's
	// labeled internally as a private property.
	let pluginInstances = view.plugins as PluginInstance[];
	return pluginInstances.find(
		(instance): instance is CursorPluginInstance => {
			return !!instance.value && isCursorPluginInstance(instance);
		}
	);
}