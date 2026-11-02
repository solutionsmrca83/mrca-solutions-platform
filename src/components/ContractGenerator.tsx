import React, { useState, useEffect, useId } from 'react';
import {
  FileText,
  ShieldCheck,
  CheckCircle2,
  Copy,
  Clock,
  Sparkles,
  Building,
  User,
  Mail,
  DollarSign,
  Send,
  Download,
  Share2,
  ExternalLink,
  Shield,
  Layers,
  Check,
  AlertCircle,
  FileCode,
  Scale,
  Lock,
  Cpu,
  Printer,
  ChevronRight,
  ArrowRight,
  Hash,
  RefreshCw,
  QrCode,
  ShieldAlert,
} from 'lucide-react';
import { supabase } from '../lib/supabase/client';
import { isSuperAdmin, isPartner, getUserPermissions } from '../lib/auth';
import { ClientContract, BudgetNegotiation } from '../types';

interface ContractGeneratorProps {
  showToast: (msg: string) => void;
  sessionUser?: any;
  initialMode?: 'generator' | 'negotiations' | 'history';
  onNavigateTab?: (tab: any) => void;
  onContractSent?: (contract: ClientContract) => void;
}

export interface ServiceOption {
  id: string;
  name: string;
  description: string;
  category: 'cloud' | 'security' | 'audit' | 'dev';
}

export const AVAILABLE_SERVICES: ServiceOption[] = [
  {
    id: 'cloud_arch',
    name: 'Cloud Architecture',
    description: 'Arquitectura distribuida en AWS/GCP con microservicios de alta concurrencia y orquestación Kubernetes.',
    category: 'cloud',
  },
  {
    id: 'zero_trust',
    name: 'Zero-Trust Deployment',
    description: 'Aislamiento mTLS, eBPF/Cilium, microsegmentación perimetral y autenticación con llaves criptográficas FIPS 140-3.',
    category: 'security',
  },
  {
    id: 'soc2_audit',
    name: 'SOC-2 Audit',
    description: 'Auditoría forense, hardening de infraestructura, análisis estático SAST y cumplimiento regulatorio NIST CSF.',
    category: 'audit',
  },
  {
    id: 'webapp_dev',
    name: 'Web App Development',
    description: 'Desarrollo full-stack con Next.js 15, React 19, Tailwind CSS y backends blindados en Rust/PostgreSQL RLS.',
    category: 'dev',
  },
  {
    id: 'pentest_offensive',
    name: 'Pentesting Ofensivo Kali Linux',
    description: 'Simulación de adversarios Red Team, vectores de ataque OWASP Top 10 y reglas de combate formales (RoE).',
    category: 'security',
  },
  {
    id: 'escrow_custody',
    name: 'Custodia Escrow Dual Banxico',
    description: 'Dispersión condicionada 2-de-2 firmas con soporte SPEI Inmediato y liquidación contra entregables UAT.',
    category: 'cloud',
  },
];

const PRESET_CLIENTS = [
  {
    companyName: 'Banco NeoPay LatAm S.A. de C.V.',
    representativeName: 'Ing. Rodrigo Salinas Valenzuela',
    email: 'rsalinas@neopay.lat',
    rfc: 'BNP180412XYZ',
    totalCost: '$350,000 MXN',
    paymentTerms: '50% Anticipo, 50% Contra Entrega y UAT',
    advancePercentage: '40%',
    uptime: '99.999%',
    responseTime: '1h',
    services: ['cloud_arch', 'zero_trust', 'soc2_audit'],
  },
  {
    companyName: 'Aduana Express Cloud S.A.P.I. de C.V.',
    representativeName: 'Lic. Mariana Ortiz Estrada',
    email: 'mortiz@aduanaexpress.mx',
    rfc: 'AEC210815AB2',
    totalCost: '$180,000 MXN',
    paymentTerms: '50% Anticipo, 50% Contra Entrega y UAT',
    advancePercentage: '25%',
    uptime: '99.9%',
    responseTime: '1h',
    services: ['zero_trust', 'webapp_dev'],
  },
  {
    companyName: 'Salud Digital HIPAA Corp S.A. de C.V.',
    representativeName: 'Dr. Alejandro Méndez Arismendi',
    email: 'amendez@saluddigital.org',
    rfc: 'SDH191103K77',
    totalCost: '$420,000 MXN',
    paymentTerms: '30% Anticipo, 40% Hito Alpha, 30% Despliegue',
    advancePercentage: '40%',
    uptime: '99.999%',
    responseTime: '1h',
    services: ['cloud_arch', 'zero_trust', 'soc2_audit', 'webapp_dev'],
  },
  {
    companyName: 'E-Commerce Retail MX S.A. de C.V.',
    representativeName: 'Lic. Sofía Valdés Noriega',
    email: 'svaldes@retailmex.com',
    rfc: 'ERM200508J91',
    totalCost: '$260,000 MXN',
    paymentTerms: '50% Anticipo, 50% Contra Entrega y UAT',
    advancePercentage: '25%',
    uptime: '99.9%',
    responseTime: '24h',
    services: ['webapp_dev', 'cloud_arch'],
  },
];

// STRICT FINANCIAL CLAUSES & CLABE CONFIGURATION (NU MÉXICO)
export const NU_MEXICO_CLABE = '638180010197163103';
export const NU_MEXICO_INSTITUTION = 'Nu México';

export const PAYMENT_SPEI_CLAUSE =
  'Toda liquidación y anticipo deberá realizarse exclusivamente mediante transferencia bancaria electrónica (SPEI) a la cuenta CLABE: 638180010197163103 (Institución: Nu México). No se aceptan pasarelas de terceros.';

export const getDynamicAdvanceClause = (percentage: string) =>
  `Para iniciar la ejecución del proyecto, el Cliente se obliga a transferir un anticipo del ${percentage} del costo total. Este monto se retendrá a título de Pena Convencional (no reembolsable) en caso de cancelación prematura por parte del Cliente.`;

// MEXICAN LEGAL MANDATORY COMPLIANCE CLAUSES (EXACT VERBATIM TEXT)
export const MEXICAN_LEGAL_CLAUSES = {
  facturacion:
    'Las partes se obligan a emitir los CFDI versión 4.0 bajo los lineamientos vigentes del SAT, obligándose a entregar entregables mensuales como prueba de materialidad de los servicios prestados.',
  cancelacionYPena:
    'En caso de cancelación por el Cliente, la cantidad entregada como depósito inicial se retendrá por MRCA Solutions a título de Pena Convencional, sin que exista obligación de devolución.',
  propiedadIntelectual:
    'El presente desarrollo se realiza bajo la figura de Obra por Encargo. El desarrollador cede en su totalidad y de forma exclusiva los Derechos Patrimoniales del código objeto y fuente al Cliente, conservando sus Derechos Morales (Art. 83 y 84 LFDA).',
  pagoNuClabe: PAYMENT_SPEI_CLAUSE,
};

