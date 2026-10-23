import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  GraduationCap,
  Layers,
  Sparkles,
  Calculator,
  ShieldCheck,
  BookOpen,
  Menu,
  X,
  ArrowRight,
  ExternalLink,
  ChevronRight,
} from 'lucide-react';

interface StudentLayoutProps {
  onNavigateHome?: () => void;
  onOpenLogin?: () => void;
  onScrollToCalculator?: () => void;
  children: React.ReactNode;
}

interface StudentNavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  badge?: string;
  badgeColor?: string;
}

const STUDENT_NAV_ITEMS: StudentNavItem[] = [
  { href: '#inicio', label: 'Inicio & Visión General', icon: <GraduationCap className="w-4 h-4" /> },
  { href: '#servicios', label: 'Servicios Modulares', icon: <Layers className="w-4 h-4" />, badge: 'Redes / BD / IoT', badgeColor: 'text-cyan-300 bg-cyan-950/70 border-cyan-500/30' },
  { href: '#garantias', label: 'Garantías de Aprobación', icon: <ShieldCheck className="w-4 h-4" />, badge: 'Cero Plagio', badgeColor: 'text-[#00fe66] bg-emerald-950/70 border-emerald-500/30' },
  { href: '#catalogo-plantillas', label: 'Catálogo de Plantillas', icon: <Sparkles className="w-4 h-4" /> },
  { href: '#calculadora', label: 'Cotizador en Vivo', icon: <Calculator className="w-4 h-4" />, badge: 'Estudiantes', badgeColor: 'text-purple-300 bg-purple-950/70 border-purple-500/30' },
];

