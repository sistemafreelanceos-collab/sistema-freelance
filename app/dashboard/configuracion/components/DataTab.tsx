"use client";
import React, { useState } from "react";
import { supabase } from "../../../../lib/supabaseClient";
import { ArrowDownTrayIcon, CircleStackIcon } from "@heroicons/react/24/outline";
import { toast } from "sonner";

type Props = {
    userId: string;
};

export default function DataTab({ userId }: Props) {
    const [downloading, setDownloading] = useState(false);

    const downloadBackup = async () => {
        try {
            setDownloading(true);
            const toastId = toast.loading("Generando copia de seguridad...");

            // 1. Fetch data from all major tables
            const tables = [
                "profiles",
                "clientes",
                "proyectos",
                "cuentas",
                "movimientos",
                "presupuestos",
                "gasto_fijo",
                "habitos",
                "eventos_calendario",
                "plantillas_contrato",
                "clausulas_contrato",
                "plantillas_servicio",
                "invoices"
            ];

            const backupData: Record<string, any> = {
                metadata: {
                    system: "FreelanceOS",
                    version: "1.0",
                    export_date: new Date().toISOString(),
                    user_id: userId
                }
            };

            // Execute fetches in parallel
            const promises = tables.map(async (table) => {
                const { data, error } = await supabase.from(table as any).select("*").eq("owner_id", userId); // Owner check might fail on profiles/some tables, handled below

                // Special case for profiles or tables without owner_id if needed, strictly we use RLS so select * usually works for auth user
                // But let's try strict RLS fetch
                if (table === "profiles") {
                    const { data: p } = await supabase.from("profiles").select("*").eq("id", userId);
                    return { table, data: p };
                }

                // General fetch
                const { data: d } = await supabase.from(table).select("*");
                return { table, data: d || [] };
            });

            const results = await Promise.all(promises);

            results.forEach(res => {
                backupData[res.table] = res.data;
            });

            // 2. Create Blob and Download
            const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `freelance-os-backup-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            toast.dismiss(toastId);
            toast.success("Copia de seguridad descargada correctamente");

        } catch (error: any) {
            console.error(error);
            toast.error("Error generando backup: " + error.message);
        } finally {
            setDownloading(false);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">

            <div>
                <h2 className="text-xl font-bold text-white mb-1 flex items-center gap-2">
                    <CircleStackIcon className="w-5 h-5 text-indigo-400" /> Datos y Exportación
                </h2>
                <p className="text-sm text-gray-400 mb-4">
                    Gestiona tus datos, exporta copias de seguridad o descarga tu información.
                </p>

                <div className="bg-[#161B22] border border-white/10 rounded-2xl p-8">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                        <div>
                            <h3 className="text-white font-bold text-lg mb-2">Exportar Copia de Seguridad Completa</h3>
                            <p className="text-sm text-gray-400 max-w-xl">
                                Descarga un archivo JSON con toda la información de tu cuenta: Clientes, Proyectos, Finanzas, Configuración y más.
                                Útil para tener un respaldo local o migrar datos.
                            </p>
                        </div>

                        <button
                            onClick={downloadBackup}
                            disabled={downloading}
                            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-6 rounded-xl shadow-lg hover:shadow-indigo-500/20 transition transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                        >
                            <ArrowDownTrayIcon className="w-5 h-5" />
                            {downloading ? "Generando..." : "Descargar Backup (.json)"}
                        </button>
                    </div>

                    <div className="mt-8 pt-8 border-t border-white/5">
                        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 flex gap-3">
                            <div className="text-yellow-500 font-bold shrink-0">⚠️</div>
                            <p className="text-xs text-yellow-200/80">
                                Esta descarga contiene información sensible. Guárdala en un lugar seguro y no la compartas con nadie.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

        </div>
    );
}
