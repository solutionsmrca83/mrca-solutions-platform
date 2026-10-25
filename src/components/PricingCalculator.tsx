import React, { useState, useId } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Calculator,
  Database,
  FileText,
  Clock,
  Sparkles,
  CheckCircle2,
  HelpCircle,
  ExternalLink,
  ShieldCheck,
  Zap,
  GraduationCap,
  Tag,
  Percent,
  SlidersHorizontal,
  X,
  AlertCircle,
  ArrowDown,
} from 'lucide-react';
import { evaluateDiscountCode, ApplyDiscountResult } from '../lib/discounts';
import { BudgetNegotiationModal } from './BudgetNegotiationModal';


export type ProjectComplexity = 'basico' | 'intermedio' | 'avanzado';

interface ComplexityOption {
  id: ProjectComplexity;
  title: string;
  subtitle: string;
  basePrice: number;
  deliveryDays: string;
  features: string[];
}

const COMPLEXITY_TIERS: ComplexityOption[] = [
  {
    id: 'basico',
    title: 'Nivel 1: Prototipo / Módulo Base',
    subtitle: 'Ideal para tareas semestrales o prácticas específicas de laboratorio.',
    basePrice: 1600,
    deliveryDays: '2 a 3 días',
    features: [
      'Funcionalidad principal resuelta',
      'Código estructurado y limpio',
      'Comentarios esenciales en funciones',
      'Instrucciones breves de ejecución',
    ],
  },
  {
    id: 'intermedio',
    title: 'Nivel 2: Sistema Integrado Modular',
    subtitle: 'Proyectos de fin de curso con integración de dos o más tecnologías.',
    basePrice: 2800,
    deliveryDays: '4 a 6 días',
    features: [
      'Arquitectura modular (Frontend + Backend/IoT)',
      'Validaciones de datos y manejo de errores',
      '100% Código comentado pedagógicamente',
      'Soporte para 1 ronda de ajustes de rúbrica',
    ],
  },
  {
    id: 'avanzado',
    title: 'Nivel 3: Proyecto Integrador / Titulación',
    subtitle: 'Soluciones complejas de alta exigencia para residencias o titulación.',
    basePrice: 4200,
    deliveryDays: '7 a 10 días',
    features: [
      'Arquitectura completa de ingeniería',
      'Múltiples módulos interconectados',
      'Guía de defensa y preguntas trampa del sínodo',
      'Sesión de simulación de presentación en vivo',
    ],
  },
];

interface PricingCalculatorProps {
  onReserve?: (quote: QuoteSummary) => void;
  showToast?: (msg: string) => void;
}

export interface QuoteSummary {
  complexity: ProjectComplexity;
  complexityTitle: string;
  hasDatabase: boolean;
  hasDocumentation: boolean;
  isUrgent: boolean;
  hasDefenseSession: boolean;
  totalPrice: number;
  depositPrice: number;
  deliveryDays: string;
}

