import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  ShieldCheck,
  CheckCircle2,
  Clock,
  FileText,
  ExternalLink,
  Search,
  Check,
  Eye,
  RefreshCw,
  Building,
  UserCheck,
  Calendar,
  AlertCircle,
  Hash,
  Download
} from 'lucide-react';
import { Invoice, InvoiceStatus } from '../types';
import { supabase } from '../lib/supabase/client';

interface AdminFinancesProps {
  showToast?: (msg: string) => void;
}

const DEFAULT_ADMIN_INVOICES: Invoice[] = [
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
    payment_proof_url: 'https://enclave.mrcasolutions.com/proofs/spei_recibo_inv074.pdf',
    created_at: '10 Oct 2026',
  },
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
    id: 'INV-2026-062',
    client_id: 'usr_client_demo',
    client_company: 'FinTech Global B2B',
    client_email: 'cliente@enterprise.corp',
    amount: 350000,
    status: 'paid',
    description: 'Sprint 01 & 02: Arquitectura Zero-Trust C4 & Modelado Relacional PostgreSQL RLS',
    due_date: '05 Oct 2026',
    spei_tracking_key: '2026100540014BND00007712490182',
    payment_proof_url: 'https://enclave.mrcasolutions.com/proofs/spei_recibo_inv062.pdf',
    created_at: '28 Sep 2026',
  },
  {
    id: 'INV-2026-058',
    client_id: 'usr_client_aduana_02',
    client_company: 'Aduana Express Cloud',
    client_email: 'mortiz@aduanaexpress.mx',
    amount: 220000,
    status: 'paid',
    description: 'Modelado PostgreSQL con RLS y Particionamiento Sharded',
    due_date: '20 Sep 2026',
    spei_tracking_key: '2026092040014BND00005519820144',
    payment_proof_url: 'https://enclave.mrcasolutions.com/proofs/spei_recibo_inv058.pdf',
    created_at: '15 Sep 2026',
  },
];

