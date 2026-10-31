import React from 'react';
import { ContractGenerator, MEXICAN_LEGAL_CLAUSES, AVAILABLE_SERVICES } from './ContractGenerator';
import { ContractTemplate, ClientContract } from '../types';

export { ContractGenerator, MEXICAN_LEGAL_CLAUSES, AVAILABLE_SERVICES };

export interface AdminContractGeneratorProps {
  showToast: (msg: string) => void;
  onContractSent?: (contract: ClientContract) => void;
  sessionUser?: any;
  initialMode?: 'generator' | 'negotiations' | 'history';
  onNavigateTab?: (tab: any) => void;
}

export const BASE_TEMPLATES: ContractTemplate[] = [
  {
    id: 'tmpl_nda_v4',
    title: 'NDA - Acuerdo de Confidencialidad & Sigilo Criptográfico Zero-Trust',
    category: 'nda',
    categoryLabel: 'ACUERDO NDA / CONFIDENCIALIDAD',
    defaultSla: 'Vigencia de 5 Años // Enclave Cifrado',
    description:
      'Protección estricta de propiedad intelectual, repositorios de código privados, arquitectura de red mTLS y credenciales de acceso.',
    base_content: `ACUERDO BILATERAL DE CONFIDENCIALIDAD Y PROTECCIÓN CRIPTOGRÁFICA (NDA ZERO-TRUST)`,
  },
  {
    id: 'tmpl_software_dev_v2',
    title: 'Contrato Marco de Desarrollo de Software & Microservicios Cloud',
    category: 'software_dev',
    categoryLabel: 'DESARROLLO DE SOFTWARE & CLOUD',
    defaultSla: '99.98% Uptime // Sprint Quincenal',
    description:
      'Construcción de aplicaciones web de alta concurrencia en Next.js/Rust, microservicios blindados y pipelines CI/CD seguros.',
    base_content: `CONTRATO MARCO DE INGENIERÍA DE SOFTWARE & ARQUITECTURA DISTRIBUIDA B2B`,
  },
];

export const AdminContractGenerator: React.FC<AdminContractGeneratorProps> = (props) => {
  return <ContractGenerator {...props} />;
};

export default AdminContractGenerator;
