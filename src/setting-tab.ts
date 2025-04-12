import AnimatedCursorPlugin from "main";
import { App, PluginSettingTab, Setting } from "obsidian"

export class AnimatedCursorSettingTab extends PluginSettingTab {
	plugin: AnimatedCursorPlugin;

	constructor(app: App, plugin: AnimatedCursorPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		new Setting(this.containerEl)
			.setName("Slightly more smoothly")
			.setDesc(
				"If turned on, cursor moves slightly more smoothly, especially when the user moves it continously. " +
				"There is a downside, the cursor appears blurry."
			)
			.addToggle(toggle => {
				toggle
					.setValue(this.plugin.settings.useTransform)
					.onChange(val => this.plugin.settings.useTransform = val);
			});
		
		document.createDocumentFragment();
	}

	hide(): void {
		// Clear all components when the tab was hidden.
		this.containerEl.empty();
		super.hide();
	}
}
