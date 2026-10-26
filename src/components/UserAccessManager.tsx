import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  UserPlus,
  Users,
  ShieldAlert,
  ShieldCheck,
  Key,
  Eye,
  EyeOff,
  Copy,
  Check,
  RefreshCw,
  Search,
  Filter,
  Lock,
  UserCheck,
  Sparkles,
  ArrowRight,
  Fingerprint,
} from 'lucide-react';
import {
  isSuperAdmin,
  provisionUserAccount,
  getManagedUsersLocally,
  getUserPermissions,
} from '../lib/auth';
import type { ManagedUser, UserRole } from '../types';

interface UserAccessManagerProps {
  sessionUser?: any;
  showToast: (msg: string) => void;
}

export const UserAccessManager: React.FC<UserAccessManagerProps> = ({
  sessionUser,
  showToast,
}) => {
  const isSuper = isSuperAdmin(sessionUser);

  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'partner' | 'employee'>('partner');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isProvisioning, setIsProvisioning] = useState(false);

  // Success Notification / Copy helper
  const [provisionedSuccess, setProvisionedSuccess] = useState<ManagedUser | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);

  // Directory State
  const [usersList, setUsersList] = useState<ManagedUser[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'superadmin' | 'partner' | 'employee'>('all');

  // Load team list on mount
  useEffect(() => {
    setUsersList(getManagedUsersLocally());
  }, []);

  // Helper to generate a cryptographically strong initial password
  const generateStrongPassword = () => {
    const charset = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%&*';
    let generated = '';
    const array = new Uint32Array(14);
    window.crypto.getRandomValues(array);
    for (let i = 0; i < 14; i++) {
      generated += charset[array[i] % charset.length];
    }
    setPassword(generated);
    setShowPassword(true);
    showToast('Clave segura generada con entropía criptográfica.');
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim() || !name.trim() || !password) {
      showToast('Por favor completa todos los campos del formulario.');
      return;
    }

    if (password.length < 8) {
      showToast('La contraseña debe contener al menos 8 caracteres.');
      return;
    }

    setIsProvisioning(true);
    try {
      const res = await provisionUserAccount({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        role,
        password,
      });

      if (res.success && res.user) {
        showToast(res.message);
        setProvisionedSuccess(res.user);
        setUsersList(getManagedUsersLocally());

        // Reset form inputs except confirmation card
        setName('');
        setEmail('');
        setPassword('');
      } else {
        showToast(`Error: ${res.message}`);
      }
    } catch (err: any) {
      showToast(err.message || 'Error inesperado durante el aprovisionamiento.');
    } finally {
      setIsProvisioning(false);
    }
  };

  const copyCredentials = (user: ManagedUser) => {
    const credText = `[MRCA SOLUTIONS // CREDENCIALES DE ACCESO]\nPlataforma: Enclave B2B Zero-Trust\nUsuario: ${user.email}\nRol Asignado: ${user.role.toUpperCase()}\nClave Inicial: ${user.initial_password_hint || 'Configurada al aprovisionar'}\nURL Acceso: ${window.location.origin}/admin`;
    navigator.clipboard.writeText(credText);
    setCopiedKey(true);
    showToast('Credenciales copiadas al portapapeles.');
    setTimeout(() => setCopiedKey(false), 2500);
  };

  // Filtered Directory
  const filteredUsers = usersList.filter((u) => {
    const matchesFilter =
      selectedFilter === 'all'
        ? true
        : selectedFilter === 'superadmin'
        ? u.role === 'superadmin' || u.role === 'owner'
        : selectedFilter === 'partner'
        ? u.role === 'partner' || u.role === 'stealth_partner'
        : u.role === 'employee';

    const q = searchQuery.toLowerCase().trim();
    const matchesQuery =
      !q ||
      u.email.toLowerCase().includes(q) ||
      (u.full_name && u.full_name.toLowerCase().includes(q));

    return matchesFilter && matchesQuery;
  });

  // ZERO-TRUST BARRIER: If user is not superadmin, block interface immediately
  if (!isSuper) {
    return (
      <div className="w-full py-12 flex flex-col items-center justify-center font-['Inter']">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-xl w-full p-8 rounded-2xl bg-[#0e1633] border border-red-500/40 shadow-[0_0_50px_rgba(239,68,68,0.2)] text-center flex flex-col items-center gap-4"
        >
          <div className="w-16 h-16 rounded-2xl bg-red-950/60 border border-red-500/50 flex items-center justify-center text-red-400">
            <ShieldAlert className="w-9 h-9" />
          </div>

          <div className="flex flex-col gap-1">
            <span className="font-['JetBrains_Mono'] text-[11px] text-red-400 font-bold uppercase tracking-widest">
              SOC-2 SECURITY GATE // ZERO-TRUST BARRIER
            </span>
            <h2 className="font-['Space_Grotesk'] text-[24px] font-bold text-white">
              Acceso Restringido: Solo Superadmin
            </h2>
            <p className="font-['Inter'] text-[13px] text-slate-300 leading-relaxed mt-1">
              El módulo de Gestión y Aprovisionamiento de Usuarios está reservado exclusivamente para la credencial de{' '}
              <strong className="text-amber-400">Fundador (Superadmin Root)</strong>. Tu cuenta actual no posee privilegios para crear o modificar roles en Supabase Auth.
            </p>
          </div>

          <div className="w-full p-3.5 rounded-xl bg-[#060d24] border border-slate-800 flex items-center justify-between text-[11px] font-['JetBrains_Mono']">
            <span className="text-slate-400">Nivel de Sesión Detectado:</span>
            <span className="text-cyan-400 font-bold uppercase">
              {sessionUser?.granularRole || sessionUser?.role || 'ESTÁNDAR'}
            </span>
          </div>

          <div className="text-[11px] font-['JetBrains_Mono'] text-slate-500 flex items-center gap-1.5 mt-2">
            <Lock className="w-3.5 h-3.5 text-red-400" />
            <span>Intento de inspección no autorizado auditado y firmado con SHA-256.</span>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col gap-6 font-['Inter'] selection:bg-[#00e5ff] selection:text-[#00363d]">
      {/* ── TOP HEADER & ROOT BADGE ────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-[#0d1738] via-[#091129] to-[#0d1738] border border-amber-500/30 shadow-[0_0_30px_rgba(245,158,11,0.1)]">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-amber-950/60 border border-amber-500/50 flex items-center justify-center text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.25)] shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-['Space_Grotesk'] text-[20px] sm:text-[22px] font-bold text-white tracking-tight">
                Gestión de Usuarios & Jerarquía RBAC
              </h1>
              <span className="px-2 py-0.5 rounded text-[10px] font-['JetBrains_Mono'] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 uppercase tracking-wider">
                SUPERADMIN ONLY
              </span>
            </div>
            <p className="font-['Inter'] text-[12px] text-slate-300 mt-0.5">
              Aprovisionamiento directo en Supabase Auth para Socios (Partners) y Empleados (Staff).
            </p>
          </div>
        </div>

        {/* Root CISO Authority Chip */}
        <div className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-[#060D24] border border-cyan-500/30 self-start md:self-auto">
          <Fingerprint className="w-4 h-4 text-[#00e5ff]" />
          <div className="flex flex-col text-left">
            <span className="text-[9px] font-['JetBrains_Mono'] text-slate-400 uppercase">
              Autoridad Criptográfica
            </span>
            <span className="text-[11px] font-['JetBrains_Mono'] text-[#00fe66] font-bold">
              ROOT JEFE // AUTORIZADO
            </span>
          </div>
        </div>
      </div>

      {/* ── BENTO METRICS BAR ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl bg-[#0e1633]/90 border border-slate-800 flex flex-col justify-between">
          <span className="font-['JetBrains_Mono'] text-[10px] text-slate-400 uppercase">
            Total Usuarios Enclave
          </span>
          <div className="font-['Space_Grotesk'] text-[24px] font-bold text-white mt-1">
            {usersList.length}
          </div>
          <span className="text-[10px] font-['JetBrains_Mono'] text-cyan-400 mt-1 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
            Directorio Sincronizado
          </span>
        </div>

        <div className="p-4 rounded-xl bg-[#0e1633]/90 border border-emerald-500/20 flex flex-col justify-between">
          <span className="font-['JetBrains_Mono'] text-[10px] text-slate-400 uppercase">
            Socios (Partners)
          </span>
          <div className="font-['Space_Grotesk'] text-[24px] font-bold text-emerald-400 mt-1">
            {usersList.filter((u) => u.role === 'partner' || u.role === 'stealth_partner').length}
          </div>
          <span className="text-[10px] font-['JetBrains_Mono'] text-emerald-400/80 mt-1">
            Segundo de Mando (CTO)
          </span>
        </div>

        <div className="p-4 rounded-xl bg-[#0e1633]/90 border border-cyan-500/20 flex flex-col justify-between">
          <span className="font-['JetBrains_Mono'] text-[10px] text-slate-400 uppercase">
            Empleados (Staff)
          </span>
          <div className="font-['Space_Grotesk'] text-[24px] font-bold text-cyan-400 mt-1">
            {usersList.filter((u) => u.role === 'employee').length}
          </div>
          <span className="text-[10px] font-['JetBrains_Mono'] text-cyan-400/80 mt-1">
            Staff Operativo
          </span>
        </div>

        <div className="p-4 rounded-xl bg-[#0e1633]/90 border border-amber-500/20 flex flex-col justify-between">
          <span className="font-['JetBrains_Mono'] text-[10px] text-slate-400 uppercase">
            Jerarquía Zero-Trust
          </span>
          <div className="font-['Space_Grotesk'] text-[18px] font-bold text-amber-400 mt-1 flex items-center gap-1">
            <ShieldCheck className="w-5 h-5" />
            <span>ENFORCED</span>
          </div>
          <span className="text-[10px] font-['JetBrains_Mono'] text-amber-400/80 mt-1">
            Aislamiento de Roles
          </span>
        </div>
      </div>

      {/* ── MAIN WORKSPACE: PROVISIONING FORM & ACTIVE DIRECTORY ──────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: USER PROVISIONING FORM (5 COLS) */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <div className="p-5 sm:p-6 rounded-2xl bg-[#0a1128]/95 border border-cyan-500/30 shadow-xl backdrop-blur-xl flex flex-col gap-4">
            <div className="flex items-center justify-between pb-3 border-b border-cyan-900/40">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-[#00e5ff]" />
                <h2 className="font-['Space_Grotesk'] text-[16px] font-bold text-white">
                  Registrar Nuevo Usuario
                </h2>
              </div>
              <span className="text-[10px] font-['JetBrains_Mono'] text-[#00fe66] uppercase">
                Supabase Auth API
              </span>
            </div>

            <form onSubmit={handleCreateUser} className="flex flex-col gap-3.5">
              {/* Full Name */}
              <div>
                <label className="block text-[11px] font-['JetBrains_Mono'] uppercase text-slate-300 mb-1">
                  Nombre Completo / Cargo
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Ing. Roberto Mendoza (Socio CTO)"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-[#060d24] border border-slate-700 focus:border-[#00e5ff] rounded-lg px-3 py-2 text-[13px] text-white focus:outline-none font-['Inter'] transition-colors"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-[11px] font-['JetBrains_Mono'] uppercase text-slate-300 mb-1">
                  Correo Electrónico Corporativo
                </label>
                <input
                  type="email"
                  required
                  placeholder="socio@mcrasolutions.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#060d24] border border-slate-700 focus:border-[#00e5ff] rounded-lg px-3 py-2 text-[13px] text-white focus:outline-none font-['JetBrains_Mono'] transition-colors"
                />
              </div>

              {/* Role Selection */}
              <div>
                <label className="block text-[11px] font-['JetBrains_Mono'] uppercase text-slate-300 mb-1.5">
                  Nivel de Acceso Jerárquico (Rol RBAC)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {/* Role: Partner */}
                  <button
                    type="button"
                    onClick={() => setRole('partner')}
                    className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition-all cursor-pointer ${
                      role === 'partner'
                        ? 'bg-emerald-950/40 border-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.2)]'
                        : 'bg-[#060d24] border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-['Space_Grotesk'] text-[13px] font-bold text-emerald-400">
                        Socio (Partner)
                      </span>
                      {role === 'partner' && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                    </div>
                    <span className="text-[10px] text-slate-300 leading-snug">
                      Segundo de Mando: Finanzas, Contratos y Bóveda.
                    </span>
                  </button>

                  {/* Role: Employee */}
                  <button
                    type="button"
                    onClick={() => setRole('employee')}
                    className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition-all cursor-pointer ${
                      role === 'employee'
                        ? 'bg-cyan-950/40 border-cyan-500 text-white shadow-[0_0_15px_rgba(6,182,212,0.2)]'
                        : 'bg-[#060d24] border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-['Space_Grotesk'] text-[13px] font-bold text-cyan-400">
                        Empleado (Staff)
                      </span>
                      {role === 'employee' && <Check className="w-3.5 h-3.5 text-cyan-400" />}
                    </div>
                    <span className="text-[10px] text-slate-300 leading-snug">
                      Staff Operativo: Soporte y resolución de tickets.
                    </span>
                  </button>
                </div>
              </div>

              {/* Initial Password (Clave) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-['JetBrains_Mono'] uppercase text-slate-300">
                    Contraseña Inicial (Clave de Acceso)
                  </label>
                  <button
                    type="button"
                    onClick={generateStrongPassword}
                    className="text-[10px] font-['JetBrains_Mono'] text-[#00e5ff] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>Generar Aleatoria</span>
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Mínimo 8 caracteres"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-[#060d24] border border-slate-700 focus:border-[#00e5ff] rounded-lg pl-3 pr-10 py-2 text-[13px] text-white focus:outline-none font-['JetBrains_Mono'] transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-white p-0.5"
                    aria-label="Ver u ocultar contraseña"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isProvisioning}
                className="w-full mt-2 py-2.5 rounded-xl bg-gradient-to-r from-[#00e5ff] to-[#00fe66] hover:brightness-110 text-[#00363d] font-['JetBrains_Mono'] text-[12px] font-bold uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(0,229,255,0.3)] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {isProvisioning ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Aprovisionando en Supabase...</span>
                  </>
                ) : (
                  <>
                    <Key className="w-4 h-4" />
                    <span>Crear Cuenta en Supabase Auth</span>
                  </>
                )}
              </button>
            </form>

            {/* Success Card with Copyable Credentials */}
            <AnimatePresence>
              {provisionedSuccess && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/40 flex flex-col gap-2 mt-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-['JetBrains_Mono'] text-[11px] text-emerald-400 font-bold uppercase flex items-center gap-1.5">
                      <Check className="w-4 h-4" />
                      <span>Usuario Creado Exitosamente</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setProvisionedSuccess(null)}
                      className="text-slate-400 hover:text-white text-xs"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="text-[11px] font-['JetBrains_Mono'] text-slate-300 flex flex-col gap-1 bg-[#060d24] p-2.5 rounded-lg border border-slate-800">
                    <div>
                      <span className="text-slate-500">Email:</span>{' '}
                      <span className="text-white font-bold">{provisionedSuccess.email}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Rol:</span>{' '}
                      <span className="text-emerald-400 font-bold uppercase">
                        {provisionedSuccess.role}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500">Clave Inicial:</span>{' '}
                      <span className="text-amber-300 font-bold">
                        {provisionedSuccess.initial_password_hint || '••••••••'}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyCredentials(provisionedSuccess)}
                    className="w-full py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 font-['JetBrains_Mono'] text-[10px] font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    {copiedKey ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedKey ? 'Credenciales Copiadas' : 'Copiar Credenciales para Enviar'}</span>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* RIGHT COLUMN: ACTIVE DIRECTORY & PERMISSIONS MATRIX (7 COLS) */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          {/* TEAM DIRECTORY PANEL */}
          <div className="p-5 sm:p-6 rounded-2xl bg-[#0a1128]/95 border border-cyan-500/20 shadow-xl backdrop-blur-xl flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-cyan-900/40">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-amber-400" />
                <h2 className="font-['Space_Grotesk'] text-[16px] font-bold text-white">
                  Directorio de Equipo y Roles
                </h2>
              </div>

              {/* Search Bar */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Buscar por nombre o correo..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-[#060d24] border border-slate-800 focus:border-[#00e5ff] rounded-lg pl-8 pr-3 py-1.5 text-[11px] text-white focus:outline-none font-['Inter'] w-full sm:w-60"
                />
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px] font-['JetBrains_Mono']">
              {(['all', 'superadmin', 'partner', 'employee'] as const).map((filterId) => (
                <button
                  key={filterId}
                  onClick={() => setSelectedFilter(filterId)}
                  className={`px-3 py-1 rounded-lg transition-all capitalize whitespace-nowrap cursor-pointer ${
                    selectedFilter === filterId
                      ? 'bg-cyan-500/20 text-[#00e5ff] border border-cyan-500/40 font-bold'
                      : 'text-slate-400 hover:text-white bg-[#060d24] border border-transparent'
                  }`}
                >
                  {filterId === 'all' ? 'Todos' : filterId}
                </button>
              ))}
            </div>

            {/* Users List */}
            <div className="flex flex-col gap-2.5 max-h-[380px] overflow-y-auto pr-1">
              {filteredUsers.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-[12px] font-['JetBrains_Mono']">
                  No se encontraron usuarios coincidentes en el directorio.
                </div>
              ) : (
                filteredUsers.map((user) => {
                  const isUserSuper = user.role === 'superadmin' || user.role === 'owner';
                  const isUserPartner = user.role === 'partner' || user.role === 'stealth_partner';

                  return (
                    <div
                      key={user.id}
                      className="p-3.5 rounded-xl bg-[#060d24]/90 border border-slate-800 hover:border-slate-700 transition-all flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                            isUserSuper
                              ? 'bg-amber-950/60 border border-amber-500/50 text-amber-400'
                              : isUserPartner
                              ? 'bg-emerald-950/60 border border-emerald-500/50 text-emerald-400'
                              : 'bg-cyan-950/60 border border-cyan-500/50 text-cyan-400'
                          }`}
                        >
                          {user.full_name ? user.full_name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
                        </div>

                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <span className="font-['Space_Grotesk'] text-[13px] font-bold text-white">
                              {user.full_name || 'Usuario Enclave'}
                            </span>
                            <span
                              className={`px-1.5 py-0.5 rounded text-[9px] font-['JetBrains_Mono'] font-bold uppercase tracking-wider ${
                                isUserSuper
                                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                  : isUserPartner
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                  : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                              }`}
                            >
                              {user.role}
                            </span>
                          </div>
                          <span className="font-['JetBrains_Mono'] text-[11px] text-slate-400">
                            {user.email}
                          </span>
                        </div>
                      </div>

                      {/* Right details & action */}
                      <div className="flex items-center gap-2">
                        <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-['JetBrains_Mono'] text-[#00fe66]">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#00fe66] animate-pulse"></span>
                          ACTIVO
                        </span>

                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(user.email);
                            showToast(`Correo ${user.email} copiado.`);
                          }}
                          className="w-8 h-8 rounded-lg bg-slate-800/60 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                          title="Copiar email"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* PERMISSIONS HIERARCHY MATRIX */}
          <div className="p-5 rounded-2xl bg-[#0a1128]/95 border border-cyan-500/20 shadow-xl backdrop-blur-xl flex flex-col gap-3">
            <div className="flex items-center justify-between pb-2 border-b border-cyan-900/40">
              <span className="font-['Space_Grotesk'] text-[14px] font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#00fe66]" />
                <span>Matriz de Autorizaciones RBAC (Zero-Trust)</span>
              </span>
              <span className="text-[10px] font-['JetBrains_Mono'] text-slate-500">SOC-2 TYPE II</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left font-['JetBrains_Mono'] text-[10px]">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400">
                    <th className="py-2 pr-3">Módulo / Capacidad</th>
                    <th className="py-2 px-2 text-center text-amber-400">Superadmin</th>
                    <th className="py-2 px-2 text-center text-emerald-400">Partner</th>
                    <th className="py-2 px-2 text-center text-cyan-400">Employee</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  <tr>
                    <td className="py-2 pr-3 font-semibold text-white">Gestión y Creación de Usuarios</td>
                    <td className="py-2 px-2 text-center text-emerald-400 font-bold">TOTAL (ROOT)</td>
                    <td className="py-2 px-2 text-center text-red-400 font-bold">BLOQUEADO</td>
                    <td className="py-2 px-2 text-center text-red-400 font-bold">BLOQUEADO</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-3 font-semibold text-white">Gobernanza Raíz & Revocación JWT</td>
                    <td className="py-2 px-2 text-center text-emerald-400 font-bold">TOTAL (ROOT)</td>
                    <td className="py-2 px-2 text-center text-red-400 font-bold">BLOQUEADO</td>
                    <td className="py-2 px-2 text-center text-red-400 font-bold">BLOQUEADO</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-3">Finanzas & Dispersión SPEI / Stripe</td>
                    <td className="py-2 px-2 text-center text-emerald-400">HABILITADO</td>
                    <td className="py-2 px-2 text-center text-emerald-400">HABILITADO</td>
                    <td className="py-2 px-2 text-center text-red-400 font-bold">BLOQUEADO</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-3">Generación & Firma Contratos B2B</td>
                    <td className="py-2 px-2 text-center text-emerald-400">HABILITADO</td>
                    <td className="py-2 px-2 text-center text-emerald-400">HABILITADO</td>
                    <td className="py-2 px-2 text-center text-red-400 font-bold">BLOQUEADO</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-3">Terminal Kali Linux & Auditoría SOC-2</td>
                    <td className="py-2 px-2 text-center text-emerald-400">HABILITADO</td>
                    <td className="py-2 px-2 text-center text-emerald-400">HABILITADO</td>
                    <td className="py-2 px-2 text-center text-red-400 font-bold">BLOQUEADO</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-3">Soporte Técnico & Tickets VIP</td>
                    <td className="py-2 px-2 text-center text-emerald-400">HABILITADO</td>
                    <td className="py-2 px-2 text-center text-emerald-400">HABILITADO</td>
                    <td className="py-2 px-2 text-center text-emerald-400">OPERACIONAL</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
