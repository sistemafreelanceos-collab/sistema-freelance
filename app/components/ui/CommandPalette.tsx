"use client";

import { useEffect, useState } from "react";
import { Command } from "cmdk";
import { useRouter } from "next/navigation";
import {
    CalculatorIcon,
    CalendarIcon,
    CreditCardIcon,
    UserGroupIcon,
    ChartBarIcon,
    CogIcon,
    PlusIcon
} from "@heroicons/react/24/outline";

interface Props {
    open: boolean;
    setOpen: (open: boolean) => void;
}

export default function CommandPalette({ open, setOpen }: Props) {
    const router = useRouter();

    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setOpen(true); // Toggle logic can be improved by checking !open
            }
        };
        document.addEventListener("keydown", down);
        return () => document.removeEventListener("keydown", down);
    }, [setOpen]);

    const runCommand = (command: () => void) => {
        setOpen(false);
        command();
    };

    return (
        <div
            className={`fixed inset-0 z-50 flex items-start justify-center pt-[20vh] bg-black/60 backdrop-blur-sm transition-opacity duration-200 ${open ? "opacity-100 visible" : "opacity-0 invisible pointer-events-none"}`}
            onClick={() => setOpen(false)}
        >
            <div
                className="w-full max-w-lg bg-[#161B22] border border-gray-700 rounded-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                <Command label="Global Search" className="bg-transparent">
                    <div className="flex items-center border-b border-gray-700 px-3" cmdk-input-wrapper="">
                        <Command.Input
                            placeholder="Buscar clientes, facturas, acciones..."
                            className="w-full bg-transparent px-2 py-4 outline-none text-white placeholder-gray-500"
                        />
                    </div>

                    <Command.List className="max-h-[300px] overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-gray-700">
                        <Command.Empty className="py-6 text-center text-sm text-gray-500">
                            No se encontraron resultados.
                        </Command.Empty>

                        <Command.Group heading="Navegación" className="text-xs font-bold text-gray-500 uppercase mb-2 px-2">
                            <Command.Item
                                className="flex items-center gap-2 px-3 py-2 text-sm text-gray-300 rounded-lg aria-selected:bg-emerald-600 aria-selected:text-white cursor-pointer transition-colors"
                                onSelect={() => runCommand(() => router.push("/dashboard"))}
                            >
                                <div className="w-5 h-5 flex items-center justify-center"><span className="text-lg">🏠</span></div>
                                Inicio
                            </Command.Item>
                            <Command.Item
                                className="flex items-center gap-2 px-3 py-2 text-sm text-gray-300 rounded-lg aria-selected:bg-emerald-600 aria-selected:text-white cursor-pointer transition-colors"
                                onSelect={() => runCommand(() => router.push("/dashboard/clientes"))}
                            >
                                <UserGroupIcon className="w-5 h-5" />
                                Clientes
                            </Command.Item>
                            <Command.Item
                                className="flex items-center gap-2 px-3 py-2 text-sm text-gray-300 rounded-lg aria-selected:bg-emerald-600 aria-selected:text-white cursor-pointer transition-colors"
                                onSelect={() => runCommand(() => router.push("/dashboard/finanzas"))}
                            >
                                <CalculatorIcon className="w-5 h-5" />
                                Finanzas
                            </Command.Item>
                            <Command.Item
                                className="flex items-center gap-2 px-3 py-2 text-sm text-gray-300 rounded-lg aria-selected:bg-emerald-600 aria-selected:text-white cursor-pointer transition-colors"
                                onSelect={() => runCommand(() => router.push("/dashboard/calendario"))}
                            >
                                <CalendarIcon className="w-5 h-5" />
                                Calendario
                            </Command.Item>
                        </Command.Group>

                        <Command.Group heading="Acciones Rápidas" className="text-xs font-bold text-gray-500 uppercase mb-2 px-2 mt-4">
                            <Command.Item
                                className="flex items-center gap-2 px-3 py-2 text-sm text-gray-300 rounded-lg aria-selected:bg-emerald-600 aria-selected:text-white cursor-pointer transition-colors"
                                onSelect={() => runCommand(() => router.push("/dashboard/clientes?modal=nuevo"))}
                            >
                                <PlusIcon className="w-5 h-5" />
                                Nuevo Cliente
                            </Command.Item>
                            <Command.Item
                                className="flex items-center gap-2 px-3 py-2 text-sm text-gray-300 rounded-lg aria-selected:bg-emerald-600 aria-selected:text-white cursor-pointer transition-colors"
                                onSelect={() => runCommand(() => router.push("/dashboard/finanzas?modal=gasto"))}
                            >
                                <PlusIcon className="w-5 h-5" />
                                Registrar Gasto
                            </Command.Item>
                        </Command.Group>

                    </Command.List>
                </Command>
            </div>
        </div>
    );
}
