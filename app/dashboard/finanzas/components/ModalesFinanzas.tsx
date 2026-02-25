"use client";

import { useState, useEffect, useRef } from "react";
import { TrashIcon, PencilIcon, XMarkIcon, ArrowUturnLeftIcon, ExclamationTriangleIcon, CalendarDaysIcon, BanknotesIcon, CameraIcon } from "@heroicons/react/24/outline";
import { toast } from "sonner";
import { Button } from "@/app/components/ui/Button";

// --- HELPERS & CONSTANTS ---

const CATEGORIAS_BASE = [
    "Vivienda", "Servicios", "Suscripciones", "Transporte",
    "Alimentación", "Salud", "Educación", "Deudas",
    "Ocio", "Mascotas", "Seguros", "Impuestos", "Negocio", "Nómina", "Varios"
];

const getFechaHoyISO = () => new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0];

// --- COMPONENTS ---

export function ModalDetalleGasto({ isOpen, onClose, gasto, movimientos }: any) {
    if (!isOpen || !gasto) return null;

    // 🟢 CORREGIDO: Buscamos en 'descripcion' en lugar de 'referencia'
    const historial = movimientos.filter((m: any) =>
        (m.tipo === 'gasto' && (m.descripcion || m.referencia || "").toLowerCase().includes(gasto.nombre.toLowerCase()))
    ).sort((a: any, b: any) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());

    const totalPagado = historial.reduce((acc: number, curr: any) => acc + curr.monto, 0);

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in zoom-in-95">
            <div className="bg-[#1C2128] border border-white/10 w-full max-w-lg rounded-2xl p-6 shadow-2xl relative">
                <button onClick={onClose} className="absolute top-4 right-4 p-1 hover:bg-white/10 rounded-full text-gray-400 hover:text-white"><XMarkIcon className="w-6 h-6" /></button>

                <div className="flex items-center gap-3 mb-6">
                    <div className="bg-indigo-500/20 p-3 rounded-xl">
                        <CalendarDaysIcon className="w-8 h-8 text-indigo-400" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-white capitalize">{gasto.nombre}</h2>
                        <p className="text-gray-400 text-sm">Información e Historial</p>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                        <p className="text-xs text-gray-500 uppercase font-bold">Costo Mensual</p>
                        <p className="text-xl font-mono text-white font-bold">${gasto.monto.toLocaleString()}</p>
                    </div>
                    <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                        <p className="text-xs text-gray-500 uppercase font-bold">Total Pagado</p>
                        <p className="text-xl font-mono text-emerald-400 font-bold">${totalPagado.toLocaleString()}</p>
                    </div>
                </div>

                <h3 className="text-white font-bold text-sm mb-3 flex items-center gap-2">
                    <BanknotesIcon className="w-4 h-4 text-gray-400" /> Historial de Pagos
                </h3>

                <div className="space-y-2 max-h-60 overflow-y-auto pr-1 custom-scrollbar">
                    {historial.length === 0 ? (
                        <p className="text-center text-gray-500 text-sm py-4 italic">Aún no hay pagos registrados.</p>
                    ) : (
                        historial.map((h: any) => (
                            <div key={h.id} className="flex justify-between items-center p-3 bg-white/5 rounded-xl border border-white/5 hover:bg-white/10 transition">
                                <div>
                                    <p className="text-white text-sm font-bold">{new Date(h.fecha).toLocaleDateString('es-ES', { dateStyle: 'long' })}</p>
                                    <p className="text-[10px] text-gray-500 uppercase">{h.cuenta_nombre || 'Cuenta Principal'}</p>
                                </div>
                                <span className="text-emerald-400 font-mono font-bold">-${h.monto.toLocaleString()}</span>
                            </div>
                        ))
                    )}
                </div>

                <Button onClick={onClose} variant="secondary" className="w-full mt-6">
                    Cerrar
                </Button>
            </div>
        </div>
    );
}

