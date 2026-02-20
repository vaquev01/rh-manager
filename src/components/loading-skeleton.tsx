"use client";

import { cn } from "@/lib/utils";

function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
    return (
        <div
            className={cn(
                "animate-pulse rounded-lg bg-muted/80",
                className
            )}
            {...props}
        />
    );
}

export function PageSkeleton() {
    return (
        <div className="page-enter space-y-4 p-5 md:p-8 animate-in fade-in duration-300">
            {/* Header skeleton */}
            <div className="panel p-4">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                        <Skeleton className="h-8 w-8 rounded-lg" />
                        <div>
                            <Skeleton className="h-3 w-32 mb-1.5" />
                            <Skeleton className="h-5 w-48" />
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Skeleton className="h-7 w-20 rounded-full" />
                        <Skeleton className="h-7 w-24 rounded-full" />
                    </div>
                </div>
                {/* Nav skeleton */}
                <div className="flex gap-2 pt-3 border-t border-border/50">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <Skeleton key={i} className="h-8 w-28 rounded-full" />
                    ))}
                </div>
            </div>

            {/* Content skeleton */}
            <div className="flex gap-4">
                {/* Left sidebar */}
                <div className="w-[180px] shrink-0 space-y-2">
                    <Skeleton className="h-10 w-full rounded-lg" />
                    <Skeleton className="h-6 w-full" />
                    {Array.from({ length: 5 }).map((_, i) => (
                        <Skeleton key={i} className="h-14 w-full rounded-lg" />
                    ))}
                </div>
                {/* Main area */}
                <div className="flex-1 space-y-3">
                    <Skeleton className="h-10 w-full rounded-lg" />
                    <div className="grid grid-cols-7 gap-2">
                        {Array.from({ length: 21 }).map((_, i) => (
                            <Skeleton key={i} className="h-16 rounded-lg" />
                        ))}
                    </div>
                </div>
                {/* Right sidebar */}
                <div className="w-[220px] shrink-0 space-y-3">
                    <Skeleton className="h-8 w-full rounded-lg" />
                    <Skeleton className="h-32 w-full rounded-lg" />
                    <Skeleton className="h-24 w-full rounded-lg" />
                    <Skeleton className="h-48 w-full rounded-lg" />
                </div>
            </div>
        </div>
    );
}

export { Skeleton };
