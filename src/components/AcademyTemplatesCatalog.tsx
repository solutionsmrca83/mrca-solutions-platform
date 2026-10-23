import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Code2,
  Database,
  Network,
  Cpu,
  Shield,
  Layers,
  Zap,
  CheckCircle2,
  Download,
  ExternalLink,
  Copy,
  Check,
  Tag,
  Percent,
  SlidersHorizontal,
  X,
  FileText,
  Clock,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Info,
} from 'lucide-react';
import { AcademyTemplate } from '../types';
import { evaluateDiscountCode, ApplyDiscountResult } from '../lib/discounts';
import { BudgetNegotiationModal } from './BudgetNegotiationModal';

const ACADEMY_TEMPLATES: AcademyTemplate[] = [
  {
    id: 'TMPL-01',
    title: 'Sistema de Inventario Web Modular',
    category: 'Ingeniería Web',
    price: 550,
    originalPrice: 1100,
    deliveryTime: 'Descarga Inmediata (ZIP / Git)',
    complexity: 'Básico',
    techStack: ['React 19', 'FastAPI Python', 'SQLite Relacional', 'Tailwind CSS'],
    tags: ['Entrega Inmediata', 'Código Comentado', 'Manual de Despliegue', 'Rúbrica Aprobada'],
    description:
      'Solución integral de control de existencias y almacén. Incluye operaciones CRUD reactivas, autenticación, exportación de reportes y scripts de migración.',
    deliverables: [
      'Código fuente 100% comentado en español línea por línea',
      'Documentación interactiva de endpoints con Swagger OpenAPI',
      'Guía en PDF con instrucciones paso a paso para ejecutar localmente',
    ],
    features: [
      'Control de existencias y alertas automáticas de stock mínimo',
      'Filtro reactivo por categorías, código SKU y proveedores',
      'Manejo de sesiones seguras y validación de tipos',
    ],
  },
  {
    id: 'TMPL-02',
    title: 'Monitor de Paquetes de Red & Sniffer',
    category: 'Redes & Conectividad',
    price: 680,
    originalPrice: 1360,
    deliveryTime: 'Descarga Inmediata (Python + PCAP)',
    complexity: 'Intermedio',
    techStack: ['Python Scapy', 'Socket.IO', 'Wireshark PCAP', 'FastAPI'],
    tags: ['Entrega Inmediata', 'Código Comentado', 'Filtro BPF', 'Linux & Windows'],
    description:
      'Captura y analiza tráfico promiscuo en tiempo real. Inspecciona protocolos TCP, UDP, ICMP y DNS con exportación directa de capturas .pcap y visualizador web.',
    deliverables: [
      'Script modular en Python con comentarios didácticos en cada función',
      'Dashboard web interactivo con transmisión de paquetes vía WebSockets',
      'Diagrama conceptual de capas modelo OSI en alta resolución',
    ],
    features: [
      'Detección de escaneos SYN y ráfagas anómalas de paquetes',
      'Decodificación de encabezados IPv4 e IPv6 con cálculo de checksum',
      'Métricas de ancho de banda y distribución por protocolo',
    ],
  },
  {
    id: 'TMPL-03',
    title: 'Gestor & Normalizador de BD SQL (3FN)',
    category: 'Bases de Datos',
    price: 490,
    originalPrice: 980,
    deliveryTime: 'Descarga Inmediata (Scripts SQL + DER)',
    complexity: 'Básico',
    techStack: ['PostgreSQL', 'MySQL', 'DBeaver', 'Diagrama Crow Foot'],
    tags: ['Entrega Inmediata', 'Código Comentado', '3FN Estricta', 'Diagrama E-R HD'],
    description:
      'Modelo relacional empresarial estructurado en Tercera Forma Normal (3FN). Incluye DDL con constraints de integridad referencial, triggers de auditoría y datos semilla dummy.',
    deliverables: [
      'Script .sql relacional limpio y validado sin errores de sintaxis',
      'Diagrama Entidad-Relación (DER) en PDF con notación Crow Foot',
      'Diccionario formal de datos con especificación de atributos y tipos',
    ],
    features: [
      '10 tablas interconectadas con claves primarias y foráneas protegidas',
      '5 Procedimientos almacenados (SP) y funciones PL/pgSQL parametrizadas',
      'Consultas analíticas con JOINs múltiples, subconsultas y GROUP BY',
    ],
  },
  {
    id: 'TMPL-04',
    title: 'API REST Microservicios con Auth JWT',
    category: 'Backend & APIs',
    price: 590,
    originalPrice: 1180,
    deliveryTime: 'Descarga Inmediata (TypeScript + Postman)',
    complexity: 'Intermedio',
    techStack: ['Node.js', 'Express', 'TypeScript', 'JWT', 'Swagger UI'],
    tags: ['Entrega Inmediata', 'Código Comentado', 'Colección Postman', 'Swagger Docs'],
    description:
      'Plantilla de backend robusta con arquitectura desacoplada en capas (Routes, Controllers, Services). Autenticación token JWT, hashing de contraseñas con bcrypt y pruebas automáticas.',
    deliverables: [
      'Repositorio TypeScript completo con configuración npm y linters',
      'Colección exportada de Postman (.json) para demostración en clase',
      'Interfaz Swagger UI interactiva lista para probar en el navegador',
    ],
    features: [
      'Protección con Helmet, CORS y limitación de tasa (Rate Limiting)',
      'Validación exhaustiva de datos de entrada mediante esquemas Zod',
      'Manejo centralizado y seguro de códigos de estado HTTP',
    ],
  },
  {
    id: 'TMPL-05',
    title: 'Sistema IoT Telemetría ESP32 & MQTT',
    category: 'Sistemas Embebidos',
    price: 720,
    originalPrice: 1440,
    deliveryTime: 'Descarga Inmediata (C++ PlatformIO)',
    complexity: 'Intermedio',
    techStack: ['C++ ESP32', 'PlatformIO', 'Mosquitto MQTT', 'Dashboard Web'],
    tags: ['Entrega Inmediata', 'Código Comentado', 'Esquemático Fritzing', 'Wi-Fi Resiliente'],
    description:
      'Firmware para ESP32 con lectura periódica de sensores ambientales (temperatura, humedad, distancia), reconexión Wi-Fi autónoma y publicación telemétrica vía broker MQTT.',
    deliverables: [
      'Proyecto completo PlatformIO / Arduino IDE con dependencias resueltas',
      'Esquemático de conexiones electrónicas en formato Fritzing',
      'Dashboard web receptor con medidores dinámicos en tiempo real',
    ],
    features: [
      'Algoritmo de reconexión tolerante a caídas de red Wi-Fi',
      'Rutina opcional de bajo consumo en Deep Sleep para baterías',
      'Publicación y suscripción a tópicos MQTT con QoS configurable',
    ],
  },
  {
    id: 'TMPL-06',
    title: 'Parser Kali Linux & Generador Reportes Pentest',
    category: 'Ciberseguridad',
    price: 750,
    originalPrice: 1500,
    deliveryTime: 'Descarga Inmediata (Python Kali)',
    complexity: 'Avanzado',
    techStack: ['Python 3', 'Kali Linux', 'Nmap XML Parser', 'ReportLab PDF'],
    tags: ['Entrega Inmediata', 'Código Comentado', 'Reporte PDF Ejecutivo', 'Kali Compatible'],
    description:
      'Herramienta automatizada para laboratorios de hacking ético. Procesa escaneos de Nmap, detecta servicios inseguros, los correlaciona con la base de datos de vulnerabilidades y crea un reporte PDF ejecutivo.',
    deliverables: [
      'Script .py listo para correr en terminal Kali Linux o Ubuntu',
      'Plantilla de informe ejecutivo de auditoría en PDF editable',
      'Guía con preguntas frecuentes del sínodo y fundamentos de mitigación',
    ],
    features: [
      'Extracción automática de banners de puertos y versiones vulnerables',
      'Clasificación de riesgos según severidad (Crítico, Alto, Medio, Bajo)',
      'Ejecución local autónoma sin requerir suscripciones a APIs de pago',
    ],
  },
];

