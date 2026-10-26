import React, { useState, useEffect, useRef } from 'react';

interface TerminalLog {
  id: string;
  timestamp: string;
  tag: string;
  tagColor: 'green' | 'cyan' | 'red' | 'yellow' | 'purple' | 'slate';
  text: string;
}

const INITIAL_LOGS: TerminalLog[] = [
  { id: '1', timestamp: '04:12:01.002', tag: '[BOOT]', tagColor: 'slate', text: 'Kali Defense Subsystem Initialized. Zero-Trust Kernel OK.' },
  { id: '2', timestamp: '04:12:02.190', tag: '[eBPF]', tagColor: 'cyan', text: 'Hooked into eth0 socket filter. Profiling TCP handshakes...' },
  { id: '3', timestamp: '04:12:04.812', tag: '[WAF]', tagColor: 'yellow', text: 'Rule 942100 triggered: Inbound payload evaluated against SQLi AST parser.' },
  { id: '4', timestamp: '04:12:05.109', tag: '[IPTABLES]', tagColor: 'red', text: 'DROP src=189.24.11.8 proto=TCP dport=443 (Known Malicious Relay).' },
  { id: '5', timestamp: '04:12:07.441', tag: '[ECDSA]', tagColor: 'cyan', text: 'Signed payload hash 0x889dfa1120 with Yubi-HSM slot 0x01.' },
  { id: '6', timestamp: '04:12:09.912', tag: '[AUTH]', tagColor: 'green', text: 'SuperAdmin session refreshed: token JWT-ECDSA-512 for Jefe & Socio.' },
  { id: '7', timestamp: '04:12:12.302', tag: '[NIDS]', tagColor: 'green', text: 'Cilium eBPF network policy enforced: Isolated database subnet from egress 0.0.0.0/0.' },
  { id: '8', timestamp: '04:12:15.820', tag: '[SYNC]', tagColor: 'green', text: 'Stripe Webhook event: evt_3N82b99214a verified via HMAC-SHA256.' },
];

const PERIODIC_LOG_TEMPLATES = [
  { tag: '[IPTABLES]', tagColor: 'red' as const, text: 'Packet drop from AS4837: Anomalous TLS SNI probe.' },
  { tag: '[SPEI-BZX]', tagColor: 'green' as const, text: 'CEP validation verified with Banco de México certificate authority.' },
  { tag: '[SSH-AUDIT]', tagColor: 'slate' as const, text: 'Session keepalive ACK: socio_superadmin (ed25519-sk-token).' },
  { tag: '[VAULT-HW]', tagColor: 'cyan' as const, text: 'HSM key rotatory check: entropy pool validated 99.98% TrueRNG.' },
  { tag: '[CILIUM]', tagColor: 'green' as const, text: 'Zero anomalous ingress across mesh microservices (128 threads).' },
  { tag: '[WAF]', tagColor: 'yellow' as const, text: 'ModSecurity zero-day rule evaluated. Status: Clean.' },
];

