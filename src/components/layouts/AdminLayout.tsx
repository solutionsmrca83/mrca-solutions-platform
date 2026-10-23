import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ShieldAlert,
  Terminal,
  Grid,
  CheckCircle2,
  DollarSign,
  FileText,
  LifeBuoy,
  Archive,
  Lock,
  LogOut,
  Menu,
  X,
  KeyRound,
  ExternalLink,
  Cpu,
  Layers,
  ChevronRight,
} from 'lucide-react';
import { NeuralCopilot } from '../NeuralCopilot';

export type AdminTab =
  | 'principal'
  | 'aprobaciones'
  | 'finanzas'
  | 'kali'
  | 'proyectos'
  | 'sla'
  | 'contratos'
  | 'soporte'
  | 'boveda'
  | 'auditoria'
  | 'presupuestos';

interface AdminLayoutProps {
  activeTab: AdminTab;
  onTabChange: (tab: AdminTab) => void;
  sessionUser?: any;
  onSignOut?: () => void;
  onReAuth?: () => void;
  onBackToPublic?: () => void;
  children: React.ReactNode;
}

interface NavItem {
  id: AdminTab;
  label: string;
  icon: React.ReactNode;
  badge?: string;
  badgeColor?: string;
}

const ADMIN_NAV_ITEMS: NavItem[] = [
  { id: 'principal', label: 'Dashboard Principal', icon: <Grid className="w-4 h-4" /> },
  { id: 'aprobaciones', label: 'Aprobaciones Leads', icon: <CheckCircle2 className="w-4 h-4" />, badge: '3 Pendientes', badgeColor: 'text-[#00fe66] bg-[#00fe66]/10 border-[#00fe66]/30' },
  { id: 'finanzas', label: 'Finanzas & SPEI', icon: <DollarSign className="w-4 h-4" />, badge: 'Banxico T+0', badgeColor: 'text-[#00e5ff] bg-[#00e5ff]/10 border-[#00e5ff]/30' },
  { id: 'kali', label: 'Terminal Kali Linux', icon: <Terminal className="w-4 h-4" />, badge: 'NIDS Activo', badgeColor: 'text-purple-400 bg-purple-500/10 border-purple-500/30' },
  { id: 'proyectos', label: 'Kanban Proyectos', icon: <Layers className="w-4 h-4" /> },
  { id: 'contratos', label: 'Generador Contratos', icon: <FileText className="w-4 h-4" /> },
  { id: 'presupuestos', label: 'Negociaciones B2B', icon: <Cpu className="w-4 h-4" /> },
  { id: 'soporte', label: 'Soporte Clientes VIP', icon: <LifeBuoy className="w-4 h-4" /> },
  { id: 'boveda', label: 'Bóveda Criptográfica', icon: <Archive className="w-4 h-4" /> },
  { id: 'auditoria', label: 'Logs Auditoría SOC-2', icon: <Lock className="w-4 h-4" /> },
];

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  activeTab,
  onTabChange,
  sessionUser,
  onSignOut,
  onReAuth,
  onBackToPublic,
  children,
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const email = sessionUser?.email || 'solutionsmrca83@gmail.com';
  const isMasterCiso = email.trim().toLowerCase() === 'solutionsmrca83@gmail.com';

  const handleSelectTab = (tab: AdminTab) => {
    onTabChange(tab);
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#070D22] text-[#dce1ff] flex flex-col font-['Inter'] selection:bg-[#00e5ff] selection:text-[#00363d] relative overflow-x-hidden">
      {/* Background Cybernetic Texture */}
      <div
        className="fixed inset-0 pointer-events-none opacity-15 z-0"
        style={{
          backgroundImage:
            'linear-gradient(to right, #181e36 1px, transparent 1px), linear-gradient(to bottom, #181e36 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />
      <div className="fixed top-20 right-10 w-[500px] h-[350px] bg-cyan-500/5 blur-[150px] rounded-full pointer-events-none z-0" />

      {/* TOP ISOLATED ADMIN ENCLAVE HEADER */}
      <header className="sticky top-0 z-40 bg-[#060D24]/95 border-b border-cyan-500/20 backdrop-blur-xl shadow-[0_4px_25px_rgba(0,0,0,0.7)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
          {/* Left: Mobile Menu Toggle & Brand */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden w-10 h-10 rounded-xl bg-[#141a32] border border-cyan-500/30 flex items-center justify-center text-cyan-400 hover:text-white transition-all cursor-pointer"
              aria-label="Abrir navegación de administración"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#141a32] border border-[#00e5ff]/40 flex items-center justify-center text-[#00e5ff] shadow-[0_0_12px_rgba(0,229,255,0.25)] shrink-0">
                <span className="material-symbols-outlined text-[20px]">shield</span>
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="font-['Space_Grotesk'] text-[16px] font-bold tracking-tight text-white leading-none">
                    MRCA ENCLAVE
                  </span>
                  <span className="hidden sm:inline-block px-1.5 py-0.5 rounded text-[9px] font-['JetBrains_Mono'] font-bold bg-cyan-950/80 border border-cyan-500/40 text-[#00e5ff] uppercase tracking-wider">
                    ROOT CISO
                  </span>
                </div>
                <span className="font-['JetBrains_Mono'] text-[9px] text-[#00fe66] uppercase tracking-widest mt-1 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00fe66] animate-pulse"></span>
                  Nivel 4 // FIPS 140-3
                </span>
              </div>
            </div>
          </div>

          {/* Center: Cryptographic Hardware Telemetry */}
          <div className="hidden xl:flex items-center gap-3 px-3 py-1.5 rounded-xl bg-[#0e1633] border border-cyan-500/20 text-[11px] font-['JetBrains_Mono']">
            <div className="flex items-center gap-1.5 text-cyan-400">
              <span className="material-symbols-outlined text-[15px]">encrypted</span>
              <span>HSM YUBI-V4: LOCKED</span>
            </div>
            <span className="text-slate-600">•</span>
            <div className="flex items-center gap-1.5 text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              <span>CLUSTER-CDMX-ALPHA</span>
            </div>
            <span className="text-slate-600">•</span>
            <span className="text-slate-400">TLS 1.3 / ECDSA P-384</span>
          </div>

          {/* Right: Master User Credentials & Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Supreme Root CISO Account Badge */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#141a32] border border-cyan-500/30 text-left">
              <div className="w-7 h-7 rounded-lg bg-cyan-950 flex items-center justify-center text-cyan-400 font-bold text-xs shrink-0">
                <KeyRound className="w-3.5 h-3.5" />
              </div>
              <div className="flex flex-col max-w-[170px] sm:max-w-[210px]">
                <div className="flex items-center gap-1.5 truncate">
                  <span className="font-['JetBrains_Mono'] text-[11px] font-bold text-white truncate">
                    {email}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_#10b981]"></span>
                  <span className="font-['JetBrains_Mono'] text-[9px] text-[#00e5ff] font-semibold tracking-wider uppercase">
                    {isMasterCiso ? 'Llave Raíz CISO Validada' : 'Sesión Superadmin'}
                  </span>
                </div>
              </div>
            </div>

            {/* Re-Auth Modal Trigger */}
            {onReAuth && (
              <button
                onClick={onReAuth}
                className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-[#00e5ff] border border-cyan-500/40 text-[11px] font-['JetBrains_Mono'] font-bold transition-all"
                title="Re-autenticar sesión administrativa"
              >
                <span className="material-symbols-outlined text-[15px]">lock_reset</span>
                <span className="hidden lg:inline">RE-AUTH</span>
              </button>
            )}

            {/* Sign Out */}
            {onSignOut && (
              <button
                onClick={onSignOut}
                className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-red-950/40 hover:bg-red-900/60 text-red-300 border border-red-500/30 text-[11px] font-['JetBrains_Mono'] font-bold transition-all cursor-pointer"
                title="Cerrar sesión de enclave administrativo"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">SALIR</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* BODY WITH RESPONSIVE SIDEBAR + MAIN WORKSPACE */}
      <div className="flex-1 max-w-7xl w-full mx-auto flex relative z-10">
        {/* DESKTOP ISOLATED ADMIN SIDEBAR */}
        <aside className="hidden lg:flex flex-col w-64 xl:w-72 bg-[#060D24]/80 border-r border-cyan-900/30 p-4 shrink-0 justify-between">
          <div className="flex flex-col gap-1.5">
            <div className="px-3 py-2 text-[10px] font-['JetBrains_Mono'] uppercase tracking-widest text-slate-400 font-bold border-b border-slate-800/60 mb-1">
              CONSOLA DE CONTROL ROOT
            </div>

            {ADMIN_NAV_ITEMS.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleSelectTab(item.id)}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-[12px] font-['JetBrains_Mono'] font-medium transition-all cursor-pointer text-left ${
                    isActive
                      ? 'bg-gradient-to-r from-cyan-500/20 to-cyan-500/5 text-cyan-300 border border-cyan-500/40 shadow-[0_0_15px_rgba(0,229,255,0.15)] font-bold'
                      : 'text-slate-400 hover:text-white hover:bg-[#141a32]/70 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className={isActive ? 'text-[#00e5ff]' : 'text-slate-400'}>
                      {item.icon}
                    </span>
                    <span>{item.label}</span>
                  </div>

                  {item.badge && (
                    <span
                      className={`text-[9px] px-1.5 py-0.5 rounded border uppercase tracking-wider font-semibold ${item.badgeColor}`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Quick Enclave Status Footer */}
          <div className="p-3.5 rounded-xl bg-[#0e1633]/90 border border-cyan-500/20 flex flex-col gap-2 mt-6">
            <div className="flex items-center justify-between">
              <span className="font-['JetBrains_Mono'] text-[10px] text-cyan-400 font-semibold uppercase">
                Gobernanza CISO
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_#10b981]"></span>
            </div>
            <p className="text-[11px] text-slate-400 leading-snug">
              Enclave aislado de submódulos. Registros protegidos con sellos criptográficos SHA-256.
            </p>
            {onBackToPublic && (
              <button
                onClick={onBackToPublic}
                className="text-[10px] font-['JetBrains_Mono'] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 pt-1 border-t border-slate-800 transition-colors cursor-pointer"
              >
                <span>← Vista pública principal</span>
              </button>
            )}
          </div>
        </aside>

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
                className="fixed top-0 left-0 bottom-0 w-80 max-w-[85vw] bg-[#0A1128] border-r border-cyan-500/30 p-5 z-50 flex flex-col justify-between overflow-y-auto lg:hidden shadow-[0_0_40px_rgba(0,0,0,0.9)]"
              >
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between pb-3 border-b border-cyan-900/40">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-cyan-950 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
                        <span className="material-symbols-outlined text-[18px]">shield</span>
                      </div>
                      <span className="font-['Space_Grotesk'] text-[16px] font-bold text-white">
                        MRCA ENCLAVE
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

                  {/* Master Account Pill */}
                  <div className="p-3 rounded-xl bg-[#141a32] border border-cyan-500/30 flex flex-col gap-1">
                    <span className="text-[10px] font-['JetBrains_Mono'] text-slate-400 uppercase">
                      Cuenta Root CISO
                    </span>
                    <span className="text-xs font-['JetBrains_Mono'] font-bold text-cyan-300 truncate">
                      {email}
                    </span>
                    <span className="text-[10px] font-['JetBrains_Mono'] text-emerald-400 flex items-center gap-1 mt-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                      Llave Raíz Validada
                    </span>
                  </div>

                  {/* Navigation List */}
                  <div className="flex flex-col gap-1.5">
                    {ADMIN_NAV_ITEMS.map((item) => {
                      const isActive = activeTab === item.id;
                      return (
                        <button
                          key={item.id}
                          onClick={() => handleSelectTab(item.id)}
                          className={`flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-['JetBrains_Mono'] transition-all text-left ${
                            isActive
                              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold'
                              : 'text-slate-300 hover:bg-[#141a32] hover:text-white'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <span className={isActive ? 'text-cyan-400' : 'text-slate-400'}>
                              {item.icon}
                            </span>
                            <span>{item.label}</span>
                          </div>
                          <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-800 flex flex-col gap-2">
                  {onBackToPublic && (
                    <button
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        onBackToPublic();
                      }}
                      className="w-full py-2.5 rounded-xl bg-[#141a32] text-cyan-400 hover:text-white text-xs font-['JetBrains_Mono'] font-semibold transition-all text-center"
                    >
                      ← Volver a Vista Pública
                    </button>
                  )}
                  {onSignOut && (
                    <button
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        onSignOut();
                      }}
                      className="w-full py-2.5 rounded-xl bg-red-950/40 text-red-300 border border-red-500/30 text-xs font-['JetBrains_Mono'] font-bold transition-all text-center flex items-center justify-center gap-2"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Cerrar Sesión Enclave</span>
                    </button>
                  )}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* MAIN WORKSPACE VIEW WITH MOBILE-FIRST ENFORCEMENT */}
        <main className="flex-1 min-w-0 p-4 sm:p-6 md:p-8 flex flex-col gap-6 overflow-x-hidden">
          {children}
        </main>
      </div>

      {/* INTEGRATED MRCA QUANTUM NEURAL COPILOT (ADMIN SCOPE) */}
      <NeuralCopilot scope="admin" />
    </div>
  );
};

export default AdminLayout;
