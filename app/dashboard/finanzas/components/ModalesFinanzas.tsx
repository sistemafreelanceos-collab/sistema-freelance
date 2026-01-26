"use client";
import { useState, useEffect } from "react";
import { TrashIcon, PencilIcon, XMarkIcon, ArrowUturnLeftIcon } from "@heroicons/react/24/outline";

// LISTA BASE DE CATEGORÍAS
const CATEGORIAS_BASE = [
    "Vivienda", "Servicios", "Suscripciones", "Transporte", 
    "Alimentación", "Salud", "Educación", "Deudas", 
    "Ocio", "Mascotas", "Seguros", "Impuestos", "Negocio", "Nómina", "Varios"
];

// FECHA SEGURA
const getFechaHoyISO = () => {
    const hoy = new Date();
    const offset = hoy.getTimezoneOffset() * 60000;
    return new Date(hoy.getTime() - offset).toISOString().split('T')[0];
};

// =========================================================
// 1. MODAL PAGAR CUOTA
// =========================================================
export function ModalPagarGasto({ isOpen, onClose, onConfirm, gasto, cuentas }: any) {
    const [form, setForm] = useState({
        fecha: getFechaHoyISO(),
        comprobante: "",
        cuenta_id: ""
    });

    if (!isOpen || !gasto) return null;

    const handleSubmit = () => {
        if (!form.cuenta_id) return alert("Selecciona una cuenta para pagar.");
        onConfirm(gasto, form);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in">
            <div className="bg-[#1C2128] border border-white/10 p-6 rounded-2xl w-full max-w-sm shadow-2xl">
                <h3 className="text-white font-bold text-lg mb-1">Pagar {gasto.nombre}</h3>
                <p className="text-gray-400 text-sm mb-4">Registrar pago de ${Number(gasto.monto).toLocaleString()}</p>
                <div className="space-y-4">
                    <div>
                        <label className="text-xs text-gray-400 block mb-1">Cuenta de Origen</label>
                        <select className="w-full bg-[#0F1115] border border-gray-700 p-3 rounded-xl text-white outline-none" value={form.cuenta_id} onChange={e => setForm({...form, cuenta_id: e.target.value})}>
                            <option value="">Seleccionar...</option>
                            {cuentas?.map((c: any) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="text-xs text-gray-400 block mb-1">Fecha Real de Pago</label>
                        <input type="date" className="w-full bg-[#0F1115] border border-gray-700 p-3 rounded-xl text-white outline-none" value={form.fecha} onChange={e => setForm({...form, fecha: e.target.value})} />
                    </div>
                    <div>
                        <label className="text-xs text-gray-400 block mb-1">Comprobante / Notas (Opcional)</label>
                        <input type="text" placeholder="Ej: Transferencia #1234" className="w-full bg-[#0F1115] border border-gray-700 p-3 rounded-xl text-white outline-none" value={form.comprobante} onChange={e => setForm({...form, comprobante: e.target.value})} />
                    </div>
                    <div className="flex gap-2 pt-2">
                        <button onClick={onClose} className="flex-1 py-3 text-gray-400 hover:text-white">Cancelar</button>
                        <button onClick={handleSubmit} className="flex-1 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-500">Confirmar Pago</button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// =========================================================
// 2. MODAL DETALLE E HISTORIAL
// =========================================================
export function ModalDetalleGasto({ isOpen, onClose, gasto, movimientos, onEdit, onDelete }: any) {
    if (!isOpen || !gasto) return null;

    const historial = movimientos.filter((m: any) => 
        m.fuente === 'recurrente' && m.referencia.includes(gasto.nombre)
    );

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in zoom-in-95">
            <div className="bg-[#1C2128] border border-white/10 w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
                <div className="p-6 border-b border-white/5 bg-[#161B22] flex justify-between items-start">
                    <div>
                        <h2 className="text-2xl font-bold text-white">{gasto.nombre}</h2>
                        <span className="text-xs bg-indigo-500/20 text-indigo-300 px-2 py-1 rounded mt-2 inline-block capitalize">{gasto.categoria}</span>
                    </div>
                    <button onClick={onClose} className="text-gray-500 hover:text-white"><XMarkIcon className="w-6 h-6"/></button>
                </div>
                <div className="p-6 overflow-y-auto">
                    <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="bg-black/20 p-3 rounded-xl border border-white/5">
                            <p className="text-xs text-gray-500">Monto Fijo</p>
                            <p className="text-xl font-mono text-white font-bold">${Number(gasto.monto).toLocaleString()} <span className="text-xs text-gray-500">{gasto.moneda}</span></p>
                        </div>
                        <div className="bg-black/20 p-3 rounded-xl border border-white/5">
                            <p className="text-xs text-gray-500">Día de Pago</p>
                            <p className="text-xl font-white font-bold text-white">Día {gasto.dia_pago}</p>
                        </div>
                    </div>
                    <h3 className="text-sm font-bold text-gray-400 mb-3 uppercase tracking-wider">Historial de Pagos</h3>
                    <div className="space-y-2 mb-6">
                        {historial.length === 0 ? (
                            <p className="text-gray-600 text-sm italic">No hay pagos registrados aún.</p>
                        ) : (
                            historial.map((h: any) => (
                                <div key={h.id} className="flex justify-between items-center p-3 bg-white/5 rounded-lg border border-white/5">
                                    <div>
                                        <p className="text-white text-sm font-bold">{new Date(h.fecha).toLocaleDateString()}</p>
                                        <p className="text-[10px] text-gray-400">{h.referencia}</p>
                                    </div>
                                    <p className="text-emerald-400 font-mono text-sm font-bold">${h.monto.toLocaleString()}</p>
                                </div>
                            ))
                        )}
                    </div>
                    <div className="flex gap-3 pt-4 border-t border-white/10">
                        <button onClick={() => { onEdit(gasto); onClose(); }} className="flex-1 flex items-center justify-center gap-2 py-3 bg-blue-600/20 text-blue-400 border border-blue-500/30 rounded-xl hover:bg-blue-600/30 transition font-bold text-sm"><PencilIcon className="w-4 h-4" /> Editar</button>
                        <button onClick={() => { onDelete(gasto.id); onClose(); }} className="flex-1 flex items-center justify-center gap-2 py-3 bg-red-600/20 text-red-400 border border-red-500/30 rounded-xl hover:bg-red-600/30 transition font-bold text-sm"><TrashIcon className="w-4 h-4" /> Eliminar</button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// =========================================================
// 3. MODAL REGISTRAR MOVIMIENTO (SIMPLE)
// =========================================================
export function ModalMovimiento({ isOpen, onClose, onSave, cuentas }: any) {
  const [form, setForm] = useState({ 
    tipo: "egreso", monto: "", moneda: "USD", referencia: "", categoria: "Varios", 
    fecha: getFechaHoyISO(), cuenta_id: ""
  });
  const [usarInputTexto, setUsarInputTexto] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = () => {
      if (!form.cuenta_id) return alert("⚠️ Selecciona una CUENTA.");
      if (!form.monto) return alert("⚠️ Falta el monto.");
      
      const categoriaFinal = form.categoria.trim() === "" ? "Varios" : form.categoria;

      onSave({ 
          ...form, 
          categoria: categoriaFinal, 
          monto: Number(form.monto), 
          fuente: 'manual' 
      });
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in">
        <div className="bg-[#1C2128] border border-white/10 p-6 rounded-2xl w-full max-w-md shadow-2xl">
            <h3 className="text-white font-bold text-xl mb-6">Registrar Transacción</h3>
            <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                    <button onClick={() => setForm({...form, tipo: "ingreso"})} className={`py-3 rounded-xl font-bold transition ${form.tipo === 'ingreso' ? 'bg-emerald-600 text-white shadow-lg' : 'bg-black/40 text-gray-500 border border-white/5'}`}>💰 Ingreso</button>
                    <button onClick={() => setForm({...form, tipo: "egreso"})} className={`py-3 rounded-xl font-bold transition ${form.tipo === 'egreso' ? 'bg-red-600 text-white shadow-lg' : 'bg-black/40 text-gray-500 border border-white/5'}`}>💸 Gasto</button>
                </div>
                <div className="flex gap-2">
                    <input type="number" placeholder="0.00" className="flex-1 bg-[#0F1115] border border-gray-700 p-3 rounded-xl text-white text-xl outline-none" value={form.monto} onChange={e => setForm({...form, monto: e.target.value})} />
                    <select className="w-24 bg-[#0F1115] border border-gray-700 p-3 rounded-xl text-white outline-none" value={form.moneda} onChange={e => setForm({...form, moneda: e.target.value})}><option value="USD">USD</option><option value="COP">COP</option></select>
                </div>
                <input placeholder="Descripción (Ej: Café, Hosting...)" className="w-full bg-[#0F1115] border border-gray-700 p-3 rounded-xl text-white outline-none" value={form.referencia} onChange={e => setForm({...form, referencia: e.target.value})} />
                <div className="grid grid-cols-2 gap-3">
                    <select className="w-full bg-[#0F1115] border border-gray-700 p-3 rounded-xl text-white outline-none" value={form.cuenta_id} onChange={e => setForm({...form, cuenta_id: e.target.value})}>
                        <option value="">Cuenta...</option>
                        {cuentas?.map((c: any) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                    </select>
                    <input type="date" className="w-full bg-[#0F1115] border border-gray-700 p-3 rounded-xl text-white outline-none" value={form.fecha} onChange={e => setForm({...form, fecha: e.target.value})} />
                </div>
                
                {/* CATEGORÍA */}
                {usarInputTexto ? (
                    <div className="flex gap-2 animate-in fade-in">
                        <input autoFocus placeholder="Escribe categoría..." className="flex-1 bg-[#0F1115] border border-emerald-500 p-3 rounded-xl text-white outline-none" value={form.categoria} onChange={e => setForm({...form, categoria: e.target.value})} />
                        <button onClick={() => { setUsarInputTexto(false); setForm({...form, categoria: "Varios"}); }} className="bg-white/10 px-3 rounded-xl text-white hover:bg-white/20"><ArrowUturnLeftIcon className="w-5 h-5"/></button>
                    </div>
                ) : (
                    <select className="w-full bg-[#0F1115] border border-gray-700 p-3 rounded-xl text-white outline-none" value={form.categoria} onChange={e => {
                        if(e.target.value === 'custom') { setUsarInputTexto(true); setForm({...form, categoria: ""}); } else { setForm({...form, categoria: e.target.value}); }
                    }}>
                        {CATEGORIAS_BASE.map(c => <option key={c} value={c}>{c}</option>)}
                        <option value="custom" className="font-bold bg-indigo-900">+ Crear Nueva...</option>
                    </select>
                )}

                <div className="flex justify-end gap-3 pt-4 border-t border-white/5 mt-2">
                    <button onClick={onClose} className="text-gray-400 hover:text-white px-4">Cancelar</button>
                    <button onClick={handleSubmit} className="bg-white text-black font-bold px-8 py-3 rounded-xl hover:scale-105 transition shadow-lg">Guardar</button>
                </div>
            </div>
        </div>
    </div>
  );
}

// =========================================================
// 4. MODAL PRESUPUESTO
// =========================================================
export function ModalPresupuesto({ isOpen, onClose, onSave }: any) {
    const [form, setForm] = useState({ categoria: "Alimentación", monto_limite: "", moneda: "USD" }); 
    if (!isOpen) return null;
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#1C2128] border border-white/10 p-6 rounded-2xl w-full max-w-md">
              <h3 className="text-white font-bold mb-4">Nuevo Límite</h3>
              <div className="space-y-4">
                  <select className="w-full bg-[#0F1115] border border-gray-700 p-3 rounded-xl text-white outline-none capitalize" value={form.categoria} onChange={e => setForm({...form, categoria: e.target.value})}>
                      {CATEGORIAS_BASE.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <div className="flex gap-2">
                      <input type="number" placeholder="Límite" className="flex-1 bg-[#0F1115] border border-gray-700 p-3 rounded-xl text-white outline-none" value={form.monto_limite} onChange={e => setForm({...form, monto_limite: e.target.value})} />
                      <select className="w-24 bg-[#0F1115] border border-gray-700 p-3 rounded-xl text-white outline-none" value={form.moneda} onChange={e => setForm({...form, moneda: e.target.value})}><option value="USD">USD</option><option value="COP">COP</option></select>
                  </div>
                  <div className="flex justify-end gap-3 pt-4">
                      <button onClick={onClose} className="text-gray-500">Cancelar</button>
                      <button onClick={() => onSave({...form, monto_limite: Number(form.monto_limite)})} className="bg-indigo-600 text-white font-bold px-6 py-2 rounded-xl">Crear</button>
                  </div>
              </div>
          </div>
      </div>
    );
}

// =========================================================
// 5. MODAL GASTO FIJO (CON CATEGORÍA PERSONALIZADA)
// =========================================================
export function ModalGastoFijo({ isOpen, onClose, onSave, gastoEditar }: any) {
    const [form, setForm] = useState({ 
        nombre: "", monto: "", moneda: "USD", 
        fecha: getFechaHoyISO(), 
        categoria: "Servicios" 
    });
    
    const [usarInputTexto, setUsarInputTexto] = useState(false);

    useEffect(() => {
        if (gastoEditar) {
            const hoy = new Date();
            const dia = gastoEditar.dia_pago;
            const fechaSegura = new Date(hoy.getFullYear(), hoy.getMonth(), dia);
            const offset = fechaSegura.getTimezoneOffset() * 60000;
            const fechaISO = new Date(fechaSegura.getTime() - offset).toISOString().split('T')[0];

            setForm({
                nombre: gastoEditar.nombre,
                monto: gastoEditar.monto,
                moneda: gastoEditar.moneda || "USD",
                fecha: fechaISO,
                categoria: gastoEditar.categoria
            });
            if (!CATEGORIAS_BASE.includes(gastoEditar.categoria)) {
                setUsarInputTexto(true);
            }
        }
    }, [gastoEditar]);

    if (!isOpen) return null;

    const handleGuardar = () => {
        if(!form.monto || !form.nombre) return alert("⚠️ Faltan datos: Escribe un Nombre y un Monto.");
        
        let diaPago;
        try {
            diaPago = parseInt(form.fecha.split('-')[2]);
            if (isNaN(diaPago)) throw new Error("Fecha inválida");
        } catch (e) {
            return alert("⚠️ Error en la fecha. Por favor selecciónala de nuevo.");
        }
        
        const categoriaFinal = form.categoria.trim() === "" ? "Varios" : form.categoria;

        const datosLimpios = {
            id: gastoEditar?.id, 
            nombre: form.nombre,
            monto: Number(form.monto),
            moneda: form.moneda,
            dia_pago: diaPago,
            categoria: categoriaFinal,
            activo: true
        };

        onSave(datosLimpios);
    };
    
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#1C2128] border border-white/10 p-6 rounded-2xl w-full max-w-md">
              <h3 className="text-white font-bold mb-4">{gastoEditar ? 'Editar Gasto' : 'Nuevo Gasto Recurrente'}</h3>
              <div className="space-y-4">
                  <div>
                      <label className="text-xs text-gray-400 block mb-1">Nombre (Obligatorio)</label>
                      <input 
                        placeholder="Ej: Gimnasio, Netflix..." 
                        className="w-full bg-[#0F1115] border border-gray-700 p-3 rounded-xl text-white outline-none focus:border-emerald-500" 
                        value={form.nombre} 
                        onChange={e => setForm({...form, nombre: e.target.value})} 
                      />
                  </div>
                  
                  <div>
                      <label className="text-xs text-gray-400 block mb-1">Costo Mensual (Obligatorio)</label>
                      <div className="flex gap-2">
                          <input 
                            type="number" 
                            placeholder="0.00" 
                            className="flex-1 bg-[#0F1115] border border-gray-700 p-3 rounded-xl text-white outline-none focus:border-emerald-500" 
                            value={form.monto} 
                            onChange={e => setForm({...form, monto: e.target.value})} 
                          />
                          <select className="w-24 bg-[#0F1115] border border-gray-700 p-3 rounded-xl text-white outline-none" value={form.moneda} onChange={e => setForm({...form, moneda: e.target.value})}><option value="USD">USD</option><option value="COP">COP</option></select>
                      </div>
                  </div>

                  <div>
                      <label className="text-xs text-gray-400 block mb-1">Próxima Fecha de Pago</label>
                      <input type="date" className="w-full bg-[#0F1115] border border-gray-700 p-3 rounded-xl text-white outline-none" value={form.fecha} onChange={e => setForm({...form, fecha: e.target.value})} />
                      <p className="text-[10px] text-gray-500 mt-1">Se repetirá el día <strong>{form.fecha.split('-')[2]}</strong> de cada mes.</p>
                  </div>

                  <div>
                      <label className="text-xs text-gray-400 block mb-1">Categoría</label>
                      {usarInputTexto ? (
                          <div className="flex gap-2 animate-in fade-in">
                              <input 
                                  autoFocus
                                  placeholder="Escribe la categoría..." 
                                  className="flex-1 bg-[#0F1115] border border-emerald-500 p-3 rounded-xl text-white outline-none"
                                  value={form.categoria} 
                                  onChange={e => setForm({...form, categoria: e.target.value})}
                              />
                              <button onClick={() => { setUsarInputTexto(false); setForm({...form, categoria: "Servicios"}); }} className="bg-white/10 px-3 rounded-xl text-white hover:bg-white/20"><ArrowUturnLeftIcon className="w-5 h-5"/></button>
                          </div>
                      ) : (
                          <select 
                              className="w-full bg-[#0F1115] border border-gray-700 p-3 rounded-xl text-white outline-none" 
                              value={form.categoria} 
                              onChange={e => {
                                  if(e.target.value === 'custom') { setUsarInputTexto(true); setForm({...form, categoria: ""}); } 
                                  else { setForm({...form, categoria: e.target.value}); }
                              }}
                          >
                              {CATEGORIAS_BASE.map(c => <option key={c} value={c}>{c}</option>)}
                              <option value="custom" className="font-bold bg-indigo-900">+ Crear Nueva...</option>
                          </select>
                      )}
                  </div>

                  <div className="flex justify-end gap-3 pt-4">
                      <button onClick={onClose} className="text-gray-500">Cancelar</button>
                      <button onClick={handleGuardar} className="bg-indigo-600 text-white font-bold px-6 py-2 rounded-xl">Guardar</button>
                  </div>
              </div>
          </div>
      </div>
    );
}