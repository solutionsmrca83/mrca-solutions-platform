import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase/client';

interface TerminalLog {
  id: string;
  timestamp: string;
  tag: string;
  tagColor: 'green' | 'cyan' | 'red' | 'yellow' | 'purple' | 'slate';
  text: string;
}

function formatNowTime(): string {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
}

function severityToColor(severity?: string): TerminalLog['tagColor'] {
  if (severity === 'critical') return 'red';
  if (severity === 'warning') return 'yellow';
  if (severity === 'success') return 'green';
  return 'cyan';
}

export const KaliTerminal: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const [logs, setLogs] = useState<TerminalLog[]>([]);
  const [inputVal, setInputVal] = useState('');
  const [isLive, setIsLive] = useState(true);
  const [connectionLabel, setConnectionLabel] = useState('VERIFICANDO SUPABASE...');
  const logsContainerRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll internal terminal container ONLY (without hijacking window scroll)
  useEffect(() => {
    if (logsContainerRef.current) {
      logsContainerRef.current.scrollTop = logsContainerRef.current.scrollHeight;
    }
  }, [logs]);

  // Cargar registros reales desde Supabase (cero eventos sintéticos)
  useEffect(() => {
    let mounted = true;

    async function loadRealAuditStream() {
      const start = performance.now();
      try {
        const { data, error } = await supabase
          .from('system_audit_logs')
          .select('id, event_type, severity, actor, description, created_at')
          .order('created_at', { ascending: false })
          .limit(20);
        const latency = Math.max(1, Math.round(performance.now() - start));

        if (!mounted) return;

        if (!error) {
          setConnectionLabel(`SUPABASE EN LÍNEA (${latency} ms)`);
          const mapped: TerminalLog[] = (data || [])
            .slice()
            .reverse()
            .map((row: any) => ({
              id: String(row.id),
              timestamp: row.created_at
                ? new Date(row.created_at).toLocaleTimeString('es-MX', { hour12: false })
                : formatNowTime(),
              tag: `[${String(row.event_type || 'EVENTO').toUpperCase()}]`,
              tagColor: severityToColor(row.severity),
              text: `${row.actor ? `${row.actor}: ` : ''}${row.description || ''}`,
            }));
          setLogs(mapped);
        } else {
          setConnectionLabel('SUPABASE DESCONECTADO');
          setLogs([]);
        }
      } catch {
        if (mounted) {
          setConnectionLabel('SUPABASE DESCONECTADO');
          setLogs([]);
        }
      }
    }

    void loadRealAuditStream();
    return () => {
      mounted = false;
    };
  }, []);

  // Suscripción en tiempo real a system_audit_logs cuando isLive está activo
  useEffect(() => {
    if (!isLive) return;

    const channel = supabase
      .channel('mrca-console-security-stream')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'system_audit_logs' },
        (payload: any) => {
          const row = payload?.new;
          if (!row) return;
          const incoming: TerminalLog = {
            id: String(row.id || Date.now()),
            timestamp: row.created_at
              ? new Date(row.created_at).toLocaleTimeString('es-MX', { hour12: false })
              : formatNowTime(),
            tag: `[${String(row.event_type || 'EVENTO').toUpperCase()}]`,
            tagColor: severityToColor(row.severity),
            text: `${row.actor ? `${row.actor}: ` : ''}${row.description || ''}`,
          };
          setLogs((prev) => [...prev.slice(-29), incoming]);
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [isLive]);

  const handleCommandSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cmd = inputVal.trim();
    if (!cmd) return;

    const timeStr = formatNowTime();
    const userLog: TerminalLog = {
      id: String(Date.now()),
      timestamp: timeStr,
      tag: '[ADMIN]',
      tagColor: 'cyan',
      text: cmd,
    };

    const lower = cmd.toLowerCase();
    if (lower === 'clear') {
      setLogs([]);
      setInputVal('');
      return;
    }

    setInputVal('');
    setLogs((prev) => [...prev, userLog]);

    let replyText = '';
    let replyTag = '[STDOUT]';
    let replyColor: TerminalLog['tagColor'] = 'green';

    if (lower === 'help') {
      replyText = 'Comandos disponibles: status, pagos, tickets, clear';
    } else if (lower === 'status') {
      const start = performance.now();
      const { error } = await supabase
        .from('service_pricing')
        .select('id', { count: 'exact', head: true });
      const latency = Math.max(1, Math.round(performance.now() - start));
      if (!error) {
        setConnectionLabel(`SUPABASE EN LÍNEA (${latency} ms)`);
        replyText = `SISTEMA MRCA SOLUTIONS: EN LÍNEA. Latencia real Supabase: ${latency} ms.`;
      } else {
        setConnectionLabel('SUPABASE DESCONECTADO');
        replyText = 'SISTEMA MRCA SOLUTIONS: DESCONECTADO de Supabase.';
        replyColor = 'red';
      }
    } else if (lower === 'payout' || lower === 'pagos') {
      const { data, error } = await supabase.from('invoices').select('amount, status');
      if (!error && Array.isArray(data)) {
        const paid = data
          .filter((i: any) => i.status === 'paid')
          .reduce((acc: number, i: any) => acc + Number(i.amount || 0), 0);
        const pending = data
          .filter((i: any) => i.status !== 'paid')
          .reduce((acc: number, i: any) => acc + Number(i.amount || 0), 0);
        replyText = `Conciliación SPEI (Nu México): Liquidado $${paid.toLocaleString('es-MX')} MXN | Pendiente $${pending.toLocaleString('es-MX')} MXN (${data.length} factura(s)).`;
      } else {
        replyText = 'No fue posible consultar facturas SPEI en este momento.';
        replyColor = 'yellow';
      }
    } else if (lower === 'tickets') {
      const { count, error } = await supabase
        .from('support_tickets')
        .select('id', { count: 'exact', head: true });
      replyText = !error
        ? `Tickets de soporte registrados en Supabase: ${count || 0}.`
        : 'No fue posible consultar tickets de soporte.';
    } else {
      replyText = `Comando no reconocido: "${cmd}". Escribe "help" para ver los comandos disponibles.`;
      replyColor = 'slate';
    }

    const replyLog: TerminalLog = {
      id: String(Date.now() + 1),
      timestamp: formatNowTime(),
      tag: replyTag,
      tagColor: replyColor,
      text: replyText,
    };

    setLogs((prev) => [...prev, replyLog]);
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
        {logs.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-center text-[#849396] text-[11px] px-3">
            Sin registros aún en bitácora de seguridad. Escribe &quot;status&quot; o &quot;pagos&quot; para consultar métricas reales.
          </div>
        ) : (
          logs.map((log) => (
            <div key={log.id} className="flex items-start gap-1.5 break-all">
              <span className="text-[#849396] shrink-0 text-[10px]">[{log.timestamp}]</span>
              <span className={`shrink-0 ${getTagColorClass(log.tagColor)}`}>{log.tag}</span>
              <span className="text-[#dce1ff]">{log.text}</span>
            </div>
          ))
        )}
      </div>


      {/* Terminal Interactive Input Prompt */}
      <form onSubmit={handleCommandSubmit} className="flex items-center gap-1.5 pt-1 border-t border-[#181e36]">
        <span className="text-[#00e5ff] text-[12px] font-bold">&gt;</span>
        <input
          type="text"
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          placeholder="Escribe un comando (help, status, pagos, tickets, clear)..."
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
        <span>CONSOLA DE AUDITORÍA EN VIVO</span>
        <span className="text-[#00fe66]">{connectionLabel}</span>
      </div>
    </div>
  );
};
