import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';

interface DailyBriefingModalProps {
    isOpen: boolean;
    isLoading: boolean;
    briefingText: string | null;
    onClose: () => void;
    userName: string;
}

export default function DailyBriefingModal({
    isOpen,
    isLoading,
    briefingText,
    onClose,
    userName
}: DailyBriefingModalProps) {
    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-[100]" onClose={onClose}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-500"
                    enterFrom="opacity-0 backdrop-blur-none"
                    enterTo="opacity-100 backdrop-blur-sm"
                    leave="ease-in duration-300"
                    leaveFrom="opacity-100 backdrop-blur-sm"
                    leaveTo="opacity-0 backdrop-blur-none"
                >
                    <div className="fixed inset-0 bg-black/80" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4 text-center">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-500 delay-100"
                            enterFrom="opacity-0 scale-95 translate-y-4"
                            enterTo="opacity-100 scale-100 translate-y-0"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 scale-100 translate-y-0"
                            leaveTo="opacity-0 scale-95 translate-y-4"
                        >
                            <Dialog.Panel className="w-full max-w-lg transform overflow-hidden rounded-2xl bg-black border border-white/10 p-8 text-left align-middle shadow-[0_0_50px_rgba(16,185,129,0.1)] transition-all relative">

                                {/* Decoración de fondo */}
                                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none"></div>

                                {/* Header */}
                                <div className="flex items-center gap-4 mb-6 relative">
                                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-emerald-500 p-[2px] shadow-lg shadow-emerald-500/20">
                                        <div className="w-full h-full bg-black rounded-full flex items-center justify-center">
                                            <span className="text-xl">🤖</span>
                                        </div>
                                    </div>
                                    <div>
                                        <Dialog.Title as="h3" className="text-xl font-bold leading-6 text-white tracking-wide">
                                            Buenos días, {userName}
                                        </Dialog.Title>
                                        <p className="text-xs text-emerald-400 font-bold uppercase tracking-widest mt-1">Onyx • Asistente Virtual</p>
                                    </div>
                                </div>

                                {/* Contenido */}
                                <div className="mt-4 relative min-h-[140px] flex items-center justify-center">
                                    {isLoading ? (
                                        <div className="flex flex-col items-center justify-center w-full py-8 text-emerald-500">
                                            <div className="w-8 h-8 border-2 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mb-4 shadow-[0_0_20px_rgba(16,185,129,0.4)]"></div>
                                            <p className="text-sm font-medium animate-pulse text-gray-300">Onyx está calculando tus métricas...</p>
                                        </div>
                                    ) : (
                                        <div className="w-full bg-white/5 border border-white/10 rounded-xl p-6 relative overflow-hidden group hover:border-emerald-500/30 transition-colors">
                                            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                            <div
                                                className="prose prose-invert prose-sm max-w-none text-gray-300 leading-relaxed font-medium"
                                                dangerouslySetInnerHTML={{ __html: briefingText || "No hay información disponible." }}
                                            />
                                        </div>
                                    )}
                                </div>

                                {/* Acciones */}
                                <div className="mt-8 flex justify-end">
                                    <button
                                        type="button"
                                        className="inline-flex justify-center rounded-xl bg-white text-black px-6 py-3 text-sm font-bold shadow-lg hover:bg-gray-200 hover:scale-[1.02] active:scale-95 transition-all focus:outline-none"
                                        onClick={onClose}
                                        disabled={isLoading}
                                    >
                                        Comenzar el día →
                                    </button>
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
}
