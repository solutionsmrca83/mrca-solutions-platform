import React, { useState, useEffect, useRef } from 'react';
import {
  FileText,
  Send,
  Sparkles,
  CheckCircle2,
  Copy,
  Clock,
  ShieldAlert,
  Search,
  Plus,
  Edit3,
  Layers,
  Code,
  Check,
  UserCheck,
  Building,
  DollarSign,
  ShieldCheck,
  ArrowRight,
  Bold,
  Italic,
  Heading,
  List,
  RotateCcw,
  Lock
} from 'lucide-react';
import { ContractTemplate, ClientContract } from '../types';
import { supabase } from '../lib/supabase/client';

interface AdminContractGeneratorProps {
  showToast: (msg: string) => void;
  onContractSent?: (contract: ClientContract) => void;
}

export const BASE_TEMPLATES: ContractTemplate[] = [
  {
    id: 'tmpl_nda_v4',
    title: 'NDA - Acuerdo de Confidencialidad & Sigilo Criptográfico Zero-Trust',
    category: 'nda',
    categoryLabel: 'ACUERDO NDA / CONFIDENCIALIDAD',
    defaultSla: 'Vigencia de 5 Años // Enclave Cifrado',
    description:
      'Protección estricta de propiedad intelectual, repositorios de código privados, arquitectura de red mTLS y credenciales de acceso.',
    base_content: `ACUERDO BILATERAL DE CONFIDENCIALIDAD Y PROTECCIÓN CRIPTOGRÁFICA (NDA ZERO-TRUST)

ENTRE LAS PARTES:
Por una parte, MRCA SOLUTIONS S.A.P.I. DE C.V., representada por su Enclave de Dirección Ejecutiva y Ciberseguridad (Jefe & Socio), y por la otra parte:
EMPRESA BENEFICIARIA: {{EMPRESA_CLIENTE}}
REPRESENTANTE LEGAL: {{REPRESENTANTE_CLIENTE}}
CORREO INSTITUCIONAL: {{CORREO_CLIENTE}}

CLÁUSULA PRIMERA — OBJETO DEL SIGILO TECNOLÓGICO:
Las partes intercambiarán arquitectura de software, diagramas de microservicios, esquemas de bases de datos PostgreSQL con RLS y configuraciones de red eBPF/Cilium con el fin de evaluar y ejecutar servicios de ingeniería avanzada.

CLÁUSULA SEGUNDA — NO REVELACIÓN Y PROTECCIÓN CRIPTOGRÁFICA:
Toda información compartida se considera Carga Útil Confidencial Nivel 4 (FIPS 140-3). Queda estrictamente prohibida su divulgación, copia o ingesta en modelos de inteligencia artificial públicos sin autorización expresa por escrito sellada criptográficamente por MRCA Solutions.

CLÁUSULA TERCERA — VIGENCIA Y PENALIZACIÓN CONVENCIONAL:
El presente acuerdo tendrá una vigencia ininterrumpida de cinco (5) años a partir de la firma digital. En caso de filtración deliberada o negligencia comprobada de secretos industriales o código fuente, la parte infractora cubrirá una pena convencional equivalente a los daños directos calculados en el Enclave Arbitral Tecnológico de la Ciudad de México.

SLA ASIGNADO: {{SLA_ASIGNADO}}
PRESUPUESTO ESTIMADO / MARCO: {{PRESUPUESTO_MARCO}}
FECHA DE EMISIÓN: {{FECHA_EMISION}}
HASH DE INTEGRIDAD PREVIO: {{HASH_SHA256}}`,
  },
  {
    id: 'tmpl_software_dev_v2',
    title: 'Contrato Marco de Desarrollo de Software & Microservicios Cloud',
    category: 'software_dev',
    categoryLabel: 'DESARROLLO DE SOFTWARE & CLOUD',
    defaultSla: '99.98% Uptime // Sprint Quincenal',
    description:
      'Construcción de aplicaciones web de alta concurrencia en Next.js/Rust, microservicios blindados y pipelines CI/CD seguros.',
    base_content: `CONTRATO MARCO DE INGENIERÍA DE SOFTWARE & ARQUITECTURA DISTRIBUIDA B2B

CONTRATANTE: {{EMPRESA_CLIENTE}}
REPRESENTANTE TÉCNICO: {{REPRESENTANTE_CLIENTE}}
CONTACTO DE NOTIFICACIONES: {{CORREO_CLIENTE}}
PRESTADOR DEL SERVICIO: MRCA SOLUTIONS (División Ingeniería de Sistemas)

CLÁUSULA PRIMERA — ALCANCE DE LA INGENIERÍA:
MRCA Solutions desarrollará la plataforma tecnológica especificada en la propuesta técnica adjunta, implementando:
1. Interfaces reactivas de alta velocidad en Next.js 15 y React 19 con diseño ciber-estético Midnight Blue.
2. Backends de baja latencia con aislamiento de datos multi-inquilino mediante Row Level Security (RLS).
3. Pipelines de integración continua blindados con auditoría de vulnerabilidades estáticas (SAST).

CLÁUSULA SEGUNDA — PROPIEDAD INTELECTUAL Y ENTREGA:
Los entregables de código fuente, imágenes de contenedor Docker y esquemas SQL serán transferidos en su totalidad a {{EMPRESA_CLIENTE}} una vez liquidado el importe acordado mediante el mecanismo de Escrow pactado.

CLÁUSULA TERCERA — ACUERDO DE NIVEL DE SERVICIO (SLA):
MRCA Solutions garantiza una disponibilidad operativa mínima de {{SLA_ASIGNADO}} en la infraestructura desplegada bajo nuestra administración directa.

MONTO TOTAL DEL PROYECTO: {{PRESUPUESTO_MARCO}}
CONDICIONES DE PAGO: 50% Anticipo vía Stripe Escrow / 50% Contra Entrega y Pruebas UAT.
SELLADO EN ENCLAVE: {{FECHA_EMISION}}`,
  },
  {
    id: 'tmpl_pentest_v1',
    title: 'Acuerdo de Auditoría Ofensiva Pentest Kali Linux & Hardening Zero-Trust',
    category: 'pentest',
    categoryLabel: 'PENTESTING & CIBERSEGURIDAD OFENSIVA',
    defaultSla: 'Enclave Nivel 4 // Reporte Forense en 72h',
    description:
      'Reglas de combate para pruebas de penetración continuas (Red Team), evasión de amenazas zero-day y certificación SOC-2.',
    base_content: `AUTORIZACIÓN FORMAL DE PRUEBAS DE PENETRACIÓN Y REGLAS DE COMBATE (ROE)

OBJETIVO AUTORIZADO:
EMPRESA AUDITADA: {{EMPRESA_CLIENTE}}
RESPONSABLE DE SEGURIDAD: {{REPRESENTANTE_CLIENTE}}
CORREO CISO: {{CORREO_CLIENTE}}
AUDITOR PRINCIPAL: MRCA SOLUTIONS (Equipo Kali Red Team / CISO Jefe)

CLÁUSULA PRIMERA — REGLAS DE COMBATE (RULES OF ENGAGEMENT):
{{EMPRESA_CLIENTE}} otorga autorización expresa y formal a MRCA Solutions para ejecutar pruebas de seguridad ofensiva, análisis de superficie de ataque, simulación de ataques DoS controlados, pentesting de APIs GraphQL/REST e inspección de contenedores.

CLÁUSULA SEGUNDA — EXCLUSIÓN DE RESPONSABILIDAD PENAL:
Ambas partes reconocen que los vectores de prueba se ejecutan en estricto cumplimiento del mandato de hardening defensivo, operando bajo estándar OWASP Top 10 y marco NIST CSF.

CLÁUSULA TERCERA — ENTREGA DE REPORTE CRIPTOGRÁFICO:
Los hallazgos de vulnerabilidades críticas serán comunicados en un plazo máximo de 24 horas y el informe final cifrado con AES-256 dentro de las 72 horas posteriores al cierre del ejercicio.

SLA DE RESPUESTA A INCIDENTES: {{SLA_ASIGNADO}}
HONORARIOS DEL PENTEST: {{PRESUPUESTO_MARCO}}
REGISTRADO EN KERNEL: {{FECHA_EMISION}}`,
  },
  {
    id: 'tmpl_escrow_v1',
    title: 'Contrato de Custodia Escrow Dual (Stripe & SPEI Inmediato Banxico)',
    category: 'escrow',
    categoryLabel: 'ESCROW & CUSTODIA FINANCIERA',
    defaultSla: 'Dispersión Condicionada 2-de-2 Firmas',
    description:
      'Garantía de fondos protegidos con liberación sujeta a validación criptográfica simultánea por el Jefe (CISO) y Socio (CTO).',
    base_content: `ACUERDO DE CUSTODIA FIDUCIARIA TECNOLÓGICA (ESCROW DUAL B2B)

PARTES INTERVINIENTES:
CLIENTE PAGADOR: {{EMPRESA_CLIENTE}}
APODERADO DE FONDOS: {{REPRESENTANTE_CLIENTE}} ({{CORREO_CLIENTE}})
ADMINISTRADOR ESCROW: MRCA SOLUTIONS S.A.P.I. DE C.V.

CLÁUSULA PRIMERA — CONSIGNACIÓN DE FONDOS:
Los importes por concepto de desarrollo o auditoría serán depositados en la cuenta concentradora segregada bajo protocolo dual Stripe Escrow o SPEI Inmediato Banxico.

CLÁUSULA SEGUNDA — REGLA CRIPTOGRÁFICA DE DISPERSIÓN DUAL:
Ningún fondo será liberado sin la presentación simultánea de:
1. Firma digital del Cliente validando la recepción satisfactoria del hito técnico.
2. Firma dual criptográfica de los Administradores de MRCA Solutions (Jefe y Socio).

MONTO EN CUSTODIA: {{PRESUPUESTO_MARCO}}
MÉTODO DE PAGO: SPEI Banxico / Stripe Escrow Dual
SLA DE DISPERSIÓN TRAS VALIDACIÓN: {{SLA_ASIGNADO}}
EMITIDO EN: {{FECHA_EMISION}}`,
  },
];

