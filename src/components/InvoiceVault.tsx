import React, { useState } from 'react';
import { motion } from 'motion/react';
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

const MOCK_INVOICES: InvoiceItem[] = [
  {
    id: 'INV-001',
    folio: 'F-2026-081',
    uuidSat: '4FA892C1-3B12-4D90-8812-7F0129B81920',
    concept: 'Implementación de Arquitectura Cloud Zero-Trust & Microservicios',
    amountMxn: 159482.76,
    vatMxn: 25517.24,
    totalMxn: 185000.00,
    date: '12 de Octubre, 2026',
    status: 'PAGADA',
    gateway: 'SPEI Inmediato Banxico',
    trackingKey: 'SPEI20261012894129',
  },
  {
    id: 'INV-002',
    folio: 'F-2026-074',
    uuidSat: '9A7712E0-112B-4A12-9014-6F29108BA121',
    concept: 'Auditoría de Pentesting Ofensivo Kali Linux & Hardening RLS',
    amountMxn: 81896.55,
    vatMxn: 13103.45,
    totalMxn: 95000.00,
    date: '28 de Septiembre, 2026',
    status: 'PAGADA',
    gateway: 'SPEI Inmediato Banxico',
    trackingKey: 'SPEI20260928741022',
  },
  {
    id: 'INV-003',
    folio: 'F-2026-059',
    uuidSat: '2C9901F4-44A1-4E89-B012-110298B74109',
    concept: 'Despliegue de Clúster PostgreSQL Supabase Enterprise & Enclaves mTLS',
    amountMxn: 120689.65,
    vatMxn: 19310.35,
    totalMxn: 140000.00,
    date: '15 de Septiembre, 2026',
    status: 'PAGADA',
    gateway: 'Transferencia Nu México B2B',
    trackingKey: 'NU20260915994101',
  },
  {
    id: 'INV-004',
    folio: 'F-2026-042',
    uuidSat: '1E8044B2-99F1-4412-8810-5E01928B3301',
    concept: 'Licenciamiento B2B & Mantenimiento Proactivo con Garantía SLA 99.9%',
    amountMxn: 38793.10,
    vatMxn: 6206.90,
    totalMxn: 45000.00,
    date: '01 de Septiembre, 2026',
    status: 'PAGADA',
    gateway: 'SPEI Inmediato Banxico',
    trackingKey: 'SPEI20260901420199',
  },
];

export const InvoiceVault: React.FC<{
  clientCompany?: string;
  showToast?: (msg: string) => void;
}> = ({ clientCompany = 'FinTech Global B2B', showToast = (msg) => console.log(msg) }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const filteredInvoices = MOCK_INVOICES.filter(
    (inv) =>
      inv.concept.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.folio.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.uuidSat.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Manual-only click handler: fires only when called as an explicit arrow callback
  const downloadFile = (invoiceId: string) => {
    const invoice = MOCK_INVOICES.find((i) => i.id === invoiceId);
    if (!invoice) return;

    setDownloadingId(invoice.id);
    if (showToast) showToast(`Generando comprobante fiscal para Folio ${invoice.folio}...`);

    setTimeout(() => {
      setDownloadingId(null);

      // Create a mock downloadable PDF blob with .pdf extension
      const mockPdfContent = `%PDF-1.4\n%MRCA SOLUTIONS B2B INVOICE\n` +
        `Folio: ${invoice.folio}\nUUID SAT: ${invoice.uuidSat}\nCliente: ${clientCompany}\n` +
        `Concepto: ${invoice.concept}\nSubtotal: $${invoice.amountMxn.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN\n` +
        `IVA (16%): $${invoice.vatMxn.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN\nTotal: $${invoice.totalMxn.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN\n` +
        `Fecha de Timbrado: ${invoice.date}\nMétodo: ${invoice.gateway}\nClave de Rastreo: ${invoice.trackingKey}\n` +
        `Sello Digital SAT: SHA256-ECDSA-VERIFIED\n%%EOF`;

      const blob = new Blob([mockPdfContent], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      // Fixed file extension: strictly factura-MRCA-${invoice.id}.pdf
      link.download = `factura-MRCA-${invoice.id}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      if (showToast) showToast(`Factura factura-MRCA-${invoice.id}.pdf descargada exitosamente.`);
    }, 400);
  };

  const downloadXML = (invoiceId: string) => {
    const invoice = MOCK_INVOICES.find((i) => i.id === invoiceId);
    if (!invoice) return;

    if (showToast) showToast(`Descargando XML timbrado SAT para ${invoice.folio}...`);
    const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>\n<cfdi:Comprobante xmlns:cfdi="http://www.sat.gob.mx/cfd/4" Version="4.0" Folio="${invoice.folio}" Total="${invoice.totalMxn}">\n  <cfdi:Emisor Rfc="MCR260101XYZ" Nombre="MRCA SOLUTIONS S.A.P.I. DE C.V."/>\n  <cfdi:Receptor Nombre="${clientCompany}"/>\n  <cfdi:Conceptos>\n    <cfdi:Concepto Descripcion="${invoice.concept}" Importe="${invoice.amountMxn}"/>\n  </cfdi:Conceptos>\n</cfdi:Comprobante>`;
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

  const totalBilled = MOCK_INVOICES.reduce((acc, curr) => acc + curr.totalMxn, 0);

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
              Bóveda de Facturas & Comprobantes
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
          <span className="text-[10px] text-[#00daf3]">4 Facturas Timbradas</span>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative w-full">
        <Search className="absolute left-3.5 top-3 w-4 h-4 text-[#849396]" />
        <input
          type="text"
          placeholder="Buscar factura por concepto, folio (F-2026-...) o UUID fiscal..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-[#060d24] border border-[#222941] focus:border-[#00e5ff] rounded-2xl pl-10 pr-4 py-2.5 text-[12px] text-[#dce1ff] focus:outline-none font-['JetBrains_Mono'] transition-colors"
        />
      </div>

      {/* Invoices List */}
      <div className="flex flex-col gap-3">
        {filteredInvoices.length === 0 ? (
          <div className="rounded-2xl bg-[#0a1128] border border-[#222941] p-12 text-center text-[#849396] font-['JetBrains_Mono'] text-[13px]">
            No se encontraron facturas con el criterio de búsqueda especificado.
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
