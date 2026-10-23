import React from 'react';
import { LegalLayout } from '../../components/layouts/LegalLayout';

interface SLAProps {
  onBack?: () => void;
  onNavigate?: (route: string) => void;
}

export const SLA: React.FC<SLAProps> = ({ onBack, onNavigate }) => {
  return (
    <LegalLayout
      title="Acuerdo de Nivel de Servicio (SLA)"
      subtitle="Compromisos de Disponibilidad de Infraestructura, Conectividad de Red y Políticas de Créditos de Servicio"
      docCode="DOC-SLA-999-2026"
      onBack={onBack}
      onNavigate={onNavigate}
    >
      <section className="space-y-4">
        <h2 className="text-xl font-bold font-['Space_Grotesk'] text-cyan-400 border-b border-cyan-900/40 pb-2">
          1. Alcance y Compromiso de Disponibilidad (99.9% Uptime)
        </h2>
        <p>
          <strong>MRCA Solutions</strong> asume frente a EL CLIENTE el compromiso contractual de suministrar una disponibilidad mensual 
          mínima del <strong>99.9% (noventa y nueve punto nueve por ciento)</strong> sobre la infraestructura de producción, compuertas de enlace API, 
          servicios de autenticación Zero-Trust y nodos de cómputo dedicados.
        </p>
        <p>
          El porcentaje de disponibilidad mensual se computará con base en la siguiente fórmula matemática:
        </p>
        <div className="p-3 rounded-xl bg-[#060d24] border border-cyan-800/40 font-['JetBrains_Mono'] text-[13px] text-cyan-300 text-center">
          Disponibilidad (%) = ((Minutos Totales del Mes - Minutos de Indisponibilidad no Programada) / Minutos Totales del Mes) * 100
        </div>
      </section>

      {/* EXCLUSIONES DEL SLA */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold font-['Space_Grotesk'] text-cyan-400 border-b border-cyan-900/40 pb-2">
          2. Exclusiones de la Métrica de Indisponibilidad
        </h2>
        <p>
          No se considerará tiempo de inactividad (Downtime) y quedará expresamente exento del cómputo de SLA cualquier interrupción originada por:
        </p>
        <ul className="list-disc pl-5 space-y-2 text-slate-300">
          <li>
            <strong>Ventanas de Mantenimiento Programado:</strong> Actualizaciones críticas de parches de seguridad o mejoras de firmware 
            notificadas por correo corporativo con al menos <strong>cuarenta y ocho (48) horas de anticipación</strong> y ejecutadas en horarios 
            de bajo impacto operativo (02:00 a 05:00 hrs UTC-6).
          </li>
          <li>
            <strong>Fallas de Conectividad del ISP de EL CLIENTE:</strong> Interrupciones en el enlace de red local, ruteadores o proveedores de 
            telecomunicaciones contratados directamente por EL CLIENTE.
          </li>
          <li>
            <strong>Fuerza Mayor y Eventos Fortuitos:</strong> Actos de autoridad gubernamental, catástrofes naturales, o interrupciones masivas en los 
            cables submarinos o proveedores troncales de nube pública fuera del control razonable de LA COMPAÑÍA.
          </li>
          <li>
            <strong>Ataques DDoS Masivos No Mitigados:</strong> Ataques volumétricos que superen los umbrales estándar acordados en el plan contratado.
          </li>
        </ul>
      </section>

      {/* CRITICAL CLAUSE: COMPENSACIONES SOLO EN CRÉDITOS DE SERVICIO */}
      <section className="space-y-4 p-5 rounded-2xl bg-cyan-950/20 border border-cyan-500/30">
        <div className="flex items-center gap-2 text-cyan-400">
          <span className="material-symbols-outlined text-[22px]">payments</span>
          <h2 className="text-xl font-bold font-['Space_Grotesk'] text-cyan-400">
            3. Compensaciones Exclusivas: Créditos de Servicio (Service Credits)
          </h2>
        </div>
        <div className="p-4 rounded-xl bg-red-950/20 border border-red-500/30 text-[13px] text-red-200">
          <strong>CLÁUSULA RESTRICTIVA DE COMPENSACIÓN:</strong> Si la disponibilidad mensual efectiva cae por debajo del 99.9%, la 
          única y exclusiva compensación a favor de EL CLIENTE consistirá en el otorgamiento de <strong>Créditos de Servicio (Service Credits)</strong> aplicables 
          al ciclo de facturación subsecuente. <strong>Bajo ningún concepto se realizarán reembolsos en dinero en efectivo, transferencias bancarias 
          ni cheques de caja.</strong>
        </div>

        <p className="font-semibold text-slate-200 pt-2">
          Tabla Escalonada de Créditos de Servicio:
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px] font-['JetBrains_Mono'] border-collapse">
            <thead>
              <tr className="border-b border-cyan-900 bg-[#060d24] text-cyan-400">
                <th className="py-2.5 px-4">Disponibilidad Mensual Real</th>
                <th className="py-2.5 px-4">Crédito de Servicio Otorgado</th>
                <th className="py-2.5 px-4">Método de Aplicación</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cyan-900/30 text-slate-300">
              <tr>
                <td className="py-2.5 px-4 text-cyan-300">&gt;= 99.0% y &lt; 99.9%</td>
                <td className="py-2.5 px-4 font-bold text-[#00fe66]">10% de la cuota mensual</td>
                <td className="py-2.5 px-4">Deducción en próxima factura</td>
              </tr>
              <tr>
                <td className="py-2.5 px-4 text-cyan-300">&gt;= 95.0% y &lt; 99.0%</td>
                <td className="py-2.5 px-4 font-bold text-[#00fe66]">25% de la cuota mensual</td>
                <td className="py-2.5 px-4">Deducción en próxima factura</td>
              </tr>
              <tr>
                <td className="py-2.5 px-4 text-cyan-300">&lt; 95.0%</td>
                <td className="py-2.5 px-4 font-bold text-[#00fe66]">50% de la cuota mensual</td>
                <td className="py-2.5 px-4">Deducción en próxima factura</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* PROCEDIMIENTO DE RECLAMACIÓN */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold font-['Space_Grotesk'] text-cyan-400 border-b border-cyan-900/40 pb-2">
          4. Procedimiento de Solicitud de Crédito de Servicio
        </h2>
        <p>
          Para hacer efectivo el reclamo de Créditos de Servicio, EL CLIENTE deberá someter un ticket de soporte de grado corporativo 
          a través de la mesa de ayuda o enviando correo a <code className="text-cyan-400 bg-cyan-950/80 px-2 py-0.5 rounded">soporte@mcrasolutions.com</code> dentro 
          de los <strong>quince (15) días naturales</strong> posteriores al término del mes en el que ocurrió el incidente, adjuntando la bitácora 
          técnica de desconexión.
        </p>
      </section>
    </LegalLayout>
  );
};

export default SLA;
