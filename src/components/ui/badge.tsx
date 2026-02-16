import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
    variant?: "default" | "secondary" | "destructive" | "outline" | "ok" | "warn" | "danger" | "info";
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
    return (
        <div
            className={cn(
                "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                variant === "default" &&
                "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
                variant === "secondary" &&
                "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
                variant === "destructive" &&
                "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
                variant === "outline" && "text-foreground",
                variant === "ok" && "border-transparent bg-emerald-100 text-emerald-700 hover:bg-emerald-200/80 dark:bg-emerald-900 dark:text-emerald-300",
                variant === "warn" && "border-transparent bg-amber-100 text-amber-700 hover:bg-amber-200/80 dark:bg-amber-900 dark:text-amber-300",
                variant === "danger" && "border-transparent bg-red-100 text-red-700 hover:bg-red-200/80 dark:bg-red-900 dark:text-red-300",
                variant === "info" && "border-transparent bg-blue-100 text-blue-700 hover:bg-blue-200/80 dark:bg-blue-900 dark:text-blue-300",
                className
            )}
            {...props}
        />
    );
}

export { Badge };
