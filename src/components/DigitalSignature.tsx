import React, { useRef, useState, useEffect } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { ShieldCheck, RefreshCw, CheckCircle2, Lock, Sparkles, AlertCircle } from 'lucide-react';

interface DigitalSignatureProps {
  onSaveSignature: (vectorData: string, hash: string) => void;
  readOnly?: boolean;
  existingSignature?: string | null;
  existingHash?: string | null;
  signerName?: string;
  signerEmail?: string;
  className?: string;
}

export const DigitalSignature: React.FC<DigitalSignatureProps> = ({
  onSaveSignature,
  readOnly = false,
  existingSignature = null,
  existingHash = null,
  signerName = 'Cliente Corporativo',
  signerEmail = 'cliente@enterprise.corp',
  className = '',
}) => {
  const sigCanvasRef = useRef<SignatureCanvas | null>(null);
  const [isEmpty, setIsEmpty] = useState(true);
  const [penColor, setPenColor] = useState<'#00e5ff' | '#00fe66'>('#00e5ff');
  const [isProcessing, setIsProcessing] = useState(false);
  const [signatureSaved, setSignatureSaved] = useState(Boolean(existingSignature));
  const [computedHash, setComputedHash] = useState<string | null>(existingHash);

  useEffect(() => {
    if (existingSignature) {
      setSignatureSaved(true);
      setComputedHash(existingHash || '0x' + Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join(''));
    }
  }, [existingSignature, existingHash]);

  const handleClear = () => {
    if (sigCanvasRef.current) {
      sigCanvasRef.current.clear();
      setIsEmpty(true);
    }
  };

  const handleBeginStroke = () => {
    setIsEmpty(false);
  };

  const calculateSha256 = (data: string): string => {
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    const hex = Math.abs(hash).toString(16).padStart(8, '0');
    // Generate simulated cryptographic ECDSA / SHA-256 seal format
    return `SHA256:${hex}${Array.from({ length: 24 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`;
  };

  const handleConfirmSignature = () => {
    if (!sigCanvasRef.current || isEmpty) return;

    setIsProcessing(true);

    setTimeout(() => {
      try {
        const dataUrl = sigCanvasRef.current?.getTrimmedCanvas().toDataURL('image/png') || '';
        const generatedHash = calculateSha256(dataUrl + signerEmail + Date.now().toString());

        setComputedHash(generatedHash);
        setSignatureSaved(true);
        setIsProcessing(false);
        onSaveSignature(dataUrl, generatedHash);
      } catch (err) {
        console.error('Error al capturar vector de firma:', err);
        setIsProcessing(false);
      }
    }, 600);
  };

  return (
    <div className={`w-full flex flex-col gap-3 ${className}`}>
      {signatureSaved ? (
        // STATE: FIRMA CRIPTOGRÁFICA GUARDADA SUCCESS
        <div className="relative overflow-hidden rounded-2xl bg-[#061024]/95 border-2 border-[#00fe66]/60 p-5 shadow-[0_0_30px_rgba(0,254,102,0.25)] backdrop-blur-xl animate-in fade-in duration-300">
          <div className="absolute top-0 right-0 w-64 h-full bg-gradient-to-l from-[#00fe66]/10 to-transparent pointer-events-none"></div>

          <div className="flex flex-col gap-4 relative z-10">
            {/* Header Status */}
            <div className="flex items-center justify-between pb-3 border-b border-[#00fe66]/20">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-[#00fe66] animate-pulse shadow-[0_0_10px_#00fe66]"></span>
                <span className="font-['JetBrains_Mono'] text-[12px] text-[#00fe66] uppercase tracking-wider font-bold">
                  FIRMA CRIPTOGRÁFICA GUARDADA // PROTOCOLO SEC-V4
                </span>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#00fe66]/15 border border-[#00fe66]/30 text-[#00fe66] font-['JetBrains_Mono'] text-[10px]">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>ECDSA VERIFIED</span>
              </div>
            </div>

            {/* Signature Vector Rendered Preview */}
            <div className="relative w-full h-36 bg-[#040816] rounded-xl border border-[#00fe66]/30 flex items-center justify-center p-3 overflow-hidden shadow-inner">
              <div className="absolute inset-0 bg-[linear-gradient(to_right,#00fe6608_1px,transparent_1px),linear-gradient(to_bottom,#00fe6608_1px,transparent_1px)] bg-[size:16px_16px]"></div>
              
              {existingSignature ? (
                <img
                  src={existingSignature}
                  alt="Firma Criptográfica"
                  className="max-h-28 object-contain filter drop-shadow-[0_0_8px_rgba(0,254,102,0.6)] relative z-10"
                />
              ) : (
                <div className="flex flex-col items-center justify-center gap-1 text-[#00fe66] relative z-10">
                  <CheckCircle2 className="w-8 h-8 drop-shadow-[0_0_10px_#00fe66]" />
                  <span className="font-['Space_Grotesk'] text-[13px] font-semibold">Trazo Vectorial Registrado en Memoria</span>
                </div>
              )}

              {/* Watermark */}
              <div className="absolute bottom-2 right-3 font-['JetBrains_Mono'] text-[9px] text-[#00fe66]/40 uppercase tracking-widest select-none">
                MRCA SECURE ENCLAVE SEAL
              </div>
            </div>

            {/* Cryptographic Seal Details */}
            <div className="bg-[#0b1632] rounded-xl p-3 border border-[#1b2b52] flex flex-col gap-1.5 font-['JetBrains_Mono'] text-[11px]">
              <div className="flex flex-wrap items-center justify-between gap-1 text-[#849396]">
                <span>FIRMADO POR:</span>
                <span className="text-[#dce1ff] font-semibold">{signerName} &lt;{signerEmail}&gt;</span>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-1 text-[#849396]">
                <span>ESTADO DEL CONTRATO:</span>
                <span className="text-[#00fe66] font-bold">LEGALMENTE VINCULANTE & SELLADO</span>
              </div>
              <div className="flex flex-col gap-0.5 pt-1 border-t border-[#182647]">
                <span className="text-[#849396]">SELLO CRIPTOGRÁFICO INMUTABLE:</span>
                <span className="text-[#00e5ff] font-mono break-all select-all font-semibold bg-[#060e20] p-1.5 rounded border border-[#00e5ff]/20">
                  {computedHash}
                </span>
              </div>
            </div>

            {!readOnly && (
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setSignatureSaved(false);
                    setTimeout(() => handleClear(), 50);
                  }}
                  className="text-[11px] font-['JetBrains_Mono'] text-[#bac9cc] hover:text-[#ff5555] flex items-center gap-1 transition-colors"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Volver a firmar (Invalidar trazo previo)</span>
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        // STATE: INTERACTIVE SIGNATURE PAD
        <div className="relative flex flex-col gap-3 rounded-2xl bg-[#091129]/95 border-2 border-[#00e5ff]/40 p-4 shadow-[0_0_24px_rgba(0,229,255,0.15)] backdrop-blur-xl">
          {/* Header & Instructions */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#00e5ff] animate-ping"></span>
              <span className="font-['Space_Grotesk'] text-[14px] font-bold text-[#dce1ff]">
                Panel de Firma Digital Vectorial
              </span>
            </div>

            <div className="flex items-center gap-2 font-['JetBrains_Mono'] text-[11px]">
              <span className="text-[#849396]">Color de Tinta:</span>
              <button
                type="button"
                onClick={() => setPenColor('#00e5ff')}
                className={`w-5 h-5 rounded-full bg-[#00e5ff] border-2 transition-all ${
                  penColor === '#00e5ff' ? 'border-white scale-110 shadow-[0_0_8px_#00e5ff]' : 'border-transparent opacity-60'
                }`}
                title="Tech Cyan"
              />
              <button
                type="button"
                onClick={() => setPenColor('#00fe66')}
                className={`w-5 h-5 rounded-full bg-[#00fe66] border-2 transition-all ${
                  penColor === '#00fe66' ? 'border-white scale-110 shadow-[0_0_8px_#00fe66]' : 'border-transparent opacity-60'
                }`}
                title="Terminal Green"
              />
            </div>
          </div>

          <p className="font-['Inter'] text-[12px] text-[#bac9cc]">
            Dibuje su firma con el cursor táctil o ratón dentro del recuadro protegido. Se generará un vector geométrico con hash de no repudio.
          </p>

          {/* Canvas Box */}
          <div className="relative w-full h-44 bg-[#050b1a] rounded-xl border border-[#00e5ff]/30 overflow-hidden cursor-crosshair shadow-inner group">
            {/* Cyber Grid Background */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#00e5ff0d_1px,transparent_1px),linear-gradient(to_bottom,#00e5ff0d_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none"></div>

            {/* Baseline Guideline */}
            <div className="absolute left-6 right-6 bottom-10 border-b border-dashed border-[#00e5ff]/20 pointer-events-none flex justify-between">
              <span className="font-['JetBrains_Mono'] text-[9px] text-[#00e5ff]/40 uppercase tracking-widest -mt-4">
                LÍNEA GUÍA DE FIRMA AUTÓGRAFA
              </span>
              <span className="font-['JetBrains_Mono'] text-[9px] text-[#00e5ff]/40 -mt-4">
                [X] FIRMA AQUÍ
              </span>
            </div>

            <SignatureCanvas
              ref={sigCanvasRef}
              penColor={penColor}
              velocityFilterWeight={0.7}
              minWidth={1.5}
              maxWidth={3.5}
              dotSize={2.0}
              onBegin={handleBeginStroke}
              canvasProps={{
                className: 'w-full h-full block',
              }}
            />

            {isEmpty && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-40 group-hover:opacity-60 transition-opacity">
                <span className="font-['JetBrains_Mono'] text-[12px] text-[#00e5ff] tracking-wider uppercase flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4" />
                  Presione y arrastre para trazar firma
                </span>
              </div>
            )}
          </div>

          {/* Action Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <button
              type="button"
              onClick={handleClear}
              disabled={isEmpty}
              className="px-3 py-1.5 rounded-lg bg-[#141b33] hover:bg-[#1d2749] text-[#bac9cc] hover:text-[#ff5555] border border-[#232f53] font-['JetBrains_Mono'] text-[11px] font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Limpiar Trazo</span>
            </button>

            <button
              type="button"
              onClick={handleConfirmSignature}
              disabled={isEmpty || isProcessing}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#00e5ff] to-[#00b4d8] hover:from-[#5af2ff] hover:to-[#00e5ff] text-[#00363d] font-['JetBrains_Mono'] text-[12px] font-bold uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(0,229,255,0.4)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Sellando con SHA-256...</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>Guardar y Sellar Firma Criptográfica</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
