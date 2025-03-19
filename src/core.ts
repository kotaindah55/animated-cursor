import { combineConfig, Compartment, EditorSelection, Extension, Facet } from "@codemirror/state";
import { layer, PluginValue, RectangleMarker, ViewPlugin, ViewUpdate } from "@codemirror/view";
import AnimatedCursorPlugin from "main";

interface CursorConfig {
    /** Draw cursor on selection. */
    drawRangeCursor: boolean;
}

/**
 * Check whether the cursor config was changed.
 * 
 * Taken from, and modified of codemirror/view's `configChanged` version.
 * Only be found in its internal API.
 */
function configChanged(update: ViewUpdate): boolean {
    return update.startState.facet(cursorConfigFacet) != update.state.facet(cursorConfigFacet);
}

/**
 * Cursor DOM that will be drawn above the editor, replacing the native
 * one. In fact, Obsidian natively already has this functionality, except
 * it doesn't apply to the primary cursor (i.e. first cursor).
 * 
 * Taken from, and modified version of codemirror/view's `cursorLayer`.
 * Only be found in its internal API.
 */
const cursorLayer = layer({
    // Make the cursor above the text display.
    above: true,
    // Class name of cursor's layer (not the cursor).
    class: "cm-cursorLayer",

    markers(view): RectangleMarker[] {
        let { state } = view,
            { drawRangeCursor } = state.facet(cursorConfigFacet),
            cursors: RectangleMarker[] = [];
        
        for (let range of state.selection.ranges) {
            // Range cursor only be drawn when drawRangeCursor is true.
            if (!range.empty && !drawRangeCursor) continue;

            let isPrimary = range == state.selection.main,
                className = "cm-cursor cm-cursor-animated " + (isPrimary ? "cm-cursor-primary" : "cm-cursor-secondary"),
                cursor = range.empty ? range : EditorSelection.cursor(range.head, range.head > range.anchor ? -1 : 1);
            
            for (let piece of RectangleMarker.forRange(view, className, cursor))
                cursors.push(piece);
        }
        return cursors;
    },

    update(update, dom): boolean {
        // Reset its blink if the cursor/selection was changed.
        if (update.transactions.some(tr => tr.selection))
            dom.style.animationName = dom.style.animationName == "cm-blink" ? "cm-blink2" : "cm-blink";

        return update.docChanged || update.selectionSet || configChanged(update);
    }
});

/**
 * Facet that stores cursor configuration.
 * 
 * Taken from, and modified of codemirror/view's `selectionConfig`
 * version. Only be found in its internal API.
 */
const cursorConfigFacet = Facet.define<CursorConfig, CursorConfig>({
    combine(value): CursorConfig {
        return combineConfig(value, { drawRangeCursor: true }, {
            drawRangeCursor: (a, b) => a || b
        });
    }
});

/**
 * Used as facet reconfiguration by dispatching it through
 * `EditorView.dispatch()`. Intended to be used during setting update.
 */
const configurator = new Compartment();

/** Core of Animated Cursor plugin. */
export const animatedCursor = (plugin: AnimatedCursorPlugin) => {
    return ViewPlugin.define(view => {

        let listener = plugin.registerSettingUpdateListener((plugin: AnimatedCursorPlugin) => {
            // If "drawRangeCursor" wasn't changed, cursorLayer won't be updated.
            if (plugin.settings.drawRangeCursor == view.state.facet(cursorConfigFacet).drawRangeCursor)
                return;

            let { drawRangeCursor } = plugin.settings;
            view.dispatch({
                effects: configurator.reconfigure(cursorConfigFacet.of({ drawRangeCursor }))
            });
        });

        return {
            destroy(): void {
                // Detach the listener when animatedCursor was destroyed.
                plugin.detachSettingUpdateListener(listener);
            },
        } as PluginValue
    }, {

        // All extensions above will be held under "animatedCursor" ViewPlugin.
        provide(): Extension {
            let { drawRangeCursor } = plugin.settings;
            return [
                configurator.of(cursorConfigFacet.of({ drawRangeCursor })),
                cursorLayer
            ];
        },
    });
}