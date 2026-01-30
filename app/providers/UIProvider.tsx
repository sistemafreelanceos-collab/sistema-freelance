"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface UIContextType {
    commandOpen: boolean;
    setCommandOpen: (open: boolean) => void;
    openCommand: () => void;
    closeCommand: () => void;
    toggleCommand: () => void;
}

const UIContext = createContext<UIContextType | undefined>(undefined);

export function UIProvider({ children }: { children: ReactNode }) {
    const [commandOpen, setCommandOpen] = useState(false);

    const openCommand = () => setCommandOpen(true);
    const closeCommand = () => setCommandOpen(false);
    const toggleCommand = () => setCommandOpen((prev) => !prev);

    // Global Keyboard Shortcut (Ctrl+K or Cmd+K)
    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                toggleCommand();
            }
        };
        document.addEventListener("keydown", down);
        return () => document.removeEventListener("keydown", down);
    }, []);

    return (
        <UIContext.Provider value={{ commandOpen, setCommandOpen, openCommand, closeCommand, toggleCommand }}>
            {children}
        </UIContext.Provider>
    );
}

export function useUI() {
    const context = useContext(UIContext);
    if (context === undefined) {
        throw new Error("useUI must be used within a UIProvider");
    }
    return context;
}
