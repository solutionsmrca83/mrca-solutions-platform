export type ActiveView = 
  | 'public' 
  | 'admin' 
  | 'client' 
  | 'academy' 
  | 'login'
  | 'legal-terminos'
  | 'legal-privacidad'
  | 'legal-sla'
  | 'legal-aup'
  | 'not-found';

export type ScreenMode = 'responsive' | 'mobile-mock' | 'desktop-mock';

export interface LedgerEntry {
  id: string;
  client: string;
  amount: number;
  currency: string;
  service: string;
  gateway: 'Stripe Escrow (Dual)' | 'SPEI Inmediato Banxico';
  gatewayType: 'stripe' | 'spei';
  hash: string;
  status: 'LEDGER OK' | 'PENDING' | 'DISPERSED';
  timestamp: string;
}

export interface KanbanTicket {
  id: string;
  title: string;
  category: string;
  categoryBadge: string;
  categoryBadgeColor: string;
  description: string;
  amountEst?: string;
  leadScore?: number;
  slaNote?: string;
  status: 'leads' | 'negotiation' | 'active';
}

export interface EngineeringTask {
  id: string;
  title: string;
  percentage: number;
  note: string;
  color: 'cyan' | 'green';
}

export interface ShardNode {
  id: string;
  label: string;
  location: string;
  active: boolean;
  x: number;
  y: number;
}

// Multi-Role RBAC Definitions
export type UserRole = 'owner' | 'stealth_partner' | 'employee' | 'client' | 'student';

export interface UserProfile {
  id: string;
  role: UserRole;
  email?: string;
  stealth_token_hash?: string;
  created_at: string;
  updated_at: string;
}

export interface SecureMessage {
  id: string;
  sender_id: string;
  recipient_id?: string | null;
  encrypted_subject: string;
  encrypted_payload: string;
  metadata?: {
    category?: 'critical' | 'high' | 'normal' | 'audit';
    clientCompany?: string;
    senderRole?: UserRole;
    serverIpHash?: string;
    [key: string]: any;
  };
  read: boolean;
  created_at: string;
}

// Client Onboarding & Project Proposal Types
export type EngineeringCapabilityCategory = 'web_apps' | 'databases' | 'custom_scripts' | 'security';

export interface EngineeringCapability {
  id: EngineeringCapabilityCategory;
  title: string;
  subtitle: string;
  description: string;
  icon: string;
  technologies: string[];
  sla: string;
  badge: string;
}

export interface ClientChatMessage {
  id: string;
  sender: 'client' | 'admin';
  senderName: string;
  text: string;
  timestamp: string;
  isEncrypted: boolean;
  cipherHash?: string;
}

export interface ClientProjectProposal {
  id: string;
  companyName: string;
  representativeName: string;
  email: string;
  category: EngineeringCapabilityCategory;
  projectTitle: string;
  description: string;
  budgetTier: string;
  status: 'pending' | 'accepted' | 'paused' | 'rejected';
  submittedAt: string;
  reviewedBy?: string;
  complianceAccepted: boolean;
  messages: ClientChatMessage[];
}

// Enterprise B2B Contract Management Types
export type ContractStatus = 'draft' | 'pending_signature' | 'signed' | 'revoked';

