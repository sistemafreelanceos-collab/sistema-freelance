"use client";

import { useMemo } from "react";
import { DayPicker } from "react-day-picker";
import { Popover, Transition } from "@headlessui/react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarIcon, ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/solid";

interface CalendarPickerProps {
    date: Date | undefined;
    setDate: (date: Date | undefined) => void;
    label?: string;
}

export function CalendarPicker({ date, setDate, label = "Fecha" }: CalendarPickerProps) {
    const formattedDate = useMemo(() => {
        if (!date) return "Seleccionar fecha";
        return format(date, "PPP", { locale: es });
    }, [date]);

    return (
        <div className="w-full">
            <label className="text-[10px] text-gray-500 uppercase font-bold block mb-1">{label}</label>
            <Popover className="relative">
                <Popover.Button className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white text-xs flex items-center justify-between hover:bg-white/5 transition outline-none focus:border-indigo-500">
                    <span className="capitalize">{formattedDate}</span>
                    <CalendarIcon className="w-4 h-4 text-gray-400" />
                </Popover.Button>

                <Transition
                    enter="transition duration-100 ease-out"
                    enterFrom="transform scale-95 opacity-0"
                    enterTo="transform scale-100 opacity-100"
                    leave="transition duration-75 ease-out"
                    leaveFrom="transform scale-100 opacity-100"
                    leaveTo="transform scale-95 opacity-0"
                >
                    <Popover.Panel className="absolute left-0 z-50 mt-2 bg-[#1C2128] border border-white/10 rounded-xl p-3 shadow-2xl w-auto">
                        <DayPicker
                            mode="single"
                            selected={date}
                            onSelect={setDate}
                            locale={es}
                            showOutsideDays
                            fixedWeeks

                            classNames={{
                                months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
                                month: "space-y-4",
                                caption: "flex justify-center pt-1 relative items-center mb-2",
                                caption_label: "text-sm font-bold text-white capitalize",
                                nav: "space-x-1 flex items-center absolute right-1",
                                nav_button: "h-7 w-7 bg-transparent p-0 hover:bg-white/10 rounded-md flex items-center justify-center transition",
                                nav_button_previous: "absolute left-1",
                                nav_button_next: "absolute right-1",
                                table: "w-full border-collapse space-y-1",
                                head_row: "flex",
                                head_cell: "text-gray-500 rounded-md w-9 font-normal text-[0.8rem] uppercase",
                                row: "flex w-full mt-2",
                                cell: "text-center text-sm p-0 relative focus-within:relative focus-within:z-20",
                                day: "h-9 w-9 p-0 font-normal aria-selected:opacity-100 hover:bg-white/10 rounded-md text-gray-300 transition",
                                day_selected: "bg-indigo-600 text-white hover:bg-indigo-600 hover:text-white focus:bg-indigo-600 focus:text-white font-bold",
                                day_today: "text-indigo-400 font-bold bg-indigo-400/10",
                                day_outside: "text-gray-700 opacity-50",
                                day_disabled: "text-gray-700 opacity-50",
                                day_hidden: "invisible",
                            }}
                        />
                    </Popover.Panel>
                </Transition>
            </Popover>
        </div>
    );
}