export const StudentLayout: React.FC<StudentLayoutProps> = ({
  onNavigateHome,
  onOpenLogin,
  onScrollToCalculator,
  children,
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleNavClick = (href: string) => {
    setIsMobileMenuOpen(false);
    if (href === '#calculadora' && onScrollToCalculator) {
      onScrollToCalculator();
      return;
    }
    const el = document.querySelector(href);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-[#070D22] text-[#dce1ff] flex flex-col font-['Inter'] selection:bg-[#00e5ff] selection:text-[#00363d] relative overflow-x-hidden">
      {/* Background Cyber Texture */}
      <div
        className="fixed inset-0 pointer-events-none opacity-15 z-0"
        style={{
          backgroundImage:
            'linear-gradient(to right, #181e36 1px, transparent 1px), linear-gradient(to bottom, #181e36 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />
      <div className="fixed top-20 right-10 w-[550px] h-[350px] bg-emerald-500/5 blur-[150px] rounded-full pointer-events-none z-0" />

      {/* TOP ISOLATED STUDENT ACADEMY HEADER */}
      <header className="sticky top-0 z-40 bg-[#060D24]/95 border-b border-emerald-500/20 backdrop-blur-xl shadow-[0_4px_25px_rgba(0,0,0,0.7)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
          {/* Left: Hamburger & Brand */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden w-10 h-10 rounded-xl bg-[#141a32] border border-emerald-500/30 flex items-center justify-center text-emerald-400 hover:text-white transition-all cursor-pointer"
              aria-label="Abrir navegación académica"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <a
              href="#inicio"
              className="flex items-center gap-2.5 group"
            >
              <div className="w-9 h-9 rounded-xl bg-[#141a32] border border-[#00fe66]/40 flex items-center justify-center text-[#00fe66] shadow-[0_0_12px_rgba(0,254,102,0.25)] shrink-0">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="font-['Space_Grotesk'] text-[16px] font-bold tracking-tight text-white leading-none group-hover:text-emerald-300 transition-colors">
                    MCRA ACADEMY
                  </span>
                  <span className="hidden sm:inline-block px-1.5 py-0.5 rounded text-[9px] font-['JetBrains_Mono'] font-bold bg-emerald-950/80 border border-emerald-500/40 text-[#00fe66] uppercase tracking-wider">
                    ESTUDIANTES
                  </span>
                </div>
                <span className="font-['JetBrains_Mono'] text-[9px] text-cyan-400 uppercase tracking-widest mt-1">
                  Prototipado & Defensa de Tesis
                </span>
              </div>
            </a>
          </div>

          {/* Center: Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1">
            {STUDENT_NAV_ITEMS.map((item, idx) => (
              <a
                key={idx}
                href={item.href}
                onClick={(e) => {
                  e.preventDefault();
                  handleNavClick(item.href);
                }}
                className="px-3 py-1.5 rounded-lg text-[12px] font-['JetBrains_Mono'] text-slate-300 hover:text-white hover:bg-[#141a32] transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <span>{item.label}</span>
                {item.badge && (
                  <span className={`text-[8px] px-1.5 py-0.2 rounded border uppercase font-bold ${item.badgeColor}`}>
                    {item.badge}
                  </span>
                )}
              </a>
            ))}
          </nav>

          {/* Right: Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {onScrollToCalculator && (
              <button
                onClick={onScrollToCalculator}
                className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-[#00363d] text-[12px] font-['Space_Grotesk'] font-bold uppercase tracking-wider transition-all shadow-[0_0_15px_rgba(0,254,102,0.3)] cursor-pointer"
              >
                <Calculator className="w-3.5 h-3.5" />
                <span>Cotizar en Vivo</span>
              </button>
            )}

            {onOpenLogin && (
              <button
                onClick={onOpenLogin}
                className="px-3 py-1.5 rounded-xl bg-[#141a32] hover:bg-[#182042] text-cyan-400 border border-cyan-500/30 text-[11px] font-['JetBrains_Mono'] font-bold transition-all cursor-pointer"
              >
                Ingreso Portal
              </button>
            )}

            {onNavigateHome && (
              <button
                onClick={onNavigateHome}
                className="hidden md:flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-[#0e1633] hover:bg-[#141a32] text-slate-400 hover:text-white text-[11px] font-['JetBrains_Mono'] transition-all"
                title="Volver a la plataforma principal"
              >
                <span>Inicio ↗</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* MOBILE SLIDE-IN DRAWER */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-[#060D24]/80 backdrop-blur-md z-50 lg:hidden"
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="fixed top-0 left-0 bottom-0 w-80 max-w-[85vw] bg-[#0A1128] border-r border-emerald-500/30 p-5 z-50 flex flex-col justify-between overflow-y-auto lg:hidden shadow-[0_0_40px_rgba(0,0,0,0.9)]"
            >
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between pb-3 border-b border-emerald-900/40">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-emerald-950 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                      <GraduationCap className="w-4 h-4" />
                    </div>
                    <span className="font-['Space_Grotesk'] text-[16px] font-bold text-white">
                      MCRA ACADEMY
                    </span>
                  </div>
                  <button
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="w-8 h-8 rounded-lg bg-slate-800/60 text-slate-400 hover:text-white flex items-center justify-center"
                    aria-label="Cerrar navegación"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="p-3 rounded-xl bg-[#0e1633] border border-emerald-500/30 flex flex-col gap-1">
                  <span className="text-[10px] font-['JetBrains_Mono'] text-[#00fe66] uppercase font-bold">
                    Ingeniería Académica Aplicada
                  </span>
                  <span className="text-xs text-slate-300">
                    Soporte para proyectos finales, integradoras y tesis en México y LatAm.
                  </span>
                </div>

                {/* Mobile Navigation List */}
                <div className="flex flex-col gap-1.5">
                  {STUDENT_NAV_ITEMS.map((item, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleNavClick(item.href)}
                      className="flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-['JetBrains_Mono'] text-slate-200 hover:bg-[#141a32] hover:text-emerald-300 transition-all text-left"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="text-emerald-400">{item.icon}</span>
                        <span>{item.label}</span>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800 flex flex-col gap-2">
                {onScrollToCalculator && (
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      onScrollToCalculator();
                    }}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-[#00363d] font-['Space_Grotesk'] text-xs font-bold uppercase tracking-wider text-center"
                  >
                    Calcular Presupuesto en Vivo
                  </button>
                )}
                {onNavigateHome && (
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      onNavigateHome();
                    }}
                    className="w-full py-2.5 rounded-xl bg-[#141a32] text-slate-300 hover:text-white text-xs font-['JetBrains_Mono'] text-center"
                  >
                    ← Volver al Portal B2B
                  </button>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* MAIN ACADEMIC WORKSPACE */}
      <main className="flex-1 w-full flex flex-col items-center">
        {children}
      </main>
    </div>
  );
};

export default StudentLayout;
