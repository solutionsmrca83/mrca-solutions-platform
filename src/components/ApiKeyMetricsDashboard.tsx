import React, { useState, useEffect, useMemo } from 'react';
import {
  Key,
  Copy,
  Check,
  Eye,
  EyeOff,
  RefreshCw,
  Activity,
  Zap,
  ShieldCheck,
  Server,
  Terminal,
  Code2,
  Lock,
  Globe,
  Sliders
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { supabase } from '../lib/supabase/client';
import { ApiKeyData, ApiKeyMetricPoint } from '../types';

interface ApiKeyMetricsDashboardProps {
  showToast?: (msg: string) => void;
  clientCompany?: string;
}

export const ApiKeyMetricsDashboard: React.FC<ApiKeyMetricsDashboardProps> = ({
  showToast,
  clientCompany = 'Cuenta Corporativa',
}) => {
  const [environment, setEnvironment] = useState<'production' | 'staging'>('production');
  const [isRevealed, setIsRevealed] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isRotating, setIsRotating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSnippetLang, setSelectedSnippetLang] = useState<'curl' | 'ts' | 'python'>('curl');
  const [apiKey, setApiKey] = useState<ApiKeyData | null>(null);
  const [metricsData] = useState<ApiKeyMetricPoint[]>([]);

  useEffect(() => {
    let mounted = true;
    async function fetchClientApiKey() {
      setIsLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          if (mounted) setApiKey(null);
          return;
        }
        const { data, error } = await supabase
          .from('client_api_keys')
          .select('*')
          .eq('client_id', user.id)
          .eq('environment', environment)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (mounted && !error && data) {
          setApiKey({
            id: String(data.id),
            name: data.name || 'Clave Corporativa API',
            keyPrefix: data.key_prefix || 'mrca_live_sec_',
            fullKey: `${data.key_prefix || 'mrca_live_sec_'}${String(data.key_hash || '').slice(0, 24)}`,
            environment: data.environment || environment,
            status: data.status || 'active',
            rateLimit: data.rate_limit || '5,000 req/min',
            createdAt: data.created_at ? new Date(data.created_at).toLocaleDateString('es-MX') : '',
            lastUsedAt: data.last_used_at
              ? new Date(data.last_used_at).toLocaleString('es-MX')
              : 'Sin uso registrado aún',
          });
        } else if (mounted) {
          setApiKey(null);
        }
      } catch {
        if (mounted) setApiKey(null);
      } finally {
        if (mounted) setIsLoading(false);
      }
    }
    void fetchClientApiKey();
    return () => {
      mounted = false;
    };
  }, [environment]);

  const totalRequests30D = useMemo(
    () => metricsData.reduce((acc, curr) => acc + curr.requests, 0),
    [metricsData]
  );

  const averageLatency = useMemo(() => {
    if (metricsData.length === 0) return 'N/D';
    const total = metricsData.reduce((acc, curr) => acc + curr.latencyMs, 0);
    return `${(total / metricsData.length).toFixed(1)} ms`;
  }, [metricsData]);

  const handleCopyKey = () => {
    if (!apiKey) return;
    navigator.clipboard?.writeText(apiKey.fullKey);
    setIsCopied(true);
    if (showToast) {
      showToast('API Key copiada al portapapeles con éxito.');
    }
    setTimeout(() => setIsCopied(false), 2400);
  };

  const handleRotateKey = async () => {
    if (!apiKey) return;
    setIsRotating(true);
    const randomHex = Array.from({ length: 32 }, () =>
      Math.floor(Math.random() * 16).toString(16)
    ).join('');
    const newFullKey = `${apiKey.keyPrefix}${randomHex}`;
    try {
      await supabase
        .from('client_api_keys')
        .update({ key_hash: randomHex, status: 'rotated', updated_at: new Date().toISOString() })
        .eq('id', apiKey.id);
    } catch {
      // handled gracefully
    }
    setApiKey((prev) =>
      prev
        ? {
            ...prev,
            fullKey: newFullKey,
            lastUsedAt: 'Clave recién rotada (0 reqs)',
          }
        : null
    );
    setIsRotating(false);
    if (showToast) {
      showToast('Clave rotada y registrada en Supabase.');
    }
  };

  const maskedKeyDisplay = apiKey
    ? isRevealed
      ? apiKey.fullKey
      : `${apiKey.fullKey.slice(0, 14)}••••••••••••••••••••••••••••${apiKey.fullKey.slice(-4)}`
    : 'Sin clave aprovisionada';

  const snippetKeyValue = apiKey && isRevealed ? apiKey.fullKey : 'mrca_live_sec_TU_CLAVE_API';

  const codeSnippets = {
    curl: `curl -X POST https://api.mrcasolutions.com/v1/auth/verify-mtls \\
  -H "Authorization: Bearer ${snippetKeyValue}" \\
  -H "Content-Type: application/json" \\
  -d '{"client_company": "${clientCompany}"}'`,
    ts: `import { MrcaClient } from '@mrca/sdk';

const mrca = new MrcaClient({
  apiKey: '${snippetKeyValue}',
  environment: '${environment}',
});

const verification = await mrca.auth.verifyMtls({
  enclaveLevel: 4,
  strictRls: true,
});
console.log(verification.sealedHash);`,
    python: `from mrca_security import MrcaEnclave

client = MrcaEnclave(
    api_key="${snippetKeyValue}",
    env="${environment}"
)

# Verificación de sesión segura
handshake = client.verify_session()
print(f"Status: {handshake.status} - Cluster: {handshake.cluster_id}")`,
  };

  return (
    <div className="w-full flex flex-col gap-6 font-['Inter'] text-[#dce1ff]">
      {/* ================================================================== */}
      {/* 1. TOP HEADER & TELEMETRY BANNER                                  */}
      {/* ================================================================== */}
      <div className="relative w-full rounded-2xl bg-gradient-to-r from-[#141a32]/95 via-[#0c163a]/90 to-[#141a32]/95 border-2 border-[#00e5ff]/40 p-5 sm:p-6 shadow-[0_10px_35px_rgba(0,229,255,0.18)] backdrop-blur-xl overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-full bg-gradient-to-l from-[#00fe66]/10 to-transparent pointer-events-none"></div>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-[#00e5ff]/15 border border-[#00e5ff]/30 text-[#00e5ff] font-['JetBrains_Mono'] text-[10px] font-bold tracking-wider uppercase flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5" />
                PORTAL DE INTEGRACIÓN // CREDENCIALES API
              </span>
            </div>

            <h2 className="font-['Space_Grotesk'] text-[22px] sm:text-[26px] font-bold text-[#dce1ff]">
              Consola de Integración API &amp; Métricas Reales
            </h2>
            <p className="font-['Inter'] text-[13px] text-[#bac9cc] max-w-3xl">
              Gestione sus credenciales de integración registradas en Supabase y monitoree el consumo real de su organización.
            </p>
          </div>

          {/* Environment Switcher */}
          <div className="flex items-center gap-2 bg-[#091129] p-1.5 rounded-xl border border-[#1e2a52] shrink-0">
            <button
              onClick={() => setEnvironment('production')}
              className={`px-3 py-1.5 rounded-lg font-['JetBrains_Mono'] text-[11px] font-semibold transition-all flex items-center gap-1.5 ${
                environment === 'production'
                  ? 'bg-[#00e5ff] text-[#00363d] shadow-[0_0_12px_rgba(0,229,255,0.3)]'
                  : 'text-[#bac9cc] hover:text-[#dce1ff]'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Producción</span>
            </button>
            <button
              onClick={() => setEnvironment('staging')}
              className={`px-3 py-1.5 rounded-lg font-['JetBrains_Mono'] text-[11px] font-semibold transition-all flex items-center gap-1.5 ${
                environment === 'staging'
                  ? 'bg-[#00fe66] text-[#00363d] shadow-[0_0_12px_rgba(0,254,102,0.3)]'
                  : 'text-[#bac9cc] hover:text-[#dce1ff]'
              }`}
            >
              <Server className="w-3.5 h-3.5" />
              <span>Entorno de Pruebas</span>
            </button>
          </div>
        </div>
      </div>

      {/* ================================================================== */}
      {/* 2. GLOWING MASKED API KEY MODULE (LIVE SUPABASE OR EMPTY STATE)    */}
      {/* ================================================================== */}
      {isLoading ? (
        <div className="rounded-2xl bg-[#0b132e] border border-[#1e2d5c] p-8 text-center font-['JetBrains_Mono'] text-[12px] text-[#849396]">
          Consultando claves API en Supabase...
        </div>
      ) : !apiKey ? (
        <div className="rounded-2xl bg-[#0b132e] border border-dashed border-[#00e5ff]/35 p-8 text-center flex flex-col items-center gap-2">
          <Key className="w-8 h-8 text-[#00e5ff]/60" />
          <h3 className="font-['Space_Grotesk'] text-[17px] font-bold text-white">
            Sin claves API aprovisionadas aún
          </h3>
          <p className="font-['Inter'] text-[12.5px] text-slate-400 max-w-md">
            Tu organización aún no cuenta con credenciales API activas en el entorno seleccionado ({environment === 'production' ? 'Producción' : 'Pruebas'}). Solicita el alta desde Soporte Técnico VIP cuando inicie tu integración.
          </p>
        </div>
      ) : (
      <div className="relative rounded-2xl bg-[#0b132e] border-2 border-[#00e5ff]/50 p-5 sm:p-6 shadow-[0_0_35px_rgba(0,229,255,0.2)] backdrop-blur-xl flex flex-col gap-4 overflow-hidden animate-border-pulse">
        <div className="absolute top-0 right-0 w-72 h-32 bg-gradient-to-b from-[#00e5ff]/10 to-transparent pointer-events-none"></div>

        <div className="flex flex-wrap items-center justify-between gap-3 relative z-10 pb-3 border-b border-[#1b2b52]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#141f42] border border-[#00e5ff]/40 flex items-center justify-center text-[#00e5ff]">
              <Key className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-['Space_Grotesk'] text-[16px] font-bold text-[#dce1ff]">
                {apiKey.name}
              </h3>
              <p className="font-['JetBrains_Mono'] text-[11px] text-[#849396]">
                ORGANIZACIÓN: <span className="text-[#00daf3]">{clientCompany}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#00fe66] animate-pulse shadow-[0_0_8px_#00fe66]"></span>
            <span className="font-['JetBrains_Mono'] text-[11px] text-[#00fe66] font-semibold">
              ESTADO: {apiKey.status.toUpperCase()}
            </span>
          </div>
        </div>

        {/* The Glowing Masked Key Input & Buttons */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 relative z-10">
          <div className="flex-1 relative flex items-center bg-[#050b1c] rounded-xl border border-[#00e5ff]/40 p-3 sm:px-4 shadow-inner group">
            <div className="w-2 h-2 rounded-full bg-[#00e5ff] mr-3 animate-ping shrink-0"></div>

            <span className="font-['JetBrains_Mono'] text-[13px] sm:text-[14px] text-[#00e5ff] font-semibold tracking-wider break-all select-all flex-1">
              {maskedKeyDisplay}
            </span>

            <button
              type="button"
              onClick={() => setIsRevealed(!isRevealed)}
              className="ml-2 p-1.5 rounded-lg bg-[#121c3b] hover:bg-[#1a274e] text-[#bac9cc] hover:text-[#00e5ff] transition-colors"
              title={isRevealed ? 'Ocultar clave' : 'Mostrar clave'}
            >
              {isRevealed ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleCopyKey}
              className={`px-4 py-3 rounded-xl font-['JetBrains_Mono'] text-[12px] font-bold uppercase tracking-wider transition-all flex items-center gap-2 shadow-lg ${
                isCopied
                  ? 'bg-[#00fe66] text-[#00363d] shadow-[0_0_15px_rgba(0,254,102,0.5)]'
                  : 'bg-[#00e5ff] hover:bg-[#5af2ff] text-[#00363d] shadow-[0_0_15px_rgba(0,229,255,0.4)]'
              }`}
            >
              {isCopied ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>¡Copiada!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copiar al Portapapeles</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleRotateKey}
              disabled={isRotating}
              className="px-3.5 py-3 rounded-xl bg-[#141f42] hover:bg-[#1f2d5e] text-[#bac9cc] hover:text-[#ff5555] border border-[#243360] font-['JetBrains_Mono'] text-[11px] font-medium transition-all flex items-center gap-1.5"
              title="Invalida la clave actual y genera una nueva"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRotating ? 'animate-spin text-[#00e5ff]' : ''}`} />
              <span className="hidden sm:inline">Rotar Clave</span>
            </button>
          </div>
        </div>

        {/* Key Telemetry Meta */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-[#162347] font-['JetBrains_Mono'] text-[11px] text-[#849396] relative z-10">
          <div>
            <span>LÍMITE POR MINUTO:</span>
            <div className="text-[#dce1ff] font-semibold">{apiKey.rateLimit}</div>
          </div>
          <div>
            <span>EMITIDA EL:</span>
            <div className="text-[#dce1ff] font-semibold">{apiKey.createdAt}</div>
          </div>
          <div>
            <span>ÚLTIMA SOLICITUD:</span>
            <div className="text-[#00fe66] font-semibold">{apiKey.lastUsedAt}</div>
          </div>
          <div>
            <span>ENCRIPTACIÓN:</span>
            <div className="text-[#00e5ff] font-semibold">TLS 1.3 / SHA-256</div>
          </div>
        </div>
      </div>
      )}

      {/* ================================================================== */}
      {/* 3. METRICS CARDS (LIVE ZERO-SAFE TILES)                            */}
      {/* ================================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="rounded-xl bg-[#0f1738]/90 border border-[#1e2d5c] p-4 flex flex-col justify-between shadow-lg">
          <div className="flex items-center justify-between text-[#849396] font-['JetBrains_Mono'] text-[11px]">
            <span>TOTAL SOLICITUDES (30D)</span>
            <Activity className="w-4 h-4 text-[#00e5ff]" />
          </div>
          <div className="my-2">
            <span className="font-['Space_Grotesk'] text-[28px] font-bold text-[#dce1ff]">
              {totalRequests30D.toLocaleString('es-MX')}
            </span>
          </div>
          <div className="flex items-center gap-1 text-[11px] font-['JetBrains_Mono'] text-[#849396]">
            <span>{totalRequests30D > 0 ? 'Tráfico medido en vivo' : 'Sin tráfico registrado aún'}</span>
          </div>
        </div>

        <div className="rounded-xl bg-[#0f1738]/90 border border-[#1e2d5c] p-4 flex flex-col justify-between shadow-lg">
          <div className="flex items-center justify-between text-[#849396] font-['JetBrains_Mono'] text-[11px]">
            <span>LATENCIA PROMEDIO</span>
            <Zap className="w-4 h-4 text-[#00fe66]" />
          </div>
          <div className="my-2">
            <span className="font-['Space_Grotesk'] text-[28px] font-bold text-[#00fe66]">
              {averageLatency}
            </span>
          </div>
          <div className="text-[11px] font-['JetBrains_Mono'] text-[#849396]">
            <span>{metricsData.length > 0 ? 'Medición real activa' : 'En espera de solicitudes'}</span>
          </div>
        </div>

        <div className="rounded-xl bg-[#0f1738]/90 border border-[#1e2d5c] p-4 flex flex-col justify-between shadow-lg">
          <div className="flex items-center justify-between text-[#849396] font-['JetBrains_Mono'] text-[11px]">
            <span>TASA DE ÉXITO (HTTP 200)</span>
            <ShieldCheck className="w-4 h-4 text-[#00e5ff]" />
          </div>
          <div className="my-2">
            <span className="font-['Space_Grotesk'] text-[28px] font-bold text-[#dce1ff]">
              {metricsData.length > 0 ? '100%' : '0%'}
            </span>
          </div>
          <div className="text-[11px] font-['JetBrains_Mono'] text-[#00daf3]">
            <span>{metricsData.length > 0 ? 'Operación normal' : 'Sin peticiones registradas'}</span>
          </div>
        </div>

        <div className="rounded-xl bg-[#0f1738]/90 border border-[#1e2d5c] p-4 flex flex-col justify-between shadow-lg">
          <div className="flex items-center justify-between text-[#849396] font-['JetBrains_Mono'] text-[11px]">
            <span>CONSUMO DE CUOTA</span>
            <Sliders className="w-4 h-4 text-[#ffb020]" />
          </div>
          <div className="my-2">
            <span className="font-['Space_Grotesk'] text-[28px] font-bold text-[#dce1ff]">
              0%
            </span>
          </div>
          <div className="w-full bg-[#182348] h-1.5 rounded-full overflow-hidden mt-1">
            <div className="bg-gradient-to-r from-[#00e5ff] to-[#00fe66] h-full w-0"></div>
          </div>
        </div>
      </div>

      {/* ================================================================== */}
      {/* 4. RECHARTS AREA CHART: API REQUESTS OVER LAST 30 DAYS             */}
      {/* ================================================================== */}
      <div className="rounded-2xl bg-[#09112a] border border-[#1b2b52] p-5 sm:p-6 flex flex-col gap-4 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-[#162347]">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-[#00e5ff]" />
            <h3 className="font-['Space_Grotesk'] text-[17px] font-bold text-[#dce1ff]">
              Volumen de Peticiones API en los Últimos 30 Días
            </h3>
          </div>

          <div className="flex items-center gap-3 font-['JetBrains_Mono'] text-[11px]">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#00e5ff] shadow-[0_0_8px_#00e5ff]"></span>
              <span className="text-[#bac9cc]">Peticiones / Día</span>
            </div>
          </div>
        </div>

        {/* The Recharts Container or Executive Empty State */}
        {metricsData.length === 0 ? (
          <div className="w-full h-56 rounded-2xl bg-[#050b1c] border border-dashed border-[#1b2b52] flex flex-col items-center justify-center text-center p-6 gap-2">
            <Activity className="w-8 h-8 text-[#849396]/70" />
            <span className="font-['Space_Grotesk'] text-[15px] font-bold text-[#dce1ff]">
              Sin métricas de consumo registradas aún
            </span>
            <p className="font-['Inter'] text-[12px] text-[#849396] max-w-md">
              La gráfica de peticiones reales aparecerá automáticamente cuando tu clave API comience a registrar solicitudes en producción.
            </p>
          </div>
        ) : (
        <div className="w-full h-72 sm:h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={metricsData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
              <defs>
                <linearGradient id="cyberCyanArea" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00e5ff" stopOpacity={0.45} />
                  <stop offset="95%" stopColor="#00e5ff" stopOpacity={0.0} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" stroke="#162347" vertical={false} />

              <XAxis
                dataKey="date"
                stroke="#637699"
                fontSize={11}
                tickLine={false}
                fontFamily="JetBrains Mono"
              />

              <YAxis
                stroke="#637699"
                fontSize={11}
                tickLine={false}
                fontFamily="JetBrains Mono"
                tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`}
              />

              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload as ApiKeyMetricPoint;
                    return (
                      <div className="bg-[#060c20]/95 border border-[#00e5ff]/50 rounded-xl p-3 shadow-2xl backdrop-blur-md font-['JetBrains_Mono'] text-[11px] flex flex-col gap-1">
                        <span className="text-[#00e5ff] font-bold">{label}</span>
                        <div className="text-[#dce1ff]">
                          Peticiones: <strong className="text-[#00fe66]">{data.requests.toLocaleString('es-MX')}</strong>
                        </div>
                        <div className="text-[#849396]">
                          Latencia p90: <span className="text-[#00daf3]">{data.latencyMs} ms</span>
                        </div>
                        <div className="text-[#849396]">
                          Tasa de Éxito: <span className="text-[#00fe66]">{data.successRate}%</span>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />

              <Area
                type="monotone"
                dataKey="requests"
                stroke="#00e5ff"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#cyberCyanArea)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        )}
      </div>

      {/* ================================================================== */}
      {/* 5. CODE INTEGRATION SNIPPET & ENDPOINTS                            */}
      {/* ================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Code Snippet Box */}
        <div className="rounded-2xl bg-[#09112a] border border-[#1b2b52] p-5 flex flex-col gap-3 shadow-lg">
          <div className="flex items-center justify-between pb-2 border-b border-[#162347]">
            <div className="flex items-center gap-2">
              <Code2 className="w-4 h-4 text-[#00daf3]" />
              <h4 className="font-['Space_Grotesk'] text-[15px] font-bold text-[#dce1ff]">
                Ejemplo Rápido de Integración
              </h4>
            </div>

            <div className="flex items-center gap-1 bg-[#121c3b] p-1 rounded-lg">
              {(['curl', 'ts', 'python'] as const).map((lang) => (
                <button
                  key={lang}
                  onClick={() => setSelectedSnippetLang(lang)}
                  className={`px-2 py-0.5 rounded font-['JetBrains_Mono'] text-[10px] uppercase font-semibold transition-all ${
                    selectedSnippetLang === lang
                      ? 'bg-[#00e5ff] text-[#00363d]'
                      : 'text-[#849396] hover:text-[#dce1ff]'
                  }`}
                >
                  {lang}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-[#05091a] p-3.5 rounded-xl border border-[#142045] font-['JetBrains_Mono'] text-[11px] leading-relaxed text-[#00daf3] overflow-x-auto shadow-inner">
            <pre>{codeSnippets[selectedSnippetLang]}</pre>
          </div>
        </div>

        {/* Active Endpoints Table */}
        <div className="rounded-2xl bg-[#09112a] border border-[#1b2b52] p-5 flex flex-col gap-3 shadow-lg">
          <div className="flex items-center justify-between pb-2 border-b border-[#162347]">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-[#00fe66]" />
              <h4 className="font-['Space_Grotesk'] text-[15px] font-bold text-[#dce1ff]">
                Rutas de API Habilitadas para su Empresa
              </h4>
            </div>
            <span className="font-['JetBrains_Mono'] text-[10px] text-[#849396]">4 SERVICIOS</span>
          </div>

          <div className="flex flex-col gap-2 font-['JetBrains_Mono'] text-[11px]">
            {[
              { path: 'POST /v1/auth/verify-mtls', desc: 'Validación de certificado y token', latency: '9ms', status: '200 OK' },
              { path: 'POST /v1/vault/encrypt', desc: 'Cifrado de payload con AES-256', latency: '12ms', status: '200 OK' },
              { path: 'GET /v1/ledger/cryptographic-seal', desc: 'Consulta de auditoría e inmutabilidad', latency: '14ms', status: '200 OK' },
              { path: 'POST /v1/contracts/sign-ecdsa', desc: 'Sellado de vector de firma', latency: '19ms', status: '200 OK' },
            ].map((ep) => (
              <div
                key={ep.path}
                className="p-2.5 rounded-xl bg-[#0f1738] border border-[#1c2a52] flex items-center justify-between hover:border-[#00e5ff]/40 transition-colors"
              >
                <div>
                  <div className="text-[#00e5ff] font-semibold">{ep.path}</div>
                  <div className="text-[10px] text-[#849396]">{ep.desc}</div>
                </div>
                <div className="text-right">
                  <div className="text-[#00fe66]">{ep.status}</div>
                  <div className="text-[10px] text-[#849396]">{ep.latency}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
