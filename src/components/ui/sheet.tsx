"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./button";

interface SheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    children: React.ReactNode;
    className?: string;
    title?: string;
    description?: string;
    side?: "right" | "left";
}

export function Sheet({
    open,
    onOpenChange,
    children,
    className,
    title,
    description,
    side = "right",
}: SheetProps) {
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
        <div className="fixed inset-0 z-50 flex overflow-hidden">
            {/* Overlay */}
            <div
                className="fixed inset-0 bg-black/25 backdrop-blur-sm animate-in fade-in transition-opacity"
                onClick={() => onOpenChange(false)}
                aria-hidden="true"
            />

            {/* Content Wrapper Position */}
            <div
                className={cn(
                    "fixed inset-y-0 flex max-w-full pointer-events-none",
                    side === "right" ? "right-0 pl-10" : "left-0 pr-10"
                )}
            >
                <div
                    className={cn(
                        "pointer-events-auto w-screen max-w-md transform transition ease-in-out duration-300 sm:duration-300 bg-background shadow-xl flex flex-col h-full border-l animate-in slide-in-from-right",
                        side === "left" && "border-r border-l-0 animate-in slide-in-from-left",
                        className
                    )}
                    role="dialog"
                    aria-modal="true"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-4 border-b">
                        <div className="space-y-1">
                            {title && (
                                <h2 className="text-lg font-semibold text-foreground">
                                    {title}
                                </h2>
                            )}
                            {description && (
                                <p className="text-sm text-muted-foreground">{description}</p>
                            )}
                        </div>
                        <div className="flex items-center ml-3 h-7">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 rounded-full"
                                onClick={() => onOpenChange(false)}
                                aria-label="Close panel"
                            >
                                <X className="h-5 w-5" />
                            </Button>
                        </div>
                    </div>

                    {/* Body */}
                    <div className="relative flex-1 px-6 py-6 overflow-y-auto">
                        {children}
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
}
