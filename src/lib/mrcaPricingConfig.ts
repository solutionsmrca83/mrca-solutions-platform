/**
 * MRCA SOLUTIONS — CONFIGURACIÓN EDITABLE DE COTIZADOR ESTIMADO (MXN)
 * Archivo centralizado para actualizar fácilmente rangos de inversión en MXN,
 * tiempos aproximados de entrega y porcentajes sugeridos de anticipo SPEI
 * sin modificar la lógica del motor conversacional.
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

export interface PricingTierConfig {
  minMxn: number;
  maxMxn: number;
  isMonthly?: boolean;
  deliveryTime: string;
  advancePercentage: 25 | 40;
  summary: string;
}

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

/**
 * Aviso obligatorio de transparencia comercial mostrado en toda Tarjeta de Cotización Estimada.
 */
export const MANDATORY_QUOTE_DISCLAIMER =
  'Nota importante: Este monto es únicamente un estimado referencial. El precio final se establece —y puede mantenerse o incluso disminuir— al platicar los detalles exactos directamente con el director o el líder asignado a tu proyecto.';

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

/**
 * Matriz editable de precios referenciales (MXN + IVA), tiempos de entrega y anticipo SPEI:
 * - Esencial / PyME y Profesional / Empresarial -> 25% de anticipo
 * - Alto Alcance / A la Medida -> 40% de anticipo
 */
export const MRCA_PRICING_MATRIX: Record<MrcaServiceName, Record<MrcaScopeTier, PricingTierConfig>> = {
  'Desarrollo Web & SaaS': {
    'Esencial / PyME': {
      minMxn: 28000,
      maxMxn: 55000,
      deliveryTime: '2 a 4 semanas',
      advancePercentage: 25,
      summary: 'Sitio corporativo o aplicación web inicial con panel administrable y alta velocidad.',
    },
    'Profesional / Empresarial': {
      minMxn: 65000,
      maxMxn: 145000,
      deliveryTime: '5 a 8 semanas',
      advancePercentage: 25,
      summary: 'Plataforma web o SaaS B2B completa con roles de usuario, base de datos blindada e integraciones.',
    },
    'Alto Alcance / A la Medida': {
      minMxn: 160000,
      maxMxn: 340000,
      deliveryTime: '10 a 16 semanas',
      advancePercentage: 40,
      summary: 'Ecosistema SaaS multi-empresa a la medida, alta concurrencia, SLA garantizado y cumplimiento corporativo.',
    },
  },

  'Auditoría de Ciberseguridad': {
    'Esencial / PyME': {
      minMxn: 22000,
      maxMxn: 45000,
      deliveryTime: '1 a 2 semanas',
      advancePercentage: 25,
      summary: 'Evaluación integral de superficie expuesta, diagnóstico ejecutivo y plan prioritario de mitigación.',
    },
    'Profesional / Empresarial': {
      minMxn: 55000,
      maxMxn: 120000,
      deliveryTime: '2 a 4 semanas',
      advancePercentage: 25,
      summary: 'Auditoría profunda de aplicaciones, APIs y nube con reporte ejecutivo y acompañamiento de remediación.',
    },
    'Alto Alcance / A la Medida': {
      minMxn: 135000,
      maxMxn: 290000,
      deliveryTime: '4 a 8 semanas',
      advancePercentage: 40,
      summary: 'Evaluación corporativa integral, preparación de cumplimiento normativo y blindaje continuo de misión crítica.',
    },
  },

  'Infraestructura y Nube': {
    'Esencial / PyME': {
      minMxn: 25000,
      maxMxn: 50000,
      deliveryTime: '1 a 3 semanas',
      advancePercentage: 25,
      summary: 'Configuración segura en la nube, respaldos automatizados y optimización de costos operativos.',
    },
    'Profesional / Empresarial': {
      minMxn: 60000,
      maxMxn: 135000,
      deliveryTime: '3 a 6 semanas',
      advancePercentage: 25,
      summary: 'Migración empresarial sin interrupciones, redundancia activa, monitoreo 24/7 y control de accesos.',
    },
    'Alto Alcance / A la Medida': {
      minMxn: 150000,
      maxMxn: 320000,
      deliveryTime: '6 a 12 semanas',
      advancePercentage: 40,
      summary: 'Arquitectura multi-región de alta disponibilidad (SLA 99.99%), recuperación ante desastres y gobierno de nube.',
    },
  },

  'Soporte y Mantenimiento Técnico': {
    'Esencial / PyME': {
      minMxn: 12000,
      maxMxn: 24000,
      isMonthly: true,
      deliveryTime: 'Activación en 48 horas',
      advancePercentage: 25,
      summary: 'Póliza mensual de monitoreo preventivo, actualizaciones de seguridad y atención de incidencias.',
    },
    'Profesional / Empresarial': {
      minMxn: 28000,
      maxMxn: 58000,
      isMonthly: true,
      deliveryTime: 'Activación en 24 a 48 horas',
      advancePercentage: 25,
      summary: 'Soporte prioritario B2B con mesa de ayuda dedicada, mejoras evolutivas y tiempos de respuesta SLA.',
    },
    'Alto Alcance / A la Medida': {
      minMxn: 65000,
      maxMxn: 140000,
      isMonthly: true,
      deliveryTime: 'Activación prioritaria en 24 horas',
      advancePercentage: 40,
      summary: 'Cobertura dedicada 24/7 para operaciones críticas, ingeniería asignada y continuidad operativa garantizada.',
    },
  },
};

export function formatMxnCurrency(amount: number): string {
  return `$${amount.toLocaleString('es-MX')}`;
}

export function getQuoteEstimate(
  serviceType: MrcaServiceName,
  projectScope: MrcaScopeTier
): QuoteEstimateResult {
  const tier = MRCA_PRICING_MATRIX[serviceType][projectScope];
  const suffix = tier.isMonthly ? ' MXN / mes' : ' MXN';
  const formattedRange = `${formatMxnCurrency(tier.minMxn)} - ${formatMxnCurrency(tier.maxMxn)}${suffix}`;

  return {
    serviceType,
    projectScope,
    formattedRange,
    minMxn: tier.minMxn,
    maxMxn: tier.maxMxn,
    isMonthly: Boolean(tier.isMonthly),
    deliveryTime: tier.deliveryTime,
    advancePercentage: tier.advancePercentage,
    advanceLabel:
      tier.advancePercentage === 40
        ? '40% de anticipo SPEI (Proyecto de Alto Alcance)'
        : '25% de anticipo SPEI (Esquema Estándar)',
    summary: tier.summary,
    disclaimer: MANDATORY_QUOTE_DISCLAIMER,
  };
}
