import React, { useState } from 'react';
import {
  CheckCircle2,
  Clock,
  Calendar,
  Layers,
  ShieldCheck,
  ChevronRight,
  GitCommit,
  User,
  Activity,
  Zap,
  Lock,
  ExternalLink,
  Filter,
  Sparkles
} from 'lucide-react';
import { RoadmapItem, RoadmapStatus } from '../types';

interface LiveRoadmapProps {
  clientCompany?: string;
  showToast?: (msg: string) => void;
}

const INITIAL_ROADMAP: RoadmapItem[] = [
  {
    id: 'sprint-01',
    phaseCode: 'FASE 01 // DIAGNÓSTICO Y DISEÑO',
    title: 'Arquitectura de Seguridad y Levantamiento de Requerimientos',
    subtitle: 'Diseño de Arquitectura, Análisis de Riesgos y Cifrado Corporativo',
    category: 'architecture',
    status: 'completed',
    progress: 100,
    startDate: '15 Sep 2026',
    targetDate: '28 Sep 2026',
    description:
      'Revisión exhaustiva de la superficie de operación, delimitación de accesos y diseño de arquitectura distribuida con seguridad integrada desde el origen.',
    deliverables: [
      { text: 'Diagrama de Arquitectura Corporativa en Entorno Cifrado', done: true },
      { text: 'Modelado de Riesgos y Estándares OWASP Top 10', done: true },
      { text: 'Especificación de cifrado mutuo y certificados TLS 1.3', done: true },
      { text: 'Acuerdo de Confidencialidad Criptográfico (NDA) Firmado', done: true },
    ],
    commitHash: '0x7a81be492a01948bd01948c02',
    architectLead: 'Jefe (CISO)',
    slaVerification: '100% CUMPLIDO // APROBACIÓN DUAL VERIFICADA',
  },
  {
    id: 'sprint-02',
    phaseCode: 'FASE 02 // BLINDAJE DE DATOS',
    title: 'Modelado Relacional PostgreSQL y Aislamiento Empresarial',
    subtitle: 'Aislamiento estricto por cliente, Particionamiento e Inmutabilidad',
    category: 'database',
    status: 'completed',
    progress: 100,
    startDate: '29 Sep 2026',
    targetDate: '10 Oct 2026',
    description:
      'Implementación del esquema de base de datos multiempresa en PostgreSQL. Configuración de políticas de seguridad por fila para garantizar aislamiento absoluto entre clientes.',
    deliverables: [
      { text: 'Políticas de aislamiento en tablas transaccionales y auditoría', done: true },
      { text: 'Funciones de seguridad y control de acceso blindadas', done: true },
      { text: 'Auditoría continua con integridad criptográfica SHA-256', done: true },
      { text: 'Pruebas de aislamiento superadas sin exposición de datos', done: true },
    ],
    commitHash: '0x3b1c8812fa99a0d2491b490f84',
    architectLead: 'Socio (CTO)',
    slaVerification: 'CERO FUGAS DE DATOS // VERIFICADO',
  },
  {
    id: 'sprint-03',
    phaseCode: 'FASE 03 // FASE ACTIVA',
    title: 'Servicios Cifrados y Bóveda Criptográfica',
    subtitle: 'Plataforma Web de Alto Rendimiento, Resguardo de Claves y Webhooks',
    category: 'security',
    status: 'active',
    progress: 68,
    startDate: '11 Oct 2026',
    targetDate: '24 Oct 2026',
    description:
      'Construcción de servicios transaccionales con cifrado asimétrico y firma digital de contratos. Integración del resguardo distribuido de llaves de seguridad.',
    deliverables: [
      { text: 'Componente de Firma Digital Vectorial con Sello Criptográfico', done: true },
      { text: 'Panel de Consumo de Claves API y Métricas en Tiempo Real', done: true },
      { text: 'Integración de Notificaciones SPEI Banxico y Conciliación', done: false },
      { text: 'Pruebas de carga de 15,000 solicitudes concurrentes', done: false },
    ],
    commitHash: '0x9f41b8a72ec9104810a9f82bc1',
    architectLead: 'Socio (CTO)',
    slaVerification: 'EN TIEMPO // LATENCIA ACTUAL: 12.4ms',
  },
  {
    id: 'sprint-04',
    phaseCode: 'FASE 04 // AUDITORÍA DE SEGURIDAD',
    title: 'Auditoría Integral de Ciberseguridad y Pruebas de Intrusión',
    subtitle: 'Simulación de amenazas avanzadas, Revisión de Código y Correcciones',
    category: 'security',
    status: 'upcoming',
    progress: 0,
    startDate: '25 Oct 2026',
    targetDate: '07 Nov 2026',
    description:
      'Evaluación preventiva automatizada y manual de las aplicaciones web, interfaces de integración e infraestructura en la nube. Emisión de informe ejecutivo bajo estándar SOC-2.',
    deliverables: [
      { text: 'Pruebas externas de intrusión y validación perimetral', done: false },
      { text: 'Análisis de dependencias y vulnerabilidades en la nube', done: false },
      { text: 'Validación contra inyecciones de código y accesos indebidos', done: false },
      { text: 'Emisión del Certificado de Seguridad Nivel 4', done: false },
    ],
    commitHash: '0xpendiente_validacion',
    architectLead: 'Jefe (CISO)',
    slaVerification: 'SLA GARANTIZADO 72H INFORME FORENSE',
  },
  {
    id: 'sprint-05',
    phaseCode: 'FASE 05 // PUESTA EN PRODUCCIÓN',
    title: 'Despliegue con Redundancia y Entrega Formal',
    subtitle: 'Infraestructura en la Nube Blindada y Entrega de Propiedad Intelectual',
    category: 'production',
    status: 'upcoming',
    progress: 0,
    startDate: '08 Nov 2026',
    targetDate: '20 Nov 2026',
    description:
      'Puesta en marcha en infraestructura de producción de alta disponibilidad. Cierre financiero y entrega formal de activos digitales y documentación.',
    deliverables: [
      { text: 'Despliegue multirregión con redundancia activa', done: false },
      { text: 'Pruebas de aceptación (UAT) con el equipo de la empresa', done: false },
      { text: 'Transferencia de repositorios y llaves maestras', done: false },
      { text: 'Liberación final condicionada al SLA 99.99%', done: false },
    ],
    commitHash: '0xpendiente_firma_dual',
    architectLead: 'Equipo Core Enclave',
    slaVerification: '99.99% DISPONIBILIDAD CONVENIDA POR CONTRATO',
  },
];

