import React from 'react';
import { X, FileText } from 'lucide-react';
import { ClientContract } from '../types';
import { ClientContractView } from './ClientContractView';

export interface ClientContractsModalProps {
  isOpen: boolean;
  onClose: () => void;
  contracts: ClientContract[];
  onContractSigned: (contractId: string, signatureData: string, signatureHash: string) => void;
  onUploadPhysicalContract?: (contractId: string, file: File, meta: { filename: string; size: number; uploadDate: string }) => void;
  showToast?: (msg: string) => void;
  clientCompany?: string;
  clientEmail?: string;
  clientName?: string;
  clientRfc?: string;
}

export const ClientContractsModal: React.FC<ClientContractsModalProps> = ({
  isOpen,
  onClose,
  contracts,
  onContractSigned,
  onUploadPhysicalContract,
  showToast,
  clientCompany = 'FinTech Global B2B',
  clientEmail = 'cliente@enterprise.corp',
  clientName = 'Director Tecnológico Corporativo',
  clientRfc = 'FTG200315KY1',
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#040817]/90 backdrop-blur-2xl p-2 sm:p-4 md:p-6 overflow-y-auto font-['Inter'] animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl bg-[#091129]/95 border-2 border-cyan-400/60 rounded-3xl shadow-[0_20px_70px_rgba(0,229,255,0.25)] flex flex-col max-h-[94vh] overflow-hidden">
        {/* Top Header */}
        <div className="px-6 py-4 bg-[#070e24] border-b border-cyan-900/50 flex items-center justify-between gap-4 shrink-0 no-print">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#0e1738] border border-cyan-400/50 flex items-center justify-center text-cyan-400 shadow-[0_0_12px_rgba(0,229,255,0.3)]">
              <FileText className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="font-['Space_Grotesk'] text-[17px] font-bold text-[#dce1ff]">
                  Contratos y Acuerdos de Servicios B2B
                </span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-['JetBrains_Mono'] text-[10px] font-bold">
                  PORTAL CLIENTE
                </span>
              </div>
              <span className="font-['JetBrains_Mono'] text-[11px] text-cyan-400">
                SISTEMA DUAL DE SUSCRIPCIÓN // DIGITAL &amp; FÍSICO
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

        {/* Scrollable Container with ClientContractView */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1">
          <ClientContractView
            contracts={contracts}
            onContractSigned={onContractSigned}
            onUploadPhysicalContract={onUploadPhysicalContract}
            clientCompany={clientCompany}
            clientEmail={clientEmail}
            clientName={clientName}
            clientRfc={clientRfc}
            showToast={showToast}
            onClose={onClose}
          />
        </div>
      </div>
    </div>
  );
};
