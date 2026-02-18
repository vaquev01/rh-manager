"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

// Simple Popover implementation using native details/summary or state
// for simplicity in this "pure tailwind" approach without strict Radix dependency
// We'll use a custom state-based implementation for better control than details/summary

interface PopoverContextValue {
    isOpen: boolean;
    setIsOpen: (v: boolean) => void;
    triggerRef: React.RefObject<HTMLButtonElement>;
}

const PopoverContext = React.createContext<PopoverContextValue | null>(null);

export function Popover({ children }: { children: React.ReactNode }) {
    const [isOpen, setIsOpen] = React.useState(false);
    const triggerRef = React.useRef<HTMLButtonElement>(null);
    const popoverRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (
                popoverRef.current &&
                !popoverRef.current.contains(event.target as Node) &&
                triggerRef.current &&
                !triggerRef.current.contains(event.target as Node)
            ) {
                setIsOpen(false);
            }
        }
        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isOpen]);

    return (
        <PopoverContext.Provider value={{ isOpen, setIsOpen, triggerRef }}>
            <div className="relative inline-block" ref={popoverRef}>
                {children}
            </div>
        </PopoverContext.Provider>
    );
}

export function PopoverTrigger({ asChild, children }: { asChild?: boolean; children: React.ReactNode }) {
    const context = React.useContext(PopoverContext);
    if (!context) throw new Error("PopoverTrigger must be used within Popover");

    const child = React.Children.only(children) as React.ReactElement;

    return React.cloneElement(child, {
        ref: context.triggerRef,
        onClick: (e: React.MouseEvent) => {
            e.stopPropagation();
            context.setIsOpen(!context.isOpen);
            child.props.onClick?.(e);
        },
        "aria-expanded": context.isOpen,
    });
}

export function PopoverContent({
    children,
    className,
    align = "center"
}: {
    children: React.ReactNode;
    className?: string;
    align?: "start" | "center" | "end";
}) {
    const context = React.useContext(PopoverContext);
    if (!context) throw new Error("PopoverContent must be used within Popover");

    if (!context.isOpen) return null;

    return (
        <div
            className={cn(
                "absolute z-50 mt-2 w-72 rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 bg-white",
                align === "start" && "left-0",
                align === "center" && "left-1/2 -translate-x-1/2",
                align === "end" && "right-0",
                className
            )}
            onClick={(e) => e.stopPropagation()}
        >
            {children}
        </div>
    );
}
