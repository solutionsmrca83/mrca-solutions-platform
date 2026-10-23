import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Shield, 
  ShieldAlert, 
  ShieldCheck, 
  Terminal, 
  RefreshCw, 
  Search, 
  Filter, 
  Download, 
  Laptop, 
  Smartphone, 
  Globe, 
  Key, 
  Lock, 
  FileCheck2,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';

export interface AuditLogEntry {
  id: string;
  event: string;
  eventType: 'auth_success' | 'token_rotation' | 'mtls_handshake' | 'vault_access' | 'blocked_attempt' | 'contract_sign';
  ipAddress: string;
  ipLocation: string;
  deviceBrowser: string;
  os: string;
  timestamp: string;
  riskScore: 'SAFE' | 'LOW' | 'AUDITED' | 'BLOCKED';
  signatureHash: string;
}

const MOCK_AUDIT_LOGS: AuditLogEntry[] = [
  {
    id: 'LOG-89421',
    event: 'Inicio de Sesión Exitoso // MFA FIDO2',
    eventType: 'auth_success',
    ipAddress: '189.204.112.45',
    ipLocation: 'CDMX, México (Alestra B2B)',
    deviceBrowser: 'Chrome 131.0 // Enterprise',
    os: 'macOS Sonoma 14.7',
    timestamp: '2026-10-13 22:58:12 UTC',
    riskScore: 'SAFE',
    signatureHash: '0x8f2a...c914',
  },
  {
    id: 'LOG-89420',
    event: 'Descarga de Carga Útil Cifrada (Bóveda)',
    eventType: 'vault_access',
    ipAddress: '189.204.112.45',
    ipLocation: 'CDMX, México (Alestra B2B)',
    deviceBrowser: 'Chrome 131.0 // Enterprise',
    os: 'macOS Sonoma 14.7',
    timestamp: '2026-10-13 22:45:09 UTC',
    riskScore: 'SAFE',
    signatureHash: '0x3d7b...e490',
  },
  {
    id: 'LOG-89419',
    event: 'Rotación de API Key Maestra (HSM Nivel 4)',
    eventType: 'token_rotation',
    ipAddress: '200.68.139.12',
    ipLocation: 'Guadalajara, JAL (Totalplay Corp)',
    deviceBrowser: 'Firefox 132.0 ESR // Hardened',
    os: 'Ubuntu 24.04 LTS',
    timestamp: '2026-10-13 21:12:44 UTC',
    riskScore: 'AUDITED',
    signatureHash: '0x1c99...aa02',
  },
  {
    id: 'LOG-89418',
    event: 'Firma Digital de Contrato B2B (ECDSA)',
    eventType: 'contract_sign',
    ipAddress: '187.190.24.88',
    ipLocation: 'Monterrey, N.L. (Telmex Enterprise)',
    deviceBrowser: 'Safari 18.1 // TouchID Passkey',
    os: 'macOS Sequoia 15.0',
    timestamp: '2026-10-13 19:30:00 UTC',
    riskScore: 'SAFE',
    signatureHash: '0x44fa...7721',
  },
  {
    id: 'LOG-89417',
    event: 'Handshake mTLS de Microservicio Mutual TLS',
    eventType: 'mtls_handshake',
    ipAddress: '54.218.99.14',
    ipLocation: 'AWS US-West (Oregon VPC Gateway)',
    deviceBrowser: 'curl/8.9.1 // Golang Daemon',
    os: 'Linux Alpine (Docker Container)',
    timestamp: '2026-10-13 18:05:22 UTC',
    riskScore: 'SAFE',
    signatureHash: '0x00de...bb56',
  },
  {
    id: 'LOG-89416',
    event: 'Intento Bloqueado // IP No Autorizada',
    eventType: 'blocked_attempt',
    ipAddress: '91.240.118.82',
    ipLocation: 'San Petersburgo, RU (VPN Externa)',
    deviceBrowser: 'Python-requests/2.31',
    os: 'Linux x86_64',
    timestamp: '2026-10-13 16:40:11 UTC',
    riskScore: 'BLOCKED',
    signatureHash: '0xff41...0012',
  },
  {
    id: 'LOG-89415',
    event: 'Inicio de Sesión Exitoso // Token Sesión',
    eventType: 'auth_success',
    ipAddress: '189.204.112.45',
    ipLocation: 'CDMX, México (Alestra B2B)',
    deviceBrowser: 'Edge 130.0 // Windows Defender',
    os: 'Windows 11 Pro Enterprise',
    timestamp: '2026-10-13 14:15:02 UTC',
    riskScore: 'SAFE',
    signatureHash: '0x7e29...ff84',
  },
];

