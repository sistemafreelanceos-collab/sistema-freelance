"use client";

import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { useRouter } from 'next/navigation';

interface WelcomeModalProps {
    isOpen: boolean;
    workspaceId: string;
    currentName: string;
    onComplete: () => void;
}

export default function WelcomeModal({ isOpen, workspaceId, currentName, onComplete }: WelcomeModalProps) {
    const router = useRouter();

    return (
        <Transition show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-[100]" onClose={() => { }}>
                {/* Backdrop */}
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4 text-center">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >
                            <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-[#0F1115] border border-white/10 p-8 text-left align-middle shadow-2xl transition-all">

                                <div className="text-center">
                                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 mb-6">
                                        <span className="text-4xl">👋</span>
                                    </div>

                                    <Dialog.Title
                                        as="h3"
                                        className="text-2xl font-bold leading-6 text-white mb-2"
                                    >
                                        ¡Bienvenido a Onyx!
                                    </Dialog.Title>

                                    <div className="mt-2">
                                        <p className="text-sm text-gray-400">
                                            Tu sistema operativo para freelancers ya está listo.
                                            Hemos creado tu espacio de trabajo <span className="text-emerald-400 font-bold">{currentName}</span> para que empieces con el pie derecho.
                                        </p>
                                    </div>
                                </div>

                                <div className="mt-8 flex flex-col gap-3">
                                    <button
                                        type="button"
                                        className="inline-flex justify-center rounded-xl bg-emerald-500 px-4 py-3 text-sm font-bold text-white hover:bg-emerald-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 transition-all transform hover:scale-[1.02] shadow-lg shadow-emerald-900/20"
                                        onClick={onComplete}
                                    >
                                        🚀 Iniciar Tour Rápido
                                    </button>
                                </div>

                                <p className="mt-6 text-center text-xs text-gray-500">
                                    Estás listo para organizar tus finanzas, clientes y proyectos como un profesional.
                                </p>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
}
