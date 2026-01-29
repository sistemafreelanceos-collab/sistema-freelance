"use client";
import React, { useState } from "react";
import { ConfigPerfil } from "../../../../types";
import { UserCircleIcon, CameraIcon } from "@heroicons/react/24/solid";
import { supabase } from "../../../../lib/supabaseClient"; // Import Supabase
import Link from "next/link";
import { toast } from "sonner"; // Import Toast

type Props = {
    config: ConfigPerfil;
    setConfig: React.Dispatch<React.SetStateAction<ConfigPerfil>>;
    guardar: () => Promise<void>;
    saving: boolean;
};

export default function ProfileTab({ config, setConfig, guardar, saving }: Props) {
    const [uploading, setUploading] = useState(false);

    const isPremium = config.plan === "premium" && config.plan_status === "active";

    const handleChange = (field: keyof ConfigPerfil, value: string) => {
        setConfig(prev => ({ ...prev, [field]: value }));
    };

    // --- FUNCIÓN PARA SUBIR FOTO (Ported from PerfilPage) ---
    const uploadAvatar = async (event: React.ChangeEvent<HTMLInputElement>) => {
        try {
            setUploading(true);

            if (!event.target.files || event.target.files.length === 0) {
                throw new Error('Debes seleccionar una imagen.');
            }

            const file = event.target.files[0];
            const toastId = toast.loading("Subiendo imagen...");

            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random()}.${fileExt}`;
            const filePath = `${fileName}`;

            // 1. Subir al Bucket 'avatars'
            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, file);

            if (uploadError) {
                throw uploadError;
            }

            // 2. Obtener URL Pública
            const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);

            // 3. Actualizar estado visual
            setConfig(prev => ({ ...prev, avatar_url: data.publicUrl }));

            toast.dismiss(toastId);
            toast.success("Foto cargada. Recuerda guardar cambios.");

        } catch (error: any) {
            toast.error('Error subiendo imagen: ' + error.message);
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-2">

            {/* COLUMNA IZQUIERDA: TARJETA DE USUARIO Y PLAN */}
            <div className="space-y-6">

                {/* TARJETA DE PERFIL */}
                <div className="bg-[#161B22] border border-white/10 rounded-2xl p-6 flex flex-col items-center text-center shadow-lg">
                    <div className="relative group cursor-pointer w-24 h-24 mb-4">
                        <div className="w-full h-full rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 p-1 shadow-xl">
                            <div className="w-full h-full rounded-full bg-[#1C2128] flex items-center justify-center overflow-hidden relative">
                                {config.avatar_url ? (
                                    <img src={config.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-3xl font-bold text-white">
                                        {(config.nombre || "U").charAt(0).toUpperCase()}
                                    </span>
                                )}
                                {/* Overlay hover */}
                                <label className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition cursor-pointer">
                                    <CameraIcon className="w-6 h-6 text-white" />
                                    <input
                                        type="file"
                                        className="hidden"
                                        accept="image/*"
                                        onChange={uploadAvatar}
                                        disabled={uploading}
                                    />
                                </label>
                            </div>
                        </div>
                    </div>

                    <h2 className="text-white font-bold text-lg">{config.nombre || "Usuario"}</h2>
                    <p className="text-gray-400 text-xs mb-4">{config.email || "email@ejemplo.com"}</p>

                    <label className="cursor-pointer text-xs text-emerald-400 border border-emerald-500/30 px-3 py-1.5 rounded-full hover:bg-emerald-500/10 transition">
                        {uploading ? "Subiendo..." : "Subir nueva foto"}
                        <input
                            type="file"
                            className="hidden"
                            accept="image/*"
                            onChange={uploadAvatar}
                            disabled={uploading}
                        />
                    </label>
                </div>

                {/* TARJETA DE PLAN (DINÁMICA) */}
                <div className="bg-[#161B22] border border-yellow-500/20 rounded-2xl p-6 shadow-lg relative overflow-hidden">
                    {/* Fondo decorativo */}
                    <div className="absolute -top-10 -right-10 w-32 h-32 bg-yellow-500/10 rounded-full blur-3xl"></div>

                    <p className="text-xs text-yellow-500 font-bold uppercase mb-2 tracking-wider">Tu Plan Actual</p>
                    <h3 className="text-2xl font-bold text-white flex items-center gap-2 mb-4">
                        {isPremium ? "👑 Premium" : "🆓 Gratis"}
                    </h3>

                    <div className="space-y-2 text-xs text-gray-400 mb-6">
                        <div className="flex justify-between">
                            <span>Estado:</span>
                            <span className={`font-bold ${config.plan_status === "active" ? "text-emerald-400" : "text-red-400"}`}>
                                {config.plan_status === "active" ? "Activo" : "Inactivo"}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span>Renovación:</span>
                            <span className="text-white">{config.plan_renovacion || "—"}</span>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Link href="/dashboard/suscripcion" className="block w-full py-2 text-center bg-yellow-600/20 text-yellow-400 border border-yellow-500/50 rounded-lg text-xs font-bold hover:bg-yellow-600/30 transition">
                            Administrar Suscripción
                        </Link>
                    </div>
                </div>

            </div>

            {/* COLUMNA DERECHA: FORMULARIO */}
            <div className="lg:col-span-2 space-y-6">

                <div className="bg-[#161B22] border border-white/10 rounded-2xl p-8 shadow-xl">
                    <h3 className="text-white font-bold text-lg mb-6 flex items-center gap-2">
                        📝 Datos Personales
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        {/* Nombre */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase text-gray-500 tracking-wider">Nombre Completo</label>
                            <input
                                value={config.nombre || config.nombre_completo || ""}
                                onChange={e => handleChange("nombre", e.target.value)}
                                placeholder="Tu nombre"
                                className="w-full bg-[#0D1117] border border-gray-700/50 rounded-lg px-4 py-3 text-white text-sm outline-none focus:border-indigo-500 transition shadow-inner"
                            />
                        </div>

                        {/* Empresa / Marca */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase text-gray-500 tracking-wider">Nombre de tu Empresa / Marca</label>
                            <input
                                value={config.empresa || config.branding_legal || ""}
                                onChange={e => handleChange("empresa", e.target.value)}
                                placeholder="Nombre de tu negocio"
                                className="w-full bg-[#0D1117] border border-gray-700/50 rounded-lg px-4 py-3 text-white text-sm outline-none focus:border-indigo-500 transition shadow-inner"
                            />
                        </div>

                        {/* Email */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase text-gray-500 tracking-wider">Correo Electrónico</label>
                            <input
                                value={config.email || config.email_contacto || ""}
                                onChange={e => handleChange("email", e.target.value)}
                                placeholder="tucorreo@ejemplo.com"
                                className="w-full bg-[#0D1117] border border-gray-700/50 rounded-lg px-4 py-3 text-gray-300 text-sm outline-none focus:border-indigo-500 transition shadow-inner"
                            />
                            <p className="text-[10px] text-gray-600">Este correo será visible en tus facturas.</p>
                        </div>

                        {/* Teléfono */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase text-gray-500 tracking-wider">Teléfono / WhatsApp</label>
                            <input
                                value={config.telefono || ""}
                                onChange={e => handleChange("telefono", e.target.value)}
                                placeholder="+57 ..."
                                className="w-full bg-[#0D1117] border border-gray-700/50 rounded-lg px-4 py-3 text-white text-sm outline-none focus:border-indigo-500 transition shadow-inner"
                            />
                        </div>

                        {/* Dirección (Full Width) */}
                        <div className="md:col-span-2 space-y-2">
                            <label className="text-[10px] font-bold uppercase text-gray-500 tracking-wider">Dirección de Facturación</label>
                            <input
                                value={config.direccion || config.ubicacion || ""}
                                onChange={e => handleChange("direccion", e.target.value)}
                                placeholder="Dirección completa"
                                className="w-full bg-[#0D1117] border border-gray-700/50 rounded-lg px-4 py-3 text-white text-sm outline-none focus:border-indigo-500 transition shadow-inner"
                            />
                        </div>

                        {/* Datos Fiscales Extra (NIT/RUT) */}
                        <div className="md:col-span-2 space-y-2">
                            <label className="text-[10px] font-bold uppercase text-gray-500 tracking-wider">Nit / Rut / Tax ID</label>
                            <input
                                value={config.datos_fiscales || ""}
                                onChange={e => handleChange("datos_fiscales", e.target.value)}
                                placeholder="Número de identificación tributaria"
                                className="w-full bg-[#0D1117] border border-gray-700/50 rounded-lg px-4 py-3 text-white text-sm outline-none focus:border-indigo-500 transition shadow-inner"
                            />
                        </div>
                    </div>
                    {/* Botón Guardar */}
                    <div className="flex justify-end pt-4">
                        <button
                            onClick={guardar}
                            disabled={saving}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 px-8 rounded-xl shadow-lg hover:shadow-emerald-500/20 transition transform active:scale-95 disabled:opacity-50 disabled:scale-100"
                        >
                            {saving ? "Guardando..." : "Guardar Cambios"}
                        </button>
                    </div>
                </div>

                {/* MÓDULO SEGURIDAD (Visual) */}
                <div className="bg-[#161B22] border border-white/10 rounded-2xl p-8 shadow-xl opacity-80 cursor-not-allowed">
                    <div className="flex justify-between items-center">
                        <div>
                            <h3 className="text-white font-bold mb-1 flex items-center gap-2">🔒 Seguridad</h3>
                            <p className="text-xs text-gray-500">Contraseña y autenticación</p>
                        </div>
                        <button className="bg-white/5 border border-white/10 text-gray-400 font-bold py-2 px-4 rounded-lg text-xs" disabled>
                            Cambiar Contraseña
                        </button>
                    </div>
                </div>

            </div>

        </div>
    );
}
