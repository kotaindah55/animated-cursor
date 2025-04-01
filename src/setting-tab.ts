import AnimatedCursorPlugin from "main";
import { App, PluginSettingTab } from "obsidian"

/** _Currently not in use._ */
export class AnimatedCursorSettingTab extends PluginSettingTab {
	plugin: AnimatedCursorPlugin;

	constructor(app: App, plugin: AnimatedCursorPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {}

	hide(): void {
		// Clear all components when the tab was hidden.
		this.containerEl.empty();
		super.hide();
	}
}