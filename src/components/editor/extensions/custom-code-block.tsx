"use client"

import React, { useMemo, useState } from "react"
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight"
import {
  NodeViewContent,
  NodeViewWrapper,
  ReactNodeViewRenderer,
  type NodeViewProps,
} from "@tiptap/react"
import { common, createLowlight } from "lowlight"
import { Check, Copy, ChevronDown, Search } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { CODE_LANGUAGES, LANGUAGE_LABELS } from "@/config/const/editor.const"

const lowlight = createLowlight(common)

function CodeBlockComponent({ node, updateAttributes, editor }: NodeViewProps) {
  const isEditable = editor?.isEditable ?? true
  const [copied, setCopied] = useState(false)
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")

  const currentLang = (node.attrs.language || "").trim().toLowerCase()

  const displayLanguage = useMemo(() => {
    if (!currentLang) return "Код"
    return LANGUAGE_LABELS[currentLang] || currentLang.toUpperCase()
  }, [currentLang])

  const filteredLanguages = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return CODE_LANGUAGES
    return CODE_LANGUAGES.filter(
      (lang) =>
        lang.label.toLowerCase().includes(q) ||
        lang.value.toLowerCase().includes(q)
    )
  }, [search])

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation()
    const text = node.textContent || ""
    if (!text) return

    try {
      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text)
      } else if (typeof document !== "undefined") {
        const textarea = document.createElement("textarea")
        textarea.value = text
        textarea.style.position = "fixed"
        textarea.style.opacity = "0"
        document.body.appendChild(textarea)
        textarea.select()
        document.execCommand("copy")
        document.body.removeChild(textarea)
      }
      setCopied(true)
      setTimeout(() => {
        setCopied(false)
      }, 2000)
    } catch (err) {
      console.error("Failed to copy code block:", err)
    }
  }

  return (
    <NodeViewWrapper className="relative my-3.5 overflow-hidden rounded-xl border border-white/10 bg-[#141619] shadow-md transition-colors font-mono">
      <div className="flex items-center justify-between border-b border-white/10 bg-[#191c20]/90 px-3 py-1.5 backdrop-blur-sm select-none">
        {isEditable ? (
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <button
                type="button"
                className="flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-mono font-medium tracking-wider text-white/60 hover:text-white hover:bg-white/10 transition-colors cursor-pointer select-none"
                title="Сменить язык кода"
              >
                <span>{displayLanguage}</span>
                <ChevronDown
                  size={12}
                  className={cn(
                    "opacity-60 transition-transform duration-200",
                    open && "rotate-180"
                  )}
                />
              </button>
            </PopoverTrigger>
            <PopoverContent
              align="start"
              sideOffset={6}
              className="z-[99999] w-52 p-1.5 rounded-xl border border-white/10 bg-[#191c20] text-white shadow-2xl backdrop-blur-xl"
            >
              <div className="relative mb-1.5 px-1 pt-0.5">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/40 pointer-events-none" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Поиск языка..."
                  className="w-full pl-7 pr-2.5 py-1 text-xs font-mono bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-white/40 focus:outline-none focus:border-[#76a4ff]/50 focus:bg-white/10 transition-all"
                  autoFocus
                />
              </div>
              <div className="max-h-56 overflow-y-auto overflow-x-hidden scrollbar-minimal py-0.5 space-y-0.5">
                {filteredLanguages.length === 0 ? (
                  <div className="px-2 py-3 text-center text-xs text-white/40 font-mono">
                    Не найдено
                  </div>
                ) : (
                  filteredLanguages.map((lang) => {
                    const isSelected = currentLang === lang.value.toLowerCase()
                    return (
                      <button
                        key={lang.value}
                        type="button"
                        onClick={() => {
                          updateAttributes({ language: lang.value })
                          setOpen(false)
                          setSearch("")
                        }}
                        className={cn(
                          "flex items-center justify-between w-full px-2.5 py-1.5 rounded-lg text-xs font-mono transition-colors text-left cursor-pointer",
                          isSelected
                            ? "bg-[#76a4ff]/20 text-[#9fc3ff] font-medium"
                            : "text-white/70 hover:bg-white/5 hover:text-white"
                        )}
                      >
                        <span>{lang.label}</span>
                        {isSelected && <Check size={13} className="text-[#76a4ff] shrink-0" />}
                      </button>
                    )
                  })
                )}
              </div>
            </PopoverContent>
          </Popover>
        ) : (
          <span className="font-mono text-[11px] font-medium tracking-wider text-white/60">
            {displayLanguage}
          </span>
        )}

        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-white/60 transition-colors hover:bg-white/10 hover:text-white cursor-pointer select-none"
          title={copied ? "Скопировано!" : "Скопировать код"}
          aria-label={copied ? "Скопировано!" : "Скопировать код"}
        >
          {copied ? (
            <>
              <Check size={14} className="text-[#76a4ff]" />
              <span className="text-[#76a4ff] font-medium">Скопировано!</span>
            </>
          ) : (
            <>
              <Copy size={13} />
              <span className="hidden sm:inline">Копировать</span>
            </>
          )}
        </button>
      </div>

      <pre className="overflow-x-auto p-4 text-[13px] sm:text-sm font-mono leading-relaxed text-zinc-100 scrollbar-minimal">
        <NodeViewContent as="code" className={currentLang ? `hljs language-${currentLang}` : "hljs"} />
      </pre>
    </NodeViewWrapper>
  )
}

export const CustomCodeBlock = CodeBlockLowlight.extend({
  addNodeView() {
    return ReactNodeViewRenderer(CodeBlockComponent, {
      stopEvent: ({ event }) => {
        const target = event.target as HTMLElement
        if (
          target &&
          (target.tagName === "BUTTON" ||
            target.tagName === "INPUT" ||
            target.closest("button") ||
            target.closest("input") ||
            target.closest("[data-radix-popper-content-wrapper]") ||
            target.closest("[role='dialog']"))
        ) {
          return true
        }
        return false
      },
    })
  },
}).configure({
  lowlight,
  defaultLanguage: "plaintext",
})
