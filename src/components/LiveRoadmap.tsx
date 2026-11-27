import React, { useState, useEffect } from 'react';
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
import { supabase } from '../lib/supabase/client';
import { RoadmapItem, RoadmapStatus } from '../types';

interface LiveRoadmapProps {
  clientCompany?: string;
  showToast?: (msg: string) => void;
}

export const LiveRoadmap: React.FC<LiveRoadmapProps> = ({
  clientCompany = 'Cuenta Corporativa',
  showToast,
}) => {
  const [roadmap, setRoadmap] = useState<RoadmapItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSprintId, setSelectedSprintId] = useState<string>('');
  const [filterCategory, setFilterCategory] = useState<string>('all');

  useEffect(() => {
    let mounted = true;
    async function loadRealRoadmap() {
      setIsLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          if (mounted) setRoadmap([]);
          return;
        }
        const { data, error } = await supabase
          .from('client_project_proposals')
          .select('*')
          .eq('client_id', user.id)
          .order('submitted_at', { ascending: true });

        if (mounted && !error && Array.isArray(data) && data.length > 0) {
          const mapped: RoadmapItem[] = data.map((row: any, idx: number) => {
            const st: RoadmapStatus =
              row.status === 'accepted' ? 'active' : 'upcoming';
            const cat =
              row.category === 'databases'
                ? 'database'
                : row.category === 'security'
                ? 'security'
                : 'architecture';
            return {
              id: String(row.id),
              phaseCode: `FASE 0${idx + 1} // ${row.status === 'accepted' ? 'EN EJECUCIÓN' : 'EN REVISIÓN'}`,
              title: row.project_title || 'Proyecto Corporativo B2B',
              subtitle: row.budget_tier || 'Alcance técnico en curso',
              category: cat,
              status: st,
              progress: row.status === 'accepted' ? 50 : 0,
              startDate: row.submitted_at
                ? new Date(row.submitted_at).toLocaleDateString('es-MX')
                : 'Por definir',
              targetDate: 'Según cronograma contractual',
              description: row.description || 'Proyecto registrado en Supabase.',
              deliverables: [
                { text: 'Levantamiento y registro oficial en Supabase', done: true },
                { text: 'Validación técnica por Dirección de Ingeniería', done: row.status === 'accepted' },
              ],
              commitHash: String(row.id).slice(0, 12),
              architectLead: row.reviewer_notes || 'Equipo MRCA Solutions',
              slaVerification: row.status === 'accepted' ? 'PROYECTO AUTORIZADO' : 'EN REVISIÓN',
            };
          });
          setRoadmap(mapped);
          setSelectedSprintId(mapped[0].id);
        } else if (mounted) {
          setRoadmap([]);
          setSelectedSprintId('');
        }
      } catch {
        if (mounted) setRoadmap([]);
      } finally {
        if (mounted) setIsLoading(false);
      }
    }
    void loadRealRoadmap();
    return () => {
      mounted = false;
    };
  }, []);

  const filteredRoadmap = roadmap.filter((item) => {
    if (filterCategory === 'all') return true;
    return item.category === filterCategory;
  });

  const selectedSprint = roadmap.find((item) => item.id === selectedSprintId) || roadmap[0] || null;

  const overallProgress =
    roadmap.length > 0
      ? Math.round(roadmap.reduce((acc, curr) => acc + curr.progress, 0) / roadmap.length)
      : 0;

  if (!isLoading && roadmap.length === 0) {
    return (
      <div className="w-full rounded-3xl bg-[#091129]/95 border border-[#1b2b52] p-10 text-center flex flex-col items-center justify-center gap-3 shadow-xl">
        <div className="w-12 h-12 rounded-2xl bg-[#141a32] border border-[#00e5ff]/30 flex items-center justify-center text-[#00e5ff]">
          <Activity className="w-6 h-6" />
        </div>
        <h3 className="font-['Space_Grotesk'] text-[18px] font-bold text-[#dce1ff]">
          Sin fases de proyecto asignadas aún
        </h3>
        <p className="font-['Inter'] text-[13px] text-[#849396] max-w-md">
          Cuando tu proyecto B2B inicie ejecución con MRCA Solutions, podrás dar seguimiento en vivo a cada fase y entregable desde este panel.
        </p>
      </div>
    );
  }

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
              Monitoree el avance real de las fases registradas para su organización en Supabase.
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
                {roadmap.length} FASE(S) REGISTRADA(S)
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
            { id: 'all', label: `Todas las Fases (${roadmap.length})` },
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
            <span className="text-[#00fe66] font-semibold">Completado</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#00e5ff] animate-ping shadow-[0_0_8px_#00e5ff]"></span>
            <span className="text-[#00e5ff] font-semibold">En Ejecución</span>
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
              const isSelected = selectedSprint ? item.id === selectedSprint.id : false;
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
        {selectedSprint && (
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
        )}
      </div>
    </div>
  );
};
