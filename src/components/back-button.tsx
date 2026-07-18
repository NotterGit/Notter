"use client";

import { ChevronLeft } from "lucide-react";
import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";
import { Button } from "./ui/button";
import { useRouter } from "next/navigation";

type BackButtonProps = ComponentProps<typeof Button>;

export default function BackButton({ className, ...props }: BackButtonProps) {
    const router = useRouter()

    return (
        <Button 
            {...props}
            className={cn("z-10 h-10 w-10 shrink-0 p-0", className)}
            variant={"outline"}
            onClick={() => {router.back()}}
            aria-label="Назад"
        >
            <ChevronLeft className="h-4 w-4"/>
        </Button>
    )
}
