import { App, Editor, EventRef, MarkdownView, Plugin } from "obsidian";
import { Uninstaller } from "monkey-around";
import { patchCursorPlugin } from "src/patch";
import { AnimatedCursorSettingTab } from "src/setting-tab";
import { tableCellFocusObserver } from "src/observer";
import { hookCursorPlugin } from "src/hook";

export interface AnimatedCursorSettings {
	useTransform: boolean;
}

export const DEFAULT_SETTINGS: AnimatedCursorSettings = {
	useTransform: true
}

function _iterMarkdownView(app: App, callback: (view: MarkdownView) => unknown): void {
	app.workspace.getLeavesOfType("markdown").forEach(leaf => {
		if (leaf.view instanceof MarkdownView)
			callback(leaf.view);
	});
}

export default class AnimatedCursorPlugin extends Plugin {
	public settings: AnimatedCursorSettings;
	public settingTab: AnimatedCursorSettingTab;

	/**
	 * If any, it indicates that the cursor plugin is already patched.
	 * Run this unistaller when unloading this plugin.
	 */
	private _patchUninstaller?: Uninstaller;
	private _tryPatchRef?: EventRef;

	public async onload(): Promise<void> {
		await this.loadSettings();

		this.addSettingTab(new AnimatedCursorSettingTab(this.app, this));

		let activeEditor = this.app.workspace.activeEditor?.editor;
		if (activeEditor) this._tryPatch(activeEditor);
		else this.registerEvent(this._tryPatchRef = this.app.workspace.on(
			"editor-selection-change",
			this._tryPatch.bind(this)
		));

		this.registerEditorExtension(tableCellFocusObserver);

		this.app.workspace.trigger("parse-style-settings");

		console.log("Load Animated Cursor plugin");
	}

	public async loadSettings(): Promise<void> {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	public async saveSettings(): Promise<void> {
		await this.saveData(this.settings);
	}

	public onunload(): void {
		this._patchUninstaller?.();

		_iterMarkdownView(this.app, view => {
			let cursorPlugin = hookCursorPlugin(view.editor.cm);
			cursorPlugin?.dom.removeClass("cm-blinkLayer");
		});

		console.log("Unload Animated Cursor plugin");
	}

	/**
	 * Try to patch the cursor plugin on corresponding editor. Should only be
	 * run at the first time, or when the previous attemps failed.
	 * 
	 * Used as `editor-selection-change` event callback.
	 */
	private _tryPatch(editor: Editor): void {
		// eslint-disable-next-line no-unused-labels
		DEVEL: if (this._patchUninstaller) {
			console.warn('Animated cursor: try to patch the cursor while it has already been patched');
		} else {
			console.log('Animated Cursor: try to patch the cursor');
		}

		let editorView = editor.cm,
			cursorPlugin = hookCursorPlugin(editorView);

		if (!cursorPlugin) {
			// eslint-disable-next-line no-unused-labels
			DEVEL: console.log('Animated Cursor: patch failed');
			return;
		}

		this._patchUninstaller = patchCursorPlugin(cursorPlugin, this.settings);

		// Detach the handler after a successful attemp.
		if (this._tryPatchRef) this.app.workspace.offref(this._tryPatchRef);

		// eslint-disable-next-line no-unused-labels
		DEVEL: console.log('Animated Cursor: patch successful');
	}
}