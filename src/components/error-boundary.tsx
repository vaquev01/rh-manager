"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle, RefreshCcw } from "lucide-react";

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("[B People Error]", error, errorInfo);
        // Future: send to Sentry/error tracking
    }

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) return this.props.fallback;

            return (
                <div className="flex flex-col items-center justify-center min-h-[300px] p-8 text-center">
                    <div className="h-12 w-12 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center mb-4">
                        <AlertTriangle className="h-6 w-6 text-red-500" />
                    </div>
                    <h3 className="text-sm font-bold text-foreground mb-1">Algo deu errado</h3>
                    <p className="text-xs text-muted-foreground mb-4 max-w-sm">
                        {this.state.error?.message || "Ocorreu um erro inesperado."}
                    </p>
                    <button
                        onClick={() => {
                            this.setState({ hasError: false, error: undefined });
                        }}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
                    >
                        <RefreshCcw className="h-3.5 w-3.5" />
                        Tentar novamente
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}
