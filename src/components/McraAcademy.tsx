import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  Network,
  Database,
  Code2,
  Cpu,
  GraduationCap,
  BookOpen,
  HelpCircle,
  FileCode,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  MessageCircle,
  Clock,
  Layers,
  ChevronDown,
} from 'lucide-react';
import { PricingCalculator, QuoteSummary } from './PricingCalculator';
import { AcademyTemplatesCatalog } from './AcademyTemplatesCatalog';
import { StudentLayout } from './layouts/StudentLayout';


interface ModularService {
  id: string;
  title: string;
  category: string;
  icon: React.ReactNode;
  badge: string;
  badgeColor: string;
  description: string;
  capabilities: string[];
  deliverables: string[];
  commonCourses: string;
}

const MODULAR_SERVICES: ModularService[] = [
  {
    id: 'networks',
    title: 'Topologías de Red (Packet Tracer / pfSense)',
    category: 'Redes & Conectividad',
    icon: <Network className="w-6 h-6 text-[#00e5ff]" />,
    badge: 'Packet Tracer & pfSense',
    badgeColor: 'border-[#00e5ff]/40 bg-[#00e5ff]/10 text-[#00e5ff]',
    description:
      'Diseño, configuración y validación de topologías complejas para materias de redes. Segmentación en subredes IPv4/IPv6, túneles VPN y reglas de firewall listas para presentar.',
    capabilities: [
      'Segmentación de VLANs y troncales 802.1Q',
      'Enrutamiento estático y dinámico (OSPF, RIP, EIGRP)',
      'Configuración de Servidores DHCP, DNS, HTTP y NTP en simulador',
      'Firewalls virtuales pfSense / OPNsense con NAT y reglas de filtrado',
    ],
    deliverables: [
      'Archivo de simulación .pkt 100% funcional y probado',
      'Tabla de direccionamiento IP y documentación de interfaces',
      'Capturas de pruebas de conectividad (ping, traceroute)',
    ],
    commonCourses: 'Redes de Computadoras, Conmutación y Enrutamiento, Seguridad en Redes',
  },
  {
    id: 'sql',
    title: 'Normalización y Diccionarios de Datos SQL',
    category: 'Bases de Datos & Persistencia',
    icon: <Database className="w-6 h-6 text-[#00fe66]" />,
    badge: 'SQL & Normalización 3FN',
    badgeColor: 'border-[#00fe66]/40 bg-[#00fe66]/10 text-[#00fe66]',
    description:
      'Modelado de bases de datos desde cero a partir de los requerimientos de tu proyecto. Estructuras normalizadas con integridad referencial y scripts listos para ejecutar.',
    capabilities: [
      'Diagramas Entidad-Relación (DER) en notación Chen / Crow Foot',
      'Normalización estricta de tablas (1FN, 2FN, 3FN y Boyce-Codd)',
      'Scripts DDL (CREATE TABLE, CONSTRAINTS, INDEXES) para PostgreSQL/MySQL',
      'Consultas avanzadas DML con JOINs, vistas, procedimientos y triggers',
    ],
    deliverables: [
      'Script .sql listo para importar sin errores de sintaxis',
      'Diccionario de datos formal en PDF con tipos y descripciones',
      'Diagrama conceptual y relacional en alta resolución',
    ],
    commonCourses: 'Fundamentos de Bases de Datos, Taller de Bases de Datos, Administración de BD',
  },
  {
    id: 'web',
    title: 'Desarrollo Web (React / Python)',
    category: 'Ingeniería de Software',
    icon: <Code2 className="w-6 h-6 text-[#00daf3]" />,
    badge: 'React, Next.js & Python',
    badgeColor: 'border-[#00daf3]/40 bg-[#00daf3]/10 text-[#00daf3]',
    description:
      'Aplicaciones web completas y modernas construidas con código limpio. Frontend interactivo y API REST en Python (FastAPI/Flask) o Node.js con autenticación funcional.',
    capabilities: [
      'Frontend responsivo con React, Vite o Next.js con Tailwind CSS',
      'Backend ligero con FastAPI, Flask o Express con endpoints RESTful',
      'Autenticación basada en sesiones o JWT con validación de roles',
      'Documentación interactiva de API con Swagger / OpenAPI / Postman',
    ],
    deliverables: [
      'Repositorio Git organizado con README e instrucciones paso a paso',
      'Colección de Postman exportada para pruebas en vivo',
      'Código 100% comentado con explicación de cada ruta y componente',
    ],
    commonCourses: 'Programación Web, Desarrollo de Aplicaciones, Ingeniería de Software',
  },
  {
    id: 'iot',
    title: 'Integración IoT (Microcontroladores ESP32)',
    category: 'Sistemas Embebidos & IoT',
    icon: <Cpu className="w-6 h-6 text-[#c084fc]" />,
    badge: 'ESP32, Sensores & MQTT',
    badgeColor: 'border-[#c084fc]/40 bg-[#c084fc]/10 text-[#c084fc]',
    description:
      'Prototipos electrónicos embebidos con microcontroladores ESP32, ESP8266 o Arduino. Lectura analógica/digital de sensores y transmisión telemétrica hacia dashboard en tiempo real.',
    capabilities: [
      'Lectura de sensores (DHT22, ultrasonido, MQ gases, corriente, RFID, GPS)',
      'Conexión Wi-Fi / Bluetooth BLE y reconexión automática resiliente',
      'Transmisión de telemetría vía MQTT / HTTP POST a brokers o dashboards web',
      'Control de actuadores (servomotores, relevadores, pantallas OLED/LCD)',
    ],
    deliverables: [
      'Código fuente en C++ (Arduino IDE/PlatformIO) o MicroPython',
      'Esquemático de conexiones claras en formato Fritzing / Diagrama de pines',
      'Guía paso a paso de calibración y pruebas físicas del circuito',
    ],
    commonCourses: 'Sistemas Embebidos, Internet de las Cosas (IoT), Instrumentación y Control',
  },
];