export function ModalMovimiento({ isOpen, onClose, onSave, cuentas, movimientoEditar, config }: any) {
    // 🟢 CORREGIDO: Usamos 'descripcion' en el estado inicial
    const [form, setForm] = useState({
        tipo: "gasto",
        monto: "",
        moneda: config?.meta_moneda || "USD",
        descripcion: "", // Antes 'referencia'
        categoria: "Varios",
        fecha: getFechaHoyISO(),
        cuenta_id: ""
    });
    const [usarInputTexto, setUsarInputTexto] = useState(false);
    const [isScanning, setIsScanning] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen) {
            if (movimientoEditar) {
                setForm({
                    tipo: movimientoEditar.tipo,
                    monto: movimientoEditar.monto,
                    moneda: movimientoEditar.moneda || "USD",
                    descripcion: movimientoEditar.descripcion || movimientoEditar.referencia || "", // Adaptador
                    categoria: movimientoEditar.categoria,
                    fecha: movimientoEditar.fecha,
                    cuenta_id: movimientoEditar.cuenta_id || ""
                });
                if (!CATEGORIAS_BASE.includes(movimientoEditar.categoria)) {
                    setUsarInputTexto(true);
                }
            } else {
                setForm({ tipo: "egreso", monto: "", moneda: config?.meta_moneda || "USD", descripcion: "", categoria: "Varios", fecha: getFechaHoyISO(), cuenta_id: "" });
                setUsarInputTexto(false);
            }
        }
    }, [isOpen, movimientoEditar]);

    if (!isOpen) return null;

    const handleSubmit = () => {
        if (!form.cuenta_id) return toast.error("⚠️ Selecciona una CUENTA.");
        if (!form.monto) return toast.error("⚠️ Falta el monto.");

        // VALIDACIÓN DE SALDOS ESTRICTA (COMO UN BANCO)
        if (form.tipo === 'egreso' || form.tipo === 'gasto') {
            const cuentaSeleccionada = (cuentas || []).find((c: any) => c.id === form.cuenta_id);
            if (cuentaSeleccionada) {
                const montoIntento = Number(form.monto);
                const saldoActual = Number(cuentaSeleccionada.saldo_calculado || 0);

                if (montoIntento > saldoActual) {
                    toast.error(`❌ Transacción rechazada: Fondos insuficientes en "${cuentaSeleccionada.nombre}". Tu saldo actual es $${saldoActual.toLocaleString('en-US')}.`);
                    return; // ⛔ ESTO DETIENE LA EJECUCIÓN, NO DEJA CREAR EL GASTO
                }
            }
        }

        const categoriaFinal = form.categoria.trim() === "" ? "Varios" : form.categoria;

        onSave({
            ...form,
            categoria: categoriaFinal,
            monto: Number(form.monto),
        });
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Resetear el input para permitir subir el mismo archivo después
        if (fileInputRef.current) fileInputRef.current.value = "";

        setIsScanning(true);
        const loadingToast = toast.loading("👀 Onyx está leyendo tu recibo...");

        try {
            // Convertir a base64
            const base64Data = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.readAsDataURL(file);
                reader.onload = () => resolve(reader.result as string);
                reader.onerror = error => reject(error);
            });

            // Separar el base64 real del encabezado data:image/...
            const base64Part = base64Data.split(',')[1];
            const mimeType = file.type;

            const response = await fetch('/api/vision', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ image: base64Part, mimeType })
            });

            if (!response.ok) throw new Error("Error en el servidor");

            const data = await response.json();

            if (data.error) {
                throw new Error(data.error);
            }

            // Mapear los datos al formulario
            setForm(prev => ({
                ...prev,
                monto: data.monto ? String(data.monto) : prev.monto,
                descripcion: data.descripcion || prev.descripcion,
                categoria: data.categoria || prev.categoria,
                fecha: data.fecha || prev.fecha
            }));

            // Si la categoría devuelta no es base, habilitar input texto
            if (data.categoria && !CATEGORIAS_BASE.includes(data.categoria)) {
                setUsarInputTexto(true);
            }

            toast.success("✨ ¡Recibo escaneado y extraído!", { id: loadingToast });

        } catch (error: any) {
            console.error(error);
            toast.error(error.message || "❌ No se pudo procesar la imagen.", { id: loadingToast });
        } finally {
            setIsScanning(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in">
            <div className={`bg-[#1C2128] border border-white/10 p-6 rounded-2xl w-full max-w-md shadow-2xl transition-all ${isScanning ? 'opacity-80 scale-[0.98]' : ''}`}>
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-white font-bold text-xl">{movimientoEditar ? 'Editar Movimiento' : 'Registrar Transacción'}</h3>
                    {!movimientoEditar && (
                        <div>
                            <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleFileChange} />
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isScanning}
                                className="bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600/40 p-2 rounded-xl flex items-center gap-2 text-sm font-bold transition"
                                title="Escanear Recibo / Factura"
                            >
                                <CameraIcon className={`w-5 h-5 ${isScanning ? 'animate-pulse' : ''}`} />
                                {isScanning ? 'Mágia...' : 'Escanear'}
                            </button>
                        </div>
                    )}
                </div>

                <div className={`space-y-4 ${isScanning ? 'pointer-events-none grayscale opacity-50' : ''}`}>
                    <div className="grid grid-cols-2 gap-3">
                        <button
                            onClick={() => setForm({ ...form, tipo: "ingreso" })}
                            className={`py-3 rounded-xl font-bold transition ${form.tipo === 'ingreso' ? 'bg-emerald-600 text-white shadow-lg' : 'bg-black/40 text-gray-500 border border-white/5'}`}
                        >
                            💰 Ingreso
                        </button>
                        <button
                            onClick={() => setForm({ ...form, tipo: "gasto" })}
                            className={`py-3 rounded-xl font-bold transition ${form.tipo === 'gasto' ? 'bg-red-600 text-white shadow-lg' : 'bg-black/40 text-gray-500 border border-white/5'}`}
                        >
                            💸 Gasto
                        </button>
                    </div>

                    <div className="flex gap-2">
                        <input type="number" placeholder="0.00" className="flex-1 bg-[#0F1115] border border-gray-700 p-3 rounded-xl text-white text-xl outline-none" value={form.monto} onChange={e => setForm({ ...form, monto: e.target.value })} />
                        <select className="w-24 bg-[#0F1115] border border-gray-700 p-3 rounded-xl text-white outline-none" value={form.moneda} onChange={e => setForm({ ...form, moneda: e.target.value })}>
                            {(config?.monedas_activas || ["USD", "COP"]).map((m: string) => <option key={m} value={m}>{m}</option>)}
                        </select>
                    </div>

                    {/* 🟢 CORREGIDO: Input mapeado a descripcion */}
                    <input
                        placeholder="Descripción..."
                        className="w-full bg-[#0F1115] border border-gray-700 p-3 rounded-xl text-white outline-none"
                        value={form.descripcion}
                        onChange={e => setForm({ ...form, descripcion: e.target.value })}
                    />

                    <div className="grid grid-cols-2 gap-3">
                        <select className="w-full bg-[#0F1115] border border-gray-700 p-3 rounded-xl text-white outline-none" value={form.cuenta_id} onChange={e => setForm({ ...form, cuenta_id: e.target.value })}>
                            <option value="">Cuenta...</option>
                            {cuentas?.map((c: any) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                        </select>
                        <input type="date" className="w-full bg-[#0F1115] border border-gray-700 p-3 rounded-xl text-white outline-none" value={form.fecha} onChange={e => setForm({ ...form, fecha: e.target.value })} />
                    </div>

                    {usarInputTexto ? (
                        <div className="flex gap-2 animate-in fade-in">
                            <input autoFocus placeholder="Categoría..." className="flex-1 bg-[#0F1115] border border-emerald-500 p-3 rounded-xl text-white outline-none" value={form.categoria} onChange={e => setForm({ ...form, categoria: e.target.value })} />
                            <button onClick={() => { setUsarInputTexto(false); setForm({ ...form, categoria: "Varios" }); }} className="bg-white/10 px-3 rounded-xl text-white hover:bg-white/20"><ArrowUturnLeftIcon className="w-5 h-5" /></button>
                        </div>
                    ) : (
                        <select className="w-full bg-[#0F1115] border border-gray-700 p-3 rounded-xl text-white outline-none" value={form.categoria} onChange={e => { if (e.target.value === 'custom') { setUsarInputTexto(true); setForm({ ...form, categoria: "" }); } else { setForm({ ...form, categoria: e.target.value }); } }}>
                            {CATEGORIAS_BASE.map(c => <option key={c} value={c}>{c}</option>)}
                            <option value="custom" className="font-bold bg-indigo-900">+ Crear Nueva...</option>
                        </select>
                    )}

                    <div className="flex justify-end gap-3 pt-4 border-t border-white/5 mt-2">
                        <Button onClick={onClose} variant="ghost">Cancelar</Button>
                        <Button onClick={handleSubmit} variant="primary">
                            {movimientoEditar ? 'Actualizar' : 'Guardar'}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export function ModalPresupuesto({ isOpen, onClose, onSave, presupuestoEditar, config }: any) {
    const [form, setForm] = useState({ categoria: "Alimentación", monto_limite: "", moneda: config?.meta_moneda || "USD" });

    useEffect(() => {
        if (isOpen) {
            if (presupuestoEditar) {
                setForm({ categoria: presupuestoEditar.categoria, monto_limite: presupuestoEditar.monto_limite, moneda: presupuestoEditar.moneda || "USD" });
            } else {
                setForm({ categoria: "Alimentación", monto_limite: "", moneda: config?.meta_moneda || "USD" });
            }
        }
    }, [isOpen, presupuestoEditar]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in">
            <div className="bg-[#1C2128] border border-white/10 p-6 rounded-2xl w-full max-w-md shadow-2xl">
                <h3 className="text-white font-bold mb-4">{presupuestoEditar ? 'Editar Límite' : 'Nuevo Límite de Gasto'}</h3>
                <div className="space-y-4">
                    <select className="w-full bg-[#0F1115] border border-gray-700 p-3 rounded-xl text-white outline-none capitalize" value={form.categoria} onChange={e => setForm({ ...form, categoria: e.target.value })}>
                        {CATEGORIAS_BASE.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <div className="flex gap-2">
                        <input type="number" placeholder="Límite" className="flex-1 bg-[#0F1115] border border-gray-700 p-3 rounded-xl text-white outline-none" value={form.monto_limite} onChange={e => setForm({ ...form, monto_limite: e.target.value })} />
                        <select className="w-24 bg-[#0F1115] border border-gray-700 p-3 rounded-xl text-white outline-none" value={form.moneda} onChange={e => setForm({ ...form, moneda: e.target.value })}>
                            {(config?.monedas_activas || ["USD", "COP"]).map((m: string) => <option key={m} value={m}>{m}</option>)}
                        </select>
                    </div>
                    <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
                        <Button onClick={onClose} variant="ghost">Cancelar</Button>
                        <Button onClick={() => onSave({ ...form, monto_limite: Number(form.monto_limite) })} variant="primary" className="bg-indigo-600 hover:bg-indigo-500 shadow-indigo-500/20">
                            {presupuestoEditar ? 'Actualizar' : 'Crear'}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export function ModalGastoFijo({ isOpen, onClose, onSave, gastoEditar, cuentas, config }: any) {
    const [form, setForm] = useState({ nombre: "", monto: "", moneda: config?.meta_moneda || "USD", fecha_inicio: getFechaHoyISO(), categoria: "Servicios", cuenta_id: "" });
    const [usarInputTexto, setUsarInputTexto] = useState(false);

    useEffect(() => {
        if (isOpen) {
            if (gastoEditar) {
                const hoy = new Date();
                const dia = gastoEditar.dia_pago || 1;
                const localTime = new Date(hoy.getFullYear(), hoy.getMonth(), dia).getTime() - new Date().getTimezoneOffset() * 60000;
                const fechaReconstruida = new Date(localTime).toISOString().split('T')[0];
                setForm({ nombre: gastoEditar.nombre, monto: gastoEditar.monto, moneda: gastoEditar.moneda || "USD", fecha_inicio: fechaReconstruida, categoria: gastoEditar.categoria, cuenta_id: gastoEditar.cuenta_id || "" });
                if (!CATEGORIAS_BASE.includes(gastoEditar.categoria)) setUsarInputTexto(true);
            } else {
                setForm({ nombre: "", monto: "", moneda: config?.meta_moneda || "USD", fecha_inicio: getFechaHoyISO(), categoria: "Servicios", cuenta_id: "" });
                setUsarInputTexto(false);
            }
        }
    }, [isOpen, gastoEditar]);

    const handleGuardar = () => {
        const diaPago = parseInt(form.fecha_inicio.split('-')[2]);
        onSave({ ...form, monto: Number(form.monto), dia_pago: diaPago });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in">
            <div className="bg-[#1C2128] border border-white/10 p-6 rounded-2xl w-full max-w-md shadow-2xl">
                <h3 className="text-white font-bold mb-4">{gastoEditar ? 'Editar Gasto Recurrente' : 'Nuevo Gasto Recurrente'}</h3>
                <div className="space-y-4">
                    <input placeholder="Nombre (ej: Netflix)" className="w-full bg-[#0F1115] border border-gray-700 p-3 rounded-xl text-white outline-none focus:border-indigo-500 transition" value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} autoFocus />

                    <div className="grid grid-cols-2 gap-3">
                        <input type="number" placeholder="Monto" className="w-full bg-[#0F1115] border border-gray-700 p-3 rounded-xl text-white outline-none" value={form.monto} onChange={e => setForm({ ...form, monto: e.target.value })} />
                        <select className="w-full bg-[#0F1115] border border-gray-700 p-3 rounded-xl text-white outline-none" value={form.moneda} onChange={e => setForm({ ...form, moneda: e.target.value })}>
                            {(config?.monedas_activas || ["USD", "COP"]).map((m: string) => <option key={m} value={m}>{m}</option>)}
                        </select>
                    </div>

                    <select className="w-full bg-[#0F1115] border border-gray-700 p-3 rounded-xl text-white outline-none" value={form.cuenta_id} onChange={e => setForm({ ...form, cuenta_id: e.target.value })}>
                        <option value="">-- Cuenta Predeterminada (Opcional) --</option>
                        {cuentas?.map((c: any) => <option key={c.id} value={c.id}>{c.nombre} ({c.moneda})</option>)}
                    </select>

                    <div className="grid grid-cols-2 gap-3 items-center">
                        <div className="bg-[#0F1115] border border-gray-700 p-3 rounded-xl flex flex-col justify-center">
                            <span className="text-gray-500 text-[10px] uppercase font-bold mb-1">Inicia el / Día de Pago</span>
                            <input type="date" className="w-full bg-transparent text-white font-bold outline-none text-sm" value={form.fecha_inicio} onChange={e => setForm({ ...form, fecha_inicio: e.target.value })} />
                        </div>
                        {usarInputTexto ? (
                            <div className="flex gap-2">
                                <input placeholder="Categoría..." className="w-full bg-[#0F1115] border border-indigo-500 p-3 rounded-xl text-white outline-none" value={form.categoria} onChange={e => setForm({ ...form, categoria: e.target.value })} />
                                <button onClick={() => { setUsarInputTexto(false); setForm({ ...form, categoria: "Servicios" }); }} className="bg-white/10 px-2 rounded-xl text-white hover:bg-white/20"><ArrowUturnLeftIcon className="w-4 h-4" /></button>
                            </div>
                        ) : (
                            <select className="w-full bg-[#0F1115] border border-gray-700 p-3 rounded-xl text-white outline-none capitalize h-full" value={form.categoria} onChange={e => { if (e.target.value === 'custom') { setUsarInputTexto(true); setForm({ ...form, categoria: "" }); } else { setForm({ ...form, categoria: e.target.value }); } }}>
                                {CATEGORIAS_BASE.map(c => <option key={c} value={c}>{c}</option>)}
                                <option value="custom" className="font-bold bg-indigo-900">+ Nueva...</option>
                            </select>
                        )}
                    </div>
                    <div className="flex justify-end gap-3 pt-4 border-t border-white/5 mt-2">
                        <Button onClick={onClose} variant="ghost">Cancelar</Button>
                        <Button onClick={handleGuardar} variant="primary" className="bg-indigo-600 hover:bg-indigo-500 shadow-indigo-500/20">
                            {gastoEditar ? 'Actualizar' : 'Guardar'}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export function ModalConfirmacion({ isOpen, onClose, onConfirm, titulo, mensaje }: any) {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 z-[60] animate-in zoom-in-95">
            <div className="bg-[#1C2128] border border-red-500/30 p-6 rounded-2xl w-full max-w-sm shadow-2xl">
                <div className="flex flex-col items-center text-center">
                    <div className="bg-red-500/10 p-3 rounded-full mb-4">
                        <ExclamationTriangleIcon className="w-8 h-8 text-red-500" />
                    </div>
                    <h3 className="text-white font-bold text-xl mb-2">{titulo}</h3>
                    <p className="text-gray-400 text-sm mb-6">{mensaje}</p>
                    <div className="flex gap-3 w-full">
                        <Button onClick={onClose} variant="secondary" className="flex-1 bg-gray-800 hover:bg-gray-700">
                            Cancelar
                        </Button>
                        <Button onClick={() => { onConfirm(); onClose(); }} variant="danger" className="flex-1">
                            Sí, Eliminar
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export function ModalPagarGasto({ isOpen, onClose, onConfirm, gasto, cuentas }: any) {
    const [cuentaId, setCuentaId] = useState("");

    useEffect(() => {
        if (isOpen && gasto) {
            setCuentaId(gasto.cuenta_id || (cuentas.length > 0 ? cuentas[0].id : ""));
        }
    }, [isOpen, gasto, cuentas]);

    if (!isOpen || !gasto) return null;

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in">
            <div className="bg-[#1C2128] border border-white/10 p-6 rounded-2xl w-full max-w-sm shadow-2xl">
                <div className="flex flex-col items-center text-center">
                    <div className="bg-emerald-500/10 p-4 rounded-full mb-4">
                        <BanknotesIcon className="w-8 h-8 text-emerald-500" />
                    </div>

                    <h3 className="text-white font-bold text-xl mb-1">Pagar {gasto.nombre}</h3>
                    <p className="text-emerald-400 font-mono text-2xl font-bold mb-6">
                        ${Number(gasto.monto).toLocaleString()} <span className="text-sm text-emerald-500/70">{gasto.moneda}</span>
                    </p>

                    <div className="w-full text-left mb-6">
                        <label className="text-xs text-gray-500 uppercase font-bold block mb-2">Selecciona la cuenta de salida:</label>
                        <select
                            className="w-full bg-[#0F1115] border border-gray-700 p-3 rounded-xl text-white outline-none focus:border-emerald-500 transition"
                            value={cuentaId}
                            onChange={(e) => setCuentaId(e.target.value)}
                        >
                            <option value="">-- Seleccionar Cuenta --</option>
                            {cuentas?.map((c: any) => (
                                <option key={c.id} value={c.id}>{c.nombre} ({c.moneda})</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex gap-3 w-full">
                        <Button onClick={onClose} variant="ghost" className="flex-1">
                            Cancelar
                        </Button>
                        <Button
                            onClick={() => {
                                if (!cuentaId) return toast.error("Selecciona una cuenta");
                                onConfirm(cuentaId);
                            }}
                            disabled={!cuentaId}
                            className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl shadow-lg shadow-emerald-900/20"
                        >
                            Confirmar Pago
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}