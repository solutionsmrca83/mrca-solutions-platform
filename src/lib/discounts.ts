import { DiscountCoupon } from '../types';

export const VALID_DISCOUNT_COUPONS: DiscountCoupon[] = [
  {
    code: 'BECA-50',
    name: 'Beca Académica Talento 50%',
    discountPercentage: 50,
    applicableTo: 'student',
    description: 'Subsidio directo del 50% para proyectos de ingeniería y residencias profesionales.',
    expiryNotice: 'Válido para ciclo escolar activo',
  },
  {
    code: 'ALIANZA-B2B',
    name: 'Alianza Estratégica Corporativa',
    discountPercentage: 25,
    applicableTo: 'enterprise',
    description: '25% de bonificación en sprints de desarrollo, hardening y contratos de arquitectura.',
    expiryNotice: 'Aplicable a transferencias SPEI directas',
  },
  {
    code: 'ESTUDIANTE-25',
    name: 'Convenio Interuniversitario UNAM/IPN/ITESM',
    discountPercentage: 25,
    applicableTo: 'student',
    description: '25% de descuento presentando credencial de estudiante vigente.',
    expiryNotice: 'Válido para todas las carreras técnicas',
  },
  {
    code: 'MRCA-LAUNCH',
    name: 'Cupón Especial de Lanzamiento',
    discountPercentage: 30,
    applicableTo: 'all',
    description: '30% de bonificación de bienvenida en cualquier solución o plantilla base.',
    expiryNotice: 'Cupón de plataforma activa',
  },
  {
    code: 'TALENTO-40',
    name: 'Beca Excelencia Académica',
    discountPercentage: 40,
    applicableTo: 'student',
    description: '40% de descuento para estudiantes con promedio sobresaliente o proyectos de titulación.',
    expiryNotice: 'Verificación automática',
  },
];

export interface ApplyDiscountResult {
  isValid: boolean;
  coupon?: DiscountCoupon;
  discountPercentage: number;
  discountAmount: number;
  originalPrice: number;
  discountedPrice: number;
  errorMessage?: string;
}

export function evaluateDiscountCode(
  rawCode: string,
  currentPrice: number,
  clientType?: 'student' | 'enterprise'
): ApplyDiscountResult {
  const normalized = rawCode.trim().toUpperCase();

  if (!normalized) {
    return {
      isValid: false,
      discountPercentage: 0,
      discountAmount: 0,
      originalPrice: currentPrice,
      discountedPrice: currentPrice,
      errorMessage: 'Por favor ingrese un código.',
    };
  }

  const matched = VALID_DISCOUNT_COUPONS.find(
    (c) => c.code.toUpperCase() === normalized
  );

  if (!matched) {
    return {
      isValid: false,
      discountPercentage: 0,
      discountAmount: 0,
      originalPrice: currentPrice,
      discountedPrice: currentPrice,
      errorMessage: 'Código de alianza o beca no válido o expirado.',
    };
  }

  // Type check if specified
  if (clientType && matched.applicableTo !== 'all' && matched.applicableTo !== clientType) {
    return {
      isValid: false,
      discountPercentage: 0,
      discountAmount: 0,
      originalPrice: currentPrice,
      discountedPrice: currentPrice,
      errorMessage: `Este código está reservado para la división ${
        matched.applicableTo === 'student' ? 'Académica (Estudiantes)' : 'B2B Corporativa'
      }.`,
    };
  }

  const discountAmount = Math.round((currentPrice * matched.discountPercentage) / 100);
  const discountedPrice = Math.max(0, currentPrice - discountAmount);

  return {
    isValid: true,
    coupon: matched,
    discountPercentage: matched.discountPercentage,
    discountAmount,
    originalPrice: currentPrice,
    discountedPrice,
  };
}
