"use client";

import { useState, useEffect, useRef } from "react";
import { Combobox, Transition } from "@headlessui/react";
import { ChevronUpDownIcon, CheckIcon } from "@heroicons/react/24/solid";

interface TimePickerProps {
    label: string;
    value: string; // Espera formato "HH:mm" (24h) ej: "14:30"
    onChange: (val: string) => void;
}

// Generamos opciones cada 15 minutos para la lista rápida
const TIME_OPTIONS = generateTimeOptions(15);

export function TimePicker({ label, value, onChange }: TimePickerProps) {
    const [query, setQuery] = useState("");

    // Convertir el valor "14:30" a "02:30 PM" para mostrarlo bonito
    const displayValue = formatTimeDisplay(value);

    // Filtrar opciones basado en lo que escribe el usuario
    const filteredTimes =
        query === ""
            ? TIME_OPTIONS
            : TIME_OPTIONS.filter((time) => {
                return time.toLowerCase().includes(query.toLowerCase());
            });

    // Manejar cuando el usuario selecciona o escribe
    const handleChange = (val: string) => {
        // 1. Si eligió de la lista (ej: "02:30 PM") -> Convertir a "14:30"
        const converted = parseTimeTo24h(val);
        if (converted) {
            onChange(converted);
        } else {
            // 2. Si está escribiendo algo manual, intentamos interpretarlo
            // Esto permite escribir "6:35" y que funcione
            const manual = parseTimeTo24h(query);
            if (manual) onChange(manual);
        }
    };

    return (
        <div className="w-full">
            <label className="text-[10px] text-gray-500 uppercase font-bold block mb-1">
                {label}
            </label>
            <Combobox value={displayValue} onChange={handleChange} nullable>
                <div className="relative mt-1">
                    <div className="relative w-full cursor-default overflow-hidden rounded-xl bg-black/40 border border-white/10 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-white/75 focus-visible:ring-offset-2 focus-visible:ring-offset-teal-300 sm:text-sm">
                        <Combobox.Input
                            className="w-full border-none py-3 pl-3 pr-10 text-sm leading-5 text-white bg-transparent focus:ring-0 outline-none font-mono"
                            displayValue={(time: string) => time}
                            onChange={(event) => {
                                setQuery(event.target.value);
                                // Intentar guardar en tiempo real si es válido
                                const val = parseTimeTo24h(event.target.value);
                                if (val) onChange(val);
                            }}
                            placeholder="Ej: 09:00 AM"
                        />
                        <Combobox.Button className="absolute inset-y-0 right-0 flex items-center pr-2">
                            <ChevronUpDownIcon
                                className="h-5 w-5 text-gray-400"
                                aria-hidden="true"
                            />
                        </Combobox.Button>
                    </div>
                    <Transition
                        as="div" // Fragment cause issues sometimes, div is safer
                        leave="transition ease-in duration-100"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                        afterLeave={() => setQuery("")}
                    >
                        <Combobox.Options className="absolute mt-1 max-h-60 w-full overflow-auto rounded-xl bg-[#1C2128] py-1 text-base shadow-lg ring-1 ring-black/5 focus:outline-none sm:text-sm z-50 border border-white/10 custom-scrollbar">
                            {filteredTimes.length === 0 && query !== "" ? (
                                <div className="relative cursor-default select-none py-2 px-4 text-gray-500 italic">
                                    Usa formato "HH:mm" (ej: 6:35 PM)
                                </div>
                            ) : (
                                filteredTimes.map((time) => (
                                    <Combobox.Option
                                        key={time}
                                        className={({ active }) =>
                                            `relative cursor-default select-none py-2 pl-10 pr-4 ${active ? "bg-indigo-600 text-white" : "text-gray-300"
                                            }`
                                        }
                                        value={time}
                                    >
                                        {({ selected, active }) => (
                                            <>
                                                <span className={`block truncate ${selected ? "font-bold text-white" : "font-normal"}`}>
                                                    {time}
                                                </span>
                                                {selected ? (
                                                    <span className={`absolute inset-y-0 left-0 flex items-center pl-3 ${active ? "text-white" : "text-indigo-400"}`}>
                                                        <CheckIcon className="h-4 w-4" aria-hidden="true" />
                                                    </span>
                                                ) : null}
                                            </>
                                        )}
                                    </Combobox.Option>
                                ))
                            )}
                        </Combobox.Options>
                    </Transition>
                </div>
            </Combobox>
        </div>
    );
}

// --- HELPERS (Utilidades para manejar las horas) ---

// 1. Generar lista de horas (00:00 AM ... 11:45 PM)
function generateTimeOptions(step: number) {
    const times = [];
    for (let h = 0; h < 24; h++) {
        for (let m = 0; m < 60; m += step) {
            const h12 = h % 12 || 12;
            const ampm = h < 12 ? "AM" : "PM";
            const mStr = m.toString().padStart(2, "0");
            const hStr = h12.toString().padStart(2, "0");
            times.push(`${hStr}:${mStr} ${ampm}`);
        }
    }
    return times;
}

// 2. Formato Visual: "14:30" -> "02:30 PM"
function formatTimeDisplay(value24h: string) {
    if (!value24h) return "";
    const [h, m] = value24h.split(":");
    if (!h || !m) return value24h;

    let hInt = parseInt(h);
    const ampm = hInt >= 12 ? "PM" : "AM";
    hInt = hInt % 12 || 12;
    return `${hInt.toString().padStart(2, "0")}:${m} ${ampm}`;
}

// 3. Parser Inteligente: "2:30 pm", "14:30", "635" -> "14:30"
function parseTimeTo24h(input: string): string | null {
    if (!input) return null;
    const clean = input.toLowerCase().trim().replace(/\s/g, ""); // "02:30pm"

    // Regex para capturar horas, minutos y am/pm opcional
    const match = clean.match(/^(\d{1,2}):?(\d{2})?(am|pm|a|p)?$/);

    if (match) {
        let h = parseInt(match[1]);
        const m = match[2] ? parseInt(match[2]) : 0;
        const ampm = match[3]; // 'am', 'pm', 'a', 'p'

        if (h > 23 || m > 59) return null;

        // Lógica AM/PM
        if (ampm && (ampm.startsWith("p")) && h < 12) h += 12;
        if (ampm && (ampm.startsWith("a")) && h === 12) h = 0;

        // Si no escribe AM/PM, asumimos lógica 24h a menos que sea obvio
        // (Ej: Google asume AM si escribes 7, pero PM si escribes 14)

        return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
    }

    return null;
}
