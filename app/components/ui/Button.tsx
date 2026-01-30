"use client";

import { ButtonHTMLAttributes, forwardRef } from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: "primary" | "secondary" | "danger" | "ghost" | "outline";
    size?: "sm" | "md" | "lg";
    isLoading?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = "primary", size = "md", isLoading, disabled, children, ...props }, ref) => {
        return (
            <button
                ref={ref}
                disabled={disabled || isLoading}
                className={cn(
                    "inline-flex items-center justify-center rounded-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 disabled:opacity-50 disabled:pointer-events-none active:scale-95",

                    // Sizes
                    size === "sm" && "h-8 px-3 text-xs",
                    size === "md" && "h-10 px-4 py-2 text-sm",
                    size === "lg" && "h-12 px-6 text-base",

                    // Variants
                    variant === "primary" && "bg-emerald-600 text-white hover:bg-emerald-500 shadow-lg shadow-emerald-500/20 border border-transparent",
                    variant === "secondary" && "bg-white/10 text-white hover:bg-white/20 border border-white/5",
                    variant === "outline" && "bg-transparent border border-white/20 text-gray-300 hover:text-white hover:border-white/50",
                    variant === "danger" && "bg-rose-500/10 text-rose-500 border border-rose-500/20 hover:bg-rose-500/20",
                    variant === "ghost" && "bg-transparent text-gray-400 hover:text-white hover:bg-white/5",

                    className
                )}
                {...props}
            >
                {isLoading && (
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                )}
                {children}
            </button>
        );
    }
);
Button.displayName = "Button";

export { Button, cn };
