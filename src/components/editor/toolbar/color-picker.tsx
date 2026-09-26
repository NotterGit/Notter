"use client"

import React, { useEffect, useState } from "react"
import { Check, RotateCcw } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import toast from "react-hot-toast"

export const TEXT_COLORS = [
  { name: "По умолчанию", value: "inherit", bg: "#64748b" },
  { name: "Черный", value: "#000000", bg: "#000000" },
  { name: "Темно-серый", value: "#334155", bg: "#334155" },
  { name: "Серый", value: "#64748b", bg: "#64748b" },
  { name: "Красный", value: "#ef4444", bg: "#ef4444" },
  { name: "Оранжевый", value: "#f97316", bg: "#f97316" },
  { name: "Янтарный", value: "#d97706", bg: "#d97706" },
  { name: "Зеленый", value: "#16a34a", bg: "#16a34a" },
  { name: "Бирюзовый", value: "#0891b2", bg: "#0891b2" },
  { name: "Синий", value: "#2563eb", bg: "#2563eb" },
  { name: "Индиго", value: "#4f46e5", bg: "#4f46e5" },
  { name: "Фиолетовый", value: "#9333ea", bg: "#9333ea" },
  { name: "Розовый", value: "#db2777", bg: "#db2777" },
]

export const HIGHLIGHT_COLORS = [
  { name: "Без выделения", value: "transparent", bg: "transparent" },
  { name: "Желтый", value: "#fef08a", bg: "#fef08a" },
  { name: "Зеленый", value: "#bbf7d0", bg: "#bbf7d0" },
  { name: "Голубой", value: "#bfdbfe", bg: "#bfdbfe" },
  { name: "Фиолетовый", value: "#e9d5ff", bg: "#e9d5ff" },
  { name: "Розовый", value: "#fbcfe8", bg: "#fbcfe8" },
  { name: "Оранжевый", value: "#fed7aa", bg: "#fed7aa" },
  { name: "Красный", value: "#fecaca", bg: "#fecaca" },
  { name: "Бирюзовый", value: "#99f6e4", bg: "#99f6e4" },
  { name: "Серый", value: "#e2e8f0", bg: "#e2e8f0" },
  { name: "Лаймовый", value: "#d9f99d", bg: "#d9f99d" },
  { name: "Персиковый", value: "#ffedd5", bg: "#ffedd5" },
]

export function ColorPickerMenu({
  title,
  currentColor,
  presetColors,
  onSelect,
  onClear,
  children,
  isOpen,
  setIsOpen,
}: {
  title: string
  currentColor?: string
  presetColors: { name: string; value: string; bg?: string }[]
  onSelect: (color: string) => void
  onClear: () => void
  children: React.ReactNode
  isOpen: boolean
  setIsOpen: (open: boolean) => void
}) {
  const [hexValue, setHexValue] = useState(currentColor || "")

  useEffect(() => {
    if (isOpen) {
      setHexValue(currentColor || "")
    }
  }, [isOpen, currentColor])

  const isValidHex = (val: string) =>
    /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(val)

  const handleApply = (colorToApply: string) => {
    onSelect(colorToApply)
    setIsOpen(false)
  }

  const handleCustomSubmit = () => {
    let val = hexValue.trim()
    if (!val) return
    if (!val.startsWith("#") && /^[0-9a-f]{3,6}$/i.test(val)) {
      val = `#${val}`
    }
    if (isValidHex(val) || /^rgb/i.test(val)) {
      handleApply(val)
    } else {
      toast.error("Неверный формат цвета. Введите HEX (например, #2563EB)")
    }
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent
        align="start"
        sideOffset={6}
        className="w-64 p-3 shadow-xl rounded-xl border bg-popover"
      >
        <div className="flex items-center justify-between pb-2 mb-2 border-b">
          <span className="text-xs font-semibold text-foreground">{title}</span>
          <button
            type="button"
            onClick={() => {
              onClear()
              setIsOpen(false)
            }}
            className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-destructive transition-colors cursor-pointer"
          >
            <RotateCcw size={11} />
            <span>Сбросить</span>
          </button>
        </div>

        <div className="grid grid-cols-6 gap-1.5 mb-3">
          {presetColors.map((preset) => {
            const isNone =
              preset.value === "inherit" || preset.value === "transparent"
            const isSelected =
              currentColor?.toLowerCase() === preset.value.toLowerCase()

            return (
              <button
                key={preset.value}
                type="button"
                title={preset.name}
                onClick={() => handleApply(preset.value)}
                className={cn(
                  "relative flex h-6 w-6 items-center justify-center rounded-md border text-xs transition-all hover:scale-110 cursor-pointer shadow-2xs",
                  isSelected
                    ? "ring-2 ring-primary ring-offset-1"
                    : "border-border/60 hover:border-foreground/40",
                  isNone && "bg-background"
                )}
                style={{
                  backgroundColor: !isNone
                    ? preset.bg || preset.value
                    : undefined,
                }}
              >
                {isNone ? (
                  <span className="text-[10px] text-muted-foreground font-mono">
                    ∅
                  </span>
                ) : isSelected ? (
                  <Check
                    size={12}
                    className={
                      preset.value === "#000000" ||
                      preset.value === "#334155" ||
                      preset.value === "#4f46e5" ||
                      preset.value === "#9333ea"
                        ? "text-white"
                        : "text-foreground"
                    }
                  />
                ) : null}
              </button>
            )
          })}
        </div>

        <div className="space-y-1.5 pt-1 border-t">
          <label className="text-[11px] font-medium text-muted-foreground block">
            Свой цвет (HEX)
          </label>
          <div className="flex items-center gap-1.5">
            <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-md border shadow-2xs">
              <input
                type="color"
                value={isValidHex(hexValue) ? hexValue : "#2563eb"}
                onChange={(e) => setHexValue(e.target.value)}
                className="absolute -top-2 -left-2 h-12 w-12 cursor-pointer border-0 p-0"
                title="Палитра"
              />
            </div>
            <Input
              value={hexValue}
              onChange={(e) => setHexValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault()
                  handleCustomSubmit()
                }
              }}
              placeholder="#2563EB"
              className="h-8 text-xs font-mono"
            />
            <Button
              type="button"
              size="sm"
              onClick={handleCustomSubmit}
              className="h-8 px-2.5 text-xs cursor-pointer"
            >
              OK
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
