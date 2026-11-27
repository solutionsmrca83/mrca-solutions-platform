import { supabase } from './supabase/client';
import type { ServicePricingRecord, SoftwareCatalogProduct } from '../types';

/**
 * MRCA SOLUTIONS — MOTOR DE PRECIOS DINÁMICOS Y RESPALDO LOCAL ($0 API)
 * Lee precios en vivo desde Supabase `service_pricing` y utiliza este módulo como
 * respaldo automático si el entorno está offline o aún no ejecuta la migración SQL.
 */

export const MRCA_SERVICES = [
  'Desarrollo Web & SaaS',
  'Auditoría de Ciberseguridad',
  'Infraestructura y Nube',
  'Soporte y Mantenimiento Técnico',
] as const;

export type MrcaServiceName = (typeof MRCA_SERVICES)[number];

export const MRCA_SCOPE_TIERS = [
  'Esencial / PyME',
  'Profesional / Empresarial',
  'Alto Alcance / A la Medida',
] as const;

export type MrcaScopeTier = (typeof MRCA_SCOPE_TIERS)[number];

export const PRICING_STORAGE_KEY = 'mrca_service_pricing_v1';
export const CATALOG_STORAGE_KEY = 'mrca_software_catalog_v1';
export const PRICING_SYNC_EVENT = 'mrca_service_pricing_updated';
export const CATALOG_SYNC_EVENT = 'mrca_software_catalog_updated';

/**
 * Aviso obligatorio de transparencia comercial mostrado en toda Tarjeta de Cotización Estimada.
 */
export const MANDATORY_QUOTE_DISCLAIMER =
  'Nota importante: Este monto es únicamente un estimado referencial. El precio final se establece —y puede mantenerse, ajustarse o incluso disminuir— al platicar los detalles exactos directamente con el director o el líder asignado a tu proyecto.';

export const SCOPE_TIER_META: Record<
  MrcaScopeTier,
  { shortLabel: string; badge: string; advancePercentage: 25 | 40; subtitle: string }
> = {
  'Esencial / PyME': {
    shortLabel: 'Esencial',
    badge: '25% Anticipo',
    advancePercentage: 25,
    subtitle: 'Implementación ágil para negocios en crecimiento',
  },
  'Profesional / Empresarial': {
    shortLabel: 'Empresarial',
    badge: '25% Anticipo',
    advancePercentage: 25,
    subtitle: 'Solución integral B2B con integraciones y SLA formal',
  },
  'Alto Alcance / A la Medida': {
    shortLabel: 'Alto Alcance',
    badge: '40% Anticipo',
    advancePercentage: 40,
    subtitle: 'Arquitectura crítica a la medida de alta complejidad',
  },
};

export interface QuoteEstimateResult {
  serviceType: MrcaServiceName;
  projectScope: MrcaScopeTier;
  formattedRange: string;
  minMxn: number;
  maxMxn: number;
  isMonthly: boolean;
  deliveryTime: string;
  advancePercentage: 25 | 40;
  advanceLabel: string;
  summary: string;
  disclaimer: string;
}

