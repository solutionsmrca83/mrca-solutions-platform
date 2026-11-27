import React, { useState, useEffect, useCallback } from 'react';
import {
  DollarSign,
  Lock,
  Save,
  RefreshCw,
  CheckCircle2,
  SlidersHorizontal,
  Clock,
  ShieldCheck,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import { isSuperAdmin } from '../../lib/auth';
import {
  MRCA_SERVICES,
  MRCA_SCOPE_TIERS,
  fetchLiveServicePricing,
  upsertServicePricingRow,
  formatMxnCurrency,
} from '../../lib/mrcaPricingFallback';
import type { ServicePricingRecord } from '../../types';

interface AdminPricingManagerProps {
  sessionUser?: any;
  showToast?: (msg: string) => void;
}

export const AdminPricingManager: React.FC<AdminPricingManagerProps> = ({
  sessionUser,
  showToast,
}) => {
  const isSuper = isSuperAdmin(sessionUser);

  const [rows, setRows] = useState<ServicePricingRecord[]>([]);
  const [dataSource, setDataSource] = useState<'supabase' | 'local'>('local');
  const [isLoading, setIsLoading] = useState(true);
  const [savingRowId, setSavingRowId] = useState<string | null>(null);
  const [isSavingAll, setIsSavingAll] = useState(false);

  const loadMatrix = useCallback(async () => {
    setIsLoading(true);
    const { rows: fetched, source } = await fetchLiveServicePricing();
    setRows(fetched);
    setDataSource(source);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    void loadMatrix();
  }, [loadMatrix]);

  const handleFieldChange = (
    id: string,
    field: keyof ServicePricingRecord,
    value: string | number
  ) => {
    if (!isSuper) return;
    setRows((prev) =>
      prev.map((row) => {
        if (row.id !== id) return row;
        if (field === 'min_price_mxn' || field === 'max_price_mxn') {
          const num = Math.max(0, Number(value) || 0);
          return { ...row, [field]: num };
        }
        if (field === 'advance_percentage') {
          return { ...row, advance_percentage: Number(value) === 40 ? 40 : 25 };
        }
        return { ...row, [field]: value };
      })
    );
  };

  const handleQuickAdjust = (id: string, deltaPercent: number) => {
    if (!isSuper) return;
    setRows((prev) =>
      prev.map((row) => {
        if (row.id !== id) return row;
        const factor = 1 + deltaPercent / 100;
        const nextMin = Math.max(1000, Math.round((row.min_price_mxn * factor) / 500) * 500);
        const nextMax = Math.max(nextMin, Math.round((row.max_price_mxn * factor) / 500) * 500);
        return { ...row, min_price_mxn: nextMin, max_price_mxn: nextMax };
      })
    );
  };

  const handleSaveRow = async (row: ServicePricingRecord) => {
    if (!isSuper) {
      showToast?.('Acceso denegado: Solo Superadmin puede modificar tarifas del Cotizador.');
      return;
    }
    if (row.max_price_mxn < row.min_price_mxn) {
      showToast?.('El precio máximo no puede ser menor al precio mínimo.');
      return;
    }

    setSavingRowId(row.id);
    const result = await upsertServicePricingRow(row);
    setSavingRowId(null);

    if (result.syncedRemote) {
      showToast?.(
        `Tarifa guardada en Supabase para ${row.service_type} (${row.scope_tier}). El Bot ya muestra el nuevo rango.`
      );
    } else {
      showToast?.(
        `Tarifa actualizada en caché local para ${row.service_type} (${row.scope_tier}).`
      );
    }
  };

  const handleSaveAll = async () => {
    if (!isSuper) {
      showToast?.('Acceso denegado: Solo Superadmin puede guardar cambios en la matriz de precios.');
      return;
    }

    setIsSavingAll(true);
    let remoteSuccessCount = 0;
    for (const row of rows) {
      const res = await upsertServicePricingRow(row);
      if (res.syncedRemote) remoteSuccessCount += 1;
    }
    setIsSavingAll(false);

    showToast?.(
      remoteSuccessCount === rows.length
        ? 'Matriz completa de precios sincronizada con Supabase. Cotizador Bot actualizado al instante.'
        : 'Matriz de precios actualizada localmente y lista para el Cotizador Bot.'
    );
  };

  return (
    <div className="w-full flex flex-col gap-6 font-['Inter'] text-slate-100">
      {/* ENCABEZADO */}
      <section className="relative rounded-2xl bg-slate-900/90 backdrop-blur-xl border border-cyan-500/40 p-5 sm:p-6 shadow-[0_0_25px_rgba(6,182,212,0.18)] overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-transparent to-emerald-500/5 pointer-events-none" />
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex flex-col gap-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/15 border border-cyan-500/40 text-cyan-300 font-['JetBrains_Mono'] text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5">
                <SlidersHorizontal className="w-3.5 h-3.5" />
                MATRIZ DE PRECIOS DINÁMICOS (`service_pricing`)
              </span>
              <span
                className={`px-2.5 py-0.5 rounded-full font-['JetBrains_Mono'] text-[10px] font-bold uppercase border ${
                  isSuper
                    ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                    : 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                }`}
              >
                {isSuper ? 'EDICIÓN SUPERADMIN HABILITADA' : 'SOLO LECTURA (RESTRINGIDO A SUPERADMIN)'}
              </span>
              <span className="px-2 py-0.5 rounded bg-slate-950/80 border border-white/10 font-['JetBrains_Mono'] text-[9.5px] text-slate-400">
                Origen: {dataSource === 'supabase' ? 'Supabase en Vivo' : 'Respaldo Local Sincronizado'}
              </span>
            </div>

            <h2 className="font-['Space_Grotesk'] text-[22px] sm:text-[26px] font-bold text-white tracking-tight">
              Gestor de Tarifas del Cotizador Estimado (MXN)
            </h2>
            <p className="text-[13px] text-slate-300 max-w-3xl leading-relaxed">
              Aumenta o reduce los rangos de inversión, tiempos de entrega y porcentajes de anticipo SPEI (25% o 40%). Cada ajuste guardado se refleja de inmediato en el Asistente Cotizador MRCA.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => void loadMatrix()}
              disabled={isLoading}
              className="px-3.5 py-2.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 border border-cyan-500/30 text-cyan-300 font-['JetBrains_Mono'] text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Recargar</span>
            </button>

            {isSuper && (
              <button
                type="button"
                disabled={isSavingAll || isLoading}
                onClick={() => void handleSaveAll()}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-400 text-slate-950 font-['JetBrains_Mono'] text-[11px] font-bold uppercase flex items-center gap-1.5 shadow-[0_0_14px_rgba(6,182,212,0.4)] hover:shadow-[0_0_20px_rgba(6,182,212,0.8)] hover:scale-105 transition-all cursor-pointer disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{isSavingAll ? 'Guardando...' : 'Guardar Toda la Matriz'}</span>
              </button>
            )}
          </div>
        </div>
      </section>

      {/* AVISO SOLO LECTURA PARA PARTNER / EMPLOYEE */}
      {!isSuper && (
        <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-500/40 flex items-center gap-3 text-[12.5px] text-amber-200">
          <Lock className="w-5 h-5 text-amber-400 shrink-0" />
          <div>
            <strong>Modo Solo Lectura:</strong> Por políticas de gobernanza RBAC, únicamente el rol{' '}
            <strong className="text-white">Superadmin</strong> puede modificar precios mínimos/máximos, plazos de entrega o porcentajes de anticipo.
          </div>
        </div>
      )}

      {/* MATRIZ POR SERVICIO */}
      <div className="flex flex-col gap-5">
        {MRCA_SERVICES.map((serviceName) => {
          const serviceRows = MRCA_SCOPE_TIERS.map(
            (tier) => rows.find((r) => r.service_type === serviceName && r.scope_tier === tier)
          ).filter(Boolean) as ServicePricingRecord[];

          return (
            <section
              key={serviceName}
              className="rounded-2xl bg-slate-900/90 border border-cyan-500/30 p-5 backdrop-blur-xl shadow-xl flex flex-col gap-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-white/10">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-cyan-500/15 border border-cyan-500/35 flex items-center justify-center text-cyan-300">
                    <DollarSign className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-['Space_Grotesk'] text-[17px] font-bold text-white leading-tight">
                      {serviceName}
                    </h3>
                    <span className="font-['JetBrains_Mono'] text-[10px] text-slate-400">
                      {serviceName === 'Soporte y Mantenimiento Técnico'
                        ? 'Tarifa mensual referencial (MXN / mes)'
                        : 'Tarifa por proyecto referencial (MXN)'}
                    </span>
                  </div>
                </div>
                <span className="font-['JetBrains_Mono'] text-[10px] text-emerald-400 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Sincronizado con Cotizador Bot</span>
                </span>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {serviceRows.map((row) => (
                  <div
                    key={row.id}
                    className="rounded-xl bg-slate-950/75 border border-white/10 hover:border-cyan-500/40 p-4 flex flex-col justify-between gap-3.5 transition-all"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-['Space_Grotesk'] text-[14px] font-bold text-cyan-300">
                        {row.scope_tier}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded font-['JetBrains_Mono'] text-[10px] font-bold border ${
                          row.advance_percentage === 40
                            ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                            : 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                        }`}
                      >
                        {row.advance_percentage}% SPEI
                      </span>
                    </div>

                    {isSuper ? (
                      <div className="flex flex-col gap-3">
                        <div className="grid grid-cols-2 gap-2.5">
                          <div>
                            <label className="block font-['JetBrains_Mono'] text-[10px] text-slate-400 mb-1">
                              Mínimo MXN
                            </label>
                            <input
                              type="number"
                              min={0}
                              step={500}
                              value={row.min_price_mxn}
                              onChange={(e) =>
                                handleFieldChange(row.id, 'min_price_mxn', Number(e.target.value))
                              }
                              className="w-full bg-slate-900 border border-cyan-500/30 focus:border-cyan-400 rounded-lg px-2.5 py-2 text-[12.5px] text-emerald-300 font-['JetBrains_Mono'] font-bold focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="block font-['JetBrains_Mono'] text-[10px] text-slate-400 mb-1">
                              Máximo MXN
                            </label>
                            <input
                              type="number"
                              min={0}
                              step={500}
                              value={row.max_price_mxn}
                              onChange={(e) =>
                                handleFieldChange(row.id, 'max_price_mxn', Number(e.target.value))
                              }
                              className="w-full bg-slate-900 border border-cyan-500/30 focus:border-cyan-400 rounded-lg px-2.5 py-2 text-[12.5px] text-emerald-300 font-['JetBrains_Mono'] font-bold focus:outline-none"
                            />
                          </div>
                        </div>

                        {/* Ajustes rápidos -10% / +10% */}
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleQuickAdjust(row.id, -10)}
                            className="flex-1 py-1 rounded-lg bg-slate-800/90 hover:bg-slate-700 border border-white/10 text-[10.5px] font-['JetBrains_Mono'] text-amber-300 flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <TrendingDown className="w-3 h-3" />
                            <span>-10%</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleQuickAdjust(row.id, 10)}
                            className="flex-1 py-1 rounded-lg bg-slate-800/90 hover:bg-slate-700 border border-white/10 text-[10.5px] font-['JetBrains_Mono'] text-emerald-300 flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <TrendingUp className="w-3 h-3" />
                            <span>+10%</span>
                          </button>
                        </div>

                        <div className="grid grid-cols-2 gap-2.5">
                          <div>
                            <label className="block font-['JetBrains_Mono'] text-[10px] text-slate-400 mb-1">
                              Tiempo Entrega
                            </label>
                            <input
                              type="text"
                              value={row.delivery_time}
                              onChange={(e) =>
                                handleFieldChange(row.id, 'delivery_time', e.target.value)
                              }
                              className="w-full bg-slate-900 border border-cyan-500/30 focus:border-cyan-400 rounded-lg px-2.5 py-1.5 text-[11.5px] text-white focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="block font-['JetBrains_Mono'] text-[10px] text-slate-400 mb-1">
                              Anticipo SPEI
                            </label>
                            <select
                              value={row.advance_percentage}
                              onChange={(e) =>
                                handleFieldChange(
                                  row.id,
                                  'advance_percentage',
                                  Number(e.target.value)
                                )
                              }
                              className="w-full bg-slate-900 border border-cyan-500/30 focus:border-cyan-400 rounded-lg px-2.5 py-1.5 text-[11.5px] text-cyan-300 font-['JetBrains_Mono'] font-bold focus:outline-none cursor-pointer"
                            >
                              <option value={25}>25% (Estándar)</option>
                              <option value={40}>40% (Alto Alcance)</option>
                            </select>
                          </div>
                        </div>

                        <button
                          type="button"
                          disabled={savingRowId === row.id}
                          onClick={() => void handleSaveRow(row)}
                          className="w-full py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-400 text-slate-950 font-['JetBrains_Mono'] text-[11px] font-bold uppercase flex items-center justify-center gap-1.5 hover:shadow-[0_0_20px_rgba(6,182,212,0.8)] hover:scale-[1.02] transition-all cursor-pointer disabled:opacity-50"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>{savingRowId === row.id ? 'Guardando...' : 'Guardar Rango'}</span>
                        </button>
                      </div>
                    ) : (
                      /* MODO SOLO LECTURA PARA PARTNER / EMPLOYEE */
                      <div className="flex flex-col gap-2.5">
                        <div className="p-3 rounded-xl bg-slate-900/90 border border-white/10">
                          <span className="block font-['JetBrains_Mono'] text-[9.5px] text-slate-400 uppercase">
                            Rango Vigente
                          </span>
                          <span className="font-['Space_Grotesk'] text-[17px] font-bold text-emerald-400">
                            {formatMxnCurrency(row.min_price_mxn)} -{' '}
                            {formatMxnCurrency(row.max_price_mxn)}
                            {row.is_monthly ? ' / mes' : ' MXN'}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-slate-300">
                          <span className="flex items-center gap-1 text-slate-400">
                            <Clock className="w-3.5 h-3.5 text-cyan-400" />
                            <span>Entrega:</span>
                          </span>
                          <span className="font-semibold">{row.delivery_time}</span>
                        </div>

                        <div className="pt-2 border-t border-white/5 flex items-center gap-1.5 font-['JetBrains_Mono'] text-[10px] text-amber-300/90">
                          <Lock className="w-3 h-3" />
                          <span>Solo lectura (Exclusivo Superadmin)</span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
};

export default AdminPricingManager;
