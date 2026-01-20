"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabaseClient";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  
  // Estado para cambiar entre Login y Registro
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
        alert("¡Registro exitoso! ✅\nSi no entras automáticamente, revisa tu correo para confirmar la cuenta.");
        if (data.session) router.push("/dashboard");
      }

    } else {
      // --- MODO LOGIN ---
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        alert("Error al entrar: " + error.message);
      } else {
        router.push("/dashboard");
      }
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0F1115] text-white p-4">
      <div className="w-full max-w-md bg-[#161B22] p-8 rounded-2xl border border-gray-800 shadow-2xl">

        <h1 className="text-3xl font-bold text-center mb-2">
          Freelance<span className="text-emerald-500">OS</span>
        </h1>
        <p className="text-center text-gray-400 text-sm mb-8">
          {isRegister ? "Crea tu cuenta gratis" : "Gestiona tu negocio"}
        </p>

        {/* FORMULARIO */}
        <form onSubmit={handleAuth} className="space-y-5">
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase ml-1">Email</label>
            <input
              type="email"
              required
              className="w-full px-4 py-3 rounded-lg bg-[#0F1115] border border-gray-700 focus:border-emerald-500 outline-none transition mt-1 text-white"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@correo.com"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-gray-500 uppercase ml-1">Contraseña</label>
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
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-3 rounded-xl font-bold transition disabled:opacity-50 shadow-lg shadow-emerald-900/20 mt-2"
          >
            {loading ? "Procesando..." : (isRegister ? "Crear Cuenta" : "Iniciar Sesión")}
          </button>
        </form>

        {/* SWITCHER LOGIN / REGISTRO */}
        <div className="mt-6 text-center pt-4 border-t border-gray-800">
          <button 
            onClick={() => setIsRegister(!isRegister)} 
            className="text-sm text-gray-400 hover:text-emerald-400 underline transition"
          >
            {isRegister 
              ? "¿Ya tienes cuenta? Inicia Sesión aquí" 
              : "¿Nuevo por aquí? Crea una cuenta gratis"}
          </button>
        </div>

      </div>
    </div>
  );
}