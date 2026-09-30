import type { Editor } from "@tiptap/react";
import { DOMParser } from "@tiptap/pm/model";
import { Selection } from "@tiptap/pm/state";
import { cleanAiMarkdown, markdownToEditorHtml } from "./markdown-to-html";
import { aiIndicatorPluginKey } from "@/components/editor/extensions/ai-indicator";
import type { AiTypewriterOptions, AiTypewriterController } from "@/config/types/editor.types";
import {
  AI_TYPEWRITER_MIN_DURATION_MS,
  AI_TYPEWRITER_MAX_DURATION_MS,
  AI_TYPEWRITER_MS_PER_CHAR,
} from "@/config/const/editor.const";

const activeTypewriters = new WeakMap<Editor, AiTypewriterController>();

function getScrollParent(node: HTMLElement): HTMLElement | Window {
  let current: HTMLElement | null = node.parentElement;
  while (current && current !== document.body && current !== document.documentElement) {
    const style = window.getComputedStyle(current);
    const overflowY = style.overflowY;
    if (
      (overflowY === "auto" || overflowY === "scroll") &&
      current.scrollHeight > current.clientHeight
    ) {
      return current;
    }
    current = current.parentElement;
  }
  return window;
}

export function typewriteAiText(options: AiTypewriterOptions): AiTypewriterController {
  const { editor, markdown, range, onComplete, onError } = options;

  const existing = activeTypewriters.get(editor);
  if (existing && existing.isRunning()) {
    existing.finishImmediately();
  }

  let isRunning = true;
  let rafId: number | null = null;
  const cleanupListeners: Array<() => void> = [];

  const cleanup = () => {
    isRunning = false;
    if (rafId !== null) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
    while (cleanupListeners.length > 0) {
      const listenerCleanup = cleanupListeners.pop();
      try {
        listenerCleanup?.();
      } catch {
      }
    }
    if (activeTypewriters.get(editor) === controller) {
      activeTypewriters.delete(editor);
    }
  };

  const stop = () => {
    if (!isRunning) return;
    cleanup();
    if (!editor || editor.isDestroyed) return;

    try {
      const tr = editor.state.tr.setMeta(aiIndicatorPluginKey, {
        isGenerating: false,
        isTyping: false,
        from: 0,
        to: 0,
      });
      tr.setMeta("addToHistory", false);
      editor.view.dispatch(tr);
    } catch {
    }
  };

  const fullText = cleanAiMarkdown(markdown);

  if (!fullText.trim() || !editor || editor.isDestroyed) {
    stop();
    onComplete?.();
    const noopController: AiTypewriterController = {
      stop,
      finishImmediately: stop,
      isRunning: () => false,
    };
    return noopController;
  }

  const fullHtml = markdownToEditorHtml(fullText);
  const parser = DOMParser.fromSchema(editor.schema);

  const parseHtml = (htmlStr: string) => {
    const container = document.createElement("div");
    container.innerHTML = htmlStr;
    return parser.parse(container).content;
  };

  const fullFragment = parseHtml(fullHtml);
  if (fullFragment.size === 0) {
    stop();
    onComplete?.();
    const noopController: AiTypewriterController = {
      stop,
      finishImmediately: stop,
      isRunning: () => false,
    };
    return noopController;
  }

  const { doc } = editor.state;
  let currentFrom = Math.min(Math.max(0, range.from), doc.content.size);
  let currentTo = Math.min(Math.max(0, range.to), doc.content.size);

  if (currentFrom > currentTo) {
    const tmp = currentFrom;
    currentFrom = currentTo;
    currentTo = tmp;
  }

  if (currentFrom === currentTo && currentFrom >= 0 && currentFrom <= doc.content.size) {
    const $pos = doc.resolve(currentFrom);
    const parent = $pos.parent;
    if (parent.isTextblock && parent.textContent === "") {
      currentFrom = $pos.before();
      currentTo = $pos.after();
    }
  }

  const scrollContainer = getScrollParent(editor.view.dom);
  let userScrolledUp = false;

  const handleScrollOrWheel = (e: Event) => {
    if (e.type === "wheel") {
      const wheelEv = e as WheelEvent;
      if (wheelEv.deltaY < 0) {
        userScrolledUp = true;
      }
    }

    if (scrollContainer instanceof Window) {
      const dist =
        document.documentElement.scrollHeight - window.scrollY - window.innerHeight;
      if (dist < 120) {
        userScrolledUp = false;
      }
    } else {
      const dist =
        scrollContainer.scrollHeight - scrollContainer.scrollTop - scrollContainer.clientHeight;
      if (dist < 120) {
        userScrolledUp = false;
      }
    }
  };

  const scrollTarget = scrollContainer instanceof Window ? window : scrollContainer;
  scrollTarget.addEventListener("wheel", handleScrollOrWheel, { passive: true });
  scrollTarget.addEventListener("scroll", handleScrollOrWheel, { passive: true });

  cleanupListeners.push(() => {
    scrollTarget.removeEventListener("wheel", handleScrollOrWheel);
    scrollTarget.removeEventListener("scroll", handleScrollOrWheel);
  });

  const scrollCursorIntoView = (pos: number) => {
    if (userScrolledUp) return;
    try {
      const coords = editor.view.coordsAtPos(pos);
      if (scrollContainer instanceof Window) {
        const bottomThreshold = window.innerHeight - 90;
        if (coords.bottom > bottomThreshold) {
          window.scrollBy({
            top: coords.bottom - bottomThreshold,
            behavior: "instant" as ScrollBehavior,
          });
        }
      } else {
        const rect = scrollContainer.getBoundingClientRect();
        const bottomThreshold = rect.bottom - 90;
        if (coords.bottom > bottomThreshold) {
          scrollContainer.scrollTop += coords.bottom - bottomThreshold;
        }
      }
    } catch {
      const cursorDom = editor.view.dom.querySelector(".tiptap-ai-typing-cursor");
      cursorDom?.scrollIntoView({ behavior: "instant" as ScrollBehavior, block: "nearest" });
    }
  };

  const applyFinalContent = () => {
    if (!editor || editor.isDestroyed) return;

    const tr = editor.state.tr;
    tr.setMeta("addToHistory", true);
    tr.replaceWith(currentFrom, currentTo, fullFragment);
    currentTo = currentFrom + fullFragment.size;

    const safeCursorPos = Math.max(currentFrom, currentTo - 1);
    const sel = Selection.near(tr.doc.resolve(safeCursorPos), -1);
    tr.setSelection(sel);

    tr.setMeta(aiIndicatorPluginKey, {
      isGenerating: false,
      isTyping: false,
      from: 0,
      to: 0,
    });

    editor.view.dispatch(tr);
    editor.commands.focus();
    scrollCursorIntoView(sel.head);
  };

  const finishImmediately = () => {
    if (!isRunning) return;
    cleanup();
    try {
      applyFinalContent();
      onComplete?.();
    } catch (err) {
      onError?.(err);
    }
  };

  const totalLength = fullText.length;
  const duration = Math.min(
    AI_TYPEWRITER_MAX_DURATION_MS,
    Math.max(AI_TYPEWRITER_MIN_DURATION_MS, Math.round(totalLength * AI_TYPEWRITER_MS_PER_CHAR))
  );

  const startTime = performance.now();
  let lastCharIndex = 0;

  const tick = () => {
    if (!isRunning || !editor || editor.isDestroyed) {
      cleanup();
      return;
    }

    const elapsed = performance.now() - startTime;
    const progress = Math.min(1, elapsed / duration);
    const charIndex = Math.min(totalLength, Math.ceil(progress * totalLength));

    if (progress >= 1 || charIndex >= totalLength) {
      finishImmediately();
      return;
    }

    if (charIndex > lastCharIndex) {
      lastCharIndex = charIndex;
      const sliceText = fullText.slice(0, charIndex);
      const partialHtml = markdownToEditorHtml(sliceText);

      try {
        const fragment = parseHtml(partialHtml);
        if (fragment.size > 0) {
          const tr = editor.state.tr;
          tr.setMeta("addToHistory", false);
          tr.replaceWith(currentFrom, currentTo, fragment);
          currentTo = currentFrom + fragment.size;

          const safeCursorPos = Math.max(currentFrom, currentTo - 1);
          const sel = Selection.near(tr.doc.resolve(safeCursorPos), -1);
          tr.setSelection(sel);

          tr.setMeta(aiIndicatorPluginKey, {
            isGenerating: false,
            isTyping: true,
            typingPos: sel.head,
            from: currentFrom,
            to: currentTo,
          });

          editor.view.dispatch(tr);
          scrollCursorIntoView(sel.head);
        }
      } catch (err) {
        console.error("Typewriter frame error, skipping to end:", err);
        finishImmediately();
        return;
      }
    }

    rafId = requestAnimationFrame(tick);
  };

  const dom = editor.view.dom;
  const handleUserAction = () => {
    finishImmediately();
  };

  dom.addEventListener("keydown", handleUserAction, { capture: true });
  dom.addEventListener("mousedown", handleUserAction, { capture: true });

  cleanupListeners.push(() => {
    dom.removeEventListener("keydown", handleUserAction, { capture: true });
    dom.removeEventListener("mousedown", handleUserAction, { capture: true });
  });

  const controller: AiTypewriterController = {
    stop,
    finishImmediately,
    isRunning: () => isRunning,
  };

  activeTypewriters.set(editor, controller);
  rafId = requestAnimationFrame(tick);

  return controller;
}
