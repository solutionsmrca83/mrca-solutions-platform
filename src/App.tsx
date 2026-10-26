import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'motion/react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { PublicLanding } from './components/PublicLanding';
import { AdminEnclave } from './components/AdminEnclave';
import { ClientPortalView } from './components/ClientPortalView';
import { McraAcademy } from './components/McraAcademy';
import { LoginModal } from './components/Modals';
import { SplashPreloader } from './components/SplashPreloader';
import { Login } from './components/Login';
import { LegalFooter } from './components/LegalFooter';
import { SystemStatusBadge } from './components/SystemStatusBadge';
import { TermsAndConditions, PrivacyPolicy, SLA, AcceptableUse } from './pages/legal';
import { supabase } from './lib/supabase/client';
import { isUserAdmin, resolveUserRole, getEnrichedUser } from './lib/auth';
import { ActiveView } from './types';
import { NotFoundPage } from './components/NotFoundPage';

export default function App() {
  const [activeView, setActiveView] = useState<ActiveView>('public');
  const [showSplash, setShowSplash] = useState(true);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [sessionUser, setSessionUser] = useState<any>(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  useEffect(() => {
    let mounted = true;

    // Initial active Supabase session inspection with role enrichment
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!mounted) return;
      if (session?.user) {
        const enriched = await getEnrichedUser(session.user);
        if (mounted) setSessionUser(enriched);
      } else {
        if (mounted) setSessionUser(null);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!mounted) return;
      if (session?.user) {
        const enriched = await getEnrichedUser(session.user);
        if (mounted) setSessionUser(enriched);
      } else {
        if (mounted) {
          setSessionUser(null);
          setActiveView((prev) => (prev === 'admin' ? 'public' : prev));
        }
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    // Subdomain routing and deep-link route protection
    const checkRoute = async () => {
      const hostname = window.location.hostname.toLowerCase();
      const path = window.location.pathname;
      const hash = window.location.hash;

      // 1. ADMIN SUBDOMAIN & ROUTES (admin.mcrasolutions.com, /admin, /enclave, #admin)
      if (
        hostname.startsWith('admin.') ||
        path === '/admin' ||
        path === '/enclave' ||
        path.startsWith('/admin') ||
        path.startsWith('/enclave') ||
        hash === '#admin' ||
        hash.startsWith('#admin') ||
        hash === '#enclave' ||
        hash === '#auditoria' ||
        hash === '#presupuestos' ||
        hash === '#admin-presupuestos' ||
        hash === '#usuarios' ||
        hash === '#admin-usuarios'
      ) {

        const { data: { session } } = await supabase.auth.getSession();
        const candidateUser = session?.user || sessionUser;

        if (candidateUser) {
          const isAdmin = await isUserAdmin(candidateUser);
          if (isAdmin) {
            const enriched = await getEnrichedUser(candidateUser);
            setSessionUser(enriched);
            setActiveView('admin');
            return;
          } else {
            showToast('Acceso restringido: Se requieren privilegios de Administrador Zero-Trust.');
            setActiveView('client');
            return;
          }
        } else {
          setActiveView('login');
          return;
        }
      }

      // 2. CLIENTES SUBDOMAIN & ROUTES (clientes.mcrasolutions.com, /clientes, /dashboard, /portal)
      if (
        hostname.startsWith('clientes.') ||
        path === '/clientes' ||
        path === '/dashboard' ||
        path.startsWith('/clientes') ||
        path === '/portal' ||
        path.startsWith('/portal') ||
        hash === '#clientes' ||
        hash === '#portal' ||
        hash === '#client' ||
        hash === '#api-keys' ||
        hash === '#roadmap' ||
        hash === '#contratos' ||
        hash === '#finanzas' ||
        hash === '#soporte' ||
        hash === '#boveda' ||
        hash === '#facturas' ||
        hash === '#auditoria-cliente'
      ) {
        setActiveView('client');
        return;
      }

      // 3. ESTUDIANTES SUBDOMAIN & ROUTES (estudiantes.mcrasolutions.com, /estudiantes, /academy)
      if (
        hostname.startsWith('estudiantes.') ||
        path === '/estudiantes' ||
        path.startsWith('/estudiantes') ||
        path === '/academy' ||
        path.startsWith('/academy') ||
        hash === '#estudiantes' ||
        hash === '#academy'
      ) {
        setActiveView('academy');
        return;
      }

      // 4. AUTH & LEGAL ROUTES
      if (path === '/login' || hash === '#login' || path === '/register' || hash === '#register') {
        setActiveView('login');
        return;
      }
      if (path === '/legal/terminos' || hash === '#legal-terminos') {
        setActiveView('legal-terminos');
        return;
      }
      if (path === '/legal/privacidad' || hash === '#legal-privacidad') {
        setActiveView('legal-privacidad');
        return;
      }
      if (path === '/legal/sla' || hash === '#legal-sla') {
        setActiveView('legal-sla');
        return;
      }
      if (path === '/legal/aup' || hash === '#legal-aup') {
        setActiveView('legal-aup');
        return;
      }

      // 5. PUBLIC LANDING
      if (path === '/' && (hash === '' || hash === '#public' || hash === '#hero' || hash === '#inicio' || hash.startsWith('#'))) {
        setActiveView((prev) => (prev === 'academy' || prev === 'not-found' || prev === 'login' ? 'public' : prev));
        return;
      }

      // 6. UNKNOWN DEEP LINK -> 404 NOT FOUND
      if (path !== '/' && path !== '') {
        setActiveView('not-found');
        return;
      }
    };

    checkRoute();
    window.addEventListener('hashchange', checkRoute);
    window.addEventListener('popstate', checkRoute);

    return () => {
      window.removeEventListener('hashchange', checkRoute);
      window.removeEventListener('popstate', checkRoute);
    };
  }, []);

  const getAdminSubdomainUrl = () => {
    if (typeof window === 'undefined') return '/admin';
    const { hostname, port, protocol } = window.location;
    if (hostname.startsWith('admin.')) return '/dashboard';
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return `${protocol}//admin.localhost${port ? `:${port}` : ''}/`;
    }
    const cleanHost = hostname.replace(/^www\./, '');
    return `${protocol}//admin.${cleanHost}${port ? `:${port}` : ''}/`;
  };

  const handlePortalClientesClick = () => {
    if (sessionUser) {
      if (window.location.pathname !== '/clientes') {
        window.history.pushState(null, '', '/clientes');
      }
      setActiveView('client');
    } else {
      setIsLoginModalOpen(true);
    }
  };

  const navigateToAdmin = async () => {
    let user = sessionUser;
    if (!user) {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        user = await getEnrichedUser(session.user);
        setSessionUser(user);
      }
    }

    if (user) {
      const isAdmin = await isUserAdmin(user);
      if (isAdmin) {
        if (window.location.pathname !== '/admin') {
          window.history.pushState(null, '', '/admin');
        }
        setActiveView('admin');
        showToast('[SESIÓN VERIFICADA] Enclave Admin Zero-Trust activado.');
      } else {
        showToast('Acceso denegado: Su cuenta no posee privilegios de Administrador.');
        if (window.location.pathname !== '/clientes') {
          window.history.pushState(null, '', '/clientes');
        }
        setActiveView('client');
      }
    } else {
      if (window.location.pathname !== '/login') {
        window.history.pushState(null, '', '/login?role=admin');
      }
      setActiveView('login');
      showToast('Autenticación requerida para acceder al Enclave Admin.');
    }
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch {
      // Offline fallback
    }
    setSessionUser(null);
    if (window.location.pathname !== '/') {
      window.history.pushState(null, '', '/');
    }
    window.location.hash = '';
    setActiveView('public');
    showToast('Sesión Supabase revocada. Redirigido a modo público.');
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((current) => (current === msg ? null : current));
    }, 3200);
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const scrollToBottom = () => {
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
  };

  // ── SPLASH GATE ──────────────────────────────────────────────────────
  // Render ONLY the splash preloader during boot.
  if (showSplash) {
    return <SplashPreloader onComplete={() => setShowSplash(false)} />;
  }

  // ── SUBDOMAIN STRUCTURE ISOLATION GATES (Strict Separation) ─────────
  if (activeView === 'academy') {
    return <McraAcademy />;
  }

  if (activeView === 'admin') {
    return (
      <AdminEnclave
        onBackToPublic={() => {
          if (window.location.pathname !== '/') {
            window.history.pushState(null, '', '/');
          }
          window.location.hash = '';
          setActiveView('public');
        }}
        showToast={showToast}
        sessionUser={sessionUser}
        onSignOut={handleSignOut}
      />
    );
  }

  if (activeView === 'client') {
    return (
      <ClientPortalView
        clientEmail={sessionUser?.email || 'cliente@enterprise.corp'}
        clientCompany="FinTech Global B2B"
        onSignOut={handleSignOut}
        showToast={showToast}
      />
    );
  }

  // ── LOGIN ROUTE GATE ─────────────────────────────────────────────────
  // Mount ONLY VideoBackground + floating form wrapper on the Login route
  if (activeView === 'login') {
    return (
      <Login
        onLoginSuccess={(user) => {
          setSessionUser(user);
          if (user?.role === 'admin' || user?.isAdmin) {
            if (window.location.pathname !== '/admin') {
              window.history.pushState(null, '', '/admin');
            }
            setActiveView('admin');
            showToast('Bienvenido al Enclave de Administración Zero-Trust.');
          } else if (user?.role === 'student') {
            if (window.location.pathname !== '/academy') {
              window.history.pushState(null, '', '/academy');
            }
            setActiveView('academy');
          } else {
            if (window.location.pathname !== '/clientes') {
              window.history.pushState(null, '', '/clientes');
            }
            setActiveView('client');
          }
        }}
        onBack={() => {
          if (window.location.pathname !== '/') {
            window.history.pushState(null, '', '/');
          }
          window.location.hash = '';
          setActiveView('public');
        }}
        showToast={showToast}
      />
    );
  }

  // ── LEGAL GATES ──────────────────────────────────────────────────────
  if (activeView === 'legal-terminos') {
    return (
      <TermsAndConditions
        onBack={() => {
          window.location.hash = '';
          setActiveView('public');
        }}
        onNavigate={(route) => {
          if (route === '/legal/privacidad') setActiveView('legal-privacidad');
          else if (route === '/legal/sla') setActiveView('legal-sla');
          else if (route === '/legal/aup') setActiveView('legal-aup');
          else if (route === '/legal/terminos') setActiveView('legal-terminos');
        }}
      />
    );
  }

  if (activeView === 'legal-privacidad') {
    return (
      <PrivacyPolicy
        onBack={() => {
          window.location.hash = '';
          setActiveView('public');
        }}
        onNavigate={(route) => {
          if (route === '/legal/terminos') setActiveView('legal-terminos');
          else if (route === '/legal/sla') setActiveView('legal-sla');
          else if (route === '/legal/aup') setActiveView('legal-aup');
          else if (route === '/legal/privacidad') setActiveView('legal-privacidad');
        }}
      />
    );
  }

  if (activeView === 'legal-sla') {
    return (
      <SLA
        onBack={() => {
          window.location.hash = '';
          setActiveView('public');
        }}
        onNavigate={(route) => {
          if (route === '/legal/terminos') setActiveView('legal-terminos');
          else if (route === '/legal/privacidad') setActiveView('legal-privacidad');
          else if (route === '/legal/aup') setActiveView('legal-aup');
          else if (route === '/legal/sla') setActiveView('legal-sla');
        }}
      />
    );
  }

  if (activeView === 'legal-aup') {
    return (
      <AcceptableUse
        onBack={() => {
          window.location.hash = '';
          setActiveView('public');
        }}
        onNavigate={(route) => {
          if (route === '/legal/terminos') setActiveView('legal-terminos');
          else if (route === '/legal/privacidad') setActiveView('legal-privacidad');
          else if (route === '/legal/sla') setActiveView('legal-sla');
          else if (route === '/legal/aup') setActiveView('legal-aup');
        }}
      />
    );
  }

  if (activeView === 'not-found') {
    return (
      <NotFoundPage
        onNavigateHome={() => {
          window.location.hash = '';
          if (window.location.pathname !== '/') {
            window.history.pushState(null, '', '/');
          }
          setActiveView('public');
        }}
        onNavigateClient={() => {
          window.location.hash = 'portal';
          setActiveView('client');
        }}
        onNavigateAdmin={() => {
          window.location.hash = 'admin';
          setActiveView('admin');
        }}
        onNavigateAcademy={() => {
          window.location.hash = 'academy';
          setActiveView('academy');
        }}
      />
    );
  }

  return (
    <div className="bg-[#0b1229] min-h-screen text-[#dce1ff] flex flex-col relative font-['Inter'] selection:bg-[#00e5ff] selection:text-[#00363d]">
      {/* GLOBAL TOP NAVIGATION HEADER */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#060d24]/90 border-b border-[#181e36] backdrop-blur-xl shadow-[0_4px_24px_rgba(0,0,0,0.5)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
          {/* Brand Logo & Title */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileDrawerOpen(true)}
              className="md:hidden w-10 h-10 flex items-center justify-center text-[#00e5ff] hover:text-[#c3f5ff] transition-colors p-1"
              aria-label="Abrir menú"
            >
              <span translate="no" className="notranslate material-symbols-outlined text-[24px]">menu</span>
            </button>

            <button
              onClick={() => setActiveView('public')}
              className="flex items-center gap-2.5 group text-left"
            >
              <div className="w-9 h-9 rounded-xl bg-[#181e36] border border-[#00e5ff]/30 flex items-center justify-center text-[#00e5ff] shadow-[0_0_12px_rgba(0,229,255,0.25)] group-hover:border-[#00e5ff] transition-all">
                <span translate="no" className="notranslate material-symbols-outlined text-[20px]">hexagon</span>
              </div>

              {/* Static High-Res Brand Preview */}
              <div className="relative w-24 h-7 rounded-lg overflow-hidden border border-[#00E5FF]/40 shadow-[0_0_10px_rgba(0,229,255,0.25)] shrink-0 hidden sm:flex items-center justify-center bg-[#0A1128] px-1">
                <img
                  src="/MRCA.SVG"
                  alt="MRCA Logo"
                  className="w-full h-full object-contain"
                />
              </div>

              <div className="flex flex-col">
                <span className="font-['Space_Grotesk'] text-[18px] font-bold tracking-tight text-[#dce1ff] leading-none group-hover:text-[#00e5ff] transition-colors">
                  MRCA
                </span>
                <span className="font-['JetBrains_Mono'] text-[9px] text-[#00daf3] uppercase tracking-widest leading-none mt-1">
                  SOLUTIONS
                </span>
              </div>
            </button>

            {/* Desktop Operational Indicator */}
            <div className="hidden lg:flex items-center">
              <SystemStatusBadge />
            </div>
          </div>

          {/* Desktop Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-2">
            <button
              onClick={() => setActiveView('public')}
              className={`px-3.5 py-1.5 rounded-lg font-['Space_Grotesk'] text-[14px] uppercase tracking-wider font-semibold transition-all ${
                activeView === 'public'
                  ? 'bg-[#00e5ff] text-[#00363d] shadow-[0_0_15px_rgba(0,229,255,0.3)]'
                  : 'text-[#bac9cc] hover:text-[#00e5ff] hover:bg-[#141a32]'
              }`}
            >
              Overview & Trust Center
            </button>
            <button
              id="nav-btn-portal-clientes"
              onClick={handlePortalClientesClick}
              className={`px-3.5 py-1.5 rounded-lg font-['Space_Grotesk'] text-[14px] uppercase tracking-wider font-semibold transition-all flex items-center gap-1.5 ${
                (activeView as string) === 'client'
                  ? 'bg-[#00e5ff] text-[#00363d] shadow-[0_0_15px_rgba(0,229,255,0.3)]'
                  : 'text-[#bac9cc] hover:text-[#00e5ff] hover:bg-[#141a32]'
              }`}
            >
              <span translate="no" className="notranslate material-symbols-outlined text-[16px]">domain</span>
              <span>Portal Clientes</span>
            </button>
            <button
              id="nav-btn-admin-subdomain"
              onClick={navigateToAdmin}
              className="px-3.5 py-1.5 rounded-lg font-['Space_Grotesk'] text-[14px] uppercase tracking-wider font-semibold transition-all flex items-center gap-1.5 text-[#bac9cc] hover:text-[#00fe66] hover:bg-[#141a32] border border-transparent hover:border-[#00fe66]/30 group cursor-pointer"
              title="Acceso al Enclave de Administración Zero-Trust"
            >
              <span translate="no" className="notranslate material-symbols-outlined text-[16px] text-[#00fe66]">admin_panel_settings</span>
              <span>Panel Admin Socios</span>
              <span translate="no" className="notranslate material-symbols-outlined text-[14px] text-[#849396] group-hover:text-[#00fe66] transition-colors">arrow_forward</span>
            </button>
          </nav>

          {/* Right Action Area */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Zero Trust Status */}
            <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#141a32] border border-[#00e5ff]/20 text-[#bac9cc]">
              <span translate="no" className="notranslate material-symbols-outlined text-[15px] text-[#00e5ff]">lock</span>
              <span className="font-['JetBrains_Mono'] text-[10px] uppercase font-semibold text-[#00daf3]">
                Zero Trust v2.4
              </span>
            </div>

            {/* User Avatar Profile */}
            <button
              onClick={async () => {
                if (!sessionUser) {
                  setIsLoginModalOpen(true);
                } else {
                  const isAdmin = await isUserAdmin(sessionUser);
                  if (isAdmin) {
                    if ((activeView as string) === 'admin') {
                      setActiveView('public');
                      if (window.location.pathname !== '/') {
                        window.history.pushState(null, '', '/');
                      }
                    } else {
                      setActiveView('admin');
                      if (window.location.pathname !== '/admin') {
                        window.history.pushState(null, '', '/admin');
                      }
                    }
                  } else {
                    if ((activeView as string) === 'client') {
                      setActiveView('public');
                      if (window.location.pathname !== '/') {
                        window.history.pushState(null, '', '/');
                      }
                    } else {
                      setActiveView('client');
                      if (window.location.pathname !== '/clientes') {
                        window.history.pushState(null, '', '/clientes');
                      }
                    }
                  }
                }
              }}
              className="relative w-9 h-9 rounded-full bg-[#00e5ff] text-[#00363d] flex items-center justify-center hover:bg-[#c3f5ff] transition-all shadow-[0_0_10px_rgba(0,229,255,0.3)] cursor-pointer"
              title={sessionUser ? `Sesión Activa: ${sessionUser.email} (${sessionUser.role || 'usuario'})` : 'Autenticación Supabase'}
            >
              <span translate="no" className="notranslate material-symbols-outlined text-[20px]">person</span>
              {sessionUser && (
                <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-[#00fe66] border-2 border-[#060d24] rounded-full shadow-[0_0_6px_#00fe66]"></span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* MOBILE DRAWER NAVIGATION (Exact to Image 1) */}
      <div
        className={`fixed inset-0 z-50 bg-[#060d24]/80 backdrop-blur-sm transition-opacity duration-300 ${
          isMobileDrawerOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setIsMobileDrawerOpen(false)}
      />
      <aside
        className={`fixed top-0 right-0 h-full w-80 max-w-[85vw] z-50 bg-[#141a32]/95 border-l border-[#00e5ff]/30 backdrop-blur-2xl shadow-[-8px_0_32px_rgba(0,0,0,0.7)] transform transition-transform duration-300 ease-out flex flex-col justify-between pt-safe pb-safe ${
          isMobileDrawerOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="p-6 flex flex-col gap-6">
          <div className="flex items-center justify-between pb-3 border-b border-[#222941]">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded bg-[#060d24] flex items-center justify-center text-[#00e5ff]">
                <span translate="no" className="notranslate material-symbols-outlined text-[20px]">shield</span>
              </div>
              <span className="font-['Space_Grotesk'] text-[18px] text-[#00e5ff] tracking-tight font-bold">
                SISTEMA MCRA
              </span>
            </div>
            <button
              onClick={() => setIsMobileDrawerOpen(false)}
              className="w-9 h-9 flex items-center justify-center text-[#bac9cc] hover:text-[#dce1ff]"
              aria-label="Cerrar navegación"
            >
              <span translate="no" className="notranslate material-symbols-outlined text-[24px]">close</span>
            </button>
          </div>

          <div className="py-1">
            <SystemStatusBadge showDetailsOnHover={false} />
          </div>

          <nav className="flex flex-col gap-2">
            <button
              onClick={() => {
                setActiveView('public');
                setIsMobileDrawerOpen(false);
              }}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all ${
                activeView === 'public'
                  ? 'bg-[#00e5ff]/15 text-[#00e5ff] border border-[#00e5ff]/30 font-semibold'
                  : 'text-[#bac9cc] hover:bg-[#181e36] hover:text-[#dce1ff]'
              }`}
            >
              <span translate="no" className="notranslate material-symbols-outlined text-[20px]">grid_view</span>
              <span className="font-['Space_Grotesk'] text-[16px]">Inicio</span>
            </button>

            <a
              href="#arquitectura"
              onClick={() => {
                setActiveView('public');
                setIsMobileDrawerOpen(false);
              }}
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-[#bac9cc] hover:bg-[#181e36] hover:text-[#00e5ff] transition-all"
            >
              <span translate="no" className="notranslate material-symbols-outlined text-[20px]">hub</span>
              <span className="font-['Space_Grotesk'] text-[16px]">Arquitectura</span>
            </a>

            <a
              href="#seguridad-cifrado"
              onClick={() => {
                setActiveView('public');
                setIsMobileDrawerOpen(false);
              }}
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-[#bac9cc] hover:bg-[#181e36] hover:text-[#00e5ff] transition-all"
            >
              <span translate="no" className="notranslate material-symbols-outlined text-[20px]">lock</span>
              <span className="font-['Space_Grotesk'] text-[16px]">Seguridad</span>
            </a>

            <button
              onClick={() => {
                handlePortalClientesClick();
                setIsMobileDrawerOpen(false);
              }}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all ${
                (activeView as string) === 'client'
                  ? 'bg-[#00e5ff]/15 text-[#00e5ff] border border-[#00e5ff]/30 font-semibold'
                  : 'text-[#bac9cc] hover:bg-[#181e36] hover:text-[#dce1ff]'
              }`}
            >
              <span translate="no" className="notranslate material-symbols-outlined text-[20px]">domain</span>
              <span className="font-['Space_Grotesk'] text-[16px]">Portal Clientes B2B</span>
            </button>

            <button
              onClick={() => {
                setIsMobileDrawerOpen(false);
                navigateToAdmin();
              }}
              className="w-full flex items-center justify-between px-4 py-3 rounded-lg text-left transition-all text-[#bac9cc] hover:bg-[#181e36] hover:text-[#00fe66] border border-[#00fe66]/20 bg-[#060d24]/60 cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <span translate="no" className="notranslate material-symbols-outlined text-[20px] text-[#00fe66]">admin_panel_settings</span>
                <span className="font-['Space_Grotesk'] text-[16px]">Panel Admin Socios</span>
              </div>
              <span translate="no" className="notranslate material-symbols-outlined text-[16px] text-[#00fe66]">arrow_forward</span>
            </button>
          </nav>
        </div>

        <div className="p-6 bg-[#060d24] border-t border-[#181e36]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded bg-[#00e5ff]/10 border border-[#00e5ff]/30 flex items-center justify-center text-[#00e5ff]">
              <span translate="no" className="notranslate material-symbols-outlined text-[22px]">verified_user</span>
            </div>
            <div>
              <p className="font-['JetBrains_Mono'] text-[13px] text-[#dce1ff] font-semibold">
                Acceso Zero-Trust
              </p>
              <p className="font-['JetBrains_Mono'] text-[11px] text-[#00fe66]">v2.4.1 SECURED</p>
            </div>
          </div>
        </div>
      </aside>

      {/* MAIN VIEW CONTAINER - PUBLIC LANDING */}
      <main className="flex-1 w-full pt-16 flex flex-col items-center">
        <div className="w-full">
          <PublicLanding
            onNavigateToAdmin={navigateToAdmin}
            isMobileDrawerOpen={isMobileDrawerOpen}
            setIsMobileDrawerOpen={setIsMobileDrawerOpen}
          />
        </div>
      </main>

      {/* FLOATING ACTION ARROWS (Framer Motion FABs for smooth scrolling) */}
      <div className="fixed right-4 bottom-20 md:bottom-8 z-40 flex flex-col gap-2">
        <motion.button
          whileHover={{ scale: 1.1, boxShadow: '0 0 20px rgba(0, 229, 255, 0.5)' }}
          whileTap={{ scale: 0.92 }}
          onClick={scrollToTop}
          aria-label="Desplazar hacia arriba"
          className="w-11 h-11 rounded-full bg-[#181e36]/90 border border-[#00e5ff]/50 text-[#00e5ff] flex items-center justify-center backdrop-blur-xl shadow-[0_0_16px_rgba(0,229,255,0.25)] hover:bg-[#00e5ff] hover:text-[#00363d] transition-colors"
        >
          <ChevronUp className="w-5 h-5" />
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.1, boxShadow: '0 0 20px rgba(0, 229, 255, 0.5)' }}
          whileTap={{ scale: 0.92 }}
          onClick={scrollToBottom}
          aria-label="Desplazar hacia abajo"
          className="w-11 h-11 rounded-full bg-[#181e36]/90 border border-[#00e5ff]/50 text-[#00e5ff] flex items-center justify-center backdrop-blur-xl shadow-[0_0_16px_rgba(0,229,255,0.25)] hover:bg-[#00e5ff] hover:text-[#00363d] transition-colors"
        >
          <ChevronDown className="w-5 h-5" />
        </motion.button>
      </div>

      {/* MOBILE BOTTOM NAVIGATION BAR (Exact to Image 1) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 pb-safe bg-[#060d24]/95 border-t border-[#181e36] backdrop-blur-xl shadow-[0_-4px_24px_rgba(0,0,0,0.5)]">
        <div className="flex justify-around items-center h-16 px-1">
          <button
            onClick={() => setActiveView('public')}
            className={`flex flex-col items-center justify-center gap-1 w-14 h-14 transition-colors ${
              activeView === 'public' ? 'text-[#00e5ff] font-semibold' : 'text-[#bac9cc] hover:text-[#dce1ff]'
            }`}
          >
            <span translate="no" className="notranslate material-symbols-outlined text-[22px]">home</span>
            <span className="font-['JetBrains_Mono'] text-[10px]">Inicio</span>
          </button>
          <button
            onClick={handlePortalClientesClick}
            className={`flex flex-col items-center justify-center gap-1 w-14 h-14 transition-colors ${
              (activeView as string) === 'client' ? 'text-[#00e5ff] font-semibold' : 'text-[#bac9cc] hover:text-[#dce1ff]'
            }`}
          >
            <span translate="no" className="notranslate material-symbols-outlined text-[22px]">domain</span>
            <span className="font-['JetBrains_Mono'] text-[10px]">Portal</span>
          </button>
          <a
            href="#arquitectura"
            onClick={() => setActiveView('public')}
            className="flex flex-col items-center justify-center gap-1 w-14 h-14 text-[#bac9cc] hover:text-[#00e5ff] transition-colors"
          >
            <span translate="no" className="notranslate material-symbols-outlined text-[22px]">hub</span>
            <span className="font-['JetBrains_Mono'] text-[10px]">Arquitectura</span>
          </a>
          <a
            href="#seguridad-cifrado"
            onClick={() => setActiveView('public')}
            className="flex flex-col items-center justify-center gap-1 w-14 h-14 text-[#bac9cc] hover:text-[#00e5ff] transition-colors"
          >
            <span translate="no" className="notranslate material-symbols-outlined text-[22px]">security</span>
            <span className="font-['JetBrains_Mono'] text-[10px]">Seguridad</span>
          </a>
          <button
            onClick={navigateToAdmin}
            className="flex flex-col items-center justify-center gap-1 w-14 h-14 transition-colors text-[#bac9cc] hover:text-[#00fe66] cursor-pointer"
            title="Panel de Administración Zero-Trust"
          >
            <span translate="no" className="notranslate material-symbols-outlined text-[22px] text-[#00fe66]">admin_panel_settings</span>
            <span className="font-['JetBrains_Mono'] text-[10px]">Admin</span>
          </button>
        </div>
      </nav>

      {/* FOOTER */}
      <footer className="w-full bg-[#060d24] border-t border-[#181e36] py-8 text-center md:text-left">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-col items-center md:items-start gap-1">
            <div className="flex items-center gap-2">
              <span className="font-['Space_Grotesk'] text-[16px] text-[#dce1ff] font-bold">MRCA Solutions</span>
              <span className="font-['JetBrains_Mono'] text-[10px] px-2 py-0.5 rounded bg-[#181e36] text-[#00daf3]">
                SYS.VER.4.12
              </span>
            </div>
            <p className="font-['Inter'] text-[12px] text-[#bac9cc]">
              Operational precision and zero-trust high-assurance systems architecture.
            </p>
          </div>

          <div className="flex items-center gap-4 font-['JetBrains_Mono'] text-[11px] text-[#bac9cc] uppercase">
            <span className="hover:text-[#00e5ff] cursor-pointer">SOC2 Type II</span>
            <span>•</span>
            <span className="hover:text-[#00e5ff] cursor-pointer">ISO 27001</span>
            <span>•</span>
            <span className="hover:text-[#00e5ff] cursor-pointer">Encrypted Enclave</span>
          </div>

          <div className="font-['JetBrains_Mono'] text-[11px] text-[#849396]">
            © 2025-2026 MRCA Solutions Inc. All rights reserved.
          </div>
        </div>
      </footer>

      {/* GLOBAL COMPLIANCE LEGAL FOOTER */}
      <LegalFooter
        onNavigate={(route) => {
          if (route === '/legal/terminos') setActiveView('legal-terminos');
          else if (route === '/legal/privacidad') setActiveView('legal-privacidad');
          else if (route === '/legal/sla') setActiveView('legal-sla');
          else if (route === '/legal/aup') setActiveView('legal-aup');
        }}
      />

      {/* 10-SECOND 3D COMPANY VIDEO SPLASH — now handled by early return gate above */}

      {/* FLOATING HUD TOAST NOTIFICATION */}
      {toastMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl bg-[#141a32] border border-[#00e5ff]/50 shadow-[0_10px_30px_rgba(0,0,0,0.8),0_0_20px_rgba(0,229,255,0.3)] flex items-center gap-3 animate-bounce">
          <span translate="no" className="notranslate material-symbols-outlined text-[#00fe66] text-[22px]">check_circle</span>
          <span className="font-['JetBrains_Mono'] text-[12px] text-[#dce1ff] font-medium">{toastMessage}</span>
        </div>
      )}

      {/* SUPABASE LOGIN & ROUTE PROTECTION MODAL */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onSuccess={(user) => {
          setSessionUser(user);
          if (user?.role === 'admin' || user?.isAdmin) {
            if (window.location.pathname !== '/admin') {
              window.history.pushState(null, '', '/admin');
            }
            setActiveView('admin');
            showToast('Bienvenido al Enclave de Administración Zero-Trust.');
          } else if (user?.role === 'student') {
            if (window.location.pathname !== '/academy') {
              window.history.pushState(null, '', '/academy');
            }
            setActiveView('academy');
          } else {
            if (window.location.pathname !== '/clientes') {
              window.history.pushState(null, '', '/clientes');
            }
            setActiveView('client');
          }
        }}
        showToast={showToast}
      />
    </div>
  );
}
