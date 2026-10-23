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

const INITIAL_LOGS: SystemAuditLog[] = [
  {
    id: 'LOG-9921',
    timestamp: new Date(Date.now() - 1000 * 45).toLocaleTimeString(),
    event_type: 'HSM_ROOT_BOOT',
    severity: 'success',
    actor: 'jefe@mrcasolutions.com',
    ip_address: '10.0.4.1 (CDMX Enclave)',
    description: 'Hardware Security Module YubiHSM2 sincronizado con certificado TLS 1.3 ECDSA P-384.',
    metadata: { hsm_id: 'YUBI-MX-01', status: 'LOCKED' },
  },
  {
    id: 'LOG-9920',
    timestamp: new Date(Date.now() - 1000 * 120).toLocaleTimeString(),
    event_type: 'CONTRACT_SIGNED',
    severity: 'success',
    actor: 'cliente@enterprise.corp',
    ip_address: '187.190.22.41 (Monterrey, MX)',
    description: 'Cliente completó firma criptográfica digital para Contrato Maestro NDA.',
    metadata: { contract_id: 'CTR-B2B-902', signature_method: 'ECDSA Canvas Pad' },
  },
  {
    id: 'LOG-9919',
    timestamp: new Date(Date.now() - 1000 * 240).toLocaleTimeString(),
    event_type: 'SPEI_VERIFICATION',
    severity: 'info',
    actor: 'Banxico STP Concentradora',
    ip_address: '10.0.12.8 (Nu Mexico Gateway)',
    description: 'Aviso CEP Banxico recibido para factura INV-8921 ($350,000 MXN) en cuenta concentradora.',
    metadata: { clabe: '638180000123456789', status: 'VERIFIED' },
  },
  {
    id: 'LOG-9918',
    timestamp: new Date(Date.now() - 1000 * 380).toLocaleTimeString(),
    event_type: 'LOGIN_ATTEMPT',
    severity: 'warning',
    actor: 'probe_recon_daemon',
    ip_address: '45.134.140.12 (Extranjero)',
    description: 'Intento de enumeración en puerto de administración repelido por Cilium eBPF y Fail2ban.',
    metadata: { port: 22, policy: 'ZERO_TRUST_DROP' },
  },
  {
    id: 'LOG-9917',
    timestamp: new Date(Date.now() - 1000 * 500).toLocaleTimeString(),
    event_type: 'VAULT_DECRYPT',
    severity: 'success',
    actor: 'cliente@enterprise.corp',
    ip_address: '187.190.22.41 (Monterrey, MX)',
    description: 'Desbloqueo de clave AES-256 para entregable schema_postgresql_zero_trust_with_rls.sql.',
    metadata: { file_id: 'VF-02', sha256_match: true },
  },
  {
    id: 'LOG-9916',
    timestamp: new Date(Date.now() - 1000 * 680).toLocaleTimeString(),
    event_type: 'POLICY_VIOLATION',
    severity: 'critical',
    actor: 'unauthorized_subdomain_req',
    ip_address: '194.26.29.112 (Tor Exit Node)',
    description: 'Solicitud con token manipulado bloqueada en el Reverse Proxy Envoy. IP colocada en cuarentena.',
    metadata: { http_status: 403, action: 'GLOBAL_REVOKE_TRIGGER' },
  },
];

export const AdminAuditLogs: React.FC<AdminAuditLogsProps> = ({ showToast }) => {
  const [logs, setLogs] = useState<SystemAuditLog[]>(INITIAL_LOGS);
  const [filterSeverity, setFilterSeverity] = useState<'all' | 'success' | 'info' | 'warning' | 'critical'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLiveStream, setIsLiveStream] = useState(true);

  // Simulated continuous live event stream
  useEffect(() => {
    if (!isLiveStream) return;

    const streamEvents: Array<{
      event_type: string;
      severity: 'success' | 'info' | 'warning' | 'critical';
      actor: string;
      ip_address: string;
      description: string;
    }> = [
      {
        event_type: 'FIDO2_TOKEN_VALIDATED',
        severity: 'success',
        actor: 'socio@mrcasolutions.com',
        ip_address: '10.0.4.2 (Cluster Alpha)',
        description: 'Autenticación biométrica WebAuthn FIDO2 validada para sesión de superadministrador.',
      },
      {
        event_type: 'API_KEY_ROTATED',
        severity: 'info',
        actor: 'cliente@enterprise.corp',
        ip_address: '187.190.22.41',
        description: 'Rotación de secreto mrca_live_**** ejecutada con periodo de gracia de 24h.',
      },
      {
        event_type: 'RATE_LIMIT_HIT',
        severity: 'warning',
        actor: 'bot_crawler_unverified',
        ip_address: '89.248.165.71',
        description: 'Excedido límite de peticiones por minuto en /api/v1/healthcheck. Throttling aplicado.',
      },
      {
        event_type: 'BACKUP_SNAPSHOT_SEALED',
        severity: 'success',
        actor: 'Automated PostgreSQL Cron',
        ip_address: '10.0.2.14',
        description: 'Snapshot inmutable de base de datos cifrado con clave PGP y enviado a cold storage.',
      },
    ];

    let counter = 0;
    const interval = setInterval(() => {
      const template = streamEvents[counter % streamEvents.length];
      const newLog: SystemAuditLog = {
        id: `LOG-${Math.floor(Math.random() * 8000 + 2000)}`,
        timestamp: new Date().toLocaleTimeString(),
        event_type: template.event_type,
        severity: template.severity,
        actor: template.actor,
        ip_address: template.ip_address,
        description: template.description,
        metadata: { live_stream: true },
      };

      setLogs((prev) => [newLog, ...prev.slice(0, 49)]); // Keep latest 50
      counter++;
    }, 7000);

    return () => clearInterval(interval);
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
      showToast('Registro de auditoría Zero-Trust exportado con firma criptográfica.');
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
            SUCCESS
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
            WARNING
          </span>
        );
      case 'critical':
        return (
          <span className="px-2 py-0.5 rounded bg-[#FF3366]/20 text-[#FF5555] border border-[#FF3366]/40 font-['JetBrains_Mono'] text-[10px] font-bold flex items-center gap-1 animate-pulse">
            <ShieldAlert className="w-3 h-3" />
            CRITICAL
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
                AUDITORÍA CONTINUA ZERO-TRUST // KERNEL LOGS
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
              <span>{isLiveStream ? 'STREAM ACTIVO (PAUSAR)' : 'REANUDAR STREAM'}</span>
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
                {sev === 'all' ? 'TODOS' : sev}
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
                <th className="py-3 px-4">DESCRIPCIÓN DEL EVENTO ZERO-TRUST</th>
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

        {filteredLogs.length === 0 && (
          <div className="p-8 text-center text-[#849396] font-['JetBrains_Mono'] text-[12px]">
            No se encontraron eventos coincidentes con los criterios de búsqueda.
          </div>
        )}
      </section>
    </div>
  );
};
