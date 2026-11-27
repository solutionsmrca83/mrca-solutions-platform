import React, { useState, useEffect, useRef } from 'react';

interface TerminalLog {
  id: string;
  timestamp: string;
  tag: string;
  tagColor: 'green' | 'cyan' | 'red' | 'yellow' | 'purple' | 'slate';
  text: string;
}

const INITIAL_LOGS: TerminalLog[] = [
  { id: '1', timestamp: '04:12:01.002', tag: '[INICIO]', tagColor: 'slate', text: 'Subsistema de Defensa Perimetral inicializado. Núcleo de seguridad en línea.' },
  { id: '2', timestamp: '04:12:02.190', tag: '[RED]', tagColor: 'cyan', text: 'Inspección de tráfico cifrado activa en interfaz principal. Verificando conexiones TLS...' },
  { id: '3', timestamp: '04:12:04.812', tag: '[WAF]', tagColor: 'yellow', text: 'Regla 942100 activada: Solicitud entrante validada contra filtros de seguridad.' },
  { id: '4', timestamp: '04:12:05.109', tag: '[BLOQUEO]', tagColor: 'red', text: 'BLOQUEO origen=189.24.11.8 puerto=443 (Nodo externo no autorizado).' },
  { id: '5', timestamp: '04:12:07.441', tag: '[FIRMA]', tagColor: 'cyan', text: 'Integridad firmada 0x889dfa1120 con módulo criptográfico FIPS 140-3.' },
  { id: '6', timestamp: '04:12:09.912', tag: '[ACCESO]', tagColor: 'green', text: 'Sesión administrativa renovada con cifrado ECDSA-512 para Dirección.' },
  { id: '7', timestamp: '04:12:12.302', tag: '[DEFENSA]', tagColor: 'green', text: 'Política de aislamiento de red aplicada: Base de datos protegida contra tráfico externo.' },
  { id: '8', timestamp: '04:12:15.820', tag: '[SINCRONIZACIÓN]', tagColor: 'green', text: 'Notificación de pago verificada mediante firma criptográfica HMAC-SHA256.' },
];

const PERIODIC_LOG_TEMPLATES = [
  { tag: '[BLOQUEO]', tagColor: 'red' as const, text: 'Conexión descartada desde red externa: Sondeo TLS anómalo bloqueado.' },
  { tag: '[SPEI-BZX]', tagColor: 'green' as const, text: 'Validación CEP verificada ante Banco de México.' },
  { tag: '[AUDITORÍA]', tagColor: 'slate' as const, text: 'Verificación de sesión administrativa activa y cifrada.' },
  { tag: '[BÓVEDA]', tagColor: 'cyan' as const, text: 'Rotación preventiva de llaves validada: 99.98% integridad criptográfica.' },
  { tag: '[REDUNDANCIA]', tagColor: 'green' as const, text: 'Sin anomalías detectadas en los nodos de servicios corporativos (128 hilos).' },
  { tag: '[WAF]', tagColor: 'yellow' as const, text: 'Evaluación preventiva de reglas de seguridad completada. Estado: Limpio.' },
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
      replyText = 'Comandos disponibles: status, red, firewall, hsm, quorum, pagos, clear';
    } else if (lower === 'status') {
      replyText = 'SISTEMA MRCA SOLUTIONS: 100% EN LÍNEA. Latencia: 1.14ms. SOC-2 Tipo II Activo.';
    } else if (lower === 'nids' || lower === 'red') {
      replyText = 'Defensa Perimetral: 14 análisis activos. 2,410 IPs bloqueadas. 0 vulnerabilidades críticas.';
    } else if (lower === 'iptables' || lower === 'firewall') {
      replyText = 'Política de entrada activa: Bloqueo automático a tráfico externo no autenticado.';
    } else if (lower === 'hsm') {
      replyText = 'Módulo de seguridad FIPS 140-3: ACTIVO. Firma ECDSA P-384 verificada.';
    } else if (lower === 'quorum') {
      replyText = 'Resguardo Distribuido: 3/5 nodos activos. Clave maestra protegida por quórum.';
    } else if (lower === 'payout' || lower === 'pagos') {
      replyText = 'Conciliación: Stripe $914,500 MXN / Banxico SPEI $514,450 MXN. Registros sincronizados.';
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
            mrca@defensa-red:~/monitoreo-en-vivo TTY-1
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
            {isLive ? 'EN VIVO' : 'PAUSADO'}
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
          placeholder="Escribe un comando (ej: help, status, red, hsm, clear)..."
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
        <span>INSPECCIÓN DE PAQUETES: DOBLE NÚCLEO ACTIVO</span>
        <span className="text-[#00fe66]">0 PAQUETES PERDIDOS</span>
      </div>
    </div>
  );
};
