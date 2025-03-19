import { Plugin } from "obsidian";
import { animatedCursor } from "src/core";
import { AnimatedCursorSettingTab } from "src/setting-tab";

interface AnimatedCursorSettings {
    /** Draw cursor on selection. */
    drawRangeCursor: boolean;
}

export const DEFAULT_SETTINGS: AnimatedCursorSettings = {
    drawRangeCursor: true
};

export default class AnimatedCursorPlugin extends Plugin {
    settings: AnimatedCursorSettings;
    settingTab: AnimatedCursorSettingTab;
    
    private settingUpdateListeners = new Set<(plugin: AnimatedCursorPlugin) => unknown>();

    async onload(): Promise<void> {
        await this.loadSettings();

        this.addSettingTab(new AnimatedCursorSettingTab(this.app, this));
        this.registerEditorExtension(animatedCursor(this));

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
        console.log("Unload Animated Cursor plugin");
    }

    /**
     * Handler for setting update. Useful for updating `EditorView`s that
     * exist in the workspace without restarting the app.
     */
    onSettingUpdate(): void {
        this.settingUpdateListeners.forEach(listener => {
            listener(this);
        });
    }

    /**
     * Can be an effective way to update all existing EditorView.
     */
    registerSettingUpdateListener(listener: (plugin: AnimatedCursorPlugin) => unknown): typeof listener {
        this.settingUpdateListeners.add(listener);
        return listener;
    }

    detachSettingUpdateListener(listener: (plugin: AnimatedCursorPlugin) => unknown): void {
        this.settingUpdateListeners.delete(listener);
    }
}