const FAQS = [
  {
    q: '¿Cómo me aseguro de que sabré responder si el profesor me pregunta?',
    a: 'Entregamos tu proyecto con dos pilares clave: 1) Todo el código está comentado pedagógicamente en español explicando qué hace cada función y variable; y 2) Te proporcionamos la "Guía de Defensa para el Profesor", un documento con las preguntas típicas de sínodo y cómo responderlas con fundamentos de ingeniería.',
  },
  {
    q: '¿Pueden adaptarse a los requerimientos específicos o rúbrica de mi profesor?',
    a: 'Sí, absolutamente. Al cotizar puedes enviarnos el PDF de la rúbrica o los lineamientos de tu facultad. Desarrollamos el proyecto siguiendo exactamente los criterios de evaluación para maximizar tu calificación.',
  },
  {
    q: '¿Qué pasa si mi profesor pide un cambio menor después de la primera revisión?',
    a: 'Todos nuestros proyectos incluyen garantía de ajustes por rúbrica. Si tu profesor solicita una modificación sobre los requerimientos pactados, la implementamos rápidamente sin costo adicional.',
  },
  {
    q: '¿Cómo funciona el pago del anticipo?',
    a: 'Para comenzar los trabajos se requiere un 50% de anticipo formalizado vía Stripe Payment Links (con tarjeta de débito, crédito o transferencia). El 50% restante se liquida una vez que te demostramos el funcionamiento completo del proyecto en video o llamada.',
  },
];

