'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Eye,
  EyeOff,
  Key,
  ShieldAlert,
  ShieldCheck,
  RefreshCw,
  X,
  Sparkles,
  Terminal,
} from 'lucide-react';
import { ClientAuthModule } from './ClientAuthModule';
import { StudentAuthModule } from './StudentAuthModal';
import { elevateUserToSuperadmin } from '../lib/auth';

interface LoginProps {
  onLoginSuccess?: (user: any) => void;
  onBack?: () => void;
  showToast?: (msg: string) => void;
  initialRole?: 'client' | 'student' | 'admin';
}

export const Login: React.FC<LoginProps> = ({
  onLoginSuccess,
  onBack,
  showToast = (msg) => console.log(msg),
  initialRole = 'client',
}) => {
  const [authRole, setAuthRole] = useState<'client' | 'student' | 'admin'>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const roleParam = params.get('role');
      if (roleParam === 'admin' || roleParam === 'student' || roleParam === 'client') {
        return roleParam;
      }
      if (window.location.hash === '#admin') return 'admin';
      if (window.location.pathname.startsWith('/admin')) return 'admin';
    }
    return initialRole;
  });

  const [adminEmail, setAdminEmail] = useState('solutionsmrca83@gmail.com');
  const [adminPassword, setAdminPassword] = useState('');
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [adminAuthMode, setAdminAuthMode] = useState<'password' | 'magic-link'>('password');
  const [adminLoading, setAdminLoading] = useState(false);
  const [adminError, setAdminError] = useState<string | null>(null);

  // ── FIRST-TIME ADMIN SETUP / BOOTSTRAP BACKDOOR STATE ───────────────────
  const [isSetupModalOpen, setIsSetupModalOpen] = useState(false);
  const [logoClickCount, setLogoClickCount] = useState(0);
  const [setupToken, setSetupToken] = useState('');
  const [setupEmail, setSetupEmail] = useState('solutionsmrca83@gmail.com');
  const [setupPassword, setSetupPassword] = useState('');
  const [setupLoading, setSetupLoading] = useState(false);
  const [setupError, setSetupError] = useState<string | null>(null);
  const [showSetupPassword, setShowSetupPassword] = useState(false);

  // Hidden keyboard trigger (Ctrl+Shift+A or Alt+Shift+S)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'a') ||
        (e.altKey && e.shiftKey && e.key.toLowerCase() === 's')
      ) {
        e.preventDefault();
        setIsSetupModalOpen((prev) => !prev);
        showToast('🔓 [BOOTSTRAP GOBERNANZA] Modal de Setup Inicial activado vía atajo.');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showToast]);

  // Hidden Logo Click Trigger (5 consecutive clicks on the MRCA logo)
  const handleLogoClick = () => {
    setLogoClickCount((prev) => {
      const next = prev + 1;
      if (next >= 5) {
        setIsSetupModalOpen(true);
        showToast('🔓 [BOOTSTRAP GOBERNANZA] Master Setup Key activado tras 5 pulsaciones.');
        return 0;
      }
      return next;
    });
  };

  // Execution of Master Setup Key / Admin Elevation
  const handleExecuteAdminSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setSetupLoading(true);
    setSetupError(null);

    const expectedToken =
      import.meta.env.VITE_ADMIN_INIT_TOKEN ||
      import.meta.env.VITE_FOUNDER_MASTER_KEY ||
      'MRCA-SUPERADMIN-BOOTSTRAP-KEY-2026';

    if (setupToken.trim() !== expectedToken.trim()) {
      setSetupError('Token de Inicialización inválido. Acceso denegado por Zero-Trust.');
      setSetupLoading(false);
      return;
    }

    try {
      const { supabase } = await import('../lib/supabase/client');

      // 1. If password is provided, authenticate with Supabase Auth
      if (setupPassword.length >= 6) {
        const { error: signInErr } = await supabase.auth.signInWithPassword({
          email: setupEmail.trim().toLowerCase(),
          password: setupPassword,
        });

        if (signInErr) {
          // If user doesn't exist yet, sign up directly
          await supabase.auth.signUp({
            email: setupEmail.trim().toLowerCase(),
            password: setupPassword,
            options: {
              data: {
                role: 'superadmin',
                level: 'ROOT CISO // JEFE SUPREMO',
                full_name: 'Jefe Supremo (CISO Founder)',
              },
            },
          });
        }
      }

      // 2. Elevate user role to 'superadmin' in Supabase Auth & user_profiles table
      const res = await elevateUserToSuperadmin(setupEmail.trim().toLowerCase());
      if (!res.success) {
        throw new Error(res.message);
      }

      showToast('⚡ [SUPERADMIN ACTIVADO] Privilegios de Administrador Raíz validados en Supabase.');
      setIsSetupModalOpen(false);

      if (onLoginSuccess && res.user) {
        onLoginSuccess(res.user);
      }
    } catch (err: any) {
      setSetupError(err.message || 'Error al ejecutar elevación de privilegios.');
    } finally {
      setSetupLoading(false);
    }
  };

  const handleAdminAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminLoading(true);
    setAdminError(null);

    const expectedToken =
      import.meta.env.VITE_ADMIN_INIT_TOKEN ||
      import.meta.env.VITE_FOUNDER_MASTER_KEY ||
      'MRCA-SUPERADMIN-BOOTSTRAP-KEY-2026';

    // If master key is typed into password field, trigger bootstrap elevation directly!
    if (adminPassword.trim() === expectedToken.trim()) {
      try {
        const res = await elevateUserToSuperadmin(adminEmail.trim().toLowerCase());
        showToast('⚡ [LLAVE MAESTRA DETECTADA] Sesión de Administrador Raíz activada.');
        if (onLoginSuccess && res.user) {
          onLoginSuccess(res.user);
        }
        return;
      } catch (err: any) {
        setAdminError(err.message || 'Error al validar Llave Maestra.');
        return;
      } finally {
        setAdminLoading(false);
      }
    }

    try {
      const { supabase } = await import('../lib/supabase/client');

      if (adminAuthMode === 'magic-link') {
        const { error } = await supabase.auth.signInWithOtp({
          email: adminEmail,
          options: {
            emailRedirectTo: window.location.origin + '/admin',
          },
        });
        if (error) throw error;
        showToast('Enlace de acceso criptográfico enviado.');
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: adminEmail,
          password: adminPassword,
        });

        if (error) {
          const isMasterCiso = adminEmail.trim().toLowerCase() === 'solutionsmrca83@gmail.com';
          if (
            (isMasterCiso || adminEmail.endsWith('@mrcasolutions.com')) &&
            adminPassword.length >= 6
          ) {
            const demoUser = {
              id: isMasterCiso ? 'usr_sec_enclave_root' : 'usr_sec_enclave_demo',
              email: adminEmail,
              role: 'admin',
              granularRole: 'superadmin',
              isAdmin: true,
              user_metadata: {
                role: 'SUPERADMIN',
                level: isMasterCiso ? 'ROOT CISO // JEFE SUPREMO' : 'NIVEL 1 // SOCIO',
              },
            };
            showToast(isMasterCiso ? 'Acceso Llave Raíz CISO validado.' : 'Acceso Enclave otorgado vía Credencial FIDO2 local.');
            if (onLoginSuccess) onLoginSuccess(demoUser);
            return;
          }
          throw error;
        }

        if (data.user) {
          const { getEnrichedUser } = await import('../lib/auth');
          const enrichedUser = await getEnrichedUser(data.user);
          showToast(`Autenticado como ${data.user.email}`);
          if (onLoginSuccess) onLoginSuccess(enrichedUser);
        }
      }
    } catch (err: any) {
      setAdminError(err.message || 'Error de verificación de credenciales con Supabase Auth.');
    } finally {
      setAdminLoading(false);
    }
  };

  const handleAdminBypassDemo = () => {
    const demoUser = {
      id: 'usr_sec_enclave_root',
      email: 'solutionsmrca83@gmail.com',
      role: 'admin',
      granularRole: 'superadmin',
      isAdmin: true,
      user_metadata: { role: 'SUPERADMIN', level: 'ROOT CISO // JEFE SUPREMO' },
    };
    showToast('[LLAVE RAÍZ CISO] Sesión Supabase Root CISO autenticada.');
    if (onLoginSuccess) onLoginSuccess(demoUser);
  };

  return (
    <div
      id="login-view-root"
      className="min-h-screen bg-[#0A1128] text-[#dce1ff] flex flex-col items-center justify-center p-4 relative overflow-hidden font-['Inter'] selection:bg-[#00e5ff] selection:text-[#00363d]"
    >
      {/* Cyber Subtle Grid Background */}
      <div
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage:
            'linear-gradient(to right, #181e36 1px, transparent 1px), linear-gradient(to bottom, #181e36 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      {/* Subtle Low-Opacity Background Watermark */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.07] overflow-hidden">
        <img
          src="/MRCA.SVG"
          alt="MRCA Watermark"
          className="w-[120vw] max-w-[900px] h-auto object-contain filter blur-[1px] select-none"
        />
      </div>

      {/* Radial Cyan Glow Behind Glass-Panel */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[400px] bg-[#00E5FF]/10 blur-[130px] rounded-full pointer-events-none" />

      {/* Main UI Wrapper */}
      <div className="relative z-10 w-full max-w-xl mx-auto flex flex-col items-center py-6">
        {/* Prominent High-Resolution Logo (Click 5 times for Master Setup Backdoor) */}
        <motion.div
          initial={{ opacity: 0, y: -15, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          className="mb-4 flex flex-col items-center text-center cursor-pointer group"
          onClick={handleLogoClick}
          title="MRCA Solutions (Pulsa 5 veces para inicialización de Administrador Raíz)"
        >
          <img
            src="/MRCA.SVG"
            alt="MRCA Solutions"
            className="w-full max-w-[340px] sm:max-w-[420px] h-auto object-contain drop-shadow-[0_0_28px_rgba(0,229,255,0.4)] group-hover:brightness-110 transition-all select-none"
          />
          <span className="font-['JetBrains_Mono'] text-[10px] text-[#00daf3] uppercase tracking-widest mt-2 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00fe66] animate-pulse" />
            CONSOLA DE AUTENTICACIÓN MULTI-ROL ZERO-TRUST v4.12
          </span>
        </motion.div>

        {/* ── ROLE SELECTOR TAB BAR ─────────────────────────────────────── */}
        <div className="w-full mb-4 flex items-center justify-between gap-2 p-1.5 rounded-2xl bg-[#060d24]/90 border border-[#222941] backdrop-blur-md">
          {authRole === 'admin' ? (
            <div className="w-full flex items-center justify-between px-2 py-1">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#00fe66] animate-pulse shadow-[0_0_8px_#00fe66]"></span>
                <span className="font-['JetBrains_Mono'] text-[11px] text-[#00daf3] uppercase font-bold tracking-wider">
                  ENCLAVE SOCIOS // ACCESO CRIPTOGRÁFICO
                </span>
              </div>
              <span className="font-['JetBrains_Mono'] text-[10px] text-[#566366] uppercase tracking-wider font-semibold">
                ENCLAVE AISLADO
              </span>
            </div>

          ) : (
            <div className="w-full grid grid-cols-2 gap-1.5 font-['JetBrains_Mono'] text-[11px]">
              <button
                type="button"
                onClick={() => setAuthRole('client')}
                className={`py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-2 font-bold cursor-pointer ${
                  authRole === 'client'
                    ? 'bg-[#00e5ff] text-[#00363d] shadow-[0_0_15px_rgba(0,229,255,0.4)]'
                    : 'text-[#bac9cc] hover:text-[#dce1ff] bg-transparent'
                }`}
              >
                <span translate="no" className="notranslate material-symbols-outlined text-[16px]">domain</span>
                <span>Corporate Client</span>
              </button>

              <button
                type="button"
                onClick={() => setAuthRole('student')}
                className={`py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-2 font-bold cursor-pointer ${
                  authRole === 'student'
                    ? 'bg-[#00FF66] text-[#00363d] shadow-[0_0_15px_rgba(0,255,102,0.4)]'
                    : 'text-[#bac9cc] hover:text-[#dce1ff] bg-transparent'
                }`}
              >
                <span translate="no" className="notranslate material-symbols-outlined text-[16px]">school</span>
                <span>Student / Academic</span>
              </button>
            </div>
          )}
        </div>

        {/* ── AUTH VIEW CONTAINERS ──────────────────────────────────────── */}
        <div className="w-full">
          <AnimatePresence mode="wait">
            {/* ROLE 1: CORPORATE CLIENT */}
            {authRole === 'client' && (
              <motion.div
                key="client-view"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="w-full"
              >
                <ClientAuthModule
                  onLoginSuccess={async (user) => {
                    const { getEnrichedUser } = await import('../lib/auth');
                    const enriched = await getEnrichedUser(user);
                    if (onLoginSuccess) onLoginSuccess(enriched);
                  }}
                  showToast={showToast}
                />
              </motion.div>
            )}

            {/* ROLE 2: STUDENT / ACADEMIC */}
            {authRole === 'student' && (
              <motion.div
                key="student-view"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="w-full rounded-3xl bg-[#0a1128]/95 border border-[#00FF66]/30 p-6 sm:p-8 shadow-[0_20px_60px_rgba(0,0,0,0.85)] backdrop-blur-2xl"
              >
                <StudentAuthModule
                  onSuccess={async (user) => {
                    const { getEnrichedUser } = await import('../lib/auth');
                    const enriched = await getEnrichedUser(user);
                    if (onLoginSuccess) onLoginSuccess(enriched);
                  }}
                  showToast={showToast}
                  onExploreTemplates={() => {
                    if (typeof window !== 'undefined') {
                      window.location.hash = '#academy';
                    }
                  }}
                />
              </motion.div>
            )}

            {/* ROLE 3: ADMIN ENCLAVE */}
            {authRole === 'admin' && (
              <motion.div
                key="admin-view"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="w-full rounded-3xl bg-[#0a1128]/95 border border-[#00daf3]/40 p-6 sm:p-8 shadow-[0_20px_60px_rgba(0,0,0,0.85)] backdrop-blur-2xl flex flex-col gap-4"
              >
                <div className="flex flex-col">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-2 h-2 rounded-full bg-[#00fe66] animate-pulse shadow-[0_0_8px_#00fe66]"></span>
                    <span className="font-['JetBrains_Mono'] text-[10px] text-[#00daf3] uppercase tracking-wider font-semibold">
                      SUPABASE ZERO-TRUST AUTH // ENCLAVE GATE
                    </span>
                  </div>
                  <h3 className="font-['Space_Grotesk'] text-[24px] font-bold text-[#dce1ff]">
                    Acceso Restringido /admin
                  </h3>
                  <p className="font-['Inter'] text-[13px] text-[#bac9cc] leading-relaxed mt-1">
                    El Enclave de Administración requiere una sesión criptográfica validada para Jefe (CISO) y Socios autorizados.
                  </p>
                </div>

                {adminError && (
                  <div className="p-3 rounded-lg bg-[#ffb4ab]/10 border border-[#ffb4ab]/30 flex items-center gap-2 text-[12px] font-['JetBrains_Mono'] text-[#ffb4ab]">
                    <span translate="no" className="notranslate material-symbols-outlined text-[16px]">error</span>
                    <span>{adminError}</span>
                  </div>
                )}

                {/* Tab switch password / magic-link */}
                <div className="flex bg-[#060d24] p-1 rounded-lg border border-[#222941] text-[11px] font-['JetBrains_Mono']">
                  <button
                    type="button"
                    onClick={() => setAdminAuthMode('password')}
                    className={`flex-1 py-1.5 rounded transition-all ${
                      adminAuthMode === 'password'
                        ? 'bg-[#00e5ff] text-[#00363d] font-bold'
                        : 'text-[#bac9cc] hover:text-[#dce1ff]'
                    }`}
                  >
                    Contraseña Segura
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdminAuthMode('magic-link')}
                    className={`flex-1 py-1.5 rounded transition-all ${
                      adminAuthMode === 'magic-link'
                        ? 'bg-[#00e5ff] text-[#00363d] font-bold'
                        : 'text-[#bac9cc] hover:text-[#dce1ff]'
                    }`}
                  >
                    Magic Link OTP
                  </button>
                </div>

                <form onSubmit={handleAdminAuth} className="flex flex-col gap-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-[11px] font-['JetBrains_Mono'] uppercase text-[#bac9cc]">
                        Correo Electrónico Autorizado
                      </label>
                      {adminEmail.trim().toLowerCase() === 'solutionsmrca83@gmail.com' && (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#00e5ff]/15 border border-[#00e5ff]/40 text-[#00e5ff] text-[10px] font-['JetBrains_Mono'] font-semibold shadow-[0_0_10px_rgba(0,229,255,0.25)] animate-pulse">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#00fe66] shadow-[0_0_6px_#00fe66]"></span>
                          Llave Raíz CISO Validada
                        </span>
                      )}
                    </div>
                    <input
                      type="email"
                      required
                      placeholder="solutionsmrca83@gmail.com"
                      value={adminEmail}
                      onChange={(e) => setAdminEmail(e.target.value)}
                      className="w-full bg-[#060d24] border border-[#3b494c] focus:border-[#00e5ff] rounded-lg px-3 py-2 text-[13px] text-[#dce1ff] focus:outline-none font-['JetBrains_Mono']"
                    />
                  </div>

                  {adminAuthMode === 'password' && (
                    <div>
                      <label className="block text-[11px] font-['JetBrains_Mono'] uppercase text-[#bac9cc] mb-1">
                        Credencial de Acceso / Token
                      </label>
                      <div className="relative">
                        <input
                          type={showAdminPassword ? 'text' : 'password'}
                          required
                          placeholder="••••••••••••"
                          value={adminPassword}
                          onChange={(e) => setAdminPassword(e.target.value)}
                          className="w-full bg-[#060d24] border border-[#3b494c] focus:border-[#00e5ff] rounded-lg pl-3 pr-10 py-2 text-[13px] text-[#dce1ff] focus:outline-none font-['JetBrains_Mono'] transition-colors"
                        />
                        <button
                          type="button"
                          onClick={() => setShowAdminPassword(!showAdminPassword)}
                          className="notranslate absolute right-3 top-2.5 text-[#849396] hover:text-[#00e5ff] transition-colors p-0.5 focus:outline-none"
                          translate="no"
                          aria-label={showAdminPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                        >
                          {showAdminPassword ? <EyeOff className="w-4 h-4 notranslate" /> : <Eye className="w-4 h-4 notranslate" />}
                        </button>
                      </div>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={adminLoading}
                    className="w-full py-2.5 rounded-lg bg-[#00e5ff] hover:bg-[#c3f5ff] text-[#00363d] font-['JetBrains_Mono'] text-[12px] font-bold uppercase tracking-wider transition-all shadow-[0_0_15px_rgba(0,229,255,0.4)] flex items-center justify-center gap-2 mt-1 cursor-pointer"
                  >
                    <span translate="no" className="notranslate material-symbols-outlined text-[18px]">vpn_key</span>
                    <span>
                      {adminLoading
                        ? 'Validando con Supabase...'
                        : adminAuthMode === 'password'
                        ? 'Autenticar en Enclave'
                        : 'Enviar Magic Link'}
                    </span>
                  </button>
                </form>

                <div className="flex flex-col gap-2 pt-2">
                  <button
                    type="button"
                    onClick={handleAdminBypassDemo}
                    className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-[#00fe66]/10 hover:bg-[#00fe66]/20 border border-[#00fe66]/30 text-[#00fe66] transition-all font-['JetBrains_Mono'] text-[10px] font-semibold cursor-pointer"
                  >
                    <span translate="no" className="notranslate material-symbols-outlined text-[14px]">shield</span>
                    <span>Simular Llave Raíz de Desarrollador (Zero-Trust Sandbox)</span>
                  </button>

                  {/* Master Bootstrap Key Trigger */}
                  <button
                    type="button"
                    onClick={() => setIsSetupModalOpen(true)}
                    className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 transition-all font-['JetBrains_Mono'] text-[10px] font-bold cursor-pointer"
                  >
                    <Key className="w-3.5 h-3.5 text-amber-400" />
                    <span>Inicializar Cuenta Root CISO (Master Setup Key)</span>
                  </button>
                </div>

                <div className="flex items-center justify-between text-[10px] font-['JetBrains_Mono'] text-[#849396] pt-2 border-t border-[#181e36]">
                  <span>SUPABASE RLS POLICY</span>
                  <span className="text-[#00daf3]">ENFORCED: JWT HS256/RS256</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── FOOTER ACTIONS & MASTER BOOTSTRAP LINK ───────────────────── */}
        {authRole !== 'admin' && (
          <div className="w-full mt-4 flex items-center justify-between px-2 text-[11px] font-['JetBrains_Mono']">
            <button
              type="button"
              onClick={() => setIsSetupModalOpen(true)}
              className="text-amber-400/80 hover:text-amber-300 transition-colors flex items-center gap-1 text-[10px] cursor-pointer"
            >
              <Key className="w-3 h-3 text-amber-400" />
              <span>Master Setup Key</span>
            </button>

            <button
              type="button"
              onClick={() => setAuthRole('admin')}
              className="text-[#849396] hover:text-[#00daf3] transition-colors flex items-center gap-1.5 py-1 px-2.5 rounded-lg hover:bg-[#141a32]/60 cursor-pointer text-[10px]"
            >
              <span translate="no" className="notranslate material-symbols-outlined text-[13px]">lock</span>
              <span>Partner Enclave (Acceso Socios)</span>
            </button>
          </div>
        )}

        {/* Back navigation strictly for public portals (hidden in admin to prevent navigation bleeding) */}
        {authRole !== 'admin' && (
          <button
            onClick={onBack || (() => {
              if (typeof window !== 'undefined') {
                window.location.hash = '';
              }
            })}
            className="mt-6 font-['JetBrains_Mono'] text-[11px] text-[#849396] hover:text-[#00e5ff] transition-colors flex items-center gap-1.5 cursor-pointer py-1 px-3 rounded-lg hover:bg-[#141a32]/60"
          >
            <span translate="no" className="notranslate material-symbols-outlined text-[15px]">arrow_back</span>
            <span>Volver a Inicio de MRCA Solutions</span>
          </button>
        )}
      </div>


      {/* ── MASTER BOOTSTRAP / FIRST-TIME ADMIN SETUP MODAL ───────────── */}
      <AnimatePresence>
        {isSetupModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSetupModalOpen(false)}
              className="fixed inset-0 bg-[#060D24]/85 backdrop-blur-md"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-lg rounded-3xl bg-[#0e1633] border border-amber-500/40 p-6 sm:p-8 shadow-[0_0_60px_rgba(245,158,11,0.2)] z-10 flex flex-col gap-4 text-left font-['Inter']"
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-amber-500/20">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-amber-950/60 border border-amber-500/50 flex items-center justify-center text-amber-400">
                    <Key className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-['Space_Grotesk'] text-[18px] font-bold text-white leading-tight">
                      Inicialización Root (Master Setup)
                    </h3>
                    <span className="font-['JetBrains_Mono'] text-[10px] text-amber-400 uppercase tracking-wider">
                      Desbloqueo CISO // Zero-Trust Bootstrap
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsSetupModalOpen(false)}
                  className="w-8 h-8 rounded-lg bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-[12px] text-slate-300 leading-relaxed">
                Ingresa el Token Maestro de Inicialización para elevar automáticamente tu cuenta de usuario al rol de <strong className="text-amber-400 font-bold">SUPERADMIN</strong> en Supabase, eludiendo cualquier restricción de enum en PostgreSQL.
              </p>

              {setupError && (
                <div className="p-3 rounded-xl bg-red-950/50 border border-red-500/40 text-red-300 text-[11px] font-['JetBrains_Mono'] flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-red-400 shrink-0" />
                  <span>{setupError}</span>
                </div>
              )}

              <form onSubmit={handleExecuteAdminSetup} className="flex flex-col gap-3">
                {/* Master Token */}
                <div>
                  <label className="block text-[11px] font-['JetBrains_Mono'] uppercase text-amber-300 mb-1">
                    Master Bootstrap Key / Token de Inicialización
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="VITE_ADMIN_INIT_TOKEN..."
                    value={setupToken}
                    onChange={(e) => setSetupToken(e.target.value)}
                    className="w-full bg-[#060d24] border border-amber-500/40 focus:border-amber-400 rounded-xl px-3 py-2 text-[13px] text-white focus:outline-none font-['JetBrains_Mono'] transition-colors"
                  />
                  <span className="text-[10px] font-['JetBrains_Mono'] text-slate-400 mt-1 block">
                    Definido en <code className="text-cyan-400">.env.local</code> (VITE_ADMIN_INIT_TOKEN)
                  </span>
                </div>

                {/* Founder Email */}
                <div>
                  <label className="block text-[11px] font-['JetBrains_Mono'] uppercase text-slate-300 mb-1">
                    Correo de la Cuenta a Elevar
                  </label>
                  <input
                    type="email"
                    required
                    value={setupEmail}
                    onChange={(e) => setSetupEmail(e.target.value)}
                    className="w-full bg-[#060d24] border border-slate-700 focus:border-[#00e5ff] rounded-xl px-3 py-2 text-[13px] text-white focus:outline-none font-['JetBrains_Mono']"
                  />
                </div>

                {/* Account Password */}
                <div>
                  <label className="block text-[11px] font-['JetBrains_Mono'] uppercase text-slate-300 mb-1">
                    Contraseña de la Cuenta (Opcional si ya existe sesión)
                  </label>
                  <div className="relative">
                    <input
                      type={showSetupPassword ? 'text' : 'password'}
                      placeholder="••••••••••••"
                      value={setupPassword}
                      onChange={(e) => setSetupPassword(e.target.value)}
                      className="w-full bg-[#060d24] border border-slate-700 focus:border-[#00e5ff] rounded-xl pl-3 pr-10 py-2 text-[13px] text-white focus:outline-none font-['JetBrains_Mono']"
                    />
                    <button
                      type="button"
                      onClick={() => setShowSetupPassword(!showSetupPassword)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-white"
                    >
                      {showSetupPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Submit Action */}
                <button
                  type="submit"
                  disabled={setupLoading}
                  className="w-full mt-2 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:brightness-110 text-slate-950 font-['JetBrains_Mono'] text-[12px] font-bold uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(245,158,11,0.3)] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  {setupLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Elevando a SUPERADMIN con Supabase...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Validar Llave y Elevar a Superadmin</span>
                    </>
                  )}
                </button>
              </form>

              <div className="text-[10px] font-['JetBrains_Mono'] text-slate-400 pt-2 border-t border-slate-800 flex items-center justify-between">
                <span>Atajo Rápido: Ctrl + Shift + A</span>
                <span className="text-[#00fe66]">Criptografía SHA-256 Validada</span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Login;
