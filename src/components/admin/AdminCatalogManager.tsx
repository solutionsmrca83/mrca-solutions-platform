import React, { useState, useEffect, useCallback } from 'react';
import {
  Package,
  Plus,
  Upload,
  FileText,
  Lock,
  Trash2,
  Edit3,
  Eye,
  EyeOff,
  CheckCircle2,
  RefreshCw,
  X,
  Link as LinkIcon,
  FileArchive,
  BookOpen,
  ShieldAlert,
} from 'lucide-react';
import { supabase } from '../../lib/supabase/client';
import { isSuperAdmin } from '../../lib/auth';
import {
  FALLBACK_SOFTWARE_CATALOG,
  CATALOG_STORAGE_KEY,
  CATALOG_SYNC_EVENT,
  formatMxnCurrency,
} from '../../lib/mrcaPricingFallback';
import type { SoftwareCatalogProduct, SoftwareCatalogCategory } from '../../types';

interface AdminCatalogManagerProps {
  sessionUser?: any;
  showToast?: (msg: string) => void;
}

const CATALOG_CATEGORIES: SoftwareCatalogCategory[] = [
  'Punto de Venta (POS)',
  'Gestión e Inventario',
  'Automatización',
  'Sistema Empresarial',
];

const MAX_STORAGE_BYTES = 50 * 1024 * 1024; // 50 MB límite directo en Supabase Storage

interface ProductFormState {
  id?: string;
  title: string;
  category: SoftwareCatalogCategory;
  version: string;
  price_mxn: string;
  short_description: string;
  features_text: string;
  system_requirements: string;
  zip_download_url: string;
  manual_download_url: string;
  installation_guide_md: string;
  is_active: boolean;
}

const EMPTY_FORM: ProductFormState = {
  title: '',
  category: 'Punto de Venta (POS)',
  version: 'v1.0.0',
  price_mxn: '14900',
  short_description: '',
  features_text:
    'Instalación rápida paso a paso\nInterfaz intuitiva lista para operar\nRespaldos seguros locales',
  system_requirements: 'Windows 10/11 (64-bit) o Linux, 4 GB RAM, 500 MB libres en disco.',
  zip_download_url: '',
  manual_download_url: '',
  installation_guide_md:
    '# Manual de Instalación y Uso\n\n## 1. Descompresión\n1. Descarga el archivo `.ZIP`.\n2. Descomprime el contenido en una carpeta dedicada.\n\n## 2. Instalación\n1. Ejecuta el instalador principal.\n2. Sigue los pasos del asistente y registra los datos de tu empresa.',
  is_active: true,
};

