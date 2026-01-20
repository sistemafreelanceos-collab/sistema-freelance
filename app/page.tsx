"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabaseClient";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  
  // false = Login, true = Registro
  const [isRegister, setIsRegister] = useState(false);

  // ✅ Si ya hay sesión, manda al dashboard
  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        router.push("/dashboard");
      }
    };
    checkSession();
  }, [router]);

  // ✅ MANEJAR AUTENTICACIÓN
  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (isRegister) {
      // --- MODO REGISTRO ---
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        alert("Error al registrarse: " + error.message);
      } else {
        alert("¡Cuenta creada! ✅\nYa puedes entrar.");
        if (data.session) router.push("/dashboard");
        else setIsRegister(false); // Cambiamos a login automáticamente
      }

    } else {
      // --- MODO LOGIN ---
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        alert("Error al entrar: Credenciales incorrectas o usuario no registrado.");
      } else {
        router.push("/dashboard");
      }
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0F1115] text-white p-4">
      <div className="w-full max-w-md bg-[#161B22] p-8 rounded-2xl border border-gray-800 shadow-2xl">

        <h1 className="text-3xl font-bold text-center mb-6">
          Freelance<span className="text-emerald-500">OS</span>
        </h1>

        {/* --- PESTAÑAS GIGANTES --- */}
        <div className="flex p-1 bg-black/40 rounded-xl mb-8 border border-white/5">
            <button 
                onClick={() => setIsRegister(false)}
                className={`flex-1 py-3 rounded-lg font-bold text-sm transition-all ${
                    !isRegister 
                    ? 'bg-gray-700 text-white shadow-lg' 
                    : 'text-gray-500 hover:text-white'
                }`}
            >
                Entrar
            </button>
            <button 
                onClick={() => setIsRegister(true)}
                className={`flex-1 py-3 rounded-lg font-bold text-sm transition-all ${
                    isRegister 
                    ? 'bg-emerald-600 text-white shadow-lg' 
                    : 'text-gray-500 hover:text-white'
                }`}
            >
                Crear Cuenta Ruben "lee por favor"
            </button>
        </div>

        {/* FORMULARIO */}
        <form onSubmit={handleAuth} className="space-y-5 animate-in slide-in-from-bottom-2 duration-300">
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase ml-1">
                {isRegister ? "Tu Mejor Email" : "Email"}
            </label>
            <input
              type="email"
              required
              className="w-full px-4 py-3 rounded-lg bg-[#0F1115] border border-gray-700 focus:border-emerald-500 outline-none transition mt-1 text-white"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nombre@ejemplo.com"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-gray-500 uppercase ml-1">
                {isRegister ? "Crea una Contraseña" : "Contraseña"}
            </label>
            <input
              type="password"
              required
              className="w-full px-4 py-3 rounded-lg bg-[#0F1115] border border-gray-700 focus:border-emerald-500 outline-none transition mt-1 text-white"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-4 rounded-xl font-bold transition shadow-lg mt-4 text-white ${
                isRegister 
                ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-900/20' 
                : 'bg-gray-700 hover:bg-gray-600 shadow-black/20'
            }`}
          >
            {loading ? "Procesando..." : (isRegister ? "✨ Crear mi Cuenta Gratis" : "Ingresar al Sistema")}
          </button>
        </form>

        {isRegister && (
            <p className="text-xs text-gray-500 text-center mt-4">
                Al registrarte aceptas organizar tu vida como un profesional.
            </p>
        )}

      </div>
    </div>
  );
}