export const FALLBACK_SERVICE_PRICING: ServicePricingRecord[] = [
  {
    id: 'sp_web_esencial',
    service_type: 'Desarrollo Web & SaaS',
    scope_tier: 'Esencial / PyME',
    min_price_mxn: 28000,
    max_price_mxn: 55000,
    delivery_time: '2 a 4 semanas',
    advance_percentage: 25,
    is_monthly: false,
    summary: 'Sitio corporativo o aplicación web inicial con panel administrable y alta velocidad.',
    updated_at: new Date().toISOString(),
  },
  {
    id: 'sp_web_empresarial',
    service_type: 'Desarrollo Web & SaaS',
    scope_tier: 'Profesional / Empresarial',
    min_price_mxn: 65000,
    max_price_mxn: 145000,
    delivery_time: '5 a 8 semanas',
    advance_percentage: 25,
    is_monthly: false,
    summary: 'Plataforma web o SaaS B2B completa con roles de usuario, base de datos blindada e integraciones.',
    updated_at: new Date().toISOString(),
  },
  {
    id: 'sp_web_alto',
    service_type: 'Desarrollo Web & SaaS',
    scope_tier: 'Alto Alcance / A la Medida',
    min_price_mxn: 160000,
    max_price_mxn: 340000,
    delivery_time: '10 a 16 semanas',
    advance_percentage: 40,
    is_monthly: false,
    summary: 'Ecosistema SaaS multi-empresa a la medida, alta concurrencia y SLA garantizado.',
    updated_at: new Date().toISOString(),
  },
  {
    id: 'sp_sec_esencial',
    service_type: 'Auditoría de Ciberseguridad',
    scope_tier: 'Esencial / PyME',
    min_price_mxn: 22000,
    max_price_mxn: 45000,
    delivery_time: '1 a 2 semanas',
    advance_percentage: 25,
    is_monthly: false,
    summary: 'Evaluación integral de superficie expuesta, diagnóstico ejecutivo y plan de mitigación.',
    updated_at: new Date().toISOString(),
  },
  {
    id: 'sp_sec_empresarial',
    service_type: 'Auditoría de Ciberseguridad',
    scope_tier: 'Profesional / Empresarial',
    min_price_mxn: 55000,
    max_price_mxn: 120000,
    delivery_time: '2 a 4 semanas',
    advance_percentage: 25,
    is_monthly: false,
    summary: 'Auditoría profunda de aplicaciones, APIs y nube con reporte ejecutivo y remediación.',
    updated_at: new Date().toISOString(),
  },
  {
    id: 'sp_sec_alto',
    service_type: 'Auditoría de Ciberseguridad',
    scope_tier: 'Alto Alcance / A la Medida',
    min_price_mxn: 135000,
    max_price_mxn: 290000,
    delivery_time: '4 a 8 semanas',
    advance_percentage: 40,
    is_monthly: false,
    summary: 'Evaluación corporativa integral, cumplimiento normativo y blindaje continuo crítico.',
    updated_at: new Date().toISOString(),
  },
  {
    id: 'sp_cloud_esencial',
    service_type: 'Infraestructura y Nube',
    scope_tier: 'Esencial / PyME',
    min_price_mxn: 25000,
    max_price_mxn: 50000,
    delivery_time: '1 a 3 semanas',
    advance_percentage: 25,
    is_monthly: false,
    summary: 'Configuración segura en la nube, respaldos automatizados y optimización de costos.',
    updated_at: new Date().toISOString(),
  },
  {
    id: 'sp_cloud_empresarial',
    service_type: 'Infraestructura y Nube',
    scope_tier: 'Profesional / Empresarial',
    min_price_mxn: 60000,
    max_price_mxn: 135000,
    delivery_time: '3 a 6 semanas',
    advance_percentage: 25,
    is_monthly: false,
    summary: 'Migración empresarial sin interrupciones, redundancia activa y monitoreo 24/7.',
    updated_at: new Date().toISOString(),
  },
  {
    id: 'sp_cloud_alto',
    service_type: 'Infraestructura y Nube',
    scope_tier: 'Alto Alcance / A la Medida',
    min_price_mxn: 150000,
    max_price_mxn: 320000,
    delivery_time: '6 a 12 semanas',
    advance_percentage: 40,
    is_monthly: false,
    summary: 'Arquitectura multi-región de alta disponibilidad (SLA 99.99%) y recuperación ante desastres.',
    updated_at: new Date().toISOString(),
  },
  {
    id: 'sp_sop_esencial',
    service_type: 'Soporte y Mantenimiento Técnico',
    scope_tier: 'Esencial / PyME',
    min_price_mxn: 12000,
    max_price_mxn: 24000,
    delivery_time: 'Activación en 48 horas',
    advance_percentage: 25,
    is_monthly: true,
    summary: 'Póliza mensual de monitoreo preventivo, actualizaciones de seguridad y soporte.',
    updated_at: new Date().toISOString(),
  },
  {
    id: 'sp_sop_empresarial',
    service_type: 'Soporte y Mantenimiento Técnico',
    scope_tier: 'Profesional / Empresarial',
    min_price_mxn: 28000,
    max_price_mxn: 58000,
    delivery_time: 'Activación en 24 a 48 horas',
    advance_percentage: 25,
    is_monthly: true,
    summary: 'Soporte prioritario B2B con mesa de ayuda dedicada, mejoras evolutivas y SLA.',
    updated_at: new Date().toISOString(),
  },
  {
    id: 'sp_sop_alto',
    service_type: 'Soporte y Mantenimiento Técnico',
    scope_tier: 'Alto Alcance / A la Medida',
    min_price_mxn: 65000,
    max_price_mxn: 140000,
    delivery_time: 'Activación prioritaria en 24 horas',
    advance_percentage: 40,
    is_monthly: true,
    summary: 'Cobertura dedicada 24/7 para operaciones críticas con continuidad garantizada.',
    updated_at: new Date().toISOString(),
  },
];

