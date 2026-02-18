"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Dialog, DialogFooter } from "@/components/ui/dialog";

interface AlertDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    description?: string;
    onConfirm: () => void;
    confirmUnsafe?: boolean;
}

export function AlertDialog({
    open,
    onOpenChange,
    title,
    description,
    onConfirm,
    confirmUnsafe
}: AlertDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange} title={title}>
            <div className="space-y-4">
                {description && (
                    <p className="text-sm text-muted-foreground">
                        {description}
                    </p>
                )}
                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                    >
                        Cancelar
                    </Button>
                    <Button
                        variant={confirmUnsafe ? "danger" : "primary"}
                        onClick={() => {
                            onConfirm();
                            onOpenChange(false);
                        }}
                    >
                        Confirmar
                    </Button>
                </DialogFooter>
            </div>
        </Dialog>
    );
}
