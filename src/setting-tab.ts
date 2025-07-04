import AnimatedCursorPlugin from "src/main";
import { App, PluginSettingTab, Setting } from "obsidian"

export class AnimatedCursorSettingTab extends PluginSettingTab {
	public readonly plugin: AnimatedCursorPlugin;

	constructor(app: App, plugin: AnimatedCursorPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	public display(): void {
		new Setting(this.containerEl)
			.setName("Slightly more smoothly")
			.setDesc(
				"If turned on, cursor moves slightly more smoothly, especially when the user moves it continously. " +
				"There is a downside, the cursor appears blurry."
			)
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.useTransform)
				.onChange(val => {
					this.plugin.settings.useTransform = val;
					this.plugin.saveSettings();
				})
			);
	}

	public hide(): void {
		// Clear all components when the tab was hidden.
		this.containerEl.empty();
		super.hide();
	}
}