export const FALLBACK_SOFTWARE_CATALOG: SoftwareCatalogProduct[] = [
  {
    id: 'sw_pos_pro_v3',
    title: 'Punto de Venta MRCA Pro',
    category: 'Punto de Venta (POS)',
    version: 'v3.2.0',
    short_description:
      'Sistema de Punto de Venta empresarial listo para instalar con control de caja, lector de códigos de barras, corte diario y preparación para facturación CFDI 4.0.',
    features: [
      'Cobro rápido con lector de códigos de barras y tickets térmicos 58mm/80mm',
      'Control de inventario en tiempo real con alertas de stock mínimo',
      'Cortes de caja por turno, cajero y método de pago (Efectivo, Tarjeta, SPEI)',
      'Reportes ejecutivos exportables a Excel y PDF listos para contabilidad',
      'Modo offline resiliente con sincronización automática al reconectar',
    ],
    system_requirements:
      'Windows 10/11 (64-bit) o Linux Ubuntu 22.04+, 4 GB RAM mínimo (8 GB recomendado), 500 MB libres, impresora térmica opcional.',
    price_mxn: 14900,
    zip_file_path: 'packages/mrca-pos-pro-v3.2.0.zip',
    manual_file_path: 'manuals/manual-usuario-mrca-pos-pro-v3.2.pdf',
    installation_guide_md:
      '# Manual de Instalación y Uso — Punto de Venta MRCA Pro (v3.2.0)\n\n' +
      '## 1. Requisitos Previos\n' +
      '- Equipo con Windows 10/11 (64-bit) o Linux.\n' +
      '- Permisos de administrador local para la primera instalación.\n\n' +
      '## 2. Pasos de Instalación\n' +
      '1. Descarga el archivo `mrca-pos-pro-v3.2.0.zip` desde tu Portal de Clientes.\n' +
      '2. Descomprime el paquete en `C:\\MRCA-POS\\`.\n' +
      '3. Ejecuta `Instalador_MRCA_POS.exe` como Administrador y sigue el asistente.\n' +
      '4. Ingresa la clave de licencia asignada en tu contrato empresarial.\n\n' +
      '## 3. Configuración Inicial\n' +
      '- Registra Razón Social, RFC y datos de sucursal en **Configuración → Empresa**.\n' +
      '- Conecta tu impresora térmica y realiza una prueba de ticket en **Ajustes → Periféricos**.\n' +
      '- Importa tu catálogo inicial desde la plantilla Excel incluida en `/plantillas`.\n\n' +
      '## 4. Soporte Técnico\n' +
      'Si necesitas acompañamiento en tu arranque, abre el Asistente MRCA o crea un ticket en **Soporte Técnico VIP**.',
    is_active: true,
    created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
  },
  {
    id: 'sw_inv_multi_v2',
    title: 'MRCA Control de Inventario & Almacenes',
    category: 'Gestión e Inventario',
    version: 'v2.5.1',
    short_description:
      'Suite multi-sucursal para administración de bodegas, entradas y salidas auditadas, kardex completo y valuación de existencias en tiempo real.',
    features: [
      'Gestión multi-almacén con trazabilidad por lote, serie y caducidad',
      'Kardex histórico con bitácora por usuario y aprobaciones de traspasos',
      'Importación y exportación masiva en Excel y CSV',
      'Alertas automatizadas de reabastecimiento y puntos de reorden',
      'Respaldos cifrados programables en un clic',
    ],
    system_requirements: 'Windows 10/11 o macOS 13+, 4 GB RAM, 350 MB libres en disco.',
    price_mxn: 18500,
    zip_file_path: 'packages/mrca-inventario-v2.5.1.zip',
    manual_file_path: 'manuals/manual-mrca-inventario-v2.5.pdf',
    installation_guide_md:
      '# Guía Rápida — MRCA Control de Inventario (v2.5.1)\n\n' +
      '## 1. Instalación\n' +
      '1. Descomprime `mrca-inventario-v2.5.1.zip` en una carpeta dedicada.\n' +
      '2. Ejecuta `Setup_Inventario_MRCA.exe`.\n' +
      '3. Selecciona modo **Monousuario** o **Red Local (Multi-Sucursal)**.\n\n' +
      '## 2. Primer Arranque\n' +
      '- Da de alta tus almacenes en **Catálogos → Almacenes**.\n' +
      '- Crea perfiles de operador y supervisor para auditar cada movimiento.\n' +
      '- Carga tu inventario inicial mediante archivo CSV o captura guiada.',
    is_active: true,
    created_at: new Date(Date.now() - 86400000 * 12).toISOString(),
  },
  {
    id: 'sw_auto_concil_v1',
    title: 'MRCA Automatizador de Reportes y Conciliación',
    category: 'Automatización',
    version: 'v1.8.0',
    short_description:
      'Herramienta empresarial lista para desplegar que automatiza conciliación de pagos SPEI, validación CFDI 4.0 y reportes ejecutivos.',
    features: [
      'Conciliación automatizada de movimientos bancarios SPEI contra facturación',
      'Generación programada de reportes ejecutivos PDF y Excel',
      'Validación masiva de estructura XML CFDI 4.0',
      'Ejecución local segura sin exponer información financiera a terceros',
    ],
    system_requirements: 'Windows 10/11 o Linux, 4 GB RAM, 300 MB libres en disco.',
    price_mxn: 22000,
    zip_file_path: 'packages/mrca-conciliador-v1.8.0.zip',
    manual_file_path: null,
    installation_guide_md:
      '# Manual de Instalación — MRCA Automatizador de Reportes (v1.8.0)\n\n' +
      '## 1. Despliegue Local\n' +
      '1. Extrae `mrca-conciliador-v1.8.0.zip` en tu equipo administrativo.\n' +
      '2. Ejecuta `MRCA_Conciliador.exe` y completa el asistente inicial.\n' +
      '3. Selecciona las carpetas locales de tus archivos XML CFDI 4.0 y estados CSV.\n\n' +
      '## 2. Operación Diaria\n' +
      '- Presiona **Ejecutar Conciliación** para cruzar pagos recibidos contra facturas emitidas.\n' +
      '- Exporta el reporte directivo en PDF o Excel con un solo clic.',
    is_active: true,
    created_at: new Date(Date.now() - 86400000 * 20).toISOString(),
  },
];

