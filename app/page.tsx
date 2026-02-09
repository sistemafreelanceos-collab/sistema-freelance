"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabaseClient";
import { toast } from "sonner";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";

// Tipos de error comunes
const ERROR_MAP: Record<string, string> = {
  "Invalid login credentials": "No encontramos esta cuenta o la clave está mal. ¿Ya te registraste?",
  "User not found": "El usuario no existe.",
  "User already registered": "Este correo ya está registrado.",
  "Password should be at least 6 characters": "La contraseña debe tener al menos 6 caracteres.",
};

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nombre, setNombre] = useState(""); // Nuevo campo nombre

  const [loading, setLoading] = useState(false);
  const [isRegister, setIsRegister] = useState(false);
  const [isRecovery, setIsRecovery] = useState(false); // Estado para recuperación
  const [rememberMe, setRememberMe] = useState(false);

  // 1. Cargar correo guardado si existe
  useEffect(() => {
    const savedEmail = localStorage.getItem("freelanceOS_email");
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  // 2. Revisar si ya hay sesión activa
  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        router.push("/dashboard");
      }
    };
    checkSession();
  }, [router]);

  const getErrorMessage = (msg: string) => ERROR_MAP[msg] || msg;

  const handleGoogleLogin = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin + "/auth/callback",
        queryParams: {
          access_type: "offline",
          prompt: "consent",
        },
        scopes: "https://www.googleapis.com/auth/calendar"
      },
    });
    if (error) toast.error(getErrorMessage(error.message));
    setLoading(false);
  };

  const handleRecovery = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + "/auth/callback?next=/dashboard/perfil",
    });

    if (error) {
      toast.error(getErrorMessage(error.message));
    } else {
      toast.success("Correo de recuperación enviado. Revisa tu bandeja.");
      setIsRecovery(false);
    }
    setLoading(false);
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Validación básica
    if (password.length < 6) {
      toast.error("La contraseña debe tener al menos 6 caracteres");
      setLoading(false);
      return;
    }

    // Guardar o borrar correo
    if (rememberMe) {
      localStorage.setItem("freelanceOS_email", email);
    } else {
      localStorage.removeItem("freelanceOS_email");
    }

    if (isRegister) {
      // --- REGISTRO ---
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: nombre, // Guardamos el nombre aquí
          },
        },
      });

      if (error) {
        toast.error(getErrorMessage(error.message));
      } else {
        toast.success(`¡Bienvenido, ${nombre}! Tu cuenta ha sido creada.`);
        // Si hay sesión, mandamos con la marca de "nuevo"
        if (data.session) {
          router.push("/dashboard?nuevo=true");
        } else {
          setIsRegister(false);
        }
      }

    } else {
      // --- LOGIN ---
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        toast.error(getErrorMessage(error.message));
      } else {
        router.push("/dashboard");
      }
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0F1115] text-white p-4">
      <div className="w-full max-w-md bg-[#161B22] p-8 rounded-2xl border border-gray-800 shadow-2xl relative overflow-hidden">

        {/* Header */}
        <h1 className="text-3xl font-bold text-center mb-2">
          Freelance<span className="text-emerald-500">OS</span>
        </h1>
        <p className="text-center text-gray-400 text-sm mb-6">
          {isRecovery ? "Recuperar Contraseña" : (isRegister ? "Crea tu cuenta" : "Inicia sesión para continuar")}
        </p>

        {isRecovery ? (
          // --- FORMULARIO RECUPERACIÓN ---
          <form onSubmit={handleRecovery} className="space-y-4 animate-in slide-in-from-right duration-300">
            <button
              type="button"
              onClick={() => setIsRecovery(false)}
              className="text-xs flex items-center gap-1 text-gray-500 hover:text-white mb-4"
            >
              <ArrowLeftIcon className="w-3 h-3" /> Volver
            </button>

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
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl font-bold transition shadow-lg text-white bg-emerald-600 hover:bg-emerald-500 shadow-emerald-900/20"
            >
              {loading ? "Enviando..." : "Enviar Correo"}
            </button>
          </form>
        ) : (
          // --- FORMULARIO NORMAL ---
          <>
            {/* PESTAÑAS */}
            <div className="flex p-1 bg-black/40 rounded-xl mb-6 border border-white/5">
              <button
                onClick={() => setIsRegister(false)}
                className={`flex-1 py-3 rounded-lg font-bold text-sm transition-all ${!isRegister ? 'bg-gray-700 text-white shadow-lg' : 'text-gray-500 hover:text-white'}`}
              >
                Entrar
              </button>
              <button
                onClick={() => setIsRegister(true)}
                className={`flex-1 py-3 rounded-lg font-bold text-sm transition-all ${isRegister ? 'bg-emerald-600 text-white shadow-lg' : 'text-gray-500 hover:text-white'}`}
              >
                Crear Cuenta
              </button>
            </div>

            <form onSubmit={handleAuth} className="space-y-4 animate-in slide-in-from-bottom-2 duration-300">

              {/* CAMPO DE NOMBRE (SOLO APARECE EN REGISTRO) */}
              {isRegister && (
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase ml-1">¿Cómo te llamas?</label>
                  <input
                    type="text"
                    required={isRegister}
                    className="w-full px-4 py-3 rounded-lg bg-[#0F1115] border border-gray-700 focus:border-emerald-500 outline-none transition mt-1 text-white capitalize"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    placeholder="Ej. Juan Pérez"
                  />
                </div>
              )}

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
                <div className="flex justify-between items-center ml-1">
                  <label className="text-xs font-bold text-gray-500 uppercase">Contraseña</label>
                  {!isRegister && (
                    <button
                      type="button"
                      onClick={() => setIsRecovery(true)}
                      className="text-xs text-emerald-500 hover:text-emerald-400 font-medium"
                    >
                      ¿Olvidaste tu contraseña?
                    </button>
                  )}
                </div>
                <input
                  type="password"
                  required
                  className="w-full px-4 py-3 rounded-lg bg-[#0F1115] border border-gray-700 focus:border-emerald-500 outline-none transition mt-1 text-white"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </div>

              {/* CHECKBOX RECORDAR (SOLO EN LOGIN) */}
              {!isRegister && (
                <div className="flex items-center gap-2 ml-1 pb-2">
                  <input
                    type="checkbox"
                    id="remember"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-600 text-emerald-600 bg-[#0F1115] cursor-pointer"
                  />
                  <label htmlFor="remember" className="text-sm text-gray-400 cursor-pointer select-none">
                    Recordar mi correo
                  </label>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className={`w-full py-4 rounded-xl font-bold transition shadow-lg text-white flex justify-center items-center gap-2 ${isRegister
                  ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-900/20'
                  : 'bg-gray-700 hover:bg-gray-600 shadow-black/20'
                  }`}
              >
                {loading && <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>}
                {isRegister ? "Crear Cuenta" : "Ingresar"}
              </button>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-gray-800" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-[#161B22] px-2 text-gray-500">O continúa con</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleGoogleLogin}
                className="w-full py-3 bg-white text-black font-bold rounded-xl hover:bg-gray-100 transition flex items-center justify-center gap-2"
              >
                <img src="https://authjs.dev/img/providers/google.svg" className="w-5 h-5" alt="Google" />
                Google
              </button>

            </form>
          </>
        )}
      </div>
    </div>
  );
}