export const KaliTerminal: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const [logs, setLogs] = useState<TerminalLog[]>(INITIAL_LOGS);
  const [inputVal, setInputVal] = useState('');
  const [isLive, setIsLive] = useState(true);
  const logsContainerRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll internal terminal container ONLY (without hijacking window scroll)
  useEffect(() => {
    if (logsContainerRef.current) {
      logsContainerRef.current.scrollTop = logsContainerRef.current.scrollHeight;
    }
  }, [logs]);



  // Periodic simulated live packet stream
  useEffect(() => {
    if (!isLive) return;

    const interval = setInterval(() => {
      const now = new Date();
      const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}.${Math.floor(Math.random() * 900 + 100)}`;
      const template = PERIODIC_LOG_TEMPLATES[Math.floor(Math.random() * PERIODIC_LOG_TEMPLATES.length)];

      const newLog: TerminalLog = {
        id: String(Date.now()),
        timestamp: timeStr,
        tag: template.tag,
        tagColor: template.tagColor,
        text: template.text,
      };

      setLogs((prev) => [...prev.slice(-25), newLog]);
    }, 4000);

    return () => clearInterval(interval);
  }, [isLive]);

  const handleCommandSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cmd = inputVal.trim();
    if (!cmd) return;

    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}.${Math.floor(Math.random() * 900 + 100)}`;

    const userLog: TerminalLog = {
      id: String(Date.now()),
      timestamp: timeStr,
      tag: '[USER-EXEC]',
      tagColor: 'cyan',
      text: cmd,
    };

    let replyText = '';
    let replyTag = '[STDOUT]';
    let replyColor: 'green' | 'cyan' | 'red' | 'yellow' | 'slate' = 'green';

    const lower = cmd.toLowerCase();
    if (lower === 'clear') {
      setLogs([]);
      setInputVal('');
      return;
    } else if (lower === 'help') {
      replyText = 'Comandos disponibles: status, nids, iptables, hsm, quorum, payout, ping, clear';
    } else if (lower === 'status') {
      replyText = 'SISTEMA MRCA SOLUTIONS: 100% OPERACIONAL. Latencia: 1.14ms. SOC-2 Nivel II Activo.';
    } else if (lower === 'nids') {
      replyText = 'Cilium eBPF: 14 scans activos. 2,410 IP bloqueadas. 0 vulnerabilidades críticas.';
    } else if (lower === 'iptables') {
      replyText = 'Chain INPUT (policy DROP). Default: Block all untrusted non-mTLS ingress.';
    } else if (lower === 'hsm') {
      replyText = 'YubiHSM 2 hardware enclave: LOCKED. Slot 0x01 ECDSA P-384 OK.';
    } else if (lower === 'quorum') {
      replyText = 'Shamir Secret Sharing: 3/5 nodos activos. Master key reconstructable.';
    } else if (lower === 'payout') {
      replyText = 'Escrow Sync: Stripe $914,500 MXN / Banxico SPEI $514,450 MXN. Ledger synced.';
    } else {
      replyText = `Comando ejecutado: "${cmd}". Subproceso finalizado con código 0.`;
      replyColor = 'cyan';
    }

    const replyLog: TerminalLog = {
      id: String(Date.now() + 1),
      timestamp: timeStr,
      tag: replyTag,
      tagColor: replyColor,
      text: replyText,
    };

    setLogs((prev) => [...prev, userLog, replyLog]);
    setInputVal('');
  };

  const getTagColorClass = (color: string) => {
    switch (color) {
      case 'red':
        return 'text-[#ffb4ab] font-bold';
      case 'green':
        return 'text-[#00fe66] font-semibold';
      case 'cyan':
        return 'text-[#00e5ff] font-semibold';
      case 'yellow':
        return 'text-[#ffd260] font-semibold';
      case 'purple':
        return 'text-[#c0c1ff]';
      default:
        return 'text-[#849396]';
    }
  };

  return (
    <div className="rounded-xl bg-[#060d24] border border-[#222941] p-3 md:p-4 shadow-2xl flex flex-col gap-2 font-['JetBrains_Mono']">
      {/* Terminal Title Bar */}
      <div className="flex items-center justify-between pb-1.5 border-b border-[#181e36]">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#ffb4ab]"></span>
          <span className="w-2.5 h-2.5 rounded-full bg-[#849396]"></span>
          <span className="w-2.5 h-2.5 rounded-full bg-[#00fe66]"></span>
          <span className="text-[11px] text-[#00e5ff] ml-1 truncate">
            mrca@kali-defense:~/nids-live TTY-1
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsLive(!isLive)}
            className={`text-[9px] px-2 py-0.5 rounded flex items-center gap-1 transition-colors ${
              isLive ? 'bg-[#00fe66]/15 text-[#00fe66]' : 'bg-[#222941] text-[#849396]'
            }`}
            title="Pausar o reanudar telemetría en vivo"
          >
            <span className={`w-1.5 h-1.5 rounded-full ${isLive ? 'bg-[#00fe66] animate-pulse' : 'bg-[#849396]'}`}></span>
            {isLive ? 'NIDS-LIVE' : 'PAUSADO'}
          </button>
          <span className="text-[9px] text-[#849396] hidden sm:inline">SHA-256</span>
        </div>
      </div>

      {/* Terminal Log Output Window */}
      <div
        ref={logsContainerRef}
        className={`${
          compact ? 'h-40' : 'h-72'
        } overflow-y-auto pr-1 flex flex-col gap-1 text-[11px] md:text-[12px] leading-relaxed text-[#dce1ff] select-text no-scrollbar`}
      >
        {logs.map((log) => (
          <div key={log.id} className="flex items-start gap-1.5 break-all">
            <span className="text-[#849396] shrink-0 text-[10px]">[{log.timestamp}]</span>
            <span className={`shrink-0 ${getTagColorClass(log.tagColor)}`}>{log.tag}</span>
            <span className="text-[#dce1ff]">{log.text}</span>
          </div>
        ))}
      </div>


      {/* Terminal Interactive Input Prompt */}
      <form onSubmit={handleCommandSubmit} className="flex items-center gap-1.5 pt-1 border-t border-[#181e36]">
        <span className="text-[#00e5ff] text-[12px] font-bold">&gt;</span>
        <input
          type="text"
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          placeholder="Escribe un comando (ej: help, status, nids, hsm, clear)..."
          className="w-full bg-transparent text-[12px] text-[#00e5ff] placeholder-[#3b494c] focus:outline-none font-['JetBrains_Mono']"
        />
        <button
          type="submit"
          className="text-[10px] uppercase px-2 py-0.5 rounded bg-[#181e36] hover:bg-[#222941] text-[#00e5ff] shrink-0 transition-colors"
        >
          Ejecutar
        </button>
      </form>

      {/* Status Footer Strip */}
      <div className="flex items-center justify-between text-[10px] text-[#849396] pt-1">
        <span>PACKET INSPECT: DUAL-CORE eBPF</span>
        <span className="text-[#00fe66]">0 DROPS BUFFER</span>
      </div>
    </div>
  );
};
