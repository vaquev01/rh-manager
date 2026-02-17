"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface TooltipProps {
    children: React.ReactNode;
    content: React.ReactNode;
    className?: string;
}

export function Tooltip({ children, content, className }: TooltipProps) {
    const [isVisible, setIsVisible] = React.useState(false);

    return (
        <div
            className="relative inline-block"
            onMouseEnter={() => setIsVisible(true)}
            onMouseLeave={() => setIsVisible(false)}
            onFocus={() => setIsVisible(true)}
            onBlur={() => setIsVisible(false)}
        >
            {children}
            {isVisible && (
                <div className={cn(
                    "absolute z-50 px-2 py-1 text-xs font-medium text-white bg-slate-900 rounded shadow-md -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap animate-in fade-in zoom-in-95 duration-200",
                    className
                )}>
                    {content}
                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900" />
                </div>
            )}
        </div>
    )
}
