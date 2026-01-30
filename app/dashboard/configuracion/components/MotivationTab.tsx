"use client";

import { ConfigPerfil } from "../../../../types";
import { Switch } from "@headlessui/react";
import { LightBulbIcon } from "@heroicons/react/24/outline";

interface Props {
    config: ConfigPerfil;
    setConfig: (c: ConfigPerfil) => void;
    guardar: () => void;
    saving: boolean;
}

export default function MotivationTab({ config, setConfig, guardar, saving }: Props) {

    // Default values if undefined
    const enabled = config.motivation_enabled ?? true;
    const frequency = config.motivation_frequency ?? 60;

    const handleChangeEnabled = (val: boolean) => {
        setConfig({ ...config, motivation_enabled: val });
    };

    const handleChangeFrequency = (val: number) => {
        setConfig({ ...config, motivation_frequency: val });
    };

    return (
        <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">

            {/* Header */}
            <div className="bg-[#1C2128] border border-emerald-500/20 p-6 rounded-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl -mr-10 -mt-10"></div>
                <div className="flex gap-4 items-start relative z-10">
                    <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-400">
                        <LightBulbIcon className="w-8 h-8" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-white mb-2">Sistema de Motivación</h2>
                        <p className="text-gray-400 text-sm max-w-lg">
                            Configura alertas periódicas con frases inspiradoras para mantener alto tu ánimo durante la jornada laboral.
                        </p>
                    </div>
                </div>
            </div>

            {/* Settings Form */}
            <div className="bg-[#1C2128] border border-white/10 p-8 rounded-2xl shadow-xl">
                <div className="space-y-8 max-w-2xl">

                    {/* Toggle Switch */}
                    <div className="flex items-center justify-between">
                        <div>
                            <label className="text-white font-bold block mb-1">Activar Mensajes Motivacionales</label>
                            <p className="text-sm text-gray-400">Recibe una frase inspiradora cada cierto tiempo.</p>
                        </div>
                        <Switch
                            checked={enabled}
                            onChange={handleChangeEnabled}
                            className={`${enabled ? 'bg-emerald-500' : 'bg-gray-700'}
                relative inline-flex h-[28px] w-[54px] shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2  focus-visible:ring-white focus-visible:ring-opacity-75`}
                        >
                            <span className="sr-only">Use setting</span>
                            <span
                                aria-hidden="true"
                                className={`${enabled ? 'translate-x-6' : 'translate-x-0'}
                  pointer-events-none inline-block h-[24px] w-[24px] transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out`}
                            />
                        </Switch>
                    </div>

                    {/* Frequency Slider/Input */}
                    <div className={`transition-all duration-300 ${enabled ? 'opacity-100' : 'opacity-40 pointer-events-none grayscale'}`}>
                        <label className="text-white font-bold block mb-4">Frecuencia de Aparición</label>

                        <div className="space-y-4">
                            <div className="flex justify-between text-sm text-gray-400 mb-2">
                                <span>Más frecuente (15 min)</span>
                                <span>Menos frecuente (4 horas)</span>
                            </div>

                            <input
                                type="range"
                                min="15"
                                max="240"
                                step="15"
                                value={frequency}
                                onChange={(e) => handleChangeFrequency(Number(e.target.value))}
                                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                            />

                            <div className="flex items-center justify-center gap-2 mt-2">
                                <span className="text-3xl font-bold text-emerald-400 font-mono">{frequency}</span>
                                <span className="text-gray-400 text-sm mt-2">minutos</span>
                            </div>

                            <p className="text-center text-xs text-gray-500">
                                Aparecerá un mensaje aproximadamente cada {frequency < 60 ? `${frequency} minutos` : `${(frequency / 60).toFixed(1)} horas`}.
                            </p>
                        </div>
                    </div>

                </div>

                {/* Save Button */}
                <div className="mt-10 pt-6 border-t border-white/10 flex justify-end">
                    <button
                        onClick={guardar}
                        disabled={saving}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 px-8 rounded-xl transition shadow-lg shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {saving ? (
                            <>
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Guardando...
                            </>
                        ) : (
                            "Guardar Configuración"
                        )}
                    </button>
                </div>

            </div>
        </div>
    );
}
