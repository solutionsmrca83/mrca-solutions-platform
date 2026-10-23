import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Bot,
  Send,
  Sparkles,
  Minimize2,
  Maximize2,
  Terminal,
  ShieldCheck,
  Zap,
  RefreshCw,
  X,
  ChevronDown,
  ChevronUp,
  Cpu,
} from 'lucide-react';
import { queryNeuralNetwork } from '../services/aiAgent';

export interface NeuralMessage {
  id: string;
  sender: 'user' | 'agent';
  content: string;
  timestamp: string;
  isCode?: boolean;
}

interface NeuralCopilotProps {
  scope?: 'admin' | 'client';
  defaultOpen?: boolean;
  onClose?: () => void;
  className?: string;
}

const PRESET_PROMPTS = [
  'Ejecutar escaneo de vulnerabilidades',
  'Automatizar despliegue',
  'Auditar políticas Zero-Trust',
  'Inspeccionar telemetría mTLS',
];

export const NeuralCopilot: React.FC<NeuralCopilotProps> = ({
  scope = 'admin',
  defaultOpen = false,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isDocked, setIsDocked] = useState(false);
  const [inputPrompt, setInputPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<NeuralMessage[]>([
    {
      id: 'init-msg-1',
      sender: 'agent',
      content:
        scope === 'admin'
          ? 'MRCA Quantum Engine inicializado con nivel Root CISO. Motor de inferencia y automatización de infraestructura en espera de directivas operativas.'
          : 'Asistente de Ingeniería Neural activo. Listo para responder consultas de arquitectura B2B, estado de despliegues y telemetría de sus contratos.',
      timestamp: 'Ahora',
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && !isMinimized) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isMinimized]);

  const handleSendPrompt = async (promptToSend?: string) => {
    const prompt = (promptToSend || inputPrompt).trim();
    if (!prompt || isLoading) return;

    const userMessage: NeuralMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      content: prompt,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputPrompt('');
    setIsLoading(true);

    try {
      const response = await queryNeuralNetwork(prompt);
      const agentMessage: NeuralMessage = {
        id: `agent-${Date.now()}`,
        sender: 'agent',
        content: response,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isCode: response.includes('[🟢') || response.includes('•'),
      };
      setMessages((prev) => [...prev, agentMessage]);
    } catch {
      const errorMessage: NeuralMessage = {
        id: `err-${Date.now()}`,
        sender: 'agent',
        content: '[ERROR CRÍTICO] La red neuronal no pudo procesar la solicitud en el enclave.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearHistory = () => {
    setMessages([
      {
        id: `reset-${Date.now()}`,
        sender: 'agent',
        content: 'Historial del buffer neuronal depurado. Motor cuántico listo para nuevos comandos.',
        timestamp: 'Ahora',
      },
    ]);
  };

  return (
    <>
      {/* FLOATING HUD TRIGGER BUTTON WHEN CLOSED */}
      {!isOpen && (
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className={`fixed bottom-6 right-6 z-40 ${className}`}
        >
          <button
            onClick={() => setIsOpen(true)}
            className="group relative flex items-center gap-3 px-4 py-3 rounded-2xl bg-[#0A1128]/90 border border-cyan-500/40 backdrop-blur-md text-[#dce1ff] shadow-[0_0_25px_rgba(0,229,255,0.35)] hover:border-cyan-400 hover:shadow-[0_0_35px_rgba(0,229,255,0.5)] transition-all cursor-pointer"
            aria-label="Abrir Motor Neuronal MRCA Copilot"
          >
            {/* Pulsing indicator */}
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 shadow-[0_0_8px_#10b981]"></span>
            </span>

            <div className="flex flex-col text-left">
              <div className="flex items-center gap-1.5">
                <span className="font-['Space_Grotesk'] text-[13px] font-bold text-white group-hover:text-cyan-300 transition-colors">
                  MRCA Quantum Engine
                </span>
                <span className="px-1.5 py-0.2 rounded text-[9px] font-['JetBrains_Mono'] bg-cyan-950/80 border border-cyan-500/30 text-cyan-400">
                  IA v3.2
                </span>
              </div>
              <span className="font-['JetBrains_Mono'] text-[10px] text-emerald-400 flex items-center gap-1">
                🟢 Motor Neuronal: Aprendizaje Activo
              </span>
            </div>

            <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 group-hover:bg-cyan-500 group-hover:text-[#00363d] transition-all">
              <Bot className="w-4 h-4" />
            </div>
          </button>
        </motion.div>
      )}

      {/* EXPANDED / DOCKED AI INTERFACE */}
      <AnimatePresence>
        {isOpen && (
          <motion.aside
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.96 }}
            transition={{ duration: 0.2 }}
            className={`fixed z-50 transition-all font-['Inter'] ${
              isDocked
                ? 'bottom-0 right-0 w-full sm:w-[480px] h-[580px] max-h-[92vh] rounded-t-2xl sm:rounded-tl-2xl'
                : 'bottom-4 right-4 sm:bottom-6 sm:right-6 w-[calc(100vw-32px)] sm:w-[450px] md:w-[480px] rounded-2xl shadow-[0_10px_45px_rgba(0,0,0,0.8),0_0_30px_rgba(0,229,255,0.25)]'
            } bg-[#0A1128]/95 backdrop-blur-md border border-cyan-500/30 overflow-hidden flex flex-col ${
              isMinimized ? 'h-auto' : 'h-[560px] max-h-[85vh]'
            } ${className}`}
          >
            {/* COPILOT HEADER WITH PULSING INDICATOR */}
            <div className="bg-[#060D24]/95 border-b border-cyan-500/20 px-4 py-3 flex items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-500/20 to-emerald-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shrink-0 shadow-[0_0_12px_rgba(0,229,255,0.25)]">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-1.5 truncate">
                    <span className="font-['Space_Grotesk'] text-[14px] font-bold text-white truncate">
                      Neural Copilot
                    </span>
                    <span className="font-['JetBrains_Mono'] text-[9px] px-1.5 py-0.5 rounded bg-cyan-950/80 border border-cyan-500/30 text-cyan-300 uppercase tracking-widest shrink-0">
                      {scope === 'admin' ? 'ROOT ENCLAVE' : 'CLIENT B2B'}
                    </span>
                  </div>
                  {/* Pulsing indicator required */}
                  <span className="font-['JetBrains_Mono'] text-[10px] text-emerald-400 flex items-center gap-1.5 truncate">
                    <span className="relative flex h-2 w-2 shrink-0">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500 shadow-[0_0_6px_#10b981]"></span>
                    </span>
                    <span className="truncate">🟢 Motor Neuronal: Aprendizaje Activo</span>
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-1 shrink-0 text-slate-400">
                <button
                  onClick={() => setIsDocked(!isDocked)}
                  className="w-7 h-7 rounded-lg hover:bg-slate-800/60 hover:text-cyan-400 flex items-center justify-center transition-colors"
                  title={isDocked ? 'Flotar ventana' : 'Acoplar a esquina'}
                  aria-label="Alternar acoplamiento"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setIsMinimized(!isMinimized)}
                  className="w-7 h-7 rounded-lg hover:bg-slate-800/60 hover:text-cyan-400 flex items-center justify-center transition-colors"
                  title={isMinimized ? 'Expandir' : 'Minimizar'}
                  aria-label="Minimizar ventana"
                >
                  {isMinimized ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="w-7 h-7 rounded-lg hover:bg-red-500/20 hover:text-red-400 flex items-center justify-center transition-colors"
                  title="Cerrar panel de IA"
                  aria-label="Cerrar panel"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* BODY (HIDDEN WHEN MINIMIZED) */}
            {!isMinimized && (
              <div className="flex-1 flex flex-col min-h-0 bg-[#0A1128]/80">
                {/* TELEMETRY STATUS SUB-BAR */}
                <div className="bg-[#070e24]/80 border-b border-cyan-900/30 px-3.5 py-1.5 flex items-center justify-between text-[10px] font-['JetBrains_Mono'] text-slate-400 shrink-0">
                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1 text-cyan-400">
                      <Cpu className="w-3 h-3" />
                      <span>Cluster-CDMX-AI</span>
                    </span>
                    <span>•</span>
                    <span className="text-emerald-400">0.42ms Latencia</span>
                  </div>
                  <button
                    onClick={handleClearHistory}
                    className="hover:text-cyan-400 flex items-center gap-1 transition-colors cursor-pointer"
                    title="Limpiar buffer de mensajes"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Limpiar</span>
                  </button>
                </div>

                {/* CHAT MESSAGES OUTPUT AREA */}
                <div className="flex-1 p-3.5 sm:p-4 overflow-y-auto space-y-3.5 text-xs font-['Inter'] scrollbar-thin scrollbar-thumb-cyan-900/50 scrollbar-track-transparent">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                    >
                      <div className="flex items-center gap-1.5 mb-1 px-1">
                        <span className="text-[10px] font-['JetBrains_Mono'] text-slate-400">
                          {msg.sender === 'user' ? 'Operador CISO' : 'MRCA Quantum Core'}
                        </span>
                        <span className="text-[9px] text-slate-500">{msg.timestamp}</span>
                      </div>

                      <div
                        className={`max-w-[92%] rounded-xl p-3 sm:p-3.5 leading-relaxed ${
                          msg.sender === 'user'
                            ? 'bg-cyan-500/15 border border-cyan-500/40 text-cyan-100 shadow-[0_0_15px_rgba(0,229,255,0.15)]'
                            : 'bg-[#141a32]/90 border border-slate-700/60 text-slate-200 shadow-md'
                        }`}
                      >
                        {msg.isCode || msg.content.includes('[🟢') ? (
                          <pre className="font-['JetBrains_Mono'] text-[11px] whitespace-pre-wrap leading-relaxed text-emerald-300 selection:bg-emerald-900/60 overflow-x-auto">
                            {msg.content}
                          </pre>
                        ) : (
                          <p className="whitespace-pre-wrap">{msg.content}</p>
                        )}
                      </div>
                    </div>
                  ))}

                  {/* LOADING TELEMETRY PULSE */}
                  {isLoading && (
                    <div className="flex items-center gap-2 p-3 rounded-xl bg-[#141a32]/70 border border-cyan-500/30 max-w-[85%] text-cyan-300">
                      <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
                      <span className="font-['JetBrains_Mono'] text-[11px] animate-pulse">
                        Inyectando instrucción en el motor neuronal cuántico...
                      </span>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>

                {/* QUICK PROMPT CHIPS */}
                <div className="p-2 border-t border-cyan-900/30 bg-[#060D24]/60 overflow-x-auto no-scrollbar shrink-0">
                  <div className="flex items-center gap-1.5 w-max">
                    <span className="text-[10px] font-['JetBrains_Mono'] text-slate-400 px-1 flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-cyan-400" />
                      <span>Comandos:</span>
                    </span>
                    {PRESET_PROMPTS.map((promptText, i) => (
                      <button
                        key={i}
                        onClick={() => handleSendPrompt(promptText)}
                        disabled={isLoading}
                        className="px-2.5 py-1 rounded-lg text-[10px] font-['JetBrains_Mono'] bg-cyan-950/70 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/20 hover:border-cyan-400 hover:text-white transition-all disabled:opacity-50 whitespace-nowrap cursor-pointer shadow-sm"
                      >
                        {promptText}
                      </button>
                    ))}
                  </div>
                </div>

                {/* INPUT FIELD FOR PROMPTS */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendPrompt();
                  }}
                  className="p-3 bg-[#060D24] border-t border-cyan-500/20 flex items-center gap-2 shrink-0"
                >
                  <div className="relative flex-1">
                    <input
                      ref={inputRef}
                      type="text"
                      value={inputPrompt}
                      onChange={(e) => setInputPrompt(e.target.value)}
                      placeholder={
                        scope === 'admin'
                          ? 'Comando: Ejecutar escaneo, automatizar despliegue...'
                          : 'Consultar estado de infraestructura o SLA...'
                      }
                      disabled={isLoading}
                      className="w-full bg-[#0A1128] border border-cyan-900/60 focus:border-cyan-400 rounded-xl px-3.5 py-2.5 text-[12px] text-white placeholder-slate-500 focus:outline-none font-['Inter'] transition-all shadow-inner"
                    />
                    <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1 pointer-events-none">
                      <span className="font-['JetBrains_Mono'] text-[9px] px-1 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                        ↵ Enter
                      </span>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={!inputPrompt.trim() || isLoading}
                    className="h-10 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-cyan-400 hover:from-cyan-400 hover:to-cyan-300 text-[#00363d] font-bold text-[12px] flex items-center justify-center gap-1.5 transition-all shadow-[0_0_15px_rgba(0,229,255,0.4)] disabled:opacity-40 disabled:pointer-events-none cursor-pointer shrink-0"
                    aria-label="Enviar comando"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Ejecutar</span>
                  </button>
                </form>
              </div>
            )}
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
};

export default NeuralCopilot;
