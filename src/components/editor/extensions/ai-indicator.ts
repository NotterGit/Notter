import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";
import { type Editor } from "@tiptap/react";
import type { AiIndicatorState } from "@/config/types/editor.types";

export const aiIndicatorPluginKey = new PluginKey<AiIndicatorState>("aiIndicator");

export const AiIndicatorExtension = Extension.create({
  name: "aiIndicator",

  addProseMirrorPlugins() {
    return [
      new Plugin<AiIndicatorState>({
        key: aiIndicatorPluginKey,
        state: {
          init() {
            return { isGenerating: false, from: 0, to: 0 };
          },
          apply(tr, prevState) {
            const meta = tr.getMeta(aiIndicatorPluginKey);
            if (meta) {
              return meta;
            }
            if (!prevState.isGenerating) {
              return prevState;
            }
            return {
              isGenerating: prevState.isGenerating,
              from: tr.mapping.map(prevState.from),
              to: tr.mapping.map(prevState.to),
            };
          },
        },
        props: {
          decorations(state) {
            const pluginState = aiIndicatorPluginKey.getState(state);
            if (!pluginState || !pluginState.isGenerating) {
              return DecorationSet.empty;
            }

            const { from } = pluginState;
            const doc = state.doc;
            if (from < 0 || from > doc.content.size) {
              return DecorationSet.empty;
            }

            const decorations: Decoration[] = [];

            try {
              const safePos = Math.min(Math.max(0, from), doc.content.size);
              const $pos = doc.resolve(safePos);

              let nodeStart = 0;
              let nodeEnd = 0;
              let hasBlock = false;

              if ($pos.depth > 0) {
                let d = $pos.depth;
                while (d > 0 && !$pos.node(d).isTextblock) {
                  d--;
                }
                if (d === 0) d = $pos.depth;
                nodeStart = $pos.before(d);
                nodeEnd = $pos.after(d);
                hasBlock = true;
              } else {
                let accumulated = 0;
                for (let i = 0; i < doc.childCount; i++) {
                  const child = doc.child(i);
                  const childEnd = accumulated + child.nodeSize;
                  if (safePos <= childEnd || i === doc.childCount - 1) {
                    nodeStart = accumulated;
                    nodeEnd = childEnd;
                    hasBlock = true;
                    break;
                  }
                  accumulated = childEnd;
                }
              }

              if (hasBlock && nodeEnd > nodeStart) {
                decorations.push(
                  Decoration.node(nodeStart, nodeEnd, {
                    class: "tiptap-ai-generating-line",
                  })
                );
              }

              // Full-width shimmering bar without text
              const widget = Decoration.widget(
                safePos,
                () => {
                  const container = document.createElement("div");
                  container.className = "tiptap-ai-line-indicator";
                  container.innerHTML = `<span class="tiptap-ai-bar"></span>`;
                  return container;
                },
                { side: 0, key: "ai-indicator-bar-widget" }
              );
              decorations.push(widget);
            } catch (err) {
              console.error("AI Indicator decoration error:", err);
            }

            return DecorationSet.create(doc, decorations);
          },
        },
      }),
    ];
  },
});

export function setAiGenerating(
  editor: Editor | null,
  isGenerating: boolean,
  pos?: { from: number; to: number }
) {
  if (!editor || editor.isDestroyed) return;
  const currentPos = pos || {
    from: editor.state.selection.from,
    to: editor.state.selection.to,
  };
  const tr = editor.state.tr.setMeta(aiIndicatorPluginKey, {
    isGenerating,
    from: currentPos.from,
    to: currentPos.to,
  });
  editor.view.dispatch(tr);
}

export function getAiGeneratingPos(
  editor: Editor | null
): { from: number; to: number } | null {
  if (!editor || editor.isDestroyed) return null;
  const pluginState = aiIndicatorPluginKey.getState(editor.state);
  if (!pluginState || !pluginState.isGenerating) return null;
  return { from: pluginState.from, to: pluginState.to };
}
