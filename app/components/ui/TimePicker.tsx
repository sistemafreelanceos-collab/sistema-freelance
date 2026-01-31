"use client";

import { Fragment } from "react";
import { Popover, Transition } from "@headlessui/react";
import { ClockIcon, ChevronUpIcon, ChevronDownIcon } from "@heroicons/react/24/solid";
import { cn } from "@/lib/utils"; // Assuming you might have utils, if not I will use template literals or install clsx locally in this file if needed. I'll stick to template literals for safety if unsure.

// Helper to generate classes conditionally without external lib deps if not present
function classNames(...classes: (string | undefined | null | false)[]) {
    return classes.filter(Boolean).join(' ');
}

interface TimePickerProps {
    label: string;
    value: string; // Format "HH:mm" (24h) or "hh:mm" if you handle logic externally, but relying on 24h string is standard for value prop.
    onChange: (val: string) => void;
}

export function TimePicker({ label, value, onChange }: TimePickerProps) {
    // Parse current value (assumes "HH:mm" 24h format input)
    const [hora24, minutos] = (value || "09:00").split(":");
    let hInt = parseInt(hora24);
    const ampm = hInt >= 12 ? "PM" : "AM";
    let hDisplay = hInt % 12;
    hDisplay = hDisplay ? hDisplay : 12; // 0 becomes 12

    const handleUpdate = (newH: number, newM: string, newAmpm: string) => {
        let h24 = newH;
        if (newAmpm === "PM" && h24 < 12) h24 += 12;
        if (newAmpm === "AM" && h24 === 12) h24 = 0;

        const hStr = h24.toString().padStart(2, '0');
        onChange(`${hStr}:${newM}`);
    };

    const hours = Array.from({ length: 12 }, (_, i) => i + 1);
    const minutes = ['00', '15', '30', '45']; // 15 min steps for cleaner UI, can be expanded

    return (
        <div className="w-full">
            <label className="text-[10px] text-gray-500 uppercase font-bold block mb-1">{label}</label>
            <Popover className="relative">
                {({ open }) => (
                    <>
                        <Popover.Button className={classNames(
                            "w-full bg-black/40 border rounded-xl p-3 text-white text-xs flex items-center justify-between transition outline-none",
                            open ? "border-indigo-500 bg-white/5" : "border-white/10 hover:bg-white/5"
                        )}>
                            <span className="font-mono text-sm tracking-wider">
                                {hDisplay.toString().padStart(2, '0')}:{minutos} <span className="text-gray-400 text-[10px] ml-1">{ampm}</span>
                            </span>
                            <ClockIcon className="w-4 h-4 text-gray-400" />
                        </Popover.Button>

                        <Transition
                            as={Fragment}
                            enter="transition ease-out duration-100"
                            enterFrom="transform opacity-0 scale-95"
                            enterTo="transform opacity-100 scale-100"
                            leave="transition ease-in duration-75"
                            leaveFrom="transform opacity-100 scale-100"
                            leaveTo="transform opacity-0 scale-95"
                        >
                            <Popover.Panel className="absolute left-0 z-50 mt-2 w-full bg-[#1C2128] border border-white/10 rounded-xl shadow-2xl p-2 flex gap-1">
                                {/* HOURS COLUMN */}
                                <div className="flex-1 h-32 overflow-y-auto scrollbar-hide flex flex-col gap-1 text-center border-r border-white/5 pr-1">
                                    <span className="text-[9px] text-gray-500 uppercase font-bold mb-1 sticky top-0 bg-[#1C2128]">Hora</span>
                                    {hours.map(h => (
                                        <button
                                            key={h}
                                            onClick={() => handleUpdate(h, minutos, ampm)}
                                            className={classNames(
                                                "py-1 rounded text-xs transition",
                                                h === hDisplay ? "bg-indigo-600 text-white font-bold" : "text-gray-400 hover:bg-white/10 hover:text-white"
                                            )}
                                        >
                                            {h}
                                        </button>
                                    ))}
                                </div>

                                {/* MINUTES COLUMN */}
                                <div className="flex-1 h-32 overflow-y-auto scrollbar-hide flex flex-col gap-1 text-center border-r border-white/5 px-1">
                                    <span className="text-[9px] text-gray-500 uppercase font-bold mb-1 sticky top-0 bg-[#1C2128]">Min</span>
                                    {minutes.map(m => (
                                        <button
                                            key={m}
                                            onClick={() => handleUpdate(hDisplay, m, ampm)}
                                            className={classNames(
                                                "py-1 rounded text-xs transition",
                                                m === minutos ? "bg-indigo-600 text-white font-bold" : "text-gray-400 hover:bg-white/10 hover:text-white"
                                            )}
                                        >
                                            {m}
                                        </button>
                                    ))}
                                </div>

                                {/* AM/PM COLUMN */}
                                <div className="w-12 flex flex-col gap-1 justify-center pl-1">
                                    <button
                                        onClick={() => handleUpdate(hDisplay, minutos, "AM")}
                                        className={classNames(
                                            "flex-1 rounded text-[10px] font-bold transition flex items-center justify-center",
                                            ampm === "AM" ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/50" : "text-gray-500 hover:bg-white/5"
                                        )}
                                    >
                                        AM
                                    </button>
                                    <button
                                        onClick={() => handleUpdate(hDisplay, minutos, "PM")}
                                        className={classNames(
                                            "flex-1 rounded text-[10px] font-bold transition flex items-center justify-center",
                                            ampm === "PM" ? "bg-indigo-500/20 text-indigo-400 border border-indigo-500/50" : "text-gray-500 hover:bg-white/5"
                                        )}
                                    >
                                        PM
                                    </button>
                                </div>
                            </Popover.Panel>
                        </Transition>
                    </>
                )}
            </Popover>
        </div>
    );
}
