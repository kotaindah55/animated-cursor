import { EditorView, LayerConfig, MeasureRequest, PluginInstance } from "@codemirror/view";
import { CursorPluginInstance } from "src/typings";

/** Ensure that it is a layer config. */
function isLayerConfig(object: object): object is LayerConfig {
	return (
		"above" in object && typeof object.above == "boolean" &&
		(!("class" in object) || typeof object.class == "string") &&
		(!("updateOnDocViewUpdate" in object) || typeof object.updateOnDocViewUpdate == "boolean") &&
		"update" in object && typeof object.update == "function" &&
		"markers" in object && typeof object.markers == "function" &&
		(!("mount" in object) || typeof object.mount == "function") &&
		(!("destroy" in object) || typeof object.destroy == "function")
	);
}

/** Ensure that it is a `MeasureRequest` instance. */
function isMeasureReq(object: object): object is MeasureRequest<unknown> {
	return (
		"read" in object && typeof object.read == "function" &&
		(!("write" in object) || typeof object.write == "function")
	)
}

/** Ensure that the plugin value is a `CursorLayerView` instance. */
function isCursorPlugin(instance: PluginInstance): instance is CursorPluginInstance {
	let pluginValue = instance.value;
	return (
		!!pluginValue &&
		"view" in pluginValue && pluginValue.view instanceof EditorView &&
		"layer" in pluginValue && !!pluginValue.layer && isLayerConfig(pluginValue.layer) &&
		"measureReq" in pluginValue && !!pluginValue.measureReq && isMeasureReq(pluginValue.measureReq) &&
		"drawn" in pluginValue && pluginValue.drawn instanceof Array &&
		"dom" in pluginValue && pluginValue.dom instanceof HTMLElement &&
		"scaleX" in pluginValue && typeof pluginValue.scaleX == "number" &&
		"scaleY" in pluginValue && typeof pluginValue.scaleY == "number" &&
		"setOrder" in pluginValue && typeof pluginValue.setOrder == "function" &&
		"measure" in pluginValue && typeof pluginValue.measure == "function" &&
		"scale" in pluginValue && typeof pluginValue.scale == "function" &&
		"draw" in pluginValue && typeof pluginValue.draw == "function" &&
		pluginValue.layer.class == "cm-cursorLayer"
	);
}

/** Hook the builtin cursor plugin provided by Obsidian. */
export function hookCursorPlugin(view: EditorView): CursorPluginInstance | undefined {
	// @ts-ignore We ignore view.plugins from being checked because it's
	// labeled internally as a private property.
	let pluginInstances = view.plugins as PluginInstance[];
	return pluginInstances.find(
		(instance): instance is CursorPluginInstance => {
			return !!instance.value && isCursorPlugin(instance);
		}
	);
}