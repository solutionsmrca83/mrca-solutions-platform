import React from 'react';
import { MrcaBotWidget } from './MrcaBotWidget';

interface NeuralCopilotCompatProps {
  scope?: 'admin' | 'client' | 'public';
  defaultOpen?: boolean;
  onClose?: () => void;
  className?: string;
}

/**
 * Envoltorio de compatibilidad que redirige cualquier referencia heredada
 * de NeuralCopilot hacia el nuevo Asistente Automatizado MrcaBotWidget ($0 MXN).
 */
export const NeuralCopilot: React.FC<NeuralCopilotCompatProps> = ({
  scope = 'public',
  className = '',
}) => {
  return <MrcaBotWidget scope={scope} className={className} />;
};

export default NeuralCopilot;
