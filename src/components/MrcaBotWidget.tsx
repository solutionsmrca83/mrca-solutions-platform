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
  Clock,
  Info,
  Calculator,
  RotateCcw,
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
  { label: '💰 Cotizar Proyecto (Estimado)', command: '__START_QUOTE__' },
  { label: '🛠️ Resolver un Problema', command: '__START_SUPPORT__' },
  { label: '📄 Contratos y Facturación', command: '__SUPPORT_PAGOS__' },
  { label: '👤 Hablar con un Especialista', command: '__START_ESCALATION__' },
];

/**
 * Renderiza negritas (**texto**), cursivas (*texto*) e inline code (`texto`) de forma segura.
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

  // Sincronización con el CookieConsent Gate global
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

  // Respeto estricto al bloqueador CookieConsent
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

    // Indicador natural "escribiendo..." entre 400ms y 650ms
    const typingDelayMs = 415 + Math.floor(Math.random() * 225);

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
          text: 'Ocurrió un inconveniente temporal al procesar tu solicitud. Intenta de nuevo o selecciona **"👤 Hablar con un Especialista"**.',
          timestamp: new Date().toLocaleTimeString('es-MX', {
            hour: '2-digit',
            minute: '2-digit',
          }),
          quickReplies: [
            { label: '💰 Cotizar Proyecto (Estimado)', value: '__START_QUOTE__', variant: 'primary' },
            { label: '👤 Hablar con un Especialista', value: '__START_ESCALATION__', variant: 'warning' },
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

  const handleCardCta = (action?: 'open_portal' | 'new_quote' | 'reset') => {
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
    if (action === 'new_quote') {
      void handleDispatchMessage('__START_QUOTE__', '💰 Cotizar Proyecto (Estimado)');
      return;
    }
    if (action === 'reset') {
      handleResetChat();
    }
  };

  const getInputPlaceholder = () => {
    switch (sessionState.step) {
      case 'quote_service':
        return 'Elige un servicio arriba o escríbelo...';
      case 'quote_scope':
        return 'Elige Esencial, Empresarial o Alto Alcance...';
      case 'onboarding_name':
        return 'Escribe tu nombre completo...';
      case 'onboarding_company':
        return 'Nombre de tu empresa o negocio...';
      case 'onboarding_email':
        return 'tu.correo@empresa.com';
      case 'escalation_email':
        return 'Ingresa tu correo de contacto...';
      case 'escalation_summary':
        return 'Describe brevemente tu situación...';
      default:
        return 'Cotiza tu proyecto o escribe tu consulta...';
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

  const triggerPositionClass =
    scope === 'public'
      ? 'fixed right-4 bottom-20 md:bottom-6 md:right-6 z-40'
      : 'fixed right-4 bottom-4 md:bottom-6 md:right-6 z-40';

  const drawerPositionClass =
    scope === 'public'
      ? 'fixed inset-x-3 bottom-20 sm:inset-x-auto sm:right-6 sm:bottom-6 sm:w-[440px] z-50'
      : 'fixed inset-x-3 bottom-3 sm:inset-x-auto sm:right-6 sm:bottom-6 sm:w-[440px] z-50';

  const latestMessageId = messages[messages.length - 1]?.id;

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
            aria-label="Abrir Asistente Ejecutivo y Cotizador MRCA"
            className="group relative flex items-center gap-3 px-4 py-3 rounded-2xl bg-slate-900/95 backdrop-blur-xl border border-cyan-500/40 text-slate-100 shadow-[0_0_25px_rgba(6,182,212,0.25)] hover:border-cyan-400 hover:shadow-[0_0_20px_rgba(6,182,212,0.8)] hover:scale-105 transition-all cursor-pointer"
          >
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
                Cotizador Instantáneo y Soporte
              </span>
            </div>

            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-500/20 to-teal-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-300 group-hover:bg-cyan-400 group-hover:text-slate-950 transition-all shrink-0">
              <MessageSquare className="w-4 h-4" />
            </div>
          </button>
        </motion.div>
      )}

      {/* DRAWER CONVERSACIONAL GLASSMORPHISM (ABIERTO) */}
      <AnimatePresence>
        {isOpen && (
          <motion.aside
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.96 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className={`${drawerPositionClass} rounded-2xl bg-slate-900/95 backdrop-blur-xl border border-cyan-500/40 shadow-[0_0_25px_rgba(6,182,212,0.25)] animate-border-pulse overflow-hidden flex flex-col font-['Inter'] ${
              isMinimized ? 'h-auto' : 'h-[min(620px,calc(100dvh-7.5rem))] sm:h-[620px] sm:max-h-[85vh]'
            } ${className}`}
          >
            {/* ENCABEZADO */}
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
                    <span className="truncate">Cotizador MXN, CRM y Soporte Nivel 1</span>
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
                {/* CHIPS PERSISTENTES DE ACCIÓN RÁPIDA */}
                <div className="px-3 py-2 bg-slate-950/75 border-b border-cyan-500/20 shrink-0">
                  <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
                    {PERSISTENT_QUICK_ACTIONS.map((action) => (
                      <button
                        key={action.command}
                        type="button"
                        disabled={isTyping}
                        onClick={() => void handleDispatchMessage(action.command, action.label)}
                        className="px-2.5 py-1.5 rounded-lg text-[11px] font-medium bg-slate-800/85 border border-cyan-500/30 text-cyan-200 hover:bg-cyan-500/20 hover:border-cyan-400 hover:text-white transition-all whitespace-nowrap cursor-pointer disabled:opacity-40 shrink-0"
                      >
                        {action.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* CONVERSACIÓN */}
                <div className="flex-1 overflow-y-auto p-3.5 sm:p-4 space-y-3.5 scrollbar-thin scrollbar-thumb-cyan-900/50 scrollbar-track-transparent">
                  {messages.map((msg) => {
                    const isLatest = msg.id === latestMessageId;
                    return (
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

                        {/* Insignia visual de confirmación Supabase */}
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

                        {/* Burbuja de texto */}
                        <div
                          className={`max-w-[93%] rounded-2xl px-3.5 py-2.5 text-[12.5px] leading-relaxed ${
                            msg.sender === 'user'
                              ? 'bg-gradient-to-r from-cyan-500/20 to-teal-500/20 border border-cyan-400/40 text-cyan-50 rounded-tr-sm'
                              : 'bg-slate-800/85 border border-slate-700/70 text-slate-200 rounded-tl-sm shadow-md'
                          }`}
                        >
                          <div>{renderFormattedText(msg.text)}</div>
                        </div>

                        {/* TARJETA DESTACADA DE COTIZACIÓN ESTIMADA (MXN) + AVISO OBLIGATORIO */}
                        {msg.quoteCard && (
                          <div className="mt-2.5 w-full rounded-2xl bg-gradient-to-br from-slate-950/95 via-[#0b1736]/95 to-slate-950/95 border border-cyan-400/50 p-4 shadow-[0_0_25px_rgba(6,182,212,0.2)] flex flex-col gap-3">
                            {/* Header de tarjeta */}
                            <div className="flex items-start justify-between gap-2 pb-2.5 border-b border-cyan-500/20">
                              <div className="flex items-center gap-2 min-w-0">
                                <div className="w-8 h-8 rounded-xl bg-cyan-500/15 border border-cyan-400/40 flex items-center justify-center text-cyan-300 shrink-0">
                                  <Calculator className="w-4 h-4" />
                                </div>
                                <div className="min-w-0">
                                  <div className="font-['JetBrains_Mono'] text-[9.5px] uppercase tracking-wider text-cyan-400 font-bold">
                                    Tarjeta de Cotización Estimada
                                  </div>
                                  <div className="font-['Space_Grotesk'] text-[13.5px] font-bold text-white truncate">
                                    {msg.quoteCard.serviceType}
                                  </div>
                                </div>
                              </div>
                              <span className="px-2 py-0.5 rounded-lg bg-cyan-950/90 border border-cyan-500/40 font-['JetBrains_Mono'] text-[9.5px] text-cyan-200 font-bold shrink-0">
                                {msg.quoteCard.projectScope}
                              </span>
                            </div>

                            {/* Rango de inversión MXN destacado */}
                            <div className="p-3 rounded-xl bg-slate-900/90 border border-emerald-500/35 flex flex-col gap-1">
                              <span className="font-['JetBrains_Mono'] text-[10px] uppercase text-slate-400">
                                Rango de Inversión Estimado
                              </span>
                              <div className="font-['Space_Grotesk'] text-[20px] font-bold text-emerald-400 tracking-tight leading-tight">
                                {msg.quoteCard.formattedRange}
                              </div>
                              <span className="text-[10.5px] text-slate-400">
                                {msg.quoteCard.summary}
                              </span>
                            </div>

                            {/* Entrega y Esquema de Anticipo SPEI */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                              <div className="p-2.5 rounded-xl bg-slate-900/80 border border-white/10 flex flex-col gap-0.5">
                                <span className="font-['JetBrains_Mono'] text-[9.5px] uppercase text-slate-400 flex items-center gap-1">
                                  <Clock className="w-3 h-3 text-cyan-400" />
                                  <span>Entrega aproximada</span>
                                </span>
                                <span className="font-semibold text-white">
                                  {msg.quoteCard.deliveryTime}
                                </span>
                              </div>
                              <div className="p-2.5 rounded-xl bg-slate-900/80 border border-white/10 flex flex-col gap-0.5">
                                <span className="font-['JetBrains_Mono'] text-[9.5px] uppercase text-slate-400">
                                  Esquema de inicio
                                </span>
                                <span className="font-semibold text-cyan-300">
                                  {msg.quoteCard.advanceLabel}
                                </span>
                              </div>
                            </div>

                            {/* AVISO OBLIGATORIO DE TRANSPARENCIA COMERCIAL (DESTACADO) */}
                            <div className="p-3 rounded-xl bg-amber-500/12 border border-amber-400/45 flex items-start gap-2.5 shadow-inner">
                              <Info className="w-4 h-4 text-amber-300 shrink-0 mt-0.5" />
                              <p className="text-[11px] leading-relaxed text-amber-100 font-medium">
                                {msg.quoteCard.disclaimer}
                              </p>
                            </div>

                            {/* Botones de acción directos de la tarjeta */}
                            {isLatest && !isTyping && (
                              <div className="flex flex-col gap-2 pt-1">
                                <button
                                  type="button"
                                  onClick={() =>
                                    void handleDispatchMessage(
                                      '__ACCEPT_QUOTE__',
                                      '✅ Aceptar Estimado y Registrar mi Proyecto'
                                    )
                                  }
                                  className="w-full py-2.5 px-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-400 text-slate-950 font-['Space_Grotesk'] text-[12px] font-bold flex items-center justify-center gap-1.5 shadow-[0_0_14px_rgba(6,182,212,0.45)] hover:shadow-[0_0_20px_rgba(6,182,212,0.8)] hover:scale-[1.02] transition-all cursor-pointer"
                                >
                                  <span>✅ Aceptar Estimado y Registrar mi Proyecto</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    void handleDispatchMessage(
                                      '__START_QUOTE__',
                                      '🔄 Cotizar Otro Servicio'
                                    )
                                  }
                                  className="w-full py-2 px-3 rounded-xl bg-slate-800/90 hover:bg-slate-700/90 border border-cyan-500/30 text-cyan-200 font-['Inter'] text-[11.5px] font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                                >
                                  <RotateCcw className="w-3.5 h-3.5" />
                                  <span>🔄 Cotizar Otro Servicio</span>
                                </button>
                              </div>
                            )}
                          </div>
                        )}

                        {/* TARJETA DE CONFIRMACIÓN (ALTA CRM / RESOLUCIÓN / ESCALACIÓN) */}
                        {msg.confirmationCard && (
                          <div
                            className={`mt-2 w-full rounded-xl p-3.5 border backdrop-blur-md flex flex-col gap-2.5 shadow-lg ${
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

                        {/* Respuestas rápidas contextuales (se omiten si ya están en los botones de quoteCard) */}
                        {msg.sender === 'bot' &&
                          !msg.quoteCard &&
                          msg.quickReplies &&
                          msg.quickReplies.length > 0 &&
                          isLatest &&
                          !isTyping && (
                            <div className="mt-2 flex flex-wrap gap-1.5 max-w-[96%]">
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
                    );
                  })}

                  {/* ANIMACIÓN SUAVE "ESCRIBIENDO..." (400ms–650ms) */}
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
                    <span>Cotización estimada y soporte 24/7</span>
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
