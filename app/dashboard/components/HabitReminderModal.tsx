import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { useRouter } from 'next/navigation';

interface HabitReminderModalProps {
    isOpen: boolean;
    missingCount: number;
    onClose: () => void;
}

export default function HabitReminderModal({
    isOpen,
    missingCount,
    onClose
}: HabitReminderModalProps) {
    const router = useRouter();

    const handleAceptar = () => {
        onClose();
        router.push('/dashboard/habitos');
    };

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
                            <Dialog.Panel className="w-full max-w-sm transform overflow-hidden rounded-2xl bg-[#0F1115] border border-white/10 p-8 text-center align-middle shadow-[0_0_50px_rgba(234,179,8,0.1)] transition-all relative">

                                {/* Decoración de fondo */}
                                <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-500/10 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none"></div>

                                {/* Icono Central */}
                                <div className="mx-auto w-24 h-24 mb-6 relative group">
                                    <div className="absolute inset-0 bg-yellow-500/20 rounded-full blur-xl animate-pulse"></div>
                                    <div className="relative w-full h-full bg-gradient-to-br from-yellow-400 to-amber-600 rounded-full p-[2px] shadow-lg shadow-yellow-500/20">
                                        <div className="w-full h-full bg-[#0F1115] rounded-full flex items-center justify-center">
                                            <span className="text-4xl">⚡</span>
                                        </div>
                                    </div>
                                </div>

                                <Dialog.Title as="h3" className="text-2xl font-bold leading-6 text-white tracking-wide mb-2">
                                    ¡Tu racha peligra!
                                </Dialog.Title>

                                <div className="mt-4">
                                    <p className="text-sm text-gray-300 leading-relaxed font-medium">
                                        Aún tienes <strong className="text-yellow-400">{missingCount} hábito{missingCount !== 1 ? 's' : ''} sin completar</strong> hoy.
                                        Los grandes resultados se construyen con consistencia diaria — cada check cuenta.
                                    </p>
                                </div>

                                {/* Acciones */}
                                <div className="mt-8 flex flex-col gap-3">
                                    <button
                                        type="button"
                                        className="w-full justify-center rounded-xl bg-gradient-to-r from-yellow-500 to-amber-600 text-white px-6 py-3 text-sm font-bold shadow-lg hover:shadow-yellow-500/30 hover:scale-[1.02] active:scale-95 transition-all focus:outline-none flex items-center gap-2"
                                        onClick={handleAceptar}
                                    >
                                        🚀 Completarlos ahora
                                    </button>
                                    <button
                                        type="button"
                                        className="w-full justify-center rounded-xl bg-transparent text-gray-400 border border-white/10 px-6 py-3 text-sm font-bold hover:bg-white/5 hover:text-white transition-all focus:outline-none"
                                        onClick={onClose}
                                    >
                                        Recordarme en 1 hora
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
