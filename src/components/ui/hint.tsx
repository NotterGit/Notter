import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./tooltip"

export interface HintProps {
  children: React.ReactNode;
  description?: string;
  side?: "left" | "right" | "top" | "bottom";
  sideOffset?: number;
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
                    {description}
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    )
}
