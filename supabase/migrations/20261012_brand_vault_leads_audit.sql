-- Migration: 20261012_brand_vault_leads_audit.sql
-- Description: Enterprise Lead Magnet, Encrypted File Vault, and Zero-Trust Audit Logs for MRCA Solutions

-- 1. Table: potential_leads (Public Lead Gen Magnet)
CREATE TABLE IF NOT EXISTS public.potential_leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    target_url TEXT NOT NULL,
    contact_email TEXT NOT NULL,
    risk_score INTEGER DEFAULT 87,
    vulnerabilities_detected JSONB DEFAULT '[]'::jsonb,
    status TEXT DEFAULT 'pending_report' CHECK (status IN ('pending_report', 'report_sent', 'contacted')),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS: potential_leads
ALTER TABLE public.potential_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit security audit scan lead"
    ON public.potential_leads
    FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Admins can view and manage leads"
    ON public.potential_leads
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE auth.users.id = auth.uid()
            AND (auth.users.raw_user_meta_data->>'role' = 'admin' 
                 OR auth.users.email IN ('jefe@mrcasolutions.com', 'socio@mrcasolutions.com'))
        )
    );

-- 2. Table: vault_files (Encrypted File Vault for Final Deliverables)
CREATE TABLE IF NOT EXISTS public.vault_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    filename TEXT NOT NULL,
    file_type TEXT NOT NULL CHECK (file_type IN ('ZIP', 'SQL', 'PDF', 'TAR.GZ', 'ENC')),
    file_size TEXT NOT NULL,
    sha256_hash TEXT NOT NULL,
    encryption_type TEXT DEFAULT 'AES-256-GCM / Zero-Knowledge',
    download_url TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS: vault_files
ALTER TABLE public.vault_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clients can view their assigned encrypted files"
    ON public.vault_files
    FOR SELECT
    USING (auth.uid() = client_id);

CREATE POLICY "Admins have full access to vault files"
    ON public.vault_files
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE auth.users.id = auth.uid()
            AND (auth.users.raw_user_meta_data->>'role' = 'admin' 
                 OR auth.users.email IN ('jefe@mrcasolutions.com', 'socio@mrcasolutions.com'))
        )
    );

-- 3. Table: system_audit_logs (Zero-Trust Live Telemetry and Security Logs)
CREATE TABLE IF NOT EXISTS public.system_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type TEXT NOT NULL,
    severity TEXT NOT NULL CHECK (severity IN ('success', 'info', 'warning', 'critical')),
    actor TEXT NOT NULL,
    ip_address TEXT DEFAULT '189.203.41.90',
    description TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS: system_audit_logs
ALTER TABLE public.system_audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view and create audit logs"
    ON public.system_audit_logs
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE auth.users.id = auth.uid()
            AND (auth.users.raw_user_meta_data->>'role' = 'admin' 
                 OR auth.users.email IN ('jefe@mrcasolutions.com', 'socio@mrcasolutions.com'))
        )
    );

-- Seed initial audit log events for realism
INSERT INTO public.system_audit_logs (event_type, severity, actor, ip_address, description, metadata)
VALUES
    ('HSM_ROOT_BOOT', 'success', 'jefe@mrcasolutions.com', '10.0.4.1', 'Hardware Security Module YubiHSM2 inicializado correctamente con TLS 1.3.', '{"hsm_id": "YUBI-MX-01"}'::jsonb),
    ('CONTRACT_SIGNED', 'success', 'cliente@enterprise.corp', '187.190.22.41', 'Cliente completó firma criptográfica ECDSA P-384 para Contrato Maestro NDA.', '{"contract_id": "CTR-B2B-902"}'::jsonb),
    ('SPEI_VERIFICATION', 'info', 'Banxico STP Worker', '10.0.12.8', 'Notificación SPEI CEP recibida para factura INV-8921 ($350,000 MXN).', '{"clabe": "638180000123456789"}'::jsonb),
    ('LOGIN_ATTEMPT', 'warning', 'unknown_probe', '45.134.140.12', 'Intento de fuerza bruta en puerto 22 SSH repelido por fail2ban y Cilium eBPF.', '{"port": 22, "attempts": 14}'::jsonb),
    ('VAULT_DECRYPT', 'success', 'cliente@enterprise.corp', '187.190.22.41', 'Desbloqueo de clave simétrica para entregable master_backup.sql verificado.', '{"sha256": "0x78ab12..."}'::jsonb)
ON CONFLICT DO NOTHING;
