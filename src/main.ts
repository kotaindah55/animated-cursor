import {
	type App,
	type Debouncer,
	type Editor,
	type EventRef,
	type PluginManifest,
	debounce,
	Plugin
} from './obsidian';
import { adjustCursorLayer, patchCursorLayerConfig } from './patch';
import { AnimatedCursorSettingTab } from './setting-tab';
import { tableCellObserver } from './observer';
import { hookCursorPluginInstance } from './hook';
import type { CursorPlugin } from './types';
import { cursorLayerCleanUp } from './clean-up';
import { getViewPluginFromInstance } from './utils';

export interface AnimatedCursorSettings {
	useTransform: boolean;
}

function getDefaultSettings(): AnimatedCursorSettings {
	return { useTransform: false };
}

export class AnimatedCursorPlugin extends Plugin {
	public override readonly settings: AnimatedCursorSettings;
	public readonly requestSave: Debouncer<[], void>;
	public cursorPlugin: CursorPlugin | null;

	/**
	 * If any, it indicates that the cursor plugin is already patched.
	 */
	private alreadyPatched: boolean;
	private patchAttemptRef?: EventRef;

	public constructor(app: App, manifest: PluginManifest) {
		super(app, manifest);

		this.settings = getDefaultSettings();
		this.requestSave = debounce(this.saveSettings.bind(this), 80);
		this.alreadyPatched = false;
		this.cursorPlugin = null;
	}

	public override async onload(): Promise<void> {
		await this.loadSettings();

		this.addSettingTab(new AnimatedCursorSettingTab(this.app, this));
		this.registerEditorExtension([
			tableCellObserver,
			cursorLayerCleanUp(this)
		]);

		let activeEditor = this.app.workspace.activeEditor?.editor;
		if (activeEditor) this.tryPatch(activeEditor);
		else this.patchAttemptRef = this.app.workspace.on('editor-selection-change', this.tryPatch.bind(this));

		this.app.workspace.trigger('parse-style-settings');

		console.debug('Load Animated Cursor plugin');
	}

	public override onunload(): void {
		this.cancelPatchAttempt();
		console.debug('Unload Animated Cursor plugin');
	}

	private async loadSettings(): Promise<void> {
		Object.assign(this.settings, await this.loadData());
	}

	private async saveSettings(): Promise<void> {
		await this.saveData(this.settings);
	}

	/**
	 * Patch the cursor plugin on corresponding editor. Should only be
	 * run at the first time, or when the previous attemps failed.
	 */
	private tryPatch(editor: Editor): void {
		if (this.alreadyPatched) {
			// Cancel patch attempt if CursorLayerConfig has already been patched.
			this.cancelPatchAttempt();
			return;
		}

		let editorView = editor.cm,
			cursorPluginInstance = hookCursorPluginInstance(editorView);

		// Fail patch.
		if (!cursorPluginInstance?.value) return;

		// Will be uninstalled automatically on plugin unload.
		patchCursorLayerConfig(this, cursorPluginInstance.value.layer);
		this.alreadyPatched = true;
		this.cursorPlugin = getViewPluginFromInstance(cursorPluginInstance);

		// Post-patch action.
		if (this.cursorPlugin) adjustCursorLayer(this.app, this.cursorPlugin);

		// Unregister the handler after a successful attempt.
		this.cancelPatchAttempt();
	}

	private cancelPatchAttempt(): void {
		if (this.patchAttemptRef) {
			this.app.workspace.offref(this.patchAttemptRef);
			delete this.patchAttemptRef;
		}
	}
}

export default AnimatedCursorPlugin;