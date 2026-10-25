import React, { useState } from 'react';

interface Shard {
  id: number;
  label: string;
  name: string;
  region: string;
  active: boolean;
  xMobile: number;
  yMobile: number;
  xDesktop: number;
  yDesktop: number;
}

const INITIAL_SHARDS: Shard[] = [
  { id: 1, label: 'S1', name: 'S1 (0)', region: 'MX', active: false, xMobile: 40, yMobile: 105, xDesktop: 90, yDesktop: 140 },
  { id: 2, label: 'S2', name: 'S2 (✓)', region: 'VA-01', active: true, xMobile: 95, yMobile: 105, xDesktop: 180, yDesktop: 170 },
  { id: 3, label: 'S3', name: 'S3 (✓)', region: 'CH-ZUR', active: true, xMobile: 150, yMobile: 105, xDesktop: 270, yDesktop: 175 },
  { id: 4, label: 'S4', name: 'S4 (✓)', region: 'TYO-02', active: true, xMobile: 205, yMobile: 105, xDesktop: 360, yDesktop: 170 },
  { id: 5, label: 'S5', name: 'S5 (0)', region: 'SG-01', active: false, xMobile: 260, yMobile: 105, xDesktop: 450, yDesktop: 140 },
];

export const ShamirSecretSharing: React.FC<{ isDesktop?: boolean }> = ({ isDesktop = false }) => {
  const [shards, setShards] = useState<Shard[]>(INITIAL_SHARDS);

  const toggleShard = (id: number) => {
    setShards((prev) =>
      prev.map((s) => (s.id === id ? { ...s, active: !s.active } : s))
    );
  };

  const activeCount = shards.filter((s) => s.active).length;
  const isQuorumReached = activeCount >= 3;

  return (
    <div className="w-full bg-[#141a32]/80 border border-[#00e5ff]/20 backdrop-blur-xl rounded-2xl p-4 md:p-6 shadow-xl flex flex-col gap-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-1 gap-2 border-b border-[#222941]">
        <div className="flex items-center gap-2">
          <span translate="no" className="notranslate material-symbols-outlined text-[#00e5ff] text-[20px]">hub</span>
          <span className="font-['Space_Grotesk'] text-[18px] text-[#dce1ff] font-semibold">
            Shamir's Secret Sharing (k=3, n=5)
          </span>
        </div>
        <span
          className={`font-['JetBrains_Mono'] text-[10px] px-2 py-0.5 rounded uppercase font-semibold w-fit ${
            isQuorumReached
              ? 'bg-[#00fe66]/15 text-[#00fe66] border border-[#00fe66]/30'
              : 'bg-[#ffb4ab]/15 text-[#ffb4ab] border border-[#ffb4ab]/30'
          }`}
        >
          {isQuorumReached ? 'MULTI-REGION QUORUM: LOCKED & SIGNED' : 'QUORUM STANDBY'}
        </span>
      </div>

      <p className="font-['Inter'] text-[12px] md:text-[13px] text-[#bac9cc] leading-relaxed">
        Ningún nodo central posee la clave maestra completa. Se requiere un quórum criptográfico de al menos 3 nodos para reconstruir credenciales de bóveda en memoria volátil efímera.
      </p>

      {/* SVG Interactive Topology Diagram */}
      <div className="w-full bg-[#060d24]/90 border border-[#222941] rounded-xl p-3 md:p-5 flex flex-col items-center justify-center relative select-none">
        {/* Top Monospace indicators */}
        <div className="w-full flex items-center justify-between text-[11px] font-['JetBrains_Mono'] text-[#849396] mb-2 px-1">
          <span>TOPOLOGY MESH GRAPH</span>
          <span className={isQuorumReached ? 'text-[#00fe66]' : 'text-[#ffb4ab]'}>
            CONSENSUS: {isQuorumReached ? '3/3 QUORUM' : `${activeCount}/3 SIGNATURES`}
          </span>
        </div>

        {isDesktop ? (
          /* Desktop layout SVG */
          <svg className="notranslate w-full h-auto max-w-xl text-[#dce1ff]" fill="none" stroke="currentColor" viewBox="0 0 540 230">
            {/* Grid background subtle lines */}
            <line stroke="#181e36" strokeDasharray="4 4" strokeWidth="1" x1="0" x2="540" y1="110" y2="110" />
            <line stroke="#181e36" strokeDasharray="4 4" strokeWidth="1" x1="270" x2="270" y1="0" y2="220" />

            {/* Connectors */}
            {shards.map((s) => (
              <line
                key={`line-${s.id}`}
                x1="270"
                y1="40"
                x2={s.xDesktop}
                y2={s.yDesktop}
                stroke={s.active ? (isQuorumReached ? '#00fe66' : '#00e5ff') : '#3b494c'}
                strokeWidth={s.active ? 2.5 : 1.5}
                strokeDasharray={s.active ? 'none' : '4 4'}
                className="transition-all duration-300"
              />
            ))}

            {/* Center Master Secret Hub */}
            <g className="cursor-pointer" onClick={() => alert(`Bóveda Criptográfica: ${isQuorumReached ? 'DESENCRIPTADO AUTORIZADO (3/5 Quórum Activo)' : 'BLOQUEADA - Requiere al menos 3 fragmentos'}`)}>
              <circle
                cx="270"
                cy="40"
                r="26"
                fill="#0b1229"
                stroke={isQuorumReached ? '#00e5ff' : '#849396'}
                strokeWidth="2.5"
                filter={isQuorumReached ? 'drop-shadow(0 0 12px rgba(0, 229, 255, 0.6))' : 'none'}
              />
              <circle cx="270" cy="40" r="16" fill={isQuorumReached ? '#00e5ff' : '#3b494c'} opacity="0.25" />
              <text
                x="270"
                y="44"
                fill={isQuorumReached ? '#c3f5ff' : '#849396'}
                fontFamily="JetBrains Mono"
                fontSize="10"
                fontWeight="700"
                textAnchor="middle"
              >
                SECRET
              </text>
            </g>

            {/* Shard Nodes */}
            {shards.map((s) => (
              <g
                key={`node-${s.id}`}
                className="cursor-pointer transition-transform duration-150 hover:scale-105"
                onClick={() => toggleShard(s.id)}
              >
                <circle
                  cx={s.xDesktop}
                  cy={s.yDesktop}
                  r="20"
                  fill="#141a32"
                  stroke={s.active ? '#00fe66' : '#849396'}
                  strokeWidth={s.active ? '2.5' : '1.5'}
                  filter={s.active ? 'drop-shadow(0 0 8px rgba(0, 254, 102, 0.5))' : 'none'}
                />
                {s.active && <circle cx={s.xDesktop} cy={s.yDesktop} r="6" fill="#00fe66" />}
                <text
                  x={s.xDesktop}
                  y={s.yDesktop + 32}
                  fill={s.active ? '#6bff83' : '#849396'}
                  fontFamily="JetBrains Mono"
                  fontSize="10"
                  fontWeight={s.active ? '700' : '400'}
                  textAnchor="middle"
                >
                  {s.label} [{s.region}]
                </text>
                <text
                  x={s.xDesktop}
                  y={s.yDesktop + 45}
                  fill={s.active ? '#00fe66' : '#3b494c'}
                  fontFamily="JetBrains Mono"
                  fontSize="8"
                  textAnchor="middle"
                >
                  {s.active ? '(ACTIVO ✓)' : '(STANDBY)'}
                </text>
              </g>
            ))}
          </svg>
        ) : (
          /* Mobile layout SVG */
          <svg className="notranslate w-full h-auto max-w-sm text-[#dce1ff]" fill="none" viewBox="0 0 300 135">
            {/* Center Master Secret */}
            <circle
              cx="150"
              cy="30"
              r="18"
              fill="#181e36"
              stroke={isQuorumReached ? '#00e5ff' : '#849396'}
              strokeWidth="2"
              filter={isQuorumReached ? 'drop-shadow(0 0 10px rgba(0,229,255,0.6))' : 'none'}
            />
            <circle cx="150" cy="30" r="14" fill="#00e5ff" fillOpacity={isQuorumReached ? '0.3' : '0.1'} />
            <text x="150" y="34" fill="#00e5ff" fontFamily="JetBrains Mono" fontSize="9" fontWeight="bold" textAnchor="middle">
              SECRET
            </text>

            {/* Connectors */}
            {shards.map((s) => (
              <line
                key={`line-m-${s.id}`}
                x1="150"
                y1="48"
                x2={s.xMobile}
                y2="95"
                stroke={s.active ? '#00e5ff' : '#3b494c'}
                strokeWidth={s.active ? '1.8' : '1.2'}
                strokeDasharray={s.active ? 'none' : '3 3'}
              />
            ))}

            {/* Shares */}
            {shards.map((s) => (
              <g
                key={`share-m-${s.id}`}
                transform={`translate(${s.xMobile}, 105)`}
                className="cursor-pointer"
                onClick={() => toggleShard(s.id)}
              >
                <rect
                  x="-18"
                  y="-12"
                  width="36"
                  height="24"
                  rx="4"
                  fill={s.active ? '#00363d' : '#141a32'}
                  stroke={s.active ? '#00e5ff' : '#3b494c'}
                  strokeWidth="1.2"
                />
                <text
                  x="0"
                  y="3"
                  fill={s.active ? '#00e5ff' : '#849396'}
                  fontFamily="JetBrains Mono"
                  fontSize="9"
                  fontWeight={s.active ? 'bold' : 'normal'}
                  textAnchor="middle"
                >
                  {s.label} ({s.active ? '✓' : '0'})
                </text>
              </g>
            ))}
          </svg>
        )}

        {/* Dynamic Quorum Status Bar */}
        <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-1 text-[10px] font-['JetBrains_Mono'] pt-2 mt-2 border-t border-[#181e36] text-center">
          <span className={isQuorumReached ? 'text-[#00fe66] font-semibold' : 'text-[#ffb4ab] font-semibold'}>
            {isQuorumReached
              ? `QUÓRUM ${activeCount}/5 ALCANZADO // DESENCRIPTADO AUTORIZADO`
              : `QUÓRUM ${activeCount}/5 INSUFICIENTE // SE REQUIEREN AL MENOS 3 NODOS`}
          </span>
          <span className="text-[#849396]">POLYNOMIAL DEGREE: d=2 (k=3)</span>
        </div>
      </div>

      <div className="flex items-center justify-between text-[11px] font-['JetBrains_Mono'] text-[#bac9cc]">
        <span className="flex items-center gap-1 text-[11px]">
          <span translate="no" className="notranslate material-symbols-outlined text-[13px] text-[#00e5ff]">touch_app</span>
          Haz clic en cualquier fragmento (S1-S5) para simular quórum
        </span>
        <button
          onClick={() => setShards(INITIAL_SHARDS)}
          className="text-[#00e5ff] hover:underline uppercase text-[10px]"
        >
          Resetear Nodos
        </button>
      </div>

      {/* Badges Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
        <div className="px-2 py-2 rounded bg-[#181e36] text-center border border-[#222941]">
          <span className="block font-['JetBrains_Mono'] text-[10px] text-[#c3f5ff] font-bold">Supabase Auth</span>
          <span className="font-['JetBrains_Mono'] text-[9px] text-[#bac9cc]">Enterprise RLS</span>
        </div>
        <div className="px-2 py-2 rounded bg-[#181e36] text-center border border-[#222941]">
          <span className="block font-['JetBrains_Mono'] text-[10px] text-[#6bff83] font-bold">AES-256-GCM</span>
          <span className="font-['JetBrains_Mono'] text-[9px] text-[#bac9cc]">Military Grade</span>
        </div>
        <div className="px-2 py-2 rounded bg-[#181e36] text-center border border-[#222941]">
          <span className="block font-['JetBrains_Mono'] text-[10px] text-[#e1e0ff] font-bold">SOC-2 Tipo II</span>
          <span className="font-['JetBrains_Mono'] text-[9px] text-[#bac9cc]">Audit Certified</span>
        </div>
        <div className="px-2 py-2 rounded bg-[#181e36] text-center border border-[#222941]">
          <span className="block font-['JetBrains_Mono'] text-[10px] text-[#9cf0ff] font-bold">FIPS 140-3</span>
          <span className="font-['JetBrains_Mono'] text-[9px] text-[#bac9cc]">Nivel 4 Enclave</span>
        </div>
      </div>
    </div>
  );
};
