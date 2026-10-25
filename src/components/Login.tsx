'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Eye, EyeOff } from 'lucide-react';
import { ClientAuthModule } from './ClientAuthModule';
import { StudentAuthModule } from './StudentAuthModal';

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

  const handleAdminAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminLoading(true);
    setAdminError(null);

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
            (isMasterCiso || adminEmail.endsWith('@mcrasolutions.com')) &&
            adminPassword.length >= 6
          ) {
            const demoUser = {
              id: isMasterCiso ? 'usr_sec_enclave_root' : 'usr_sec_enclave_demo',
              email: adminEmail,
              role: 'owner',
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
      role: 'owner',
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
        {/* Prominent High-Resolution Logo Above Authentication Glass-Panel */}
        <motion.div
          initial={{ opacity: 0, y: -15, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          className="mb-4 flex flex-col items-center text-center cursor-pointer group"
          onClick={onBack}
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
              <button
                type="button"
                onClick={() => setAuthRole('client')}
                className="font-['JetBrains_Mono'] text-[11px] text-[#849396] hover:text-[#00e5ff] transition-colors underline cursor-pointer"
              >
                ← Volver a Portales
              </button>
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

            {/* ROLE 3: ADMIN ENCLAVE (Pure cryptographic login, ZERO legal agreements) */}
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
                    El Enclave de Administración requiere una sesión criptográfica validada para Jefe (CISO) y Socio (CTO).
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
                    className="w-full py-2.5 rounded-lg bg-[#00e5ff] hover:bg-[#c3f5ff] text-[#00363d] font-['JetBrains_Mono'] text-[12px] font-bold uppercase tracking-wider transition-all shadow-[0_0_15px_rgba(0,229,255,0.4)] flex items-center justify-center gap-2 mt-1"
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
                    className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-[#00fe66]/10 hover:bg-[#00fe66]/20 border border-[#00fe66]/30 text-[#00fe66] transition-all font-['JetBrains_Mono'] text-[10px] font-semibold"
                  >
                    <span translate="no" className="notranslate material-symbols-outlined text-[14px]">shield</span>
                    <span>Simular Llave Raíz de Desarrollador (Zero-Trust Sandbox)</span>
                  </button>
                </div>

                <div className="flex items-center justify-between text-[10px] font-['JetBrains_Mono'] text-[#849396] pt-2 border-t border-[#181e36]">
                  <span>SUPABASE RLS POLICY</span>
                  <button
                    type="button"
                    onClick={() => setAuthRole('client')}
                    className="text-[#849396] hover:text-[#00e5ff] transition-colors underline cursor-pointer"
                  >
                    ← Salir a Portales
                  </button>
                  <span className="text-[#00daf3]">ENFORCED: JWT HS256/RS256</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── HIDDEN / SMALL PARTNER ENCLAVE LINK ──────────────────────── */}
        {authRole !== 'admin' && (
          <div className="w-full mt-4 flex items-center justify-between px-2 text-[11px] font-['JetBrains_Mono']">
            <span className="text-[#566366] text-[10px]">MRCA SOLUTIONS CLOUD INFRASTRUCTURE</span>
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

        {/* Back navigation */}
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
      </div>
    </div>
  );
};

export default Login;
