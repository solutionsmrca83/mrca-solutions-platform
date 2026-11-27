import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Bot,
  Send,
  X,
  RefreshCw,
  CheckCircle2,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Sparkles,
  ShieldCheck,
  MessageSquare,
} from 'lucide-react';
import {
  createInitialBotSession,
  createWelcomeMessage,
  processBotTurn,
  type BotMessageItem,
  type BotSessionState,
  type BotQuickReply,
} from '../lib/mrcaBotEngine';

export interface MrcaBotWidgetProps {
  scope?: 'public' | 'client' | 'admin';
  userEmail?: string;
  userId?: string | null;
  isCookieAccepted?: boolean;
  onOpenPortal?: () => void;
  className?: string;
}

const PERSISTENT_QUICK_ACTIONS: { label: string; command: string }[] = [
  { label: '🚀 Iniciar un Proyecto', command: '__START_PROJECT__' },
  { label: '🛠️ Resolver un Problema', command: '__START_SUPPORT__' },
  { label: '📄 Dudas de Contratos y Facturación', command: '__SUPPORT_PAGOS__' },
  { label: '👤 Hablar con Soporte', command: '__START_ESCALATION__' },
];

/**
 * Renderiza negritas (**texto**) e inline code (`texto`) de manera segura sin dangerouslySetInnerHTML.
 */
