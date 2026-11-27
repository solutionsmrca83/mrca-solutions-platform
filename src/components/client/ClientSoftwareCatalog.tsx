import React, { useState, useEffect, useCallback } from 'react';
import {
  Package,
  Download,
  BookOpen,
  CheckCircle2,
  Cpu,
  Search,
  RefreshCw,
  X,
  FileText,
  FileArchive,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { supabase } from '../../lib/supabase/client';
import {
  CATALOG_SYNC_EVENT,
  formatMxnCurrency,
} from '../../lib/mrcaPricingFallback';
import type { SoftwareCatalogProduct, SoftwareCatalogCategory } from '../../types';

interface ClientSoftwareCatalogProps {
  userRole?: string | null;
  showToast?: (msg: string) => void;
}

const FILTER_CATEGORIES: ('Todos' | SoftwareCatalogCategory)[] = [
  'Todos',
  'Punto de Venta (POS)',
  'Gestión e Inventario',
  'Automatización',
  'Sistema Empresarial',
];

/**
 * Renderiza la guía de instalación en Markdown ligero de forma segura.
 */
function renderGuideLines(markdown: string): React.ReactNode {
  const lines = (markdown || '').split('\n');
  return lines.map((line, index) => {
    const trimmed = line.trim();
    if (!trimmed) return <div key={index} className="h-2" />;
    if (trimmed.startsWith('# ')) {
      return (
        <h4 key={index} className="font-['Space_Grotesk'] text-[18px] font-bold text-white mt-2">
          {trimmed.slice(2)}
        </h4>
      );
    }
    if (trimmed.startsWith('## ')) {
      return (
        <h5 key={index} className="font-['Space_Grotesk'] text-[14.5px] font-bold text-cyan-300 mt-3">
          {trimmed.slice(3)}
        </h5>
      );
    }
    if (trimmed.startsWith('- ') || /^\d+\.\s/.test(trimmed)) {
      return (
        <p key={index} className="text-[12.5px] text-slate-200 pl-3 leading-relaxed">
          {trimmed}
        </p>
      );
    }
    return (
      <p key={index} className="text-[12.5px] text-slate-300 leading-relaxed">
        {trimmed}
      </p>
    );
  });
}

/**
 * Descarga un archivo de texto generado en el navegador (Guía de Instalación)
 * cuando el producto incluye guía en texto pero no un PDF separado.
 */
function triggerLocalGuideDownload(product: SoftwareCatalogProduct) {
  try {
    const safeName = product.title.toLowerCase().replace(/[^a-z0-9]+/g, '_');
    const content =
      `${product.title} (${product.version})\n` +
      `Categoría: ${product.category}\n` +
      `Requisitos del sistema: ${product.system_requirements}\n` +
      `====================================================\n\n` +
      `${product.installation_guide_md || 'Consulta con Soporte Técnico VIP en tu Portal de Clientes.'}`;

    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Manual_Instalacion_${safeName}_${product.version}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch {
    // ignore browser download restrictions
  }
}

async function resolveDownloadUrl(
  rawUrl: string
): Promise<{ url: string | null; isSigned: boolean; error?: string }> {
  const trimmed = (rawUrl || '').trim();
  if (!trimmed) {
    return { url: null, isSigned: false, error: 'Ruta de descarga no configurada.' };
  }

  // Enlaces externos HTTPS/HTTP se abren directamente
  if (/^https?:\/\//i.test(trimmed)) {
    return { url: trimmed, isSigned: false };
  }

  // Ruta interna en bucket privado `software-releases` -> URL firmada de 60 segundos
  const cleanPath = trimmed
    .replace(/^storage:\/\/software-releases\//i, '')
    .replace(/^\/+/, '');

  try {
    const { data, error } = await supabase.storage
      .from('software-releases')
      .createSignedUrl(cleanPath, 60);

    if (!error && data?.signedUrl) {
      return { url: data.signedUrl, isSigned: true };
    }
    return {
      url: null,
      isSigned: false,
      error: 'No fue posible firmar el enlace seguro en este momento. Verifica tu sesión corporativa.',
    };
  } catch {
    return {
      url: null,
      isSigned: false,
      error: 'Servicio de descargas privadas temporalmente no disponible.',
    };
  }
}

export const ClientSoftwareCatalog: React.FC<ClientSoftwareCatalogProps> = ({
  userRole,
  showToast,
}) => {
  // DEFENSA EN PROFUNDIDAD: Jamás renderizar para cuentas de estudiantes
  const isStudentRole = (userRole || '').toString().toLowerCase().trim() === 'student';

  const [products, setProducts] = useState<SoftwareCatalogProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<'Todos' | SoftwareCatalogCategory>('Todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [manualModalProduct, setManualModalProduct] = useState<SoftwareCatalogProduct | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [downloadingManualId, setDownloadingManualId] = useState<string | null>(null);

  const fetchActiveProducts = useCallback(async () => {
    if (isStudentRole) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('software_catalog')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (!error && Array.isArray(data)) {
        const normalized: SoftwareCatalogProduct[] = data.map((row: any) => ({
          id: String(row.id),
          title: row.title,
          category: row.category,
          version: row.version || 'v1.0.0',
          short_description: row.short_description || '',
          features: Array.isArray(row.features) ? row.features : [],
          system_requirements: row.system_requirements || '',
          price_mxn: Number(row.price_mxn) || 0,
          zip_file_path: row.zip_file_path || row.zip_download_url || '',
          manual_file_path: row.manual_file_path ?? row.manual_download_url ?? null,
          installation_guide_md: row.installation_guide_md || '',
          is_active: Boolean(row.is_active),
          created_at: row.created_at || new Date().toISOString(),
        }));
        setProducts(normalized);
      } else {
        setProducts([]);
      }
    } catch {
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  }, [isStudentRole]);

  useEffect(() => {
    void fetchActiveProducts();
    const handleSync = () => {
      void fetchActiveProducts();
    };
    window.addEventListener(CATALOG_SYNC_EVENT, handleSync);
    return () => window.removeEventListener(CATALOG_SYNC_EVENT, handleSync);
  }, [fetchActiveProducts]);

  // Bloqueo estricto de estudiantes
  if (isStudentRole) {
    return null;
  }

  const handleDownloadPackage = async (product: SoftwareCatalogProduct) => {
    setDownloadingId(product.id);
    try {
      const zipResult = await resolveDownloadUrl(product.zip_file_path);
      if (!zipResult.url) {
        showToast?.(zipResult.error || 'No fue posible generar el enlace seguro de descarga.');
        return;
      }

      window.open(zipResult.url, '_blank', 'noopener,noreferrer');

      if (product.manual_file_path) {
        const manualResult = await resolveDownloadUrl(product.manual_file_path);
        if (manualResult.url) {
          setTimeout(() => {
            window.open(manualResult.url!, '_blank', 'noopener,noreferrer');
          }, 450);
        }
      } else if (product.installation_guide_md) {
        triggerLocalGuideDownload(product);
      }

      showToast?.(
        zipResult.isSigned
          ? `Enlace seguro temporal (60s) generado para ${product.title} (${product.version}).`
          : `Descarga iniciada: ${product.title} (${product.version}) — Paquete .ZIP + Manual.`
      );
    } finally {
      setDownloadingId(null);
    }
  };

  const handleDownloadManualOnly = async (product: SoftwareCatalogProduct) => {
    if (!product.manual_file_path) {
      triggerLocalGuideDownload(product);
      showToast?.(`Manual de instalación descargado para ${product.title}.`);
      return;
    }

    setDownloadingManualId(product.id);
    try {
      const manualResult = await resolveDownloadUrl(product.manual_file_path);
      if (!manualResult.url) {
        showToast?.(manualResult.error || 'No fue posible generar el enlace seguro del manual.');
        return;
      }
      window.open(manualResult.url, '_blank', 'noopener,noreferrer');
      showToast?.(
        manualResult.isSigned
          ? `Enlace seguro temporal (60s) generado para el Manual PDF de ${product.title}.`
          : `Abriendo manual oficial PDF de ${product.title}.`
      );
    } finally {
      setDownloadingManualId(null);
    }
  };

  const normalizedSearch = searchQuery.trim().toLowerCase();
  const filteredProducts = products.filter((p) => {
    const matchesCategory = selectedCategory === 'Todos' || p.category === selectedCategory;
    const matchesSearch =
      !normalizedSearch ||
      p.title.toLowerCase().includes(normalizedSearch) ||
      p.category.toLowerCase().includes(normalizedSearch) ||
      p.short_description.toLowerCase().includes(normalizedSearch) ||
      p.features.some((f) => f.toLowerCase().includes(normalizedSearch));
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="w-full flex flex-col gap-6 font-['Inter'] text-slate-100">
      {/* ENCABEZADO DEL CATÁLOGO B2B */}
      <section className="relative rounded-2xl bg-slate-900/90 backdrop-blur-xl border border-cyan-500/40 p-5 sm:p-6 shadow-[0_0_25px_rgba(6,182,212,0.2)] overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-transparent to-emerald-500/10 pointer-events-none" />
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex flex-col gap-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/15 border border-cyan-500/40 text-cyan-300 font-['JetBrains_Mono'] text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Package className="w-3.5 h-3.5" />
                EXCLUSIVO PORTAL CLIENTES B2B
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 font-['JetBrains_Mono'] text-[10px] font-bold uppercase flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                PAQUETES VERIFICADOS (.ZIP + MANUAL)
              </span>
            </div>

            <h2 className="font-['Space_Grotesk'] text-[22px] sm:text-[26px] font-bold text-white tracking-tight">
              Soluciones Listas &amp; Puntos de Venta (POS)
            </h2>
            <p className="text-[13px] text-slate-300 max-w-3xl leading-relaxed">
              Sistemas empresariales empaquetados y listos para instalar en tu negocio. Cada solución incluye instalador oficial en formato `.ZIP`, requisitos técnicos verificados y manual de instalación y usuario paso a paso.
            </p>
          </div>

          <button
            type="button"
            onClick={() => void fetchActiveProducts()}
            disabled={isLoading}
            className="px-3.5 py-2.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 border border-cyan-500/30 text-cyan-300 font-['JetBrains_Mono'] text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shrink-0 self-start lg:self-center"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Actualizar Catálogo</span>
          </button>
        </div>
      </section>

      {/* FILTROS POR CATEGORÍA Y BÚSQUEDA */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 font-['JetBrains_Mono'] text-[11px]">
          {FILTER_CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl border transition-all cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-gradient-to-r from-cyan-500 to-teal-400 text-slate-950 border-cyan-400 font-bold shadow-[0_0_12px_rgba(6,182,212,0.35)]'
                  : 'bg-slate-900/80 border-white/10 text-slate-300 hover:border-cyan-500/40 hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="relative w-full lg:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar sistema o Punto de Venta..."
            className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-slate-900/90 border border-cyan-500/30 focus:border-cyan-400 text-[12px] text-white placeholder-slate-500 focus:outline-none"
          />
        </div>
      </div>

      {/* TARJETAS GLASSMORPHISM DE SOLUCIONES LISTAS */}
      {filteredProducts.length === 0 ? (
        <div className="rounded-2xl bg-slate-900/80 border border-dashed border-cyan-500/30 p-10 text-center text-slate-400 font-['JetBrains_Mono'] text-[12px]">
          No se encontraron soluciones activas en esta categoría.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredProducts.map((product) => (
            <article
              key={product.id}
              className="rounded-2xl bg-slate-900/90 backdrop-blur-xl border border-cyan-500/35 hover:border-cyan-400 p-5 sm:p-6 shadow-[0_0_25px_rgba(6,182,212,0.12)] hover:shadow-[0_0_30px_rgba(6,182,212,0.28)] transition-all flex flex-col justify-between gap-5"
            >
              <div className="flex flex-col gap-4">
                {/* Badges Categoría + Versión */}
                <div className="flex items-center justify-between gap-2">
                  <span className="px-2.5 py-1 rounded-lg bg-cyan-500/15 border border-cyan-500/40 text-cyan-300 font-['JetBrains_Mono'] text-[10px] font-bold uppercase tracking-wider">
                    {product.category}
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-slate-950/90 border border-white/10 font-['JetBrains_Mono'] text-[10.5px] text-emerald-400 font-bold">
                    {product.version}
                  </span>
                </div>

                {/* Título y Precio */}
                <div>
                  <h3 className="font-['Space_Grotesk'] text-[20px] font-bold text-white leading-snug">
                    {product.title}
                  </h3>
                  <div className="mt-1.5 flex items-baseline gap-1.5">
                    <span className="font-['Space_Grotesk'] text-[26px] font-extrabold text-emerald-400 leading-none">
                      {formatMxnCurrency(product.price_mxn)}
                    </span>
                    <span className="font-['JetBrains_Mono'] text-[10.5px] text-slate-400">
                      MXN • Licencia Empresarial
                    </span>
                  </div>
                </div>

                {/* Descripción */}
                <p className="text-[13px] text-slate-300 leading-relaxed">
                  {product.short_description}
                </p>

                {/* Checklist de características */}
                <div className="flex flex-col gap-2">
                  <span className="font-['JetBrains_Mono'] text-[10px] uppercase text-cyan-400 font-bold flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    <span>Características Incluidas</span>
                  </span>
                  <ul className="space-y-1.5">
                    {product.features.map((feat, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-[12px] text-slate-200 leading-snug">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Requisitos del sistema */}
                <div className="p-3 rounded-xl bg-slate-950/80 border border-white/10 flex items-start gap-2.5">
                  <Cpu className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                  <div className="text-[11.5px] text-slate-300 leading-snug">
                    <span className="block font-['JetBrains_Mono'] text-[9.5px] uppercase text-slate-400 font-bold mb-0.5">
                      Requisitos del Sistema
                    </span>
                    {product.system_requirements}
                  </div>
                </div>
              </div>

              {/* Botones de Acción: Ver Manual + Descargar Paquete (.ZIP + Manual) */}
              <div className="pt-4 border-t border-white/10 flex flex-col gap-2.5">
                <button
                  type="button"
                  onClick={() => setManualModalProduct(product)}
                  className="w-full py-2.5 px-3.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 border border-cyan-500/35 text-cyan-200 font-['Space_Grotesk'] text-[12.5px] font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <BookOpen className="w-4 h-4 text-cyan-400" />
                  <span>Ver Manual de Instalación y Usuario</span>
                </button>

                <button
                  type="button"
                  disabled={downloadingId === product.id}
                  onClick={() => void handleDownloadPackage(product)}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-400 text-slate-950 font-['Space_Grotesk'] text-[13px] font-bold flex items-center justify-center gap-2 shadow-[0_0_14px_rgba(6,182,212,0.4)] hover:shadow-[0_0_20px_rgba(6,182,212,0.8)] hover:scale-[1.02] transition-all cursor-pointer disabled:opacity-60"
                >
                  <Download className="w-4 h-4" />
                  <span>
                    {downloadingId === product.id
                      ? 'Generando enlace seguro...'
                      : 'Descargar Paquete (.ZIP + Manual)'}
                  </span>
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* MODAL: MANUAL DE INSTALACIÓN Y USUARIO */}
      {manualModalProduct && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setManualModalProduct(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-2xl rounded-2xl bg-slate-900/95 backdrop-blur-xl border border-cyan-500/40 shadow-[0_0_40px_rgba(6,182,212,0.3)] animate-border-pulse overflow-hidden flex flex-col max-h-[88vh]"
          >
            <div className="px-5 py-4 bg-slate-950/90 border-b border-cyan-500/25 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-cyan-500/15 border border-cyan-500/40 flex items-center justify-center text-cyan-300 shrink-0">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-['Space_Grotesk'] text-[17px] font-bold text-white truncate">
                    Manual de Instalación y Usuario — {manualModalProduct.title}
                  </h3>
                  <span className="font-['JetBrains_Mono'] text-[10.5px] text-cyan-400">
                    {manualModalProduct.category} • {manualModalProduct.version}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setManualModalProduct(null)}
                className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-red-500/20 text-slate-300 hover:text-red-300 flex items-center justify-center cursor-pointer"
                aria-label="Cerrar manual"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 sm:p-6 overflow-y-auto flex-1 flex flex-col gap-3">
              <div className="p-3.5 rounded-xl bg-slate-950/80 border border-white/10 text-[12px] text-slate-300">
                <strong className="text-cyan-300">Requisitos del sistema:</strong>{' '}
                {manualModalProduct.system_requirements}
              </div>

              <div className="p-4 rounded-xl bg-slate-950/60 border border-cyan-500/20 flex flex-col gap-1">
                {renderGuideLines(manualModalProduct.installation_guide_md)}
              </div>
            </div>

            <div className="px-5 py-3.5 bg-slate-950/90 border-t border-white/10 flex flex-wrap items-center justify-between gap-2.5">
              <button
                type="button"
                disabled={downloadingManualId === manualModalProduct.id}
                onClick={() => void handleDownloadManualOnly(manualModalProduct)}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-white/15 text-slate-100 font-['JetBrains_Mono'] text-[11px] font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
              >
                <FileText className="w-3.5 h-3.5 text-emerald-400" />
                <span>
                  {downloadingManualId === manualModalProduct.id
                    ? 'Generando enlace seguro...'
                    : manualModalProduct.manual_file_path
                    ? 'Descargar Manual PDF'
                    : 'Descargar Guía (.MD)'}
                </span>
              </button>

              <button
                type="button"
                disabled={downloadingId === manualModalProduct.id}
                onClick={() => void handleDownloadPackage(manualModalProduct)}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-400 text-slate-950 font-['Space_Grotesk'] text-[12px] font-bold flex items-center gap-1.5 hover:shadow-[0_0_20px_rgba(6,182,212,0.8)] hover:scale-105 transition-all cursor-pointer disabled:opacity-60"
              >
                <FileArchive className="w-4 h-4" />
                <span>
                  {downloadingId === manualModalProduct.id
                    ? 'Generando enlace seguro...'
                    : 'Descargar Paquete (.ZIP + Manual)'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientSoftwareCatalog;
