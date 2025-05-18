import { LayerConfig } from "@codemirror/view";
import { App, Editor, MarkdownView, Plugin } from "obsidian";
import { hookCursorPlugin, patchCursorPlugin, unpatchCursorPlugin } from "src/patch";
import { AnimatedCursorSettingTab } from "src/setting-tab";

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

	/** Indicate that the cursor plugin is already patched. */
	private _alreadyPatched: boolean = false;
	private _targetLayerConfig: LayerConfig;
	private _originalLayerConfig: LayerConfig;

	public async onload(): Promise<void> {
		await this.loadSettings();

		this.addSettingTab(new AnimatedCursorSettingTab(this.app, this));

		let activeEditor = this.app.workspace.activeEditor?.editor;
		if (activeEditor) this._tryPatch(activeEditor);
		else this.registerEvent(this.app.workspace.on(
			"editor-selection-change",
			this._tryPatch.bind(this)
		));

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
		if (this._alreadyPatched)
			unpatchCursorPlugin(this._targetLayerConfig, this._originalLayerConfig);

		_iterMarkdownView(this.app, view => {
			let cursorPlugin = hookCursorPlugin(view.editor.cm);
			cursorPlugin?.dom.removeClass("cm-blinkLayer");
		});

		console.log("Unload Animated Cursor plugin");
	}

	/**
	 * Try to patch the cursor plugin on corresponding editor. Should only be
	 * run when the previous attemps failed.
	 * 
	 * Used as `editor-selection-change` event callback.
	 */
	private _tryPatch(editor: Editor): void {
		let editorView = editor.cm,
			cursorPlugin = hookCursorPlugin(editorView);

		if (!cursorPlugin) return;

		this._targetLayerConfig = cursorPlugin.layer;
		this._originalLayerConfig = patchCursorPlugin(cursorPlugin, this.settings);
		this._alreadyPatched = true;

		// Detach the handler after a successful attemp.
		this.app.workspace.off("editor-selection-change", this._tryPatch);
	}
}