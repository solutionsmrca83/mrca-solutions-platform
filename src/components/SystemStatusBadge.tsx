import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldCheck, Server, Activity, ChevronDown } from 'lucide-react';

interface SystemStatusBadgeProps {
  className?: string;
  showDetailsOnHover?: boolean;
}

export const SystemStatusBadge: React.FC<SystemStatusBadgeProps> = ({
  className = '',
  showDetailsOnHover = true,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div 
      className={`relative inline-block ${className}`}
      onMouseEnter={() => showDetailsOnHover && setIsOpen(true)}
      onMouseLeave={() => showDetailsOnHover && setIsOpen(false)}
    >
      {/* Minimalist Live Pulse Badge */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="group flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#141a32]/80 hover:bg-[#181e36] border border-[#00fe66]/30 hover:border-[#00fe66]/60 backdrop-blur-md shadow-[0_0_15px_rgba(0,254,102,0.15)] transition-all cursor-pointer font-['JetBrains_Mono'] text-[11px]"
        aria-label="Estado operativo de la plataforma"
      >
        {/* Animated Double Pulse Dot */}
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00fe66] opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00fe66] shadow-[0_0_8px_#00fe66]"></span>
        </span>

        {/* Status Text */}
        <span className="text-[#00fe66] font-semibold tracking-wide flex items-center gap-1.5">
          <span>All Systems Operational</span>
          <span className="text-[#849396] font-normal">//</span>
          <span className="text-cyan-300">99.9% Uptime</span>
        </span>

        {showDetailsOnHover && (
          <ChevronDown className={`w-3 h-3 text-[#849396] group-hover:text-[#00fe66] transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        )}
      </button>

      {/* Popover Breakdown on Hover or Click */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full right-0 mt-2 w-72 rounded-2xl bg-[#060d24]/95 border border-[#00e5ff]/40 shadow-[0_20px_50px_rgba(0,0,0,0.85),0_0_30px_rgba(0,229,255,0.2)] p-4 z-50 backdrop-blur-2xl flex flex-col gap-3 font-['Inter']"
          >
            <div className="flex items-center justify-between pb-2 border-b border-[#222941]">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-[#00fe66]" />
                <span className="font-['Space_Grotesk'] text-[13px] font-bold text-[#dce1ff]">
                  Telemetría de Nodos B2B
                </span>
              </div>
              <span className="text-[10px] font-['JetBrains_Mono'] px-2 py-0.5 rounded bg-[#00fe66]/10 text-[#00fe66] border border-[#00fe66]/30 font-bold">
                EN VIVO
              </span>
            </div>

            <div className="flex flex-col gap-2 font-['JetBrains_Mono'] text-[11px]">
              <div className="flex items-center justify-between">
                <span className="text-[#bac9cc] flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00fe66]"></span>
                  API Gateway & mTLS
                </span>
                <span className="text-[#00fe66] font-bold">100.0%</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[#bac9cc] flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00fe66]"></span>
                  Auth Enclave Zero-Trust
                </span>
                <span className="text-[#00fe66] font-bold">99.99%</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[#bac9cc] flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00fe66]"></span>
                  PostgreSQL RLS Cluster
                </span>
                <span className="text-[#00fe66] font-bold">100.0%</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[#bac9cc] flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00fe66]"></span>
                  Red Global Edge CDN
                </span>
                <span className="text-[#00fe66] font-bold">14ms latency</span>
              </div>
            </div>

            <div className="pt-2 border-t border-[#181e36] text-[10px] font-['JetBrains_Mono'] text-[#849396] flex items-center justify-between">
              <span>SLA CONTRACTUAL: 99.9%</span>
              <span className="text-[#00daf3]">BANXICO & AWS MX</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SystemStatusBadge;
