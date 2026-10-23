import React from 'react';
import { LegalLayout } from '../../components/layouts/LegalLayout';

interface PrivacyProps {
  onBack?: () => void;
  onNavigate?: (route: string) => void;
}

export const PrivacyPolicy: React.FC<PrivacyProps> = ({ onBack, onNavigate }) => {
  return (
    <LegalLayout
      title="Aviso de Privacidad Integral"
      subtitle="Conformidad con la Ley Federal de Protección de Datos Personales en Posesión de los Particulares (LFPDPPP)"
      docCode="DOC-PRIV-2026-MX"
      onBack={onBack}
      onNavigate={onNavigate}
    >
      <section className="space-y-4">
        <h2 className="text-xl font-bold font-['Space_Grotesk'] text-cyan-400 border-b border-cyan-900/40 pb-2">
          1. Identidad y Domicilio del Responsable
        </h2>
        <p>
          En estricto apego y cumplimiento a la <strong>Ley Federal de Protección de Datos Personales en Posesión de los Particulares (LFPDPPP)</strong>, 
          su Reglamento y los Lineamientos del Aviso de Privacidad publicados en el Diario Oficial de la Federación, 
          <strong>MRCA Solutions</strong> (en adelante, "EL RESPONSABLE"), con domicilio fiscal corporativo en la Ciudad de México, México, 
          manifiesta ser el responsable del tratamiento legítimo, controlado e informado de los datos personales y corporativos recabados a través 
          de su plataforma de ingeniería y ciberseguridad.
        </p>
      </section>

      {/* ZERO TRUST ARCHITECTURE & TELEMETRY */}
      <section className="space-y-4 p-5 rounded-2xl bg-cyan-950/20 border border-cyan-500/30">
        <div className="flex items-center gap-2 text-cyan-400">
          <span className="material-symbols-outlined text-[22px]">shield_lock</span>
          <h2 className="text-xl font-bold font-['Space_Grotesk'] text-cyan-400">
            2. Principios de Seguridad y Arquitectura Zero-Trust
          </h2>
        </div>
        <p>
          EL RESPONSABLE opera bajo el paradigma estricto de <strong>Seguridad Zero-Trust ("Nunca Confiar, Siempre Verificar")</strong>. 
          Todos los flujos de información procesados por la infraestructura están sujetos a los más altos estándares criptográficos de la industria:
        </p>
        <ul className="list-disc pl-5 space-y-2 text-slate-300">
          <li>
            <strong>Cifrado en Tránsito y en Reposo:</strong> Canales cifrados mediante protocolo TLS 1.3 con Perfect Forward Secrecy y almacenamiento 
            bajo cifrado de grado militar AES-256 o ChaCha20-Poly1305.
          </li>
          <li>
            <strong>Telemetría Criptográfica Anónima:</strong> Los registros operacionales, métricas de rendimiento y firmas de integridad se procesan 
            como identificadores criptográficos irreversibles (hashes SHA-256) disociados de la identidad del usuario final, empleándose únicamente 
            para la resiliencia del cluster y mitigación de ataques distribuidos.
          </li>
          <li>
            <strong>Aislamiento de Entornos (Hardware Enclaves):</strong> Los secretos, llaves de firma digital y certificados operan dentro de 
            módulos de seguridad de hardware (HSM) sin exposición a operadores humanos.
          </li>
        </ul>
      </section>

      {/* ZERO COOKIES POLICY */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold font-['Space_Grotesk'] text-cyan-400 border-b border-cyan-900/40 pb-2">
          3. Política de Cero Rastreadores (Zero Third-Party Cookies)
        </h2>
        <p>
          EL RESPONSABLE mantiene una política inquebrantable de privacidad digital: <strong>no utilizamos cookies de rastreo de terceros, ni balizas web 
          (web beacons), ni píxeles de retargeting publicitario</strong>.
        </p>
        <p>
          Las únicas cookies o elementos de almacenamiento local (`sessionStorage` / `localStorage`) empleados por la plataforma son estrictamente 
          técnicos y esenciales para:
        </p>
        <ul className="list-disc pl-5 space-y-1 text-slate-300">
          <li>Mantener la sesión autenticada con Supabase Auth de forma cifrada.</li>
          <li>Controlar la renderización del preloader de seguridad en cada sesión.</li>
          <li>Garantizar la protección contra ataques Cross-Site Request Forgery (CSRF).</li>
        </ul>
        <p className="text-[13px] text-cyan-300/80">
          Bajo ninguna circunstancia comercializamos, transferimos o monetizamos bases de datos con anunciantes ni terceros intermediarios.
        </p>
      </section>

      {/* ARCO RIGHTS */}
      <section className="space-y-4 p-5 rounded-2xl bg-[#060d24] border border-cyan-900/60">
        <div className="flex items-center gap-2 text-cyan-400">
          <span className="material-symbols-outlined text-[22px]">fingerprint</span>
          <h2 className="text-xl font-bold font-['Space_Grotesk'] text-cyan-400">
            4. Procedimiento para el Ejercicio de Derechos ARCO
          </h2>
        </div>
        <p>
          Conforme a los Artículos 22 y siguientes de la LFPDPPP, todo titular o su representante legal debidamente acreditado tiene derecho 
          a ejercer sus derechos de <strong>Acceso, Rectificación, Cancelación y Oposición (Derechos ARCO)</strong> respecto de los datos personales 
          que obren en posesión de EL RESPONSABLE.
        </p>
        <div className="space-y-2 text-[13px]">
          <p className="font-semibold text-slate-200">Requisitos para la Solicitud:</p>
          <ol className="list-decimal pl-5 space-y-1 text-slate-300">
            <li>Nombre del titular y domicilio o correo electrónico para comunicar la respuesta.</li>
            <li>Documentos oficiales que acrediten la identidad o representación legal (INE, Pasaporte o Poder Notarial).</li>
            <li>Descripción clara y precisa de los datos personales sobre los cuales se busca ejercer alguno de los derechos ARCO.</li>
            <li>Cualquier elemento que facilite la localización de los datos en nuestros registros criptográficos.</li>
          </ol>
        </div>
        <p className="text-[13px] text-slate-300">
          <strong>Canal Oficial de Atención:</strong> La solicitud deberá dirigirse al Departamento de Protección de Datos Personales vía correo 
          electrónico firmado digitalmente a: <code className="text-cyan-400 bg-cyan-950/80 px-2 py-0.5 rounded">privacidad@mcrasolutions.com</code>.
        </p>
        <p className="text-[12px] text-slate-400">
          <strong>Plazo de Respuesta:</strong> EL RESPONSABLE dará respuesta en un plazo no mayor a <strong>veinte (20) días hábiles</strong> contados 
          desde la fecha en que se recibió la solicitud, notificando la resolución favorable o improcedencia a través del medio de contacto acordado.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold font-['Space_Grotesk'] text-cyan-400 border-b border-cyan-900/40 pb-2">
          5. Modificaciones al Aviso de Privacidad
        </h2>
        <p>
          EL RESPONSABLE se reserva el derecho de efectuar en cualquier momento modificaciones o actualizaciones al presente Aviso de Privacidad 
          para la atención de novedades legislativas, políticas internas de ciberseguridad o nuevos requerimientos para la prestación de nuestros servicios. 
          Cualquier cambio sustancial será publicado directamente en el portal con su respectiva estampa de tiempo criptográfica.
        </p>
      </section>
    </LegalLayout>
  );
};

export default PrivacyPolicy;
