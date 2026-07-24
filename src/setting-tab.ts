import {
	type App,
	type SettingDefinitionItem,
	PluginSettingTab,
	Setting
} from './obsidian'
import type { AnimatedCursorPlugin, AnimatedCursorSettings } from './main';
import { t } from './i18n';

export class AnimatedCursorSettingTab extends PluginSettingTab {
	public readonly plugin: AnimatedCursorPlugin;

	public constructor(app: App, plugin: AnimatedCursorPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	public override getSettingDefinitions(): SettingDefinitionItem<keyof AnimatedCursorSettings>[] {
		return [{
			name: t('settings.useTransform.name'),
			desc: t('settings.useTransform.desc'),
			control: {
				type: 'toggle',
				key: 'useTransform'
			}
		}];
	}

	public override display(): void {
		new Setting(this.containerEl)
			.setName(t('settings.useTransform.name'))
			.setDesc(t('settings.useTransform.desc'))
			.addToggle(comp => comp
				.setValue(this.plugin.settings.useTransform)
				.onChange(val => {
					this.plugin.settings.useTransform = val;
					this.plugin.requestSave();
				})
			);
	}

	public override hide(): void {
		// Clear all components when the tab was hidden.
		this.containerEl.empty();
		super.hide();
	}
}
