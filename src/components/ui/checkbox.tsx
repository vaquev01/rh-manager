"use client"

import * as React from "react"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

const Checkbox = React.forwardRef<
    HTMLButtonElement,
    React.ComponentPropsWithoutRef<"button"> & { checked?: boolean; onCheckedChange?: (checked: boolean) => void }
>(({ className, checked, onCheckedChange, onClick, ...props }, ref) => (
    <button
        type="button"
        role="checkbox"
        aria-checked={checked}
        ref={ref}
        onClick={(e) => {
            onClick?.(e);
            onCheckedChange?.(!checked);
        }}
        className={cn(
            "peer h-4 w-4 shrink-0 rounded-sm border border-primary ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all",
            checked ? "bg-primary text-primary-foreground" : "bg-white border-slate-300",
            className
        )}
        {...props}
    >
        <span className={cn("flex items-center justify-center text-current", checked ? "opacity-100" : "opacity-0")}>
            <Check className="h-3 w-3 text-white" strokeWidth={3} />
        </span>
    </button>
))
Checkbox.displayName = "Checkbox"

export { Checkbox }
