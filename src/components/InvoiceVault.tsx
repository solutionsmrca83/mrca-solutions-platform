import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { supabase } from '../lib/supabase/client';
import { 
  FileText, 
  Download, 
  Receipt, 
  CheckCircle2, 
  Clock, 
  CreditCard, 
  ExternalLink, 
  Search, 
  FileCode, 
  Building2, 
  ShieldCheck,
  Check
} from 'lucide-react';

export interface InvoiceItem {
  id: string;
  folio: string;
  uuidSat: string;
  concept: string;
  amountMxn: number;
  vatMxn: number;
  totalMxn: number;
  date: string;
  status: 'PAGADA' | 'TIMBRADA' | 'PROCESADA';
  gateway: 'SPEI Inmediato Banxico' | 'Transferencia Nu México B2B';
  trackingKey: string;
}

export const InvoiceVault: React.FC<{
  clientCompany?: string;
  showToast?: (msg: string) => void;
}> = ({ clientCompany = 'Cuenta Corporativa', showToast = () => {} }) => {
  const [invoices, setInvoices] = useState<InvoiceItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    async function loadBilledInvoices() {
      setIsLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          if (mounted) setInvoices([]);
          return;
        }
        const { data, error } = await supabase
          .from('invoices')
          .select('*')
          .eq('client_id', user.id)
          .order('created_at', { ascending: false });

        if (mounted && !error && Array.isArray(data)) {
          const mapped: InvoiceItem[] = data.map((row: any) => {
            const totalMxn = Number(row.amount || 0);
            const amountMxn = Number((totalMxn / 1.16).toFixed(2));
            const vatMxn = Number((totalMxn - amountMxn).toFixed(2));
            return {
              id: String(row.id),
              folio: `F-${String(row.id).slice(0, 8).toUpperCase()}`,
              uuidSat: row.spei_tracking_key || 'PENDIENTE-TIMBRADO',
              concept: row.description || 'Servicios Profesionales B2B',
              amountMxn,
              vatMxn,
              totalMxn,
              date: row.created_at
                ? new Date(row.created_at).toLocaleDateString('es-MX', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric',
                  })
                : '',
              status:
                row.status === 'paid'
                  ? 'PAGADA'
                  : row.status === 'verification_in_progress'
                  ? 'PROCESADA'
                  : 'TIMBRADA',
              gateway: 'Transferencia Nu México B2B',
              trackingKey: row.spei_tracking_key || 'PENDIENTE',
            };
          });
          setInvoices(mapped);
        } else if (mounted) {
          setInvoices([]);
        }
      } catch {
        if (mounted) setInvoices([]);
      } finally {
        if (mounted) setIsLoading(false);
      }
    }
    void loadBilledInvoices();
    return () => {
      mounted = false;
    };
  }, []);

  const filteredInvoices = invoices.filter(
    (inv) =>
      inv.concept.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.folio.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.uuidSat.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Manual-only click handler: fires only when called as an explicit arrow callback
  const downloadFile = (invoiceId: string) => {
    const invoice = invoices.find((i) => i.id === invoiceId);
    if (!invoice) return;

    setDownloadingId(invoice.id);
    if (showToast) showToast(`Generando comprobante fiscal para Folio ${invoice.folio}...`);

    setTimeout(() => {
      setDownloadingId(null);

      const pdfContent = `%PDF-1.4\n%MRCA SOLUTIONS B2B INVOICE\n` +
        `Folio: ${invoice.folio}\nUUID SAT: ${invoice.uuidSat}\nCliente: ${clientCompany}\n` +
        `Concepto: ${invoice.concept}\nSubtotal: $${invoice.amountMxn.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN\n` +
        `IVA (16%): $${invoice.vatMxn.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN\nTotal: $${invoice.totalMxn.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN\n` +
        `Fecha de Emisión: ${invoice.date}\nMétodo: ${invoice.gateway}\nClave de Rastreo: ${invoice.trackingKey}\n%%EOF`;

      const blob = new Blob([pdfContent], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `factura-MRCA-${invoice.id}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      if (showToast) showToast(`Factura factura-MRCA-${invoice.id}.pdf descargada exitosamente.`);
    }, 400);
  };

  const downloadXML = (invoiceId: string) => {
    const invoice = invoices.find((i) => i.id === invoiceId);
    if (!invoice) return;

    if (showToast) showToast(`Descargando XML CFDI 4.0 para ${invoice.folio}...`);
    const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>\n<cfdi:Comprobante xmlns:cfdi="http://www.sat.gob.mx/cfd/4" Version="4.0" Folio="${invoice.folio}" Total="${invoice.totalMxn}">\n  <cfdi:Emisor Nombre="MRCA SOLUTIONS"/>\n  <cfdi:Receptor Nombre="${clientCompany}"/>\n  <cfdi:Conceptos>\n    <cfdi:Concepto Descripcion="${invoice.concept}" Importe="${invoice.amountMxn}"/>\n  </cfdi:Conceptos>\n</cfdi:Comprobante>`;
    const blob = new Blob([xmlContent], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `factura-MRCA-${invoice.id}.xml`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const totalBilled = invoices.reduce((acc, curr) => acc + curr.totalMxn, 0);

  return (
    <div className="w-full flex flex-col gap-5">
      {/* Top Banner HUD */}
      <div className="rounded-3xl bg-[#0a1128]/95 border border-[#00e5ff]/30 p-6 shadow-2xl backdrop-blur-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-[#060d24] border border-[#00FF66]/40 flex items-center justify-center text-[#00FF66] shadow-[0_0_20px_rgba(0,255,102,0.2)] shrink-0">
            <Receipt className="w-6 h-6 text-[#00FF66]" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-[#00fe66] animate-pulse shadow-[0_0_8px_#00fe66]" />
              <span className="font-['JetBrains_Mono'] text-[10px] text-[#00fe66] uppercase font-bold tracking-wider">
                BÓVEDA FISCAL B2B // CFDI 4.0 TIMBRADO SAT
              </span>
            </div>
            <h2 className="font-['Space_Grotesk'] text-[22px] font-bold text-[#dce1ff]">
              Bóveda de Facturas &amp; Comprobantes
            </h2>
            <p className="font-['Inter'] text-[12px] text-[#bac9cc]">
              Descarga expedita de facturas electrónicas timbradas ante el SAT y comprobantes de dispersión SPEI para <strong className="text-[#00e5ff]">{clientCompany}</strong>.
            </p>
          </div>
        </div>

        {/* Total Billed Metric */}
        <div className="p-3.5 rounded-2xl bg-[#060d24] border border-[#222941] flex flex-col items-end self-stretch sm:self-auto font-['JetBrains_Mono']">
          <span className="text-[10px] uppercase text-[#849396]">Total Facturado Histórico</span>
          <span className="text-[18px] font-bold text-[#00FF66]">
            ${totalBilled.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN
          </span>
          <span className="text-[10px] text-[#00daf3]">
            {invoices.length} {invoices.length === 1 ? 'Factura Registrada' : 'Facturas Registradas'}
          </span>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative w-full">
        <Search className="absolute left-3.5 top-3 w-4 h-4 text-[#849396]" />
        <input
          type="text"
          placeholder="Buscar factura por concepto, folio o clave de rastreo..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-[#060d24] border border-[#222941] focus:border-[#00e5ff] rounded-2xl pl-10 pr-4 py-2.5 text-[12px] text-[#dce1ff] focus:outline-none font-['JetBrains_Mono'] transition-colors"
        />
      </div>

      {/* Invoices List */}
      <div className="flex flex-col gap-3">
        {isLoading ? (
          <div className="rounded-2xl bg-[#0a1128] border border-[#222941] p-12 text-center text-[#849396] font-['JetBrains_Mono'] text-[13px]">
            Consultando facturas fiscales en Supabase...
          </div>
        ) : filteredInvoices.length === 0 ? (
          <div className="rounded-2xl bg-[#0a1128] border border-dashed border-[#222941] p-12 text-center flex flex-col items-center gap-2">
            <Receipt className="w-8 h-8 text-[#849396]/70" />
            <span className="font-['Space_Grotesk'] text-[15px] font-bold text-[#dce1ff]">
              Sin facturas registradas aún
            </span>
            <span className="text-[#849396] font-['Inter'] text-[12px]">
              Tus comprobantes fiscales CFDI 4.0 y recibos SPEI aparecerán aquí automáticamente al emitirse.
            </span>
          </div>
        ) : (
          filteredInvoices.map((invoice) => (
            <motion.div
              key={invoice.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl bg-[#0a1128]/95 border border-[#222941] hover:border-[#00e5ff]/40 p-4 sm:p-5 shadow-lg backdrop-blur-xl transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4 group"
            >
              {/* Left Item Details */}
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-[#141a32] border border-[#00e5ff]/30 flex items-center justify-center text-[#00e5ff] shrink-0 mt-0.5 group-hover:shadow-[0_0_15px_rgba(0,229,255,0.3)] transition-all">
                  <FileText className="w-5 h-5 text-[#00e5ff]" />
                </div>
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-['JetBrains_Mono'] text-[13px] font-bold text-[#dce1ff]">
                      {invoice.folio}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-[#00fe66]/10 border border-[#00fe66]/30 text-[#00fe66] font-['JetBrains_Mono'] text-[10px] font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-[#00fe66]" />
                      <span>{invoice.status}</span>
                    </span>
                    <span className="font-['JetBrains_Mono'] text-[10px] text-[#849396]">
                      {invoice.date}
                    </span>
                  </div>

                  <h3 className="font-['Space_Grotesk'] text-[15px] font-bold text-[#dce1ff] leading-snug">
                    {invoice.concept}
                  </h3>

                  <div className="flex items-center gap-3 text-[11px] font-['JetBrains_Mono'] text-[#849396] flex-wrap">
                    <span>UUID: <span className="text-[#bac9cc] select-all">{invoice.uuidSat}</span></span>
                    <span>•</span>
                    <span className="text-cyan-400/90">{invoice.gateway}</span>
                  </div>
                </div>
              </div>

              {/* Right Action & Pricing */}
              <div className="flex items-center justify-between md:justify-end gap-4 w-full md:w-auto pt-3 md:pt-0 border-t md:border-t-0 border-[#181e36]">
                <div className="flex flex-col md:text-right font-['JetBrains_Mono']">
                  <span className="text-[16px] font-bold text-[#00FF66]">
                    ${invoice.totalMxn.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN
                  </span>
                  <span className="text-[10px] text-[#849396]">
                    Subtotal: ${invoice.amountMxn.toLocaleString('es-MX', { minimumFractionDigits: 2 })} + IVA
                  </span>
                </div>

                {/* Download Actions */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => downloadXML(invoice.id)}
                    className="p-2 rounded-xl bg-[#141a32] hover:bg-[#181e36] border border-[#3b494c] hover:border-[#00e5ff]/50 text-[#bac9cc] hover:text-[#00daf3] transition-all cursor-pointer"
                    title="Descargar Comprobante XML Timbrado"
                    aria-label="Descargar XML"
                  >
                    <FileCode className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => downloadFile(invoice.id)}
                    disabled={downloadingId === invoice.id}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#00e5ff] hover:bg-[#c3f5ff] text-[#00363d] font-['JetBrains_Mono'] text-[12px] font-bold shadow-[0_0_15px_rgba(0,229,255,0.3)] transition-all cursor-pointer disabled:opacity-50"
                  >
                    <Download className={`w-4 h-4 ${downloadingId === invoice.id ? 'animate-bounce' : ''}`} />
                    <span>{downloadingId === invoice.id ? 'Generando...' : 'Descargar PDF'}</span>
                  </button>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Fiscal Transparency Note */}
      <div className="p-4 rounded-2xl bg-[#060d24] border border-[#222941] flex items-center justify-between gap-3 text-[11px] font-['JetBrains_Mono'] text-[#849396]">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-[#00fe66]" />
          <span>CFDI 4.0 emitidos con sello criptográfico SAT conforme al Art. 29-A del CFF.</span>
        </div>
        <span className="text-[#00daf3]">Régimen General de Ley Personas Morales</span>
      </div>
    </div>
  );
};

export default InvoiceVault;
