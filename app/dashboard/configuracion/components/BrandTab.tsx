"use client";
import { useState } from "react";
import { supabase } from "../../../../lib/supabaseClient";
import { ConfigPerfil } from "../types";

interface Props {
  config: ConfigPerfil;
  setConfig: (c: ConfigPerfil) => void;
  guardar: () => void;
  saving: boolean;
}

export default function BrandTab({ config, setConfig, guardar, saving }: Props) {
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingFirma, setUploadingFirma] = useState(false);

  // Colores predefinidos (Inspiración)
  const colores = [
    { hex: "#0F1115", name: "Classic Dark" },
    { hex: "#000000", name: "OLED Black" },
    { hex: "#1e1b4b", name: "Deep Indigo" },
    { hex: "#312e81", name: "Ocean Blue" },
    { hex: "#064e3b", name: "Forest Green" },
    { hex: "#4a044e", name: "Midnight Purple" },
    { hex: "#450a0a", name: "Wine Red" },
    { hex: "#1c1917", name: "Warm Stone" },
  ];

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>, tipo: "logo" | "firma") => {
    try {
      const file = event.target.files?.[0];
      if (!file) return;

      const isLogo = tipo === "logo";
      isLogo ? setUploadingLogo(true) : setUploadingFirma(true);

      const fileExt = file.name.split('.').pop();
      const fileName = `${tipo}_${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage.from('branding').upload(filePath, file);
      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('branding').getPublicUrl(filePath);

      if (isLogo) setConfig({ ...config, branding_logo_url: data.publicUrl });
      else setConfig({ ...config, firma_digital_url: data.publicUrl });

    } catch (error: any) {
      alert('Error subiendo imagen: ' + error.message);
    } finally {
      isLogo ? setUploadingLogo(false) : setUploadingFirma(false);
    }
  };

  // ⚡ CAMBIO DE COLOR (Maneja Clics y Input Manual)
  const cambiarColor = (hex: string) => {
    // Actualizamos el estado
    setConfig({...config, color_tema: hex});
    
    // Aplicamos visualmente al instante (si es un hex válido o mientras escriben)
    if (hex.startsWith("#")) {
        document.documentElement.style.setProperty('--sys-bg', hex);
    }
  };

  return (
    <div className="animate-fadeIn pb-10">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* IDENTIDAD VISUAL */}
        <div className="bg-white/5 backdrop-blur-md border border-white/10 p-6 rounded-2xl space-y-6 shadow-xl">
          <h3 className="text-white font-bold flex items-center gap-2">🎨 Identidad Visual</h3>
          
          <div>
            <label className="text-xs text-gray-400 block mb-3 font-bold uppercase">Color de Fondo del Sistema</label>
            
            <div className="flex flex-col gap-4">
                {/* 1. Lista de Presets */}
                <div className="flex gap-3 flex-wrap">
                  {colores.map((c) => (
                    <button 
                      key={c.hex} 
                      onClick={() => cambiarColor(c.hex)} 
                      title={c.name}
                      className={`w-8 h-8 rounded-full border-2 transition-all shadow-lg ${
                        config.color_tema === c.hex 
                          ? "border-emerald-400 scale-110 ring-2 ring-emerald-500/20" 
                          : "border-transparent opacity-60 hover:opacity-100 hover:scale-105"
                      }`} 
                      style={{ backgroundColor: c.hex }} 
                    />
                  ))}
                </div>

                {/* 2. Personalizado (Hex + Picker) */}
                <div className="flex items-center gap-3 bg-black/20 p-2 rounded-xl border border-white/5 w-fit">
                    <div className="relative group w-8 h-8 rounded-full overflow-hidden border border-white/20 cursor-pointer">
                        {/* Input Color nativo (oculto pero funcional) */}
                        <input 
                            type="color" 
                            value={config.color_tema} 
                            onChange={(e) => cambiarColor(e.target.value)}
                            className="absolute inset-0 w-150% h-150% -m-2 cursor-pointer p-0 border-0"
                        />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[10px] text-gray-500 uppercase font-bold">Personalizado (HEX)</span>
                        <input 
                            type="text" 
                            value={config.color_tema}
                            onChange={(e) => cambiarColor(e.target.value)}
                            className="bg-transparent text-white text-sm font-mono outline-none uppercase w-24 placeholder-gray-600"
                            placeholder="#000000"
                            maxLength={7}
                        />
                    </div>
                </div>
            </div>
          </div>

          <div className="border-t border-white/5 pt-4">
            <label className="text-xs text-gray-400 block mb-2 font-bold uppercase">Logo del Negocio</label>
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 bg-black/40 rounded-lg border border-white/10 flex items-center justify-center overflow-hidden relative">
                {config.branding_logo_url ? (
                  <img src={config.branding_logo_url} alt="Logo" className="w-full h-full object-contain p-2" />
                ) : <span className="text-2xl opacity-20">🖼️</span>}
                {uploadingLogo && <div className="absolute inset-0 bg-black/60 flex items-center justify-center"><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div></div>}
              </div>
              <div className="flex-1">
                 <label className="cursor-pointer bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-bold py-2 px-4 rounded-lg transition inline-block mb-1">
                    {uploadingLogo ? "Subiendo..." : "📂 Subir Logo"}
                    <input type="file" className="hidden" accept="image/*" onChange={(e) => handleUpload(e, "logo")} disabled={uploadingLogo} />
                 </label>
                 <p className="text-[10px] text-gray-500">Recomendado: PNG Transparente</p>
              </div>
            </div>
          </div>
        </div>

        {/* DATOS PDF */}
        <div className="bg-white/5 backdrop-blur-md border border-white/10 p-6 rounded-2xl space-y-6 shadow-xl">
          <h3 className="text-white font-bold flex items-center gap-2">📄 Datos Legales (PDF)</h3>
          
          <div>
            <label className="text-xs text-gray-400 block mb-2 font-bold uppercase">Firma Digital</label>
            <div className="flex items-center gap-4">
              <div className="w-32 h-16 bg-white rounded-lg border border-white/10 flex items-center justify-center overflow-hidden relative">
                {config.firma_digital_url ? (
                  <img src={config.firma_digital_url} alt="Firma" className="w-full h-full object-contain p-1" />
                ) : <span className="text-xs text-gray-400 italic">Sin firma</span>}
                {uploadingFirma && <div className="absolute inset-0 bg-black/60 flex items-center justify-center"><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div></div>}
              </div>
              <div className="flex-1">
                 <label className="cursor-pointer bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-bold py-2 px-4 rounded-lg transition inline-block mb-1">
                    {uploadingFirma ? "Subiendo..." : "✍️ Subir Firma"}
                    <input type="file" className="hidden" accept="image/*" onChange={(e) => handleUpload(e, "firma")} disabled={uploadingFirma} />
                 </label>
                 <p className="text-[10px] text-gray-500">Aparecerá en tus contratos.</p>
              </div>
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-400 block mb-1 font-bold uppercase">Datos Fiscales</label>
            <input type="text" className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-white text-sm focus:border-emerald-500 outline-none transition" placeholder="Ej: NIT 900.123.456-7" value={config.datos_fiscales} onChange={e => setConfig({...config, datos_fiscales: e.target.value})} />
          </div>

          <div>
            <label className="text-xs text-gray-400 block mb-1 font-bold uppercase">Pie de Página (Términos)</label>
            <textarea className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-white text-sm h-24 resize-none focus:border-emerald-500 outline-none transition" placeholder="Ej: Factura válida por 30 días..." value={config.branding_legal} onChange={e => setConfig({...config, branding_legal: e.target.value})} />
          </div>
        </div>
      </div>

      <div className="flex justify-end mt-8 border-t border-white/5 pt-6">
        <button 
            onClick={guardar} 
            disabled={saving || uploadingLogo || uploadingFirma}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 px-8 rounded-xl transition shadow-lg shadow-emerald-900/20 disabled:opacity-50 flex items-center gap-2"
        >
            {saving ? "Guardando..." : "💾 Guardar Cambios"}
        </button>
      </div>
    </div>
  );
}