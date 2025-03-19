import AnimatedCursorPlugin from "main";
import { App, PluginSettingTab, Setting } from "obsidian"

export class AnimatedCursorSettingTab extends PluginSettingTab {
    plugin: AnimatedCursorPlugin;

    constructor(app: App, plugin: AnimatedCursorPlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        let { containerEl } = this,
            { settings } = this.plugin;

        new Setting(containerEl)
            .setName("Draw range cursor")
            .setDesc("Whether draw cursor on selection.")
            .addToggle(toogle => {
                toogle.setValue(settings.drawRangeCursor);
                toogle.onChange(val => {
                    settings.drawRangeCursor = val;
                    this.plugin.saveSettings();
                });
            });
    }

    hide(): void {
        // Clear all components when the tab was hidden.
        this.containerEl.empty();
        super.hide();
    }
}