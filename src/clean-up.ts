import { type PluginValue, ViewPlugin } from './@codemirror/view';
import type { AnimatedCursorPlugin } from './main';

/**
 * `ViewPlugin` that reverts cursor layer to its default.
 */
export function cursorLayerCleanUp(plugin: AnimatedCursorPlugin): ViewPlugin<PluginValue> {
	return ViewPlugin.define(view => ({
		destroy: () => {
			if (!plugin.cursorPlugin) return;
			let layer = view.plugin(plugin.cursorPlugin);
			// Remove cm-blinkLayer class.
			layer?.dom.removeClass('cm-blinkLayer');
			// Restore default styles.
			layer?.dom.setCssStyles({
				animationName: 'cm-blink',
				animationDuration: '1200ms'
			});
		}
	}));
}