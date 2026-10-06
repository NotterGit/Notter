import React from "react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./tooltip"

export interface HintProps {
  children: React.ReactNode;
  description?: React.ReactNode;
  side?: "left" | "right" | "top" | "bottom";
  sideOffset?: number;
}

function formatTierDescription(desc: React.ReactNode): React.ReactNode {
  if (typeof desc !== "string") return desc;

  const parts = desc.split(/(Diamond|Amber)/g);
  if (parts.length === 1) return desc;

  return parts.map((part, index) => {
    if (part === "Diamond") {
      return (
        <span key={index} className="font-semibold text-cyan-500 dark:text-cyan-400">
          {part}
        </span>
      );
    }
    if (part === "Amber") {
      return (
        <span key={index} className="font-semibold text-amber-500 dark:text-yellow-400">
          {part}
        </span>
      );
    }
    return part;
  });
}

export function Hint({
    children, description, side = "bottom", sideOffset = 0
}: HintProps) {
    return (
        <TooltipProvider delayDuration={0}>
            <Tooltip>
                <TooltipTrigger asChild>
                    {children}
                </TooltipTrigger>
                <TooltipContent
                    sideOffset={sideOffset}
                    side={side}
                    className="text-xs max-w-[220px] break-words"
                >
                    {formatTierDescription(description)}
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    )
}

