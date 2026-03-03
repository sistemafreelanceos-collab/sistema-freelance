import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#ededed] font-sans overflow-x-hidden selection:bg-emerald-500/30 selection:text-emerald-200">

      {/* NAV */}
      <nav className="flex justify-between items-center px-4 py-4 md:px-8 border-b border-[#21262D] sticky top-0 bg-[#0a0a0a]/90 backdrop-blur-md z-50">
        <div className="text-2xl font-black tracking-tight">Onyx<span className="text-emerald-500">OS</span></div>
        <Link href="/login" className="bg-emerald-500 hover:bg-emerald-600 text-black font-bold py-2 px-5 rounded-lg text-sm transition-colors">
          Entrar →
        </Link>
      </nav>

      {/* HERO */}
      <section className="text-center px-6 py-24 md:py-32 max-w-4xl mx-auto">
        <div className="inline-block bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 text-xs font-bold py-1.5 px-3 rounded-full mb-6 uppercase tracking-wider">
          ⚡ Para freelancers y emprendedores
        </div>
        <h1 className="text-4xl md:text-6xl font-black leading-tight mb-5 tracking-tight text-white">
          Deja de administrar<br className="hidden md:block" />tu negocio <span className="text-emerald-500">con miedo.</span>
        </h1>
        <p className="text-lg text-[#8b949e] max-w-2xl mx-auto mb-10">
          OnyxOS es el sistema operativo que une tus clientes, finanzas y productividad en un solo lugar. Sin Excel. Sin caos. Sin excusas.
        </p>
        <Link href="/login?register=true" className="inline-block bg-emerald-500 hover:bg-emerald-600 hover:-translate-y-0.5 text-black font-black text-lg py-3.5 px-8 flex-shrink-0 rounded-xl transition-all shadow-[0_0_30px_rgba(16,185,129,0.3)] hover:shadow-[0_0_40px_rgba(16,185,129,0.5)]">
          Empieza gratis ahora
        </Link>
        <span className="block mt-4 text-xs text-[#8b949e]">Sin tarjeta de crédito. Sin trampa.</span>
      </section>

      <hr className="border-t border-[#21262D] mx-8 md:mx-auto max-w-5xl" />

      {/* PROBLEMAS */}
      <section className="py-16 md:py-24 px-6 max-w-5xl mx-auto">
        <div className="text-xs font-bold uppercase tracking-widest text-emerald-500 mb-2">El problema</div>
        <h2 className="text-3xl md:text-4xl font-black mb-2 tracking-tight text-white">¿Te suena familiar?</h2>
        <p className="text-[#8b949e] mb-10 text-base">No es que seas desorganizado. Es que nadie te dio las herramientas correctas.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-[#161B22] border border-[#21262D] hover:border-red-500/40 rounded-xl p-6 flex gap-4 items-start transition-colors">
            <span className="text-2xl mt-0.5">💸</span>
            <div>
              <h3 className="text-[15px] font-bold text-[#ededed] mb-1.5">No sabes cuánto tienes realmente</h3>
              <p className="text-sm text-[#8b949e] leading-relaxed">Tienes dinero en la cuenta pero no sabes si alcanza para el mes. El desorden financiero te come vivo.</p>
            </div>
          </div>
          <div className="bg-[#161B22] border border-[#21262D] hover:border-red-500/40 rounded-xl p-6 flex gap-4 items-start transition-colors">
            <span className="text-2xl mt-0.5">📱</span>
            <div>
              <h3 className="text-[15px] font-bold text-[#ededed] mb-1.5">Tus proyectos viven en WhatsApp</h3>
              <p className="text-sm text-[#8b949e] leading-relaxed">Correos, mensajes, notas en el teléfono. Nada está en un solo lugar y siempre se te escapa algo.</p>
            </div>
          </div>
          <div className="bg-[#161B22] border border-[#21262D] hover:border-red-500/40 rounded-xl p-6 flex gap-4 items-start transition-colors">
            <span className="text-2xl mt-0.5">⏰</span>
            <div>
              <h3 className="text-[15px] font-bold text-[#ededed] mb-1.5">Cobras tarde porque no tienes control</h3>
              <p className="text-sm text-[#8b949e] leading-relaxed">No sabes quién te debe, cuánto, ni desde cuándo. El freelancer que no cobra a tiempo, no sobrevive.</p>
            </div>
          </div>
          <div className="bg-[#161B22] border border-[#21262D] hover:border-red-500/40 rounded-xl p-6 flex gap-4 items-start transition-colors">
            <span className="text-2xl mt-0.5">🔥</span>
            <div>
              <h3 className="text-[15px] font-bold text-[#ededed] mb-1.5">El burnout llega sin avisar</h3>
              <p className="text-sm text-[#8b949e] leading-relaxed">Trabajas sin medir tu energía, sin hábitos, sin un sistema que te diga cuándo parar. Hasta que el cuerpo decide por ti.</p>
            </div>
          </div>
        </div>
      </section>

      <hr className="border-t border-[#21262D] mx-8 md:mx-auto max-w-5xl" />

      {/* FEATURES */}
      <section className="py-16 md:py-24 px-6 max-w-5xl mx-auto">
        <div className="text-xs font-bold uppercase tracking-widest text-emerald-500 mb-2">La solución</div>
        <h2 className="text-3xl md:text-4xl font-black mb-2 tracking-tight text-white">Todo lo que necesitas.<br className="hidden md:block" />Nada que no necesitas.</h2>
        <p className="text-[#8b949e] mb-10 text-base">OnyxOS fue construido por un freelancer que sufrió cada uno de estos problemas. No es teoría. Es cicatriz.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-[#161B22] border border-[#21262D] hover:border-emerald-500/40 hover:-translate-y-1 rounded-xl p-6 transition-all duration-200">
            <span className="text-3xl mb-4 block">💼</span>
            <h3 className="text-base font-bold text-white mb-2">Clientes y Proyectos</h3>
            <p className="text-sm text-[#8b949e] leading-relaxed mb-4">Kanban visual, registro de pagos, recibos en PDF y portal para que tus clientes vean el avance sin preguntarte.</p>
            <span className="inline-block bg-emerald-500/10 text-emerald-500 text-[10px] font-bold px-2 py-1 rounded">Kanban</span>
          </div>
          <div className="bg-[#161B22] border border-[#21262D] hover:border-emerald-500/40 hover:-translate-y-1 rounded-xl p-6 transition-all duration-200">
            <span className="text-3xl mb-4 block">💰</span>
            <h3 className="text-base font-bold text-white mb-2">Finanzas Reales</h3>
            <p className="text-sm text-[#8b949e] leading-relaxed mb-4">Cuentas, gastos fijos, semáforo de liquidez. Sabes exactamente si sobrevives el mes o no. Sin sorpresas.</p>
            <span className="inline-block bg-emerald-500/10 text-emerald-500 text-[10px] font-bold px-2 py-1 rounded">Semáforo de liquidez</span>
          </div>
          <div className="bg-[#161B22] border border-[#21262D] hover:border-emerald-500/40 hover:-translate-y-1 rounded-xl p-6 transition-all duration-200">
            <span className="text-3xl mb-4 block">🤖</span>
            <h3 className="text-base font-bold text-white mb-2">CFO Virtual con IA</h3>
            <p className="text-sm text-[#8b949e] leading-relaxed mb-4">Escribe "gasté 30 USD en Uber" y la IA lo registra sola en la categoría correcta. Tu contador que nunca duerme.</p>
            <span className="inline-block bg-emerald-500/10 text-emerald-500 text-[10px] font-bold px-2 py-1 rounded">IA integrada</span>
          </div>
          <div className="bg-[#161B22] border border-[#21262D] hover:border-emerald-500/40 hover:-translate-y-1 rounded-xl p-6 transition-all duration-200">
            <span className="text-3xl mb-4 block">📅</span>
            <h3 className="text-base font-bold text-white mb-2">Calendario Maestro</h3>
            <p className="text-sm text-[#8b949e] leading-relaxed mb-4">Proyectos, cobros y gastos fijos en un solo calendario. Arrastra eventos, anticipa tu semana, deja de improvisar.</p>
            <span className="inline-block bg-emerald-500/10 text-emerald-500 text-[10px] font-bold px-2 py-1 rounded">Drag & Drop</span>
          </div>
          <div className="bg-[#161B22] border border-[#21262D] hover:border-emerald-500/40 hover:-translate-y-1 rounded-xl p-6 transition-all duration-200">
            <span className="text-3xl mb-4 block">🧠</span>
            <h3 className="text-base font-bold text-white mb-2">Body Battery</h3>
            <p className="text-sm text-[#8b949e] leading-relaxed mb-4">Registra tu energía física y mental. Descubre cuándo eres más productivo y deja de trabajar en tu peor momento.</p>
            <span className="inline-block bg-emerald-500/10 text-emerald-500 text-[10px] font-bold px-2 py-1 rounded">Único en el mercado</span>
          </div>
          <div className="bg-[#161B22] border border-[#21262D] hover:border-emerald-500/40 hover:-translate-y-1 rounded-xl p-6 transition-all duration-200">
            <span className="text-3xl mb-4 block">🎮</span>
            <h3 className="text-base font-bold text-white mb-2">Sistema RPG</h3>
            <p className="text-sm text-[#8b949e] leading-relaxed mb-4">Gana XP completando hábitos, sesiones de Deep Work y registrando pagos. Tu negocio ahora tiene niveles.</p>
            <span className="inline-block bg-emerald-500/10 text-emerald-500 text-[10px] font-bold px-2 py-1 rounded">Gamificación</span>
          </div>
        </div>
      </section>

      <hr className="border-t border-[#21262D] mx-8 md:mx-auto max-w-5xl" />

      {/* DEMO SEMAFORO */}
      <section className="py-16 md:py-24 px-6 max-w-5xl mx-auto">
        <div className="text-xs font-bold uppercase tracking-widest text-emerald-500 mb-2">En tiempo real</div>
        <h2 className="text-3xl md:text-4xl font-black mb-2 tracking-tight text-white">Tu negocio de un vistazo.</h2>
        <p className="text-[#8b949e] mb-10 text-base">Sin reportes complicados. Solo los números que importan.</p>

        <div className="bg-[#161B22] border border-[#21262D] rounded-2xl p-6 md:p-10 flex flex-col md:flex-row flex-wrap gap-8 items-start md:items-center justify-between">
          <div className="text-center md:text-left">
            <div className="text-3xl font-black text-emerald-500 leading-none">$4,200</div>
            <div className="text-[11px] text-[#8b949e] uppercase tracking-wider mt-1.5 font-bold">Ingresos del mes</div>
          </div>
          <div className="text-center md:text-left">
            <div className="text-3xl font-black text-red-500 leading-none">$1,800</div>
            <div className="text-[11px] text-[#8b949e] uppercase tracking-wider mt-1.5 font-bold">Gastos fijos</div>
          </div>
          <div className="text-center md:text-left hidden lg:block">
            <div className="text-3xl font-black text-emerald-500 leading-none">$2,400</div>
            <div className="text-[11px] text-[#8b949e] uppercase tracking-wider mt-1.5 font-bold">Saldo real</div>
          </div>

          <div className="w-full md:w-px md:h-12 bg-[#21262D] hidden md:block"></div>

          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]"></div>
            <div>
              <div className="font-bold text-sm text-white">Negocio estable</div>
              <div className="text-xs text-[#8b949e]">Tus gastos están cubiertos</div>
            </div>
          </div>

          <div className="text-center md:text-right w-full md:w-auto mt-4 md:mt-0 pt-4 md:pt-0 border-t md:border-t-0 border-[#21262D]">
            <div className="text-3xl font-black text-white leading-none">87%</div>
            <div className="text-[11px] text-[#8b949e] uppercase tracking-wider mt-1.5 font-bold">Valor hora real</div>
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="text-center py-20 px-6 bg-gradient-to-b from-transparent to-emerald-500/5">
        <h2 className="text-3xl md:text-5xl font-black mb-4 tracking-tight text-white">Tu negocio merece<br className="hidden md:block" />un sistema real.</h2>
        <p className="text-[#8b949e] mb-8 text-lg">Gratis. Sin tarjeta. Sin excusas.</p>
        <Link href="/login?register=true" className="inline-block bg-emerald-500 hover:bg-emerald-600 hover:-translate-y-0.5 text-black font-black text-lg py-3.5 px-8 rounded-xl transition-all shadow-[0_0_30px_rgba(16,185,129,0.3)] hover:shadow-[0_0_40px_rgba(16,185,129,0.5)]">
          Crear mi cuenta gratis →
        </Link>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-[#21262D] py-8 text-center text-sm text-[#8b949e]">
        <p>Hecho con demasiado café y sin riñones. <span className="text-emerald-500 font-bold">OnyxOS</span> © {new Date().getFullYear()}</p>
      </footer>

    </div>
  );
}