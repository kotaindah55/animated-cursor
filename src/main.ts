import { type App, type Editor, type EventRef, MarkdownView, Plugin } from './obsidian';
import { patchCursorLayer } from './patch';
import { AnimatedCursorSettingTab } from './setting-tab';
import { tableCellObserver } from './observer';
import { hookCursorPlugin } from './hook';
import type { CursorPluginInstance } from './types';

export interface AnimatedCursorSettings {
	useTransform: boolean;
}

function getDefaultSettings(): AnimatedCursorSettings {
	return { useTransform: true };
}

export class AnimatedCursorPlugin extends Plugin {
	public override readonly settings: AnimatedCursorSettings;

	/**
	 * If any, it indicates that the cursor plugin is already patched.
	 */
	private alreadyPatched!: boolean;
	private tryPatchRef?: EventRef;
	private cursorPlugin?: CursorPluginInstance;

	public override async onload(): Promise<void> {
		await this.loadSettings();

		this.alreadyPatched = false;
		this.addSettingTab(new AnimatedCursorSettingTab(this.app, this));
		this.registerEditorExtension([
			tableCellObserver,
			cursorLayerCleanUp(this)
		]);

		let activeEditor = this.app.workspace.activeEditor?.editor;
		if (activeEditor) this.tryPatch(activeEditor);
		else this.tryPatchRef = this.app.workspace.on(
			'editor-selection-change',
			this.tryPatch.bind(this)
		);

		this.app.workspace.trigger('parse-style-settings');

		console.log('Load Animated Cursor plugin');
	}

	public async loadSettings(): Promise<void> {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	public async saveSettings(): Promise<void> {
		await this.saveData(this.settings);
	}

	public override onunload(): void {
		this.cancelPatchAttempt();
	private async loadSettings(): Promise<void> {
		Object.assign(this.settings, await this.loadData());
	}

	private async saveSettings(): Promise<void> {
		await this.saveData(this.settings);
	}

	/**
	 * Try to patch the cursor plugin on corresponding editor. Should only be
	 * run at the first time, or when the previous attemps failed.
	 * 
	 * Used as `editor-selection-change` event callback.
	 */
	private tryPatch(editor: Editor): void {
		if (this.alreadyPatched) {
			this.cancelPatchAttempt();
			// eslint-disable-next-line no-unused-labels
			DEVEL: console.warn('Animated cursor: try to patch the cursor while it has already been patched');
			return;
		}

		// eslint-disable-next-line no-unused-labels
		DEVEL: console.log('Animated Cursor: try to patch the cursor');

		let editorView = editor.cm,
			cursorPlugin = hookCursorPlugin(editorView);

		if (!cursorPlugin?.value) {
			// eslint-disable-next-line no-unused-labels
			DEVEL: console.log('Animated Cursor: patch failed');
			return;
		}

		// Will be uninstalled automatically on plugin unload.
		this.register(patchCursorLayer(cursorPlugin.value, this.settings));
		this.alreadyPatched = true;
		this.cursorPlugin = cursorPlugin;

		// Detach the handler after a successful attemp.
		this.cancelPatchAttempt();

		// eslint-disable-next-line no-unused-labels
		DEVEL: console.log('Animated Cursor: patch successful');
	}

	private cancelPatchAttempt(): void {
		if (this.tryPatchRef) {
			this.app.workspace.offref(this.tryPatchRef);
			delete this.tryPatchRef;
		}
	}
}

export default AnimatedCursorPlugin;