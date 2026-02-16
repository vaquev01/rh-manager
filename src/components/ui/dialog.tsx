"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./button";

interface DialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    children: React.ReactNode;
    className?: string;
    title?: string;
    description?: string;
}

export function Dialog({
    open,
    onOpenChange,
    children,
    className,
    title,
    description,
}: DialogProps) {
    const [mounted, setMounted] = React.useState(false);

    React.useEffect(() => {
        setMounted(true);
    }, []);

    React.useEffect(() => {
        if (open) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "";
        }
        return () => {
            document.body.style.overflow = "";
        };
    }, [open]);

    // Close on Escape
    React.useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape" && open) {
                onOpenChange(false);
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [open, onOpenChange]);

    if (!mounted) return null;
    if (!open) return null;

    return createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Overlay */}
            <div
                className="fixed inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in transition-opacity"
                onClick={() => onOpenChange(false)}
                aria-hidden="true"
            />

            {/* Content */}
            <div
                className={cn(
                    "relative z-50 w-full max-w-lg rounded-xl border bg-background p-6 shadow-lg animate-in fade-in zoom-in-95 duration-200 sm:rounded-2xl",
                    className
                )}
                role="dialog"
                aria-modal="true"
            >
                <div className="absolute right-4 top-4">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-full"
                        onClick={() => onOpenChange(false)}
                        aria-label="Close"
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </div>

                {(title || description) && (
                    <div className="mb-4 space-y-1.5 text-center sm:text-left">
                        {title && (
                            <h2 className="text-lg font-semibold leading-none tracking-tight">
                                {title}
                            </h2>
                        )}
                        {description && (
                            <p className="text-sm text-muted-foreground">{description}</p>
                        )}
                    </div>
                )}

                {children}
            </div>
        </div>,
        document.body
    );
}

export function DialogFooter({
    className,
    children,
}: {
    className?: string;
    children: React.ReactNode;
}) {
    return (
        <div
            className={cn(
                "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 mt-6",
                className
            )}
        >
            {children}
        </div>
    );
}