export const LiveRoadmap: React.FC<LiveRoadmapProps> = ({
  clientCompany = 'FinTech Global B2B',
  showToast,
}) => {
  const [roadmap, setRoadmap] = useState<RoadmapItem[]>(INITIAL_ROADMAP);
  const [selectedSprintId, setSelectedSprintId] = useState<string>('sprint-03');
  const [filterCategory, setFilterCategory] = useState<string>('all');

  const filteredRoadmap = roadmap.filter((item) => {
    if (filterCategory === 'all') return true;
    return item.category === filterCategory;
  });

  const selectedSprint = roadmap.find((item) => item.id === selectedSprintId) || roadmap[2];

  const overallProgress = Math.round(
    roadmap.reduce((acc, curr) => acc + curr.progress, 0) / roadmap.length
  );

  return (
    <div className="w-full flex flex-col gap-6 font-['Inter'] text-[#dce1ff]">
      {/* ================================================================== */}
      {/* 1. TOP ROADMAP BANNER & SPRINT TELEMETRY                           */}
      {/* ================================================================== */}
      <div className="relative w-full rounded-2xl bg-gradient-to-r from-[#141a32]/95 via-[#0c163a]/90 to-[#141a32]/95 border-2 border-[#00e5ff]/40 p-5 sm:p-6 shadow-[0_10px_35px_rgba(0,229,255,0.18)] backdrop-blur-xl overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-full bg-gradient-to-l from-[#00fe66]/10 to-transparent pointer-events-none"></div>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-[#00fe66]/15 border border-[#00fe66]/30 text-[#00fe66] font-['JetBrains_Mono'] text-[10px] font-bold tracking-wider uppercase flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5" />
                PLAN EN VIVO // CRONOGRAMA INTERACTIVO B2B
              </span>
              <span className="font-['JetBrains_Mono'] text-[11px] text-[#00daf3]">
                • CLIENTE: {clientCompany}
              </span>
            </div>

            <h2 className="font-['Space_Grotesk'] text-[22px] sm:text-[26px] font-bold text-[#dce1ff]">
              Plan de Entregas del Proyecto en Tiempo Real
            </h2>
            <p className="font-['Inter'] text-[13px] text-[#bac9cc] max-w-3xl">
              Monitoree el avance fase por fase con trazabilidad criptográfica. Los hitos completados aparecen en <strong className="text-[#00fe66]">Verde Esmeralda (#00FF66)</strong> y la fase en ejecución activa destaca en <strong className="text-[#00e5ff]">Cian Corporativo (#00E5FF)</strong>.
            </p>
          </div>

          {/* Progress Circular Capsule */}
          <div className="flex items-center gap-4 bg-[#081028] p-3.5 rounded-2xl border border-[#1b2b54] shrink-0 shadow-lg">
            <div className="flex flex-col">
              <span className="font-['JetBrains_Mono'] text-[11px] text-[#849396] uppercase">
                AVANCE GLOBAL:
              </span>
              <span className="font-['Space_Grotesk'] text-[24px] font-bold text-[#00fe66]">
                {overallProgress}% COMPLETADO
              </span>
              <span className="font-['JetBrains_Mono'] text-[10px] text-[#00e5ff]">
                FASE 3 DE 5 EN PROGRESO
              </span>
            </div>

            <div className="w-14 h-14 rounded-full bg-[#060b1c] border-2 border-[#00fe66]/50 flex items-center justify-center text-[#00fe66] shadow-[0_0_15px_rgba(0,254,102,0.3)]">
              <Zap className="w-6 h-6 animate-pulse" />
            </div>
          </div>
        </div>
      </div>

      {/* ================================================================== */}
      {/* 2. CATEGORY FILTERS & LEGEND                                       */}
      {/* ================================================================== */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-[#1b2850]">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar font-['JetBrains_Mono'] text-[11px]">
          <span className="text-[#849396] mr-1 hidden sm:inline">Filtrar:</span>
          {[
            { id: 'all', label: 'Todas las Fases (5)' },
            { id: 'architecture', label: 'Arquitectura' },
            { id: 'database', label: 'Base de Datos Aislada' },
            { id: 'security', label: 'Seguridad y Auditoría' },
            { id: 'production', label: 'Despliegue y Entrega' },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilterCategory(f.id)}
              className={`px-3 py-1.5 rounded-lg transition-all font-semibold ${
                filterCategory === f.id
                  ? 'bg-[#00e5ff] text-[#00363d] shadow-[0_0_10px_rgba(0,229,255,0.3)]'
                  : 'bg-[#101836] text-[#bac9cc] hover:text-[#dce1ff]'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 font-['JetBrains_Mono'] text-[11px]">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#00fe66] animate-pulse shadow-[0_0_8px_#00fe66]"></span>
            <span className="text-[#00fe66] font-semibold">Completado (#00FF66)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#00e5ff] animate-ping shadow-[0_0_8px_#00e5ff]"></span>
            <span className="text-[#00e5ff] font-semibold">En Ejecución (#00E5FF)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#404d6d]"></span>
            <span className="text-[#849396]">Próximo</span>
          </div>
        </div>
      </div>

      {/* ================================================================== */}
      {/* 3. VERTICAL GLOWING TIMELINE & DETAILS SPLIT                       */}
      {/* ================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Vertical Glowing Timeline (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <div className="relative pl-6 sm:pl-8 flex flex-col gap-6 before:content-[''] before:absolute before:left-3 sm:before:left-4 before:top-4 before:bottom-4 before:w-0.5 before:bg-gradient-to-b before:from-[#00fe66] before:via-[#00e5ff] before:to-[#22335f]">
            {filteredRoadmap.map((item) => {
              const isSelected = item.id === selectedSprint.id;
              const isCompleted = item.status === 'completed';
              const isActive = item.status === 'active';
              const isUpcoming = item.status === 'upcoming';

              return (
                <div
                  key={item.id}
                  onClick={() => setSelectedSprintId(item.id)}
                  className={`relative cursor-pointer group rounded-2xl p-4 sm:p-5 transition-all border ${
                    isSelected
                      ? 'bg-[#121c3b] border-[#00e5ff] shadow-[0_0_25px_rgba(0,229,255,0.25)] scale-[1.01]'
                      : 'bg-[#0c142e]/90 border-[#1a2850] hover:border-[#00e5ff]/50 hover:bg-[#101b3d]'
                  }`}
                >
                  {/* Glowing Pulse Node on the Vertical Line */}
                  <div className="absolute -left-[30px] sm:-left-[38px] top-6 flex items-center justify-center">
                    {isCompleted && (
                      <div className="relative">
                        <span className="w-5 h-5 rounded-full bg-[#00FF66] flex items-center justify-center text-[#00363d] shadow-[0_0_20px_#00FF66] animate-pulse">
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#00363d]" />
                        </span>
                        <span className="absolute -inset-1.5 rounded-full bg-[#00FF66]/40 animate-ping pointer-events-none"></span>
                      </div>
                    )}

                    {isActive && (
                      <div className="relative">
                        <span className="w-5 h-5 rounded-full bg-[#00E5FF] flex items-center justify-center text-[#00363d] shadow-[0_0_20px_#00E5FF]">
                          <span className="w-2.5 h-2.5 rounded-full bg-white animate-ping"></span>
                        </span>
                        <span className="absolute -inset-2 rounded-full bg-[#00E5FF]/50 animate-pulse pointer-events-none"></span>
                      </div>
                    )}

                    {isUpcoming && (
                      <span className="w-4 h-4 rounded-full bg-[#182346] border-2 border-[#404d6d] shadow-sm"></span>
                    )}
                  </div>

                  {/* Sprint Card Header */}
                  <div className="flex flex-col gap-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-['JetBrains_Mono'] text-[10px] uppercase tracking-wider text-[#00daf3] font-bold">
                        {item.phaseCode}
                      </span>

                      <div className="flex items-center gap-1.5">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-['JetBrains_Mono'] font-bold uppercase tracking-wider ${
                            isCompleted
                              ? 'bg-[#00fe66]/20 text-[#00fe66] border border-[#00fe66]/40'
                              : isActive
                              ? 'bg-[#00e5ff]/20 text-[#00e5ff] border border-[#00e5ff]/40 animate-pulse'
                              : 'bg-[#1d2747] text-[#849396] border border-[#2b3a69]'
                          }`}
                        >
                          {isCompleted
                            ? 'COMPLETADO'
                            : isActive
                            ? 'EN EJECUCIÓN // ACTIVO'
                            : 'PROGRAMADO'}
                        </span>
                      </div>
                    </div>

                    <h3 className="font-['Space_Grotesk'] text-[17px] font-bold text-[#dce1ff] group-hover:text-[#00e5ff] transition-colors">
                      {item.title}
                    </h3>

                    <p className="font-['Inter'] text-[12px] text-[#849396] line-clamp-2">
                      {item.subtitle}
                    </p>

                    {/* Progress Bar in Card */}
                    <div className="w-full bg-[#060b1a] h-1.5 rounded-full overflow-hidden mt-1">
                      <div
                        className={`h-full transition-all duration-500 ${
                          isCompleted
                            ? 'bg-[#00fe66] shadow-[0_0_8px_#00fe66]'
                            : isActive
                            ? 'bg-gradient-to-r from-[#00e5ff] to-[#00fe66] shadow-[0_0_8px_#00e5ff]'
                            : 'bg-[#29375e]'
                        }`}
                        style={{ width: `${item.progress}%` }}
                      ></div>
                    </div>

                    {/* Metadata Footer */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#18264d] font-['JetBrains_Mono'] text-[10px] text-[#849396]">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3 h-3 text-[#00daf3]" />
                        <span>{item.startDate} — {item.targetDate}</span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <User className="w-3 h-3 text-[#00fe66]" />
                        <span className="text-[#dce1ff]">{item.architectLead}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Interactive Detail Card (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <div className="sticky top-20 rounded-2xl bg-[#09112a] border-2 border-[#00e5ff]/50 p-5 sm:p-6 shadow-2xl flex flex-col gap-5 backdrop-blur-xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#1b2b52]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#141f42] border border-[#00e5ff]/40 flex items-center justify-center text-[#00e5ff]">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-['Space_Grotesk'] text-[16px] font-bold text-[#dce1ff]">
                    Detalles de la Fase Seleccionada
                  </h4>
                  <span className="font-['JetBrains_Mono'] text-[10px] text-[#00daf3]">
                    {selectedSprint.id.toUpperCase()}
                  </span>
                </div>
              </div>

              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-['JetBrains_Mono'] font-bold uppercase ${
                  selectedSprint.status === 'completed'
                    ? 'bg-[#00fe66]/20 text-[#00fe66]'
                    : selectedSprint.status === 'active'
                    ? 'bg-[#00e5ff]/20 text-[#00e5ff]'
                    : 'bg-[#1e2849] text-[#849396]'
                }`}
              >
                {selectedSprint.progress}%
              </span>
            </div>

            {/* Sprint Summary */}
            <div className="flex flex-col gap-2">
              <h3 className="font-['Space_Grotesk'] text-[19px] font-bold text-[#dce1ff]">
                {selectedSprint.title}
              </h3>
              <p className="font-['Inter'] text-[12px] text-[#bac9cc] leading-relaxed">
                {selectedSprint.description}
              </p>
            </div>

            {/* Deliverables Checklist */}
            <div className="flex flex-col gap-2.5 bg-[#050a1c] p-4 rounded-xl border border-[#16254a]">
              <div className="flex items-center justify-between font-['JetBrains_Mono'] text-[11px] text-[#849396]">
                <span>ENTREGABLES Y LISTA DE VERIFICACIÓN:</span>
                <span className="text-[#00fe66]">
                  {selectedSprint.deliverables.filter((d) => d.done).length} de {selectedSprint.deliverables.length} Completados
                </span>
              </div>

              <div className="flex flex-col gap-2 font-['Inter'] text-[12px]">
                {selectedSprint.deliverables.map((del, idx) => (
                  <div key={idx} className="flex items-start gap-2.5">
                    <div
                      className={`w-4 h-4 rounded mt-0.5 flex items-center justify-center text-[10px] shrink-0 ${
                        del.done
                          ? 'bg-[#00fe66] text-[#00363d] shadow-[0_0_8px_#00fe66]'
                          : 'bg-[#162142] border border-[#2b3a69] text-[#849396]'
                      }`}
                    >
                      {del.done ? '✓' : ''}
                    </div>
                    <span className={del.done ? 'text-[#dce1ff]' : 'text-[#849396]'}>
                      {del.text}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Cryptographic & SLA Guarantees */}
            <div className="flex flex-col gap-2 font-['JetBrains_Mono'] text-[11px]">
              <div className="p-3 bg-[#0d1636] rounded-xl border border-[#1d2b54] flex flex-col gap-1">
                <div className="flex items-center justify-between text-[#849396]">
                  <span>HASH CRIPTOGRÁFICO:</span>
                  <GitCommit className="w-3.5 h-3.5 text-[#00daf3]" />
                </div>
                <div className="text-[#00e5ff] text-[10px] break-all font-semibold">
                  {selectedSprint.commitHash}
                </div>
              </div>

              <div className="p-3 bg-[#0d1636] rounded-xl border border-[#1d2b54] flex items-center justify-between">
                <span className="text-[#849396]">GARANTÍA SLA:</span>
                <span className="text-[#00fe66] font-bold">{selectedSprint.slaVerification}</span>
              </div>

              <div className="p-3 bg-[#0d1636] rounded-xl border border-[#1d2b54] flex items-center justify-between">
                <span className="text-[#849396]">RESPONSABLE PRINCIPAL:</span>
                <span className="text-[#dce1ff] font-semibold">{selectedSprint.architectLead}</span>
              </div>
            </div>

            {/* Action Trigger */}
            <button
              onClick={() => {
                if (showToast) {
                  showToast(`Consulta de auditoría forense solicitada para ${selectedSprint.phaseCode}`);
                }
              }}
              className="w-full py-2.5 rounded-xl bg-[#141f42] hover:bg-[#1d2c5e] text-[#00e5ff] border border-[#00e5ff]/30 font-['JetBrains_Mono'] text-[11px] font-semibold transition-all flex items-center justify-center gap-1.5"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-[#00fe66]" />
              <span>Verificar Certificado de la Fase</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