function renderFormattedText(text: string): React.ReactNode {
  const lines = text.split('\n');
  return lines.map((line, lineIdx) => {
    const parts = line.split(/(\*\*[^*]+\*\*|`[^`]+`|\*[^*]+\*)/g);
    return (
      <React.Fragment key={lineIdx}>
        {parts.map((part, idx) => {
          if (part.startsWith('**') && part.endsWith('**')) {
            return (
              <strong key={idx} className="font-semibold text-white">
                {part.slice(2, -2)}
              </strong>
            );
          }
          if (part.startsWith('`') && part.endsWith('`')) {
            return (
              <code
                key={idx}
                className="px-1.5 py-0.5 rounded bg-cyan-950/80 border border-cyan-500/30 font-['JetBrains_Mono'] text-[11px] text-cyan-300"
              >
                {part.slice(1, -1)}
              </code>
            );
          }
          if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
            return (
              <em key={idx} className="italic text-cyan-200">
                {part.slice(1, -1)}
              </em>
            );
          }
          return <React.Fragment key={idx}>{part}</React.Fragment>;
        })}
        {lineIdx < lines.length - 1 && <br />}
      </React.Fragment>
    );
  });
}

export const MrcaBotWidget: React.FC<MrcaBotWidgetProps> = ({
  scope = 'public',
  userEmail,
  userId,
  isCookieAccepted: cookieProp,
  onOpenPortal,
  className = '',
}) => {
  const [cookieGranted, setCookieGranted] = useState<boolean>(() => {
    if (typeof cookieProp === 'boolean') return cookieProp;
    if (typeof window === 'undefined') return true;
    try {
      return localStorage.getItem('mrca_cookie_consent') === 'accepted';
    } catch {
      return false;
    }
  });

  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [sessionState, setSessionState] = useState<BotSessionState>(() =>
    createInitialBotSession(userEmail, userId)
  );
  const [messages, setMessages] = useState<BotMessageItem[]>(() => [
    createWelcomeMessage(scope),
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sincronización con el Cookie Gate global
  useEffect(() => {
    if (typeof cookieProp === 'boolean') {
      setCookieGranted(cookieProp);
      return;
    }
    const syncCookie = () => {
      try {
        setCookieGranted(localStorage.getItem('mrca_cookie_consent') === 'accepted');
      } catch {
        setCookieGranted(false);
      }
    };
    syncCookie();
    window.addEventListener('storage', syncCookie);
    window.addEventListener('mrca_cookie_consent_updated', syncCookie);
    return () => {
      window.removeEventListener('storage', syncCookie);
      window.removeEventListener('mrca_cookie_consent_updated', syncCookie);
    };
  }, [cookieProp]);

  // Mantener correo/ID actualizados si el usuario inicia sesión
  useEffect(() => {
    if (userEmail || userId) {
      setSessionState((prev) => ({
        ...prev,
        userEmail: userEmail || prev.userEmail,
        userId: userId ?? prev.userId,
      }));
    }
  }, [userEmail, userId]);

  useEffect(() => {
    if (isOpen && !isMinimized) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping, isOpen, isMinimized]);

  useEffect(() => {
    if (isOpen && !isMinimized) {
      const timer = setTimeout(() => inputRef.current?.focus(), 180);
      return () => clearTimeout(timer);
    }
  }, [isOpen, isMinimized]);

  // Respeto estricto al CookieConsent Gate: nunca mostrar ni superponer antes del consentimiento
  if (!cookieGranted) {
    return null;
  }

  const handleDispatchMessage = async (rawCommandOrText: string, visibleUserLabel?: string) => {
    const cleanInput = rawCommandOrText.trim();
    if (!cleanInput || isTyping) return;

    const userText = visibleUserLabel || cleanInput;
    const nowTime = new Date().toLocaleTimeString('es-MX', {
      hour: '2-digit',
      minute: '2-digit',
    });

    const userBubble: BotMessageItem = {
      id: `usr_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
      sender: 'user',
      text: userText,
      timestamp: nowTime,
    };

    setMessages((prev) => [...prev, userBubble]);
    setInputValue('');
    setIsTyping(true);

    // Sensación conversacional fluida (400ms–700ms "escribiendo...")
    const typingDelayMs = 430 + Math.floor(Math.random() * 240);

    try {
      const [turnResult] = await Promise.all([
        processBotTurn(cleanInput, sessionState, userText),
        new Promise((resolve) => setTimeout(resolve, typingDelayMs)),
      ]);

      setSessionState(turnResult.nextState);
      setMessages((prev) => [...prev, turnResult.reply]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `err_${Date.now()}`,
          sender: 'bot',
          text: 'Ocurrió un inconveniente temporal al procesar tu solicitud. Por favor intenta de nuevo o selecciona **"👤 Hablar con Soporte"**.',
          timestamp: new Date().toLocaleTimeString('es-MX', {
            hour: '2-digit',
            minute: '2-digit',
          }),
          quickReplies: [
            { label: '🚀 Iniciar un Proyecto', value: '__START_PROJECT__', variant: 'primary' },
            { label: '👤 Hablar con Soporte', value: '__START_ESCALATION__', variant: 'warning' },
          ],
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleResetChat = () => {
    setSessionState(createInitialBotSession(userEmail, userId));
    setMessages([createWelcomeMessage(scope)]);
    setInputValue('');
  };

  const handleCardCta = (action?: 'open_portal' | 'new_project' | 'reset') => {
    if (action === 'open_portal') {
      setIsOpen(false);
      if (onOpenPortal) {
        onOpenPortal();
      } else if (typeof window !== 'undefined') {
        const portalBtn = document.getElementById('nav-btn-portal-clientes');
        if (portalBtn) {
          portalBtn.click();
        } else {
          window.location.hash = 'portal';
        }
      }
      return;
    }
    if (action === 'new_project') {
      void handleDispatchMessage('__START_PROJECT__', '🚀 Iniciar un Proyecto');
      return;
    }
    if (action === 'reset') {
      handleResetChat();
    }
  };

  const getInputPlaceholder = () => {
    switch (sessionState.step) {
      case 'onboarding_name':
        return 'Escribe tu nombre completo...';
      case 'onboarding_company':
        return 'Nombre de tu empresa o negocio...';
      case 'onboarding_email':
        return 'tu.correo@empresa.com';
      case 'onboarding_service':
        return 'Elige un servicio arriba o escríbelo...';
      case 'escalation_email':
        return 'Ingresa tu correo de contacto...';
      case 'escalation_summary':
        return 'Describe brevemente tu situación...';
      default:
        return 'Escribe tu duda o selecciona una opción...';
    }
  };

  const getQuickReplyButtonClass = (variant?: BotQuickReply['variant']) => {
    if (variant === 'primary') {
      return 'bg-gradient-to-r from-cyan-500/20 to-teal-500/20 border-cyan-400/50 text-cyan-200 hover:bg-cyan-500/30 hover:border-cyan-300 hover:text-white';
    }
    if (variant === 'success') {
      return 'bg-emerald-500/15 border-emerald-400/50 text-emerald-300 hover:bg-emerald-500/30 hover:border-emerald-300 hover:text-white';
    }
    if (variant === 'warning') {
      return 'bg-amber-500/15 border-amber-400/50 text-amber-200 hover:bg-amber-500/30 hover:border-amber-300 hover:text-white';
    }
    return 'bg-slate-800/80 border-cyan-500/30 text-slate-200 hover:bg-cyan-950/70 hover:border-cyan-400 hover:text-white';
  };

  // Posicionamiento responsivo seguro (respeta barra inferior móvil en vista pública)
  const triggerPositionClass =
    scope === 'public'
      ? 'fixed right-4 bottom-20 md:bottom-6 md:right-6 z-40'
      : 'fixed right-4 bottom-4 md:bottom-6 md:right-6 z-40';

  const drawerPositionClass =
    scope === 'public'
      ? 'fixed inset-x-3 bottom-20 sm:inset-x-auto sm:right-6 sm:bottom-6 sm:w-[430px] z-50'
      : 'fixed inset-x-3 bottom-3 sm:inset-x-auto sm:right-6 sm:bottom-6 sm:w-[430px] z-50';

  return (
    <>
      {/* BOTÓN FLOTANTE DE ACCESO RÁPIDO (CERRADO) */}
      {!isOpen && (
        <motion.div
          initial={{ scale: 0.85, opacity: 0, y: 12 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          className={`${triggerPositionClass} ${className}`}
        >
          <button
            type="button"
            onClick={() => {
              setIsOpen(true);
              setIsMinimized(false);
            }}
            aria-label="Abrir Asistente Ejecutivo MRCA"
            className="group relative flex items-center gap-3 px-4 py-3 rounded-2xl bg-slate-900/90 backdrop-blur-xl border border-cyan-500/40 text-slate-100 shadow-[0_0_25px_rgba(6,182,212,0.25)] hover:border-cyan-400 hover:shadow-[0_0_20px_rgba(6,182,212,0.8)] hover:scale-105 transition-all cursor-pointer"
          >
            {/* Indicador activo en línea */}
            <span className="relative flex h-3 w-3 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 shadow-[0_0_8px_#10b981]" />
            </span>

            <div className="flex flex-col text-left">
              <div className="flex items-center gap-1.5">
                <span className="font-['Space_Grotesk'] text-[13px] font-bold text-white group-hover:text-cyan-300 transition-colors leading-tight">
                  Asistente MRCA
                </span>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-['JetBrains_Mono'] bg-cyan-950/90 border border-cyan-500/40 text-cyan-300 font-semibold">
                  24/7
                </span>
              </div>
              <span className="font-['Inter'] text-[10.5px] text-emerald-300/90 hidden sm:inline">
                Proyectos y Soporte al Instante
              </span>
            </div>

            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-500/20 to-teal-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-300 group-hover:bg-cyan-400 group-hover:text-slate-950 transition-all shrink-0">
              <MessageSquare className="w-4 h-4" />
            </div>
          </button>
        </motion.div>
      )}

      {/* PANEL CONVERSACIONAL GLASSMORPHISM (ABIERTO) */}
      <AnimatePresence>
        {isOpen && (
          <motion.aside
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.96 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className={`${drawerPositionClass} rounded-2xl bg-slate-900/90 backdrop-blur-xl border border-cyan-500/40 shadow-[0_0_25px_rgba(6,182,212,0.25)] animate-border-pulse overflow-hidden flex flex-col font-['Inter'] ${
              isMinimized ? 'h-auto' : 'h-[min(600px,calc(100dvh-7.5rem))] sm:h-[600px] sm:max-h-[84vh]'
            } ${className}`}
          >
            {/* ENCABEZADO EJECUTIVO */}
            <div className="bg-slate-950/90 border-b border-cyan-500/25 px-4 py-3 flex items-center justify-between gap-2 shrink-0">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500/20 to-teal-500/20 border border-cyan-400/50 flex items-center justify-center text-cyan-300 shrink-0 shadow-[0_0_12px_rgba(6,182,212,0.3)]">
                  <Bot className="w-5 h-5" />
                </div>
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-['Space_Grotesk'] text-[14px] font-bold text-white truncate">
                      Asistente Ejecutivo MRCA
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 font-['JetBrains_Mono'] text-[9px] font-bold uppercase shrink-0">
                      En Línea
                    </span>
                  </div>
                  <span className="text-[10.5px] text-slate-400 flex items-center gap-1 truncate">
                    <ShieldCheck className="w-3 h-3 text-cyan-400 shrink-0" />
                    <span className="truncate">CRM Automatizado y Soporte Nivel 1</span>
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0 text-slate-400">
                <button
                  type="button"
                  onClick={handleResetChat}
                  title="Reiniciar conversación"
                  aria-label="Reiniciar conversación"
                  className="w-7 h-7 rounded-lg hover:bg-slate-800 hover:text-cyan-300 flex items-center justify-center transition-colors cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setIsMinimized(!isMinimized)}
                  title={isMinimized ? 'Expandir chat' : 'Minimizar chat'}
                  aria-label="Minimizar chat"
                  className="w-7 h-7 rounded-lg hover:bg-slate-800 hover:text-cyan-300 flex items-center justify-center transition-colors cursor-pointer"
                >
                  {isMinimized ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  title="Cerrar asistente"
                  aria-label="Cerrar asistente"
                  className="w-7 h-7 rounded-lg hover:bg-red-500/20 hover:text-red-300 flex items-center justify-center transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {!isMinimized && (
              <div className="flex-1 flex flex-col min-h-0">
                {/* BARRA PERSISTENTE DE ACCIONES RÁPIDAS EN ESPAÑOL */}
                <div className="px-3 py-2 bg-slate-950/70 border-b border-cyan-500/20 shrink-0">
                  <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
                    {PERSISTENT_QUICK_ACTIONS.map((action) => (
                      <button
                        key={action.command}
                        type="button"
                        disabled={isTyping}
                        onClick={() => void handleDispatchMessage(action.command, action.label)}
                        className="px-2.5 py-1.5 rounded-lg text-[11px] font-medium bg-slate-800/80 border border-cyan-500/30 text-cyan-200 hover:bg-cyan-500/20 hover:border-cyan-400 hover:text-white transition-all whitespace-nowrap cursor-pointer disabled:opacity-40 shrink-0"
                      >
                        {action.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* ÁREA DE CONVERSACIÓN */}
                <div className="flex-1 overflow-y-auto p-3.5 sm:p-4 space-y-3.5 scrollbar-thin scrollbar-thumb-cyan-900/50 scrollbar-track-transparent">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                    >
                      <div className="flex items-center gap-1.5 mb-1 px-1">
                        <span className="text-[10px] font-['JetBrains_Mono'] text-slate-400">
                          {msg.sender === 'user' ? 'Tú' : 'Asistente MRCA'}
                        </span>
                        <span className="text-[9.5px] text-slate-500">{msg.timestamp}</span>
                      </div>

                      {/* Badge visual de confirmación de acción Supabase */}
                      {msg.badge && (
                        <div
                          className={`mb-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border flex items-center gap-1.5 shadow-sm ${
                            msg.badge.tone === 'emerald'
                              ? 'bg-emerald-500/15 border-emerald-400/50 text-emerald-300'
                              : msg.badge.tone === 'amber'
                              ? 'bg-amber-500/15 border-amber-400/50 text-amber-300'
                              : 'bg-cyan-500/15 border-cyan-400/50 text-cyan-300'
                          }`}
                        >
                          <span>{msg.badge.text}</span>
                        </div>
                      )}

                      {/* Burbuja de mensaje */}
                      <div
                        className={`max-w-[92%] rounded-2xl px-3.5 py-2.5 text-[12.5px] leading-relaxed ${
                          msg.sender === 'user'
                            ? 'bg-gradient-to-r from-cyan-500/20 to-teal-500/20 border border-cyan-400/40 text-cyan-50 rounded-tr-sm'
                            : 'bg-slate-800/85 border border-slate-700/70 text-slate-200 rounded-tl-sm shadow-md'
                        }`}
                      >
                        <div>{renderFormattedText(msg.text)}</div>
                      </div>

                      {/* Tarjeta ejecutiva de confirmación (Alta CRM / Resolución / Escalación) */}
                      {msg.confirmationCard && (
                        <div
                          className={`mt-2 w-full max-w-[95%] rounded-xl p-3.5 border backdrop-blur-md flex flex-col gap-2.5 shadow-lg ${
                            msg.confirmationCard.type === 'lead_accepted' ||
                            msg.confirmationCard.type === 'ticket_resolved'
                              ? 'bg-emerald-950/35 border-emerald-500/40'
                              : msg.confirmationCard.type === 'ticket_escalated'
                              ? 'bg-amber-950/35 border-amber-500/40'
                              : 'bg-cyan-950/35 border-cyan-500/40'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <CheckCircle2
                                className={`w-4 h-4 shrink-0 ${
                                  msg.confirmationCard.type === 'ticket_escalated'
                                    ? 'text-amber-400'
                                    : 'text-emerald-400'
                                }`}
                              />
                              <div>
                                <div className="font-['Space_Grotesk'] text-[12.5px] font-bold text-white leading-tight">
                                  {msg.confirmationCard.title}
                                </div>
                                <div className="text-[11px] text-slate-300 leading-snug mt-0.5">
                                  {msg.confirmationCard.subtitle}
                                </div>
                              </div>
                            </div>
                            <span className="font-['JetBrains_Mono'] text-[9.5px] px-1.5 py-0.5 rounded bg-slate-950/80 border border-white/10 text-cyan-300 shrink-0">
                              #{msg.confirmationCard.folio}
                            </span>
                          </div>

                          <div className="grid grid-cols-1 gap-1 pt-2 border-t border-white/10 text-[11px]">
                            {msg.confirmationCard.details.map((d, i) => (
                              <div key={i} className="flex items-center justify-between gap-2">
                                <span className="text-slate-400">{d.label}:</span>
                                <span className="text-white font-medium text-right truncate">
                                  {d.value}
                                </span>
                              </div>
                            ))}
                          </div>

                          {msg.confirmationCard.ctaLabel && (
                            <button
                              type="button"
                              onClick={() => handleCardCta(msg.confirmationCard?.ctaAction)}
                              className="mt-1 w-full py-2 px-3 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-400 text-slate-950 font-['Space_Grotesk'] text-[12px] font-bold flex items-center justify-center gap-1.5 hover:shadow-[0_0_20px_rgba(6,182,212,0.8)] hover:scale-[1.02] transition-all cursor-pointer"
                            >
                              <span>{msg.confirmationCard.ctaLabel}</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      )}

                      {/* Respuestas rápidas contextuales del último mensaje del bot */}
                      {msg.sender === 'bot' &&
                        msg.quickReplies &&
                        msg.quickReplies.length > 0 &&
                        msg.id === messages[messages.length - 1]?.id &&
                        !isTyping && (
                          <div className="mt-2 flex flex-wrap gap-1.5 max-w-[95%]">
                            {msg.quickReplies.map((qr, idx) => (
                              <button
                                key={`${msg.id}_qr_${idx}`}
                                type="button"
                                onClick={() => void handleDispatchMessage(qr.value, qr.label)}
                                className={`px-2.5 py-1.5 rounded-xl border text-[11px] font-medium transition-all cursor-pointer ${getQuickReplyButtonClass(
                                  qr.variant
                                )}`}
                              >
                                {qr.label}
                              </button>
                            ))}
                          </div>
                        )}
                    </div>
                  ))}

                  {/* ANIMACIÓN NATURAL "ESCRIBIENDO..." (400ms-700ms) */}
                  {isTyping && (
                    <div className="flex items-start">
                      <div className="px-3.5 py-2.5 rounded-2xl rounded-tl-sm bg-slate-800/85 border border-cyan-500/30 flex items-center gap-2 text-cyan-300 text-[11.5px]">
                        <div className="flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce [animation-delay:-0.3s]" />
                          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce [animation-delay:-0.15s]" />
                          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce" />
                        </div>
                        <span className="text-slate-300">escribiendo...</span>
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>

                {/* CAMPO DE ENTRADA */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    void handleDispatchMessage(inputValue);
                  }}
                  className="p-3 bg-slate-950/90 border-t border-cyan-500/25 flex items-center gap-2 shrink-0"
                >
                  <input
                    ref={inputRef}
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    disabled={isTyping}
                    placeholder={getInputPlaceholder()}
                    className="flex-1 bg-slate-900/90 border border-cyan-500/30 focus:border-cyan-400 rounded-xl px-3.5 py-2.5 text-[12.5px] text-white placeholder-slate-500 focus:outline-none transition-all"
                  />
                  <button
                    type="submit"
                    disabled={!inputValue.trim() || isTyping}
                    aria-label="Enviar mensaje"
                    className="h-10 px-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-400 text-slate-950 font-bold text-[12px] flex items-center justify-center gap-1.5 hover:shadow-[0_0_20px_rgba(6,182,212,0.8)] hover:scale-105 transition-all disabled:opacity-40 disabled:pointer-events-none cursor-pointer shrink-0"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Enviar</span>
                  </button>
                </form>

                {/* PIE DE CONFIANZA */}
                <div className="px-3.5 py-1.5 bg-slate-950 border-t border-white/5 flex items-center justify-between text-[10px] text-slate-500 shrink-0">
                  <span className="flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-cyan-400" />
                    <span>Respuesta instantánea 24/7</span>
                  </span>
                  <span className="font-['JetBrains_Mono'] text-emerald-400/90">
                    MRCA Solutions
                  </span>
                </div>
              </div>
            )}
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
};

export default MrcaBotWidget;
