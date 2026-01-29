"use client";

import { InputHTMLAttributes, forwardRef } from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ className, label, error, ...props }, ref) => {
        return (
            <div className="w-full space-y-1.5">
                {label && <label className="text-xs font-medium text-gray-400 ml-1">{label}</label>}
                <input
                    ref={ref}
                    className={cn(
                        "flex h-10 w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 disabled:cursor-not-allowed disabled:opacity-50 transition-all",
                        error && "border-rose-500 focus:ring-rose-500/50 focus:border-rose-500",
                        className
                    )}
                    {...props}
                />
                {error && <p className="text-xs text-rose-500 ml-1">{error}</p>}
            </div>
        );
    }
);
Input.displayName = "Input";

export { Input };
