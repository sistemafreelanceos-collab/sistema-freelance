
import { Popover, Transition } from "@headlessui/react";
import { Fragment } from "react";
import { BellIcon, CheckCircleIcon, ExclamationTriangleIcon, CurrencyDollarIcon } from "@heroicons/react/24/outline";
import { useNotificaciones, Notificacion } from "../../hooks/useNotificaciones";

export default function NotificationBell() {
    const { notificaciones, unreadCount } = useNotificaciones();

    return (
        <Popover className="relative">
            {({ open }) => (
                <>
                    <Popover.Button className={`relative p-2 rounded-full transition-all outline-none ${open ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
                        <BellIcon className="w-6 h-6" />
                        {unreadCount > 0 && (
                            <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-[#0D1117] animate-pulse"></span>
                        )}
                    </Popover.Button>

                    <Transition
                        as={Fragment}
                        enter="transition ease-out duration-200"
                        enterFrom="opacity-0 translate-y-1"
                        enterTo="opacity-100 translate-y-0"
                        leave="transition ease-in duration-150"
                        leaveFrom="opacity-100 translate-y-0"
                        leaveTo="opacity-0 translate-y-1"
                    >
                        <Popover.Panel className="absolute right-0 z-50 mt-2 w-80 sm:w-96 origin-top-right rounded-xl bg-[#1C2128] border border-white/10 shadow-2xl focus:outline-none overflow-hidden ring-1 ring-black ring-opacity-5">
                            <div className="p-4 border-b border-white/5 flex justify-between items-center bg-black/20">
                                <h3 className="text-sm font-bold text-white">Notificaciones</h3>
                                <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/20">
                                    {unreadCount} nuevas
                                </span>
                            </div>

                            <div className="max-h-80 overflow-y-auto scrollbar-hide py-2">
                                {notificaciones.length === 0 ? (
                                    <div className="p-8 text-center text-gray-500">
                                        <CheckCircleIcon className="w-10 h-10 mx-auto mb-2 opacity-20" />
                                        <p className="text-xs">¡Todo al día! Relájate.</p>
                                    </div>
                                ) : (
                                    notificaciones.map((notif: Notificacion) => (
                                        <div key={notif.id} className="px-4 py-3 hover:bg-white/5 transition flex gap-3 border-b border-white/5 last:border-0">
                                            <div className={`mt-1 flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${notif.tipo === 'tarea' ? 'bg-indigo-500/20 text-indigo-400' :
                                                    notif.tipo === 'cobro' ? 'bg-emerald-500/20 text-emerald-400' :
                                                        'bg-gray-700 text-gray-300'
                                                }`}>
                                                {notif.tipo === 'tarea' && <ExclamationTriangleIcon className="w-4 h-4" />}
                                                {notif.tipo === 'cobro' && <CurrencyDollarIcon className="w-4 h-4" />}
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold text-gray-200">{notif.titulo}</p>
                                                <p className="text-xs text-gray-400 mt-0.5">{notif.mensaje}</p>
                                                <p className="text-[10px] text-gray-600 mt-1">
                                                    {notif.fecha.toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>

                            <div className="bg-black/20 p-2 text-center border-t border-white/5">
                                <button className="text-[10px] text-gray-500 hover:text-white transition">
                                    Marcar todas como leídas
                                </button>
                            </div>
                        </Popover.Panel>
                    </Transition>
                </>
            )}
        </Popover>
    );
}