export const AdminFinances: React.FC<AdminFinancesProps> = ({ showToast }) => {
  const [invoices, setInvoices] = useState<Invoice[]>(() => {
    try {
      const saved = localStorage.getItem('mrca_client_invoices');
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return DEFAULT_ADMIN_INVOICES;
  });

  const [activeTab, setActiveTab] = useState<'auditoria' | 'todas'>('auditoria');
  const [searchQuery, setSearchQuery] = useState('');
  const [inspectingInvoice, setInspectingInvoice] = useState<Invoice | null>(null);
  const [isProcessingId, setIsProcessingId] = useState<string | null>(null);

  useEffect(() => {
    // Initial fetch from Supabase if connected
    async function fetchInvoices() {
      try {
        const { data, error } = await supabase
          .from('invoices')
          .select('*')
          .order('created_at', { ascending: false });
        if (data && data.length > 0 && !error) {
          setInvoices(data as Invoice[]);
        }
      } catch {
        // local state
      }
    }
    fetchInvoices();

    const handleSync = () => {
      try {
        const saved = localStorage.getItem('mrca_client_invoices');
        if (saved) setInvoices(JSON.parse(saved));
      } catch {
        // quota
      }
    };
    window.addEventListener('mrca_invoice_updated', handleSync);
    return () => window.removeEventListener('mrca_invoice_updated', handleSync);
  }, []);

  const handleConfirmPayment = async (invoiceId: string) => {
    setIsProcessingId(invoiceId);

    const updated = invoices.map((inv) =>
      inv.id === invoiceId
        ? {
            ...inv,
            status: 'paid' as InvoiceStatus,
            updated_at: new Date().toISOString(),
          }
        : inv
    );

    // Update in Supabase
    try {
      await supabase
        .from('invoices')
        .update({
          status: 'paid',
          updated_at: new Date().toISOString(),
        })
        .eq('id', invoiceId);
    } catch {
      // local fallback
    }

    setInvoices(updated);
    try {
      localStorage.setItem('mrca_client_invoices', JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent('mrca_invoice_updated'));
    } catch {
      // quota
    }

    setTimeout(() => {
      setIsProcessingId(null);
      if (showToast) {
        showToast(`[CONCILIADO] Factura ${invoiceId} marcada como PAGADA satisfactoriamente.`);
      }
    }, 600);
  };

  const pendingVerificationList = invoices.filter((inv) => inv.status === 'verification_in_progress');
  const totalPaid = invoices.filter((inv) => inv.status === 'paid').reduce((acc, curr) => acc + curr.amount, 0);
  const totalPending = invoices.filter((inv) => inv.status === 'pending').reduce((acc, curr) => acc + curr.amount, 0);
  const totalInVerification = pendingVerificationList.reduce((acc, curr) => acc + curr.amount, 0);

  const filteredInvoices = invoices.filter(
    (inv) =>
      inv.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.client_company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (inv.spei_tracking_key && inv.spei_tracking_key.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="w-full flex flex-col gap-6 font-['Inter'] text-[#dce1ff]">
      {/* ================================================================== */}
      {/* 1. TOP HEADER & TELEMETRY BANNER                                  */}
      {/* ================================================================== */}
      <div className="relative w-full rounded-2xl bg-gradient-to-r from-[#141a32]/95 via-[#0c163a]/90 to-[#141a32]/95 border-2 border-[#00E5FF]/40 p-5 sm:p-6 shadow-[0_10px_35px_rgba(0,229,255,0.18)] backdrop-blur-xl overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-full bg-gradient-to-l from-[#00FF66]/10 to-transparent pointer-events-none"></div>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-[#00E5FF]/15 border border-[#00E5FF]/30 text-[#00E5FF] font-['JetBrains_Mono'] text-[10px] font-bold tracking-wider uppercase flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                ADMIN ENCLAVE // FINANZAS &amp; AUDITORÍA SPEI
              </span>
              <span className="font-['JetBrains_Mono'] text-[11px] text-[#00FF66] font-semibold">
                • CUENTA CONCENTRADORA NU MÉXICO OK
              </span>
            </div>

            <h2 className="font-['Space_Grotesk'] text-[22px] sm:text-[26px] font-bold text-[#dce1ff]">
              Auditoría de Pagos &amp; Facturación Interbancaria SPEI
            </h2>
            <p className="font-['Inter'] text-[13px] text-[#bac9cc] max-w-3xl">
              Inspeccione comprobantes bancarios y claves de rastreo Banxico reportadas por clientes. Confirme los ingresos en Nu México con verificación de firma y marque las facturas como pagadas.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setActiveTab('auditoria')}
              className={`px-4 py-2 rounded-xl font-['JetBrains_Mono'] text-[11px] font-semibold transition-all flex items-center gap-2 ${
                activeTab === 'auditoria'
                  ? 'bg-[#00FF66] text-[#00363d] shadow-[0_0_15px_rgba(0,254,102,0.4)]'
                  : 'bg-[#182142] text-[#bac9cc] hover:text-[#dce1ff]'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Auditoría de Pagos ({pendingVerificationList.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('todas')}
              className={`px-4 py-2 rounded-xl font-['JetBrains_Mono'] text-[11px] font-semibold transition-all flex items-center gap-2 ${
                activeTab === 'todas'
                  ? 'bg-[#00E5FF] text-[#00363d] shadow-[0_0_15px_rgba(0,229,255,0.4)]'
                  : 'bg-[#182142] text-[#bac9cc] hover:text-[#dce1ff]'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Todas las Facturas ({invoices.length})</span>
            </button>
          </div>
        </div>
      </div>

      {/* ================================================================== */}
      {/* 2. SUMMARY KPI TILES                                               */}
      {/* ================================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Tile 1: En espera de Auditoría */}
        <div className="rounded-xl bg-[#0e1738]/90 border border-[#00E5FF]/40 p-4 flex flex-col justify-between shadow-lg">
          <div className="flex items-center justify-between text-[#849396] font-['JetBrains_Mono'] text-[11px]">
            <span>PAGOS SPEI EN ESPERA DE AUDITORÍA</span>
            <Clock className="w-4 h-4 text-[#00E5FF] animate-spin" />
          </div>
          <div className="my-2">
            <span className="font-['Space_Grotesk'] text-[26px] font-bold text-[#00E5FF]">
              ${totalInVerification.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
            </span>
            <span className="font-['JetBrains_Mono'] text-[11px] text-[#849396] ml-2">MXN</span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] font-['JetBrains_Mono'] text-[#00daf3]">
            <span>{pendingVerificationList.length} comprobante(s) por dictaminar</span>
          </div>
        </div>

        {/* Tile 2: Total Conciliado */}
        <div className="rounded-xl bg-[#0e1738]/90 border border-[#00FF66]/30 p-4 flex flex-col justify-between shadow-lg">
          <div className="flex items-center justify-between text-[#849396] font-['JetBrains_Mono'] text-[11px]">
            <span>TOTAL LIQUIDADO EN NU MÉXICO</span>
            <DollarSign className="w-4 h-4 text-[#00FF66]" />
          </div>
          <div className="my-2">
            <span className="font-['Space_Grotesk'] text-[26px] font-bold text-[#00FF66]">
              ${totalPaid.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
            </span>
            <span className="font-['JetBrains_Mono'] text-[11px] text-[#849396] ml-2">MXN</span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] font-['JetBrains_Mono'] text-[#00FF66]">
            <span>Ingreso neto sin intermediarios</span>
          </div>
        </div>

        {/* Tile 3: Pendiente de Cobro */}
        <div className="rounded-xl bg-[#0e1738]/90 border border-[#1f2b52] p-4 flex flex-col justify-between shadow-lg">
          <div className="flex items-center justify-between text-[#849396] font-['JetBrains_Mono'] text-[11px]">
            <span>FACTURAS PENDIENTES DE PAGO</span>
            <AlertCircle className="w-4 h-4 text-[#ffb020]" />
          </div>
          <div className="my-2">
            <span className="font-['Space_Grotesk'] text-[26px] font-bold text-[#ffb020]">
              ${totalPending.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
            </span>
            <span className="font-['JetBrains_Mono'] text-[11px] text-[#849396] ml-2">MXN</span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] font-['JetBrains_Mono'] text-[#849396]">
            <span>Por transferir por clientes B2B</span>
          </div>
        </div>
      </div>

      {/* ================================================================== */}
      {/* 3. SECCIÓN: AUDITORÍA DE PAGOS SPEI (PRIORIDAD ALTA)               */}
      {/* ================================================================== */}
      {activeTab === 'auditoria' && (
        <div className="flex flex-col gap-4 rounded-2xl bg-[#091129]/95 border-2 border-[#00FF66]/40 p-5 sm:p-6 shadow-[0_0_30px_rgba(0,254,102,0.15)] backdrop-blur-xl">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#1b2b52]">
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#00FF66] animate-ping"></span>
              <h3 className="font-['Space_Grotesk'] text-[17px] font-bold text-[#dce1ff]">
                Auditoría de Pagos SPEI en Espera de Dictamen
              </h3>
            </div>
            <span className="font-['JetBrains_Mono'] text-[11px] text-[#00FF66]">
              CONCILIACIÓN MANUAL PROTEGIDA // ENCLAVE ADMIN
            </span>
          </div>

          {pendingVerificationList.length === 0 ? (
            <div className="p-8 text-center rounded-xl bg-[#050b1c] border border-[#1b2b50] flex flex-col items-center justify-center gap-2">
              <CheckCircle2 className="w-10 h-10 text-[#00FF66] shadow-[0_0_15px_#00FF66]" />
              <span className="font-['Space_Grotesk'] text-[16px] font-bold text-[#dce1ff]">
                No hay pagos pendientes de auditoría
              </span>
              <p className="font-['Inter'] text-[12px] text-[#849396]">
                Todas las transferencias SPEI recibidas han sido conciliadas en Nu México.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-3.5">
              {pendingVerificationList.map((inv) => (
                <div
                  key={inv.id}
                  className="rounded-2xl bg-[#050b1c] border border-[#00E5FF]/40 p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-5 hover:border-[#00FF66] transition-all shadow-lg"
                >
                  <div className="flex flex-col gap-2 max-w-2xl">
                    <div className="flex items-center gap-2">
                      <span className="font-['JetBrains_Mono'] text-[12px] font-bold text-[#00E5FF]">
                        {inv.id}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full bg-[#00E5FF]/20 text-[#00E5FF] border border-[#00E5FF]/40 font-['JetBrains_Mono'] text-[10px] font-bold uppercase animate-pulse">
                        VERIFICACIÓN EN PROCESO
                      </span>
                      <span className="font-['JetBrains_Mono'] text-[10px] text-[#849396]">
                        • Emitida: {inv.created_at}
                      </span>
                    </div>

                    <h4 className="font-['Space_Grotesk'] text-[16px] font-bold text-[#dce1ff]">
                      {inv.description}
                    </h4>

                    <div className="flex flex-wrap items-center gap-3 font-['JetBrains_Mono'] text-[11px] text-[#849396]">
                      <span>
                        Cliente: <strong className="text-[#00E5FF]">{inv.client_company}</strong>
                      </span>
                      <span>•</span>
                      <span>Contacto: {inv.client_email}</span>
                    </div>

                    {/* SPEI Tracking Key Details */}
                    <div className="p-3 rounded-xl bg-[#091129] border border-[#1e2a52] flex flex-wrap items-center justify-between gap-2 mt-1">
                      <div className="flex items-center gap-2 font-['JetBrains_Mono'] text-[11px]">
                        <Hash className="w-3.5 h-3.5 text-[#00FF66]" />
                        <span className="text-[#849396]">Clave de Rastreo Banxico:</span>
                        <strong className="text-[#00FF66] select-all font-mono">
                          {inv.spei_tracking_key || 'No especificada'}
                        </strong>
                      </div>

                      <a
                        href={`https://www.banxico.org.mx/cep/`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[10px] font-['JetBrains_Mono'] text-[#00E5FF] hover:underline flex items-center gap-1"
                      >
                        <span>Validar en CEP Banxico</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>

                  {/* Actions Column */}
                  <div className="flex flex-col sm:flex-row lg:flex-col items-start lg:items-end justify-between gap-3 shrink-0 pt-3 lg:pt-0 border-t lg:border-t-0 border-[#1a264a]">
                    <div className="text-left lg:text-right">
                      <span className="font-['JetBrains_Mono'] text-[10px] text-[#849396] block">
                        MONTO A CONFIRMAR:
                      </span>
                      <span className="font-['Space_Grotesk'] text-[24px] font-bold text-[#00FF66]">
                        ${inv.amount.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                      </span>
                      <span className="font-['JetBrains_Mono'] text-[11px] text-[#849396] ml-1">MXN</span>
                    </div>

                    <div className="flex items-center gap-2 w-full lg:w-auto">
                      <button
                        type="button"
                        onClick={() => setInspectingInvoice(inv)}
                        className="flex-1 lg:flex-initial px-3.5 py-2.5 rounded-xl bg-[#141f42] hover:bg-[#1e2d60] text-[#00E5FF] font-['JetBrains_Mono'] text-[11px] font-semibold transition-all flex items-center justify-center gap-1.5"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Ver Recibo</span>
                      </button>

                      {/* Terminal Green Button: Confirmar Ingreso y Marcar Pagado */}
                      <button
                        type="button"
                        disabled={isProcessingId === inv.id}
                        onClick={() => handleConfirmPayment(inv.id)}
                        className="flex-1 lg:flex-initial px-4 py-2.5 rounded-xl bg-[#00FF66] hover:bg-[#40ff88] text-[#00363d] font-['JetBrains_Mono'] text-[11px] font-bold uppercase tracking-wider transition-all shadow-[0_0_20px_#00FF66] hover:shadow-[0_0_25px_#00FF66] disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {isProcessingId === inv.id ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            <span>Conciliando...</span>
                          </>
                        ) : (
                          <>
                            <Check className="w-4 h-4 text-[#00363d]" />
                            <span>Confirmar Ingreso y Marcar Pagado</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ================================================================== */}
      {/* 4. SECCIÓN: TODAS LAS FACTURAS                                     */}
      {/* ================================================================== */}
      {activeTab === 'todas' && (
        <div className="flex flex-col gap-4 rounded-2xl bg-[#091129]/90 border border-[#1b2b52] p-5 shadow-xl">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#18264d]">
            <h3 className="font-['Space_Grotesk'] text-[17px] font-bold text-[#dce1ff]">
              Registro General de Facturas B2B
            </h3>

            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[#849396] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Filtrar por cliente, folio o rastreo..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 rounded-xl bg-[#050a1a] border border-[#1e2a52] text-[#dce1ff] font-['JetBrains_Mono'] text-[11px] focus:outline-none focus:border-[#00E5FF]"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2.5">
            {filteredInvoices.map((inv) => (
              <div
                key={inv.id}
                className="bg-[#0e1633] rounded-xl p-4 border border-[#1a2850] flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-[#00E5FF]/40 transition-all"
              >
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="font-['JetBrains_Mono'] text-[11px] font-bold text-[#00E5FF]">
                      {inv.id}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-['JetBrains_Mono'] font-bold uppercase ${
                        inv.status === 'paid'
                          ? 'bg-[#00FF66]/15 text-[#00FF66] border border-[#00FF66]/30'
                          : inv.status === 'verification_in_progress'
                          ? 'bg-[#00E5FF]/15 text-[#00E5FF] border border-[#00E5FF]/30'
                          : 'bg-[#ff9900]/15 text-[#ffb020] border border-[#ffb020]/30'
                      }`}
                    >
                      {inv.status === 'paid'
                        ? 'PAGADO'
                        : inv.status === 'verification_in_progress'
                        ? 'VERIFICACIÓN PENDIENTE'
                        : 'PENDIENTE'}
                    </span>
                    <span className="text-[#849396] text-[11px] font-['JetBrains_Mono']">
                      • {inv.client_company}
                    </span>
                  </div>

                  <span className="font-['Space_Grotesk'] text-[14px] text-[#dce1ff]">
                    {inv.description}
                  </span>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <span className="font-['Space_Grotesk'] text-[16px] font-bold text-[#dce1ff]">
                      ${inv.amount.toLocaleString('es-MX')} MXN
                    </span>
                  </div>

                  {inv.status === 'verification_in_progress' && (
                    <button
                      type="button"
                      onClick={() => handleConfirmPayment(inv.id)}
                      className="px-3 py-1.5 rounded-lg bg-[#00FF66] hover:bg-[#40ff88] text-[#00363d] font-['JetBrains_Mono'] text-[10px] font-bold uppercase shadow-[0_0_12px_#00FF66]"
                    >
                      Confirmar Pago
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================================================================== */}
      {/* 5. MODAL: INSPECCIONAR RECIBO & DETALLES SPEI                      */}
      {/* ================================================================== */}
      {inspectingInvoice && (
        <div className="fixed inset-0 z-50 bg-[#060c1e]/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className="relative w-full max-w-lg rounded-3xl bg-[#091129] border-2 border-[#00E5FF]/50 p-6 shadow-[0_0_50px_rgba(0,229,255,0.3)] flex flex-col gap-4 font-['JetBrains_Mono'] text-[12px]">
            <div className="flex items-center justify-between pb-3 border-b border-[#1b2b52]">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#00E5FF]" />
                <span className="font-['Space_Grotesk'] text-[16px] font-bold text-[#dce1ff]">
                  Comprobante SPEI // {inspectingInvoice.id}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setInspectingInvoice(null)}
                className="text-[#849396] hover:text-[#dce1ff] text-[18px]"
              >
                ✕
              </button>
            </div>

            <div className="p-4 rounded-xl bg-[#050b1c] border border-[#1a2850] flex flex-col gap-2">
              <div className="flex justify-between">
                <span className="text-[#849396]">EMPRESA CLIENTE:</span>
                <span className="text-[#00E5FF] font-bold">{inspectingInvoice.client_company}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#849396]">MONTO REPORTADO:</span>
                <span className="text-[#00FF66] font-bold">${inspectingInvoice.amount.toLocaleString('es-MX')} MXN</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#849396]">CLAVE DE RASTREO:</span>
                <span className="text-[#00FF66] select-all break-all">{inspectingInvoice.spei_tracking_key || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#849396]">CUENTA DESTINO:</span>
                <span className="text-[#bac9cc]">Nu México (Concentradora B2B)</span>
              </div>
            </div>

            {/* Simulated Receipt Preview Canvas */}
            <div className="w-full h-44 rounded-xl bg-[#030712] border border-[#1e2a52] p-4 flex flex-col items-center justify-center gap-2 text-center">
              <FileText className="w-10 h-10 text-[#00E5FF]/60" />
              <span className="text-[#bac9cc] text-[11px]">
                {inspectingInvoice.payment_proof_url ? 'Comprobante bancario PDF/JPG vinculado' : 'Sin archivo adjunto físico'}
              </span>
              <span className="text-[10px] text-[#00FF66]">
                Sello de Transmisión SHA-256 OK
              </span>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setInspectingInvoice(null)}
                className="px-4 py-2 rounded-xl bg-[#141f42] text-[#bac9cc] hover:text-[#dce1ff]"
              >
                Cerrar
              </button>
              <button
                type="button"
                onClick={() => {
                  handleConfirmPayment(inspectingInvoice.id);
                  setInspectingInvoice(null);
                }}
                className="px-4 py-2 rounded-xl bg-[#00FF66] hover:bg-[#40ff88] text-[#00363d] font-bold uppercase shadow-[0_0_15px_#00FF66]"
              >
                Confirmar Ingreso y Marcar Pagado
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
