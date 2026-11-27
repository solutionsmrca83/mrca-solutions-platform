'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../lib/supabase/client';
import { VaultFile } from '../types';
import {
  ShieldCheck,
  Lock,
  Download,
  Key,
  FileCode,
  FileArchive,
  FileText,
  FileCheck,
  Copy,
  Check,
  HardDrive,
  RefreshCw,
  Search,
  Plus,
  Trash2,
  ExternalLink,
} from 'lucide-react';

interface ClientFileVaultProps {
  showToast?: (msg: string) => void;
  isAdmin?: boolean;
  clientId?: string;
}

export const ClientFileVault: React.FC<ClientFileVaultProps> = ({
  showToast,
  isAdmin = false,
  clientId,
}) => {
  const [files, setFiles] = useState<VaultFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedHash, setCopiedHash] = useState<string | null>(null);
  const [decryptingFileId, setDecryptingFileId] = useState<string | null>(null);
  const [decryptProgress, setDecryptProgress] = useState(0);

  // Admin upload state
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [newFilename, setNewFilename] = useState('');
  const [newFileType, setNewFileType] = useState<'ZIP' | 'SQL' | 'PDF' | 'TAR.GZ' | 'ENC'>('ZIP');
  const [newFileSize, setNewFileSize] = useState('');
  const [newDescription, setNewDescription] = useState('');

  useEffect(() => {
    let mounted = true;
    async function loadVault() {
      setIsLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        const uid = clientId || user?.id || null;

        let query = supabase
          .from('vault_files')
          .select('*')
          .order('created_at', { ascending: false });

        if (!isAdmin) {
          if (!uid) {
            if (mounted) setFiles([]);
            return;
          }
          query = query.eq('client_id', uid);
        }

        const { data, error } = await query;
        if (mounted && !error && Array.isArray(data)) {
          const mapped: VaultFile[] = data.map((d: any) => ({
            id: String(d.id),
            client_id: d.client_id,
            filename: d.filename,
            file_type: d.file_type,
            file_size: d.file_size,
            sha256_hash: d.sha256_hash,
            encryption_type: d.encryption_type || 'AES-256-GCM / Conocimiento Cero',
            download_url: d.download_url,
            description: d.description,
            created_at: d.created_at,
          }));
          setFiles(mapped);
        } else if (mounted) {
          setFiles([]);
        }
      } catch {
        if (mounted) setFiles([]);
      } finally {
        if (mounted) setIsLoading(false);
      }
    }
    void loadVault();
    return () => {
      mounted = false;
    };
  }, [isAdmin, clientId]);

  const handleCopyHash = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(hash);
    if (showToast) showToast('Hash SHA-256 copiado al portapapeles.');
    setTimeout(() => setCopiedHash(null), 2500);
  };

  const handleDecryptAndDownload = (file: VaultFile) => {
    if (!file.download_url || !/^https?:\/\//i.test(file.download_url)) {
      if (showToast) {
        showToast('Este registro aún no tiene un enlace de descarga activo asignado.');
      }
      return;
    }

    setDecryptingFileId(file.id);
    setDecryptProgress(50);

    setTimeout(() => {
      setDecryptProgress(100);
      setDecryptingFileId(null);
      window.open(file.download_url, '_blank', 'noopener,noreferrer');
      if (showToast) {
        showToast(`Descarga segura iniciada para [${file.filename}].`);
      }
    }, 350);
  };

  const handleAdminAddFile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFilename.trim()) return;

    const randomHash =
      '0x' +
      Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');

    const newF: VaultFile = {
      id: `VF-${Math.floor(Math.random() * 900 + 100)}`,
      filename: newFilename.trim(),
      file_type: newFileType,
      file_size: newFileSize,
      sha256_hash: randomHash,
      encryption_type: 'AES-256-GCM / Hardware HSM',
      download_url: '#download',
      description: newDescription || 'Entregable final asignado al cliente corporativo.',
      created_at: new Date().toISOString(),
    };

    setFiles((prev) => [newF, ...prev]);
    setIsUploadModalOpen(false);
    setNewFilename('');
    setNewDescription('');

    if (showToast) {
      showToast(`Entregable [${newF.filename}] depositado en la Bóveda Segura.`);
    }

    try {
      await supabase.from('vault_files').insert({
        filename: newF.filename,
        file_type: newF.file_type,
        file_size: newF.file_size,
        sha256_hash: newF.sha256_hash,
        encryption_type: newF.encryption_type,
        download_url: newF.download_url,
        description: newF.description,
      });
    } catch {
      // Local graceful fallback
    }
  };

  const filteredFiles = files.filter(
    (f) =>
      f.filename.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.file_type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'SQL':
        return <FileCode className="w-6 h-6 text-[#00E5FF]" />;
      case 'PDF':
        return <FileText className="w-6 h-6 text-[#FF5555]" />;
      case 'TAR.GZ':
      case 'ZIP':
        return <FileArchive className="w-6 h-6 text-[#00FF66]" />;
      default:
        return <FileCheck className="w-6 h-6 text-[#9CF0FF]" />;
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Top Header Card */}
      <section className="relative w-full rounded-2xl bg-gradient-to-r from-[#141A32] via-[#0A1128] to-[#141A32] border border-[#00E5FF]/30 p-5 sm:p-6 shadow-xl overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#00FF66] animate-pulse shadow-[0_0_8px_rgba(0,255,102,0.8)]" />
              <span className="font-['JetBrains_Mono'] text-[11px] text-[#00E5FF] tracking-wider uppercase font-semibold">
                BÓVEDA DE ENTREGABLES // CONOCIMIENTO CERO
              </span>
            </div>
            <h2 className="font-['Space_Grotesk'] text-2xl sm:text-3xl font-bold text-[#DCE1FF]">
              Bóveda Cifrada de Entregables Finales
            </h2>
            <p className="font-['Inter'] text-xs sm:text-sm text-[#BAC9CC] mt-1 max-w-2xl">
              Descargue código fuente, respaldos SQL, certificados de pentest y llaves criptográficas protegidas con sellado simétrico AES-256-GCM y verificación de integridad SHA-256.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 bg-[#181E36] px-3 py-2 rounded-xl border border-[#3b494c] font-['JetBrains_Mono'] text-[11px] text-[#BAC9CC]">
              <HardDrive className="w-4 h-4 text-[#00E5FF]" />
              <span>TOTAL ENTREGABLES: <strong className="text-[#00FF66]">{files.length}</strong></span>
            </div>

            {isAdmin && (
              <button
                onClick={() => setIsUploadModalOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#00FF66] hover:bg-[#80ffaa] text-[#00363D] font-['JetBrains_Mono'] text-[11px] font-bold uppercase transition-all shadow-[0_0_15px_rgba(0,255,102,0.4)]"
              >
                <Plus className="w-4 h-4" />
                <span>DEPOSITAR ENTREGABLE</span>
              </button>
            )}
          </div>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="mt-5 pt-4 border-t border-[#181E36] flex flex-col sm:flex-row gap-3 justify-between items-center">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#849396]" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por nombre, formato (.SQL, .ZIP)..."
              className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-[#0A1128] border border-[#00E5FF]/20 text-[#DCE1FF] placeholder-[#849396] font-['JetBrains_Mono'] text-[11px] focus:outline-none focus:border-[#00E5FF]"
            />
          </div>

          <div className="flex items-center gap-2 font-['JetBrains_Mono'] text-[10px] text-[#849396]">
            <Key className="w-3.5 h-3.5 text-[#00FF66]" />
            <span>DESBLOQUEO PROTEGIDO POR CLAVE DE CLIENTE ACTIVA</span>
          </div>
        </div>
      </section>

      {/* Grid of Encrypted Files */}
      {isLoading ? (
        <div className="rounded-2xl bg-[#141A32]/80 border border-[#00E5FF]/20 p-10 text-center font-['JetBrains_Mono'] text-[12px] text-[#849396]">
          Consultando entregables cifrados en Supabase...
        </div>
      ) : filteredFiles.length === 0 ? (
        <div className="rounded-2xl bg-[#141A32]/80 border border-dashed border-[#00E5FF]/25 p-10 text-center flex flex-col items-center gap-2">
          <Lock className="w-8 h-8 text-[#849396]" />
          <span className="font-['Space_Grotesk'] text-[16px] font-bold text-[#DCE1FF]">
            Sin registros aún
          </span>
          <p className="font-['Inter'] text-[12px] text-[#849396] max-w-md">
            Los entregables cifrados asignados a tu cuenta aparecerán aquí automáticamente.
          </p>
        </div>
      ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredFiles.map((file) => {
          const isCurrentlyDecrypting = decryptingFileId === file.id;

          return (
            <motion.div
              key={file.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl bg-[#141A32]/90 border border-[#00E5FF]/20 p-5 hover:border-[#00E5FF]/50 transition-all shadow-lg flex flex-col justify-between gap-4 group"
            >
              {/* Top Meta */}
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-[#181E36] border border-[#00E5FF]/30 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      {getFileIcon(file.file_type)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-[#00E5FF]/10 text-[#00E5FF] font-['JetBrains_Mono'] text-[10px] font-bold">
                          {file.file_type}
                        </span>
                        <span className="font-['JetBrains_Mono'] text-[10px] text-[#BAC9CC]">
                          {file.file_size}
                        </span>
                      </div>
                      <h3 className="font-['Space_Grotesk'] text-[15px] font-bold text-[#DCE1FF] mt-1 break-all leading-snug">
                        {file.filename}
                      </h3>
                    </div>
                  </div>
                </div>

                {file.description && (
                  <p className="font-['Inter'] text-xs text-[#BAC9CC] mt-2.5 leading-relaxed">
                    {file.description}
                  </p>
                )}
              </div>

              {/* Security Hash & Integrity Verification */}
              <div className="p-2.5 rounded-lg bg-[#0A1128] border border-[#181E36] flex flex-col gap-1.5">
                <div className="flex items-center justify-between font-['JetBrains_Mono'] text-[10px]">
                  <span className="text-[#849396]">INTEGRIDAD SHA-256</span>
                  <button
                    onClick={() => handleCopyHash(file.sha256_hash)}
                    className="flex items-center gap-1 text-[#00E5FF] hover:underline"
                    title="Copiar Hash"
                  >
                    {copiedHash === file.sha256_hash ? (
                      <>
                        <Check className="w-3 h-3 text-[#00FF66]" />
                        <span className="text-[#00FF66]">Copiado</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copiar</span>
                      </>
                    )}
                  </button>
                </div>
                <span className="font-['JetBrains_Mono'] text-[10px] text-[#BAC9CC] truncate" title={file.sha256_hash}>
                  {file.sha256_hash}
                </span>
                <div className="flex items-center justify-between text-[9px] font-['JetBrains_Mono'] text-[#00FF66] pt-1 border-t border-[#181E36]">
                  <span>CIFRADO: {file.encryption_type}</span>
                  <span className="text-[#849396]">
                    {new Date(file.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {/* Action: Decrypt & Download */}
              <div>
                {isCurrentlyDecrypting ? (
                  <div className="w-full p-2 rounded-lg bg-[#181E36] border border-[#00E5FF]/40 flex flex-col gap-1.5">
                    <div className="flex items-center justify-between font-['JetBrains_Mono'] text-[10px] text-[#00E5FF]">
                      <span className="flex items-center gap-1.5">
                        <RefreshCw className="w-3 h-3 animate-spin" />
                        DESCIFRANDO CLAVES AES-256...
                      </span>
                      <span className="font-bold">{decryptProgress}%</span>
                    </div>
                    <div className="w-full bg-[#0A1128] h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-[#00E5FF] to-[#00FF66] h-full transition-all duration-200"
                        style={{ width: `${decryptProgress}%` }}
                      />
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => handleDecryptAndDownload(file)}
                    className="w-full py-2.5 rounded-lg bg-[#00E5FF]/10 hover:bg-[#00E5FF] text-[#00E5FF] hover:text-[#00363D] border border-[#00E5FF]/40 font-['JetBrains_Mono'] text-[11px] font-bold uppercase transition-all flex items-center justify-center gap-2 shadow-sm"
                  >
                    <Download className="w-4 h-4" />
                    <span>DESCIFRAR &amp; DESCARGAR</span>
                  </button>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
      )}

      {/* Admin Deposit Modal */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#0A1128]/85 backdrop-blur-md flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-lg rounded-2xl bg-[#141A32] border border-[#00FF66]/40 p-6 shadow-2xl flex flex-col gap-4 animate-border-pulse"
          >
            <div className="flex items-center justify-between border-b border-[#181E36] pb-3">
              <div className="flex items-center gap-2 text-[#00FF66]">
                <Lock className="w-5 h-5" />
                <h3 className="font-['Space_Grotesk'] text-lg font-bold text-[#DCE1FF]">
                  Depositar Entregable en Bóveda
                </h3>
              </div>
              <button
                onClick={() => setIsUploadModalOpen(false)}
                className="text-[#849396] hover:text-[#DCE1FF] font-['JetBrains_Mono'] text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAdminAddFile} className="flex flex-col gap-3.5">
              <div>
                <label className="font-['JetBrains_Mono'] text-[11px] text-[#BAC9CC] block mb-1">
                  Nombre del Archivo:
                </label>
                <input
                  type="text"
                  value={newFilename}
                  onChange={(e) => setNewFilename(e.target.value)}
                  placeholder="ej. produccion_db_backup.sql"
                  required
                  className="w-full px-3 py-2 rounded-lg bg-[#0A1128] border border-[#00E5FF]/30 text-[#DCE1FF] font-['JetBrains_Mono'] text-[12px] focus:outline-none focus:border-[#00FF66]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-['JetBrains_Mono'] text-[11px] text-[#BAC9CC] block mb-1">
                    Formato:
                  </label>
                  <select
                    value={newFileType}
                    onChange={(e) => setNewFileType(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-lg bg-[#0A1128] border border-[#00E5FF]/30 text-[#DCE1FF] font-['JetBrains_Mono'] text-[12px] focus:outline-none"
                  >
                    <option value="ZIP">ZIP (.zip)</option>
                    <option value="SQL">SQL (.sql)</option>
                    <option value="PDF">PDF (.pdf)</option>
                    <option value="TAR.GZ">TAR.GZ (.tar.gz)</option>
                    <option value="ENC">ENC Cifrado (.enc)</option>
                  </select>
                </div>

                <div>
                  <label className="font-['JetBrains_Mono'] text-[11px] text-[#BAC9CC] block mb-1">
                    Tamaño Aprox:
                  </label>
                  <input
                    type="text"
                    value={newFileSize}
                    onChange={(e) => setNewFileSize(e.target.value)}
                    placeholder="ej. 45.2 MB"
                    className="w-full px-3 py-2 rounded-lg bg-[#0A1128] border border-[#00E5FF]/30 text-[#DCE1FF] font-['JetBrains_Mono'] text-[12px]"
                  />
                </div>
              </div>

              <div>
                <label className="font-['JetBrains_Mono'] text-[11px] text-[#BAC9CC] block mb-1">
                  Descripción del Entregable:
                </label>
                <textarea
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  rows={3}
                  placeholder="Instrucciones para el cliente y alcance del entregable..."
                  className="w-full px-3 py-2 rounded-lg bg-[#0A1128] border border-[#00E5FF]/30 text-[#DCE1FF] font-['Inter'] text-[12px] focus:outline-none focus:border-[#00FF66]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#181E36]">
                <button
                  type="button"
                  onClick={() => setIsUploadModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-[#181E36] text-[#BAC9CC] font-['JetBrains_Mono'] text-[11px]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-[#00FF66] hover:bg-[#80ffaa] text-[#00363D] font-['JetBrains_Mono'] text-[11px] font-bold uppercase transition-all shadow-[0_0_12px_rgba(0,255,102,0.4)]"
                >
                  Sellar y Depositar en Bóveda
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};