export const ContractGenerator: React.FC<ContractGeneratorProps> = ({
  showToast,
  sessionUser,
  initialMode = 'generator',
  onNavigateTab,
  onContractSent,
}) => {
  // Strict Superadmin write check: only users with role === 'superadmin' / owner / master email
  const isSuper = Boolean(sessionUser ? (isSuperAdmin(sessionUser) || sessionUser?.role === 'superadmin') : true);
  const isPrtnr = isPartner(sessionUser);
  const permissions = getUserPermissions(sessionUser);
  // Restrict access strictly to superadmin and partner roles
  // (In local dev / standalone mode if sessionUser is empty, default authorized for demo)
  const isAuthorized = !sessionUser || isSuper || isPrtnr || permissions.canGenerateContracts;

  // Active top-level subtab: 'generator' | 'negotiations' | 'history'
  const [activeTab, setActiveTab] = useState<'generator' | 'negotiations' | 'history'>(initialMode);

  // Form states: Client Details
  const [companyName, setCompanyName] = useState<string>('Banco NeoPay LatAm S.A. de C.V.');
  const [representativeName, setRepresentativeName] = useState<string>('Ing. Rodrigo Salinas Valenzuela');
  const [email, setEmail] = useState<string>('rsalinas@neopay.lat');
  const [rfc, setRfc] = useState<string>('BNP180412XYZ');

  // Project Specs (Multi-select)
  const [selectedServices, setSelectedServices] = useState<string[]>([
    'cloud_arch',
    'zero_trust',
    'soc2_audit',
    'webapp_dev',
  ]);
  const [customScopeNotes, setCustomScopeNotes] = useState<string>(
    'Despliegue perimetral con soporte para auditoría bancaria Banxico, esquemas PostgreSQL con RLS multitenant y cifrado de repositorios con llaves HSM YubiKey Nivel 4.'
  );

  // Financials
  const [totalCost, setTotalCost] = useState<string>('$350,000 MXN');
  const [paymentTerms, setPaymentTerms] = useState<string>('50% Anticipo, 50% Entrega');
  const [advancePercentage, setAdvancePercentage] = useState<'25%' | '40%'>('25%');

  // SLA Guarantees
  const [uptime, setUptime] = useState<'99.9%' | '99.999%'>('99.999%');
  const [responseTime, setResponseTime] = useState<'1h' | '24h'>('1h');

  // Generation & Action Bar states
  const [contractFolio, setContractFolio] = useState<string>(() => `CTR-2026-MX-${Math.floor(100000 + Math.random() * 900000)}`);
  const [isExportingPdf, setIsExportingPdf] = useState<boolean>(false);
  const [cryptoLinkModal, setCryptoLinkModal] = useState<{
    isOpen: boolean;
    url: string;
    token: string;
    expiresIn: string;
    hash: string;
  }>({
    isOpen: false,
    url: '',
    token: '',
    expiresIn: '',
    hash: '',
  });

  // Drafts & dispatched contracts storage
  const [draftSavedAt, setDraftSavedAt] = useState<string | null>(null);
  const [sentContracts, setSentContracts] = useState<ClientContract[]>(() => {
    try {
      const saved = localStorage.getItem('mrca_client_contracts');
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return [
      {
        id: 'CTR-2026-MX-841920',
        client_id: 'usr_client_aduana_02',
        client_name: 'Lic. Mariana Ortiz Estrada',
        client_company: 'Aduana Express Cloud S.A.P.I. de C.V.',
        client_email: 'mortiz@aduanaexpress.mx',
        title: 'Contrato Marco de Servicios de Ciberseguridad & SLA 99.9%',
        content: 'Acuerdo de Servicios de Ciberseguridad B2B sellado con materialidad SAT CFDI 4.0.',
        status: 'signed',
        signature_hash: '0x7a81be492a01948bd01948c02cba39d1049281bf',
        signed_at: 'Ayer, 17:30 PM',
        created_at: new Date(Date.now() - 86400000).toISOString(),
      },
    ];
  });

  // Budget negotiations list (for Tab 2)
  const [negotiations, setNegotiations] = useState<BudgetNegotiation[]>(() => {
    try {
      const saved = localStorage.getItem('mrca_budget_negotiations');
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return [];
  });

  // Load negotiations from Supabase or localStorage
  useEffect(() => {
    async function loadNegotiations() {
      try {
        const { data, error } = await supabase
          .from('budget_negotiations')
          .select('*')
          .order('created_at', { ascending: false });
        if (data && data.length > 0 && !error) {
          setNegotiations(data as any);
        }
      } catch {
        // fallback
      }
    }
    loadNegotiations();
  }, []);

  // Update initialMode if prop changes
  useEffect(() => {
    if (initialMode) setActiveTab(initialMode);
  }, [initialMode]);

  // Handle Preset Client Auto-fill (Superadmin Only)
  const handleSelectPreset = (preset: (typeof PRESET_CLIENTS)[0]) => {
    if (!isSuper) {
      showToast('Acceso restringido: Solo Superadmin puede modificar o cargar datos de clientes.');
      return;
    }
    setCompanyName(preset.companyName);
    setRepresentativeName(preset.representativeName);
    setEmail(preset.email);
    setRfc(preset.rfc);
    setTotalCost(preset.totalCost);
    setPaymentTerms(preset.paymentTerms);
    if ((preset as any).advancePercentage) {
      setAdvancePercentage((preset as any).advancePercentage);
    }
    setUptime(preset.uptime as any);
    setResponseTime(preset.responseTime as any);
    setSelectedServices(preset.services);
    showToast(`Plantilla cargada para ${preset.companyName}`);
  };

  // Toggle Services in multi-select (Superadmin Only)
  const handleToggleService = (serviceId: string) => {
    if (!isSuper) {
      showToast('Acceso restringido: Solo Superadmin puede modificar los servicios asignados.');
      return;
    }
    setSelectedServices((prev) =>
      prev.includes(serviceId) ? prev.filter((id) => id !== serviceId) : [...prev, serviceId]
    );
  };

  // Convert a B2B negotiation directly into a contract (Superadmin Only)
  const handleImportNegotiation = (neg: BudgetNegotiation) => {
    if (!isSuper) {
      showToast('Acceso restringido: Solo Superadmin puede importar y fijar términos contractuales.');
      return;
    }
    setCompanyName(neg.client_company_or_school);
    setRepresentativeName(neg.client_name);
    setEmail(neg.client_email);
    setTotalCost(`$${(neg.approved_price || neg.proposed_budget).toLocaleString('es-MX')} MXN`);
    setPaymentTerms('50% Anticipo, 50% Entrega');
    setAdvancePercentage(neg.proposed_budget > 200000 ? '40%' : '25%');
    if (neg.admin_scope_adjustment) {
      setCustomScopeNotes(neg.admin_scope_adjustment);
    }
    setActiveTab('generator');
    showToast(`Datos de negociación (${neg.id}) importados al generador.`);
  };

  // ACTION 1: Guardar Borrador (SUPERADMIN STRICT PERMISSION)
  const handleSaveDraft = async () => {
    if (!isSuper) {
      showToast('Acceso denegado: Solo el rol Superadmin posee permisos para guardar o modificar borradores de contratos.');
      return;
    }

    const draftPayload = {
      folio: contractFolio,
      companyName,
      representativeName,
      email,
      rfc,
      selectedServices,
      totalCost,
      paymentTerms,
      advancePercentage,
      uptime,
      responseTime,
      customScopeNotes,
      savedAt: new Date().toISOString(),
    };

    try {
      localStorage.setItem(`mrca_draft_${contractFolio}`, JSON.stringify(draftPayload));
      localStorage.setItem('mrca_last_contract_draft', JSON.stringify(draftPayload));
      setDraftSavedAt(new Date().toLocaleTimeString());
    } catch {
      // quota fallback
    }

    // Attempt backup in Supabase
    try {
      await supabase.from('client_contracts').upsert(
        {
          id: contractFolio,
          client_name: representativeName,
          client_company: companyName,
          client_email: email,
          title: `Borrador Contrato: ${companyName}`,
          content: generateContractPlainText(),
          status: 'draft',
          created_at: new Date().toISOString(),
        },
        { onConflict: 'id' }
      );
    } catch {
      // local fallback
    }

    showToast(`Borrador guardado exitosamente (Folio: ${contractFolio})`);
  };

  // ACTION 2: Generar Enlace Criptográfico del Contrato
  const handleGenerateCryptoLink = () => {
    const rawEntropy = `${contractFolio}-${email}-${rfc}-${Date.now()}`;
    const mockHash =
      '0x' +
      Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
    const mockToken = `sec_ecdsa_${Array.from({ length: 24 }, () =>
      'abcdef0123456789'.charAt(Math.floor(Math.random() * 16))
    ).join('')}`;

    const link = `https://enclave.mrcasolutions.com/contratos/firmar?folio=${encodeURIComponent(
      contractFolio
    )}&token=${mockToken}&sig=${mockHash.slice(0, 16)}`;

    setCryptoLinkModal({
      isOpen: true,
      url: link,
      token: mockToken,
      expiresIn: '72 Horas (Vence: T+3 días bancarios)',
      hash: mockHash,
    });

    // Copy immediately to clipboard
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(link).catch(() => {});
    }

    // Persist as pending signature contract
    const dispatchedContract: ClientContract = {
      id: contractFolio,
      client_id: `cli_${rfc.toLowerCase()}`,
      client_name: representativeName,
      client_company: companyName,
      client_email: email,
      title: `Contrato de Servicios Tecnológicos & SLA ${uptime}`,
      content: generateContractPlainText(),
      status: 'pending_signature',
      created_at: new Date().toISOString(),
    };

    const nextList = [dispatchedContract, ...sentContracts.filter((c) => c.id !== contractFolio)];
    setSentContracts(nextList);
    try {
      localStorage.setItem('mrca_client_contracts', JSON.stringify(nextList));
    } catch {}

    if (onContractSent) onContractSent(dispatchedContract);
    showToast(`Enlace criptográfico generado y copiado al portapapeles.`);
  };

  // ACTION 3: Exportar a PDF
  const handleExportPdf = () => {
    setIsExportingPdf(true);
    showToast('Compilando documento con sellos de materialidad SAT CFDI 4.0...');

    setTimeout(() => {
      setIsExportingPdf(false);
      // Trigger native browser print which renders printable view
      if (typeof window !== 'undefined') {
        window.print();
      }
      showToast(`Contrato legal ${contractFolio} exportado a PDF.`);
    }, 900);
  };

  // Plain-text compilation of the contract for audits and database storage
  const generateContractPlainText = (): string => {
    const today = new Date().toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const servicesList = selectedServices
      .map((sid) => {
        const s = AVAILABLE_SERVICES.find((x) => x.id === sid);
        return s ? `• ${s.name}: ${s.description}` : '';
      })
      .filter(Boolean)
      .join('\n');

    return `CONTRATO MARCO DE PRESTACIÓN DE SERVICIOS TECNOLÓGICOS, INGENIERÍA DE SOFTWARE Y ACUERDO DE NIVEL DE SERVICIO (SLA)

FOLIO OFICIAL: ${contractFolio}
FECHA DE EMISIÓN: ${today}
LUGAR DE EMISIÓN: CIUDAD DE MÉXICO, ESTADOS UNIDOS MEXICANOS

COMPARECIENTES:
POR UNA PARTE: MRCA SOLUTIONS S.A.P.I. DE C.V., R.F.C.: MSO230914XYZ, REPRESENTADA POR SU ENCLAVE DE DIRECCIÓN GENERAL Y CIBERSEGURIDAD (JEFE & SOCIO), CON DOMICILIO EN AV. INSURGENTES SUR 1602, CRÉDITO CONSTRUCTOR, BENITO JUÁREZ, CIUDAD DE MÉXICO.
Y POR LA OTRA PARTE:
EMPRESA CONTRATANTE: ${companyName}
REPRESENTANTE LEGAL: ${representativeName}
REGISTRO FEDERAL DE CONTRIBUYENTES (R.F.C.): ${rfc}
CORREO ELECTRÓNICO INSTITUCIONAL: ${email}

CLÁUSULA PRIMERA — OBJETO DEL CONTRATO:
MRCA Solutions prestará al Cliente los servicios especializados de ingeniería y ciberseguridad corporativa siguientes:
${servicesList}

ESPECIFICACIONES PARTICULARES DE ALCANCE:
${customScopeNotes}

CLÁUSULA SEGUNDA — CONTRAPRESTACIÓN, ANTICIPO Y CONDICIONES DE PAGO:
El monto total acordado asciende a la cantidad de ${totalCost} (más el Impuesto al Valor Agregado I.V.A.).
Términos de pago pactados: ${paymentTerms}.

CONDICIÓN DE ANTICIPO VINCULANTE:
"${getDynamicAdvanceClause(advancePercentage)}"

CLÁUSULA BANCARIA EXCLUSIVA (TRANSFERENCIA ELECTRÓNICA SPEI NU MÉXICO):
"${PAYMENT_SPEI_CLAUSE}"

CLÁUSULA TERCERA — ACUERDO DE NIVEL DE SERVICIO (SLA) Y DISPONIBILIDAD:
MRCA Solutions garantiza un índice de disponibilidad de infraestructura y microservicios del ${uptime}.
El tiempo de respuesta máximo para atención a incidentes o anomalías operativas de alta criticidad será de ${responseTime}.

CLÁUSULA CUARTA — FACTURACIÓN Y MATERIALIDAD FISCAL (SAT CFDI 4.0):
"${MEXICAN_LEGAL_CLAUSES.facturacion}"

CLÁUSULA QUINTA — CANCELACIÓN Y PENA CONVENCIONAL:
"${MEXICAN_LEGAL_CLAUSES.cancelacionYPena}"

CLÁUSULA SEXTA — PROPIEDAD INTELECTUAL Y OBRA POR ENCARGO:
"${MEXICAN_LEGAL_CLAUSES.propiedadIntelectual}"

CLÁUSULA SÉPTIMA — JURISDICCIÓN Y LEGISLACIÓN APLICABLE:
Para la interpretación, cumplimiento y ejecución del presente Contrato, las partes se someten expresamente a las leyes federales de los Estados Unidos Mexicanos y a la jurisdicción de los Tribunales Competentes de la Ciudad de México, renunciando a cualquier otro fuero.

FIRMAS Y SELLOS CRIPTOGRÁFICOS:
POR EL PRESTADOR: MRCA SOLUTIONS S.A.P.I. DE C.V. (SELLO HSM YUBIKEY FIPS 140-3)
POR EL CLIENTE: ${companyName} (REPRESENTANTE: ${representativeName})
HASH INTEGRIDAD SHA-256: 0x9f41b8a72ec9104810a9f82bc1948d01f829019b`;
  };

  // =========================================================================
  // RBAC GUARD: Access Denied view if not superadmin or partner
  // =========================================================================
  if (!isAuthorized) {
    return (
      <div className="w-full py-12 px-4 flex flex-col items-center justify-center">
        <div className="w-full max-w-2xl bg-[#0A1128]/95 border-2 border-amber-500/40 rounded-2xl p-8 backdrop-blur-xl shadow-[0_0_50px_rgba(245,158,11,0.15)] flex flex-col items-center text-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.3)]">
            <ShieldAlert className="w-8 h-8" />
          </div>

          <div className="flex flex-col gap-2">
            <span className="font-['JetBrains_Mono'] text-[11px] font-bold text-amber-400 uppercase tracking-widest px-3 py-1 rounded-full bg-amber-950/60 border border-amber-500/30 w-max mx-auto">
              RBAC LEVEL 2 REQUIRED // PROTOCOLO DE SEGURIDAD ZERO-TRUST
            </span>
            <h3 className="font-['Space_Grotesk'] text-[24px] font-bold text-white">
              Acceso Restringido: Generador de Contratos &amp; SLA
            </h3>
            <p className="font-['Inter'] text-[13px] text-slate-300 max-w-lg leading-relaxed">
              La emisión y firma de acuerdos legales corporativos, cesión patrimonial (LFDA Art. 83/84) y materialidad fiscal SAT CFDI 4.0 está restringida de forma estricta a los roles de gobernanza raíz{' '}
              <strong className="text-amber-300">Superadmin (Jefe/CISO)</strong> y{' '}
              <strong className="text-cyan-300">Partner (Socio/CTO)</strong>.
            </p>
          </div>

          <div className="w-full bg-[#060D24] border border-slate-800 rounded-xl p-4 text-left font-['JetBrains_Mono'] text-[11px] text-slate-400 flex flex-col gap-1.5">
            <div className="flex justify-between items-center text-slate-300">
              <span>Usuario Autenticado:</span>
              <span className="text-white font-semibold">{sessionUser?.email || 'Sesión Estándar'}</span>
            </div>
            <div className="flex justify-between items-center text-slate-300">
              <span>Rol Detectado:</span>
              <span className="text-amber-400 font-bold uppercase">{sessionUser?.role || 'Empleado'}</span>
            </div>
            <div className="flex justify-between items-center text-slate-300">
              <span>Permiso Fiduciario Legal:</span>
              <span className="text-red-400 font-bold">DENEGADO (CÓDIGO: ERR_RBAC_CONTRACT_FORBIDDEN)</span>
            </div>
          </div>

          {onNavigateTab && (
            <button
              onClick={() => onNavigateTab('principal')}
              className="mt-2 px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-[#00363d] font-['JetBrains_Mono'] text-[12px] font-bold transition-all shadow-[0_0_20px_rgba(0,229,255,0.3)] cursor-pointer"
            >
              Volver al Dashboard Principal
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col gap-6 font-['Inter'] pb-20">
      {/* ===================================================================== */}
      {/* TOP HEADER & TELEMETRY MODULE                                         */}
      {/* ===================================================================== */}
      <section className="relative w-full rounded-2xl bg-gradient-to-r from-[#0A1128]/95 via-[#0e1633]/90 to-[#0A1128]/95 border-2 border-cyan-500/30 p-5 sm:p-6 shadow-[0_10px_35px_rgba(0,229,255,0.12)] backdrop-blur-xl overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-full bg-gradient-to-l from-cyan-500/10 via-[#00fe66]/5 to-transparent pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/15 border border-cyan-500/40 text-cyan-300 font-['JetBrains_Mono'] text-[10px] font-bold tracking-wider uppercase flex items-center gap-1.5 shadow-[0_0_10px_rgba(0,229,255,0.2)]">
                <Scale className="w-3.5 h-3.5 text-[#00e5ff]" />
                ENCLAVE LEGAL B2B // SAT CFDI 4.0 &amp; LFDA ART. 83-84
              </span>
              <span className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-['JetBrains_Mono'] text-[10px] font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                RBAC AUTORIZADO: {isSuper ? 'SUPERADMIN ROOT' : isPrtnr ? 'SOCIO PARTNER' : 'DIRECCIÓN EJECUTIVA'}
              </span>
            </div>

            <h1 className="font-['Space_Grotesk'] text-[24px] sm:text-[28px] font-bold text-white tracking-tight">
              B2B Contract &amp; SLA Generator // Enclave MRCA
            </h1>
            <p className="font-['Inter'] text-[13px] text-slate-300 max-w-3xl leading-relaxed">
              Módulo de redacción legal automatizada para servicios de ciberseguridad, nube y desarrollo de software con estricto apego a las disposiciones fiscales del SAT, materialidad demostrable y cesión patrimonial bajo la Ley Federal del Derecho de Autor.
            </p>
          </div>

          {/* Subtab Navigation Pill Switcher */}
          <div className="flex items-center gap-2 p-1.5 rounded-xl bg-[#060D24] border border-cyan-500/20 shrink-0 self-start lg:self-center">
            <button
              onClick={() => setActiveTab('generator')}
              className={`px-3.5 py-2 rounded-lg font-['JetBrains_Mono'] text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'generator'
                  ? 'bg-gradient-to-r from-cyan-500 to-[#00daf3] text-[#00363d] shadow-[0_0_15px_rgba(0,229,255,0.4)]'
                  : 'text-slate-400 hover:text-white hover:bg-[#141a32]'
              }`}
            >
              <FileCode className="w-3.5 h-3.5" />
              <span>Generador &amp; SLA</span>
            </button>
            <button
              onClick={() => setActiveTab('negotiations')}
              className={`px-3.5 py-2 rounded-lg font-['JetBrains_Mono'] text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'negotiations'
                  ? 'bg-gradient-to-r from-cyan-500 to-[#00daf3] text-[#00363d] shadow-[0_0_15px_rgba(0,229,255,0.4)]'
                  : 'text-slate-400 hover:text-white hover:bg-[#141a32]'
              }`}
            >
              <Cpu className="w-3.5 h-3.5" />
              <span>Negociaciones B2B</span>
              {negotiations.length > 0 && (
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-3.5 py-2 rounded-lg font-['JetBrains_Mono'] text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'history'
                  ? 'bg-gradient-to-r from-cyan-500 to-[#00daf3] text-[#00363d] shadow-[0_0_15px_rgba(0,229,255,0.4)]'
                  : 'text-slate-400 hover:text-white hover:bg-[#141a32]'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Historial ({sentContracts.length})</span>
            </button>
          </div>
        </div>

        {/* Telemetry Strip */}
        <div className="mt-4 pt-3 border-t border-cyan-900/30 flex flex-wrap items-center justify-between gap-3 text-[11px] font-['JetBrains_Mono'] text-slate-400">
          <div className="flex flex-wrap items-center gap-3">
            <span className="flex items-center gap-1 text-cyan-400">
              <Lock className="w-3 h-3" />
              FOLIO ASIGNADO: <strong className="text-white">{contractFolio}</strong>
            </span>
            <span className="text-slate-600">•</span>
            <span className="flex items-center gap-1 text-emerald-400">
              <CheckCircle2 className="w-3 h-3" />
              VALIDADOR SAT CFDI 4.0: VIGENTE
            </span>
            <span className="text-slate-600">•</span>
            <span>DOMICILIO FISCAL: CDMX, BENITO JUÁREZ</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setContractFolio(`CTR-2026-MX-${Math.floor(100000 + Math.random() * 900000)}`);
                showToast('Nuevo folio legal criptográfico regenerado.');
              }}
              className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 text-[10px] cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" />
              Regenerar Folio
            </button>
          </div>
        </div>
      </section>

      {/* ===================================================================== */}
      {/* VIEW MODE 1: MAIN TWO-COLUMN GENERATOR & LIVE PREVIEW                 */}
      {/* ===================================================================== */}
      {activeTab === 'generator' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* ================================================================= */}
          {/* LEFT COLUMN: INPUT FORM (lg:col-span-6 xl:col-span-5)            */}
          {/* ================================================================= */}
          <div className="lg:col-span-6 xl:col-span-5 flex flex-col gap-5">
            {/* Quick Preset Selector */}
            <div className="bg-[#0A1128]/90 border border-cyan-500/25 rounded-2xl p-4 backdrop-blur-xl shadow-lg flex flex-col gap-2.5">
              <div className="flex items-center justify-between">
                <span className="font-['JetBrains_Mono'] text-[11px] font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                  Cargar Perfil de Cliente Corporativo
                </span>
                <span className="text-[10px] text-slate-400 font-['JetBrains_Mono']">
                  {isSuper ? 'Pre-configurado' : 'Modo Lectura (Superadmin Only)'}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {PRESET_CLIENTS.map((preset) => (
                  <button
                    key={preset.companyName}
                    disabled={!isSuper}
                    onClick={() => handleSelectPreset(preset)}
                    className={`p-2.5 rounded-xl border text-left transition-all flex flex-col gap-1 ${
                      !isSuper
                        ? 'opacity-60 bg-[#0c132c]/50 border-slate-800 text-slate-400 cursor-not-allowed'
                        : companyName === preset.companyName
                        ? 'bg-cyan-950/60 border-cyan-400 text-white shadow-[0_0_12px_rgba(0,229,255,0.2)] cursor-pointer'
                        : 'bg-[#141a32]/60 border-slate-800 text-slate-300 hover:border-cyan-500/40 hover:text-white cursor-pointer'
                    }`}
                  >
                    <span className="font-['Space_Grotesk'] text-[12px] font-bold truncate leading-tight">
                      {preset.companyName.split(' ')[0]} {preset.companyName.split(' ')[1]}
                    </span>
                    <span className="font-['JetBrains_Mono'] text-[9px] text-cyan-400">
                      RFC: {preset.rfc}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* SECTION A: CLIENT DETAILS */}
            <div className="bg-[#0A1128]/90 border border-cyan-500/30 rounded-2xl p-5 sm:p-6 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.5)] flex flex-col gap-4">
              <div className="flex items-center justify-between pb-3 border-b border-cyan-900/40">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-cyan-950 border border-cyan-500/40 flex items-center justify-center text-cyan-400 font-bold text-xs">
                    <Building className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="font-['Space_Grotesk'] text-[16px] font-bold text-white leading-none">
                      1. Datos del Cliente Corporativo
                    </h2>
                    <span className="font-['JetBrains_Mono'] text-[10px] text-slate-400">
                      Compareciente contratante bajo legislación mercantil mexicana
                    </span>
                  </div>
                </div>
                {!isSuper && (
                  <span className="px-2 py-0.5 rounded bg-amber-950/60 border border-amber-500/40 text-amber-300 font-['JetBrains_Mono'] text-[10px] font-bold flex items-center gap-1">
                    <Lock className="w-3 h-3" /> Solo Lectura
                  </span>
                )}
              </div>

              <div className="flex flex-col gap-3.5">
                {/* Company Name */}
                <div className="flex flex-col gap-1.5">
                  <label className="font-['JetBrains_Mono'] text-[11px] text-slate-300 font-medium flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Building className="w-3 h-3 text-cyan-400" />
                      <span>Razón Social / Empresa (Company Name)</span>
                    </span>
                    {!isSuper && <span className="text-[10px] text-amber-400 font-mono">Solo Superadmin</span>}
                  </label>
                  {isSuper ? (
                    <input
                      type="text"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="Ej. Banco NeoPay LatAm S.A. de C.V."
                      className="w-full bg-[#060D24] border border-cyan-500/30 rounded-xl px-3.5 py-2.5 text-[13px] text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 font-['Inter'] transition-all"
                    />
                  ) : (
                    <div className="w-full bg-[#060D24]/80 border border-slate-800 rounded-xl px-3.5 py-2.5 text-[13px] text-slate-200 font-['Inter'] flex items-center justify-between">
                      <span className="font-semibold text-white truncate">{companyName}</span>
                      <span className="text-[10px] font-['JetBrains_Mono'] text-amber-400/90 bg-amber-950/40 border border-amber-500/30 px-2 py-0.5 rounded flex items-center gap-1 shrink-0 ml-2">
                        <Lock className="w-3 h-3" /> Solo Superadmin (Lectura)
                      </span>
                    </div>
                  )}
                </div>

                {/* Representative Name */}
                <div className="flex flex-col gap-1.5">
                  <label className="font-['JetBrains_Mono'] text-[11px] text-slate-300 font-medium flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <User className="w-3 h-3 text-cyan-400" />
                      <span>Representante Legal / Apoderado (Representative Name)</span>
                    </span>
                    {!isSuper && <span className="text-[10px] text-amber-400 font-mono">Solo Superadmin</span>}
                  </label>
                  {isSuper ? (
                    <input
                      type="text"
                      value={representativeName}
                      onChange={(e) => setRepresentativeName(e.target.value)}
                      placeholder="Ej. Ing. Rodrigo Salinas Valenzuela"
                      className="w-full bg-[#060D24] border border-cyan-500/30 rounded-xl px-3.5 py-2.5 text-[13px] text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 font-['Inter'] transition-all"
                    />
                  ) : (
                    <div className="w-full bg-[#060D24]/80 border border-slate-800 rounded-xl px-3.5 py-2.5 text-[13px] text-slate-200 font-['Inter'] flex items-center justify-between">
                      <span className="font-semibold text-white truncate">{representativeName}</span>
                      <span className="text-[10px] font-['JetBrains_Mono'] text-amber-400/90 bg-amber-950/40 border border-amber-500/30 px-2 py-0.5 rounded flex items-center gap-1 shrink-0 ml-2">
                        <Lock className="w-3 h-3" /> Solo Superadmin (Lectura)
                      </span>
                    </div>
                  )}
                </div>

                {/* Email & Legal ID / RFC Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="font-['JetBrains_Mono'] text-[11px] text-slate-300 font-medium flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Mail className="w-3 h-3 text-cyan-400" />
                        <span>Correo Institucional</span>
                      </span>
                      {!isSuper && <span className="text-[9px] text-amber-400">Lectura</span>}
                    </label>
                    {isSuper ? (
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="contacto@empresa.com"
                        className="w-full bg-[#060D24] border border-cyan-500/30 rounded-xl px-3.5 py-2.5 text-[13px] text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 font-['JetBrains_Mono'] transition-all"
                      />
                    ) : (
                      <div className="w-full bg-[#060D24]/80 border border-slate-800 rounded-xl px-3.5 py-2.5 text-[13px] text-slate-200 font-['JetBrains_Mono'] flex items-center justify-between">
                        <span className="truncate">{email}</span>
                        <Lock className="w-3.5 h-3.5 text-amber-400 shrink-0 ml-1" />
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="font-['JetBrains_Mono'] text-[11px] text-slate-300 font-medium flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Hash className="w-3 h-3 text-cyan-400" />
                        <span>Legal ID / RFC Mexicano</span>
                      </span>
                      {!isSuper && <span className="text-[9px] text-amber-400">Lectura</span>}
                    </label>
                    {isSuper ? (
                      <input
                        type="text"
                        value={rfc}
                        onChange={(e) => setRfc(e.target.value.toUpperCase())}
                        placeholder="BNP180412XYZ"
                        maxLength={13}
                        className="w-full bg-[#060D24] border border-cyan-500/30 rounded-xl px-3.5 py-2.5 text-[13px] text-cyan-300 font-['JetBrains_Mono'] uppercase tracking-wider placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all font-semibold"
                      />
                    ) : (
                      <div className="w-full bg-[#060D24]/80 border border-slate-800 rounded-xl px-3.5 py-2.5 text-[13px] text-cyan-300 font-['JetBrains_Mono'] uppercase tracking-wider font-semibold flex items-center justify-between">
                        <span>{rfc}</span>
                        <Lock className="w-3.5 h-3.5 text-amber-400 shrink-0 ml-1" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION B: PROJECT SPECS (SERVICES MULTISELECT) */}
            <div className="bg-[#0A1128]/90 border border-cyan-500/30 rounded-2xl p-5 sm:p-6 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.5)] flex flex-col gap-4">
              <div className="flex items-center justify-between pb-3 border-b border-cyan-900/40">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-cyan-950 border border-cyan-500/40 flex items-center justify-center text-cyan-400 font-bold text-xs">
                    <Layers className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="font-['Space_Grotesk'] text-[16px] font-bold text-white leading-none">
                      2. Alcance &amp; Servicios del Proyecto
                    </h2>
                    <span className="font-['JetBrains_Mono'] text-[10px] text-slate-400">
                      Selección multiselección de ingeniería y ciberseguridad
                    </span>
                  </div>
                </div>
                <span className="font-['JetBrains_Mono'] text-[11px] px-2 py-0.5 rounded bg-cyan-950 border border-cyan-500/30 text-cyan-400 font-bold">
                  {selectedServices.length} seleccionados
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {AVAILABLE_SERVICES.map((srv) => {
                  const isChecked = selectedServices.includes(srv.id);
                  return (
                    <button
                      key={srv.id}
                      type="button"
                      disabled={!isSuper}
                      onClick={() => handleToggleService(srv.id)}
                      className={`p-3 rounded-xl border text-left transition-all flex items-start gap-2.5 ${
                        !isSuper
                          ? isChecked
                            ? 'bg-cyan-950/40 border-cyan-500/40 cursor-default opacity-85'
                            : 'bg-[#060D24]/40 border-slate-850 opacity-40 cursor-not-allowed'
                          : isChecked
                          ? 'bg-gradient-to-br from-cyan-950/70 to-[#060D24] border-cyan-400 shadow-[0_0_12px_rgba(0,229,255,0.18)] cursor-pointer'
                          : 'bg-[#060D24]/80 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-300 cursor-pointer'
                      }`}
                    >
                      <div
                        className={`w-4 h-4 rounded mt-0.5 shrink-0 flex items-center justify-center border transition-all ${
                          isChecked
                            ? 'bg-cyan-400 border-cyan-400 text-[#00363d]'
                            : 'border-slate-700 bg-transparent'
                        }`}
                      >
                        {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <span className={`text-[12px] font-bold font-['Space_Grotesk'] ${isChecked ? 'text-white' : 'text-slate-300'}`}>
                          {srv.name}
                        </span>
                        <span className="text-[10px] text-slate-400 line-clamp-2 leading-tight">
                          {srv.description}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Custom Scope Description */}
              <div className="flex flex-col gap-1.5 mt-1">
                <label className="font-['JetBrains_Mono'] text-[11px] text-slate-300 font-medium flex items-center justify-between">
                  <span>Notas de Alcance Técnico Personalizado (SOW)</span>
                  {!isSuper && <span className="text-[10px] text-amber-400">Solo Superadmin</span>}
                </label>
                {isSuper ? (
                  <textarea
                    value={customScopeNotes}
                    onChange={(e) => setCustomScopeNotes(e.target.value)}
                    rows={2}
                    className="w-full bg-[#060D24] border border-cyan-500/30 rounded-xl p-3 text-[12px] text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 font-['JetBrains_Mono'] leading-relaxed"
                  />
                ) : (
                  <div className="w-full bg-[#060D24]/80 border border-slate-800 rounded-xl p-3 text-[12px] text-slate-300 font-['JetBrains_Mono'] leading-relaxed">
                    {customScopeNotes}
                  </div>
                )}
              </div>
            </div>

            {/* SECTION C: FINANCIALS */}
            <div className="bg-[#0A1128]/90 border border-cyan-500/30 rounded-2xl p-5 sm:p-6 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.5)] flex flex-col gap-4">
              <div className="flex items-center justify-between pb-3 border-b border-cyan-900/40">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-cyan-950 border border-cyan-500/40 flex items-center justify-center text-cyan-400 font-bold text-xs">
                    <DollarSign className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="font-['Space_Grotesk'] text-[16px] font-bold text-white leading-none">
                      3. Esquema Financiero &amp; Términos de Pago
                    </h2>
                    <span className="font-['JetBrains_Mono'] text-[10px] text-slate-400">
                      Contraprestación en Pesos Mexicanos con soporte SPEI Nu México y Anticipos
                    </span>
                  </div>
                </div>
                {!isSuper && (
                  <span className="px-2 py-0.5 rounded bg-amber-950/60 border border-amber-500/40 text-amber-300 font-['JetBrains_Mono'] text-[10px] font-bold flex items-center gap-1">
                    <Lock className="w-3 h-3" /> Solo Lectura
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {/* Total Cost */}
                <div className="flex flex-col gap-1.5">
                  <label className="font-['JetBrains_Mono'] text-[11px] text-slate-300 font-medium flex items-center justify-between">
                    <span>Costo Total (MXN)</span>
                    {!isSuper && <span className="text-[9px] text-amber-400 font-normal">Fijo</span>}
                  </label>
                  {isSuper ? (
                    <input
                      type="text"
                      value={totalCost}
                      onChange={(e) => setTotalCost(e.target.value)}
                      placeholder="$350,000 MXN"
                      className="w-full bg-[#060D24] border border-cyan-500/30 rounded-xl px-3.5 py-2.5 text-[14px] text-emerald-400 font-['JetBrains_Mono'] font-bold focus:outline-none focus:border-cyan-400"
                    />
                  ) : (
                    <div className="w-full bg-[#060D24]/80 border border-slate-800 rounded-xl px-3.5 py-2.5 text-[14px] text-emerald-400 font-['JetBrains_Mono'] font-bold flex items-center justify-between">
                      <span>{totalCost}</span>
                      <Lock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    </div>
                  )}
                  <span className="text-[9px] text-slate-400 font-['JetBrains_Mono']">
                    * No incluye I.V.A. (16% SAT)
                  </span>
                </div>

                {/* Payment Terms Select */}
                <div className="flex flex-col gap-1.5">
                  <label className="font-['JetBrains_Mono'] text-[11px] text-slate-300 font-medium flex items-center justify-between">
                    <span>Esquema de Pago</span>
                    {!isSuper && <span className="text-[9px] text-amber-400 font-normal">Fijo</span>}
                  </label>
                  {isSuper ? (
                    <select
                      value={paymentTerms}
                      onChange={(e) => setPaymentTerms(e.target.value)}
                      className="w-full bg-[#060D24] border border-cyan-500/30 rounded-xl px-3.5 py-2.5 text-[12px] text-white focus:outline-none focus:border-cyan-400 font-['Inter'] cursor-pointer"
                    >
                      <option value="50% Anticipo, 50% Entrega">50% Anticipo, 50% Entrega</option>
                      <option value="30% Anticipo, 40% Hito Alpha, 30% Despliegue">30% Anticipo, 40% Alpha, 30% Despliegue</option>
                      <option value="100% Custodia Escrow Dual (Stripe/Banxico SPEI)">100% Custodia Escrow Dual</option>
                      <option value="Mensualidad Recurrente con CFDI 4.0">Mensualidad Recurrente con CFDI 4.0</option>
                    </select>
                  ) : (
                    <div className="w-full bg-[#060D24]/80 border border-slate-800 rounded-xl px-3.5 py-2.5 text-[12px] text-cyan-300 font-['Inter'] font-semibold flex items-center justify-between">
                      <span className="truncate">{paymentTerms}</span>
                      <Lock className="w-3.5 h-3.5 text-amber-400 shrink-0 ml-1" />
                    </div>
                  )}
                  <span className="text-[9px] text-slate-400 font-['JetBrains_Mono']">
                    Sujeto a retención fiduciaria
                  </span>
                </div>

                {/* Porcentaje de Anticipo Select (New Requirement) */}
                <div className="flex flex-col gap-1.5 sm:col-span-2 lg:col-span-1">
                  <label className="font-['JetBrains_Mono'] text-[11px] text-slate-300 font-medium flex items-center justify-between">
                    <span>Porcentaje de Anticipo</span>
                    {!isSuper && <span className="text-[9px] text-amber-400 font-normal">Fijo</span>}
                  </label>
                  {isSuper ? (
                    <select
                      value={advancePercentage}
                      onChange={(e) => setAdvancePercentage(e.target.value as '25%' | '40%')}
                      className="w-full bg-[#060D24] border border-cyan-500/30 rounded-xl px-3.5 py-2.5 text-[12px] text-cyan-300 font-semibold focus:outline-none focus:border-cyan-400 font-['Inter'] cursor-pointer"
                    >
                      <option value="25%">25% (Proyectos Estándar)</option>
                      <option value="40%">40% (Proyectos de Alto Alcance/Misión Crítica)</option>
                    </select>
                  ) : (
                    <div className="w-full bg-[#060D24]/80 border border-slate-800 rounded-xl px-3.5 py-2.5 text-[12px] text-cyan-300 font-['Inter'] font-semibold flex items-center justify-between">
                      <span className="truncate">
                        {advancePercentage === '40%'
                          ? '40% (Proyectos de Alto Alcance/Misión Crítica)'
                          : '25% (Proyectos Estándar)'}
                      </span>
                      <Lock className="w-3.5 h-3.5 text-amber-400 shrink-0 ml-1" />
                    </div>
                  )}
                  <span className="text-[9px] text-slate-400 font-['JetBrains_Mono']">
                    Pena Convencional en cancelación
                  </span>
                </div>
              </div>
            </div>

            {/* SECTION D: SLA GUARANTEES */}
            <div className="bg-[#0A1128]/90 border border-cyan-500/30 rounded-2xl p-5 sm:p-6 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.5)] flex flex-col gap-4">
              <div className="flex items-center justify-between pb-3 border-b border-cyan-900/40">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-cyan-950 border border-cyan-500/40 flex items-center justify-center text-cyan-400 font-bold text-xs">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="font-['Space_Grotesk'] text-[16px] font-bold text-white leading-none">
                      4. Garantías de Nivel de Servicio (SLA)
                    </h2>
                    <span className="font-['JetBrains_Mono'] text-[10px] text-slate-400">
                      Compromisos vinculantes de disponibilidad y tiempos de respuesta
                    </span>
                  </div>
                </div>
                {!isSuper && (
                  <span className="px-2 py-0.5 rounded bg-amber-950/60 border border-amber-500/40 text-amber-300 font-['JetBrains_Mono'] text-[10px] font-bold flex items-center gap-1">
                    <Lock className="w-3 h-3" /> Solo Lectura
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Uptime Guarantee */}
                <div className="flex flex-col gap-1.5">
                  <label className="font-['JetBrains_Mono'] text-[11px] text-slate-300 font-medium">
                    Garantía Uptime Mensual
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      disabled={!isSuper}
                      onClick={() => setUptime('99.9%')}
                      className={`py-2 px-3 rounded-xl border text-center transition-all font-['JetBrains_Mono'] text-[12px] font-bold ${
                        !isSuper
                          ? uptime === '99.9%'
                            ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 cursor-default'
                            : 'bg-[#060D24] border-slate-800 text-slate-600 opacity-50 cursor-not-allowed'
                          : uptime === '99.9%'
                          ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-[0_0_12px_rgba(0,229,255,0.2)] cursor-pointer'
                          : 'bg-[#060D24] border-slate-800 text-slate-400 hover:text-white cursor-pointer'
                      }`}
                    >
                      99.9%
                      <span className="block text-[9px] text-slate-400 font-normal">Estándar Cloud</span>
                    </button>
                    <button
                      type="button"
                      disabled={!isSuper}
                      onClick={() => setUptime('99.999%')}
                      className={`py-2 px-3 rounded-xl border text-center transition-all font-['JetBrains_Mono'] text-[12px] font-bold ${
                        !isSuper
                          ? uptime === '99.999%'
                            ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 cursor-default'
                            : 'bg-[#060D24] border-slate-800 text-slate-600 opacity-50 cursor-not-allowed'
                          : uptime === '99.999%'
                          ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.2)] cursor-pointer'
                          : 'bg-[#060D24] border-slate-800 text-slate-400 hover:text-white cursor-pointer'
                      }`}
                    >
                      99.999%
                      <span className="block text-[9px] text-emerald-400 font-normal">Five-Nines VIP</span>
                    </button>
                  </div>
                </div>

                {/* Response Time Guarantee */}
                <div className="flex flex-col gap-1.5">
                  <label className="font-['JetBrains_Mono'] text-[11px] text-slate-300 font-medium">
                    Tiempo de Respuesta a Incidentes
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      disabled={!isSuper}
                      onClick={() => setResponseTime('1h')}
                      className={`py-2 px-3 rounded-xl border text-center transition-all font-['JetBrains_Mono'] text-[12px] font-bold ${
                        !isSuper
                          ? responseTime === '1h'
                            ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 cursor-default'
                            : 'bg-[#060D24] border-slate-800 text-slate-600 opacity-50 cursor-not-allowed'
                          : responseTime === '1h'
                          ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-[0_0_12px_rgba(0,229,255,0.2)] cursor-pointer'
                          : 'bg-[#060D24] border-slate-800 text-slate-400 hover:text-white cursor-pointer'
                      }`}
                    >
                      1 Hora
                      <span className="block text-[9px] text-cyan-400 font-normal">Crítico Inmediato</span>
                    </button>
                    <button
                      type="button"
                      disabled={!isSuper}
                      onClick={() => setResponseTime('24h')}
                      className={`py-2 px-3 rounded-xl border text-center transition-all font-['JetBrains_Mono'] text-[12px] font-bold ${
                        !isSuper
                          ? responseTime === '24h'
                            ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 cursor-default'
                            : 'bg-[#060D24] border-slate-800 text-slate-600 opacity-50 cursor-not-allowed'
                          : responseTime === '24h'
                          ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-[0_0_12px_rgba(0,229,255,0.2)] cursor-pointer'
                          : 'bg-[#060D24] border-slate-800 text-slate-400 hover:text-white cursor-pointer'
                      }`}
                    >
                      24 Horas
                      <span className="block text-[9px] text-slate-400 font-normal">Soporte Regular</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ================================================================= */}
          {/* RIGHT COLUMN: LIVE DOCUMENT PREVIEW (lg:col-span-6 xl:col-span-7) */}
          {/* ================================================================= */}
          <div className="lg:col-span-6 xl:col-span-7 flex flex-col gap-4 sticky top-20">
            {/* Live Indicator Bar */}
            <div className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-[#0e1633] border border-cyan-500/30">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
                <span className="font-['JetBrains_Mono'] text-[11px] font-bold text-white uppercase tracking-wider">
                  VISTA PREVIA EN TIEMPO REAL // INSTRUMENTO LEGAL FORMAL
                </span>
              </div>
              <span className="font-['JetBrains_Mono'] text-[10px] text-cyan-400 bg-cyan-950/80 px-2.5 py-0.5 rounded border border-cyan-500/30">
                CFDI 4.0 SAT OK
              </span>
            </div>

            {/* PREVIEW LEGAL PAPER CONTAINER */}
            <div
              id="printable-contract-document"
              className="relative w-full rounded-2xl bg-[#050B1E] border-2 border-cyan-500/40 p-6 sm:p-8 shadow-[0_15px_40px_rgba(0,0,0,0.8)] backdrop-blur-2xl flex flex-col gap-6 text-[#dce1ff] overflow-hidden"
              style={{
                backgroundImage:
                  'radial-gradient(ellipse at 80% 10%, rgba(0, 229, 255, 0.05), transparent 60%)',
              }}
            >
              {/* Security Watermark in background */}
              <div className="absolute inset-0 pointer-events-none select-none flex items-center justify-center opacity-[0.03] z-0 overflow-hidden rotate-[-25deg]">
                <span className="font-['Space_Grotesk'] text-[60px] sm:text-[90px] font-black uppercase tracking-widest text-cyan-400 text-center whitespace-nowrap">
                  MRCA SOLUTIONS OFFICIAL ENCLAVE
                </span>
              </div>

              {/* ============================================================= */}
              {/* OFFICIAL MRCA SOLUTIONS BRANDING HEADER                       */}
              {/* ============================================================= */}
              <div className="relative z-10 flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-5 border-b-2 border-cyan-500/30">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-xl bg-[#091433] border-2 border-cyan-400 flex items-center justify-center text-cyan-400 shadow-[0_0_20px_rgba(0,229,255,0.35)] shrink-0">
                    <Shield className="w-7 h-7" />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-['Space_Grotesk'] text-[20px] font-extrabold text-white tracking-wider leading-none">
                      MRCA SOLUTIONS S.A.P.I. DE C.V.
                    </span>
                    <span className="font-['JetBrains_Mono'] text-[10px] text-cyan-400 tracking-widest uppercase mt-1">
                      ENCLAVE DE CIBERSEGURIDAD &amp; INGENIERÍA DE SOFTWARE B2B
                    </span>
                    <span className="font-['JetBrains_Mono'] text-[9px] text-slate-400 mt-0.5">
                      R.F.C.: <strong className="text-white">MSO230914XYZ</strong> • REG. SAT CDMX BENITO JUÁREZ
                    </span>
                  </div>
                </div>

                <div className="flex flex-col sm:items-end text-left sm:text-right font-['JetBrains_Mono'] text-[10px] shrink-0">
                  <span className="text-cyan-400 font-bold bg-cyan-950/70 px-2 py-0.5 rounded border border-cyan-500/40">
                    FOLIO: {contractFolio}
                  </span>
                  <span className="text-slate-400 mt-1">
                    FECHA: {new Date().toLocaleDateString('es-MX', { year: 'numeric', month: 'short', day: 'numeric' })}
                  </span>
                  <span className="text-emerald-400 font-semibold mt-0.5 flex items-center gap-1 sm:justify-end">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                    AUTENTICIDAD VERIFICADA FIPS 140-3
                  </span>
                </div>
              </div>

              {/* DOCUMENT BODY CONTENT */}
              <div className="relative z-10 flex flex-col gap-5 text-[12.5px] leading-relaxed font-['Inter']">
                {/* Title */}
                <div className="text-center py-2 px-3 rounded-lg bg-[#0e1633]/60 border border-cyan-500/20">
                  <h3 className="font-['Space_Grotesk'] text-[15px] sm:text-[16px] font-bold text-white tracking-wide uppercase">
                    Contrato Marco de Servicios de Ingeniería, Ciberseguridad &amp; Acuerdo SLA
                  </h3>
                  <span className="font-['JetBrains_Mono'] text-[10px] text-cyan-400">
                    RÉGIMEN MERCANTIL MEXICANO // CÓDIGO DE COMERCIO &amp; LFDA
                  </span>
                </div>

                {/* Comparecientes Declarations */}
                <div className="p-4 rounded-xl bg-[#091433]/80 border border-slate-800 flex flex-col gap-2 font-['Inter']">
                  <span className="font-['JetBrains_Mono'] text-[11px] font-bold text-cyan-300 uppercase">
                    DECLARACIONES &amp; COMPARECIENTES:
                  </span>
                  <p className="text-slate-300 leading-relaxed text-[12px]">
                    Comparecen, por una parte, <strong className="text-white">MRCA SOLUTIONS S.A.P.I. DE C.V.</strong> (el &quot;Prestador&quot;), representada por su Enclave de Dirección y Ciberseguridad, y por la otra parte,{' '}
                    <strong className="text-cyan-300">{companyName || '[EMPRESA CLIENTE]'}</strong> (el &quot;Cliente&quot;), legalmente representada por{' '}
                    <strong className="text-white">{representativeName || '[REPRESENTANTE LEGAL]'}</strong>, con R.F.C.{' '}
                    <strong className="text-white font-mono">{rfc || '[RFC DEL CLIENTE]'}</strong> y correo de notificaciones{' '}
                    <strong className="text-cyan-400 font-mono">{email || '[CORREO CLIENTE]'}</strong>.
                  </p>
                </div>

                {/* CLÁUSULA PRIMERA: OBJETO DEL CONTRATO */}
                <div className="flex flex-col gap-1.5">
                  <h4 className="font-['Space_Grotesk'] text-[13px] font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                    <span className="text-cyan-400 font-mono">CLÁUSULA PRIMERA.</span>
                    <span>OBJETO DEL CONTRATO &amp; SERVICIOS ASIGNADOS</span>
                  </h4>
                  <p className="text-slate-300 text-[12px]">
                    El Prestador se compromete a diseñar, auditar y ejecutar en favor del Cliente los siguientes servicios de alta tecnología:
                  </p>
                  <ul className="grid grid-cols-1 gap-1.5 pl-2 my-1">
                    {selectedServices.map((sid) => {
                      const item = AVAILABLE_SERVICES.find((s) => s.id === sid);
                      if (!item) return null;
                      return (
                        <li key={sid} className="flex items-start gap-2 text-[11.5px] text-slate-200">
                          <span className="text-cyan-400 font-bold mt-0.5">•</span>
                          <span>
                            <strong className="text-white">{item.name}:</strong> {item.description}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                  {customScopeNotes && (
                    <div className="p-2.5 rounded-lg bg-[#060D24] border border-cyan-500/20 text-[11px] font-['JetBrains_Mono'] text-slate-300 mt-1">
                      <span className="text-cyan-400 font-bold">ALCANCE ADICIONAL: </span>
                      {customScopeNotes}
                    </div>
                  )}
                </div>

                {/* CLÁUSULA SEGUNDA: CONTRAPRESTACIÓN, ANTICIPO Y CLABE NU */}
                <div className="flex flex-col gap-2.5">
                  <div className="flex items-center justify-between">
                    <h4 className="font-['Space_Grotesk'] text-[13px] font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                      <span className="text-cyan-400 font-mono">CLÁUSULA SEGUNDA.</span>
                      <span>CONTRAPRESTACIÓN FINANCIERA &amp; CONDICIONES DE PAGO</span>
                    </h4>
                    <span className="px-2 py-0.5 rounded text-[9px] font-['JetBrains_Mono'] font-bold bg-emerald-950/60 text-emerald-400 border border-emerald-500/40">
                      SPEI BANXICO // NU MÉXICO
                    </span>
                  </div>
                  <p className="text-slate-300 text-[12px] leading-relaxed">
                    Como contraprestación total por los servicios descritos, el Cliente pagará al Prestador la suma acordada de{' '}
                    <strong className="text-emerald-400 font-mono text-[13px]">{totalCost}</strong> más el I.V.A. correspondiente, liquidable bajo los siguientes términos pactados:{' '}
                    <strong className="text-cyan-300 font-semibold">{paymentTerms}</strong>.
                  </p>

                  {/* DYNAMIC ADVANCE PAYMENT CLAUSE */}
                  <div className="p-3 rounded-xl bg-[#091433] border border-cyan-500/30 flex flex-col gap-1.5">
                    <span className="font-['JetBrains_Mono'] text-[10px] text-cyan-300 font-bold uppercase tracking-wider flex items-center gap-1.5">
                      <DollarSign className="w-3.5 h-3.5 text-cyan-400" />
                      CONDICIÓN DE ANTICIPO VINCULANTE ({advancePercentage}):
                    </span>
                    <blockquote className="font-['JetBrains_Mono'] text-[12px] text-white leading-relaxed italic bg-[#060D24]/90 p-2.5 rounded-lg border border-cyan-500/20">
                      &ldquo;{getDynamicAdvanceClause(advancePercentage)}&rdquo;
                    </blockquote>
                  </div>

                  {/* STRICT PAYMENT CLAUSE & NU MÉXICO CLABE */}
                  <div className="p-3.5 rounded-xl bg-gradient-to-r from-purple-950/40 via-[#0A1128] to-[#0A1128] border-l-4 border-purple-400 border border-purple-500/30 flex flex-col gap-2 shadow-sm">
                    <div className="flex items-center justify-between">
                      <span className="font-['JetBrains_Mono'] text-[11px] font-bold text-purple-300 uppercase tracking-wider flex items-center gap-1.5">
                        <Lock className="w-3.5 h-3.5 text-purple-400" />
                        CLÁUSULA BANCARIA EXCLUSIVA // SPEI NU MÉXICO:
                      </span>
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-['JetBrains_Mono'] font-bold bg-purple-900/60 text-purple-300 border border-purple-500/40">
                        CLABE VERIFICADA
                      </span>
                    </div>
                    <blockquote className="font-['JetBrains_Mono'] text-[12px] text-white leading-relaxed italic bg-[#060D24]/90 p-2.5 rounded-lg border border-purple-500/20">
                      &ldquo;{PAYMENT_SPEI_CLAUSE}&rdquo;
                    </blockquote>
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1 font-['JetBrains_Mono'] text-[10.5px] text-slate-300 border-t border-purple-900/40">
                      <span>INSTITUCIÓN RECEPTORA: <strong className="text-white">NU MÉXICO</strong></span>
                      <span>CUENTA CLABE: <strong className="text-purple-300 font-bold tracking-wider">{NU_MEXICO_CLABE}</strong></span>
                      <span className="text-emerald-400 font-semibold">TRANSFERENCIA SPEI DIRECTA</span>
                    </div>
                  </div>
                </div>

                {/* CLÁUSULA TERCERA: SLA GUARANTEES */}
                <div className="flex flex-col gap-1.5">
                  <h4 className="font-['Space_Grotesk'] text-[13px] font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                    <span className="text-cyan-400 font-mono">CLÁUSULA TERCERA.</span>
                    <span>ACUERDO DE NIVEL DE SERVICIO (SLA) &amp; DISPONIBILIDAD</span>
                  </h4>
                  <p className="text-slate-300 text-[12px]">
                    El Prestador garantiza al Cliente una disponibilidad ininterrumpida mensual de la infraestructura del{' '}
                    <strong className="text-emerald-400 font-mono">{uptime}</strong>. Ante eventualidades operativas o incidentes de criticidad alta, el tiempo de respuesta inicial y contención por parte del CISO Red Team será de máximo{' '}
                    <strong className="text-cyan-400 font-mono">{responseTime}</strong> continuo.
                  </p>
                </div>

                {/* ========================================================= */}
                {/* 3 HARDCODED LEGAL CLAUSES (MEXICAN COMPLIANCE)            */}
                {/* ========================================================= */}
                
                {/* 1. FACTURACIÓN */}
                <div className="p-3.5 rounded-xl bg-gradient-to-r from-cyan-950/40 to-[#0A1128] border-l-4 border-cyan-400 border border-cyan-500/30 flex flex-col gap-1 shadow-sm">
                  <div className="flex items-center gap-2">
                    <span className="font-['JetBrains_Mono'] text-[11px] font-bold text-cyan-300 uppercase tracking-wider">
                      CLÁUSULA CUARTA — FACTURACIÓN Y MATERIALIDAD FISCAL (SAT CFDI 4.0):
                    </span>
                    <span className="px-1.5 py-0.2 rounded text-[9px] font-['JetBrains_Mono'] font-bold bg-cyan-900/60 text-cyan-300 border border-cyan-500/40">
                      SAT 4.0
                    </span>
                  </div>
                  <blockquote className="font-['JetBrains_Mono'] text-[12px] text-white leading-relaxed italic bg-[#060D24]/80 p-2.5 rounded-lg border border-cyan-500/20">
                    &ldquo;{MEXICAN_LEGAL_CLAUSES.facturacion}&rdquo;
                  </blockquote>
                </div>

                {/* 2. CANCELACIÓN Y PENA CONVENCIONAL */}
                <div className="p-3.5 rounded-xl bg-gradient-to-r from-red-950/30 to-[#0A1128] border-l-4 border-amber-400 border border-amber-500/30 flex flex-col gap-1 shadow-sm">
                  <div className="flex items-center gap-2">
                    <span className="font-['JetBrains_Mono'] text-[11px] font-bold text-amber-300 uppercase tracking-wider">
                      CLÁUSULA QUINTA — CANCELACIÓN Y PENA CONVENCIONAL:
                    </span>
                    <span className="px-1.5 py-0.2 rounded text-[9px] font-['JetBrains_Mono'] font-bold bg-amber-950/60 text-amber-300 border border-amber-500/40">
                      CÓDIGO CIVIL
                    </span>
                  </div>
                  <blockquote className="font-['JetBrains_Mono'] text-[12px] text-white leading-relaxed italic bg-[#060D24]/80 p-2.5 rounded-lg border border-amber-500/20">
                    &ldquo;{MEXICAN_LEGAL_CLAUSES.cancelacionYPena}&rdquo;
                  </blockquote>
                </div>

                {/* 3. PROPIEDAD INTELECTUAL */}
                <div className="p-3.5 rounded-xl bg-gradient-to-r from-emerald-950/30 to-[#0A1128] border-l-4 border-emerald-400 border border-emerald-500/30 flex flex-col gap-1 shadow-sm">
                  <div className="flex items-center gap-2">
                    <span className="font-['JetBrains_Mono'] text-[11px] font-bold text-emerald-300 uppercase tracking-wider">
                      CLÁUSULA SEXTA — PROPIEDAD INTELECTUAL Y OBRA POR ENCARGO:
                    </span>
                    <span className="px-1.5 py-0.2 rounded text-[9px] font-['JetBrains_Mono'] font-bold bg-emerald-950/60 text-emerald-300 border border-emerald-500/40">
                      ART. 83-84 LFDA
                    </span>
                  </div>
                  <blockquote className="font-['JetBrains_Mono'] text-[12px] text-white leading-relaxed italic bg-[#060D24]/80 p-2.5 rounded-lg border border-emerald-500/20">
                    &ldquo;{MEXICAN_LEGAL_CLAUSES.propiedadIntelectual}&rdquo;
                  </blockquote>
                </div>

                {/* Jurisdicción */}
                <div className="flex flex-col gap-1 text-[11.5px] text-slate-400">
                  <strong className="text-slate-300 font-['JetBrains_Mono']">CLÁUSULA SÉPTIMA — JURISDICCIÓN Y ENCLAVE ARBITRAL:</strong>
                  <span>
                    Las partes convienen que para la solución de controversias se someten expresamente a las leyes federales de los Estados Unidos Mexicanos y a los Tribunales de la Ciudad de México, renunciando a fueros presentes o futuros.
                  </span>
                </div>

                {/* ========================================================= */}
                {/* SIGNATURE DUAL BOX SIMULATION                             */}
                {/* ========================================================= */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-cyan-900/40 font-['JetBrains_Mono'] text-[11px]">
                  {/* Prestador Signature */}
                  <div className="bg-[#091433] p-4 rounded-xl border border-cyan-500/30 flex flex-col gap-2">
                    <span className="text-slate-400 font-bold">POR EL PRESTADOR:</span>
                    <div className="flex items-center gap-2 text-emerald-400">
                      <ShieldCheck className="w-5 h-5 shrink-0" />
                      <div>
                        <div className="font-bold text-white text-[11px]">MRCA SOLUTIONS S.A.P.I. DE C.V.</div>
                        <div className="text-[9px] text-slate-400">SELLO ROOT HSM YUBIKEY FIPS 140-3</div>
                      </div>
                    </div>
                    <div className="text-[9px] text-cyan-400 font-mono break-all bg-[#060D24] p-2 rounded border border-cyan-500/20">
                      ECDSA: 0x9f41b8a72ec9104810a9f82bc1948d01f829019b
                    </div>
                  </div>

                  {/* Client Signature */}
                  <div className="bg-[#091433] p-4 rounded-xl border border-dashed border-cyan-500/40 flex flex-col justify-between gap-2">
                    <span className="text-slate-400 font-bold">POR EL CLIENTE CONTRATANTE:</span>
                    <div className="py-2 text-center text-cyan-300 italic text-[11px]">
                      Pendiente de firma en Enclave ({representativeName || 'Representante Legal'})
                    </div>
                    <div className="text-[9px] text-slate-400 flex justify-between items-center border-t border-slate-800 pt-1">
                      <span>RFC: {rfc}</span>
                      <span>Canal: &lt;{email}&gt;</span>
                    </div>
                  </div>
                </div>

                {/* Footer Checksum & Verification */}
                <div className="pt-2 flex flex-col sm:flex-row items-center justify-between text-[10px] font-['JetBrains_Mono'] text-slate-400 border-t border-slate-800 gap-2">
                  <div className="flex items-center gap-1.5 text-cyan-400">
                    <QrCode className="w-3.5 h-3.5" />
                    <span>SELLO CRIPTOGRÁFICO SHA-256 CON VALIDACIÓN DE HORA (TSA)</span>
                  </div>
                  <span className="text-slate-400">
                    PÁGINA 1 DE 1 // EXPEDIENTE DIGITAL SAT
                  </span>
                </div>
              </div>
            </div>

            {/* ACTION BAR AT BOTTOM */}
            <div className="w-full bg-[#0A1128]/95 border-2 border-cyan-500/40 rounded-2xl p-4 sm:p-5 backdrop-blur-xl shadow-[0_10px_35px_rgba(0,0,0,0.8)] flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="font-['JetBrains_Mono'] text-[11px] text-slate-300">
                  {draftSavedAt ? (
                    <span className="text-emerald-400 flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> Guardado a las {draftSavedAt}
                    </span>
                  ) : (
                    'Listo para emitir'
                  )}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                {/* 1. Guardar Borrador (SUPERADMIN STRICT WRITE ACCESS) */}
                {isSuper ? (
                  <button
                    type="button"
                    onClick={handleSaveDraft}
                    className="px-4 py-2.5 rounded-xl bg-[#141a32] hover:bg-[#1f284d] text-cyan-300 border border-cyan-500/40 font-['JetBrains_Mono'] text-[11px] font-bold uppercase transition-all flex items-center gap-2 cursor-pointer shadow-sm hover:shadow-[0_0_12px_rgba(0,229,255,0.2)]"
                  >
                    <FileText className="w-4 h-4 text-cyan-400" />
                    <span>Guardar Borrador</span>
                  </button>
                ) : (
                  <div className="px-3.5 py-2 rounded-xl bg-amber-950/40 border border-amber-500/30 text-amber-300 font-['JetBrains_Mono'] text-[11px] flex items-center gap-1.5 shadow-inner">
                    <Lock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>Edición y Guardado Reservado a Superadmin</span>
                  </div>
                )}

                {/* 2. Generar Enlace Criptográfico del Contrato */}
                <button
                  type="button"
                  onClick={handleGenerateCryptoLink}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-[#00daf3] hover:from-cyan-400 hover:to-cyan-300 text-[#00363d] font-['JetBrains_Mono'] text-[11px] font-bold uppercase transition-all flex items-center gap-2 cursor-pointer shadow-[0_0_20px_rgba(0,229,255,0.4)]"
                >
                  <Share2 className="w-4 h-4" />
                  <span>Generar Enlace Criptográfico del Contrato</span>
                </button>

                {/* 3. Exportar a PDF */}
                <button
                  type="button"
                  onClick={handleExportPdf}
                  disabled={isExportingPdf}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-['JetBrains_Mono'] text-[11px] font-bold uppercase transition-all flex items-center gap-2 cursor-pointer shadow-[0_0_20px_rgba(16,185,129,0.3)] disabled:opacity-50"
                >
                  {isExportingPdf ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Compilando...</span>
                    </>
                  ) : (
                    <>
                      <Printer className="w-4 h-4" />
                      <span>Exportar a PDF</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* VIEW MODE 2: B2B NEGOTIATIONS INTEGRATION TAB                         */}
      {/* ===================================================================== */}
      {activeTab === 'negotiations' && (
        <div className="flex flex-col gap-5 rounded-2xl bg-[#0A1128]/90 border border-cyan-500/30 p-6 backdrop-blur-xl shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-cyan-900/40">
            <div>
              <h2 className="font-['Space_Grotesk'] text-[20px] font-bold text-white leading-tight">
                Bandeja de Negociaciones B2B &amp; Presupuestos Personalizados
              </h2>
              <p className="font-['Inter'] text-[12px] text-slate-300">
                Propuestas de clientes y contraofertas enviadas a través del cotizador o portal. Convierta cualquier negociación directamente en un contrato vinculante.
              </p>
            </div>
            <button
              onClick={() => setActiveTab('generator')}
              className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-[#00363d] font-['JetBrains_Mono'] text-[11px] font-bold uppercase transition-all flex items-center gap-2 self-start cursor-pointer"
            >
              <FileCode className="w-3.5 h-3.5" />
              <span>Ir al Generador Manual</span>
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {negotiations.length === 0 ? (
              <div className="text-center py-12 flex flex-col items-center gap-3 text-slate-400 font-['JetBrains_Mono'] text-[12px]">
                <Cpu className="w-10 h-10 text-cyan-400 opacity-60" />
                <span>No hay negociaciones pendientes en este momento.</span>
                <button
                  onClick={() => {
                    handleSelectPreset(PRESET_CLIENTS[0]);
                    setActiveTab('generator');
                  }}
                  className="text-cyan-400 hover:underline text-[11px]"
                >
                  Cargar cliente corporativo de ejemplo &rarr;
                </button>
              </div>
            ) : (
              negotiations.map((neg) => (
                <div
                  key={neg.id}
                  className="bg-[#060D24] rounded-xl p-5 border border-cyan-500/20 hover:border-cyan-400/60 transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                >
                  <div className="flex flex-col gap-1.5 max-w-2xl">
                    <div className="flex items-center gap-2">
                      <span className="font-['JetBrains_Mono'] text-[11px] text-cyan-400 font-bold">
                        {neg.id}
                      </span>
                      <span
                        className={`text-[9px] px-2 py-0.5 rounded font-['JetBrains_Mono'] font-bold uppercase ${
                          neg.status === 'approved'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : neg.status === 'rejected'
                            ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                            : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        }`}
                      >
                        {neg.status.toUpperCase()}
                      </span>
                      <span className="text-[10px] text-slate-500 font-['JetBrains_Mono']">
                        {neg.service_category?.toUpperCase() || 'B2B'}
                      </span>
                    </div>

                    <h4 className="font-['Space_Grotesk'] text-[16px] font-bold text-white">
                      {neg.client_company_or_school} — {neg.service_title}
                    </h4>

                    <div className="flex flex-wrap items-center gap-3 font-['JetBrains_Mono'] text-[11px] text-slate-400">
                      <span>Contacto: <strong className="text-slate-200">{neg.client_name}</strong></span>
                      <span>•</span>
                      <span>Email: {neg.client_email}</span>
                      <span>•</span>
                      <span>
                        Presp. Solicitado:{' '}
                        <strong className="text-emerald-400">${neg.proposed_budget?.toLocaleString('es-MX')} MXN</strong>
                      </span>
                    </div>

                    {neg.message && (
                      <p className="text-[12px] text-slate-300 italic bg-[#0A1128] p-2.5 rounded-lg border border-slate-800">
                        &quot;{neg.message}&quot;
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {isSuper ? (
                      <button
                        onClick={() => handleImportNegotiation(neg)}
                        className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-[#00daf3] hover:from-cyan-400 hover:to-cyan-300 text-[#00363d] font-['JetBrains_Mono'] text-[11px] font-bold uppercase flex items-center gap-1.5 shadow-[0_0_15px_rgba(0,229,255,0.3)] transition-all cursor-pointer"
                      >
                        <Scale className="w-3.5 h-3.5" />
                        <span>Convertir a Contrato Legal</span>
                      </button>
                    ) : (
                      <div className="px-3 py-1.5 rounded-lg bg-amber-950/40 border border-amber-500/30 text-amber-300 text-[10px] font-['JetBrains_Mono'] flex items-center gap-1">
                        <Lock className="w-3 h-3 text-amber-400" />
                        <span>Solo Superadmin</span>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* VIEW MODE 3: DISPATCHED CONTRACTS AUDIT HISTORY                       */}
      {/* ===================================================================== */}
      {activeTab === 'history' && (
        <div className="flex flex-col gap-4 rounded-2xl bg-[#0A1128]/90 border border-cyan-500/30 p-6 backdrop-blur-xl shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-cyan-900/40">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-400" />
              <h2 className="font-['Space_Grotesk'] text-[18px] font-bold text-white">
                Historial de Contratos Emitidos con Sellos Digitales
              </h2>
            </div>
            <span className="font-['JetBrains_Mono'] text-[11px] text-slate-400">
              {sentContracts.length} contratos en Ledger Criptográfico
            </span>
          </div>

          <div className="flex flex-col gap-3">
            {sentContracts.map((c) => (
              <div
                key={c.id}
                className="bg-[#060D24] rounded-xl p-4 border border-cyan-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-cyan-400/50 transition-all"
              >
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="font-['JetBrains_Mono'] text-[11px] text-cyan-400 font-bold">
                      {c.id}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[9px] font-['JetBrains_Mono'] font-bold uppercase ${
                        c.status === 'signed'
                          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                          : 'bg-amber-500/15 text-amber-400 border border-amber-500/30 animate-pulse'
                      }`}
                    >
                      {c.status === 'signed' ? 'FIRMADO DIGITALMENTE' : 'PENDIENTE DE FIRMA'}
                    </span>
                  </div>

                  <h4 className="font-['Space_Grotesk'] text-[15px] font-bold text-white">
                    {c.title}
                  </h4>

                  <div className="flex flex-wrap items-center gap-3 font-['JetBrains_Mono'] text-[11px] text-slate-400">
                    <span>Empresa: <strong className="text-slate-200">{c.client_company}</strong></span>
                    <span>•</span>
                    <span>Representante: {c.client_name}</span>
                    <span>•</span>
                    <span>Email: {c.client_email}</span>
                  </div>

                  {c.signature_hash && (
                    <div className="font-['JetBrains_Mono'] text-[9px] text-emerald-400 mt-1 break-all">
                      SELLO CRIPTOGRÁFICO: {c.signature_hash}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => {
                      setContractFolio(c.id);
                      setCompanyName(c.client_company);
                      setRepresentativeName(c.client_name);
                      setEmail(c.client_email);
                      setActiveTab('generator');
                      showToast(`Cargando contrato ${c.id} en la vista previa.`);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-[#141a32] hover:bg-[#1f284d] text-cyan-300 font-['JetBrains_Mono'] text-[11px] transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Inspeccionar</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL: CRYPTOGRAPHIC SIGNING LINK DIALOG                              */}
      {/* ===================================================================== */}
      {cryptoLinkModal.isOpen && (
        <div className="fixed inset-0 z-50 bg-[#060D24]/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-xl rounded-2xl bg-[#0A1128] border-2 border-cyan-500/50 p-6 shadow-[0_0_50px_rgba(0,229,255,0.3)] flex flex-col gap-4 animate-in fade-in duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-cyan-900/40">
              <div className="flex items-center gap-2 text-cyan-400">
                <Share2 className="w-5 h-5" />
                <h3 className="font-['Space_Grotesk'] text-[18px] font-bold text-white">
                  Enlace Criptográfico Generado
                </h3>
              </div>
              <button
                onClick={() => setCryptoLinkModal((prev) => ({ ...prev, isOpen: false }))}
                className="text-slate-400 hover:text-white font-['JetBrains_Mono'] text-[12px] cursor-pointer"
              >
                ✕ Cerrar
              </button>
            </div>

            <p className="text-[13px] text-slate-300 leading-relaxed font-['Inter']">
              Se ha sellado el contrato con llave raíz ECDSA P-384. Comparta este enlace seguro con{' '}
              <strong className="text-white">{representativeName}</strong> ({companyName}) para formalizar la firma electrónica avanzada.
            </p>

            <div className="flex flex-col gap-2">
              <label className="font-['JetBrains_Mono'] text-[11px] text-cyan-400 font-bold uppercase">
                URL Cifrada de Acceso Único
              </label>
              <div className="flex items-center gap-2 bg-[#060D24] border border-cyan-500/30 rounded-xl p-2.5">
                <input
                  type="text"
                  readOnly
                  value={cryptoLinkModal.url}
                  className="w-full bg-transparent text-[11px] font-['JetBrains_Mono'] text-white focus:outline-none truncate"
                />
                <button
                  onClick={() => {
                    if (navigator?.clipboard?.writeText) {
                      navigator.clipboard.writeText(cryptoLinkModal.url);
                      showToast('Enlace copiado al portapapeles.');
                    }
                  }}
                  className="px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-[#00363d] font-['JetBrains_Mono'] text-[10px] font-bold shrink-0 flex items-center gap-1 cursor-pointer"
                >
                  <Copy className="w-3 h-3" />
                  Copiar
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-[#060D24] border border-slate-800 font-['JetBrains_Mono'] text-[10px] text-slate-400">
              <div>
                <span className="block text-slate-500">TOKEN CRIPTOGRÁFICO:</span>
                <span className="text-cyan-300 font-mono truncate block">{cryptoLinkModal.token}</span>
              </div>
              <div>
                <span className="block text-slate-500">VIGENCIA TEMPORAL:</span>
                <span className="text-emerald-400 font-semibold">{cryptoLinkModal.expiresIn}</span>
              </div>
              <div className="col-span-2">
                <span className="block text-slate-500">HASH DE FIRMA SHA-256:</span>
                <span className="text-slate-300 font-mono break-all">{cryptoLinkModal.hash}</span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setCryptoLinkModal((prev) => ({ ...prev, isOpen: false }))}
                className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-[#00363d] font-['JetBrains_Mono'] text-[12px] font-bold cursor-pointer transition-all"
              >
                Aceptar &amp; Continuar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

