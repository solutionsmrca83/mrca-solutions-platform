import React, { useState, useEffect } from 'react';
import {
  Activity,
  Server,
  Database,
  ShieldCheck,
  Cpu,
  RefreshCw,
  CheckCircle2,
  Lock,
  Wifi
} from 'lucide-react';
import { SystemHealthService } from '../types';

interface SystemHealthWidgetProps {
  className?: string;
}

const DEFAULT_SERVICES: SystemHealthService[] = [
  {
    id: 'srv-api-backend',
    name: 'API Backend (Cluster Alpha)',
    category: 'Next.js 15 / Rust Core',
    status: 'operational',
    uptime: '99.98%',
    latency: '11.8 ms',
    lastChecked: 'Hace 3 seg',
  },
  {
    id: 'srv-db-rls',
    name: 'Bases de Datos PostgreSQL (RLS)',
    category: 'Supabase Enterprise mTLS',
    status: 'operational',
    uptime: '99.99%',
    latency: '4.2 ms',
    lastChecked: 'Hace 2 seg',
  },
  {
    id: 'srv-microservices',
    name: 'Microservicios Cloud & eBPF',
    category: 'Cilium Network Mesh',
    status: 'operational',
    uptime: '99.95%',
    latency: '8.4 ms',
    lastChecked: 'Hace 5 seg',
  },
  {
    id: 'srv-vault-hsm',
    name: 'Bóveda Criptográfica HSM',
    category: 'FIPS 140-3 Hardware Enclave',
    status: 'operational',
    uptime: '100.0%',
    latency: '1.9 ms',
    lastChecked: 'Hace 1 seg',
  },
];

export const SystemHealthWidget: React.FC<SystemHealthWidgetProps> = ({ className = '' }) => {
  const [services, setServices] = useState<SystemHealthService[]>(DEFAULT_SERVICES);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastHeartbeat, setLastHeartbeat] = useState<string>('Sincronizado');

  useEffect(() => {
    // Dynamic micro-jitter to simulate live sub-second monitoring
    const interval = setInterval(() => {
      setServices((prev) =>
        prev.map((s) => ({
          ...s,
          latency: `${(parseFloat(s.latency) + (Math.random() * 0.4 - 0.2)).toFixed(1)} ms`,
        }))
      );
      setLastHeartbeat(`Latido a las ${new Date().toLocaleTimeString('es-MX', { hour12: false })}`);
    }, 4500);

    return () => clearInterval(interval);
  }, []);

  const handleManualRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      setLastHeartbeat(`Auditado a las ${new Date().toLocaleTimeString('es-MX', { hour12: false })}`);
    }, 600);
  };

  return (
    <div
      className={`relative rounded-3xl bg-gradient-to-r from-[#141a32]/95 via-[#0b1432]/90 to-[#141a32]/95 border-2 border-[#00E5FF]/40 p-5 sm:p-6 shadow-[0_10px_35px_rgba(0,229,255,0.18)] backdrop-blur-xl overflow-hidden ${className}`}
    >
      {/* Background cyber accent glow */}
      <div className="absolute top-0 right-0 w-80 h-full bg-gradient-to-l from-[#00FF66]/10 to-transparent pointer-events-none"></div>

      {/* Header */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#1b2a52]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#060e22] border border-[#00E5FF]/50 flex items-center justify-center text-[#00E5FF] shadow-[0_0_15px_rgba(0,229,255,0.3)]">
            <Activity className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-['Space_Grotesk'] text-[17px] sm:text-[19px] font-bold text-[#dce1ff]">
                Estado de sus Sistemas
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-[#00FF66]/15 border border-[#00FF66]/40 text-[#00FF66] font-['JetBrains_Mono'] text-[10px] font-bold tracking-wider uppercase">
                99.9% UPTIME ACTIVO
              </span>
            </div>
            <p className="font-['Inter'] text-[12px] text-[#bac9cc]">
              Monitoreo telemétrico continuo de la infraestructura de su empresa con alta disponibilidad.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="font-['JetBrains_Mono'] text-[10px] text-[#849396] hidden sm:inline">
            {lastHeartbeat}
          </span>
          <button
            type="button"
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className="p-2 rounded-xl bg-[#0d1633] hover:bg-[#182348] text-[#bac9cc] hover:text-[#00E5FF] border border-[#1e2d58] transition-all"
            title="Sondear latencia del cluster"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-[#00E5FF]' : ''}`} />
          </button>
        </div>
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 pt-4 relative z-10">
        {services.map((srv) => (
          <div
            key={srv.id}
            className="rounded-2xl bg-[#070f24]/90 border border-[#17254a] hover:border-[#00E5FF]/50 p-4 transition-all duration-300 hover:shadow-[0_0_20px_rgba(0,229,255,0.2)] flex flex-col justify-between gap-3 group"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                {srv.id.includes('api') && <Server className="w-4 h-4 text-[#00E5FF]" />}
                {srv.id.includes('db') && <Database className="w-4 h-4 text-[#00E5FF]" />}
                {srv.id.includes('micro') && <Cpu className="w-4 h-4 text-[#00E5FF]" />}
                {srv.id.includes('vault') && <Lock className="w-4 h-4 text-[#00E5FF]" />}
                <span className="font-['Space_Grotesk'] text-[13px] font-bold text-[#dce1ff] group-hover:text-[#00E5FF] transition-colors line-clamp-1">
                  {srv.name}
                </span>
              </div>

              {/* Pulsing Terminal Green Dot indicating 99.9% Uptime */}
              <div className="flex items-center gap-1.5 shrink-0" title="99.9% Uptime garantizado">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00FF66] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#00FF66] shadow-[0_0_8px_#00FF66]"></span>
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-1 font-['JetBrains_Mono'] text-[10px]">
              <div className="flex justify-between text-[#849396]">
                <span>ARQUITECTURA:</span>
                <span className="text-[#bac9cc]">{srv.category}</span>
              </div>
              <div className="flex justify-between text-[#849396]">
                <span>DISPONIBILIDAD:</span>
                <span className="text-[#00FF66] font-bold">{srv.uptime}</span>
              </div>
              <div className="flex justify-between text-[#849396]">
                <span>LATENCIA p99:</span>
                <span className="text-[#00E5FF] font-semibold">{srv.latency}</span>
              </div>
            </div>

            <div className="pt-2 border-t border-[#141f3e] flex items-center justify-between font-['JetBrains_Mono'] text-[9px] text-[#849396]">
              <span className="flex items-center gap-1 text-[#00FF66]">
                <CheckCircle2 className="w-3 h-3 text-[#00FF66]" />
                OPERATIVO
              </span>
              <span>{srv.lastChecked}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