interface AcademyTemplatesCatalogProps {
  showToast?: (msg: string) => void;
}

export const AcademyTemplatesCatalog: React.FC<AcademyTemplatesCatalogProps> = ({
  showToast,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('todas');
  const [activeTemplateForBuy, setActiveTemplateForBuy] = useState<AcademyTemplate | null>(null);
  const [couponCode, setCouponCode] = useState('');
  const [appliedCouponResult, setAppliedCouponResult] = useState<ApplyDiscountResult | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [isCopiedClabe, setIsCopiedClabe] = useState(false);
  const [negotiatingTemplate, setNegotiatingTemplate] = useState<AcademyTemplate | null>(null);
  const [downloadInitiated, setDownloadInitiated] = useState(false);

  const categories = ['todas', 'Ingeniería Web', 'Redes & Conectividad', 'Bases de Datos', 'Backend & APIs', 'Sistemas Embebidos', 'Ciberseguridad'];

  const filteredTemplates =
    selectedCategory === 'todas'
      ? ACADEMY_TEMPLATES
      : ACADEMY_TEMPLATES.filter((t) => t.category === selectedCategory);

  const handleApplyCouponInModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTemplateForBuy) return;
    setCouponError(null);
    const res = evaluateDiscountCode(couponCode, activeTemplateForBuy.price, 'student');
    if (!res.isValid) {
      setCouponError(res.errorMessage || 'Código no válido');
      setAppliedCouponResult(null);
      if (showToast) showToast(res.errorMessage || 'Código de alianza no válido');
    } else {
      setAppliedCouponResult(res);
      if (showToast) {
        showToast(`¡Código ${res.coupon?.code} aplicado! Precio reducido a $${res.discountedPrice} MXN`);
      }
    }
  };

  const handleCopyClabe = () => {
    navigator.clipboard.writeText('638180000123456789');
    setIsCopiedClabe(true);
    if (showToast) showToast('CLABE copiada al portapapeles.');
    setTimeout(() => setIsCopiedClabe(false), 2200);
  };

  const handleOpenBuyModal = (template: AcademyTemplate) => {
    setActiveTemplateForBuy(template);
    setCouponCode('');
    setAppliedCouponResult(null);
    setCouponError(null);
    setDownloadInitiated(false);
  };

  const finalPrice = activeTemplateForBuy
    ? appliedCouponResult?.isValid
      ? appliedCouponResult.discountedPrice
      : activeTemplateForBuy.price
    : 0;

  return (
    <section id="catalogo-plantillas" className="flex flex-col gap-8 pt-6 relative">
      {/* Header Banner */}
      <div className="flex flex-col items-center text-center gap-3 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00fe66]/15 border border-[#00fe66]/35 text-[#00fe66] font-['JetBrains_Mono'] text-[11px] font-bold uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5" />
          <span>SOLUCIONES PRE-CONSTRUIDAS DE ACCESO INMEDIATO</span>
        </div>

        <h2 className="font-['Space_Grotesk'] text-[28px] sm:text-[38px] font-extrabold text-[#dce1ff] tracking-tight">
          Catálogo de Plantillas Base
        </h2>

        <p className="font-['Inter'] text-[14px] sm:text-[15px] text-[#bac9cc] leading-relaxed max-w-2xl">
          Arquitecturas académicas pre-ensambladas y probadas bajo estándares de ingeniería.
          Ideales para proyectos con plazos de entrega inminentes o presupuestos estudiantiles accesibles.
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-center gap-2 overflow-x-auto pb-2 no-scrollbar px-2">
        {categories.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setSelectedCategory(cat)}
            className={`px-3.5 py-1.5 rounded-full font-['JetBrains_Mono'] text-[11px] font-semibold tracking-wider whitespace-nowrap transition-all ${
              selectedCategory === cat
                ? 'bg-[#00e5ff] text-[#00363d] shadow-[0_0_15px_rgba(0,229,255,0.35)] scale-105'
                : 'bg-[#101938] text-[#bac9cc] hover:text-[#00e5ff] border border-[#1b2b52]'
            }`}
          >
            {cat === 'todas' ? 'TODAS LAS PLANTILLAS' : cat.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.map((template) => (
          <motion.div
            key={template.id}
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.35 }}
            className="rounded-3xl bg-[#0b1430]/85 border-2 border-[#1c2c54] hover:border-[#00e5ff]/50 p-6 flex flex-col justify-between gap-5 backdrop-blur-2xl shadow-xl transition-all group hover:shadow-[0_10px_40px_rgba(0,229,255,0.15)] relative overflow-hidden"
          >
            {/* Top Cyber Accent Line */}
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#00e5ff]/40 to-transparent group-hover:via-[#00fe66]/70 transition-all" />

            <div className="flex flex-col gap-4">
              {/* Category & Tags Header */}
              <div className="flex items-start justify-between gap-2">
                <span className="font-['JetBrains_Mono'] text-[10px] text-[#00daf3] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-[#00daf3]/10 border border-[#00daf3]/30">
                  {template.category}
                </span>
                <span className="font-['JetBrains_Mono'] text-[10px] text-[#849396]">
                  {template.complexity}
                </span>
              </div>

              {/* Title & Description */}
              <div>
                <h3 className="font-['Space_Grotesk'] text-[20px] font-bold text-[#dce1ff] group-hover:text-[#00e5ff] transition-colors leading-snug">
                  {template.title}
                </h3>
                <p className="font-['Inter'] text-[13px] text-[#bac9cc] mt-2 line-clamp-3 leading-relaxed">
                  {template.description}
                </p>
              </div>

              {/* Tags Badges (Entrega Inmediata & Código Comentado) */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {template.tags.map((tag, tIdx) => (
                  <span
                    key={tIdx}
                    className={`font-['JetBrains_Mono'] text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                      tag === 'Entrega Inmediata'
                        ? 'bg-[#00fe66]/15 border-[#00fe66]/40 text-[#00fe66]'
                        : tag === 'Código Comentado'
                        ? 'bg-[#00e5ff]/15 border-[#00e5ff]/40 text-[#00e5ff]'
                        : 'bg-[#162244] border-[#223363] text-[#bac9cc]'
                    }`}
                  >
                    {tag}
                  </span>
                ))}
              </div>

              {/* Tech Stack Chips */}
              <div className="flex flex-wrap gap-1 pt-1">
                {template.techStack.map((tech, techIdx) => (
                  <span
                    key={techIdx}
                    className="font-['JetBrains_Mono'] text-[10px] text-[#bac9cc] px-2 py-0.5 rounded bg-[#060c20] border border-[#1b2b52]"
                  >
                    {tech}
                  </span>
                ))}
              </div>

              {/* Inclusions summary */}
              <div className="p-3 rounded-2xl bg-[#060d24] border border-[#1b2b52] flex flex-col gap-1 text-[11px] font-['Inter'] text-[#bac9cc]">
                <div className="flex items-center gap-2 text-[#00fe66]">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  <span>Código 100% comentado y ejecutable</span>
                </div>
                <div className="flex items-center gap-2 text-[#00e5ff]">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  <span>Guía pedagógica para responder al profesor</span>
                </div>
                <div className="flex items-center gap-2 text-[#dce1ff]">
                  <Clock className="w-3.5 h-3.5 shrink-0 text-[#849396]" />
                  <span>{template.deliveryTime}</span>
                </div>
              </div>
            </div>

            {/* Price & Action Section */}
            <div className="pt-4 border-t border-[#18264d] flex flex-col gap-3">
              <div className="flex items-baseline justify-between">
                <div className="flex flex-col">
                  <span className="font-['JetBrains_Mono'] text-[10px] text-[#849396] uppercase">
                    Precio Base de Solución:
                  </span>
                  <div className="flex items-baseline gap-2">
                    <span className="font-['Space_Grotesk'] text-[24px] font-extrabold text-[#00fe66]">
                      ${template.price.toLocaleString('es-MX')}
                    </span>
                    <span className="font-['Space_Grotesk'] text-[14px] text-[#849396] line-through">
                      ${template.originalPrice.toLocaleString('es-MX')}
                    </span>
                    <span className="font-['JetBrains_Mono'] text-[11px] text-[#00e5ff]">MXN</span>
                  </div>
                </div>

                <span className="px-2 py-0.5 rounded bg-[#00fe66]/15 border border-[#00fe66]/30 text-[#00fe66] font-['JetBrains_Mono'] text-[10px] font-bold uppercase">
                  50% OFF BASE
                </span>
              </div>

              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  id={`btn-comprar-${template.id.toLowerCase()}`}
                  onClick={() => handleOpenBuyModal(template)}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-[#00e5ff] via-[#38ef7d] to-[#00fe66] hover:brightness-110 text-[#00363d] font-['Space_Grotesk'] text-[13px] font-extrabold uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-[0_0_20px_rgba(0,229,255,0.3)] hover:scale-[1.02] active:scale-[0.98]"
                >
                  <Download className="w-4 h-4 text-[#00363d]" />
                  <span>Comprar Plantilla (${template.price} MXN)</span>
                </button>

                {/* Counter-offer secondary link */}
                <button
                  type="button"
                  onClick={() => setNegotiatingTemplate(template)}
                  className="w-full py-2 rounded-lg bg-[#0e1738]/60 hover:bg-[#152352] text-[#849396] hover:text-[#00daf3] font-['JetBrains_Mono'] text-[10px] font-semibold flex items-center justify-center gap-1.5 transition-colors border border-transparent hover:border-[#00e5ff]/30"
                >
                  <SlidersHorizontal className="w-3 h-3 text-[#00e5ff]" />
                  <span>¿Presupuesto ajustado? Proponer Ajuste</span>
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* ==================================================================== */}
      {/* BUY MODAL: SPEI / STRIPE WITH PROMO CODE SUPPORT                     */}
      {/* ==================================================================== */}
      <AnimatePresence>
        {activeTemplateForBuy && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#050b1a]/85 backdrop-blur-xl p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-xl rounded-3xl bg-gradient-to-b from-[#0c1633] via-[#091129] to-[#060c20] border-2 border-[#00e5ff]/50 p-6 sm:p-7 shadow-[0_0_50px_rgba(0,229,255,0.3)] flex flex-col gap-5 my-auto"
            >
              {/* Modal Header */}
              <div className="flex items-start justify-between gap-4 pb-3 border-b border-[#1b2b52]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#141f42] border border-[#00e5ff]/40 flex items-center justify-center text-[#00e5ff]">
                    <Code2 className="w-5 h-5 text-[#00e5ff]" />
                  </div>
                  <div>
                    <h3 className="font-['Space_Grotesk'] text-[18px] font-bold text-[#dce1ff]">
                      Comprar Plantilla // {activeTemplateForBuy.id}
                    </h3>
                    <span className="font-['JetBrains_Mono'] text-[11px] text-[#00daf3]">
                      {activeTemplateForBuy.title}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setActiveTemplateForBuy(null)}
                  className="p-1 rounded-lg text-[#849396] hover:text-[#dce1ff]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Dynamic Price Display */}
              <div className="p-4 rounded-2xl bg-[#060c20] border border-[#1b2b52] flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="font-['JetBrains_Mono'] text-[11px] text-[#849396] uppercase">
                    Total a Liquidar:
                  </span>
                  {appliedCouponResult?.isValid && (
                    <span className="px-2 py-0.5 rounded-full bg-[#00fe66]/20 border border-[#00fe66]/40 text-[#00fe66] font-['JetBrains_Mono'] text-[10px] font-bold animate-pulse">
                      -{appliedCouponResult.discountPercentage}% OFF ({appliedCouponResult.coupon?.code})
                    </span>
                  )}
                </div>

                <div className="flex items-baseline gap-3">
                  {appliedCouponResult?.isValid && (
                    <span className="font-['Space_Grotesk'] text-[20px] font-bold text-[#849396] line-through select-none">
                      ${activeTemplateForBuy.price.toLocaleString('es-MX')}
                    </span>
                  )}
                  <motion.span
                    key={finalPrice}
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="font-['Space_Grotesk'] text-[34px] font-extrabold text-[#00fe66] drop-shadow-[0_0_15px_rgba(0,254,102,0.4)] leading-none"
                  >
                    ${finalPrice.toLocaleString('es-MX')}
                  </motion.span>
                  <span className="font-['JetBrains_Mono'] text-[14px] font-bold text-[#00e5ff]">
                    MXN
                  </span>
                </div>
              </div>

              {/* Promo Code Input inside Modal */}
              <form onSubmit={handleApplyCouponInModal} className="flex flex-col gap-1.5 font-['JetBrains_Mono'] text-[11px]">
                <label className="text-[#00daf3] uppercase font-bold flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-[#00daf3]" />
                  <span>¿Cuentas con Código de Alianza o Beca?</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => {
                      setCouponCode(e.target.value);
                      setCouponError(null);
                    }}
                    placeholder="Ej: BECA-50, ESTUDIANTE-25"
                    className="flex-1 bg-[#050b1c] border border-[#1e2a52] rounded-xl px-3.5 py-2 text-[#00fe66] uppercase focus:outline-none focus:border-[#00e5ff]"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-[#141f42] hover:bg-[#1f2f63] border border-[#00e5ff]/40 text-[#00e5ff] font-bold transition-all shrink-0"
                  >
                    Aplicar
                  </button>
                </div>
                {couponError && (
                  <span className="text-[#ff8099] text-[10px]">{couponError}</span>
                )}
              </form>

              {/* Transfer Details SPEI */}
              <div className="p-4 rounded-2xl bg-[#050b1c] border border-[#00fe66]/35 flex flex-col gap-2.5 font-['JetBrains_Mono'] text-[11px]">
                <div className="flex items-center justify-between">
                  <span className="text-[#00fe66] font-bold flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-[#00fe66]" />
                    <span>SPEI Inmediato Banxico (0% Comisión):</span>
                  </span>
                  <span className="text-[#849396] text-[10px]">Liberación en 5 min</span>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#091129] border border-[#1b2b50]">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-[#849396]">CLABE Nu México (18 dígitos):</span>
                    <span className="font-bold text-[#00fe66] text-[14px] select-all tracking-wider">
                      638180000123456789
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyClabe}
                    className="px-3 py-1.5 rounded-lg bg-[#00fe66]/20 hover:bg-[#00fe66]/30 text-[#00fe66] border border-[#00fe66]/40 flex items-center gap-1 font-bold text-[10px]"
                  >
                    {isCopiedClabe ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{isCopiedClabe ? 'Copiada' : 'Copiar'}</span>
                  </button>
                </div>

                <div className="flex justify-between text-[10px] text-[#bac9cc]">
                  <span>Beneficiario: <strong>MCRA Solutions S.A.P.I.</strong></span>
                  <span>Concepto: <strong className="text-[#00daf3]">{activeTemplateForBuy.id}</strong></span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-2 pt-1">
                {downloadInitiated ? (
                  <div className="p-3.5 rounded-2xl bg-[#00fe66]/15 border border-[#00fe66]/40 text-[#00fe66] font-['JetBrains_Mono'] text-[12px] text-center flex flex-col items-center gap-2">
                    <CheckCircle2 className="w-6 h-6 text-[#00fe66]" />
                    <span className="font-bold">
                      ¡Orden Pre-Registrada con Éxito!
                    </span>
                    <span className="text-[#bac9cc] text-[11px]">
                      Se ha generado tu enlace de descarga temporal. Envía tu comprobante a WhatsApp o espera confirmación automática de CEP Banxico.
                    </span>
                    <a
                      href={`https://wa.me/525500000000?text=${encodeURIComponent(
                        `Hola MCRA Solutions, realicé la compra de la plantilla ${activeTemplateForBuy.id} (${activeTemplateForBuy.title}) por $${finalPrice} MXN. Adjunto mi comprobante para acceso al repositorio Git.`
                      )}`}
                      target="_blank"
                      rel="noreferrer"
                      className="px-4 py-2 rounded-xl bg-[#00fe66] text-[#00363d] font-bold uppercase text-[11px] flex items-center gap-1.5 shadow-[0_0_15px_rgba(0,254,102,0.4)] mt-1"
                    >
                      <ExternalLink className="w-4 h-4" />
                      <span>Validar en WhatsApp &amp; Recibir Git</span>
                    </a>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setDownloadInitiated(true);
                      if (showToast) showToast('Orden registrada. Preparando entrega inmediata...');
                    }}
                    className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#00e5ff] via-[#38ef7d] to-[#00fe66] hover:brightness-110 text-[#00363d] font-['Space_Grotesk'] text-[14px] font-extrabold uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(0,229,255,0.4)]"
                  >
                    <Download className="w-4 h-4 text-[#00363d]" />
                    <span>Confirmar Compra ($${finalPrice.toLocaleString()} MXN)</span>
                  </button>
                )}

                <div className="flex items-center justify-between pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      const t = activeTemplateForBuy;
                      setActiveTemplateForBuy(null);
                      setNegotiatingTemplate(t);
                    }}
                    className="text-[#00daf3] hover:underline font-['JetBrains_Mono'] text-[11px] flex items-center gap-1"
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5" />
                    <span>¿Fuera de presupuesto? Proponer Ajuste</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTemplateForBuy(null)}
                    className="text-[#849396] hover:text-[#dce1ff] font-['JetBrains_Mono'] text-[11px]"
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Counter-Offer Negotiation Modal for Template */}
      {negotiatingTemplate && (
        <BudgetNegotiationModal
          isOpen={true}
          onClose={() => setNegotiatingTemplate(null)}
          serviceTitle={`Plantilla ${negotiatingTemplate.id}: ${negotiatingTemplate.title}`}
          originalPrice={negotiatingTemplate.price}
          clientType="student"
          onSuccess={(neg) => {
            if (showToast) {
              showToast(`Solicitud ${neg.id} para plantilla enviada al panel directivo.`);
            }
          }}
        />
      )}
    </section>
  );
};
