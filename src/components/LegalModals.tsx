import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ShieldCheck,
  FileText,
  X,
  Mail,
  Lock,
  Scale,
  CheckCircle2,
  Cookie,
} from 'lucide-react';

export type LegalModalView = 'privacidad' | 'terminos';

interface LegalModalsProps {
  isOpen: boolean;
  initialView?: LegalModalView;
  onClose: () => void;
}

export const LegalModals: React.FC<LegalModalsProps> = ({
  isOpen,
  initialView = 'privacidad',
  onClose,
}) => {
  const [activeView, setActiveView] = useState<LegalModalView>(initialView);

  useEffect(() => {
    if (isOpen) {
      setActiveView(initialView);
    }
  }, [isOpen, initialView]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={
            activeView === 'privacidad'
              ? 'Aviso de Privacidad Integral'
              : 'Términos y Condiciones de Uso'
          }
          onClick={onClose}
          className="fixed inset-0 z-[100000] flex items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-6 font-['Inter']"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 14 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 14 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-3xl max-h-[88vh] rounded-2xl bg-slate-900/95 backdrop-blur-xl border border-cyan-500/30 shadow-[0_0_50px_rgba(6,182,212,0.28)] flex flex-col overflow-hidden text-slate-200"
          >
            {/* ENCABEZADO + SELECTOR DE DOCUMENTO */}
            <div className="px-5 py-4 bg-slate-950/90 border-b border-cyan-500/25 flex flex-col gap-3 shrink-0">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-cyan-500/15 border border-cyan-500/40 flex items-center justify-center text-cyan-300 shrink-0">
                    {activeView === 'privacidad' ? (
                      <ShieldCheck className="w-5 h-5" />
                    ) : (
                      <Scale className="w-5 h-5" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <span className="block font-['JetBrains_Mono'] text-[10px] uppercase tracking-wider text-cyan-400 font-bold">
                      CUMPLIMIENTO LEGAL MÉXICO • LFPDPPP
                    </span>
                    <h2 className="font-['Space_Grotesk'] text-[17px] sm:text-[19px] font-bold text-white truncate">
                      {activeView === 'privacidad'
                        ? 'Aviso de Privacidad Integral'
                        : 'Términos y Condiciones de Uso'}
                    </h2>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Cerrar ventana legal"
                  className="w-8 h-8 rounded-lg bg-slate-800/90 hover:bg-red-500/20 text-slate-300 hover:text-red-300 flex items-center justify-center transition-colors cursor-pointer shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Pestañas seleccionables */}
              <div className="flex items-center gap-2 p-1 rounded-xl bg-slate-900/90 border border-white/10 w-fit">
                <button
                  type="button"
                  onClick={() => setActiveView('privacidad')}
                  className={`px-3.5 py-1.5 rounded-lg text-[11.5px] font-['Space_Grotesk'] font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    activeView === 'privacidad'
                      ? 'bg-gradient-to-r from-cyan-500 to-teal-400 text-slate-950 shadow-[0_0_12px_rgba(6,182,212,0.35)]'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Aviso de Privacidad Integral</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveView('terminos')}
                  className={`px-3.5 py-1.5 rounded-lg text-[11.5px] font-['Space_Grotesk'] font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    activeView === 'terminos'
                      ? 'bg-gradient-to-r from-cyan-500 to-teal-400 text-slate-950 shadow-[0_0_12px_rgba(6,182,212,0.35)]'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Términos y Condiciones de Uso</span>
                </button>
              </div>
            </div>

            {/* CONTENIDO DESPLAZABLE */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5 text-[13px] leading-relaxed text-slate-300 scrollbar-thin scrollbar-thumb-cyan-900/50 scrollbar-track-transparent">
              {activeView === 'privacidad' ? (
                <>
                  <div className="p-4 rounded-xl bg-cyan-950/30 border border-cyan-500/30 text-[12.5px] text-slate-200">
                    De conformidad con la{' '}
                    <strong className="text-white">
                      Ley Federal de Protección de Datos Personales en Posesión de los Particulares (LFPDPPP)
                    </strong>{' '}
                    vigente en los Estados Unidos Mexicanos, ponemos a tu disposición el presente Aviso de Privacidad Integral.
                  </div>

                  <section className="space-y-1.5">
                    <h3 className="font-['Space_Grotesk'] text-[15px] font-bold text-white flex items-center gap-2">
                      <Lock className="w-4 h-4 text-cyan-400" />
                      <span>1. Identidad y Domicilio del Responsable</span>
                    </h3>
                    <p>
                      <strong className="text-white">MRCA Solutions</strong> es responsable del tratamiento legítimo, controlado e informado de tus datos personales. Para cualquier asunto relacionado con privacidad y protección de datos, nuestro canal oficial de contacto es:{' '}
                      <a
                        href="mailto:solutionsmrca83@gmail.com"
                        className="text-cyan-300 underline hover:text-cyan-200 font-['JetBrains_Mono'] text-[12px]"
                      >
                        solutionsmrca83@gmail.com
                      </a>
                      .
                    </p>
                  </section>

                  <section className="space-y-2">
                    <h3 className="font-['Space_Grotesk'] text-[15px] font-bold text-white">
                      2. Datos Personales Recabados
                    </h3>
                    <p>Recabamos exclusivamente datos de identificación y contacto empresarial:</p>
                    <ul className="list-disc pl-5 space-y-1 text-slate-300">
                      <li>Nombre completo del representante o solicitante.</li>
                      <li>Correo electrónico corporativo o de contacto.</li>
                      <li>Nombre de la empresa o negocio.</li>
                      <li>
                        Datos fiscales y contractuales estrictamente necesarios para la emisión de contratos y facturación B2B (como razón social y RFC cuando aplique).
                      </li>
                    </ul>
                    <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/30 text-[12px] text-emerald-200 flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span>
                        <strong>Declaración de minimización:</strong> MRCA Solutions{' '}
                        <strong className="text-white">
                          no recaba datos personales sensibles
                        </strong>{' '}
                        (origen étnico, estado de salud, creencias o afiliación) ni solicita credenciales, historiales o{' '}
                        <strong className="text-white">matrículas académicas</strong>.
                      </span>
                    </div>
                  </section>

                  <section className="space-y-1.5">
                    <h3 className="font-['Space_Grotesk'] text-[15px] font-bold text-white">
                      3. Finalidades del Tratamiento
                    </h3>
                    <p>Tus datos personales se utilizan exclusivamente para las siguientes finalidades primarias:</p>
                    <ul className="list-disc pl-5 space-y-1 text-slate-300">
                      <li>Prestación de servicios de ingeniería de software, ciberseguridad e infraestructura en la nube.</li>
                      <li>Creación, verificación y gestión de cuentas de acceso en los portales corporativos.</li>
                      <li>Elaboración de cotizaciones, emisión de contratos formales y cumplimiento de obligaciones legales y fiscales.</li>
                      <li>Atención de soporte técnico, seguimiento de entregas y notificaciones operativas.</li>
                    </ul>
                  </section>

                  <section className="space-y-1.5">
                    <h3 className="font-['Space_Grotesk'] text-[15px] font-bold text-white flex items-center gap-2">
                      <Mail className="w-4 h-4 text-cyan-400" />
                      <span>4. Ejercicio de Derechos ARCO</span>
                    </h3>
                    <p>
                      Tienes derecho a <strong className="text-white">Acceder</strong> a tus datos personales,{' '}
                      <strong className="text-white">Rectificarlos</strong> si son inexactos,{' '}
                      <strong className="text-white">Cancelarlos</strong> cuando consideres que no son necesarios o{' '}
                      <strong className="text-white">Oponerte</strong> a su tratamiento (Derechos ARCO), así como revocar tu consentimiento.
                    </p>
                    <p>
                      Para ejercer tus Derechos ARCO, envía una solicitud al correo{' '}
                      <strong className="text-cyan-300 font-['JetBrains_Mono'] text-[12px]">
                        solutionsmrca83@gmail.com
                      </strong>{' '}
                      con el asunto <em>&quot;Solicitud de Derechos ARCO&quot;</em>, indicando tu nombre completo, el derecho que deseas ejercer y el correo donde recibirás respuesta. Atenderemos tu solicitud dentro de los plazos establecidos por la LFPDPPP (máximo 20 días hábiles).
                    </p>
                  </section>

                  <section className="space-y-1.5">
                    <h3 className="font-['Space_Grotesk'] text-[15px] font-bold text-white flex items-center gap-2">
                      <Cookie className="w-4 h-4 text-cyan-400" />
                      <span>5. Uso de Cookies y Almacenamiento Local</span>
                    </h3>
                    <p>
                      Esta plataforma utiliza únicamente cookies técnicas y almacenamiento local estrictamente necesarios para resguardar tu sesión autenticada, registrar tu consentimiento legal y proteger la integridad del acceso. No utilizamos rastreadores publicitarios de terceros ni comercializamos tu información.
                    </p>
                  </section>
                </>
              ) : (
                <>
                  <div className="p-4 rounded-xl bg-cyan-950/30 border border-cyan-500/30 text-[12.5px] text-slate-200">
                    El acceso y uso de la plataforma digital de <strong className="text-white">MRCA Solutions</strong> implica la aceptación de los presentes Términos y Condiciones de Uso bajo las leyes aplicables de los Estados Unidos Mexicanos.
                  </div>

                  <section className="space-y-1.5">
                    <h3 className="font-['Space_Grotesk'] text-[15px] font-bold text-white">
                      1. Uso de la Plataforma Digital
                    </h3>
                    <p>
                      El usuario se compromete a emplear la plataforma, el asistente de cotización, los portales y los canales de soporte de manera lícita y de buena fe, absteniéndose de realizar accesos no autorizados, pruebas de intrusión sin autorización contractual previa o cualquier actividad que afecte la disponibilidad del servicio.
                    </p>
                  </section>

                  <section className="space-y-1.5">
                    <h3 className="font-['Space_Grotesk'] text-[15px] font-bold text-white">
                      2. Proyectos de Ingeniería B2B y Obra por Encargo
                    </h3>
                    <p>
                      Las cotizaciones generadas mediante el asistente digital tienen carácter referencial. Todo proyecto de desarrollo de software, auditoría o infraestructura se formaliza mediante un{' '}
                      <strong className="text-white">Contrato Marco de Servicios</strong> que establece alcances, tiempos, niveles de servicio (SLA), esquemas de anticipo y la figura jurídica de{' '}
                      <strong className="text-white">Obra por Encargo</strong> conforme a los artículos 83 y 84 de la Ley Federal del Derecho de Autor (LFDA), cediendo al cliente los derechos patrimoniales sobre el desarrollo a la medida una vez liquidada la contraprestación pactada.
                    </p>
                  </section>

                  <section className="space-y-1.5">
                    <h3 className="font-['Space_Grotesk'] text-[15px] font-bold text-white">
                      3. Propiedad Intelectual de MRCA Solutions
                    </h3>
                    <p>
                      El diseño visual, marca, logotipos, arquitectura de la plataforma, código base, textos, manuales corporativos y herramientas propias exhibidas en este sitio son propiedad exclusiva de MRCA Solutions y se encuentran protegidos por la legislación vigente de propiedad intelectual e industrial.
                    </p>
                  </section>

                  <section className="space-y-1.5">
                    <h3 className="font-['Space_Grotesk'] text-[15px] font-bold text-white">
                      4. Uso Autorizado de Paquetes de Software Descargables
                    </h3>
                    <p>
                      Los paquetes de software listos para instalar (incluyendo sistemas de Punto de Venta, módulos `.ZIP` y manuales técnicos disponibles exclusivamente dentro del Portal de Clientes B2B) se licencian únicamente para el uso operativo interno del cliente autorizado. Queda estrictamente prohibida su reventa, redistribución a terceros, descompilación o publicación sin autorización escrita de MRCA Solutions.
                    </p>
                  </section>

                  <section className="space-y-1.5">
                    <h3 className="font-['Space_Grotesk'] text-[15px] font-bold text-white">
                      5. Contacto y Jurisdicción
                    </h3>
                    <p>
                      Para aclaraciones sobre estos términos, escríbenos a{' '}
                      <a
                        href="mailto:solutionsmrca83@gmail.com"
                        className="text-cyan-300 underline hover:text-cyan-200 font-['JetBrains_Mono'] text-[12px]"
                      >
                        solutionsmrca83@gmail.com
                      </a>
                      . Toda controversia se somete a las leyes federales y tribunales competentes de la Ciudad de México.
                    </p>
                  </section>
                </>
              )}
            </div>

            {/* PIE DE MODAL */}
            <div className="px-5 py-3.5 bg-slate-950/90 border-t border-cyan-500/20 flex flex-wrap items-center justify-between gap-3 shrink-0">
              <span className="font-['JetBrains_Mono'] text-[10.5px] text-slate-400">
                MRCA Solutions • Actualización vigente 2026
              </span>
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-400 text-slate-950 font-['Space_Grotesk'] text-[12.5px] font-bold hover:shadow-[0_0_20px_rgba(6,182,212,0.8)] hover:scale-105 transition-all cursor-pointer"
              >
                Entendido y Cerrar
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default LegalModals;
