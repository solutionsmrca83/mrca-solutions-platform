import React from 'react';
import { LegalLayout } from '../../components/layouts/LegalLayout';

interface AUPProps {
  onBack?: () => void;
  onNavigate?: (route: string) => void;
}

export const AcceptableUse: React.FC<AUPProps> = ({ onBack, onNavigate }) => {
  return (
    <LegalLayout
      title="Política de Uso Aceptable (AUP)"
      subtitle="Directrices de Seguridad Operativa, Conducta Prohibida y Cero Tolerancia a Vulneraciones"
      docCode="DOC-AUP-SEC-2026"
      onBack={onBack}
      onNavigate={onNavigate}
    >
      <section className="space-y-4">
        <h2 className="text-xl font-bold font-['Space_Grotesk'] text-cyan-400 border-b border-cyan-900/40 pb-2">
          1. Propósito y Principio de Integridad
        </h2>
        <p>
          Esta Política de Uso Aceptable (AUP) define las directrices y restricciones operativas que regulan el empleo de la 
          infraestructura, compuertas de red, microservicios, APIs y enclaves de cómputo provistos por <strong>MRCA Solutions</strong>. 
          Su objetivo primordial es blindar la seguridad colectiva de nuestros clientes B2B, mantener la resiliencia sistémica y 
          prevenir cualquier aprovechamiento ilícito de nuestros recursos tecnológicos.
        </p>
      </section>

      {/* STRICTLY PROHIBITED ACTIVITIES */}
      <section className="space-y-4 p-5 rounded-2xl bg-red-950/20 border border-red-500/30">
        <div className="flex items-center gap-2 text-red-400">
          <span className="material-symbols-outlined text-[24px]">block</span>
          <h2 className="text-xl font-bold font-['Space_Grotesk'] text-red-300">
            2. Actividades Estrictamente Prohibidas
          </h2>
        </div>
        <p className="font-semibold text-slate-200">
          Queda terminantemente prohibido a EL CLIENTE, a sus usuarios autorizados y a cualquier tercero actuar o colaborar en:
        </p>
        <div className="space-y-4 pt-2">
          <div className="p-3.5 rounded-xl bg-[#060d24] border border-red-900/40">
            <h3 className="font-bold text-cyan-300 font-['Space_Grotesk'] text-[15px] mb-1">
              A. Ingeniería Inversa y Descompilación de Software
            </h3>
            <p className="text-[13px] text-slate-300">
              Desensamblar, descompilar, realizar ingeniería inversa, clonar, interceptar llamadas RPC privadas o intentar derivar 
              el código fuente, algoritmos propietarios o protocolos internos de MRCA Solutions.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-[#060d24] border border-red-900/40">
            <h3 className="font-bold text-cyan-300 font-['Space_Grotesk'] text-[15px] mb-1">
              B. Alojamiento o Distribución de Malware y Código Malicioso
            </h3>
            <p className="text-[13px] text-slate-300">
              Transmitir, almacenar, distribuir o ejecutar virus, ransomware, troyanos, gusanos, keyloggers, scripts de explotación ("exploits") 
              o cualquier código diseñado para vulnerar, alterar o destruir sistemas de información propios o de terceros.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-[#060d24] border border-red-900/40">
            <h3 className="font-bold text-cyan-300 font-['Space_Grotesk'] text-[15px] mb-1">
              C. Pruebas de Penetración (Pentesting) y Escaneos No Autorizados
            </h3>
            <p className="text-[13px] text-slate-300">
              Efectuar pruebas de estrés volumétrico (DDoS/DoS), inyecciones de código, escaneos de puertos (port scanning), fuzzing 
              o análisis de vulnerabilidades sobre los dominios, servidores y compuertas de MRCA Solutions sin un acuerdo formal y expreso de 
              auditoría firmado por el Director de Seguridad (CISO) de LA COMPAÑÍA.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-[#060d24] border border-red-900/40">
            <h3 className="font-bold text-cyan-300 font-['Space_Grotesk'] text-[15px] mb-1">
              D. Minería de Criptomonedas (Crypto-Mining) y Abuso de Cómputo
            </h3>
            <p className="text-[13px] text-slate-300">
              Utilizar los procesadores, clusters de GPUs o contenedores en la nube provistos para ejecutar algoritmos de minería de 
              criptoactivos (Proof-of-Work, hashing distribuido) o cualquier carga de trabajo intensiva no contemplada en el acuerdo comercial.
            </p>
          </div>
        </div>
      </section>

      {/* CONSEQUENCES AND PENALTIES */}
      <section className="space-y-4 p-5 rounded-2xl bg-cyan-950/20 border border-cyan-500/30">
        <div className="flex items-center gap-2 text-cyan-400">
          <span className="material-symbols-outlined text-[22px]">warning</span>
          <h2 className="text-xl font-bold font-['Space_Grotesk'] text-cyan-400">
            3. Consecuencias por Infracción: Terminación Inmediata
          </h2>
        </div>
        <p className="text-slate-200">
          Cualquier vulneración o tentativa de vulneración comprobada a las directrices de esta Política facultará a MRCA Solutions para:
        </p>
        <ul className="list-disc pl-5 space-y-2 text-slate-300">
          <li>
            <strong>Terminación Unilateral e Inmediata:</strong> Cancelación fulminante de la cuenta corporativa, suspensión de accesos 
            y revocación irrevocable de certificados digitales y tokens de API.
          </li>
          <li>
            <strong>Pérdida Total de Fondos y Créditos:</strong> Inexistencia de derecho a reembolso, crédito de servicio o indemnización alguna.
          </li>
          <li>
            <strong>Acciones Penales y Civiles:</strong> Presentación formal de denuncia ante la Fiscalía General de la República (FGR) 
            y la Guardia Nacional (División Científica de Delitos Cibernéticos) bajo el Código Penal Federal en materia de acceso ilícito a sistemas y equipos de informática.
          </li>
        </ul>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold font-['Space_Grotesk'] text-cyan-400 border-b border-cyan-900/40 pb-2">
          4. Reporte de Incidentes de Seguridad
        </h2>
        <p>
          Cualquier indicio de actividad sospechosa o hallazgo de vulnerabilidad en modo de divulgación responsable (Responsible Disclosure) 
          deberá comunicarse de inmediato a nuestra guardia de seguridad 24/7 vía: <code className="text-cyan-400 bg-cyan-950/80 px-2 py-0.5 rounded">security@mcrasolutions.com</code>.
        </p>
      </section>
    </LegalLayout>
  );
};

export default AcceptableUse;