export interface ContractTemplate {
  id: string;
  title: string;
  category: 'nda' | 'software_dev' | 'pentest' | 'escrow';
  categoryLabel: string;
  description: string;
  base_content: string;
  defaultSla?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ClientContract {
  id: string;
  client_id: string;
  client_name: string;
  client_company: string;
  client_email: string;
  template_id?: string;
  title: string;
  content: string;
  status: ContractStatus;
  signature_data?: string | null;
  signature_hash?: string | null;
  signer_email?: string | null;
  signed_at?: string | null;
  created_at: string;
  updated_at?: string;
}

// Developer Portal & API Key Types
export interface ApiKeyData {
  id: string;
  name: string;
  keyPrefix: string;
  fullKey: string;
  environment: 'production' | 'staging';
  status: 'active' | 'rotated' | 'revoked';
  rateLimit: string;
  createdAt: string;
  lastUsedAt: string;
}

export interface ApiKeyMetricPoint {
  date: string;
  requests: number;
  latencyMs: number;
  successRate: number;
  bandwidthKb: number;
}

// Interactive Roadmap & Gantt Timeline Types
export type RoadmapStatus = 'completed' | 'active' | 'upcoming';

export interface RoadmapItem {
  id: string;
  phaseCode: string;
  title: string;
  subtitle: string;
  category: 'architecture' | 'database' | 'security' | 'escrow' | 'production';
  status: RoadmapStatus;
  progress: number;
  startDate: string;
  targetDate: string;
  description: string;
  deliverables: { text: string; done: boolean }[];
  commitHash: string;
  architectLead: 'Jefe (CISO)' | 'Socio (CTO)' | 'Equipo Core Enclave';
  slaVerification: string;
}

// Zero-Commission SPEI Billing Types
export type InvoiceStatus = 'pending' | 'verification_in_progress' | 'paid';

export interface Invoice {
  id: string;
  client_id: string;
  client_company: string;
  client_email: string;
  amount: number;
  status: InvoiceStatus;
  description: string;
  due_date: string;
  spei_tracking_key?: string | null;
  payment_proof_url?: string | null;
  created_at: string;
  updated_at?: string;
}

// IT Support Ticketing System Types
export type TicketPriority = 'low' | 'medium' | 'critical';
export type TicketStatus = 'open' | 'in_progress' | 'resolved';

export interface SupportTicket {
  id: string;
  client_id: string;
  client_company: string;
  client_email: string;
  subject: string;
  description: string;
  priority: TicketPriority;
  status: TicketStatus;
  admin_reply?: string | null;
  created_at: string;
  updated_at?: string;
}

// Live Software Health System Types
export interface SystemHealthService {
  id: string;
  name: string;
  category: string;
  status: 'operational' | 'degraded';
  uptime: string;
  latency: string;
  lastChecked: string;
}

// Security Scanner Lead Magnet Types
export interface PotentialLead {
  id?: string;
  target_url: string;
  contact_email: string;
  risk_score: number;
  vulnerabilities_detected: string[];
  status?: 'pending_report' | 'report_sent' | 'contacted';
  created_at?: string;
}

// Encrypted File Vault Deliverables Types
export interface VaultFile {
  id: string;
  client_id?: string;
  filename: string;
  file_type: 'ZIP' | 'SQL' | 'PDF' | 'TAR.GZ' | 'ENC';
  file_size: string;
  sha256_hash: string;
  encryption_type: string;
  download_url: string;
  description?: string;
  created_at: string;
}

// Zero-Trust System Audit Logs Types
export interface SystemAuditLog {
  id: string;
  timestamp: string;
  event_type: string;
  severity: 'success' | 'info' | 'warning' | 'critical';
  actor: string;
  ip_address: string;
  description: string;
  metadata?: Record<string, any>;
}

// Dynamic Pricing, Discount Engine & Budget Negotiations
export type NegotiationClientType = 'student' | 'enterprise';
export type NegotiationStatus = 'pending' | 'approved' | 'rejected' | 'counter_offered';

export interface BudgetNegotiation {
  id: string;
  client_type: NegotiationClientType;
  client_name: string;
  client_company_or_school: string;
  client_email: string;
  client_phone?: string;
  service_title: string;
  service_category: 'academy' | 'b2b' | string;
  original_price: number;
  proposed_budget: number;
  approved_price?: number | null;
  status: NegotiationStatus;
  message: string;
  admin_scope_adjustment?: string | null;
  admin_notes?: string | null;
  checkout_link?: string | null;
  created_at: string;
  updated_at?: string;
}

export interface DiscountCoupon {
  code: string;
  name: string;
  discountPercentage: number;
  applicableTo: 'all' | 'student' | 'enterprise';
  description: string;
  expiryNotice?: string;
}

export interface AcademyTemplate {
  id: string;
  title: string;
  category: string;
  price: number;
  originalPrice: number;
  deliveryTime: string;
  techStack: string[];
  tags: string[];
  description: string;
  deliverables: string[];
  features: string[];
  complexity: 'Básico' | 'Intermedio' | 'Avanzado';
}