export const MrcaAcademy: React.FC = () => {
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((c) => (c === msg ? null : c));
    }, 3400);
  };

  const scrollToCalculator = () => {
    const el = document.getElementById('seccion-cotizador');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <StudentLayout
      onScrollToCalculator={scrollToCalculator}
      onNavigateHome={() => {
        window.location.hash = '';
        if (window.location.pathname !== '/') {
          window.history.pushState(null, '', '/');
        }
        window.dispatchEvent(new Event('popstate'));
      }}
    >
      {/* Main Content Container */}
      <div id="inicio" className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-8 sm:py-12 flex flex-col gap-12 sm:gap-16 relative z-10">
        {/* ==================================================================== */}
        {/* 1. HERO SECTION (Softer Educational Tone)                            */}
        {/* ==================================================================== */}
        <section className="flex flex-col items-center text-center gap-5 max-w-4xl mx-auto pt-4 sm:pt-8">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#121c3d] border border-[#00e5ff]/30 text-[#00daf3] font-['JetBrains_Mono'] text-[11px] font-semibold shadow-inner">
            <span className="w-2 h-2 rounded-full bg-[#00fe66] animate-pulse"></span>
            <span>INGENIERÍA APLICADA • ENTREGAS PARA MÉXICO Y LATAM</span>
          </div>

          <h1 className="font-['Space_Grotesk'] text-[32px] sm:text-[46px] md:text-[54px] font-bold text-[#ffffff] tracking-tight leading-[1.12]">
            MRCA Academy: <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00e5ff] via-[#9cf0ff] to-[#00fe66]">Prototipado y Arquitectura</span> para Estudiantes de Ingeniería
          </h1>

          <p className="font-['Inter'] text-[14px] sm:text-[17px] text-[#bac9cc] max-w-2xl leading-relaxed">
            Aceleramos tu proyecto final, integradora o residencia con arquitectura real, código limpio 100% comentado y la guía exacta para defenderlo con seguridad ante tus profesores.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3.5 pt-2">
            <button
              onClick={scrollToCalculator}
              className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-[#00e5ff] to-[#00fe66] hover:from-[#5affff] hover:to-[#5aff96] text-[#00363d] font-['Space_Grotesk'] text-[14px] font-bold uppercase tracking-wider transition-all shadow-[0_0_25px_rgba(0,229,255,0.4)] flex items-center gap-2"
            >
              <span>Calcular Presupuesto en Vivo</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <a
              href="#catalogo-plantillas"
              className="px-6 py-3.5 rounded-2xl bg-[#00fe66]/15 hover:bg-[#00fe66]/25 text-[#00fe66] border border-[#00fe66]/40 font-['Space_Grotesk'] text-[14px] font-semibold transition-all flex items-center gap-2 shadow-[0_0_15px_rgba(0,254,102,0.2)]"
            >
              <Sparkles className="w-4 h-4 text-[#00fe66]" />
              <span>Catálogo de Plantillas Base</span>
            </a>

            <a
              href="#servicios"
              className="px-6 py-3.5 rounded-2xl bg-[#0c1533] hover:bg-[#14204c] text-[#dce1ff] border border-[#23315a] font-['Space_Grotesk'] text-[14px] font-semibold transition-all flex items-center gap-2"
            >
              <Layers className="w-4 h-4 text-[#00daf3]" />
              <span>Ver Servicios Modulares</span>
            </a>
          </div>

          {/* Social Proof Quick Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-6 pt-6 w-full max-w-3xl">
            <div className="p-3.5 rounded-2xl bg-[#0c1533]/80 border border-[#1c274a] flex flex-col items-center">
              <span className="font-['Space_Grotesk'] text-[24px] sm:text-[28px] font-bold text-[#00e5ff]">
                +140
              </span>
              <span className="font-['JetBrains_Mono'] text-[10px] text-[#bac9cc] uppercase mt-0.5">
                Proyectos Aprobados
              </span>
            </div>
            <div className="p-3.5 rounded-2xl bg-[#0c1533]/80 border border-[#1c274a] flex flex-col items-center">
              <span className="font-['Space_Grotesk'] text-[24px] sm:text-[28px] font-bold text-[#00fe66]">
                100%
              </span>
              <span className="font-['JetBrains_Mono'] text-[10px] text-[#bac9cc] uppercase mt-0.5">
                Código Comentado
              </span>
            </div>
            <div className="p-3.5 rounded-2xl bg-[#0c1533]/80 border border-[#1c274a] flex flex-col items-center">
              <span className="font-['Space_Grotesk'] text-[24px] sm:text-[28px] font-bold text-[#00daf3]">
                48h - 5d
              </span>
              <span className="font-['JetBrains_Mono'] text-[10px] text-[#bac9cc] uppercase mt-0.5">
                Tiempo de Entrega
              </span>
            </div>
            <div className="p-3.5 rounded-2xl bg-[#0c1533]/80 border border-[#1c274a] flex flex-col items-center">
              <span className="font-['Space_Grotesk'] text-[24px] sm:text-[28px] font-bold text-[#c084fc]">
                9.8 / 10
              </span>
              <span className="font-['JetBrains_Mono'] text-[10px] text-[#bac9cc] uppercase mt-0.5">
                Calificación Promedio
              </span>
            </div>
          </div>
        </section>

        {/* ==================================================================== */}
        {/* 2. SERVICIOS MODULARES (Glassmorphic Grid)                            */}
        {/* ==================================================================== */}
        <section id="servicios" className="flex flex-col gap-8 pt-4">
          <div className="flex flex-col items-center text-center gap-2 max-w-2xl mx-auto">
            <span className="font-['JetBrains_Mono'] text-[11px] text-[#00fe66] uppercase tracking-widest font-bold">
              CATÁLOGO DE INGENIERÍA ACADÉMICA
            </span>
            <h2 className="font-['Space_Grotesk'] text-[26px] sm:text-[34px] font-bold text-[#ffffff]">
              Servicios Modulares por Especialidad
            </h2>
            <p className="font-['Inter'] text-[13px] sm:text-[14px] text-[#bac9cc]">
              Seleccionamos tecnologías estándar de la industria que cumplen con los temarios de las principales facultades e institutos tecnológicos.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {MODULAR_SERVICES.map((serv) => (
              <div
                key={serv.id}
                className="rounded-3xl bg-[#0c1533]/70 border border-[#1c274a] hover:border-[#00e5ff]/50 p-6 sm:p-7 backdrop-blur-xl shadow-lg transition-all flex flex-col justify-between gap-6 group hover:shadow-[0_10px_40px_rgba(0,229,255,0.12)]"
              >
                <div className="flex flex-col gap-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-[#121c3d] border border-[#23315a] group-hover:border-[#00e5ff]/40 flex items-center justify-center transition-colors">
                      {serv.icon}
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-[10px] font-['JetBrains_Mono'] font-bold border tracking-wider uppercase ${serv.badgeColor}`}
                    >
                      {serv.badge}
                    </span>
                  </div>

                  <div>
                    <span className="font-['JetBrains_Mono'] text-[10px] text-[#849396] uppercase tracking-wider block">
                      {serv.category}
                    </span>
                    <h3 className="font-['Space_Grotesk'] text-[20px] font-bold text-[#dce1ff] mt-1 group-hover:text-[#00e5ff] transition-colors">
                      {serv.title}
                    </h3>
                    <p className="font-['Inter'] text-[13px] text-[#bac9cc] mt-2 leading-relaxed">
                      {serv.description}
                    </p>
                  </div>

                  {/* Capabilities List */}
                  <div className="flex flex-col gap-1.5 pt-2">
                    <span className="text-[11px] font-['JetBrains_Mono'] uppercase tracking-wider text-[#00daf3] font-semibold">
                      Alcance del módulo:
                    </span>
                    <ul className="flex flex-col gap-1 text-[12px] font-['Inter'] text-[#bac9cc]">
                      {serv.capabilities.map((c, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#00fe66] shrink-0 mt-0.5" />
                          <span>{c}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Deliverables Box */}
                  <div className="p-3.5 rounded-2xl bg-[#060c20] border border-[#1c274a] flex flex-col gap-1">
                    <span className="text-[10px] font-['JetBrains_Mono'] uppercase tracking-wider text-[#00fe66] font-bold">
                      Entregables incluidos:
                    </span>
                    <ul className="text-[11px] font-['Inter'] text-[#dce1ff] flex flex-col gap-0.5">
                      {serv.deliverables.map((d, dIdx) => (
                        <li key={dIdx} className="flex items-center gap-1.5">
                          <span className="text-[#00e5ff]">•</span>
                          <span>{d}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="pt-2 border-t border-[#1c274a] flex items-center justify-between">
                  <span className="font-['JetBrains_Mono'] text-[10px] text-[#849396]">
                    Materias: {serv.commonCourses}
                  </span>
                  <button
                    onClick={scrollToCalculator}
                    className="font-['JetBrains_Mono'] text-[11px] text-[#00e5ff] font-bold hover:underline flex items-center gap-1"
                  >
                    <span>Cotizar</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ==================================================================== */}
        {/* 3. VALUE PROPOSITION SECTION: Guías & Garantías para el Estudiante    */}
        {/* ==================================================================== */}
        <section className="rounded-3xl bg-gradient-to-r from-[#0d1633] via-[#101b3d] to-[#0d1633] border-2 border-[#00fe66]/30 p-6 sm:p-10 shadow-2xl flex flex-col gap-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex flex-col gap-1">
              <span className="font-['JetBrains_Mono'] text-[11px] text-[#00fe66] uppercase tracking-wider font-bold">
                MÁS QUE CÓDIGO // FORMACIÓN Y SEGURIDAD AL EXPONER
              </span>
              <h2 className="font-['Space_Grotesk'] text-[24px] sm:text-[30px] font-bold text-[#ffffff]">
                Nuestras 4 Garantías para tu Aprobación
              </h2>
            </div>
            <div className="px-3.5 py-1.5 rounded-full bg-[#00fe66]/10 border border-[#00fe66]/40 text-[#00fe66] font-['JetBrains_Mono'] text-[11px] font-bold shrink-0 self-start sm:self-auto">
              CERO PLAGIO • CERO DUDAS
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Guarantee 1: Código 100% Comentado */}
            <div className="p-5 rounded-2xl bg-[#060c20]/80 border border-[#1c274a] flex flex-col gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#00fe66]/10 border border-[#00fe66]/30 flex items-center justify-center text-[#00fe66]">
                <FileCode className="w-5 h-5 text-[#00fe66]" />
              </div>
              <h4 className="font-['Space_Grotesk'] text-[16px] font-bold text-[#dce1ff]">
                Código 100% Comentado
              </h4>
              <p className="font-['Inter'] text-[12px] text-[#bac9cc] leading-relaxed">
                Cada función, variable y llamada a base de datos cuenta con comentarios claros en español. Aprenderás exactamente cómo funciona el flujo sin memorizar a ciegas.
              </p>
            </div>

            {/* Guarantee 2: Guía de Defensa para el Profesor */}
            <div className="p-5 rounded-2xl bg-[#060c20]/80 border border-[#1c274a] flex flex-col gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#00e5ff]/10 border border-[#00e5ff]/30 flex items-center justify-center text-[#00e5ff]">
                <BookOpen className="w-5 h-5 text-[#00e5ff]" />
              </div>
              <h4 className="font-['Space_Grotesk'] text-[16px] font-bold text-[#dce1ff]">
                Guía de Defensa para el Profesor
              </h4>
              <p className="font-['Inter'] text-[12px] text-[#bac9cc] leading-relaxed">
                Anticipamos las preguntas de sínodo: "¿Por qué normalizaste hasta 3FN?", "¿Cómo gestionas la concurrencia?", "¿Qué pasa si se cae el socket?". Te damos las respuestas fundamentadas.
              </p>
            </div>

            {/* Guarantee 3: Garantía de Funcionamiento en Vivo */}
            <div className="p-5 rounded-2xl bg-[#060c20]/80 border border-[#1c274a] flex flex-col gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#00daf3]/10 border border-[#00daf3]/30 flex items-center justify-center text-[#00daf3]">
                <ShieldCheck className="w-5 h-5 text-[#00daf3]" />
              </div>
              <h4 className="font-['Space_Grotesk'] text-[16px] font-bold text-[#dce1ff]">
                Garantía de Ejecución en Vivo
              </h4>
              <p className="font-['Inter'] text-[12px] text-[#bac9cc] leading-relaxed">
                El proyecto se entrega probado y con comandos limpios. Si tienes problemas al correrlo en tu máquina o sistema operativo, te asistimos hasta que corra impecable.
              </p>
            </div>

            {/* Guarantee 4: Soporte de Ajustes por Rúbrica */}
            <div className="p-5 rounded-2xl bg-[#060c20]/80 border border-[#1c274a] flex flex-col gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#c084fc]/10 border border-[#c084fc]/30 flex items-center justify-center text-[#c084fc]">
                <HelpCircle className="w-5 h-5 text-[#c084fc]" />
              </div>
              <h4 className="font-['Space_Grotesk'] text-[16px] font-bold text-[#dce1ff]">
                Ajustes Gratuitos de Rúbrica
              </h4>
              <p className="font-['Inter'] text-[12px] text-[#bac9cc] leading-relaxed">
                Si tras la revisión preliminar tu docente solicita una adaptación específica, la ajustamos para que tu rúbrica obtenga el puntaje más alto posible.
              </p>
            </div>
          </div>
        </section>

        {/* ==================================================================== */}
        {/* 4. CATÁLOGO DE PLANTILLAS BASE (Pre-built Academic Solutions Grid)   */}
        {/* ==================================================================== */}
        <AcademyTemplatesCatalog showToast={showToast} />

        {/* ==================================================================== */}
        {/* 5. AUTOMATED STUDENT QUOTER (Interactive Component)                   */}
        {/* ==================================================================== */}
        <section id="seccion-cotizador" className="flex flex-col gap-4">
          <PricingCalculator showToast={showToast} />
        </section>

        {/* ==================================================================== */}
        {/* 5. FAQS & PREGUNTAS FRECUENTES                                       */}
        {/* ==================================================================== */}
        <section className="flex flex-col gap-6 max-w-3xl mx-auto w-full">
          <div className="flex flex-col items-center text-center gap-1">
            <span className="font-['JetBrains_Mono'] text-[11px] text-[#00daf3] uppercase tracking-widest font-bold">
              TRANSPARENCIA TOTAL
            </span>
            <h3 className="font-['Space_Grotesk'] text-[24px] sm:text-[28px] font-bold text-[#ffffff]">
              Preguntas Frecuentes de Estudiantes
            </h3>
          </div>

          <div className="flex flex-col gap-3">
            {FAQS.map((faq, idx) => {
              const isOpen = activeFaq === idx;
              return (
                <div
                  key={idx}
                  className="rounded-2xl bg-[#0c1533]/80 border border-[#1c274a] overflow-hidden transition-all"
                >
                  <button
                    type="button"
                    onClick={() => setActiveFaq(isOpen ? null : idx)}
                    className="w-full p-4 sm:p-5 flex items-center justify-between gap-4 text-left font-['Space_Grotesk'] text-[15px] font-semibold text-[#dce1ff] hover:text-[#00e5ff] transition-colors"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown
                      className={`w-4 h-4 text-[#00e5ff] shrink-0 transition-transform duration-200 ${
                        isOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-5 pt-1 text-[13px] font-['Inter'] text-[#bac9cc] leading-relaxed border-t border-[#1c274a]/60">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      </div>

      {/* ====================================================================== */}
      {/* ACADEMY DEDICATED FOOTER                                               */}
      {/* ====================================================================== */}
      <footer className="w-full bg-[#040814] border-t border-[#182346] py-8 text-center text-[#849396] font-['JetBrains_Mono'] text-[11px] mt-12 relative z-10">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-[#00e5ff]" />
            <span className="text-[#dce1ff] font-bold">MRCA Academy</span>
            <span>• Prototipado & Arquitectura para Estudiantes de Ingeniería</span>
          </div>
          <div>
            Pagos protegidos vía Stripe Escrow • Soporte en español para México y LATAM
          </div>
          <div>
            © 2025-2026 MRCA Solutions Inc. All rights reserved.
          </div>
        </div>
      </footer>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl bg-[#141d3d] border border-[#00e5ff]/50 shadow-[0_10px_30px_rgba(0,0,0,0.8),0_0_20px_rgba(0,229,255,0.3)] flex items-center gap-3 animate-bounce">
          <span translate="no" className="notranslate material-symbols-outlined text-[#00fe66] text-[20px]">check_circle</span>
          <span className="font-['JetBrains_Mono'] text-[12px] text-[#dce1ff] font-medium">{toastMessage}</span>
        </div>
      )}
    </StudentLayout>
  );
};

export const McraAcademy = MrcaAcademy;
export default MrcaAcademy;
