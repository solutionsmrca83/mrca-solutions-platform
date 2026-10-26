import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  DollarSign,
  Send,
  X,
  SlidersHorizontal,
  CheckCircle2,
  AlertCircle,
  Building,
  GraduationCap,
  Sparkles,
  HelpCircle,
  Clock,
  ShieldCheck,
} from 'lucide-react';
import { BudgetNegotiation, NegotiationClientType } from '../types';
import { supabase } from '../lib/supabase/client';

interface BudgetNegotiationModalProps {
  isOpen: boolean;
  onClose: () => void;
  serviceTitle: string;
  originalPrice: number;
  clientType?: NegotiationClientType;
  clientEmail?: string;
  clientName?: string;
  clientCompanyOrSchool?: string;
  onSuccess?: (negotiation: BudgetNegotiation) => void;
}

export const BudgetNegotiationModal: React.FC<BudgetNegotiationModalProps> = ({
  isOpen,
  onClose,
  serviceTitle,
  originalPrice,
  clientType = 'student',
  clientEmail = '',
  clientName = '',
  clientCompanyOrSchool = '',
  onSuccess,
}) => {
  const [selectedType, setSelectedType] = useState<NegotiationClientType>(clientType);
  const [name, setName] = useState(clientName);
  const [institution, setInstitution] = useState(clientCompanyOrSchool);
  const [email, setEmail] = useState(clientEmail);
  const [phone, setPhone] = useState('');
  const [proposedBudget, setProposedBudget] = useState<string>('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedData, setSubmittedData] = useState<BudgetNegotiation | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const numericProposed = parseFloat(proposedBudget) || 0;
  const difference = originalPrice - numericProposed;
  const discountPercent =
    originalPrice > 0 && numericProposed > 0
      ? Math.max(0, Math.min(100, Math.round(((originalPrice - numericProposed) / originalPrice) * 100)))
      : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!name.trim()) {
      setErrorMsg('Por favor introduce tu nombre o el del responsable.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setErrorMsg('Introduce un correo electrónico válido para notificarte la respuesta.');
      return;
    }
    if (numericProposed <= 0) {
      setErrorMsg('Por favor ingresa un presupuesto máximo viable en MXN.');
      return;
    }
    if (numericProposed >= originalPrice) {
      setErrorMsg(
        'El presupuesto propuesto debe ser menor al precio oficial para solicitar una reconsideración.'
      );
      return;
    }
    if (!message.trim()) {
      setErrorMsg('Por favor comparte un breve mensaje indicando el motivo o qué módulo podríamos modularizar.');
      return;
    }

    setIsSubmitting(true);

    const negotiationId = 'NEG-' + Date.now().toString().slice(-6);
    const newNegotiation: BudgetNegotiation = {
      id: negotiationId,
      client_type: selectedType,
      client_name: name.trim(),
      client_company_or_school:
        institution.trim() ||
        (selectedType === 'student' ? 'Facultad de Ingeniería' : 'Corporativo B2B'),
      client_email: email.trim(),
      client_phone: phone.trim() || undefined,
      service_title: serviceTitle,
      service_category: selectedType === 'student' ? 'academy' : 'b2b',
      original_price: originalPrice,
      proposed_budget: numericProposed,
      status: 'pending',
      message: message.trim(),
      created_at: new Date().toISOString(),
    };

    // Save to Supabase (best effort)
    try {
      await supabase.from('budget_negotiations').insert([
        {
          id: crypto.randomUUID ? crypto.randomUUID() : undefined,
          client_type: selectedType,
          client_name: newNegotiation.client_name,
          client_company_or_school: newNegotiation.client_company_or_school,
          client_email: newNegotiation.client_email,
          client_phone: newNegotiation.client_phone || null,
          service_title: newNegotiation.service_title,
          service_category: newNegotiation.service_category,
          original_price: newNegotiation.original_price,
          proposed_budget: newNegotiation.proposed_budget,
          status: 'pending',
          message: newNegotiation.message,
        },
      ]);
    } catch {
      // Local fallback
    }

    // Persist in localStorage for instant admin enclave sync
    try {
      const saved = localStorage.getItem('mrca_budget_negotiations');
      const list: BudgetNegotiation[] = saved ? JSON.parse(saved) : [];
      list.unshift(newNegotiation);
      localStorage.setItem('mrca_budget_negotiations', JSON.stringify(list));
      window.dispatchEvent(new CustomEvent('mrca_negotiation_created', { detail: newNegotiation }));
    } catch {
      // storage quota
    }

    setIsSubmitting(false);
    setSubmittedData(newNegotiation);

    if (onSuccess) {
      onSuccess(newNegotiation);
    }
  };

  const handleResetAndClose = () => {
    setSubmittedData(null);
    setProposedBudget('');
    setMessage('');
    setErrorMsg(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#050b1a]/85 backdrop-blur-xl p-4 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="relative w-full max-w-2xl rounded-3xl bg-gradient-to-b from-[#0c1633] via-[#091129] to-[#060c20] border-2 border-[#00e5ff]/50 p-6 sm:p-8 shadow-[0_0_60px_rgba(0,229,255,0.25)] flex flex-col gap-6 my-auto"
      >
        {/* Glow Effects */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-gradient-to-bl from-[#00e5ff]/10 via-transparent to-transparent pointer-events-none rounded-tr-3xl" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-gradient-to-tr from-[#00fe66]/10 via-transparent to-transparent pointer-events-none rounded-bl-3xl" />

        {/* Modal Header */}
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-[#1b2b52] relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#141f42] border border-[#00e5ff]/40 flex items-center justify-center text-[#00e5ff] shadow-[0_0_20px_rgba(0,229,255,0.35)] shrink-0">
              <SlidersHorizontal className="w-6 h-6 text-[#00e5ff]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-['JetBrains_Mono'] text-[10px] text-[#00fe66] uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#00fe66]/15 border border-[#00fe66]/30 font-bold">
                  CANAL DIRECTO DE AJUSTE
                </span>
                <span className="font-['JetBrains_Mono'] text-[10px] text-[#849396]">
                  RESPUESTA &lt; 2 HRS
                </span>
              </div>
              <h3 className="font-['Space_Grotesk'] text-[20px] sm:text-[22px] font-bold text-[#dce1ff] mt-0.5">
                Proponer Ajuste de Presupuesto
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={handleResetAndClose}
            className="p-1.5 rounded-xl bg-[#141f42]/60 hover:bg-[#1e2e60] text-[#849396] hover:text-[#dce1ff] transition-all"
            aria-label="Cerrar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body: Either Success Screen or Input Form */}
        <div className="relative z-10">
          {submittedData ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center text-center gap-5 py-4"
            >
              <div className="w-16 h-16 rounded-full bg-[#00fe66]/15 border-2 border-[#00fe66] flex items-center justify-center text-[#00fe66] shadow-[0_0_25px_rgba(0,254,102,0.4)]">
                <CheckCircle2 className="w-8 h-8 text-[#00fe66]" />
              </div>

              <div>
                <span className="font-['JetBrains_Mono'] text-[11px] text-[#00e5ff] uppercase tracking-widest font-bold">
                  FOLIO REGISTRADO: {submittedData.id}
                </span>
                <h4 className="font-['Space_Grotesk'] text-[22px] font-bold text-[#dce1ff] mt-1">
                  ¡Contraoferta Enviada a Mesa de Dirección!
                </h4>
                <p className="font-['Inter'] text-[13px] text-[#bac9cc] max-w-lg mt-2 leading-relaxed">
                  Un arquitecto líder de MRCA Solutions evaluará la viabilidad de modularizar el alcance
                  para adaptarlo a tu presupuesto propuesto de{' '}
                  <strong className="text-[#00fe66]">
                    ${submittedData.proposed_budget.toLocaleString('es-MX')} MXN
                  </strong>.
                </p>
              </div>

              {/* Summary Card */}
              <div className="w-full rounded-2xl bg-[#060c20] border border-[#1b2b52] p-4 text-left font-['JetBrains_Mono'] text-[12px] flex flex-col gap-2">
                <div className="flex justify-between items-center text-[#bac9cc] pb-2 border-b border-[#141f40]">
                  <span>SERVICIO / PROYECTO:</span>
                  <span className="text-[#dce1ff] font-bold">{submittedData.service_title}</span>
                </div>
                <div className="flex justify-between items-center text-[#bac9cc]">
                  <span>PRECIO DE LISTA ORIGINAL:</span>
                  <span className="text-[#849396] line-through">
                    ${submittedData.original_price.toLocaleString('es-MX')} MXN
                  </span>
                </div>
                <div className="flex justify-between items-center text-[#bac9cc]">
                  <span>PRESUPUESTO PROPUESTO:</span>
                  <span className="text-[#00fe66] font-bold text-[14px]">
                    ${submittedData.proposed_budget.toLocaleString('es-MX')} MXN
                  </span>
                </div>
                <div className="flex justify-between items-center text-[#bac9cc]">
                  <span>CORREO DE NOTIFICACIÓN:</span>
                  <span className="text-[#00e5ff]">{submittedData.client_email}</span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-[#0a1535] border border-[#00e5ff]/30 text-left flex items-start gap-3 w-full">
                <ShieldCheck className="w-5 h-5 text-[#00e5ff] shrink-0 mt-0.5" />
                <p className="font-['Inter'] text-[12px] text-[#bac9cc]">
                  En caso de aprobación, recibirás un enlace de pago único y seguro en tu correo con el nuevo importe y las especificaciones acordadas.
                </p>
              </div>

              <button
                type="button"
                onClick={handleResetAndClose}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#00e5ff] to-[#00fe66] hover:brightness-110 text-[#00363d] font-['Space_Grotesk'] text-[14px] font-bold uppercase tracking-wider transition-all shadow-[0_0_25px_rgba(0,229,255,0.35)]"
              >
                Entendido, Continuar Navegando
              </button>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              {/* Reference Info Banner */}
              <div className="p-3.5 rounded-2xl bg-[#060c20] border border-[#1b2b52] flex flex-wrap items-center justify-between gap-3 font-['JetBrains_Mono'] text-[12px]">
                <div className="flex flex-col">
                  <span className="text-[10px] text-[#849396] uppercase">Solución en Cotización:</span>
                  <span className="font-bold text-[#dce1ff] text-[13px]">{serviceTitle}</span>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-[10px] text-[#849396] uppercase">Precio Oficial Actual:</span>
                  <span className="font-bold text-[#00e5ff] text-[15px]">
                    ${originalPrice.toLocaleString('es-MX')} MXN
                  </span>
                </div>
              </div>

              {/* Division Selector Toggle */}
              <div className="flex items-center gap-2 p-1 rounded-xl bg-[#060c20] border border-[#1b2b52]">
                <button
                  type="button"
                  onClick={() => setSelectedType('student')}
                  className={`flex-1 py-2 px-3 rounded-lg font-['JetBrains_Mono'] text-[11px] font-bold flex items-center justify-center gap-2 transition-all ${
                    selectedType === 'student'
                      ? 'bg-[#00e5ff] text-[#00363d] shadow-[0_0_12px_rgba(0,229,255,0.4)]'
                      : 'text-[#bac9cc] hover:text-[#dce1ff]'
                  }`}
                >
                  <GraduationCap className="w-4 h-4" />
                  <span>División Estudiante / Academia</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedType('enterprise')}
                  className={`flex-1 py-2 px-3 rounded-lg font-['JetBrains_Mono'] text-[11px] font-bold flex items-center justify-center gap-2 transition-all ${
                    selectedType === 'enterprise'
                      ? 'bg-[#00fe66] text-[#00363d] shadow-[0_0_12px_rgba(0,254,102,0.4)]'
                      : 'text-[#bac9cc] hover:text-[#dce1ff]'
                  }`}
                >
                  <Building className="w-4 h-4" />
                  <span>División Enterprise / B2B</span>
                </button>
              </div>

              {/* Client Details Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-['JetBrains_Mono'] text-[11px] uppercase text-[#849396] mb-1">
                    {selectedType === 'student' ? 'Nombre del Estudiante:' : 'Representante Legal o Técnico:'} *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={selectedType === 'student' ? 'Ej: Carlos Reyes M.' : 'Ej: Ing. Jorge Sandoval'}
                    className="w-full bg-[#050b1c] border border-[#1e2a52] rounded-xl px-3.5 py-2.5 text-[#dce1ff] font-['Inter'] text-[13px] focus:outline-none focus:border-[#00e5ff]"
                  />
                </div>

                <div>
                  <label className="block font-['JetBrains_Mono'] text-[11px] uppercase text-[#849396] mb-1">
                    {selectedType === 'student' ? 'Universidad / Instituto:' : 'Empresa / Razón Social:'} *
                  </label>
                  <input
                    type="text"
                    required
                    value={institution}
                    onChange={(e) => setInstitution(e.target.value)}
                    placeholder={selectedType === 'student' ? 'Ej: UNAM / IPN / TecNM' : 'Ej: FinTech Corp S.A.'}
                    className="w-full bg-[#050b1c] border border-[#1e2a52] rounded-xl px-3.5 py-2.5 text-[#dce1ff] font-['Inter'] text-[13px] focus:outline-none focus:border-[#00e5ff]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-['JetBrains_Mono'] text-[11px] uppercase text-[#849396] mb-1">
                    Correo Electrónico (Para enviar resolución): *
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="contacto@correo.com"
                    className="w-full bg-[#050b1c] border border-[#1e2a52] rounded-xl px-3.5 py-2.5 text-[#dce1ff] font-['Inter'] text-[13px] focus:outline-none focus:border-[#00e5ff]"
                  />
                </div>

                <div>
                  <label className="block font-['JetBrains_Mono'] text-[11px] uppercase text-[#849396] mb-1">
                    Teléfono / WhatsApp (Opcional):
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+52 55 ..."
                    className="w-full bg-[#050b1c] border border-[#1e2a52] rounded-xl px-3.5 py-2.5 text-[#dce1ff] font-['Inter'] text-[13px] focus:outline-none focus:border-[#00e5ff]"
                  />
                </div>
              </div>

              {/* Proposed Budget Input */}
              <div className="p-4 rounded-2xl bg-[#070e24] border-2 border-[#00fe66]/40 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <label className="font-['JetBrains_Mono'] text-[12px] uppercase font-bold text-[#00fe66] flex items-center gap-1.5">
                    <DollarSign className="w-4 h-4 text-[#00fe66]" />
                    <span>Tu Presupuesto Máximo Viable (MXN): *</span>
                  </label>
                  {numericProposed > 0 && numericProposed < originalPrice && (
                    <span className="font-['JetBrains_Mono'] text-[11px] text-[#00fe66] font-bold px-2 py-0.5 rounded-full bg-[#00fe66]/15 border border-[#00fe66]/30">
                      -{discountPercent}% del original
                    </span>
                  )}
                </div>

                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-['JetBrains_Mono'] text-[18px] text-[#00fe66] font-bold">
                    $
                  </span>
                  <input
                    type="number"
                    min="100"
                    max={originalPrice - 1}
                    step="50"
                    required
                    value={proposedBudget}
                    onChange={(e) => setProposedBudget(e.target.value)}
                    placeholder={Math.round(originalPrice * 0.7).toString()}
                    className="w-full bg-[#050b1c] border border-[#1e2a52] rounded-xl pl-9 pr-16 py-3 text-[#00fe66] font-['Space_Grotesk'] text-[20px] font-bold focus:outline-none focus:border-[#00fe66]"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 font-['JetBrains_Mono'] text-[12px] text-[#849396] font-bold">
                    MXN
                  </span>
                </div>

                <p className="font-['Inter'] text-[11px] text-[#849396]">
                  Ajustaremos los entregables (ej: omitir sesiones en vivo, soporte extendido o despliegue en la nube) para no comprometer la calidad central de la ingeniería.
                </p>
              </div>

              {/* Justification & Scope Proposal Message */}
              <div>
                <label className="block font-['JetBrains_Mono'] text-[11px] uppercase text-[#849396] mb-1">
                  Mensaje / Propuesta de Modularización: *
                </label>
                <textarea
                  required
                  rows={3}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={
                    selectedType === 'student'
                      ? 'Ej: Somos 2 alumnos con presupuesto ajustado. Podemos omitir la reunión de simulación en Meet si nos incluye la guía en PDF...'
                      : 'Ej: Contamos con un techo presupuestal asignado para esta fase. Solicitamos priorizar el módulo central y posponer soporte secundario...'
                  }
                  className="w-full bg-[#050b1c] border border-[#1e2a52] rounded-xl px-3.5 py-2.5 text-[#dce1ff] font-['Inter'] text-[13px] focus:outline-none focus:border-[#00e5ff] resize-none"
                />
              </div>

              {errorMsg && (
                <div className="p-3 rounded-xl bg-[#ff3366]/15 border border-[#ff3366]/40 text-[#ff8099] font-['JetBrains_Mono'] text-[11px] flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleResetAndClose}
                  className="px-4 py-2.5 rounded-xl bg-[#141f42] text-[#bac9cc] hover:text-[#dce1ff] font-['JetBrains_Mono'] text-[12px] transition-colors"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#00e5ff] via-[#38ef7d] to-[#00fe66] hover:brightness-110 text-[#00363d] font-['Space_Grotesk'] text-[13px] font-extrabold uppercase tracking-wider flex items-center gap-2 transition-all shadow-[0_0_20px_rgba(0,229,255,0.4)] disabled:opacity-50 hover:scale-[1.02] active:scale-[0.98]"
                >
                  {isSubmitting ? (
                    <span>Transmitiendo a Dirección...</span>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Enviar Propuesta a Dirección</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
};
