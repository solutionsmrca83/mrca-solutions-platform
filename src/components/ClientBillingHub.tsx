import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  DollarSign,
  Copy,
  Check,
  Building,
  Upload,
  FileText,
  AlertTriangle,
  Clock,
  ShieldCheck,
  CheckCircle2,
  ExternalLink,
  ArrowRight,
  Info,
  Calendar,
  Sparkles,
  RefreshCw,
  Search,
  Tag,
  SlidersHorizontal,
  Percent,
  X,
} from 'lucide-react';
import { Invoice, InvoiceStatus } from '../types';
import { supabase } from '../lib/supabase/client';
import { evaluateDiscountCode, ApplyDiscountResult } from '../lib/discounts';
import { BudgetNegotiationModal } from './BudgetNegotiationModal';


interface ClientBillingHubProps {
  clientCompany?: string;
  clientEmail?: string;
  showToast?: (msg: string) => void;
}

const INITIAL_INVOICES: Invoice[] = [
  {
    id: 'INV-2026-081',
    client_id: 'usr_client_demo',
    client_company: 'FinTech Global B2B',
    client_email: 'cliente@enterprise.corp',
    amount: 185000,
    status: 'pending',
    description: 'Sprint 03: Microservicios Cloud mTLS & Bóveda Criptográfica HSM',
    due_date: '24 Oct 2026',
    created_at: '12 Oct 2026',
  },
  {
    id: 'INV-2026-074',
    client_id: 'usr_client_demo',
    client_company: 'FinTech Global B2B',
    client_email: 'cliente@enterprise.corp',
    amount: 120000,
    status: 'verification_in_progress',
    description: 'Anticipo de Auditoría Ofensiva Pentest Kali Linux & Hardening eBPF',
    due_date: '18 Oct 2026',
    spei_tracking_key: '2026101240014BND00008891230194',
    payment_proof_url: 'https://enclave.mcrasolutions.com/proofs/spei_recibo_inv074.pdf',
    created_at: '10 Oct 2026',
  },
  {
    id: 'INV-2026-062',
    client_id: 'usr_client_demo',
    client_company: 'FinTech Global B2B',
    client_email: 'cliente@enterprise.corp',
    amount: 350000,
    status: 'paid',
    description: 'Sprint 01 & 02: Arquitectura Zero-Trust C4 & Modelado Relacional PostgreSQL RLS',
    due_date: '05 Oct 2026',
    spei_tracking_key: '2026100540014BND00007712490182',
    payment_proof_url: 'https://enclave.mcrasolutions.com/proofs/spei_recibo_inv062.pdf',
    created_at: '28 Sep 2026',
  },
];

