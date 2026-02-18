"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { ChevronDown, Check } from "lucide-react";

// Mimicking Radix UI Select API with pure React/Tailwind
// This allows us to use <Select><SelectTrigger>...</SelectTrigger><SelectContent>...</SelectContent></Select>

interface SelectContextValue {
    value: string | undefined;
    onValueChange: (value: string) => void;
    open: boolean;
    setOpen: (open: boolean) => void;
}

const SelectContext = React.createContext<SelectContextValue | null>(null);

export function Select({
    value,
    onValueChange,
    children,
    ...props
}: {
    value?: string;
    onValueChange?: (value: string) => void;
    children: React.ReactNode;
} & React.HTMLAttributes<HTMLDivElement>) {
    const [open, setOpen] = React.useState(false);

    // If uncontrolled
    const [internalValue, setInternalValue] = React.useState(value);
    const actualValue = value !== undefined ? value : internalValue;

    const handleValueChange = (v: string) => {
        setInternalValue(v);
        onValueChange?.(v);
        setOpen(false);
    };

    return (
        <SelectContext.Provider value={{ value: actualValue, onValueChange: handleValueChange, open, setOpen }}>
            <div className="relative inline-block w-full text-left" {...props}>
                {children}
            </div>
        </SelectContext.Provider>
    );
}

export const SelectTrigger = React.forwardRef<
    HTMLButtonElement,
    React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, children, ...props }, ref) => {
    const context = React.useContext(SelectContext);
    if (!context) throw new Error("SelectTrigger must be used within Select");

    return (
        <button
            ref={ref}
            type="button"
            onClick={() => context.setOpen(!context.open)}
            className={cn(
                "flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
                className
            )}
            {...props}
        >
            {children}
            <ChevronDown className="h-4 w-4 opacity-50" />
        </button>
    );
});
SelectTrigger.displayName = "SelectTrigger";

export const SelectContent = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement> & { position?: "popper" | "item-aligned" }
>(({ className, children, position = "popper", ...props }, ref) => {
    const context = React.useContext(SelectContext);
    if (!context) throw new Error("SelectContent must be used within Select");

    if (!context.open) return null;

    return (
        <div
            ref={ref}
            className={cn(
                "absolute z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 top-[calc(100%+4px)] w-full bg-white",
                className
            )}
            {...props}
        >
            <div className="max-h-[var(--radix-select-content-available-height)] w-full overflow-y-auto p-1">
                {children}
            </div>
        </div>
    );
});
SelectContent.displayName = "SelectContent";

export const SelectItem = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement> & { value: string }
>(({ className, children, value, ...props }, ref) => {
    const context = React.useContext(SelectContext);
    if (!context) throw new Error("SelectItem must be used within Select");

    const isSelected = context.value === value;

    return (
        <div
            ref={ref}
            className={cn(
                "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-2 pr-8 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 hover:bg-slate-100 cursor-pointer",
                isSelected && "bg-slate-50 font-medium",
                className
            )}
            onClick={(e) => {
                e.stopPropagation();
                context.onValueChange(value);
            }}
            {...props}
        >
            <span className="absolute right-2 flex h-3.5 w-3.5 items-center justify-center">
                {isSelected && <Check className="h-4 w-4" />}
            </span>
            <span className="truncate">{children}</span>
        </div>
    );
});
SelectItem.displayName = "SelectItem";

export const SelectValue = React.forwardRef<
    HTMLSpanElement,
    React.HTMLAttributes<HTMLSpanElement> & { placeholder?: string }
>(({ className, placeholder, ...props }, ref) => {
    const context = React.useContext(SelectContext);
    if (!context) throw new Error("SelectValue must be used within Select");

    // We need to find the child that matches the value to render its content
    // In a real Select, this is more complex, but here we can try to infer or just show the value if simple
    // For now, let's just show the value or placeholder. Ideally we'd look up the label.

    // HACK: Since we don't have access to the children of SelectContent here to lookup labels,
    // we will rely on the fact that for this specific app usage, we might need a better way to display the label.
    // BUT, usually SelectValue is used where the parent Select knows the value.
    // Let's iterate through the children of the Select to find the label if possible? No.

    // Simplest approach: The user of this component should probably pass the display value if they can, 
    // OR we just display the selected value string if no better option.
    // However, often SelectValue just displays context.value.

    // Limitation: We can't easily look up "Label" from "Value" without the options list.
    // Use `children` if provided, otherwise render context.value

    return (
        <span
            ref={ref}
            className={cn("block truncate", className)}
            {...props}
        >
            {/* We can't accidentally render the ID. We rely on the fact that for our usage in the scheduler, 
         we might need to pass the label explicitly or fix this component to accept options prop. 
         
         Actually, Radix SelectValue is smart. We are not.
         Let's just render the placeholder if no value, or the value if it exists. 
         The user might see the ID if we are not careful.
      */}
            {context.value || placeholder}
        </span>
    );
});
SelectValue.displayName = "SelectValue";