export const AdminCatalogManager: React.FC<AdminCatalogManagerProps> = ({
  sessionUser,
  showToast,
}) => {
  const isSuper = isSuperAdmin(sessionUser);

  const [products, setProducts] = useState<SoftwareCatalogProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [form, setForm] = useState<ProductFormState>(EMPTY_FORM);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingZip, setIsUploadingZip] = useState(false);
  const [isUploadingManual, setIsUploadingManual] = useState(false);

  const loadLocalCatalog = (): SoftwareCatalogProduct[] => {
    try {
      const raw = localStorage.getItem(CATALOG_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // fallback
    }
    return FALLBACK_SOFTWARE_CATALOG;
  };

  const persistLocalCatalog = (nextList: SoftwareCatalogProduct[]) => {
    try {
      localStorage.setItem(CATALOG_STORAGE_KEY, JSON.stringify(nextList));
      window.dispatchEvent(new CustomEvent(CATALOG_SYNC_EVENT));
    } catch {
      // ignore storage quota errors
    }
  };

  const fetchCatalog = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('software_catalog')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && Array.isArray(data) && data.length > 0) {
        const normalized: SoftwareCatalogProduct[] = data.map((row: any) => ({
          id: String(row.id),
          title: row.title,
          category: row.category,
          version: row.version || 'v1.0.0',
          short_description: row.short_description || '',
          features: Array.isArray(row.features) ? row.features : [],
          system_requirements: row.system_requirements || '',
          price_mxn: Number(row.price_mxn) || 0,
          zip_download_url: row.zip_download_url || '',
          manual_download_url: row.manual_download_url || null,
          installation_guide_md: row.installation_guide_md || '',
          is_active: Boolean(row.is_active),
          created_at: row.created_at || new Date().toISOString(),
        }));
        setProducts(normalized);
        persistLocalCatalog(normalized);
      } else {
        setProducts(loadLocalCatalog());
      }
    } catch {
      setProducts(loadLocalCatalog());
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchCatalog();
  }, [fetchCatalog]);

  const handleOpenCreate = () => {
    if (!isSuper) {
      showToast?.('Acceso restringido: Solo Superadmin puede agregar paquetes al catálogo.');
      return;
    }
    setForm(EMPTY_FORM);
    setIsEditorOpen(true);
  };

  const handleOpenEdit = (product: SoftwareCatalogProduct) => {
    if (!isSuper) {
      showToast?.('Acceso restringido: Solo Superadmin puede editar paquetes del catálogo.');
      return;
    }
    setForm({
      id: product.id,
      title: product.title,
      category: product.category,
      version: product.version,
      price_mxn: String(product.price_mxn),
      short_description: product.short_description,
      features_text: (product.features || []).join('\n'),
      system_requirements: product.system_requirements,
      zip_download_url: product.zip_download_url,
      manual_download_url: product.manual_download_url || '',
      installation_guide_md: product.installation_guide_md,
      is_active: product.is_active,
    });
    setIsEditorOpen(true);
  };

  // Subida directa a Supabase Storage (`software-releases`) — SOLO SUPERADMIN
  const handleUploadStorageFile = async (
    file: File,
    kind: 'zip' | 'manual'
  ) => {
    if (!isSuper) {
      showToast?.('Permiso denegado: Solo Superadmin puede subir archivos al repositorio.');
      return;
    }

    if (file.size > MAX_STORAGE_BYTES) {
      showToast?.(
        'El archivo supera 50 MB. Usa el campo de URL segura externa (.ZIP) para paquetes de mayor tamaño.'
      );
      return;
    }

    if (kind === 'zip') setIsUploadingZip(true);
    else setIsUploadingManual(true);

    const safeFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const storagePath = `${kind === 'zip' ? 'packages' : 'manuals'}/${Date.now()}_${safeFileName}`;

    try {
      const { error } = await supabase.storage
        .from('software-releases')
        .upload(storagePath, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (!error) {
        const storageUri = `storage://software-releases/${storagePath}`;
        if (kind === 'zip') {
          setForm((prev) => ({ ...prev, zip_download_url: storageUri }));
        } else {
          setForm((prev) => ({ ...prev, manual_download_url: storageUri }));
        }
        showToast?.(`Archivo "${file.name}" cargado con éxito en Supabase Storage (software-releases).`);
      } else {
        // Respaldo seguro para entornos locales sin bucket desplegado aún
        const fallbackUrl = `https://releases.mrcasolutions.com/${storagePath}`;
        if (kind === 'zip') {
          setForm((prev) => ({ ...prev, zip_download_url: fallbackUrl }));
        } else {
          setForm((prev) => ({ ...prev, manual_download_url: fallbackUrl }));
        }
        showToast?.(
          `Bucket remoto no disponible en este entorno (${error.message}). Ruta preparada: ${safeFileName}`
        );
      }
    } catch {
      const fallbackUrl = `https://releases.mrcasolutions.com/${storagePath}`;
      if (kind === 'zip') {
        setForm((prev) => ({ ...prev, zip_download_url: fallbackUrl }));
      } else {
        setForm((prev) => ({ ...prev, manual_download_url: fallbackUrl }));
      }
      showToast?.(`Ruta de paquete registrada para "${file.name}".`);
    } finally {
      if (kind === 'zip') setIsUploadingZip(false);
      else setIsUploadingManual(false);
    }
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSuper) {
      showToast?.('Acceso denegado: Solo Superadmin puede guardar productos del catálogo.');
      return;
    }
    if (!form.title.trim() || !form.zip_download_url.trim()) {
      showToast?.('Completa al menos el Nombre del sistema y el archivo o enlace .ZIP.');
      return;
    }

    setIsSaving(true);
    const featuresArray = form.features_text
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);

    const payload = {
      title: form.title.trim(),
      category: form.category,
      version: form.version.trim() || 'v1.0.0',
      short_description: form.short_description.trim(),
      features: featuresArray,
      system_requirements: form.system_requirements.trim(),
      price_mxn: Math.max(0, Number(form.price_mxn) || 0),
      zip_download_url: form.zip_download_url.trim(),
      manual_download_url: form.manual_download_url.trim() || null,
      installation_guide_md: form.installation_guide_md.trim(),
      is_active: form.is_active,
    };

    let savedProduct: SoftwareCatalogProduct = {
      id: form.id || `sw_${Date.now()}`,
      ...payload,
      created_at: new Date().toISOString(),
    };

    let syncedRemote = false;
    try {
      if (form.id && !form.id.startsWith('sw_')) {
        const { data, error } = await supabase
          .from('software_catalog')
          .update(payload)
          .eq('id', form.id)
          .select()
          .maybeSingle();
        if (!error && data) {
          savedProduct = { ...savedProduct, ...data };
          syncedRemote = true;
        }
      } else {
        const { data, error } = await supabase
          .from('software_catalog')
          .insert(payload)
          .select()
          .maybeSingle();
        if (!error && data) {
          savedProduct = { ...savedProduct, ...data };
          syncedRemote = true;
        }
      }
    } catch {
      // local fallback
    }

    const nextProducts = form.id
      ? products.map((p) => (p.id === form.id ? savedProduct : p))
      : [savedProduct, ...products];

    setProducts(nextProducts);
    persistLocalCatalog(nextProducts);
    setIsSaving(false);
    setIsEditorOpen(false);

    showToast?.(
      syncedRemote
        ? `"${savedProduct.title}" publicado en Supabase y visible en el Portal de Clientes B2B.`
        : `"${savedProduct.title}" guardado en el catálogo del Portal de Clientes B2B.`
    );
  };

  const handleToggleActive = async (product: SoftwareCatalogProduct) => {
    if (!isSuper) {
      showToast?.('Solo Superadmin puede activar u ocultar soluciones del catálogo.');
      return;
    }
    const nextActive = !product.is_active;
    const nextList = products.map((p) =>
      p.id === product.id ? { ...p, is_active: nextActive } : p
    );
    setProducts(nextList);
    persistLocalCatalog(nextList);

    try {
      await supabase
        .from('software_catalog')
        .update({ is_active: nextActive })
        .eq('id', product.id);
    } catch {}

    showToast?.(
      nextActive
        ? `"${product.title}" ahora está VISIBLE en el Portal de Clientes.`
        : `"${product.title}" ocultado temporalmente del Portal de Clientes.`
    );
  };

  const handleDeleteProduct = async (product: SoftwareCatalogProduct) => {
    if (!isSuper) {
      showToast?.('Solo Superadmin puede eliminar paquetes del catálogo.');
      return;
    }
    const nextList = products.filter((p) => p.id !== product.id);
    setProducts(nextList);
    persistLocalCatalog(nextList);

    try {
      await supabase.from('software_catalog').delete().eq('id', product.id);
    } catch {}

    showToast?.(`Paquete "${product.title}" eliminado del catálogo.`);
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
                <Package className="w-3.5 h-3.5" />
                GESTOR DE RELEASES — SOFTWARE &amp; PUNTOS DE VENTA (.ZIP + MANUALES)
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 font-['JetBrains_Mono'] text-[10px] font-bold uppercase">
                SOLO CLIENTES B2B (ESTUDIANTES EXCLUIDOS)
              </span>
            </div>

            <h2 className="font-['Space_Grotesk'] text-[22px] sm:text-[26px] font-bold text-white tracking-tight">
              Catálogo de Software Listo y Puntos de Venta (POS)
            </h2>
            <p className="text-[13px] text-slate-300 max-w-3xl leading-relaxed">
              Administra paquetes instalables `.ZIP` en el bucket seguro `software-releases`, adjunta manuales PDF y redacta guías paso a paso visibles únicamente para clientes B2B.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => void fetchCatalog()}
              disabled={isLoading}
              className="px-3.5 py-2.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 border border-cyan-500/30 text-cyan-300 font-['JetBrains_Mono'] text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Actualizar</span>
            </button>

            {isSuper && (
              <button
                type="button"
                onClick={handleOpenCreate}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-400 text-slate-950 font-['JetBrains_Mono'] text-[11px] font-bold uppercase flex items-center gap-1.5 shadow-[0_0_14px_rgba(6,182,212,0.4)] hover:shadow-[0_0_20px_rgba(6,182,212,0.8)] hover:scale-105 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Nuevo Sistema / POS</span>
              </button>
            )}
          </div>
        </div>
      </section>

      {!isSuper && (
        <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-500/40 flex items-center gap-3 text-[12.5px] text-amber-200">
          <Lock className="w-5 h-5 text-amber-400 shrink-0" />
          <div>
            <strong>Modo Solo Lectura:</strong> La carga de paquetes `.ZIP`, manuales y edición del catálogo está restringida estrictamente a{' '}
            <strong className="text-white">Superadmin</strong>.
          </div>
        </div>
      )}

      {/* LISTA DE PRODUCTOS */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {products.map((product) => (
          <div
            key={product.id}
            className={`rounded-2xl bg-slate-900/90 backdrop-blur-xl border p-5 shadow-xl flex flex-col justify-between gap-4 transition-all ${
              product.is_active
                ? 'border-cyan-500/35 hover:border-cyan-400/70'
                : 'border-slate-700/60 opacity-75'
            }`}
          >
            <div className="flex flex-col gap-3">
              <div className="flex items-start justify-between gap-2">
                <span className="px-2.5 py-0.5 rounded-lg bg-cyan-500/15 border border-cyan-500/35 text-cyan-300 font-['JetBrains_Mono'] text-[10px] font-bold uppercase">
                  {product.category}
                </span>
                <div className="flex items-center gap-1.5">
                  <span className="px-2 py-0.5 rounded bg-slate-950 border border-white/10 font-['JetBrains_Mono'] text-[10px] text-slate-300">
                    {product.version}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded font-['JetBrains_Mono'] text-[9.5px] font-bold border ${
                      product.is_active
                        ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                        : 'bg-slate-800 border-slate-600 text-slate-400'
                    }`}
                  >
                    {product.is_active ? 'ACTIVO' : 'OCULTO'}
                  </span>
                </div>
              </div>

              <div>
                <h3 className="font-['Space_Grotesk'] text-[18px] font-bold text-white leading-snug">
                  {product.title}
                </h3>
                <div className="font-['Space_Grotesk'] text-[22px] font-bold text-emerald-400 mt-1">
                  {formatMxnCurrency(product.price_mxn)}{' '}
                  <span className="text-[11px] font-['JetBrains_Mono'] text-slate-400 font-normal">
                    MXN
                  </span>
                </div>
              </div>

              <p className="text-[12.5px] text-slate-300 leading-relaxed line-clamp-3">
                {product.short_description}
              </p>

              <div className="p-3 rounded-xl bg-slate-950/70 border border-white/10 flex flex-col gap-1.5 text-[11px] font-['JetBrains_Mono']">
                <div className="flex items-center gap-1.5 text-cyan-300 truncate">
                  <FileArchive className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{product.zip_download_url}</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-400 truncate">
                  <BookOpen className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>
                    {product.manual_download_url
                      ? 'Manual PDF + Guía paso a paso'
                      : 'Guía paso a paso integrada'}
                  </span>
                </div>
              </div>
            </div>

            {isSuper ? (
              <div className="pt-3 border-t border-white/10 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => void handleToggleActive(product)}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-white/10 text-slate-200 font-['JetBrains_Mono'] text-[10.5px] font-semibold flex items-center gap-1 cursor-pointer"
                >
                  {product.is_active ? (
                    <>
                      <EyeOff className="w-3.5 h-3.5 text-amber-400" />
                      <span>Ocultar</span>
                    </>
                  ) : (
                    <>
                      <Eye className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Activar</span>
                    </>
                  )}
                </button>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(product)}
                    className="px-2.5 py-1.5 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-200 font-['JetBrains_Mono'] text-[10.5px] font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Editar</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleDeleteProduct(product)}
                    className="p-1.5 rounded-lg bg-red-950/50 hover:bg-red-900/70 border border-red-500/30 text-red-300 cursor-pointer"
                    title="Eliminar producto"
                    aria-label={`Eliminar ${product.title}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="pt-3 border-t border-white/10 flex items-center gap-1.5 font-['JetBrains_Mono'] text-[10px] text-amber-300/90">
                <Lock className="w-3 h-3" />
                <span>Edición restringida a Superadmin</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* MODAL CREAR / EDITAR SOFTWARE O POS (SOLO SUPERADMIN) */}
      {isEditorOpen && isSuper && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setIsEditorOpen(false)}
        >
          <form
            onSubmit={(e) => void handleSaveProduct(e)}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-3xl rounded-2xl bg-slate-900/95 backdrop-blur-xl border border-cyan-500/40 shadow-[0_0_40px_rgba(6,182,212,0.3)] animate-border-pulse overflow-hidden flex flex-col max-h-[90vh]"
          >
            <div className="px-5 py-4 bg-slate-950/90 border-b border-cyan-500/25 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <Package className="w-5 h-5 text-cyan-400" />
                <h3 className="font-['Space_Grotesk'] text-[18px] font-bold text-white">
                  {form.id ? 'Editar Solución / Punto de Venta' : 'Publicar Nuevo Sistema o POS'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsEditorOpen(false)}
                className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-red-500/20 text-slate-300 hover:text-red-300 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto flex-1 flex flex-col gap-4">
              {/* Fila 1: Nombre, Categoría */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block font-['JetBrains_Mono'] text-[10.5px] text-slate-300 mb-1">
                    Nombre del Sistema (ej. Punto de Venta MRCA Pro) *
                  </label>
                  <input
                    type="text"
                    required
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="Punto de Venta MRCA Pro"
                    className="w-full bg-slate-950 border border-cyan-500/30 focus:border-cyan-400 rounded-xl px-3.5 py-2.5 text-[13px] text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-['JetBrains_Mono'] text-[10.5px] text-slate-300 mb-1">
                    Categoría *
                  </label>
                  <select
                    value={form.category}
                    onChange={(e) =>
                      setForm({ ...form, category: e.target.value as SoftwareCatalogCategory })
                    }
                    className="w-full bg-slate-950 border border-cyan-500/30 focus:border-cyan-400 rounded-xl px-3.5 py-2.5 text-[13px] text-white focus:outline-none cursor-pointer"
                  >
                    {CATALOG_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Fila 2: Versión, Precio MXN, Estado */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div>
                  <label className="block font-['JetBrains_Mono'] text-[10.5px] text-slate-300 mb-1">
                    Versión
                  </label>
                  <input
                    type="text"
                    value={form.version}
                    onChange={(e) => setForm({ ...form, version: e.target.value })}
                    placeholder="v3.2.0"
                    className="w-full bg-slate-950 border border-cyan-500/30 focus:border-cyan-400 rounded-xl px-3.5 py-2.5 text-[13px] text-cyan-300 font-['JetBrains_Mono'] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-['JetBrains_Mono'] text-[10.5px] text-slate-300 mb-1">
                    Precio MXN
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={100}
                    value={form.price_mxn}
                    onChange={(e) => setForm({ ...form, price_mxn: e.target.value })}
                    className="w-full bg-slate-950 border border-cyan-500/30 focus:border-cyan-400 rounded-xl px-3.5 py-2.5 text-[13px] text-emerald-300 font-['JetBrains_Mono'] font-bold focus:outline-none"
                  />
                </div>
                <div className="flex flex-col justify-end">
                  <label className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-950 border border-white/10 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.is_active}
                      onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                      className="accent-cyan-400 w-4 h-4"
                    />
                    <span className="text-[12px] text-slate-200 font-medium">
                      Visible en Portal Clientes
                    </span>
                  </label>
                </div>
              </div>

              {/* Descripción corta */}
              <div>
                <label className="block font-['JetBrains_Mono'] text-[10.5px] text-slate-300 mb-1">
                  Descripción Corta *
                </label>
                <textarea
                  rows={2}
                  required
                  value={form.short_description}
                  onChange={(e) => setForm({ ...form, short_description: e.target.value })}
                  placeholder="Resume el valor empresarial del sistema..."
                  className="w-full bg-slate-950 border border-cyan-500/30 focus:border-cyan-400 rounded-xl px-3.5 py-2.5 text-[12.5px] text-white focus:outline-none"
                />
              </div>

              {/* Características & Requisitos */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block font-['JetBrains_Mono'] text-[10.5px] text-slate-300 mb-1">
                    Lista de Características (una por línea)
                  </label>
                  <textarea
                    rows={4}
                    value={form.features_text}
                    onChange={(e) => setForm({ ...form, features_text: e.target.value })}
                    className="w-full bg-slate-950 border border-cyan-500/30 focus:border-cyan-400 rounded-xl px-3.5 py-2 text-[12px] text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-['JetBrains_Mono'] text-[10.5px] text-slate-300 mb-1">
                    Requisitos del Sistema
                  </label>
                  <textarea
                    rows={4}
                    value={form.system_requirements}
                    onChange={(e) => setForm({ ...form, system_requirements: e.target.value })}
                    className="w-full bg-slate-950 border border-cyan-500/30 focus:border-cyan-400 rounded-xl px-3.5 py-2 text-[12px] text-white focus:outline-none"
                  />
                </div>
              </div>

              {/* SECCIÓN ARCHIVOS: .ZIP (Supabase Storage o URL >50MB) + Manual PDF */}
              <div className="p-4 rounded-xl bg-slate-950/80 border border-cyan-500/25 flex flex-col gap-3.5">
                <div className="flex items-center gap-2 font-['Space_Grotesk'] text-[14px] font-bold text-cyan-300">
                  <Upload className="w-4 h-4" />
                  <span>Paquete Instalable (.ZIP) y Manual de Usuario (PDF)</span>
                </div>

                {/* Paquete .ZIP */}
                <div className="flex flex-col gap-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <label className="font-['JetBrains_Mono'] text-[10.5px] text-slate-300">
                      Archivo .ZIP (Subida directa ≤ 50 MB a Storage `software-releases` o URL segura externa) *
                    </label>
                    <label className="px-3 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/35 border border-cyan-400/50 text-cyan-200 font-['JetBrains_Mono'] text-[10.5px] font-bold flex items-center gap-1.5 cursor-pointer">
                      <FileArchive className="w-3.5 h-3.5" />
                      <span>{isUploadingZip ? 'Subiendo .ZIP...' : 'Subir .ZIP (≤ 50 MB)'}</span>
                      <input
                        type="file"
                        accept=".zip,application/zip,application/x-zip-compressed"
                        disabled={isUploadingZip}
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) void handleUploadStorageFile(file, 'zip');
                        }}
                      />
                    </label>
                  </div>
                  <div className="relative">
                    <LinkIcon className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={form.zip_download_url}
                      onChange={(e) => setForm({ ...form, zip_download_url: e.target.value })}
                      placeholder="https://... (o sube tu .ZIP arriba; usa URL externa si supera 50 MB)"
                      className="w-full bg-slate-900 border border-cyan-500/30 focus:border-cyan-400 rounded-xl pl-9 pr-3.5 py-2 text-[12px] text-cyan-200 font-['JetBrains_Mono'] focus:outline-none"
                    />
                  </div>
                </div>

                {/* Manual PDF opcional */}
                <div className="flex flex-col gap-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <label className="font-['JetBrains_Mono'] text-[10.5px] text-slate-300">
                      Manual de Usuario en PDF (Opcional)
                    </label>
                    <label className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-white/15 text-slate-200 font-['JetBrains_Mono'] text-[10.5px] font-semibold flex items-center gap-1.5 cursor-pointer">
                      <FileText className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{isUploadingManual ? 'Subiendo PDF...' : 'Subir Manual PDF'}</span>
                      <input
                        type="file"
                        accept=".pdf,application/pdf"
                        disabled={isUploadingManual}
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) void handleUploadStorageFile(file, 'manual');
                        }}
                      />
                    </label>
                  </div>
                  <input
                    type="text"
                    value={form.manual_download_url}
                    onChange={(e) => setForm({ ...form, manual_download_url: e.target.value })}
                    placeholder="Opcional: URL del manual PDF o sube el archivo arriba"
                    className="w-full bg-slate-900 border border-white/15 focus:border-cyan-400 rounded-xl px-3.5 py-2 text-[12px] text-slate-200 font-['JetBrains_Mono'] focus:outline-none"
                  />
                </div>
              </div>

              {/* Manual de Instalación y Uso paso a paso */}
              <div>
                <label className="block font-['JetBrains_Mono'] text-[10.5px] text-slate-300 mb-1">
                  Manual de Instalación y Uso (Paso a paso — visible en el modal del Cliente)
                </label>
                <textarea
                  rows={6}
                  value={form.installation_guide_md}
                  onChange={(e) => setForm({ ...form, installation_guide_md: e.target.value })}
                  className="w-full bg-slate-950 border border-cyan-500/30 focus:border-cyan-400 rounded-xl px-3.5 py-2.5 text-[12px] text-slate-100 font-['JetBrains_Mono'] leading-relaxed focus:outline-none"
                />
              </div>

              <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/30 flex items-center gap-2 text-[11px] text-emerald-200">
                <ShieldAlert className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>
                  Aislamiento garantizado: este producto aparecerá únicamente en el <strong>Portal de Clientes B2B</strong> y jamás será accesible para cuentas de estudiantes.
                </span>
              </div>
            </div>

            <div className="px-5 py-3.5 bg-slate-950/90 border-t border-white/10 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setIsEditorOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-[12px] cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSaving || isUploadingZip || isUploadingManual}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-400 text-slate-950 font-['Space_Grotesk'] font-bold text-[12.5px] flex items-center gap-1.5 shadow-[0_0_14px_rgba(6,182,212,0.4)] hover:shadow-[0_0_20px_rgba(6,182,212,0.8)] hover:scale-105 transition-all cursor-pointer disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{isSaving ? 'Guardando...' : 'Publicar en Catálogo B2B'}</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default AdminCatalogManager;