export const PricingCalculator: React.FC<PricingCalculatorProps> = ({
  onReserve,
  showToast,
}) => {
  const [complexity, setComplexity] = useState<ProjectComplexity>('intermedio');
  const [hasDatabase, setHasDatabase] = useState(true);
  const [hasDocumentation, setHasDocumentation] = useState(true);
  const [isUrgent, setIsUrgent] = useState(false);
  const [hasDefenseSession, setHasDefenseSession] = useState(false);
  const [isReserving, setIsReserving] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [couponInput, setCouponInput] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState<ApplyDiscountResult | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [isNegotiationOpen, setIsNegotiationOpen] = useState(false);

  // Price calculation constants
  const DB_PRICE = 650;
  const DOCS_PRICE = 750;
  const URGENT_PRICE = 600;
  const DEFENSE_PRICE = 450;

  const currentTier = COMPLEXITY_TIERS.find((t) => t.id === complexity)!;

  const rawTotalPrice =
    currentTier.basePrice +
    (hasDatabase ? DB_PRICE : 0) +
    (hasDocumentation ? DOCS_PRICE : 0) +
    (isUrgent ? URGENT_PRICE : 0) +
    (hasDefenseSession ? DEFENSE_PRICE : 0);

  const discountAmount = appliedDiscount?.isValid
    ? Math.round((rawTotalPrice * appliedDiscount.discountPercentage) / 100)
    : 0;

  const totalPrice = Math.max(0, rawTotalPrice - discountAmount);
  const depositPrice = Math.round(totalPrice * 0.5);

  const estimatedDelivery = isUrgent
    ? '24 a 48 horas (Prioritario)'
    : currentTier.deliveryDays;

  const currentQuote: QuoteSummary = {
    complexity,
    complexityTitle: currentTier.title,
    hasDatabase,
    hasDocumentation,
    isUrgent,
    hasDefenseSession,
    totalPrice,
    depositPrice,
    deliveryDays: estimatedDelivery,
  };

  const handleApplyCoupon = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setCouponError(null);
    const res = evaluateDiscountCode(couponInput, rawTotalPrice, 'student');
    if (!res.isValid) {
      setCouponError(res.errorMessage || 'Código no válido');
      setAppliedDiscount(null);
      if (showToast) showToast(res.errorMessage || 'Código de alianza / beca no válido');
    } else {
      setAppliedDiscount(res);
      if (showToast) {
        showToast(`¡Código ${res.coupon?.code} aplicado con éxito (-${res.discountPercentage}%)!`);
      }
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedDiscount(null);
    setCouponInput('');
    setCouponError(null);
    if (showToast) showToast('Código de descuento removido.');
  };


  const handleCheckoutStripe = () => {
    setIsReserving(true);
    if (showToast) {
      showToast('Generando enlace seguro de Stripe Escrow...');
    }

    // Pre-built Stripe Payment Link or dynamic fallback
    const stripePaymentUrl =
      'https://buy.stripe.com/test_mcra_academy_deposit?client_reference_id=' +
      Date.now() +
      '&prefilled_email=estudiante@ingenieria.edu';

    setTimeout(() => {
      setIsReserving(false);
      setShowConfirmation(true);
      if (onReserve) {
        onReserve(currentQuote);
      }
    }, 900);
  };

  const dbToggleId = useId();
  const docsToggleId = useId();
  const urgentToggleId = useId();
  const defenseToggleId = useId();

  return (
    <div className="w-full rounded-3xl bg-[#0d1633]/85 border-2 border-[#00e5ff]/35 p-5 sm:p-8 backdrop-blur-2xl shadow-[0_10px_50px_rgba(0,229,255,0.15)] flex flex-col gap-8 relative overflow-hidden">
      {/* Background Cyber Elements */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-[#00e5ff]/10 via-transparent to-transparent pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-gradient-to-tr from-[#00fe66]/5 via-transparent to-transparent pointer-events-none"></div>

      {/* Calculator Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#1c274a] relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#141e3d] border border-[#00e5ff]/40 flex items-center justify-center text-[#00e5ff] shadow-[0_0_16px_rgba(0,229,255,0.3)]">
            <Calculator className="w-6 h-6 text-[#00e5ff]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-['Space_Grotesk'] text-[20px] sm:text-[22px] font-bold text-[#dce1ff]">
                Cotizador Inteligente para Estudiantes
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-[#00fe66]/15 border border-[#00fe66]/30 text-[#00fe66] font-['JetBrains_Mono'] text-[10px] font-bold tracking-wider uppercase">
                EN VIVO
              </span>
            </div>
            <p className="font-['Inter'] text-[12px] sm:text-[13px] text-[#bac9cc]">
              Selecciona los módulos de tu proyecto. El precio es transparente y el anticipo se congela vía Stripe.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#060c20] border border-[#23315a] font-['JetBrains_Mono'] text-[11px] text-[#00daf3] self-start sm:self-auto">
          <Sparkles className="w-4 h-4 text-[#00e5ff]" />
          <span>GARANTÍA DE APROBACIÓN 100%</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 relative z-10">
        {/* ==================================================================== */}
        {/* LEFT COLUMN: Controls & Toggles (7 cols)                            */}
        {/* ==================================================================== */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          {/* Step 1: Complejidad del Sistema */}
          <div className="flex flex-col gap-3">
            <label className="font-['JetBrains_Mono'] text-[11px] uppercase tracking-wider text-[#00daf3] font-bold flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-[#00e5ff]/20 text-[#00e5ff] flex items-center justify-center text-[10px] font-extrabold">
                1
              </span>
              <span>Complejidad del Sistema</span>
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {COMPLEXITY_TIERS.map((tier) => {
                const isSelected = complexity === tier.id;
                return (
                  <button
                    key={tier.id}
                    type="button"
                    onClick={() => setComplexity(tier.id)}
                    className={`p-3.5 rounded-2xl text-left transition-all border flex flex-col justify-between gap-3 relative ${
                      isSelected
                        ? 'bg-[#00e5ff]/15 border-[#00e5ff] shadow-[0_0_20px_rgba(0,229,255,0.25)]'
                        : 'bg-[#081026] border-[#1c274a] hover:border-[#00e5ff]/40 hover:bg-[#0c1636]'
                    }`}
                  >
                    {isSelected && (
                      <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-[#00fe66] shadow-[0_0_8px_#00fe66]"></span>
                    )}
                    <div>
                      <span className="font-['Space_Grotesk'] text-[14px] font-bold text-[#dce1ff] block leading-snug">
                        {tier.id === 'basico' ? 'Básico' : tier.id === 'intermedio' ? 'Intermedio' : 'Avanzado'}
                      </span>
                      <p className="font-['Inter'] text-[11px] text-[#bac9cc] mt-1 line-clamp-2">
                        {tier.subtitle}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-[#1c274a]/60 flex items-center justify-between">
                      <span className="font-['JetBrains_Mono'] text-[12px] font-bold text-[#00fe66]">
                        ${tier.basePrice.toLocaleString()} MXN
                      </span>
                      <span className="font-['JetBrains_Mono'] text-[10px] text-[#849396]">
                        {tier.deliveryDays}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 2: Módulos Opcionales (Toggles) */}
          <div className="flex flex-col gap-3">
            <label className="font-['JetBrains_Mono'] text-[11px] uppercase tracking-wider text-[#00daf3] font-bold flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-[#00e5ff]/20 text-[#00e5ff] flex items-center justify-center text-[10px] font-extrabold">
                2
              </span>
              <span>Módulos de Ingeniería & Complementos</span>
            </label>

            <div className="flex flex-col gap-2.5">
              {/* Toggle 1: Base de Datos Relacional */}
              <div
                onClick={() => setHasDatabase(!hasDatabase)}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                  hasDatabase
                    ? 'bg-[#121c3d] border-[#00e5ff]/60 shadow-[0_0_15px_rgba(0,229,255,0.15)]'
                    : 'bg-[#081026] border-[#1c274a] opacity-80 hover:opacity-100'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#060c20] border border-[#23315a] flex items-center justify-center text-[#00e5ff] shrink-0">
                    <Database className="w-4 h-4 text-[#00e5ff]" />
                  </div>
                  <div>
                    <span className="font-['Space_Grotesk'] text-[13px] font-bold text-[#dce1ff] block">
                      Base de Datos Relacional SQL (+${DB_PRICE} MXN)
                    </span>
                    <p className="font-['Inter'] text-[11px] text-[#bac9cc]">
                      Modelado E-R en 3FN, scripts DDL/DML para PostgreSQL/MySQL y datos de prueba.
                    </p>
                  </div>
                </div>

                <div className="relative inline-flex items-center shrink-0">
                  <input
                    id={dbToggleId}
                    type="checkbox"
                    checked={hasDatabase}
                    onChange={() => {}}
                    className="sr-only peer"
                    aria-label="Base de Datos Relacional SQL"
                  />
                  <div className="w-11 h-6 bg-[#1a2548] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#00e5ff]"></div>
                </div>
              </div>

              {/* Toggle 2: Documentación Técnica */}
              <div
                onClick={() => setHasDocumentation(!hasDocumentation)}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                  hasDocumentation
                    ? 'bg-[#121c3d] border-[#00e5ff]/60 shadow-[0_0_15px_rgba(0,229,255,0.15)]'
                    : 'bg-[#081026] border-[#1c274a] opacity-80 hover:opacity-100'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#060c20] border border-[#23315a] flex items-center justify-center text-[#00fe66] shrink-0">
                    <FileText className="w-4 h-4 text-[#00fe66]" />
                  </div>
                  <div>
                    <span className="font-['Space_Grotesk'] text-[13px] font-bold text-[#dce1ff] block">
                      Documentación Técnica Completa (+${DOCS_PRICE} MXN)
                    </span>
                    <p className="font-['Inter'] text-[11px] text-[#bac9cc]">
                      Manual de arquitectura, diagramas UML/flujo, diccionario de datos y requisitos en PDF.
                    </p>
                  </div>
                </div>

                <div className="relative inline-flex items-center shrink-0">
                  <input
                    id={docsToggleId}
                    type="checkbox"
                    checked={hasDocumentation}
                    onChange={() => {}}
                    className="sr-only peer"
                    aria-label="Documentación Técnica Completa"
                  />
                  <div className="w-11 h-6 bg-[#1a2548] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#00fe66]"></div>
                </div>
              </div>

              {/* Toggle 3: Entrega Urgente (< 48h) */}
              <div
                onClick={() => setIsUrgent(!isUrgent)}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                  isUrgent
                    ? 'bg-[#1f1738] border-[#c084fc] shadow-[0_0_15px_rgba(192,132,252,0.2)]'
                    : 'bg-[#081026] border-[#1c274a] opacity-80 hover:opacity-100'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#060c20] border border-[#23315a] flex items-center justify-center text-[#c084fc] shrink-0">
                    <Zap className="w-4 h-4 text-[#c084fc]" />
                  </div>
                  <div>
                    <span className="font-['Space_Grotesk'] text-[13px] font-bold text-[#dce1ff] block">
                      Sprint Urgente &lt; 48 Horas (+${URGENT_PRICE} MXN)
                    </span>
                    <p className="font-['Inter'] text-[11px] text-[#bac9cc]">
                      Prioridad inmediata de desarrollo continuo para entregas de emergencia.
                    </p>
                  </div>
                </div>

                <div className="relative inline-flex items-center shrink-0">
                  <input
                    id={urgentToggleId}
                    type="checkbox"
                    checked={isUrgent}
                    onChange={() => {}}
                    className="sr-only peer"
                    aria-label="Sprint Urgente < 48 Horas"
                  />
                  <div className="w-11 h-6 bg-[#1a2548] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#c084fc]"></div>
                </div>
              </div>

              {/* Toggle 4: Sesión de Simulación de Defensa */}
              <div
                onClick={() => setHasDefenseSession(!hasDefenseSession)}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                  hasDefenseSession
                    ? 'bg-[#102336] border-[#00daf3] shadow-[0_0_15px_rgba(0,218,243,0.15)]'
                    : 'bg-[#081026] border-[#1c274a] opacity-80 hover:opacity-100'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#060c20] border border-[#23315a] flex items-center justify-center text-[#00daf3] shrink-0">
                    <GraduationCap className="w-4 h-4 text-[#00daf3]" />
                  </div>
                  <div>
                    <span className="font-['Space_Grotesk'] text-[13px] font-bold text-[#dce1ff] block">
                      Simulación de Defensa 1-a-1 Google Meet (+${DEFENSE_PRICE} MXN)
                    </span>
                    <p className="font-['Inter'] text-[11px] text-[#bac9cc]">
                      Reunión de 45 min con un arquitecto MCRA repasando cada línea para responder sin titubear.
                    </p>
                  </div>
                </div>

                <div className="relative inline-flex items-center shrink-0">
                  <input
                    id={defenseToggleId}
                    type="checkbox"
                    checked={hasDefenseSession}
                    onChange={() => {}}
                    className="sr-only peer"
                    aria-label="Simulación de Defensa 1-a-1 Google Meet"
                  />
                  <div className="w-11 h-6 bg-[#1a2548] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#00daf3]"></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ==================================================================== */}
        {/* RIGHT COLUMN: Real-Time Dynamic Summary & Stripe Action (5 cols)     */}
        {/* ==================================================================== */}
        <div className="lg:col-span-5 flex flex-col justify-between rounded-3xl bg-gradient-to-b from-[#101b3d] to-[#0a1128] border-2 border-[#00e5ff]/50 p-6 shadow-2xl relative">
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#23315a]">
              <span className="font-['JetBrains_Mono'] text-[11px] uppercase tracking-wider text-[#00daf3] font-bold">
                RESUMEN DE COTIZACIÓN
              </span>
              <span className="font-['JetBrains_Mono'] text-[10px] text-[#849396]">
                ESTUDIANTE PRO
              </span>
            </div>

            {/* Price Display */}
            <div className="flex flex-col gap-1 py-1">
              <div className="flex items-center justify-between">
                <span className="text-[12px] font-['JetBrains_Mono'] text-[#bac9cc]">
                  Total Estimado del Proyecto:
                </span>
                {appliedDiscount && (
                  <span className="px-2 py-0.5 rounded-full bg-[#00fe66]/20 border border-[#00fe66]/40 text-[#00fe66] font-['JetBrains_Mono'] text-[10px] font-bold tracking-wider uppercase animate-pulse">
                    -{appliedDiscount.discountPercentage}% OFF ({appliedDiscount.coupon?.code})
                  </span>
                )}
              </div>

              <div className="flex items-baseline gap-3 flex-wrap">
                {appliedDiscount && (
                  <motion.span
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="font-['Space_Grotesk'] text-[24px] sm:text-[26px] font-bold text-[#849396] line-through leading-none select-none"
                  >
                    ${rawTotalPrice.toLocaleString()}
                  </motion.span>
                )}

                <motion.span
                  key={totalPrice}
                  initial={{ scale: 0.88, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                  className={`font-['Space_Grotesk'] text-[38px] sm:text-[44px] font-extrabold leading-none tracking-tight ${
                    appliedDiscount
                      ? 'text-[#00fe66] drop-shadow-[0_0_22px_rgba(0,254,102,0.45)]'
                      : 'text-[#dce1ff]'
                  }`}
                >
                  ${totalPrice.toLocaleString()}
                </motion.span>
                <span className="font-['JetBrains_Mono'] text-[15px] font-bold text-[#00e5ff]">
                  MXN
                </span>
              </div>

              {/* Deposit Callout */}
              <div className="mt-2 p-3 rounded-xl bg-[#00fe66]/10 border border-[#00fe66]/30 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#00fe66]" />
                  <span className="font-['JetBrains_Mono'] text-[12px] text-[#dce1ff] font-semibold">
                    Anticipo para Iniciar (50%):
                  </span>
                </div>
                <span className="font-['JetBrains_Mono'] text-[14px] font-extrabold text-[#00fe66]">
                  ${depositPrice.toLocaleString()} MXN
                </span>
              </div>
            </div>

            {/* Estimated Delivery Time */}
            <div className="p-3 rounded-xl bg-[#060c20] border border-[#23315a] flex items-center justify-between font-['JetBrains_Mono'] text-[11px]">
              <span className="text-[#849396] flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[#00e5ff]" />
                Tiempo de Entrega:
              </span>
              <span className="font-bold text-[#00daf3]">{estimatedDelivery}</span>
            </div>

            {/* Inclusions Checklist */}
            <div className="flex flex-col gap-1.5 pt-2">
              <span className="text-[11px] font-['JetBrains_Mono'] uppercase tracking-wider text-[#bac9cc] font-semibold">
                Lo que incluye tu entrega:
              </span>
              <div className="flex flex-col gap-1 text-[11px] font-['Inter'] text-[#bac9cc]">
                <div className="flex items-center gap-2 text-[#00fe66]">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  <span>Código 100% comentado línea por línea</span>
                </div>
                <div className="flex items-center gap-2 text-[#00fe66]">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  <span>Guía en PDF con respuestas a preguntas del profesor</span>
                </div>
                {hasDatabase && (
                  <div className="flex items-center gap-2 text-[#00e5ff]">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    <span>Scripts SQL relacional + Diagrama E-R 3FN</span>
                  </div>
                )}
                {hasDocumentation && (
                  <div className="flex items-center gap-2 text-[#00e5ff]">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    <span>Documentación técnica formal con diagramas</span>
                  </div>
                )}
                {hasDefenseSession && (
                  <div className="flex items-center gap-2 text-[#c084fc]">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    <span>Sesión de ensayo 1-a-1 por Google Meet</span>
                  </div>
                )}
              </div>
            </div>

            {/* Dynamic Discount Engine Input */}
            <div className="pt-3 border-t border-[#23315a] flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <label className="font-['JetBrains_Mono'] text-[11px] uppercase font-bold text-[#00daf3] flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-[#00daf3]" />
                  <span>Código de Alianza / Beca</span>
                </label>
                <span className="font-['JetBrains_Mono'] text-[10px] text-[#849396]">
                  BECA-50 • ESTUDIANTE-25
                </span>
              </div>

              {appliedDiscount ? (
                <div className="p-3 rounded-2xl bg-[#00fe66]/10 border border-[#00fe66]/40 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Percent className="w-4 h-4 text-[#00fe66] shrink-0" />
                    <div className="flex flex-col">
                      <span className="font-['JetBrains_Mono'] text-[11px] font-bold text-[#00fe66]">
                        {appliedDiscount.coupon?.name}
                      </span>
                      <span className="font-['Inter'] text-[10px] text-[#bac9cc]">
                        Ahorro aplicado: -${discountAmount.toLocaleString()} MXN
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveCoupon}
                    className="p-1.5 rounded-lg bg-[#141f40] hover:bg-[#25325c] text-[#dce1ff] hover:text-[#ff8099] transition-colors"
                    title="Quitar cupón"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <form onSubmit={handleApplyCoupon} className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={couponInput}
                      onChange={(e) => {
                        setCouponInput(e.target.value);
                        setCouponError(null);
                      }}
                      placeholder="Ej: BECA-50, TALENTO-40"
                      className="w-full bg-[#060c20] border border-[#23315a] rounded-xl px-3.5 py-2.5 text-[#00fe66] font-['JetBrains_Mono'] text-[11px] uppercase placeholder:normal-case placeholder:text-[#55657e] focus:outline-none focus:border-[#00e5ff]"
                    />
                  </div>
                  <button
                    type="submit"
                    className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#141f42] to-[#1c2c5c] hover:from-[#1b2b5a] hover:to-[#243a75] border border-[#00e5ff]/50 text-[#00e5ff] font-['JetBrains_Mono'] text-[11px] font-bold uppercase transition-all shadow-[0_0_15px_rgba(0,229,255,0.2)] hover:scale-105 active:scale-95 shrink-0"
                  >
                    Aplicar
                  </button>
                </form>
              )}

              {couponError && (
                <div className="text-[11px] font-['JetBrains_Mono'] text-[#ff8099] flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  <span>{couponError}</span>
                </div>
              )}
            </div>
          </div>

          {/* Action Trigger & Counter-Offer Secondary Action */}
          <div className="flex flex-col gap-3 pt-5">
            <button
              type="button"
              id="btn-reserve-stripe-academy"
              onClick={handleCheckoutStripe}
              disabled={isReserving}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#00e5ff] via-[#38ef7d] to-[#00fe66] hover:from-[#5affff] hover:to-[#5aff96] text-[#00363d] font-['Space_Grotesk'] text-[15px] font-extrabold uppercase tracking-wider transition-all shadow-[0_0_30px_rgba(0,229,255,0.45)] flex items-center justify-center gap-2.5 hover:scale-[1.02] active:scale-[0.98]"
            >
              <ExternalLink className="w-5 h-5 text-[#00363d]" />
              <span>
                {isReserving
                  ? 'Conectando con Stripe Escrow...'
                  : `Reservar Proyecto con Anticipo ($${depositPrice.toLocaleString()} MXN)`}
              </span>
            </button>

            {/* Counter-Offer Workflow Button */}
            <button
              type="button"
              id="btn-proponer-ajuste-academy"
              onClick={() => setIsNegotiationOpen(true)}
              className="w-full py-3 px-4 rounded-2xl bg-[#0a122e]/85 hover:bg-[#131f4a] border border-[#00e5ff]/40 hover:border-[#00e5ff] text-[#00daf3] hover:text-[#ffffff] font-['Space_Grotesk'] text-[13px] font-bold uppercase tracking-wider transition-all shadow-[0_0_15px_rgba(0,229,255,0.15)] flex items-center justify-center gap-2 backdrop-blur-xl hover:scale-[1.01] active:scale-[0.99]"
            >
              <SlidersHorizontal className="w-4 h-4 text-[#00e5ff]" />
              <span>¿Fuera de presupuesto? Proponer Ajuste</span>
            </button>

            <div className="flex items-center justify-center gap-2 text-[10px] font-['JetBrains_Mono'] text-[#849396]">
              <span translate="no" className="notranslate material-symbols-outlined text-[13px] text-[#00fe66]">lock</span>
              <span>Pago cifrado protegido por Stripe Payment Links • Sin cobros ocultos</span>
            </div>
          </div>
        </div>
      </div>

      {/* Counter-Offer Negotiation Modal */}
      <BudgetNegotiationModal
        isOpen={isNegotiationOpen}
        onClose={() => setIsNegotiationOpen(false)}
        serviceTitle={`${currentTier.title} (Cotizador)`}
        originalPrice={rawTotalPrice}
        clientType="student"
        onSuccess={(neg) => {
          if (showToast) showToast(`Solicitud de ajuste ${neg.id} enviada al panel directivo.`);
        }}
      />


      {/* Confirmation Modal */}
      <AnimatePresence>
        {showConfirmation && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-[#060c20]/85 backdrop-blur-md p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-md p-6 rounded-3xl bg-[#0e1738] border-2 border-[#00fe66] shadow-[0_0_50px_rgba(0,254,102,0.3)] flex flex-col gap-4 text-center items-center"
            >
              <div className="w-16 h-16 rounded-full bg-[#00fe66]/15 border border-[#00fe66] flex items-center justify-center text-[#00fe66] shadow-[0_0_20px_#00fe66]">
                <CheckCircle2 className="w-8 h-8 text-[#00fe66]" />
              </div>

              <div>
                <h4 className="font-['Space_Grotesk'] text-[20px] font-bold text-[#dce1ff]">
                  ¡Cotización Generada con Éxito!
                </h4>
                <p className="font-['Inter'] text-[12px] text-[#bac9cc] mt-1 leading-relaxed">
                  Tu proyecto ha sido pre-registrado. Puedes formalizar el anticipo del 50% (${depositPrice.toLocaleString()} MXN) mediante Stripe o coordinar detalles directos con un arquitecto.
                </p>
              </div>

              <div className="w-full p-3 rounded-xl bg-[#060d24] border border-[#23315a] font-['JetBrains_Mono'] text-[11px] text-left flex flex-col gap-1 text-[#bac9cc]">
                <div className="flex justify-between">
                  <span>NIVEL:</span>
                  <span className="text-[#00e5ff] font-bold uppercase">{complexity}</span>
                </div>
                <div className="flex justify-between">
                  <span>TOTAL ESTIMADO:</span>
                  <span className="text-[#00fe66] font-bold">${totalPrice.toLocaleString()} MXN</span>
                </div>
                <div className="flex justify-between">
                  <span>ANTICIPO:</span>
                  <span className="text-[#00fe66] font-bold">${depositPrice.toLocaleString()} MXN</span>
                </div>
                <div className="flex justify-between">
                  <span>ENTREGA ESTIMADA:</span>
                  <span className="text-[#00daf3]">{estimatedDelivery}</span>
                </div>
              </div>

              <div className="w-full flex flex-col gap-2 pt-1">
                <a
                  href={`https://wa.me/525500000000?text=${encodeURIComponent(
                    `Hola MCRA Academy, coticé un proyecto de ingeniería nivel ${complexity.toUpperCase()} por $${totalPrice} MXN (Anticipo: $${depositPrice} MXN). Me gustaría afinar detalles y coordinar el pago.`
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full py-3 rounded-xl bg-[#00fe66] hover:bg-[#5aff96] text-[#00363d] font-['Space_Grotesk'] text-[13px] font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(0,254,102,0.4)]"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Confirmar Vía WhatsApp / Stripe</span>
                </a>

                <button
                  type="button"
                  onClick={() => setShowConfirmation(false)}
                  className="w-full py-2.5 rounded-xl bg-[#141d3d] hover:bg-[#1f2a52] text-[#bac9cc] font-['JetBrains_Mono'] text-[12px] transition-colors"
                >
                  Modificar Cotización
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