export const ClientBillingHub: React.FC<ClientBillingHubProps> = ({
  clientCompany = 'FinTech Global B2B',
  clientEmail = 'cliente@enterprise.corp',
  showToast,
}) => {
  const [invoices, setInvoices] = useState<Invoice[]>(() => {
    try {
      const saved = localStorage.getItem('mcra_client_invoices');
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return INITIAL_INVOICES;
  });

  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [selectedInvoiceForPayment, setSelectedInvoiceForPayment] = useState<Invoice | null>(null);
  const [trackingKeyInput, setTrackingKeyInput] = useState('');
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [isSubmittingProof, setIsSubmittingProof] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');

  // Dynamic Discount Engine & Budget Negotiation State
  const [couponInputs, setCouponInputs] = useState<Record<string, string>>({});
  const [appliedDiscounts, setAppliedDiscounts] = useState<Record<string, ApplyDiscountResult>>({});
  const [couponErrors, setCouponErrors] = useState<Record<string, string>>({});
  const [negotiationModalInvoice, setNegotiationModalInvoice] = useState<Invoice | null>(null);

  // Transfer Constants (Strictly Nu México - Zero Stripe/Credit Cards)
  const BANK_DETAILS = {
    institution: 'Nu México',
    clabe: '638180000123456789',
    beneficiary: 'MCRA Solutions S.A.P.I. de C.V.',
    accountType: 'Cuenta Concentradora B2B / SPEI 24/7',
  };

  const handleApplyInvoiceCoupon = (invoiceId: string, originalAmount: number) => {
    const raw = couponInputs[invoiceId] || '';
    const res = evaluateDiscountCode(raw, originalAmount, 'enterprise');
    if (!res.isValid) {
      setCouponErrors((prev) => ({ ...prev, [invoiceId]: res.errorMessage || 'Código no válido' }));
      if (showToast) showToast(res.errorMessage || 'Código de alianza no válido');
    } else {
      setAppliedDiscounts((prev) => ({ ...prev, [invoiceId]: res }));
      setCouponErrors((prev) => ({ ...prev, [invoiceId]: '' }));
      if (showToast) {
        showToast(`¡Código ${res.coupon?.code} aplicado con éxito (-${res.discountPercentage}%)!`);
      }
    }
  };

  const handleRemoveInvoiceCoupon = (invoiceId: string) => {
    setAppliedDiscounts((prev) => {
      const next = { ...prev };
      delete next[invoiceId];
      return next;
    });
    setCouponInputs((prev) => ({ ...prev, [invoiceId]: '' }));
    if (showToast) showToast('Código de alianza corporativa removido.');
  };

  useEffect(() => {
    // Sync with global storage events (e.g. when Admin validates a payment)
    const handleInvoiceSync = () => {
      try {
        const saved = localStorage.getItem('mcra_client_invoices');
        if (saved) setInvoices(JSON.parse(saved));
      } catch {
        // quota
      }
    };

    window.addEventListener('mcra_invoice_updated', handleInvoiceSync);
    return () => window.removeEventListener('mcra_invoice_updated', handleInvoiceSync);
  }, []);

  const handleCopy = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    if (showToast) {
      showToast(`${fieldName} copiado al portapapeles.`);
    }
    setTimeout(() => {
      setCopiedField((curr) => (curr === fieldName ? null : curr));
    }, 2200);
  };

  const pendingBalance = invoices
    .filter((inv) => inv.status === 'pending')
    .reduce((acc, curr) => {
      const disc = appliedDiscounts[curr.id];
      const amt = disc?.isValid ? disc.discountedPrice : curr.amount;
      return acc + amt;
    }, 0);


  const verificationBalance = invoices
    .filter((inv) => inv.status === 'verification_in_progress')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const paidHistoryBalance = invoices
    .filter((inv) => inv.status === 'paid')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const handleSubmitProof = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoiceForPayment) return;
    if (!trackingKeyInput.trim() && !uploadedFileName) {
      if (showToast) {
        showToast('Por favor ingrese la Clave de Rastreo SPEI o adjunte su comprobante.');
      }
      return;
    }

    setIsSubmittingProof(true);

    const updatedInvoices = invoices.map((inv) =>
      inv.id === selectedInvoiceForPayment.id
        ? {
            ...inv,
            status: 'verification_in_progress' as InvoiceStatus,
            spei_tracking_key: trackingKeyInput.trim() || 'SPEI-MANUAL-' + Date.now().toString().slice(-8),
            payment_proof_url: uploadedFileName
              ? `https://enclave.mcrasolutions.com/proofs/${uploadedFileName}`
              : 'https://enclave.mcrasolutions.com/proofs/comprobante_bancario_spei.pdf',
            updated_at: new Date().toISOString(),
          }
        : inv
    );

    // Save in Supabase
    try {
      await supabase
        .from('invoices')
        .update({
          status: 'verification_in_progress',
          spei_tracking_key: trackingKeyInput.trim() || 'SPEI-' + Date.now(),
          payment_proof_url: uploadedFileName || 'comprobante_spei.pdf',
          updated_at: new Date().toISOString(),
        })
        .eq('id', selectedInvoiceForPayment.id);
    } catch {
      // Local fallback
    }

    // Persist to localStorage & emit sync event
    setInvoices(updatedInvoices);
    try {
      localStorage.setItem('mcra_client_invoices', JSON.stringify(updatedInvoices));
      window.dispatchEvent(new CustomEvent('mcra_invoice_updated'));
    } catch {
      // quota
    }

    setTimeout(() => {
      setIsSubmittingProof(false);
      setSelectedInvoiceForPayment(null);
      setTrackingKeyInput('');
      setUploadedFileName(null);
      if (showToast) {
        showToast('¡Comprobante SPEI enviado! El estatus cambió a "Verificación en Proceso".');
      }
    }, 700);
  };

  const filteredInvoices = invoices.filter(
    (inv) =>
      inv.id.toLowerCase().includes(searchFilter.toLowerCase()) ||
      inv.description.toLowerCase().includes(searchFilter.toLowerCase())
  );

  return (
    <div className="w-full flex flex-col gap-6 font-['Inter'] text-[#dce1ff]">
      {/* ================================================================== */}
      {/* 1. TOP HEADER & TELEMETRY BANNER                                  */}
      {/* ================================================================== */}
      <div className="relative w-full rounded-3xl bg-gradient-to-r from-[#141a32]/95 via-[#0b1432]/90 to-[#141a32]/95 border-2 border-[#00E5FF]/40 p-5 sm:p-7 shadow-[0_10px_35px_rgba(0,229,255,0.18)] backdrop-blur-xl overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-full bg-gradient-to-l from-[#00FF66]/10 to-transparent pointer-events-none"></div>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-[#00E5FF]/15 border border-[#00E5FF]/30 text-[#00E5FF] font-['JetBrains_Mono'] text-[10px] font-bold tracking-wider uppercase flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5" />
                PORTAL CLIENTES // CENTRO DE FACTURACIÓN SPEI
              </span>
              <span className="font-['JetBrains_Mono'] text-[11px] text-[#00FF66] font-semibold">
                • 0% COMISIÓN BANCARIA
              </span>
            </div>

            <h2 className="font-['Space_Grotesk'] text-[22px] sm:text-[26px] font-bold text-[#dce1ff]">
              Facturación &amp; Pagos Interbancarios SPEI
            </h2>
            <p className="font-['Inter'] text-[13px] text-[#bac9cc] max-w-3xl">
              Consulte su saldo pendiente, liquide transferencias directas a nuestra cuenta concentradora en Nu México y reporte su clave de rastreo Banxico para conciliación inmediata sin cobros de pasarela.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="flex flex-col items-end px-4 py-2 rounded-2xl bg-[#091129] border border-[#1e2a52]">
              <span className="font-['JetBrains_Mono'] text-[10px] text-[#849396] uppercase">
                EMPRESA FACTURADA
              </span>
              <span className="font-['Space_Grotesk'] text-[14px] font-bold text-[#00E5FF]">
                {clientCompany}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ================================================================== */}
      {/* 2. SUMMARY KPI TILES (GLASSMORPHIC)                                */}
      {/* ================================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Tile 1: Saldo Pendiente */}
        <div className="rounded-2xl bg-[#0d1633]/90 border border-[#1f2f5c] hover:border-[#ff9900]/60 p-5 flex flex-col justify-between shadow-xl transition-all">
          <div className="flex items-center justify-between text-[#849396] font-['JetBrains_Mono'] text-[11px]">
            <span>SALDO PENDIENTE</span>
            <DollarSign className="w-4 h-4 text-[#ffb020]" />
          </div>
          <div className="my-2">
            <span className="font-['Space_Grotesk'] text-[28px] sm:text-[32px] font-bold text-[#ffb020]">
              ${pendingBalance.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
            </span>
            <span className="font-['JetBrains_Mono'] text-[12px] text-[#849396] ml-2">MXN</span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] font-['JetBrains_Mono'] text-[#ffb020]">
            <Clock className="w-3.5 h-3.5" />
            <span>
              {invoices.filter((i) => i.status === 'pending').length} factura(s) por liquidar
            </span>
          </div>
        </div>

        {/* Tile 2: En Proceso de Verificación */}
        <div className="rounded-2xl bg-[#0d1633]/90 border border-[#1f2f5c] hover:border-[#00E5FF]/60 p-5 flex flex-col justify-between shadow-xl transition-all">
          <div className="flex items-center justify-between text-[#849396] font-['JetBrains_Mono'] text-[11px]">
            <span>EN VERIFICACIÓN SPEI</span>
            <RefreshCw className="w-4 h-4 text-[#00E5FF] animate-spin" />
          </div>
          <div className="my-2">
            <span className="font-['Space_Grotesk'] text-[28px] sm:text-[32px] font-bold text-[#00E5FF]">
              ${verificationBalance.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
            </span>
            <span className="font-['JetBrains_Mono'] text-[12px] text-[#849396] ml-2">MXN</span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] font-['JetBrains_Mono'] text-[#00daf3]">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>
              {invoices.filter((i) => i.status === 'verification_in_progress').length} pago(s) en auditoría
            </span>
          </div>
        </div>

        {/* Tile 3: Historial Liquidado */}
        <div className="rounded-2xl bg-[#0d1633]/90 border border-[#1f2f5c] hover:border-[#00FF66]/60 p-5 flex flex-col justify-between shadow-xl transition-all">
          <div className="flex items-center justify-between text-[#849396] font-['JetBrains_Mono'] text-[11px]">
            <span>HISTORIAL LIQUIDADO</span>
            <ShieldCheck className="w-4 h-4 text-[#00FF66]" />
          </div>
          <div className="my-2">
            <span className="font-['Space_Grotesk'] text-[28px] sm:text-[32px] font-bold text-[#00FF66]">
              ${paidHistoryBalance.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
            </span>
            <span className="font-['JetBrains_Mono'] text-[12px] text-[#849396] ml-2">MXN</span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] font-['JetBrains_Mono'] text-[#00FF66]">
            <Check className="w-3.5 h-3.5" />
            <span>
              {invoices.filter((i) => i.status === 'paid').length} factura(s) conciliada(s)
            </span>
          </div>
        </div>
      </div>

      {/* ================================================================== */}
      {/* 3. GLOWING SECURE CONTAINER: TRANSFER DETAILS (NU MÉXICO)          */}
      {/* ================================================================== */}
      <div className="relative rounded-3xl bg-[#091129]/95 border-2 border-[#00E5FF]/50 p-6 sm:p-7 shadow-[0_0_35px_rgba(0,229,255,0.22)] backdrop-blur-2xl flex flex-col gap-5 overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-36 bg-gradient-to-b from-[#00E5FF]/10 to-transparent pointer-events-none"></div>

        <div className="flex flex-wrap items-center justify-between gap-3 relative z-10 pb-3 border-b border-[#1b2b52]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#141e40] border border-[#00E5FF]/40 flex items-center justify-center text-[#00E5FF] shadow-[0_0_15px_rgba(0,229,255,0.3)]">
              <Building className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-['Space_Grotesk'] text-[18px] font-bold text-[#dce1ff]">
                Datos Oficiales para Transferencia SPEI (Sin Comisiones)
              </h3>
              <p className="font-['JetBrains_Mono'] text-[11px] text-[#849396]">
                DISPERSIÓN DIRECTA • CANAL BANXICO CEP VALIDADO
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-[#00FF66]/15 border border-[#00FF66]/40 font-['JetBrains_Mono'] text-[11px] text-[#00FF66] font-semibold">
            <span className="w-2 h-2 rounded-full bg-[#00FF66] animate-pulse"></span>
            <span>0.0% RECARGO // BANXICO DIRECT</span>
          </div>
        </div>

        {/* Transfer Details Bento Matrix */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 relative z-10">
          {/* Field 1: Institución */}
          <div className="bg-[#050b1c] rounded-2xl p-4 border border-[#1b2b50] flex flex-col justify-between gap-2">
            <span className="font-['JetBrains_Mono'] text-[10px] text-[#849396] uppercase">
              INSTITUCIÓN DESTINO:
            </span>
            <div className="flex items-center justify-between">
              <span className="font-['Space_Grotesk'] text-[16px] font-bold text-[#00E5FF]">
                {BANK_DETAILS.institution}
              </span>
              <button
                type="button"
                onClick={() => handleCopy(BANK_DETAILS.institution, 'Institución')}
                className="p-1.5 rounded-lg bg-[#141f42] hover:bg-[#1e2e60] text-[#00E5FF] transition-all"
                title="Copiar institución"
              >
                {copiedField === 'Institución' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
            <span className="font-['JetBrains_Mono'] text-[9px] text-[#849396]">
              STP / SPEI Interbancario Banxico
            </span>
          </div>

          {/* Field 2: CLABE Interbancaria */}
          <div className="bg-[#050b1c] rounded-2xl p-4 border border-[#00E5FF]/40 shadow-[0_0_20px_rgba(0,229,255,0.15)] flex flex-col justify-between gap-2">
            <span className="font-['JetBrains_Mono'] text-[10px] text-[#849396] uppercase">
              CLABE INTERBANCARIA:
            </span>
            <div className="flex items-center justify-between">
              <span className="font-['JetBrains_Mono'] text-[15px] font-bold text-[#00FF66] tracking-wider select-all">
                {BANK_DETAILS.clabe}
              </span>
              <button
                type="button"
                onClick={() => handleCopy(BANK_DETAILS.clabe, 'CLABE')}
                className="p-1.5 rounded-lg bg-[#00FF66]/20 hover:bg-[#00FF66]/30 text-[#00FF66] border border-[#00FF66]/40 transition-all"
                title="Copiar CLABE"
              >
                {copiedField === 'CLABE' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
            <span className="font-['JetBrains_Mono'] text-[9px] text-[#00fe66]">
              18 dígitos • Transferencias instantáneas 24/7
            </span>
          </div>

          {/* Field 3: Beneficiario */}
          <div className="bg-[#050b1c] rounded-2xl p-4 border border-[#1b2b50] flex flex-col justify-between gap-2">
            <span className="font-['JetBrains_Mono'] text-[10px] text-[#849396] uppercase">
              BENEFICIARIO:
            </span>
            <div className="flex items-center justify-between">
              <span className="font-['Space_Grotesk'] text-[14px] font-bold text-[#dce1ff] line-clamp-1">
                {BANK_DETAILS.beneficiary}
              </span>
              <button
                type="button"
                onClick={() => handleCopy(BANK_DETAILS.beneficiary, 'Beneficiario')}
                className="p-1.5 rounded-lg bg-[#141f42] hover:bg-[#1e2e60] text-[#00E5FF] transition-all"
                title="Copiar Beneficiario"
              >
                {copiedField === 'Beneficiario' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
            <span className="font-['JetBrains_Mono'] text-[9px] text-[#849396]">
              Razón Social Registrada SAT
            </span>
          </div>

          {/* Field 4: Concepto Sugerido */}
          <div className="bg-[#050b1c] rounded-2xl p-4 border border-[#1b2b50] flex flex-col justify-between gap-2">
            <span className="font-['JetBrains_Mono'] text-[10px] text-[#849396] uppercase">
              CONCEPTO RECOMENDADO:
            </span>
            <div className="flex items-center justify-between">
              <span className="font-['JetBrains_Mono'] text-[14px] font-bold text-[#00daf3]">
                MCRA-904
              </span>
              <button
                type="button"
                onClick={() => handleCopy('MCRA-904', 'Concepto')}
                className="p-1.5 rounded-lg bg-[#141f42] hover:bg-[#1e2e60] text-[#00E5FF] transition-all"
                title="Copiar concepto"
              >
                {copiedField === 'Concepto' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
            <span className="font-['JetBrains_Mono'] text-[9px] text-[#849396]">
              Identificador único de su empresa
            </span>
          </div>
        </div>

        {/* ================================================================== */}
        {/* 4. CRITICAL UX: STYLED DISCLAIMER PANEL (AVISO DE COMPENSACIÓN)    */}
        {/* ================================================================== */}
        <div className="rounded-2xl bg-gradient-to-r from-[#172242] via-[#101938] to-[#172242] border-2 border-[#00E5FF]/40 p-4 sm:p-5 flex items-start gap-4 shadow-xl">
          <div className="w-10 h-10 rounded-xl bg-[#081026] border border-[#00E5FF]/50 flex items-center justify-center text-[#00E5FF] shrink-0 mt-0.5 shadow-[0_0_12px_rgba(0,229,255,0.3)]">
            <ShieldCheck className="w-5 h-5 text-[#00FF66]" />
          </div>

          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="font-['Space_Grotesk'] text-[15px] font-bold text-[#00E5FF]">
                Aviso de Compensación Interbancaria
              </span>
              <span className="font-['JetBrains_Mono'] text-[10px] text-[#00FF66] px-2 py-0.5 rounded bg-[#00FF66]/15 border border-[#00FF66]/30 uppercase font-semibold">
                PROTEGIDO BANXICO
              </span>
            </div>
            <p className="font-['Inter'] text-[13px] text-[#bac9cc] leading-relaxed">
              "Aviso de Compensación: Las transferencias SPEI hacia nuestra cuenta concentradora en Nu pueden demorar algunos minutos en reflejarse en el sistema interbancario. Su saldo está seguro."
            </p>
          </div>
        </div>
      </div>

      {/* ================================================================== */}
      {/* 5. INVOICES TABLE & SPEI PROOF SUBMISSION                          */}
      {/* ================================================================== */}
      <div className="rounded-3xl bg-[#091129]/90 border border-[#1b2b52] p-5 sm:p-6 flex flex-col gap-5 shadow-2xl">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#18264d]">
          <div className="flex items-center gap-2.5">
            <FileText className="w-5 h-5 text-[#00E5FF]" />
            <h3 className="font-['Space_Grotesk'] text-[18px] font-bold text-[#dce1ff]">
              Historial de Facturación &amp; Documentos Emitidos
            </h3>
            <span className="font-['JetBrains_Mono'] text-[11px] text-[#849396]">
              ({invoices.length} facturas registradas)
            </span>
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-[#849396] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por ID o concepto..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="pl-8 pr-3 py-1.5 rounded-xl bg-[#050a1a] border border-[#1e2a52] text-[#dce1ff] font-['JetBrains_Mono'] text-[11px] focus:outline-none focus:border-[#00E5FF]"
            />
          </div>
        </div>

        {/* Invoices List */}
        <div className="flex flex-col gap-4">
          {filteredInvoices.map((inv) => {
            const isPending = inv.status === 'pending';
            const isVerification = inv.status === 'verification_in_progress';
            const isPaid = inv.status === 'paid';
            const appliedDiscount = appliedDiscounts[inv.id];
            const invoiceCouponInput = couponInputs[inv.id] || '';
            const invoiceCouponError = couponErrors[inv.id];
            const effectiveAmount = appliedDiscount?.isValid
              ? appliedDiscount.discountedPrice
              : inv.amount;

            return (
              <div
                key={inv.id}
                className={`rounded-2xl p-4 sm:p-5 border transition-all flex flex-col gap-4 ${
                  isPending
                    ? 'bg-[#101838]/90 border-[#ff9900]/40 hover:border-[#00E5FF]/60 shadow-[0_4px_25px_rgba(0,0,0,0.3)]'
                    : isVerification
                    ? 'bg-[#0e1633]/90 border-[#00E5FF]/40 hover:border-[#00E5FF]'
                    : 'bg-[#081024]/80 border-[#1a2850] hover:border-[#00FF66]/50'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex flex-col gap-1.5 max-w-2xl">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-['JetBrains_Mono'] text-[12px] font-bold text-[#00E5FF]">
                        {inv.id}
                      </span>
                      <span
                        className={`px-2.5 py-0.5 rounded-full font-['JetBrains_Mono'] text-[10px] font-bold uppercase tracking-wider ${
                          isPaid
                            ? 'bg-[#00FF66]/15 text-[#00FF66] border border-[#00FF66]/30'
                            : isVerification
                            ? 'bg-[#00E5FF]/15 text-[#00E5FF] border border-[#00E5FF]/30 animate-pulse'
                            : 'bg-[#ff9900]/15 text-[#ffb020] border border-[#ffb020]/40'
                        }`}
                      >
                        {isPaid
                          ? 'PAGADO & CONCILIADO'
                          : isVerification
                          ? 'VERIFICACIÓN EN PROCESO'
                          : 'PENDIENTE DE PAGO'}
                      </span>
                      <span className="font-['JetBrains_Mono'] text-[10px] text-[#849396]">
                        • Vencimiento: {inv.due_date}
                      </span>
                      {appliedDiscount && (
                        <span className="px-2 py-0.5 rounded-full bg-[#00FF66]/20 border border-[#00FF66]/40 text-[#00FF66] font-['JetBrains_Mono'] text-[10px] font-bold uppercase animate-pulse">
                          -{appliedDiscount.discountPercentage}% ({appliedDiscount.coupon?.code})
                        </span>
                      )}
                    </div>

                    <h4 className="font-['Space_Grotesk'] text-[16px] font-bold text-[#dce1ff]">
                      {inv.description}
                    </h4>

                    {inv.spei_tracking_key && (
                      <div className="font-['JetBrains_Mono'] text-[11px] text-[#bac9cc] flex items-center gap-1.5 pt-1">
                        <span className="text-[#849396]">Clave de Rastreo Banxico:</span>
                        <strong className="text-[#00FF66] select-all">{inv.spei_tracking_key}</strong>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between lg:justify-end gap-4 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-[#1a264a]">
                    <div className="text-left sm:text-right">
                      <span className="font-['JetBrains_Mono'] text-[10px] text-[#849396] block">
                        MONTO NETO (0% COMISIÓN):
                      </span>
                      <div className="flex items-baseline justify-start sm:justify-end gap-2 flex-wrap">
                        {appliedDiscount && (
                          <motion.span
                            initial={{ opacity: 0, x: -6 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="font-['Space_Grotesk'] text-[15px] font-bold text-[#849396] line-through leading-none select-none"
                          >
                            ${inv.amount.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                          </motion.span>
                        )}
                        <motion.span
                          key={effectiveAmount}
                          initial={{ scale: 0.9, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                          className={`font-['Space_Grotesk'] text-[21px] font-bold leading-none ${
                            appliedDiscount
                              ? 'text-[#00FF66] drop-shadow-[0_0_18px_rgba(0,255,102,0.45)]'
                              : 'text-[#dce1ff]'
                          }`}
                        >
                          ${effectiveAmount.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                        </motion.span>
                        <span className="font-['JetBrains_Mono'] text-[11px] text-[#849396]">MXN</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      {isPending && (
                        <>
                          <button
                            type="button"
                            onClick={() =>
                              setSelectedInvoiceForPayment({
                                ...inv,
                                amount: effectiveAmount,
                              })
                            }
                            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#00E5FF] to-[#00b4d8] hover:brightness-110 text-[#00363d] font-['JetBrains_Mono'] text-[11px] font-bold uppercase tracking-wider transition-all shadow-[0_0_15px_rgba(0,229,255,0.3)] flex items-center gap-1.5"
                          >
                            <Upload className="w-3.5 h-3.5" />
                            <span>Reportar Pago SPEI</span>
                          </button>

                          {/* Counter-Offer Secondary Button */}
                          <button
                            type="button"
                            onClick={() => setNegotiationModalInvoice(inv)}
                            className="px-3.5 py-2.5 rounded-xl bg-[#0e1738]/80 hover:bg-[#152352] border border-[#00E5FF]/40 text-[#00E5FF] hover:text-white font-['JetBrains_Mono'] text-[11px] font-semibold transition-all shadow-[0_0_12px_rgba(0,229,255,0.15)] flex items-center gap-1.5 backdrop-blur-md"
                            title="Proponer ajuste o reducción de alcance presupuestal"
                          >
                            <SlidersHorizontal className="w-3.5 h-3.5" />
                            <span>¿Fuera de presupuesto? Proponer Ajuste</span>
                          </button>
                        </>
                      )}

                      {isVerification && (
                        <div className="px-3.5 py-2 rounded-xl bg-[#00E5FF]/10 border border-[#00E5FF]/30 font-['JetBrains_Mono'] text-[11px] text-[#00E5FF] flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 animate-spin" />
                          <span>En Auditoría Nu</span>
                        </div>
                      )}

                      {isPaid && (
                        <div className="px-3.5 py-2 rounded-xl bg-[#00FF66]/10 border border-[#00FF66]/30 font-['JetBrains_Mono'] text-[11px] text-[#00FF66] flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#00FF66]" />
                          <span>Comprobante CEP OK</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Dynamic Discount Engine Field for Pending Invoices */}
                {isPending && (
                  <div className="pt-3 border-t border-[#18264d] flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#060c1e]/60 p-3 rounded-xl border border-[#1b2b52]/50">
                    <div className="flex items-center gap-2">
                      <Tag className="w-3.5 h-3.5 text-[#00E5FF]" />
                      <span className="font-['JetBrains_Mono'] text-[11px] text-[#00daf3] uppercase font-bold">
                        Código de Alianza / Beca:
                      </span>
                      <span className="font-['JetBrains_Mono'] text-[10px] text-[#849396]">
                        (Ej: ALIANZA-B2B, MRCA-LAUNCH)
                      </span>
                    </div>

                    {appliedDiscount ? (
                      <div className="flex items-center gap-3">
                        <span className="font-['JetBrains_Mono'] text-[11px] text-[#00FF66] font-bold">
                          {appliedDiscount.coupon?.name} (-${(inv.amount - effectiveAmount).toLocaleString('es-MX')} MXN)
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveInvoiceCoupon(inv.id)}
                          className="px-2 py-1 rounded bg-[#162244] hover:bg-[#203163] text-[#bac9cc] hover:text-[#ff8099] font-['JetBrains_Mono'] text-[10px] flex items-center gap-1 transition-colors"
                        >
                          <X className="w-3 h-3" />
                          <span>Quitar</span>
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={invoiceCouponInput}
                          onChange={(e) => {
                            const val = e.target.value;
                            setCouponInputs((prev) => ({ ...prev, [inv.id]: val }));
                            setCouponErrors((prev) => ({ ...prev, [inv.id]: '' }));
                          }}
                          placeholder="ALIANZA-B2B"
                          className="bg-[#050b1c] border border-[#1e2a52] rounded-lg px-2.5 py-1 text-[#00FF66] font-['JetBrains_Mono'] text-[11px] uppercase placeholder:normal-case placeholder:text-[#55657e] focus:outline-none focus:border-[#00E5FF] w-36"
                        />
                        <button
                          type="button"
                          onClick={() => handleApplyInvoiceCoupon(inv.id, inv.amount)}
                          className="px-3 py-1 rounded-lg bg-[#141f42] hover:bg-[#1f2f63] border border-[#00E5FF]/40 text-[#00E5FF] font-['JetBrains_Mono'] text-[10px] font-bold uppercase transition-all shadow-[0_0_10px_rgba(0,229,255,0.2)]"
                        >
                          Aplicar
                        </button>
                      </div>
                    )}

                    {invoiceCouponError && (
                      <span className="font-['JetBrains_Mono'] text-[10px] text-[#ff8099]">
                        {invoiceCouponError}
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>


      {/* ================================================================== */}
      {/* 6. MODAL: UPLOAD MECHANISM (CLAVE DE RASTREO / RECIBO BANCARIO)     */}
      {/* ================================================================== */}
      {selectedInvoiceForPayment && (
        <div className="fixed inset-0 z-50 bg-[#060c1e]/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className="relative w-full max-w-xl rounded-3xl bg-[#091129] border-2 border-[#00E5FF]/50 p-6 sm:p-7 shadow-[0_0_50px_rgba(0,229,255,0.3)] flex flex-col gap-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#1b2b52]">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#141f42] border border-[#00E5FF]/40 flex items-center justify-center text-[#00E5FF]">
                  <Upload className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-['Space_Grotesk'] text-[17px] font-bold text-[#dce1ff]">
                    Reportar Pago SPEI // {selectedInvoiceForPayment.id}
                  </h3>
                  <span className="font-['JetBrains_Mono'] text-[11px] text-[#00FF66]">
                    Monto a comprobar: ${selectedInvoiceForPayment.amount.toLocaleString('es-MX')} MXN
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedInvoiceForPayment(null)}
                className="text-[#849396] hover:text-[#dce1ff] text-[20px] font-bold p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitProof} className="flex flex-col gap-4 font-['JetBrains_Mono'] text-[12px]">
              <div>
                <label className="block text-[#849396] uppercase mb-1">
                  1. Clave de Rastreo Banxico / Folio CEP (Opcional si sube comprobante):
                </label>
                <input
                  type="text"
                  placeholder="Ej: 2026101240014BND00001234567890"
                  value={trackingKeyInput}
                  onChange={(e) => setTrackingKeyInput(e.target.value)}
                  className="w-full bg-[#050b1c] border border-[#1e2a52] rounded-xl px-4 py-2.5 text-[#00FF66] font-mono focus:outline-none focus:border-[#00E5FF]"
                />
                <span className="text-[10px] text-[#849396] mt-1 block">
                  Encuentre este número en el comprobante emitido por su aplicación bancaria.
                </span>
              </div>

              <div>
                <label className="block text-[#849396] uppercase mb-1">
                  2. Comprobante de Transferencia (PDF, JPG o PNG):
                </label>
                <div className="relative border-2 border-dashed border-[#1e2a52] hover:border-[#00E5FF]/50 rounded-2xl p-6 bg-[#050b1c] flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors group">
                  <Upload className="w-8 h-8 text-[#00E5FF] group-hover:scale-110 transition-transform" />
                  <span className="text-[#bac9cc] text-[11px] text-center">
                    {uploadedFileName ? (
                      <strong className="text-[#00FF66]">{uploadedFileName}</strong>
                    ) : (
                      'Arrastre su comprobante o haga clic para examinar'
                    )}
                  </span>
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setUploadedFileName(e.target.files[0].name);
                      }
                    }}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[#060e22] border border-[#00E5FF]/20 text-[11px] text-[#bac9cc] flex items-start gap-2">
                <Info className="w-4 h-4 text-[#00E5FF] shrink-0 mt-0.5" />
                <span>
                  Al hacer clic en enviar, el estatus cambiará a <strong>"Verificación en Proceso"</strong> y un arquitecto de finanzas auditará su dispersión.
                </span>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedInvoiceForPayment(null)}
                  className="px-4 py-2.5 rounded-xl bg-[#141f42] text-[#bac9cc] hover:text-[#dce1ff]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingProof}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#00E5FF] to-[#00b4d8] hover:from-[#5af2ff] hover:to-[#00E5FF] text-[#00363d] font-bold uppercase tracking-wider flex items-center gap-2 transition-all shadow-[0_0_20px_rgba(0,229,255,0.4)] disabled:opacity-50"
                >
                  {isSubmittingProof ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Transmitiendo...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Confirmar y Enviar a Verificación</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Counter-Offer Budget Negotiation Modal */}
      {negotiationModalInvoice && (
        <BudgetNegotiationModal
          isOpen={true}
          onClose={() => setNegotiationModalInvoice(null)}
          serviceTitle={`${negotiationModalInvoice.id}: ${negotiationModalInvoice.description}`}
          originalPrice={negotiationModalInvoice.amount}
          clientType="enterprise"
          clientCompanyOrSchool={clientCompany}
          clientEmail={clientEmail}
          onSuccess={(neg) => {
            if (showToast) {
              showToast(`Solicitud de ajuste ${neg.id} transmitida con éxito a dirección.`);
            }
          }}
        />
      )}
    </div>
  );
};


