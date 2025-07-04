import { App, Editor, EventRef, MarkdownView, Plugin } from "obsidian";
import { patchCursorLayer } from "src/patch";
import { AnimatedCursorSettingTab } from "src/setting-tab";
import { tableCellObserver } from "src/observer";
import { hookCursorPlugin } from "src/hook";
import { CursorPluginInstance } from "src/typings";

export interface AnimatedCursorSettings {
	useTransform: boolean;
}

export const DEFAULT_SETTINGS: AnimatedCursorSettings = {
	useTransform: true
}

function iterMarkdownView(app: App, callback: (view: MarkdownView) => unknown): void {
	app.workspace.getLeavesOfType("markdown").forEach(leaf => {
		if (leaf.view instanceof MarkdownView)
			callback(leaf.view);
	});
}

export default class AnimatedCursorPlugin extends Plugin {
	public settings: AnimatedCursorSettings;

	/**
	 * If any, it indicates that the cursor plugin is already patched.
	 */
	private alreadyPatched: boolean;
	private tryPatchRef?: EventRef;
	private cursorPlugin?: CursorPluginInstance;

	public async onload(): Promise<void> {
		await this.loadSettings();

		this.alreadyPatched = false;
		this.addSettingTab(new AnimatedCursorSettingTab(this.app, this));
		this.registerEditorExtension(tableCellObserver);

		let activeEditor = this.app.workspace.activeEditor?.editor;
		if (activeEditor) this.tryPatch(activeEditor);
		else this.tryPatchRef = this.app.workspace.on(
			"editor-selection-change",
			this.tryPatch.bind(this)
		);

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
		this.cancelPatchAttempt();

		iterMarkdownView(this.app, view => {
			if (!this.cursorPlugin?.spec) return;
			let layer = view.editor.cm.plugin(this.cursorPlugin.spec);
			layer?.dom.removeClass("cm-blinkLayer");
		});

		console.log("Unload Animated Cursor plugin");
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
			DEVEL: console.warn("Animated cursor: try to patch the cursor while it has already been patched");
			return;
		}

		// eslint-disable-next-line no-unused-labels
		DEVEL: console.log("Animated Cursor: try to patch the cursor");

		let editorView = editor.cm,
			cursorPlugin = hookCursorPlugin(editorView);

		if (!cursorPlugin?.value) {
			// eslint-disable-next-line no-unused-labels
			DEVEL: console.log("Animated Cursor: patch failed");
			return;
		}

		// Will be uninstalled automatically on plugin unload.
		this.register(patchCursorLayer(cursorPlugin.value, this.settings));
		this.alreadyPatched = true;
		this.cursorPlugin = cursorPlugin;

		// Detach the handler after a successful attemp.
		this.cancelPatchAttempt();

		// eslint-disable-next-line no-unused-labels
		DEVEL: console.log("Animated Cursor: patch successful");
	}

	private cancelPatchAttempt(): void {
		if (this.tryPatchRef) {
			this.app.workspace.offref(this.tryPatchRef);
			delete this.tryPatchRef;
		}
	}
}