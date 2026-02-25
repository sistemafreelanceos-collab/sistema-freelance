import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon, BookOpenIcon } from '@heroicons/react/24/outline'; // Asegúrate de tener heroicons/react

interface Props {
    isOpen: boolean;
    onClose: () => void;
}

export default function ManualUsuarioPanel({ isOpen, onClose }: Props) {
    return (
        <Transition.Root show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
                {/* Fondo semi-transparente */}
                <Transition.Child
                    as={Fragment}
                    enter="ease-in-out duration-500"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in-out duration-500"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-hidden">
                    <div className="absolute inset-0 overflow-hidden">
                        <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10 sm:pl-16">
                            <Transition.Child
                                as={Fragment}
                                enter="transform transition ease-in-out duration-500 sm:duration-700"
                                enterFrom="translate-x-full"
                                enterTo="translate-x-0"
                                leave="transform transition ease-in-out duration-500 sm:duration-700"
                                leaveFrom="translate-x-0"
                                leaveTo="translate-x-full"
                            >
                                <Dialog.Panel className="pointer-events-auto w-screen max-w-2xl">
                                    <div className="flex h-full flex-col bg-[#0F1115] border-l border-white/10 shadow-2xl py-6 overflow-y-scroll scrollbar-thin scrollbar-thumb-emerald-500/50 scrollbar-track-transparent">
                                        {/* Header */}
                                        <div className="px-4 sm:px-6 sticky top-0 bg-[#0F1115]/90 backdrop-blur-md z-10 pb-4 border-b border-white/5">
                                            <div className="flex items-start justify-between">
                                                <Dialog.Title className="text-xl font-bold text-white flex items-center gap-2">
                                                    <BookOpenIcon className="w-6 h-6 text-emerald-500" />
                                                    📖 Manual de Usuario - Onyx OS
                                                </Dialog.Title>
                                                <div className="ml-3 flex h-7 items-center">
                                                    <button
                                                        type="button"
                                                        className="rounded-md bg-white/5 p-2 text-gray-400 hover:text-white hover:bg-white/10 focus:outline-none transition-colors"
                                                        onClick={onClose}
                                                    >
                                                        <span className="sr-only">Cerrar manual</span>
                                                        <XMarkIcon className="h-5 w-5" aria-hidden="true" />
                                                    </button>
                                                </div>
                                            </div>
                                            <p className="mt-2 text-sm text-gray-400">
                                                Sistema Operativo Integral para Freelancers y Agencias.
                                            </p>
                                        </div>

                                        {/* Contenido del Manual */}
                                        <div className="relative mt-6 flex-1 px-4 sm:px-6">
                                            <div className="prose prose-invert prose-emerald max-w-none text-gray-300">
                                                <p className="lead text-gray-300">
                                                    Bienvenido a tu nuevo sistema operativo. Esta plataforma está diseñada para unificar la gestión de tu negocio (clientes, proyectos, finanzas) con tu rendimiento personal (hábitos, energía, trabajo profundo).
                                                </p>
                                                <p>
                                                    A continuación, encontrarás el manual explícito paso a paso de cada módulo de la plataforma.
                                                </p>

                                                <hr className="border-white/10 my-8" />

                                                {/* SECCIÓN 1 */}
                                                <h2 className="text-xl font-bold text-emerald-400 flex items-center gap-2 mt-8 mb-4">
                                                    <span className="bg-emerald-500/10 p-2 rounded-lg text-2xl">🏢</span>
                                                    1. ESPACIOS DE TRABAJO (WORKSPACES) Y CONFIGURACIÓN
                                                </h2>
                                                <p className="text-sm italic text-gray-400 mb-4">El sistema es multi-empresa. Todo lo que haces ocurre dentro de un "Workspace" o Espacio de Trabajo.</p>

                                                <h3 className="text-lg font-semibold text-white mt-6 mb-2">¿Cómo funciona?</h3>
                                                <ul className="space-y-3 list-disc pl-5">
                                                    <li><strong className="text-emerald-300">Crear un Workspace:</strong> Puedes tener un espacio para tu "Marca Personal" y otro para tu "Agencia". Los datos (finanzas, clientes, proyectos) de cada Workspace son completamente independientes.</li>
                                                    <li><strong className="text-emerald-300">Cambiar de Workspace:</strong> Usa el selector en la barra superior o lateral para saltar de un negocio a otro.</li>
                                                    <li><strong className="text-emerald-300">Invitar al Equipo:</strong> En el módulo de <strong>Configuración {'>'} Equipo</strong>, puedes enviar invitaciones por correo a socios o asistentes para que colaboren en tu Workspace.</li>
                                                    <li><strong className="text-emerald-300">Configuración Financiera:</strong> En <strong>Configuración {'>'} Finanzas</strong>, define tu moneda principal (ej. USD, COP) y tu porcentaje de ahorro meta.</li>
                                                </ul>

                                                <hr className="border-white/10 my-8" />

                                                {/* SECCIÓN 2 */}
                                                <h2 className="text-xl font-bold text-emerald-400 flex items-center gap-2 mt-8 mb-4">
                                                    <span className="bg-emerald-500/10 p-2 rounded-lg text-2xl">📊</span>
                                                    2. TABLERO DEL CEO (ESTADÍSTICAS)
                                                </h2>
                                                <p className="text-sm italic text-gray-400 mb-4">Este es tu panel de control estratégico. Te muestra la salud en tiempo real de tu negocio basándose en los datos de todos los demás módulos.</p>

                                                <h3 className="text-lg font-semibold text-white mt-6 mb-2">Funciones principales:</h3>
                                                <ul className="space-y-3 list-disc pl-5">
                                                    <li><strong className="text-emerald-300">Meta del Mes:</strong> Haz clic en "Editar Meta" para definir cuánto quieres facturar. El sistema llenará la barra de progreso automáticamente conforme registres pagos de clientes.</li>
                                                    <li>
                                                        <strong className="text-emerald-300">Solidez del Negocio (Risk AI):</strong> Muestra qué porcentaje de tus ingresos depende de cada cliente.
                                                        <br /><span className="text-sm text-gray-400"><em>Botón "Analizar Solidez":</em> Activa la Inteligencia Artificial para leer tu cartera de clientes. Te dará un diagnóstico directo y estrategias accionables si detecta que dependes demasiado de un solo cliente.</span>
                                                    </li>
                                                    <li><strong className="text-emerald-300">Valor Hora Real:</strong> El sistema divide los ingresos generados por un proyecto entre las horas de <em>Deep Work</em> que le dedicaste. Te dice exactamente cuánto vale tu hora de trabajo real.</li>
                                                    <li><strong className="text-emerald-300">Tasa de Cierre:</strong> Compara tus clientes en estado "Lead" (prospectos) vs. "Activos" para mostrarte tu porcentaje de efectividad en ventas.</li>
                                                    <li><strong className="text-emerald-300">Gráficos:</strong> Visualiza el flujo de caja (ingresos vs. gastos por mes) y un gráfico circular de tus "Top Gastos" por categoría.</li>
                                                </ul>

                                                <hr className="border-white/10 my-8" />

                                                {/* SECCIÓN 3 */}
                                                <h2 className="text-xl font-bold text-emerald-400 flex items-center gap-2 mt-8 mb-4">
                                                    <span className="bg-emerald-500/10 p-2 rounded-lg text-2xl">💼</span>
                                                    3. GESTIÓN DE CLIENTES Y PROYECTOS
                                                </h2>
                                                <p className="text-sm italic text-gray-400 mb-4">Aquí administras tus ventas y la ejecución del trabajo.</p>

                                                <h3 className="text-lg font-semibold text-white mt-6 mb-2">Gestión de Clientes:</h3>
                                                <ul className="space-y-3 list-disc pl-5">
                                                    <li><strong className="text-emerald-300">Nuevo Cliente:</strong> Registra sus datos básicos, empresa y datos de contacto. Puedes marcarlos como <em>Lead</em> (si aún estás negociando) o <em>Activo</em>.</li>
                                                    <li><strong className="text-emerald-300">Perfil del Cliente:</strong> Al entrar a un cliente, verás su historial de proyectos y el total de deuda o dinero pagado.</li>
                                                </ul>

                                                <h3 className="text-lg font-semibold text-white mt-6 mb-2">Gestión de Proyectos (Kanban):</h3>
                                                <ul className="space-y-3 list-disc pl-5">
                                                    <li><strong className="text-emerald-300">Crear Proyecto:</strong> Asigna un proyecto a un cliente, define el precio total, la moneda, y la fecha de entrega (<em>deadline</em>). Si es urgente, marca "Alta Prioridad" para que parpadee en rojo.</li>
                                                    <li><strong className="text-emerald-300">Tablero Kanban:</strong> Arrastra las tarjetas de los proyectos entre las columnas: <em>Pendiente ➔ En Proceso ➔ En Revisión ➔ Finalizado</em>.</li>
                                                </ul>

                                                <h3 className="text-lg font-semibold text-white mt-6 mb-2">Registro de Pagos y Facturas:</h3>
                                                <ul className="space-y-3 list-disc pl-5">
                                                    <li><strong className="text-emerald-300">Registrar Pago:</strong> Desde el perfil del cliente o proyecto, haz clic en "Registrar Pago". El sistema te dirá cuánto debe el cliente. Ingresa el monto pagado y la cuenta bancaria donde recibiste el dinero.</li>
                                                    <li className="text-yellow-400 bg-yellow-400/10 p-2 rounded border border-yellow-400/20 text-sm">
                                                        <em>Nota:</em> Al registrar el pago aquí, <strong>el dinero se suma automáticamente a tu saldo en el módulo de Finanzas</strong>.
                                                    </li>
                                                    <li><strong className="text-emerald-300">Generar Recibo:</strong> Tras guardar el pago, puedes descargar un recibo en PDF para enviárselo al cliente.</li>
                                                </ul>

                                                <hr className="border-white/10 my-8" />

                                                {/* SECCIÓN 4 */}
                                                <h2 className="text-xl font-bold text-emerald-400 flex items-center gap-2 mt-8 mb-4">
                                                    <span className="bg-emerald-500/10 p-2 rounded-lg text-2xl">💰</span>
                                                    4. FINANZAS Y CFO VIRTUAL (ONYX)
                                                </h2>
                                                <p className="text-sm italic text-gray-400 mb-4">Control contable automatizado. Olvídate de Excel.</p>

                                                <h3 className="text-lg font-semibold text-white mt-6 mb-2">Cuentas y Transacciones:</h3>
                                                <ul className="space-y-3 list-disc pl-5">
                                                    <li><strong className="text-emerald-300">Tus Cuentas:</strong> Crea billeteras virtuales que reflejen tus cuentas reales (Bancolombia, Nequi, PayPal, Efectivo).</li>
                                                    <li><strong className="text-emerald-300">Tablero Principal:</strong> Muestra cuánto ha entrado este mes, cuánto ha salido, y tu Saldo Total real.</li>
                                                    <li><strong className="text-emerald-300">Movimientos Manuales:</strong> Usa el botón "+ Nuevo" para registrar un gasto (Ej: Comida) o un ingreso extra, eligiendo de qué cuenta sale el dinero.</li>
                                                </ul>

                                                <h3 className="text-lg font-semibold text-white mt-6 mb-2">Gastos Fijos (Recurrentes):</h3>
                                                <ul className="space-y-3 list-disc pl-5">
                                                    <li>Ve a la pestaña "Gastos Recurrentes". Agrega cosas que pagas cada mes (Arriendo, Software, Suscripciones) y diles qué día del mes vencen.</li>
                                                    <li><strong className="text-emerald-300">Botón "Pagar":</strong> Cuando llegue el día, presiona "Pagar". El sistema descontará el dinero de tu cuenta bancaria y saltará automáticamente la fecha de cobro para el mes siguiente.</li>
                                                    <li><strong className="text-emerald-300">Semáforo de Liquidez:</strong> Si tu Saldo Total es mayor a la suma de tus Gastos Fijos, el semáforo estará en verde. Si no te alcanza para sobrevivir el mes, se pondrá en alerta roja.</li>
                                                </ul>

                                                <h3 className="text-lg font-semibold text-emerald-400 mt-6 mb-3 bg-white/5 p-3 rounded-xl flex items-center gap-2">
                                                    <span>🤖</span> Onyx, el CFO Virtual (IA)
                                                </h3>
                                                <p className="mb-2">En el tablero de finanzas verás un chat interactivo.</p>
                                                <ul className="space-y-3 list-disc pl-5">
                                                    <li>Puedes preguntarle datos: <em>"¿Cuánto he gastado en transporte este mes?"</em></li>
                                                    <li><strong className="text-emerald-300">Puede ejecutar órdenes:</strong> Escribe <em>"Anota que gasté 30 USD en Uber"</em> y la Inteligencia Artificial registrará el movimiento automáticamente en tu base de datos bajo la categoría correcta.</li>
                                                </ul>

                                                <hr className="border-white/10 my-8" />

                                                {/* SECCIÓN 5 */}
                                                <h2 className="text-xl font-bold text-emerald-400 flex items-center gap-2 mt-8 mb-4">
                                                    <span className="bg-emerald-500/10 p-2 rounded-lg text-2xl">📅</span>
                                                    5. CALENDARIO MAESTRO
                                                </h2>
                                                <p className="text-sm italic text-gray-400 mb-4">Un centro de comando temporal que une finanzas, proyectos y notas. Es interactivo (Drag & Drop).</p>

                                                <h3 className="text-lg font-semibold text-white mt-6 mb-2">¿Qué aparece en tu calendario?</h3>
                                                <ol className="space-y-3 list-decimal pl-5">
                                                    <li><strong className="text-yellow-400">Eventos Amarillos/Azules (Notas):</strong> Haz clic en cualquier día para escribir un recordatorio o arrástralo a otro día.</li>
                                                    <li><strong className="text-purple-400">Eventos Morados (Proyectos):</strong> Aparecen de forma automática según la fecha de entrega que le pusiste a los proyectos en el módulo de Clientes.</li>
                                                    <li><strong className="text-emerald-400">Eventos Verdes (Cobros):</strong> Muestra los días exactos en que los clientes te hicieron un pago.</li>
                                                    <li><strong className="text-red-400">Eventos Rojos (Gastos Fijos):</strong> El sistema dibuja alertas rojas (con un ícono de billete) en los días en que tienes que pagar un gasto recurrente, permitiéndote prever tus salidas de efectivo.</li>
                                                </ol>

                                                <hr className="border-white/10 my-8" />

                                                {/* SECCIÓN 6 */}
                                                <h2 className="text-xl font-bold text-emerald-400 flex items-center gap-2 mt-8 mb-4">
                                                    <span className="bg-emerald-500/10 p-2 rounded-lg text-2xl">🧘‍♂️</span>
                                                    6. PRODUCTIVIDAD, HÁBITOS Y GAMIFICACIÓN
                                                </h2>
                                                <p className="text-sm italic text-gray-400 mb-4">El módulo diseñado para cuidarte del desgaste profesional (burnout).</p>

                                                <h3 className="text-lg font-semibold text-white mt-6 mb-2">Componentes del Rendimiento:</h3>
                                                <ul className="space-y-3 list-disc pl-5">
                                                    <li><strong className="text-emerald-300">Body Battery:</strong> Al iniciar y terminar el día, califica tu energía Física y Mental del 1 al 10. Un gráfico ("BioDataChart") te mostrará tus picos y caídas de energía durante la semana.</li>
                                                    <li><strong className="text-emerald-300">Tracker de Hábitos:</strong> Crea rutinas (Ej: "Leer", "Gimnasio", "Meditar") y diles cuántas veces a la semana quieres cumplirlas. Haz clic en el círculo de hoy para marcarlas como hechas.</li>
                                                    <li><strong className="text-emerald-300">Diario (Daily Journal):</strong> Un espacio de texto libre para vaciar tu mente, planear tu día o reflexionar por la noche.</li>
                                                </ul>

                                                <h3 className="text-lg font-semibold text-white mt-6 mb-2">Deep Work (Trabajo Profundo):</h3>
                                                <ul className="space-y-3 list-disc pl-5">
                                                    <li>Elige un proyecto de tu lista de clientes, ajusta el temporizador (ej. 60 minutos) y dale "Play".</li>
                                                    <li>Todo el tiempo que registres aquí se guarda. Esto es lo que usa el Tablero del CEO para calcular tu <em>Valor Hora Real</em>.</li>
                                                </ul>

                                                <h3 className="text-lg font-semibold text-indigo-400 mt-6 mb-3 bg-indigo-500/10 p-3 rounded-xl flex items-center gap-2 border border-indigo-500/20">
                                                    <span>🎮</span> Sistema RPG (Niveles y XP)
                                                </h3>
                                                <p className="mb-2 italic text-gray-400">Tu negocio ahora es un juego de rol.</p>
                                                <ul className="space-y-3 list-disc pl-5">
                                                    <li>Arriba verás tu <strong>Barra de Nivel</strong>.</li>
                                                    <li>Cada vez que completas un hábito, haces una sesión de Deep Work, o registras un pago de un cliente, ganas <strong className="text-indigo-300">Puntos de Experiencia (XP)</strong>.</li>
                                                    <li>Al acumular suficiente XP, subirás de nivel, dándote un incentivo psicológico constante para mantener la disciplina operativa y financiera.</li>
                                                </ul>

                                                <div className="h-20"></div> {/* Espacio para el final de la página */}
                                            </div>
                                        </div>
                                    </div>
                                </Dialog.Panel>
                            </Transition.Child>
                        </div>
                    </div>
                </div>
            </Dialog>
        </Transition.Root>
    );
}
