import React from 'react';
import {
  ContractGenerator,
  MEXICAN_LEGAL_CLAUSES,
  AVAILABLE_SERVICES,
  NU_MEXICO_CLABE,
  NU_MEXICO_INSTITUTION,
  PAYMENT_SPEI_CLAUSE,
  getDynamicAdvanceClause,
} from './ContractGenerator';
import { ContractTemplate, ClientContract } from '../types';

export {
  ContractGenerator,
  MEXICAN_LEGAL_CLAUSES,
  AVAILABLE_SERVICES,
  NU_MEXICO_CLABE,
  NU_MEXICO_INSTITUTION,
  PAYMENT_SPEI_CLAUSE,
  getDynamicAdvanceClause,
};

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
    title: 'NDA - Acuerdo de Confidencialidad y Resguardo Criptográfico',
    category: 'nda',
    categoryLabel: 'ACUERDO NDA / CONFIDENCIALIDAD',
    defaultSla: 'Vigencia de 5 Años // Enclave Cifrado',
    description:
      'Protección estricta de propiedad intelectual, repositorios de código privados, infraestructura cifrada y credenciales de acceso.',
    base_content: `ACUERDO BILATERAL DE CONFIDENCIALIDAD Y PROTECCIÓN CRIPTOGRÁFICA (NDA CONFIDENCIALIDAD)`,
  },
  {
    id: 'tmpl_software_dev_v2',
    title: 'Contrato Marco de Desarrollo de Software e Infraestructura Cloud',
    category: 'software_dev',
    categoryLabel: 'DESARROLLO DE SOFTWARE Y CLOUD',
    defaultSla: '99.98% Disponibilidad // Entregas Quincenales',
    description:
      'Construcción de aplicaciones web de alta concurrencia, servicios empresariales blindados y despliegue continuo seguro.',
    base_content: `CONTRATO MARCO DE INGENIERÍA DE SOFTWARE & ARQUITECTURA DISTRIBUIDA B2B`,
  },
];

export const AdminContractGenerator: React.FC<AdminContractGeneratorProps> = (props) => {
  return <ContractGenerator {...props} />;
};

export default AdminContractGenerator;
