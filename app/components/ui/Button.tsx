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
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = "primary", size = "md", ...props }, ref) => {
        return (
            <button
                ref={ref}
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
            />
        );
    }
);
Button.displayName = "Button";

export { Button, cn };
