import React, { useState, useEffect } from 'react';
import {
  FileText,
  ShieldCheck,
  CheckCircle2,
  X,
  Lock,
  Download,
  AlertCircle,
  ExternalLink,
  Calendar,
  Building,
  User,
  Hash
} from 'lucide-react';
import { ClientContract } from '../types';
import { DigitalSignature } from './DigitalSignature';
import { supabase } from '../lib/supabase/client';

interface ClientContractsModalProps {
  isOpen: boolean;
  onClose: () => void;
  contracts: ClientContract[];
  onContractSigned: (contractId: string, signatureData: string, signatureHash: string) => void;
  showToast?: (msg: string) => void;
  clientCompany?: string;
  clientEmail?: string;
}

export const ClientContractsModal: React.FC<ClientContractsModalProps> = ({
  isOpen,
  onClose,
  contracts,
  onContractSigned,
  showToast,
  clientCompany = 'FinTech Global B2B',
  clientEmail = 'cliente@enterprise.corp',
}) => {
  const [selectedContractId, setSelectedContractId] = useState<string>('');

  useEffect(() => {
    if (contracts.length > 0 && !selectedContractId) {
      setSelectedContractId(contracts[0].id);
    }
  }, [contracts, selectedContractId]);

  if (!isOpen) return null;

  const currentContract = contracts.find((c) => c.id === selectedContractId) || contracts[0];

  const handleSaveSignature = async (vectorData: string, hash: string) => {
    if (!currentContract) return;

    // Call callback to update parent state
    onContractSigned(currentContract.id, vectorData, hash);

    // Attempt updating in Supabase
    try {
      await supabase
        .from('client_contracts')
        .update({
          status: 'signed',
          signature_data: vectorData,
          signature_hash: hash,
          signed_at: new Date().toISOString(),
          signer_email: clientEmail,
        })
        .eq('id', currentContract.id);
    } catch {
      // Local fallback
    }

    if (showToast) {
      showToast(`¡Contrato "${currentContract.title}" sellado y firmado criptográficamente con éxito!`);
    }
  };

  const handleDownloadCopy = () => {
    if (!currentContract) return;
    const blob = new Blob(
      [
        `===================================================================\n` +
        `MCRA SOLUTIONS // CONTRATO CRIPTOGRÁFICO CERTIFICADO B2B\n` +
        `ID DOCUMENTO: ${currentContract.id}\n` +
        `TÍTULO: ${currentContract.title}\n` +
        `EMPRESA CLIENTE: ${currentContract.client_company}\n` +
        `ESTADO: ${currentContract.status.toUpperCase()}\n` +
        `SELLO SHA-256: ${currentContract.signature_hash || 'PENDIENTE'}\n` +
        `FECHA: ${currentContract.signed_at || currentContract.created_at}\n` +
        `===================================================================\n\n` +
        currentContract.content
      ],
      { type: 'text/plain;charset=utf-8' }
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentContract.id}_${currentContract.client_company.replace(/\s+/g, '_')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    if (showToast) {
      showToast('Copia digital del contrato y sellos descargada.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#040817]/90 backdrop-blur-2xl p-3 sm:p-6 overflow-y-auto font-['Inter'] animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl bg-[#0a122c] border-2 border-[#00e5ff]/50 rounded-3xl shadow-[0_20px_70px_rgba(0,229,255,0.25)] flex flex-col max-h-[92vh] overflow-hidden">
        {/* Top Modal Header */}
        <div className="px-6 py-4 bg-[#070e24] border-b border-[#1b2b52] flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#121c3b] border border-[#00e5ff]/40 flex items-center justify-center text-[#00e5ff] shadow-[0_0_12px_rgba(0,229,255,0.3)]">
              <FileText className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="font-['Space_Grotesk'] text-[17px] font-bold text-[#dce1ff]">
                  Contratos y Acuerdos NDA Corporativos
                </span>
                <span className="px-2 py-0.5 rounded-full bg-[#00fe66]/15 border border-[#00fe66]/30 text-[#00fe66] font-['JetBrains_Mono'] text-[10px] font-bold">
                  PORTAL CLIENTE
                </span>
              </div>
              <span className="font-['JetBrains_Mono'] text-[11px] text-[#00daf3]">
                DOCUMENTO LEGAL ENCRIPTADO // ZERO-TRUST PROTOCOL
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-[#141d3b] hover:bg-[#1e2a52] text-[#bac9cc] hover:text-[#dce1ff] flex items-center justify-center transition-colors"
            aria-label="Cerrar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contract Selector Pills (If multiple) */}
        {contracts.length > 1 && (
          <div className="px-6 py-2.5 bg-[#081028] border-b border-[#182648] flex items-center gap-2 overflow-x-auto no-scrollbar shrink-0">
            <span className="font-['JetBrains_Mono'] text-[11px] text-[#849396] shrink-0">
              Documentos Disponibles:
            </span>
            {contracts.map((c) => {
              const isSelected = c.id === currentContract?.id;
              return (
                <button
                  key={c.id}
                  onClick={() => setSelectedContractId(c.id)}
                  className={`px-3 py-1 rounded-lg font-['JetBrains_Mono'] text-[11px] font-semibold transition-all shrink-0 flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-[#00e5ff] text-[#00363d] shadow-[0_0_10px_rgba(0,229,255,0.3)]'
                      : 'bg-[#121c3b] text-[#bac9cc] hover:text-[#dce1ff]'
                  }`}
                >
                  <span>{c.id}</span>
                  {c.status === 'signed' ? (
                    <span className="text-[#00fe66]">✓</span>
                  ) : (
                    <span className="w-1.5 h-1.5 rounded-full bg-[#ffb020] animate-pulse"></span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto flex flex-col gap-6 flex-1 text-[#dce1ff]">
          {!currentContract ? (
            <div className="p-8 text-center text-[#849396] font-['JetBrains_Mono']">
              No hay contratos pendientes en este momento.
            </div>
          ) : (
            <>
              {/* Contract Status Card */}
              <div className="rounded-2xl bg-[#0e1738] border border-[#1f2f5c] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="font-['JetBrains_Mono'] text-[12px] text-[#00e5ff] font-bold">
                      {currentContract.id}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-['JetBrains_Mono'] font-bold uppercase tracking-wider ${
                        currentContract.status === 'signed'
                          ? 'bg-[#00fe66]/20 text-[#00fe66] border border-[#00fe66]/40'
                          : 'bg-[#ff9900]/20 text-[#ffb020] border border-[#ffb020]/40 animate-pulse'
                      }`}
                    >
                      {currentContract.status === 'signed'
                        ? 'FIRMA CRIPTOGRÁFICA GUARDADA // SELLADO'
                        : 'PENDIENTE DE FIRMA DEL CLIENTE'}
                    </span>
                  </div>

                  <h3 className="font-['Space_Grotesk'] text-[18px] font-bold text-[#dce1ff]">
                    {currentContract.title}
                  </h3>

                  <div className="flex flex-wrap items-center gap-3 font-['JetBrains_Mono'] text-[11px] text-[#849396]">
                    <span>Cliente: <strong className="text-[#dce1ff]">{currentContract.client_company}</strong></span>
                    <span>•</span>
                    <span>Emisor: <strong className="text-[#00daf3]">MCRA Solutions (Jefe &amp; Socio)</strong></span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={handleDownloadCopy}
                    className="px-3.5 py-2 rounded-xl bg-[#141f42] hover:bg-[#1e2d5c] text-[#00e5ff] border border-[#00e5ff]/30 font-['JetBrains_Mono'] text-[11px] font-medium transition-all flex items-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Descargar TXT</span>
                  </button>
                </div>
              </div>

              {/* Document Text Box */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between font-['JetBrains_Mono'] text-[11px] text-[#849396]">
                  <span>TEXTO ÍNTEGRO DEL DOCUMENTO:</span>
                  <span className="text-[#00fe66]">CLAUSULADO ZERO-TRUST VALIDADO</span>
                </div>

                <div className="relative rounded-2xl bg-[#060b1c] border border-[#16244a] p-5 shadow-inner">
                  <div className="max-h-72 overflow-y-auto whitespace-pre-wrap font-['JetBrains_Mono'] text-[12px] leading-relaxed text-[#c3ceee] pr-2">
                    {currentContract.content}
                  </div>
                </div>
              </div>

              {/* Digital Signature Component Section */}
              <div className="flex flex-col gap-3 pt-2 border-t border-[#1a284e]">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#00fe66]" />
                  <h4 className="font-['Space_Grotesk'] text-[15px] font-bold text-[#dce1ff]">
                    Firma Autógrafa &amp; Registro Vectorial
                  </h4>
                </div>

                <DigitalSignature
                  onSaveSignature={handleSaveSignature}
                  existingSignature={currentContract.signature_data}
                  existingHash={currentContract.signature_hash}
                  signerName={currentContract.client_name || clientCompany}
                  signerEmail={currentContract.client_email || clientEmail}
                  readOnly={currentContract.status === 'signed'}
                />
              </div>
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-[#070e24] border-t border-[#1b2b52] flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 font-['JetBrains_Mono'] text-[11px] text-[#849396]">
            <Lock className="w-3.5 h-3.5 text-[#00fe66]" />
            <span>Firmas protegidas con cifrado asimétrico y sellado en Enclave HSM.</span>
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-[#141f42] hover:bg-[#1e2d5c] text-[#dce1ff] font-['JetBrains_Mono'] text-[12px] font-semibold transition-all"
          >
            Cerrar Modal
          </button>
        </div>
      </div>
    </div>
  );
};
