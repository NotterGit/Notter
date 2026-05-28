"use client"

import { useEffect, useState } from "react"
import { Check, Copy, Sparkles } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"

type IframeModalProps = {
  iframeUrl: string
}

export function IframeModal({ iframeUrl }: IframeModalProps) {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  const iframeCode = `<iframe 
  src="${iframeUrl}" 
  width="100%" 
  height="800" 
  loading="lazy"
></iframe>`

  useEffect(() => {
    if (!open) {
      setCopied(false)
    }
  }, [open])

  const onCopy = () => {
    navigator.clipboard.writeText(iframeCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 1000)
  }

  return (
    <>
      <Button
        className="mt-2 h-9 w-full rounded-xl text-xs w-full max-w-[1380px] "
        size="sm"
        variant="outline"
        onClick={() => setOpen(true)}
      >
        Вставить на сайт
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="w-[92vw] max-w-2xl rounded-2xl border-white/60 bg-white/95 shadow-2xl backdrop-blur-xl dark:border-white/10 dark:bg-zinc-950/95">
          <DialogHeader className="space-y-2">
            <DialogTitle>Код для вставки</DialogTitle>
            <DialogDescription>
              Скопируйте этот iframe-код и вставьте его на свой сайт.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="overflow-hidden rounded-2xl border border-black/10 bg-white shadow-[0_24px_80px_-32px_rgba(15,23,42,0.2)] dark:border-white/10 dark:bg-zinc-950 dark:shadow-[0_24px_80px_-32px_rgba(15,23,42,0.85)]">
              <div className="flex items-center justify-between gap-3 border-b border-black/10 bg-black/[0.02] px-4 py-3 dark:border-white/10 dark:bg-white/[0.03]">
                <div className="flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-300">
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-sky-500/10 text-sky-700 dark:bg-sky-500/15 dark:text-sky-200">
                    <Sparkles className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="font-medium text-zinc-900 dark:text-white">HTML iframe</p>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400">Готовый код для вставки</p>
                  </div>
                </div>

                <Button
                  onClick={onCopy}
                  size="sm"
                  className="rounded-xl border border-black/10 bg-white text-xs text-zinc-700 shadow-none hover:bg-zinc-100 dark:border-white/10 dark:bg-white/10 dark:text-white dark:hover:bg-white/15"
                >
                  {copied ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
                  {copied ? "Скопировано" : "Копировать код"}
                </Button>
              </div>

              <div className="overflow-x-auto bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.12),_transparent_38%),linear-gradient(180deg,rgba(255,255,255,0.98),rgba(244,244,245,1))] px-4 py-4 dark:bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.12),_transparent_38%),linear-gradient(180deg,rgba(24,24,27,0.96),rgba(9,9,11,1))]">
                <pre className="font-mono text-xs tracking-[0.01em]">
                  <code className="table min-w-full">
                    <span className="flex">
                      <p className="text-primary/40 mr-4 select-none">1</p>
                      <span className="text-zinc-700 dark:text-zinc-100">{"<"}</span>
                      <span className="text-rose-600 dark:text-rose-400">iframe</span>
                    </span>
                    <span className="flex">
                      <p className="text-primary/40 mr-4 select-none">2</p>
                      <span className="ml-4 flex text-orange-600 dark:text-orange-300">src</span>
                      <span className="text-zinc-700 dark:text-zinc-100">=</span>
                      <span className="text-emerald-600 dark:text-green-300">{"'"}{iframeUrl}{"'"}</span>
                    </span>
                    <span className="flex">
                      <p className="text-primary/40 mr-4 select-none">3</p>
                      <span className="ml-4 flex text-orange-600 dark:text-orange-300">width</span>
                      <span className="text-zinc-700 dark:text-zinc-100">=</span>
                      <span className="text-emerald-600 dark:text-green-300">{"'"}100%{"'"}</span>
                    </span>
                    <span className="flex">
                      <p className="text-primary/40 mr-4 select-none">4</p>
                      <span className="ml-4 flex text-orange-600 dark:text-orange-300">height</span>
                      <span className="text-zinc-700 dark:text-zinc-100">=</span>
                      <span className="text-emerald-600 dark:text-green-300">{"'"}800{"'"}</span>
                    </span>
                    <span className="flex">
                      <p className="text-primary/40 mr-4 select-none">5</p>
                      <span className="ml-4 flex text-orange-600 dark:text-orange-300">loading</span>
                      <span className="text-zinc-700 dark:text-zinc-100">=</span>
                      <span className="text-emerald-600 dark:text-green-300">{"'"}lazy{"'"}</span>
                    </span>
                    <span className="flex">
                      <p className="text-primary/40 mr-4 select-none">6</p>
                      <span className="text-zinc-700 dark:text-zinc-100">{"></"}</span>
                      <span className="text-rose-600 dark:text-rose-400">iframe</span>
                      <span className="text-zinc-700 dark:text-zinc-100">{">"}</span>
                    </span>
                  </code>
                </pre>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