export const SecurityAuditLogs: React.FC<{
  clientCompany?: string;
  showToast?: (msg: string) => void;
}> = ({ clientCompany = 'FinTech Global B2B', showToast = (msg) => console.log(msg) }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const filteredLogs = MOCK_AUDIT_LOGS.filter((log) => {
    const matchesSearch =
      log.event.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.ipAddress.includes(searchTerm) ||
      log.deviceBrowser.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.ipLocation.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter = filterType === 'all' || log.eventType === filterType;

    return matchesSearch && matchesFilter;
  });

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      showToast('Registro de auditoría sincronizado con los nodos Zero-Trust.');
    }, 700);
  };

  const handleExport = () => {
    const jsonStr = JSON.stringify(filteredLogs, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-logs-${clientCompany.replace(/\s+/g, '_')}-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    showToast('Reporte de auditoría criptográfica exportado (JSON).');
  };

  return (
    <div className="w-full flex flex-col gap-5">
      {/* Top Banner HUD */}
      <div className="rounded-3xl bg-[#0a1128]/95 border border-[#00e5ff]/30 p-6 shadow-2xl backdrop-blur-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-[#060d24] border border-[#00e5ff]/40 flex items-center justify-center text-[#00e5ff] shadow-[0_0_20px_rgba(0,229,255,0.25)] shrink-0">
            <ShieldCheck className="w-6 h-6 text-[#00e5ff]" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-[#00fe66] animate-pulse shadow-[0_0_8px_#00fe66]" />
              <span className="font-['JetBrains_Mono'] text-[10px] text-[#00daf3] uppercase font-bold tracking-wider">
                BITÁCORA EN TIEMPO REAL // ZERO-TRUST AUDIT
              </span>
            </div>
            <h2 className="font-['Space_Grotesk'] text-[22px] font-bold text-[#dce1ff]">
              Registros de Seguridad & Auditoría
            </h2>
            <p className="font-['Inter'] text-[12px] text-[#bac9cc]">
              Monitoreo inmutable de accesos, llamadas a API, firmas criptográficas y eventos de red para <strong className="text-[#00e5ff]">{clientCompany}</strong>.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-stretch sm:self-auto">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#141a32] hover:bg-[#181e36] border border-[#3b494c] hover:border-[#00e5ff]/50 text-[#dce1ff] text-[12px] font-['JetBrains_Mono'] transition-all cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-[#00e5ff]' : ''}`} />
            <span>Sincronizar</span>
          </button>

          <button
            onClick={handleExport}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-[#00e5ff] hover:bg-[#c3f5ff] text-[#00363d] text-[12px] font-['JetBrains_Mono'] font-bold transition-all shadow-[0_0_15px_rgba(0,229,255,0.3)] cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Exportar Bitácora</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-[#849396]" />
          <input
            type="text"
            placeholder="Buscar por Evento, Dirección IP o Dispositivo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#060d24] border border-[#222941] focus:border-[#00e5ff] rounded-2xl pl-10 pr-4 py-2.5 text-[12px] text-[#dce1ff] focus:outline-none font-['JetBrains_Mono'] transition-colors"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-[#849396] hidden sm:block" />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="w-full sm:w-auto bg-[#060d24] border border-[#222941] focus:border-[#00e5ff] rounded-2xl px-3 py-2.5 text-[12px] text-[#dce1ff] focus:outline-none font-['JetBrains_Mono'] cursor-pointer"
          >
            <option value="all">Todos los Eventos (7)</option>
            <option value="auth_success">Inicios de Sesión</option>
            <option value="vault_access">Descargas de Bóveda</option>
            <option value="token_rotation">Rotación de Claves</option>
            <option value="contract_sign">Firmas de Contrato</option>
            <option value="mtls_handshake">Handshakes mTLS</option>
            <option value="blocked_attempt">Intentos Bloqueados</option>
          </select>
        </div>
      </div>

      {/* Sleek Dark-Themed Audit Table */}
      <div className="rounded-3xl bg-[#0a1128]/95 border border-[#222941] overflow-hidden shadow-2xl backdrop-blur-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#222941] bg-[#060d24]/90 font-['JetBrains_Mono'] text-[11px] uppercase tracking-wider text-[#849396]">
                <th className="py-3.5 px-4 sm:px-6">Evento Zero-Trust</th>
                <th className="py-3.5 px-4">Dirección IP & Origen</th>
                <th className="py-3.5 px-4">Dispositivo / Navegador</th>
                <th className="py-3.5 px-4">Timestamp (UTC)</th>
                <th className="py-3.5 px-4 sm:px-6 text-right">Firma SHA-256</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#181e36] font-['Inter'] text-[12px]">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-[#849396] font-['JetBrains_Mono']">
                    No se encontraron registros que coincidan con la búsqueda.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  const isBlocked = log.riskScore === 'BLOCKED';
                  const isAudited = log.riskScore === 'AUDITED';

                  return (
                    <tr 
                      key={log.id} 
                      className={`hover:bg-[#141a32]/60 transition-colors ${
                        isBlocked ? 'bg-red-950/10' : ''
                      }`}
                    >
                      {/* Event Column */}
                      <td className="py-4 px-4 sm:px-6">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                            isBlocked
                              ? 'bg-red-500/10 border border-red-500/30 text-red-400'
                              : isAudited
                              ? 'bg-amber-500/10 border border-amber-500/30 text-amber-400'
                              : 'bg-cyan-500/10 border border-cyan-500/30 text-[#00e5ff]'
                          }`}>
                            {isBlocked ? (
                              <ShieldAlert className="w-4 h-4" />
                            ) : isAudited ? (
                              <Key className="w-4 h-4" />
                            ) : (
                              <ShieldCheck className="w-4 h-4" />
                            )}
                          </div>
                          <div className="flex flex-col">
                            <span className="font-semibold text-[#dce1ff] leading-tight">
                              {log.event}
                            </span>
                            <span className="font-['JetBrains_Mono'] text-[10px] text-[#849396] mt-0.5">
                              ID: {log.id}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* IP Column */}
                      <td className="py-4 px-4 font-['JetBrains_Mono']">
                        <div className="flex flex-col">
                          <span className="font-bold text-[#00daf3] flex items-center gap-1.5">
                            <Globe className="w-3.5 h-3.5 text-[#849396]" />
                            {log.ipAddress}
                          </span>
                          <span className="text-[11px] text-[#849396] font-['Inter'] mt-0.5">
                            {log.ipLocation}
                          </span>
                        </div>
                      </td>

                      {/* Device / Browser Column */}
                      <td className="py-4 px-4 font-['JetBrains_Mono']">
                        <div className="flex flex-col">
                          <span className="text-[#dce1ff] text-[11px] flex items-center gap-1.5">
                            <Laptop className="w-3.5 h-3.5 text-[#849396]" />
                            {log.deviceBrowser}
                          </span>
                          <span className="text-[10px] text-[#849396] mt-0.5">
                            {log.os}
                          </span>
                        </div>
                      </td>

                      {/* Timestamp Column */}
                      <td className="py-4 px-4 font-['JetBrains_Mono'] text-[11px] text-[#bac9cc] whitespace-nowrap">
                        {log.timestamp}
                      </td>

                      {/* Cryptographic Hash Column */}
                      <td className="py-4 px-4 sm:px-6 text-right">
                        <span className="inline-block px-2.5 py-1 rounded bg-[#060d24] border border-[#222941] text-[#00fe66] font-['JetBrains_Mono'] text-[10px] select-all">
                          {log.signatureHash}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer Summary */}
        <div className="p-4 bg-[#060d24] border-t border-[#222941] flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] font-['JetBrains_Mono'] text-[#849396]">
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#00fe66] animate-pulse" />
            Integridad de Bitácora: Cifrado HMAC-SHA256 y Resguardo Inmutable WORM
          </span>
          <span>Mostrando {filteredLogs.length} de {MOCK_AUDIT_LOGS.length} eventos registrados</span>
        </div>
      </div>
    </div>
  );
};

export default SecurityAuditLogs;