export function formatMxnCurrency(amount: number): string {
  return `$${Number(amount || 0).toLocaleString('es-MX')}`;
}

export function getCachedServicePricingSync(): ServicePricingRecord[] {
  if (typeof window === 'undefined') return FALLBACK_SERVICE_PRICING;
  try {
    const raw = localStorage.getItem(PRICING_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    // fallback
  }
  return FALLBACK_SERVICE_PRICING;
}

/**
 * Carga la matriz de precios viva desde Supabase `service_pricing`.
 * Si el entorno está offline o la tabla aún no existe, cae de forma segura a caché local o respaldo.
 */
export async function fetchLiveServicePricing(): Promise<{
  rows: ServicePricingRecord[];
  source: 'supabase' | 'local';
}> {
  try {
    const { data, error } = await supabase
      .from('service_pricing')
      .select('*')
      .order('service_type', { ascending: true });

    if (!error && Array.isArray(data) && data.length > 0) {
      const normalized: ServicePricingRecord[] = data.map((row: any) => ({
        id: String(row.id),
        service_type: row.service_type,
        scope_tier: row.scope_tier,
        min_price_mxn: Number(row.min_price_mxn),
        max_price_mxn: Number(row.max_price_mxn),
        delivery_time: row.delivery_time,
        advance_percentage: Number(row.advance_percentage) === 40 ? 40 : 25,
        is_monthly:
          typeof row.is_monthly === 'boolean'
            ? row.is_monthly
            : String(row.service_type || '').toLowerCase().includes('soporte'),
        summary: row.summary || '',
        updated_at: row.updated_at || new Date().toISOString(),
      }));

      try {
        localStorage.setItem(PRICING_STORAGE_KEY, JSON.stringify(normalized));
      } catch {
        // ignore storage quota errors
      }
      return { rows: normalized, source: 'supabase' };
    }
  } catch {
    // fallback below
  }

  return { rows: getCachedServicePricingSync(), source: 'local' };
}

/**
 * Actualiza un renglón de `service_pricing` (uso exclusivo de superadmin desde AdminPricingManager).
 */
export async function upsertServicePricingRow(
  row: ServicePricingRecord
): Promise<{ success: boolean; syncedRemote: boolean; errorMessage?: string }> {
  const updatedRow: ServicePricingRecord = {
    ...row,
    min_price_mxn: Number(row.min_price_mxn),
    max_price_mxn: Math.max(Number(row.min_price_mxn), Number(row.max_price_mxn)),
    advance_percentage: Number(row.advance_percentage) === 40 ? 40 : 25,
    updated_at: new Date().toISOString(),
  };

  let syncedRemote = false;
  let errorMessage: string | undefined;

  try {
    const { error } = await supabase.from('service_pricing').upsert(
      {
        service_type: updatedRow.service_type,
        scope_tier: updatedRow.scope_tier,
        min_price_mxn: updatedRow.min_price_mxn,
        max_price_mxn: updatedRow.max_price_mxn,
        delivery_time: updatedRow.delivery_time,
        advance_percentage: updatedRow.advance_percentage,
        is_monthly: Boolean(updatedRow.is_monthly),
        summary: updatedRow.summary || '',
        updated_at: updatedRow.updated_at,
      },
      { onConflict: 'service_type,scope_tier' }
    );

    if (!error) {
      syncedRemote = true;
    } else {
      errorMessage = error.message;
    }
  } catch (err: any) {
    errorMessage = err?.message;
  }

  try {
    const current = getCachedServicePricingSync();
    const exists = current.some(
      (c) => c.service_type === updatedRow.service_type && c.scope_tier === updatedRow.scope_tier
    );
    const next = exists
      ? current.map((c) =>
          c.service_type === updatedRow.service_type && c.scope_tier === updatedRow.scope_tier
            ? { ...c, ...updatedRow }
            : c
        )
      : [...current, updatedRow];

    localStorage.setItem(PRICING_STORAGE_KEY, JSON.stringify(next));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(PRICING_SYNC_EVENT));
    }
  } catch {
    // ignore storage errors
  }

  return { success: true, syncedRemote, errorMessage };
}

