import { LayerConfig } from "@codemirror/view";
import { App, MarkdownView, Plugin, WorkspaceLeaf } from "obsidian";
import { hookCursorPlugin, patchCursorPlugin, unpatchCursorPlugin } from "src/core";
import { AnimatedCursorSettingTab } from "src/setting-tab";

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface AnimatedCursorSettings {}

export const DEFAULT_SETTINGS: AnimatedCursorSettings = {}

function _iterMarkdownView(app: App, callback: (view: MarkdownView) => unknown): void {
	app.workspace.getLeavesOfType("markdown").forEach(leaf => {
		if (leaf.view instanceof MarkdownView)
			callback(leaf.view);
	});
}

export default class AnimatedCursorPlugin extends Plugin {
	settings: AnimatedCursorSettings;
	settingTab: AnimatedCursorSettingTab;

	/** Indicate that the cursor plugin is already patched. */
	alreadyPatched: boolean = false;
	targetLayerConfig: LayerConfig;
	originalLayerConfig: LayerConfig;
	
	private settingUpdateListeners = new Set<(plugin: AnimatedCursorPlugin) => unknown>();

	async onload(): Promise<void> {
		await this.loadSettings();

		// this.addSettingTab(new SmoothCursorSettingTab(this.app, this));

		let mdView = this.app.workspace.getActiveViewOfType(MarkdownView);
		if (mdView)
			this.tryPatch(mdView.leaf);
		else
			this.registerEvent(this.app.workspace.on("active-leaf-change", this.tryPatch));

		console.log("Load Animated Cursor plugin");
	}

	async loadSettings(): Promise<void> {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings(): Promise<void> {
		await this.saveData(this.settings);
		this.onSettingUpdate();
	}

	onunload(): void {
		if (this.alreadyPatched)
			unpatchCursorPlugin(this.targetLayerConfig, this.originalLayerConfig);

		_iterMarkdownView(this.app, view => {
			let cursorPlugin = hookCursorPlugin(view.editor.cm);
			cursorPlugin?.dom.removeClass("cm-blinkLayer");
		});

		console.log("Unload Animated Cursor plugin");
	}

	/**
	 * Try to patch the cursor plugin each active leaf was changed. Should
	 * only be run when the previous attemps failed.
	 * 
	 * Used as `"active-leaf-change"` event callback.
	 */
	readonly tryPatch = (leaf: WorkspaceLeaf | null): void => {
		if (this.alreadyPatched || !(leaf?.view instanceof MarkdownView)) return;

		let editorView = leaf.view.editor.cm,
			cursorPlugin = hookCursorPlugin(editorView);

		if (!cursorPlugin) return;

		this.targetLayerConfig = cursorPlugin.layer;
		this.originalLayerConfig = patchCursorPlugin(cursorPlugin);
		this.alreadyPatched = true;

		// Detach the handler after a successful attemp.
		this.app.workspace.off("active-leaf-change", this.tryPatch);
	}

	/**
	 * Handler for setting update. Useful for updating `EditorView`s that
	 * exist in the workspace without restarting the app.
	 * 
	 * _Currently not in use._
	 */
	onSettingUpdate(): void {
		this.settingUpdateListeners.forEach(listener => {
			listener(this);
		});
	}

	/**
	 * Can be an effective way to update all existing EditorView.
	 * 
	 * _Currently not in use._
	 */
	registerSettingUpdateListener(listener: (plugin: AnimatedCursorPlugin) => unknown): typeof listener {
		this.settingUpdateListeners.add(listener);
		return listener;
	}

	detachSettingUpdateListener(listener: (plugin: AnimatedCursorPlugin) => unknown): void {
		this.settingUpdateListeners.delete(listener);
	}
}