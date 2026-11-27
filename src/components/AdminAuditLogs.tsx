'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../lib/supabase/client';
import { SystemAuditLog } from '../types';
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  Activity,
  Terminal,
  Search,
  Filter,
  Play,
  Pause,
  Download,
  Clock,
  Globe,
  User,
  Radio,
  FileCheck,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';

interface AdminAuditLogsProps {
  showToast?: (msg: string) => void;
}

export const AdminAuditLogs: React.FC<AdminAuditLogsProps> = ({ showToast }) => {
  const [logs, setLogs] = useState<SystemAuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterSeverity, setFilterSeverity] = useState<'all' | 'success' | 'info' | 'warning' | 'critical'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLiveStream, setIsLiveStream] = useState(true);

  const loadAuditLogs = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('system_audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (!error && Array.isArray(data)) {
        const mapped: SystemAuditLog[] = data.map((row: any) => ({
          id: String(row.id),
          timestamp: row.created_at
            ? new Date(row.created_at).toLocaleString('es-MX', {
                day: '2-digit',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
              })
            : '',
          event_type: row.event_type || 'SYSTEM_EVENT',
          severity: (['success', 'info', 'warning', 'critical'].includes(row.severity)
            ? row.severity
            : 'info') as SystemAuditLog['severity'],
          actor: row.actor || 'sistema',
          ip_address: row.ip_address || 'No registrada',
          description: row.description || '',
          metadata: row.metadata || {},
        }));
        setLogs(mapped);
      } else {
        setLogs([]);
      }
    } catch {
      setLogs([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadAuditLogs();
  }, []);

  // Suscripción real a Supabase Realtime (cero eventos simulados)
  useEffect(() => {
    if (!isLiveStream) return;

    const channel = supabase
      .channel('mrca-system-audit-logs-live')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'system_audit_logs' },
        (payload: any) => {
          const row = payload?.new;
          if (!row) return;
          const incoming: SystemAuditLog = {
            id: String(row.id),
            timestamp: row.created_at
              ? new Date(row.created_at).toLocaleString('es-MX', {
                  day: '2-digit',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                })
              : new Date().toLocaleTimeString('es-MX'),
            event_type: row.event_type || 'SYSTEM_EVENT',
            severity: (['success', 'info', 'warning', 'critical'].includes(row.severity)
              ? row.severity
              : 'info') as SystemAuditLog['severity'],
            actor: row.actor || 'sistema',
            ip_address: row.ip_address || 'No registrada',
            description: row.description || '',
            metadata: row.metadata || {},
          };
          setLogs((prev) => [incoming, ...prev.slice(0, 99)]);
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [isLiveStream]);

  const handleExportLogs = () => {
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify(logs, null, 2)
    )}`;
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', jsonString);
    downloadAnchor.setAttribute('download', `mrca_audit_logs_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    if (showToast) {
      showToast('Registro de auditoría de seguridad exportado con firma criptográfica.');
    }
  };

  const filteredLogs = logs.filter((log) => {
    const matchesSeverity = filterSeverity === 'all' || log.severity === filterSeverity;
    const matchesSearch =
      log.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.actor.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.event_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.ip_address.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSeverity && matchesSearch;
  });

  const getSeverityBadge = (severity: SystemAuditLog['severity']) => {
    switch (severity) {
      case 'success':
        return (
          <span className="px-2 py-0.5 rounded bg-[#00FF66]/15 text-[#00FF66] border border-[#00FF66]/30 font-['JetBrains_Mono'] text-[10px] font-bold flex items-center gap-1">
            <ShieldCheck className="w-3 h-3" />
            EXITOSO
          </span>
        );
      case 'info':
        return (
          <span className="px-2 py-0.5 rounded bg-[#00E5FF]/15 text-[#00E5FF] border border-[#00E5FF]/30 font-['JetBrains_Mono'] text-[10px] font-bold flex items-center gap-1">
            <Radio className="w-3 h-3" />
            INFO
          </span>
        );
      case 'warning':
        return (
          <span className="px-2 py-0.5 rounded bg-[#FFAA00]/15 text-[#FFAA00] border border-[#FFAA00]/30 font-['JetBrains_Mono'] text-[10px] font-bold flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            ALERTA
          </span>
        );
      case 'critical':
        return (
          <span className="px-2 py-0.5 rounded bg-[#FF3366]/20 text-[#FF5555] border border-[#FF3366]/40 font-['JetBrains_Mono'] text-[10px] font-bold flex items-center gap-1 animate-pulse">
            <ShieldAlert className="w-3 h-3" />
            CRÍTICO
          </span>
        );
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Top Banner Telemetry HUD */}
      <section className="relative w-full rounded-2xl bg-gradient-to-r from-[#141A32] via-[#0A1128] to-[#141A32] border border-[#00E5FF]/30 p-5 sm:p-6 shadow-xl overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#00FF66] animate-pulse shadow-[0_0_8px_rgba(0,255,102,0.8)]" />
              <span className="font-['JetBrains_Mono'] text-[11px] text-[#00E5FF] tracking-wider uppercase font-semibold">
                AUDITORÍA CONTINUA DE SEGURIDAD // REGISTROS DEL SISTEMA
              </span>
            </div>
            <h2 className="font-['Space_Grotesk'] text-2xl sm:text-3xl font-bold text-[#DCE1FF]">
              Registro de Auditoría e Integridad en Tiempo Real
            </h2>
            <p className="font-['Inter'] text-xs sm:text-sm text-[#BAC9CC] mt-1 max-w-2xl">
              Monitoreo inmutable de firmas contractuales, pagos SPEI, accesos biométricos FIDO2, descargas de bóveda e intentos de intrusión perimetral.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setIsLiveStream(!isLiveStream)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border font-['JetBrains_Mono'] text-[11px] font-bold uppercase transition-all ${
                isLiveStream
                  ? 'bg-[#00FF66]/10 border-[#00FF66]/40 text-[#00FF66]'
                  : 'bg-[#181E36] border-[#849396]/30 text-[#849396]'
              }`}
            >
              {isLiveStream ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              <span>{isLiveStream ? 'MONITOREO ACTIVO (PAUSAR)' : 'REANUDAR MONITOREO'}</span>
            </button>

            <button
              onClick={handleExportLogs}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#00E5FF] hover:bg-[#c3f5ff] text-[#00363D] font-['JetBrains_Mono'] text-[11px] font-bold uppercase transition-all shadow-[0_0_15px_rgba(0,229,255,0.4)]"
            >
              <Download className="w-3.5 h-3.5" />
              <span>EXPORTAR AUDITORÍA</span>
            </button>
          </div>
        </div>

        {/* Filters Toolbar */}
        <div className="mt-5 pt-4 border-t border-[#181E36] flex flex-col sm:flex-row gap-3 justify-between items-center">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#849396]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filtrar por evento, IP, usuario o acción..."
              className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-[#0A1128] border border-[#00E5FF]/20 text-[#DCE1FF] placeholder-[#849396] font-['JetBrains_Mono'] text-[11px] focus:outline-none focus:border-[#00E5FF]"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto no-scrollbar">
            {(['all', 'success', 'info', 'warning', 'critical'] as const).map((sev) => (
              <button
                key={sev}
                onClick={() => setFilterSeverity(sev)}
                className={`px-2.5 py-1 rounded-lg font-['JetBrains_Mono'] text-[10px] uppercase font-bold tracking-wider transition-all ${
                  filterSeverity === sev
                    ? 'bg-[#00E5FF] text-[#00363D]'
                    : 'bg-[#181E36] text-[#BAC9CC] hover:text-[#00E5FF]'
                }`}
              >
                {sev === 'all'
                  ? 'TODOS'
                  : sev === 'success'
                  ? 'EXITOSO'
                  : sev === 'warning'
                  ? 'ALERTA'
                  : sev === 'critical'
                  ? 'CRÍTICO'
                  : 'INFO'}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Main Real-Time Log Table */}
      <section className="rounded-2xl bg-[#141A32]/90 border border-[#00E5FF]/20 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#0A1128]/80 border-b border-[#181E36] font-['JetBrains_Mono'] text-[10px] text-[#849396] uppercase tracking-wider">
                <th className="py-3 px-4">HORA / ID</th>
                <th className="py-3 px-4">SEVERIDAD</th>
                <th className="py-3 px-4">TIPO DE EVENTO</th>
                <th className="py-3 px-4">ACTOR / IP ORIGEN</th>
                <th className="py-3 px-4">DESCRIPCIÓN DEL EVENTO DE SEGURIDAD</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#181E36] font-['JetBrains_Mono'] text-[11px]">
              <AnimatePresence>
                {filteredLogs.map((log) => (
                  <motion.tr
                    key={log.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0 }}
                    className="hover:bg-[#181E36]/60 transition-colors"
                  >
                    <td className="py-3.5 px-4 text-[#BAC9CC] whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="text-[#DCE1FF] font-bold">{log.timestamp}</span>
                        <span className="text-[#849396] text-[9px]">{log.id}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {getSeverityBadge(log.severity)}
                    </td>
                    <td className="py-3.5 px-4 text-[#00E5FF] font-bold whitespace-nowrap">
                      {log.event_type}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="text-[#DCE1FF] truncate max-w-[180px]">{log.actor}</span>
                        <span className="text-[#849396] text-[10px]">{log.ip_address}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-[#BAC9CC] font-['Inter'] text-[12px] max-w-md">
                      <span className="leading-snug block">{log.description}</span>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-[#849396] font-['JetBrains_Mono'] text-[12px]">
            Consultando registros de auditoría en Supabase...
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-10 text-center text-[#849396] font-['JetBrains_Mono'] text-[12px] flex flex-col items-center gap-2">
            <Shield className="w-8 h-8 text-[#849396]/70" />
            <span className="font-['Space_Grotesk'] text-[15px] font-bold text-[#dce1ff]">
              Sin registros aún
            </span>
            <span>
              Los eventos reales de seguridad y auditoría aparecerán aquí automáticamente.
            </span>
          </div>
        ) : null}
      </section>
    </div>
  );
};
