import React from 'react';
import { LegalLayout } from '../../components/layouts/LegalLayout';

interface TermsProps {
  onBack?: () => void;
  onNavigate?: (route: string) => void;
}

export const TermsAndConditions: React.FC<TermsProps> = ({ onBack, onNavigate }) => {
  return (
    <LegalLayout
      title="Términos y Condiciones de Servicio B2B"
      subtitle="Contrato Marco de Suscripción Tecnológica, Licenciamiento y Servicios de Ciberseguridad"
      docCode="DOC-TC-2026-B2B"
      onBack={onBack}
      onNavigate={onNavigate}
    >
      <section className="space-y-4">
        <h2 className="text-xl font-bold font-['Space_Grotesk'] text-cyan-400 border-b border-cyan-900/40 pb-2">
          1. Declaraciones Generales y Ámbito de Aplicación
        </h2>
        <p>
          El presente Contrato Marco de Términos y Condiciones regula el acceso, licenciamiento y uso de la plataforma 
          empresarial provista por <strong>MRCA Solutions</strong> (en adelante, "LA COMPAÑÍA"), constituida 
          conforme a las leyes mercantiles de los Estados Unidos Mexicanos, aplicable a cualquier persona moral o física con 
          actividad empresarial (en adelante, "EL CLIENTE") que contrate servicios de ingeniería de software, arquitectura en la nube, 
          auditoría criptográfica o infraestructura Zero-Trust.
        </p>
        <p>
          Al acceder, autenticarse mediante credenciales criptográficas, firmas digitales o desplegar instancias de software de LA COMPAÑÍA, 
          EL CLIENTE declara aceptar incondicionalmente estos Términos y Condiciones bajo la legislación aplicable en los Estados Unidos Mexicanos, 
          incluyendo el Código de Comercio y el Código Civil Federal.
        </p>
      </section>

      {/* CRITICAL CLAUSE 1: LIMITACIÓN DE RESPONSABILIDAD */}
      <section className="space-y-4 p-5 rounded-2xl bg-cyan-950/20 border border-cyan-500/30">
        <div className="flex items-center gap-2 text-cyan-400">
          <span translate="no" className="notranslate material-symbols-outlined text-[22px]">gavel</span>
          <h2 className="text-xl font-bold font-['Space_Grotesk'] text-cyan-400">
            2. Limitación de Responsabilidad y Exclusiones de Ciberseguridad
          </h2>
        </div>
        <p className="font-semibold text-slate-200">
          LA COMPAÑÍA no asume responsabilidad alguna por pérdidas operativas, filtraciones de datos, brechas de seguridad o daños 
          consecuenciales originados directa o indirectamente por negligencia, descuido, omisión o mala praxis imputable a EL CLIENTE, 
          sus administradores o colaboradores.
        </p>
        <p>
          Sin perjuicio de lo anterior, quedan expresamente excluidas de la responsabilidad de LA COMPAÑÍA las siguientes hipótesis:
        </p>
        <ul className="list-disc pl-5 space-y-2 text-slate-300">
          <li>
            <strong>Compromiso de Credenciales y Llaves de API:</strong> Filtración, robo o divulgación de contraseñas, tokens de sesión, 
            claves maestras o llaves de API (API Keys) generadas en el portal de clientes por falta de resguardo interno o almacenamiento en texto plano.
          </li>
          <li>
            <strong>Ingeniería Social y Phishing Interno:</strong> Accesos no autorizados derivados de ataques de suplantación dirigidos al personal 
            o directivos de EL CLIENTE.
          </li>
          <li>
            <strong>Desactivación de Políticas de Seguridad Obligatorias:</strong> Deshabilitación voluntaria o negligente de autenticación multifactor (MFA), 
            políticas de contraseñas robustas o restricciones de acceso por lista blanca de IPs.
          </li>
          <li>
            <strong>Modificaciones No Autorizadas de Infraestructura:</strong> Alteración de scripts, configuraciones de red, puertos de firewall o código 
            sin la previa supervisión escrita del equipo de ciberseguridad de LA COMPAÑÍA.
          </li>
        </ul>
        <p className="text-[13px] text-cyan-300/80 bg-[#0A1128]/60 p-3 rounded-lg border border-cyan-800/40">
          En cualquier circunstancia, la responsabilidad indemnizatoria total de LA COMPAÑÍA quedará estrictamente limitada al monto efectivamente pagado 
          por EL CLIENTE durante el mes inmediato anterior al suceso, excluyendo expresamente lucro cesante, daño reputacional o perjuicios punitivos.
        </p>
      </section>

      {/* CRITICAL CLAUSE 2: PROPIEDAD INTELECTUAL */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold font-['Space_Grotesk'] text-cyan-400 border-b border-cyan-900/40 pb-2">
          3. Propiedad Intelectual y Titularidad de Código
        </h2>
        <p>
          Todos los derechos de propiedad industrial, derechos de autor, secretos industriales y patentes sobre la plataforma MRCA Solutions, 
          incluyendo sin limitación: código fuente, código objeto, microservicios, algoritmos de consenso, librerías criptográficas, arquitecturas de software, 
          marcas registradas y diseños visuales, son y permanecerán bajo la titularidad y dominio exclusivo de <strong>MRCA Solutions</strong>.
        </p>
        <p>
          La contratación de los servicios otorga a EL CLIENTE única y exclusivamente una <strong>licencia de uso de software B2B limitada, revocable, 
          no exclusiva e intransferible</strong> durante la vigencia de la suscripción contratada. Queda prohibida la reproducción, duplicación, 
          sublicenciamiento o enajenación de cualquier activo tecnológico propiedad de LA COMPAÑÍA.
        </p>
      </section>

      {/* CRITICAL CLAUSE 3: POLÍTICAS DE PAGO Y FACTURACIÓN */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold font-['Space_Grotesk'] text-cyan-400 border-b border-cyan-900/40 pb-2">
          4. Políticas de Pago, Transferencias SPEI y Cláusula Estricta de No Reembolsos
        </h2>
        <p>
          Los pagos por los servicios contratados se procesarán mediante los canales autorizados por LA COMPAÑÍA:
        </p>
        <ul className="list-disc pl-5 space-y-2 text-slate-300">
          <li>
            <strong>Transferencia Electrónica Interbancaria (SPEI / Banxico):</strong> Acreditación en moneda nacional (MXN) a las cuentas 
            corporativas designadas (incluyendo pasarelas bancarias y entidades autorizadas como Nu México o Stripe Escrow Dual).
          </li>
          <li>
            <strong>Facturación Fiscal Electrónica (CFDI 4.0):</strong> La emisión de comprobantes fiscales se realizará dentro de los plazos 
            establecidos por el Servicio de Administración Tributaria (SAT), debiendo EL CLIENTE proporcionar Constancia de Situación Fiscal actualizada.
          </li>
        </ul>
        <div className="p-4 rounded-xl bg-red-950/20 border border-red-500/30 space-y-2">
          <p className="font-bold text-red-300">
            POLÍTICA ESTRICTA DE NO REEMBOLSOS (NO REFUND POLICY):
          </p>
          <p className="text-[13px] text-slate-300">
            Debido a la naturaleza de los servicios de ingeniería de alta precisión, aprovisionamiento dedicado de microservicios en la nube, 
            auditorías criptográficas y asignación de capacidad de cómputo en tiempo real, <strong>todos los cobros y dispersiones son finales e irrevocables</strong>. 
            Bajo ninguna circunstancia se emitirán reembolsos monetarios en efectivo o transferencias inversas una vez iniciado el aprovisionamiento técnico.
          </p>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold font-['Space_Grotesk'] text-cyan-400 border-b border-cyan-900/40 pb-2">
          5. Legislación y Jurisdicción Aplicable
        </h2>
        <p>
          Para la interpretación y cumplimiento de este contrato, las partes se someten expresamente a las leyes federales de los Estados Unidos Mexicanos 
          y a la jurisdicción de los tribunales competentes de la <strong>Ciudad de México</strong>, renunciando de manera expresa e irrevocable a cualquier 
          otro fuero o tribunal que pudiera corresponderles por razón de sus domicilios presentes o futuros.
        </p>
      </section>
    </LegalLayout>
  );
};

export default TermsAndConditions;