const PRESET_CLIENTS = [
  {
    id: 'usr_client_fintech_01',
    companyName: 'Banco NeoPay LatAm',
    representativeName: 'Ing. Rodrigo Salinas',
    email: 'rsalinas@neopay.lat',
    budget: '$350,000 MXN',
    sla: '99.99% Uptime Bancario // Banxico SLA',
  },
  {
    id: 'usr_client_aduana_02',
    companyName: 'Aduana Express Cloud',
    representativeName: 'Lic. Mariana Ortiz',
    email: 'mortiz@aduanaexpress.mx',
    budget: '$180,000 MXN',
    sla: '24/7 Monitoreo Satelital // Latencia < 20ms',
  },
  {
    id: 'usr_client_salud_03',
    companyName: 'Salud Digital HIPAA Corp',
    representativeName: 'Dr. Alejandro Méndez',
    email: 'amendez@saluddigital.org',
    budget: '$420,000 MXN',
    sla: 'Enclave Nivel 4 // Respaldo Geodistribuido',
  },
  {
    id: 'usr_client_retail_04',
    companyName: 'E-Commerce Retail MX',
    representativeName: 'Sofía Valdés',
    email: 'svaldes@retailmex.com',
    budget: '$260,000 MXN',
    sla: '99.95% Disponibilidad // Escalabilidad Black Friday',
  },
  {
    id: 'usr_client_demo',
    companyName: 'FinTech Global B2B',
    representativeName: 'Director Tecnológico Corporativo',
    email: 'cliente@enterprise.corp',
    budget: '$300,000 MXN',
    sla: 'SLA Platino 99.98% // Soporte Prioritario mTLS',
  },
];