export function buildQuoteEstimateFromPricing(
  rows: ServicePricingRecord[],
  serviceType: MrcaServiceName,
  projectScope: MrcaScopeTier
): QuoteEstimateResult {
  const matched =
    rows.find((r) => r.service_type === serviceType && r.scope_tier === projectScope) ||
    FALLBACK_SERVICE_PRICING.find(
      (r) => r.service_type === serviceType && r.scope_tier === projectScope
    ) ||
    FALLBACK_SERVICE_PRICING[0];

  const isMonthly =
    typeof matched.is_monthly === 'boolean'
      ? matched.is_monthly
      : serviceType === 'Soporte y Mantenimiento Técnico';
  const suffix = isMonthly ? ' MXN / mes' : ' MXN';
  const minMxn = Number(matched.min_price_mxn);
  const maxMxn = Number(matched.max_price_mxn);
  const advancePercentage: 25 | 40 = Number(matched.advance_percentage) === 40 ? 40 : 25;

  return {
    serviceType,
    projectScope,
    formattedRange: `${formatMxnCurrency(minMxn)} - ${formatMxnCurrency(maxMxn)}${suffix}`,
    minMxn,
    maxMxn,
    isMonthly,
    deliveryTime: matched.delivery_time,
    advancePercentage,
    advanceLabel:
      advancePercentage === 40
        ? '40% de anticipo SPEI (Proyecto de Alto Alcance)'
        : '25% de anticipo SPEI (Esquema Estándar)',
    summary:
      matched.summary ||
      SCOPE_TIER_META[projectScope].subtitle,
    disclaimer: MANDATORY_QUOTE_DISCLAIMER,
  };
}