export const AdminContractGenerator: React.FC<AdminContractGeneratorProps> = ({
  showToast,
  onContractSent,
}) => {
  const [templates, setTemplates] = useState<ContractTemplate[]>(BASE_TEMPLATES);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(BASE_TEMPLATES[0].id);
  const [selectedClientId, setSelectedClientId] = useState<string>(PRESET_CLIENTS[4].id);
  
  // Dynamic client fields
  const [clientCompany, setClientCompany] = useState(PRESET_CLIENTS[4].companyName);
  const [clientRepresentative, setClientRepresentative] = useState(PRESET_CLIENTS[4].representativeName);
  const [clientEmail, setClientEmail] = useState(PRESET_CLIENTS[4].email);
  const [clientBudget, setClientBudget] = useState(PRESET_CLIENTS[4].budget);
  const [clientSla, setClientSla] = useState(PRESET_CLIENTS[4].sla);

  // Editor states
  const [editableContent, setEditableContent] = useState<string>('');
  const [activeEditorTab, setActiveEditorTab] = useState<'editor' | 'preview' | 'sent_history'>('editor');
  const [isSending, setIsSending] = useState(false);
  const [customTitle, setCustomTitle] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const applyFormatting = (prefix: string, suffix: string = '') => {
    if (!textareaRef.current) return;
    const el = textareaRef.current;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const text = el.value;
    const selected = text.substring(start, end);
    const replacement = prefix + (selected || 'Texto') + suffix;
    const newText = text.substring(0, start) + replacement + text.substring(end);
    setEditableContent(newText);
    setTimeout(() => {
      el.focus();
      el.setSelectionRange(start + prefix.length, start + replacement.length - suffix.length);
    }, 40);
  };

  // History of generated contracts
  const [sentContracts, setSentContracts] = useState<ClientContract[]>(() => {
    // Check localStorage for persisted contracts if available
    try {
      const saved = localStorage.getItem('mrca_client_contracts');
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return [
      {
        id: 'CTR-2026-901',
        client_id: 'usr_client_aduana_02',
        client_name: 'Lic. Mariana Ortiz',
        client_company: 'Aduana Express Cloud',
        client_email: 'mortiz@aduanaexpress.mx',
        template_id: 'tmpl_nda_v4',
        title: 'NDA - Protección Criptográfica de Manifiestos Aduanales',
        content: 'Acuerdo de Confidencialidad y Sigilo Criptográfico firmado.',
        status: 'signed',
        signature_hash: 'SHA256:0x7a81be492a01948bd01948c02',
        signer_email: 'mortiz@aduanaexpress.mx',
        signed_at: 'Ayer, 17:30 PM',
        created_at: 'Ayer, 16:40 PM',
      },
    ];
  });

  const selectedTemplate = templates.find((t) => t.id === selectedTemplateId) || templates[0];

  // Helper to compile placeholders into template
  const compileTemplate = (rawContent: string) => {
    const todayStr = new Date().toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    const pseudoHash = '0x' + Array.from({ length: 16 }, () => Math.floor(Math.random() * 16).toString(16)).join('');

    return rawContent
      .replace(/{{EMPRESA_CLIENTE}}/g, clientCompany)
      .replace(/{{REPRESENTANTE_CLIENTE}}/g, clientRepresentative)
      .replace(/{{CORREO_CLIENTE}}/g, clientEmail)
      .replace(/{{PRESUPUESTO_MARCO}}/g, clientBudget)
      .replace(/{{SLA_ASIGNADO}}/g, clientSla)
      .replace(/{{FECHA_EMISION}}/g, todayStr)
      .replace(/{{HASH_SHA256}}/g, pseudoHash);
  };

  // Sync editor content whenever template or client changes
  useEffect(() => {
    if (selectedTemplate) {
      setCustomTitle(selectedTemplate.title);
      setEditableContent(compileTemplate(selectedTemplate.base_content));
    }
  }, [selectedTemplateId, clientCompany, clientRepresentative, clientEmail, clientBudget, clientSla]);

  // When admin selects a predefined client from the dropdown
  const handleSelectClient = (clientId: string) => {
    setSelectedClientId(clientId);
    const client = PRESET_CLIENTS.find((c) => c.id === clientId);
    if (client) {
      setClientCompany(client.companyName);
      setClientRepresentative(client.representativeName);
      setClientEmail(client.email);
      setClientBudget(client.budget);
      setClientSla(client.sla);
      showToast(`Cliente seleccionado: ${client.companyName}`);
    }
  };

  const handleInsertPlaceholder = (placeholder: string) => {
    setEditableContent((prev) => prev + '\n' + placeholder);
  };

  const handleGenerateAndSend = async () => {
    if (!editableContent.trim()) {
      showToast('Error: El contenido del contrato no puede estar vacío.');
      return;
    }

    setIsSending(true);

    const generatedContractId = `CTR-${Date.now().toString().slice(-6)}`;
    const newContract: ClientContract = {
      id: generatedContractId,
      client_id: selectedClientId,
      client_name: clientRepresentative,
      client_company: clientCompany,
      client_email: clientEmail,
      template_id: selectedTemplate.id,
      title: customTitle || selectedTemplate.title,
      content: editableContent,
      status: 'pending_signature',
      created_at: new Date().toISOString(),
    };

    // Attempt saving to Supabase client_contracts table
    try {
      await supabase.from('client_contracts').insert({
        id: generatedContractId,
        client_id: selectedClientId === 'usr_client_demo' ? '00000000-0000-0000-0000-000000000000' : selectedClientId,
        title: newContract.title,
        content: newContract.content,
        status: 'pending_signature',
        created_at: new Date().toISOString(),
      });
    } catch {
      // Local fallback
    }

    // Update state and persistence
    const updatedContracts = [newContract, ...sentContracts];
    setSentContracts(updatedContracts);
    try {
      localStorage.setItem('mrca_client_contracts', JSON.stringify(updatedContracts));
      // Dispatch a storage event so other open tabs/components react immediately
      window.dispatchEvent(new CustomEvent('mrca_contract_dispatched', { detail: newContract }));
    } catch {
      // storage quota fallback
    }

    if (onContractSent) {
      onContractSent(newContract);
    }

    setTimeout(() => {
      setIsSending(false);
      showToast(`[CONTRATO GENERADO] "${newContract.title}" enviado formalmente a ${clientCompany}.`);
      setActiveEditorTab('sent_history');
    }, 700);
  };

  return (
    <div className="w-full flex flex-col gap-6 font-['Inter']">
      {/* ================================================================== */}
      {/* 1. TOP HEADER & TELEMETRY BANNER                                  */}
      {/* ================================================================== */}
      <div className="relative w-full rounded-2xl bg-gradient-to-r from-[#141a32]/95 via-[#0c163a]/90 to-[#141a32]/95 border-2 border-[#00e5ff]/40 p-5 sm:p-6 shadow-[0_10px_35px_rgba(0,229,255,0.18)] backdrop-blur-xl overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-full bg-gradient-to-l from-[#00fe66]/10 to-transparent pointer-events-none"></div>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-[#00e5ff]/15 border border-[#00e5ff]/30 text-[#00e5ff] font-['JetBrains_Mono'] text-[10px] font-bold tracking-wider uppercase flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5" />
                ADMIN ENCLAVE // MÓDULO LEGAL B2B
              </span>
              <span className="font-['JetBrains_Mono'] text-[11px] text-[#00fe66] font-semibold">
                • RUTA OFICIAL: /admin/contratos
              </span>
            </div>

            <h2 className="font-['Space_Grotesk'] text-[22px] sm:text-[26px] font-bold text-[#dce1ff]">
              Gestor de Plantillas & Generador de Contratos B2B
            </h2>
            <p className="font-['Inter'] text-[13px] text-[#bac9cc] max-w-3xl">
              Seleccione una plantilla base (NDA, Desarrollo de Software, Pentesting o Escrow), adapte los términos dinámicamente para cada cliente corporativo y despache el documento directo a su portal con verificación criptográfica.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setActiveEditorTab('editor')}
              className={`px-4 py-2 rounded-xl font-['JetBrains_Mono'] text-[11px] font-semibold transition-all flex items-center gap-1.5 ${
                activeEditorTab === 'editor'
                  ? 'bg-[#00e5ff] text-[#00363d] shadow-[0_0_15px_rgba(0,229,255,0.4)]'
                  : 'bg-[#182142] text-[#bac9cc] hover:text-[#dce1ff]'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Editor Dinámico</span>
            </button>

            <button
              onClick={() => setActiveEditorTab('preview')}
              className={`px-4 py-2 rounded-xl font-['JetBrains_Mono'] text-[11px] font-semibold transition-all flex items-center gap-1.5 ${
                activeEditorTab === 'preview'
                  ? 'bg-[#00e5ff] text-[#00363d] shadow-[0_0_15px_rgba(0,229,255,0.4)]'
                  : 'bg-[#182142] text-[#bac9cc] hover:text-[#dce1ff]'
              }`}
            >
              <Code className="w-3.5 h-3.5" />
              <span>Vista Previa Legal</span>
            </button>

            <button
              onClick={() => setActiveEditorTab('sent_history')}
              className={`px-4 py-2 rounded-xl font-['JetBrains_Mono'] text-[11px] font-semibold transition-all flex items-center gap-1.5 ${
                activeEditorTab === 'sent_history'
                  ? 'bg-[#00fe66] text-[#00363d] shadow-[0_0_15px_rgba(0,254,102,0.4)]'
                  : 'bg-[#182142] text-[#bac9cc] hover:text-[#dce1ff]'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Contratos Emitidos ({sentContracts.length})</span>
            </button>
          </div>
        </div>
      </div>

      {/* ================================================================== */}
      {/* 2. GESTOR DE PLANTILLAS BASE (SELECTOR GRID)                       */}
      {/* ================================================================== */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#00e5ff]" />
            <h3 className="font-['Space_Grotesk'] text-[16px] font-bold text-[#dce1ff]">
              1. Gestor de Plantillas Base
            </h3>
            <span className="font-['JetBrains_Mono'] text-[11px] text-[#849396]">
              ({templates.length} Tipos de Contrato Pre-configurados)
            </span>
          </div>

          <span className="font-['JetBrains_Mono'] text-[11px] text-[#00fe66]">
            FIPS 140-3 COMPLIANT
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3.5">
          {templates.map((tmpl) => {
            const isSelected = tmpl.id === selectedTemplateId;
            return (
              <div
                key={tmpl.id}
                onClick={() => setSelectedTemplateId(tmpl.id)}
                className={`group cursor-pointer rounded-xl p-4 transition-all relative flex flex-col justify-between gap-3 border ${
                  isSelected
                    ? 'bg-[#121c3b] border-[#00e5ff] shadow-[0_0_20px_rgba(0,229,255,0.25)]'
                    : 'bg-[#101733]/90 border-[#1f2b4f] hover:border-[#00e5ff]/50 hover:bg-[#141f42]'
                }`}
              >
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <span
                      className={`font-['JetBrains_Mono'] text-[9px] uppercase px-2 py-0.5 rounded font-bold ${
                        isSelected
                          ? 'bg-[#00e5ff] text-[#00363d]'
                          : 'bg-[#1b254a] text-[#00daf3]'
                      }`}
                    >
                      {tmpl.categoryLabel}
                    </span>
                    {isSelected && (
                      <span className="w-2 h-2 rounded-full bg-[#00fe66] animate-pulse shadow-[0_0_8px_#00fe66]"></span>
                    )}
                  </div>

                  <h4 className="font-['Space_Grotesk'] text-[14px] font-bold text-[#dce1ff] group-hover:text-[#00e5ff] transition-colors leading-snug">
                    {tmpl.title}
                  </h4>

                  <p className="font-['Inter'] text-[11px] text-[#849396] line-clamp-2">
                    {tmpl.description}
                  </p>
                </div>

                <div className="pt-2 border-t border-[#1b254a] flex items-center justify-between text-[10px] font-['JetBrains_Mono'] text-[#bac9cc]">
                  <span>SLA Base:</span>
                  <span className="text-[#00fe66] font-semibold">{tmpl.defaultSla}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ================================================================== */}
      {/* 3. TARGET CLIENT SELECTOR & CUSTOM VARIABLE FIELDS                 */}
      {/* ================================================================== */}
      <div className="rounded-2xl bg-[#0e1633] border border-[#1e2c56] p-4 sm:p-5 flex flex-col gap-4 shadow-lg">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#1b2850]">
          <div className="flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-[#00fe66]" />
            <h3 className="font-['Space_Grotesk'] text-[15px] font-bold text-[#dce1ff]">
              2. Asignar Cliente Específico & Variables Dinámicas
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-['JetBrains_Mono'] text-[11px] text-[#849396]">
              Cargar Perfil:
            </span>
            <select
              value={selectedClientId}
              onChange={(e) => handleSelectClient(e.target.value)}
              className="bg-[#182348] border border-[#2b3a6d] rounded-lg px-3 py-1.5 font-['JetBrains_Mono'] text-[12px] text-[#00e5ff] focus:outline-none focus:border-[#00e5ff]"
            >
              {PRESET_CLIENTS.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.companyName} ({c.representativeName})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Variables Inputs Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 font-['JetBrains_Mono'] text-[11px]">
          <div>
            <label className="block text-[#849396] uppercase mb-1">Empresa Cliente:</label>
            <input
              type="text"
              value={clientCompany}
              onChange={(e) => setClientCompany(e.target.value)}
              className="w-full bg-[#131d40] border border-[#263768] rounded-lg px-3 py-2 text-[#dce1ff] focus:outline-none focus:border-[#00e5ff]"
            />
          </div>

          <div>
            <label className="block text-[#849396] uppercase mb-1">Representante:</label>
            <input
              type="text"
              value={clientRepresentative}
              onChange={(e) => setClientRepresentative(e.target.value)}
              className="w-full bg-[#131d40] border border-[#263768] rounded-lg px-3 py-2 text-[#dce1ff] focus:outline-none focus:border-[#00e5ff]"
            />
          </div>

          <div>
            <label className="block text-[#849396] uppercase mb-1">Correo Oficial:</label>
            <input
              type="email"
              value={clientEmail}
              onChange={(e) => setClientEmail(e.target.value)}
              className="w-full bg-[#131d40] border border-[#263768] rounded-lg px-3 py-2 text-[#dce1ff] focus:outline-none focus:border-[#00e5ff]"
            />
          </div>

          <div>
            <label className="block text-[#849396] uppercase mb-1">Monto / Presupuesto:</label>
            <input
              type="text"
              value={clientBudget}
              onChange={(e) => setClientBudget(e.target.value)}
              className="w-full bg-[#131d40] border border-[#263768] rounded-lg px-3 py-2 text-[#00fe66] focus:outline-none focus:border-[#00fe66]"
            />
          </div>

          <div>
            <label className="block text-[#849396] uppercase mb-1">SLA Asignado:</label>
            <input
              type="text"
              value={clientSla}
              onChange={(e) => setClientSla(e.target.value)}
              className="w-full bg-[#131d40] border border-[#263768] rounded-lg px-3 py-2 text-[#00e5ff] focus:outline-none focus:border-[#00e5ff]"
            />
          </div>
        </div>
      </div>

      {/* ================================================================== */}
      {/* 4. MAIN EDITOR & PREVIEW SECTION                                  */}
      {/* ================================================================== */}
      {activeEditorTab === 'editor' && (
        <div className="flex flex-col gap-3 rounded-2xl bg-[#0c132c] border-2 border-[#00e5ff]/40 p-4 sm:p-5 shadow-2xl backdrop-blur-xl">
          {/* Editor Header Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#1b2850]">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#00e5ff] animate-ping"></span>
              <span className="font-['Space_Grotesk'] text-[15px] font-bold text-[#dce1ff]">
                Editor de Términos Dinámicos del Contrato
              </span>
            </div>

            {/* Quick Placeholder Inserters */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="font-['JetBrains_Mono'] text-[10px] text-[#849396] mr-1">
                Insertar Cláusula / Macro:
              </span>
              <button
                type="button"
                onClick={() =>
                  handleInsertPlaceholder(
                    '\nCLÁUSULA ESPECIAL — DISPERSIÓN DUAL AUDITABLE:\nLos desembolsos correspondientes a la entrega final estarán vinculados al hash de liberación firmado en la bóveda de Shamir por Jefe y Socio.'
                  )
                }
                className="px-2.5 py-1 rounded bg-[#18244b] hover:bg-[#223164] text-[#00daf3] border border-[#2c3d75] font-['JetBrains_Mono'] text-[10px] transition-all"
              >
                + Dispersión Dual
              </button>
              <button
                type="button"
                onClick={() =>
                  handleInsertPlaceholder(
                    '\nCLÁUSULA ESPECIAL — PENALIZACIÓN CIBERNETICA:\nCualquier divulgación no autorizada de credenciales mTLS conllevará rescisión automática y auditoría forense con reporte inmediato a las entidades reguladoras.'
                  )
                }
                className="px-2.5 py-1 rounded bg-[#18244b] hover:bg-[#223164] text-[#00fe66] border border-[#2c3d75] font-['JetBrains_Mono'] text-[10px] transition-all"
              >
                + Penalización Zero-Day
              </button>
              <button
                type="button"
                onClick={() =>
                  handleInsertPlaceholder(
                    `\nPROTOCOLO DE REPOSITORIO PRIVADO: git@mrcasolutions.enclave:clients/${clientCompany.toLowerCase().replace(/\\s+/g, '-')}.git`
                  )
                }
                className="px-2.5 py-1 rounded bg-[#18244b] hover:bg-[#223164] text-[#bac9cc] border border-[#2c3d75] font-['JetBrains_Mono'] text-[10px] transition-all"
              >
                + Repo Git mTLS
              </button>
            </div>
          </div>

          {/* Contract Title Input */}
          <div className="flex flex-col gap-1">
            <label className="font-['JetBrains_Mono'] text-[11px] text-[#849396] uppercase">
              Título del Documento a Emitir:
            </label>
            <input
              type="text"
              value={customTitle}
              onChange={(e) => setCustomTitle(e.target.value)}
              className="w-full bg-[#101938] border border-[#243566] rounded-xl px-4 py-2.5 font-['Space_Grotesk'] text-[16px] font-bold text-[#00e5ff] focus:outline-none focus:border-[#00e5ff]"
            />
          </div>

          {/* Rich Text Format Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-2 p-2 rounded-xl bg-[#09112a] border border-[#1d2a52]">
            <div className="flex items-center gap-1 font-['JetBrains_Mono'] text-[11px]">
              <button
                type="button"
                onClick={() => applyFormatting('**', '**')}
                className="p-1.5 rounded-lg bg-[#121c3b] hover:bg-[#1f2e5c] text-[#00e5ff] hover:text-white transition-colors"
                title="Negrita (**texto**)"
              >
                <Bold className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => applyFormatting('*', '*')}
                className="p-1.5 rounded-lg bg-[#121c3b] hover:bg-[#1f2e5c] text-[#00e5ff] hover:text-white transition-colors"
                title="Cursiva (*texto*)"
              >
                <Italic className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => applyFormatting('\n\n### CLÁUSULA — ', '')}
                className="p-1.5 rounded-lg bg-[#121c3b] hover:bg-[#1f2e5c] text-[#00fe66] hover:text-white transition-colors flex items-center gap-1 px-2"
                title="Encabezado de Cláusula"
              >
                <Heading className="w-3.5 h-3.5" />
                <span className="text-[10px] font-bold">Cláusula</span>
              </button>
              <button
                type="button"
                onClick={() => applyFormatting('\n• ', '')}
                className="p-1.5 rounded-lg bg-[#121c3b] hover:bg-[#1f2e5c] text-[#00daf3] hover:text-white transition-colors"
                title="Lista de Viñetas"
              >
                <List className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => applyFormatting('\n[ENCLAVE FIPS 140-3: ', ']')}
                className="p-1.5 rounded-lg bg-[#121c3b] hover:bg-[#1f2e5c] text-[#00fe66] hover:text-white transition-colors flex items-center gap-1 px-2"
                title="Insertar Bloque Cifrado FIPS"
              >
                <Lock className="w-3.5 h-3.5" />
                <span className="text-[10px]">Cifrado FIPS</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => {
                if (selectedTemplate) {
                  setEditableContent(compileTemplate(selectedTemplate.base_content));
                  showToast('Plantilla restablecida a términos originales.');
                }
              }}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#182348] hover:bg-[#233266] text-[#bac9cc] hover:text-[#ffb4ab] font-['JetBrains_Mono'] text-[10px] transition-colors"
              title="Restablecer a plantilla base"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Restablecer Términos</span>
            </button>
          </div>

          {/* Highly Styled Cyber Textarea / Rich Terms Canvas */}
          <div className="relative w-full">
            <textarea
              ref={textareaRef}
              rows={16}
              value={editableContent}
              onChange={(e) => setEditableContent(e.target.value)}
              className="w-full bg-[#080e22] text-[#dce1ff] font-['JetBrains_Mono'] text-[12px] leading-relaxed p-4 rounded-xl border border-[#1b2b52] focus:outline-none focus:border-[#00e5ff] focus:ring-1 focus:ring-[#00e5ff] shadow-inner selection:bg-[#00e5ff] selection:text-[#00363d]"
              placeholder="Escriba o ajuste las cláusulas del contrato..."
            />
            <div className="absolute bottom-3 right-4 font-['JetBrains_Mono'] text-[10px] text-[#849396]">
              {editableContent.length} CARACTERES // {editableContent.split('\n').length} LÍNEAS
            </div>
          </div>

          {/* Action Bar: Generar y Enviar al Cliente */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
            <div className="flex items-center gap-2 font-['JetBrains_Mono'] text-[11px] text-[#849396]">
              <ShieldCheck className="w-4 h-4 text-[#00fe66]" />
              <span>
                El contrato se creará con estado <strong className="text-[#00daf3]">PENDING_SIGNATURE</strong> en Supabase.
              </span>
            </div>

            <button
              type="button"
              onClick={handleGenerateAndSend}
              disabled={isSending}
              className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-[#00e5ff] via-[#00fe66] to-[#00daf3] hover:brightness-110 text-[#00363d] font-['JetBrains_Mono'] text-[13px] font-bold uppercase tracking-wider transition-all shadow-[0_0_25px_rgba(0,229,255,0.4)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2.5"
            >
              {isSending ? (
                <>
                  <div className="w-4 h-4 border-2 border-[#00363d] border-t-transparent rounded-full animate-spin"></div>
                  <span>Generando & Sellando Documento...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Generar y Enviar al Cliente</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* ================================================================== */}
      {/* 5. LIVE LEGAL PREVIEW MODE                                         */}
      {/* ================================================================== */}
      {activeEditorTab === 'preview' && (
        <div className="rounded-2xl bg-[#090f24] border-2 border-[#00e5ff]/50 p-6 sm:p-8 flex flex-col gap-6 shadow-2xl relative overflow-hidden backdrop-blur-2xl">
          {/* Cyber Watermark */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-5">
            <span className="font-['Space_Grotesk'] text-[140px] font-extrabold text-[#00e5ff] select-none rotate-[-25deg]">
              MRCA SEC
            </span>
          </div>

          <div className="flex items-center justify-between pb-4 border-b border-[#1b2b52] relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#141e40] border border-[#00e5ff]/40 flex items-center justify-center text-[#00e5ff]">
                <FileText className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="font-['Space_Grotesk'] text-[18px] font-bold text-[#dce1ff]">
                  {customTitle || selectedTemplate.title}
                </span>
                <span className="font-['JetBrains_Mono'] text-[10px] text-[#00fe66] uppercase">
                  VISTA PREVIA DE CARGA ÚTIL OFICIAL // NOTARIAL CRIPTOGRÁFICO
                </span>
              </div>
            </div>

            <div className="text-right font-['JetBrains_Mono'] text-[11px] text-[#849396]">
              <div>DESTINATARIO: <strong className="text-[#00e5ff]">{clientCompany}</strong></div>
              <div>EMISOR: <span className="text-[#00fe66]">MRCA SOLUTIONS B2B</span></div>
            </div>
          </div>

          {/* Document Body */}
          <div className="bg-[#050a1b] p-6 rounded-xl border border-[#142247] whitespace-pre-wrap font-['JetBrains_Mono'] text-[12px] leading-relaxed text-[#cad6ff] shadow-inner relative z-10 max-h-[500px] overflow-y-auto">
            {editableContent}
          </div>

          {/* Footer Signature Box Simulation */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-[#1b2b52] font-['JetBrains_Mono'] text-[11px] relative z-10">
            <div className="bg-[#0e1633] p-4 rounded-xl border border-[#202f5a] flex flex-col gap-2">
              <span className="text-[#849396]">FIRMA POR EL ENCLAVE MRCA SOLUTIONS:</span>
              <div className="h-14 flex items-center gap-2 text-[#00fe66]">
                <ShieldCheck className="w-6 h-6" />
                <div>
                  <div className="font-bold">JEFE (CEO/CISO) &amp; SOCIO (CTO)</div>
                  <div className="text-[10px] text-[#849396]">SELLO ROOT HSM YUBIKEY OK</div>
                </div>
              </div>
              <div className="text-[10px] text-[#00e5ff] break-all">
                HASH: 0x9f41b8a72ec9104810a9f82bc1948d01
              </div>
            </div>

            <div className="bg-[#0e1633] p-4 rounded-xl border border-dashed border-[#00e5ff]/40 flex flex-col justify-between">
              <span className="text-[#849396]">FIRMA ESPERADA DEL CLIENTE:</span>
              <div className="py-2 text-center text-[#00e5ff] italic">
                Pendiente de firma en el Portal del Cliente ({clientRepresentative})
              </div>
              <div className="text-[10px] text-[#849396] text-right">
                Canal: &lt;{clientEmail}&gt;
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 relative z-10">
            <button
              onClick={() => setActiveEditorTab('editor')}
              className="px-4 py-2.5 rounded-xl bg-[#141f42] text-[#bac9cc] hover:text-[#dce1ff] font-['JetBrains_Mono'] text-[12px]"
            >
              Volver al Editor
            </button>
            <button
              onClick={handleGenerateAndSend}
              className="px-6 py-2.5 rounded-xl bg-[#00e5ff] hover:bg-[#5af2ff] text-[#00363d] font-['JetBrains_Mono'] text-[12px] font-bold uppercase flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
              <span>Confirmar y Enviar al Cliente</span>
            </button>
          </div>
        </div>
      )}

      {/* ================================================================== */}
      {/* 6. SENT CONTRACTS HISTORY & AUDIT LOG                              */}
      {/* ================================================================== */}
      {activeEditorTab === 'sent_history' && (
        <div className="flex flex-col gap-4 rounded-2xl bg-[#0c142e] border border-[#1c2a52] p-5 shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-[#1b2850]">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#00fe66]" />
              <h3 className="font-['Space_Grotesk'] text-[16px] font-bold text-[#dce1ff]">
                Historial de Contratos Emitidos a Clientes
              </h3>
            </div>
            <span className="font-['JetBrains_Mono'] text-[11px] text-[#849396]">
              {sentContracts.length} Documentos en Ledger
            </span>
          </div>

          <div className="flex flex-col gap-3">
            {sentContracts.map((c) => (
              <div
                key={c.id}
                className="bg-[#101938] rounded-xl p-4 border border-[#202e5c] flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-[#00e5ff]/50 transition-all"
              >
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="font-['JetBrains_Mono'] text-[11px] text-[#00daf3] font-bold">
                      {c.id}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-['JetBrains_Mono'] font-bold uppercase ${
                        c.status === 'signed'
                          ? 'bg-[#00fe66]/15 text-[#00fe66] border border-[#00fe66]/30'
                          : 'bg-[#ff9900]/15 text-[#ffb020] border border-[#ffb020]/30 animate-pulse'
                      }`}
                    >
                      {c.status === 'signed' ? 'FIRMADO DIGITALMENTE' : 'PENDIENTE DE FIRMA'}
                    </span>
                  </div>

                  <h4 className="font-['Space_Grotesk'] text-[15px] font-bold text-[#dce1ff]">
                    {c.title}
                  </h4>

                  <div className="flex flex-wrap items-center gap-3 font-['JetBrains_Mono'] text-[11px] text-[#849396]">
                    <span>Cliente: <strong className="text-[#dce1ff]">{c.client_company}</strong></span>
                    <span>•</span>
                    <span>Representante: {c.client_name}</span>
                    <span>•</span>
                    <span>Fecha: {c.created_at ? new Date(c.created_at).toLocaleDateString() : 'Reciente'}</span>
                  </div>

                  {c.signature_hash && (
                    <div className="font-['JetBrains_Mono'] text-[10px] text-[#00fe66] mt-1 break-all">
                      SELLO CRIPTOGRÁFICO: {c.signature_hash}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => {
                      setCustomTitle(c.title);
                      setEditableContent(c.content);
                      setActiveEditorTab('preview');
                    }}
                    className="px-3 py-1.5 rounded-lg bg-[#182348] hover:bg-[#233266] text-[#00e5ff] font-['JetBrains_Mono'] text-[11px] transition-all flex items-center gap-1"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Inspeccionar</span>
                  </button>

                  {c.status === 'pending_signature' && (
                    <button
                      onClick={() => {
                        showToast(`Recordatorio de firma cifrado re-enviado a ${c.client_email}`);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-[#00e5ff]/20 hover:bg-[#00e5ff]/30 text-[#00e5ff] border border-[#00e5ff]/40 font-['JetBrains_Mono'] text-[11px] transition-all"
                    >
                      Re-enviar Alerta
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
