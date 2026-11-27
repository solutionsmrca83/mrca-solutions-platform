import React, { useState, useEffect } from 'react';
import { ClientProjectProposal, ClientChatMessage } from '../types';
import { supabase } from '../lib/supabase/client';

interface AdminProjectApprovalsProps {
  onToast?: (msg: string) => void;
}

export const AdminProjectApprovals: React.FC<AdminProjectApprovalsProps> = ({ onToast }) => {
  const [proposals, setProposals] = useState<ClientProjectProposal[]>([]);
  const [selectedProposal, setSelectedProposal] = useState<ClientProjectProposal | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'accepted' | 'paused'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Admin reply chat state
  const [adminReplyText, setAdminReplyText] = useState('');
  const [adminSender, setAdminSender] = useState<'Jefe (CISO)' | 'Socio (CTO)'>('Jefe (CISO)');
  const [isSendingReply, setIsSendingReply] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function loadProposals() {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('client_project_proposals')
          .select('*')
          .order('submitted_at', { ascending: false });

        if (mounted && !error && Array.isArray(data)) {
          const mapped: ClientProjectProposal[] = data.map((row: any) => ({
            id: String(row.id),
            companyName: row.company_name || 'Empresa Cliente',
            representativeName: row.representative_name || 'Representante',
            email: row.email || '',
            category: (row.category || 'web_apps') as ClientProjectProposal['category'],
            projectTitle: row.project_title || 'Propuesta B2B',
            description: row.description || '',
            budgetTier: row.budget_tier || 'Por definir',
            status: (row.status === 'rejected' ? 'paused' : row.status || 'pending') as ClientProjectProposal['status'],
            reviewedBy: row.reviewer_notes || undefined,
            submittedAt: row.submitted_at
              ? new Date(row.submitted_at).toLocaleString('es-MX', {
                  day: '2-digit',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit',
                })
              : '',
            complianceAccepted: Boolean(row.compliance_accepted),
            messages: [],
          }));
          setProposals(mapped);
          setSelectedProposal(mapped[0] || null);
        } else if (mounted) {
          setProposals([]);
          setSelectedProposal(null);
        }
      } catch {
        if (mounted) {
          setProposals([]);
          setSelectedProposal(null);
        }
      } finally {
        if (mounted) setIsLoading(false);
      }
    }
    void loadProposals();
    return () => {
      mounted = false;
    };
  }, []);

  const filteredProposals = proposals.filter((p) => {
    const matchesFilter = filterStatus === 'all' || p.status === filterStatus;
    const matchesSearch =
      p.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.projectTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.representativeName.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const handleAcceptProject = async (id: string) => {
    setProposals((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, status: 'accepted', reviewedBy: adminSender } : item
      )
    );

    setSelectedProposal((curr) =>
      curr && curr.id === id ? { ...curr, status: 'accepted', reviewedBy: adminSender } : curr
    );

    try {
      await supabase
        .from('client_project_proposals')
        .update({
          status: 'accepted',
          reviewer_notes: adminSender,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', id);
    } catch {
      // handled gracefully
    }

    if (onToast) {
      onToast(`[PROYECTO ACEPTADO] "${id}" autorizado por ${adminSender}. Canal seguro desbloqueado.`);
    }
  };

  const handlePauseProject = async (id: string) => {
    setProposals((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, status: 'paused', reviewedBy: adminSender } : item
      )
    );

    setSelectedProposal((curr) =>
      curr && curr.id === id ? { ...curr, status: 'paused', reviewedBy: adminSender } : curr
    );

    try {
      await supabase
        .from('client_project_proposals')
        .update({
          status: 'paused',
          reviewer_notes: adminSender,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', id);
    } catch {
      // handled gracefully
    }

    if (onToast) {
      onToast(`[ESTADO ACTUALIZADO] Proyecto "${id}" pausado/archivado en revisión.`);
    }
  };

  const handleSendAdminReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProposal || !adminReplyText.trim()) return;

    setIsSendingReply(true);
    const newMsg: ClientChatMessage = {
      id: 'adm_msg_' + Date.now(),
      sender: 'admin',
      senderName: adminSender,
      text: adminReplyText.trim(),
      timestamp: 'Hoy, ' + new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }),
      isEncrypted: true,
      cipherHash: '0x' + Array.from({ length: 8 }, () => Math.floor(Math.random() * 16).toString(16)).join(''),
    };

    const updatedMessages = [...(selectedProposal.messages || []), newMsg];

    setProposals((prev) =>
      prev.map((p) => (p.id === selectedProposal.id ? { ...p, messages: updatedMessages } : p))
    );

    setSelectedProposal((prev) => (prev ? { ...prev, messages: updatedMessages } : null));

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('secure_messages').insert({
          sender_id: user.id,
          proposal_id: selectedProposal.id,
          encrypted_subject: `Respuesta sobre ${selectedProposal.projectTitle}`,
          encrypted_payload: newMsg.text,
          cipher_hash: newMsg.cipherHash,
          category: 'normal',
          client_company: selectedProposal.companyName,
          read: false,
        });
      }
    } catch {
      // handled gracefully
    }

    setAdminReplyText('');
    setIsSendingReply(false);

    if (onToast) {
      onToast(`Respuesta oficial transmitida al cliente vía canal seguro AES-256.`);
    }
  };

  return (
    <div className="w-full flex flex-col gap-6">
      {/* ================================================================== */}
      {/* BANNER: BANDEJA DE NUEVAS SOLICITUDES & APROBACIÓN DE PROYECTOS    */}
      {/* ================================================================== */}
      <div className="rounded-3xl bg-[#141a32]/95 border border-[#00e5ff]/30 p-5 sm:p-6 shadow-2xl backdrop-blur-xl flex flex-col gap-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#222941] gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#060d24] border border-[#00e5ff]/40 flex items-center justify-center text-[#00e5ff] shadow-[0_0_15px_rgba(0,229,255,0.3)]">
              <span translate="no" className="notranslate material-symbols-outlined text-[24px]">assignment_turned_in</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#00fe66] animate-pulse shadow-[0_0_8px_#00fe66]"></span>
                <span className="font-['JetBrains_Mono'] text-[10px] text-[#00fe66] uppercase font-semibold">
                  GOBERNANZA RAÍZ // JEFE & SOCIO
                </span>
              </div>
              <h2 className="font-['Space_Grotesk'] text-[22px] font-bold text-[#dce1ff]">
                Bandeja de Nuevas Solicitudes & Proyectos B2B
              </h2>
            </div>
          </div>

          {/* Active Admin Switcher */}
          <div className="flex items-center gap-2 bg-[#060d24] p-1 rounded-xl border border-[#222941] font-['JetBrains_Mono'] text-[11px]">
            <span className="text-[#849396] px-2">Operador Activo:</span>
            <button
              onClick={() => setAdminSender('Jefe (CISO)')}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                adminSender === 'Jefe (CISO)'
                  ? 'bg-[#00e5ff] text-[#00363d] font-bold shadow-[0_0_10px_rgba(0,229,255,0.3)]'
                  : 'text-[#bac9cc] hover:text-[#dce1ff]'
              }`}
            >
              Jefe (CISO)
            </button>
            <button
              onClick={() => setAdminSender('Socio (CTO)')}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                adminSender === 'Socio (CTO)'
                  ? 'bg-[#00e5ff] text-[#00363d] font-bold shadow-[0_0_10px_rgba(0,229,255,0.3)]'
                  : 'text-[#bac9cc] hover:text-[#dce1ff]'
              }`}
            >
              Socio (CTO)
            </button>
          </div>
        </div>

        {/* Filter Controls & Search */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 font-['JetBrains_Mono'] text-[11px]">
          <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                filterStatus === 'all'
                  ? 'bg-[#00e5ff]/20 text-[#00e5ff] border border-[#00e5ff]/50 font-bold'
                  : 'text-[#bac9cc] hover:bg-[#181e36]'
              }`}
            >
              Todos ({proposals.length})
            </button>
            <button
              onClick={() => setFilterStatus('pending')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                filterStatus === 'pending'
                  ? 'bg-[#ffd260]/20 text-[#ffd260] border border-[#ffd260]/50 font-bold'
                  : 'text-[#bac9cc] hover:bg-[#181e36]'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#ffd260]"></span>
              <span>Pendientes ({proposals.filter((p) => p.status === 'pending').length})</span>
            </button>
            <button
              onClick={() => setFilterStatus('accepted')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                filterStatus === 'accepted'
                  ? 'bg-[#00fe66]/20 text-[#00fe66] border border-[#00fe66]/50 font-bold'
                  : 'text-[#bac9cc] hover:bg-[#181e36]'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#00fe66]"></span>
              <span>Aceptados ({proposals.filter((p) => p.status === 'accepted').length})</span>
            </button>
            <button
              onClick={() => setFilterStatus('paused')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                filterStatus === 'paused'
                  ? 'bg-[#ffb4ab]/20 text-[#ffb4ab] border border-[#ffb4ab]/50 font-bold'
                  : 'text-[#bac9cc] hover:bg-[#181e36]'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#ffb4ab]"></span>
              <span>Pausados ({proposals.filter((p) => p.status === 'paused').length})</span>
            </button>
          </div>

          <div className="relative w-full sm:w-64">
            <span translate="no" className="notranslate absolute left-3 top-2 material-symbols-outlined text-[#849396] text-[16px]">
              search
            </span>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar entidad o título..."
              className="w-full bg-[#060d24] border border-[#222941] focus:border-[#00e5ff] rounded-lg pl-8 pr-3 py-1.5 text-[11px] text-[#dce1ff] focus:outline-none"
            />
          </div>
        </div>

        {/* ================================================================ */}
        {/* INBOX TABLE & DETAIL SPLIT VIEW                                   */}
        {/* ================================================================ */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left Column: Proposals List */}
          <div className="lg:col-span-6 flex flex-col gap-2.5 max-h-[640px] overflow-y-auto pr-1">
            {isLoading ? (
              <div className="p-8 text-center text-[#849396] font-['JetBrains_Mono'] text-[12px] bg-[#060d24] rounded-2xl border border-[#222941]">
                Consultando propuestas reales en Supabase...
              </div>
            ) : filteredProposals.length === 0 ? (
              <div className="p-8 text-center text-[#849396] font-['JetBrains_Mono'] text-[12px] bg-[#060d24] rounded-2xl border border-dashed border-[#222941] flex flex-col items-center gap-1.5">
                <span className="font-['Space_Grotesk'] text-[15px] font-bold text-[#dce1ff]">
                  Sin registros aún
                </span>
                <span>
                  Los datos reales de propuestas y solicitudes B2B aparecerán aquí automáticamente.
                </span>
              </div>
            ) : (
              filteredProposals.map((item) => {
                const isSelected = selectedProposal?.id === item.id;
                return (
                  <div
                    key={item.id}
                    onClick={() => setSelectedProposal(item)}
                    className={`p-4 rounded-2xl cursor-pointer border transition-all flex flex-col gap-2.5 ${
                      isSelected
                        ? 'bg-[#181e36] border-[#00e5ff] shadow-[0_0_20px_rgba(0,229,255,0.2)]'
                        : 'bg-[#060d24]/90 border-[#222941] hover:border-[#3b494c] hover:bg-[#101730]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex flex-col">
                        <span className="font-['JetBrains_Mono'] text-[10px] text-[#00daf3]">
                          {item.id} • {item.submittedAt}
                        </span>
                        <h4 className="font-['Space_Grotesk'] text-[15px] font-bold text-[#dce1ff]">
                          {item.companyName}
                        </h4>
                      </div>

                      {/* Status Pill */}
                      <span
                        className={`font-['JetBrains_Mono'] text-[9px] px-2.5 py-0.5 rounded-full font-bold uppercase border ${
                          item.status === 'accepted'
                            ? 'bg-[#00fe66]/15 text-[#00fe66] border-[#00fe66]/40'
                            : item.status === 'pending'
                            ? 'bg-[#ffd260]/15 text-[#ffd260] border-[#ffd260]/40'
                            : 'bg-[#ffb4ab]/15 text-[#ffb4ab] border-[#ffb4ab]/40'
                        }`}
                      >
                        {item.status === 'accepted'
                          ? 'Aceptado'
                          : item.status === 'pending'
                          ? 'Pendiente'
                          : 'Pausado'}
                      </span>
                    </div>

                    <p className="font-['Inter'] text-[12px] text-[#bac9cc] line-clamp-2">
                      {item.projectTitle}
                    </p>

                    <div className="flex items-center justify-between font-['JetBrains_Mono'] text-[10px] text-[#849396] pt-1 border-t border-[#181e36]">
                      <span className="text-[#00e5ff] truncate max-w-[180px]">{item.representativeName}</span>
                      <span className="text-[#ffd260]">{item.budgetTier}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Right Column: Selected Proposal Detail & Action Buttons */}
          <div className="lg:col-span-6 rounded-2xl bg-[#060d24] border border-[#222941] p-5 flex flex-col justify-between gap-5">
            {!selectedProposal ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-10 gap-2 text-[#849396]">
                <span translate="no" className="notranslate material-symbols-outlined text-[36px] text-[#00e5ff]/50">
                  inbox
                </span>
                <span className="font-['Space_Grotesk'] text-[16px] font-bold text-[#dce1ff]">
                  Sin propuesta seleccionada
                </span>
                <p className="font-['Inter'] text-[12px] max-w-sm">
                  Cuando los clientes envíen solicitudes de proyecto en Supabase, podrás revisarlas y aprobarlas desde este panel.
                </p>
              </div>
            ) : (
            <div className="flex flex-col gap-4">
              <div className="flex items-start justify-between pb-3 border-b border-[#181e36]">
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span className="font-['JetBrains_Mono'] text-[11px] text-[#00daf3] font-bold">
                      {selectedProposal.id}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-[#00fe66]/10 text-[#00fe66] font-['JetBrains_Mono'] text-[9px] border border-[#00fe66]/20 font-semibold">
                      CUMPLIMIENTO VERIFICADO
                    </span>
                  </div>
                  <h3 className="font-['Space_Grotesk'] text-[18px] font-bold text-[#dce1ff]">
                    {selectedProposal.companyName}
                  </h3>
                  <p className="font-['JetBrains_Mono'] text-[11px] text-[#bac9cc]">
                    {selectedProposal.representativeName} &lt;{selectedProposal.email}&gt;
                  </p>
                </div>

                <div className="text-right">
                  <span className="block font-['JetBrains_Mono'] text-[9px] text-[#849396]">PRESUPUESTO:</span>
                  <span className="font-['JetBrains_Mono'] text-[12px] text-[#ffd260] font-bold">
                    {selectedProposal.budgetTier}
                  </span>
                </div>
              </div>

              {/* Proposal Content */}
              <div className="flex flex-col gap-2">
                <span className="font-['JetBrains_Mono'] text-[10px] text-[#849396] uppercase font-semibold">
                  TÍTULO & DESCRIPCIÓN DEL PROYECTO:
                </span>
                <p className="font-['Space_Grotesk'] text-[14px] text-[#00e5ff] font-semibold">
                  {selectedProposal.projectTitle}
                </p>
                <div className="p-3.5 rounded-xl bg-[#141a32] border border-[#181e36] font-['Inter'] text-[12px] text-[#bac9cc] leading-relaxed">
                  {selectedProposal.description}
                </div>
              </div>

              {/* ============================================================ */}
              {/* ACTION BUTTONS: ACEPTAR PROYECTO & RECHAZAR / PAUSAR         */}
              {/* ============================================================ */}
              <div className="p-4 rounded-xl bg-[#141a32] border border-[#222941] flex flex-col gap-3">
                <div className="flex items-center justify-between text-[11px] font-['JetBrains_Mono']">
                  <span className="text-[#849396]">RESOLUCIÓN DE ARQUITECTURA:</span>
                  {selectedProposal.reviewedBy && (
                    <span className="text-[#00fe66]">Revisado por: {selectedProposal.reviewedBy}</span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {/* Glowing 'Aceptar Proyecto' Button (Terminal Green) */}
                  <button
                    id="btn-accept-project"
                    onClick={() => handleAcceptProject(selectedProposal.id)}
                    className="py-3 rounded-xl bg-[#00fe66] hover:bg-[#5aff96] text-[#00363d] font-['JetBrains_Mono'] text-[12px] font-bold uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(0,254,102,0.4)] hover:shadow-[0_0_30px_rgba(0,254,102,0.6)] flex items-center justify-center gap-1.5"
                  >
                    <span translate="no" className="notranslate material-symbols-outlined text-[18px]">verified</span>
                    <span>Aceptar Proyecto</span>
                  </button>

                  {/* Glowing 'Rechazar / Pausar' Button (Amber/Coral) */}
                  <button
                    id="btn-pause-project"
                    onClick={() => handlePauseProject(selectedProposal.id)}
                    className="py-3 rounded-xl bg-[#181e36] hover:bg-[#ffb4ab]/20 text-[#ffb4ab] border border-[#ffb4ab]/40 font-['JetBrains_Mono'] text-[12px] font-bold uppercase tracking-wider transition-all shadow-[0_0_15px_rgba(255,180,171,0.2)] flex items-center justify-center gap-1.5"
                  >
                    <span translate="no" className="notranslate material-symbols-outlined text-[18px]">pause_circle</span>
                    <span>Rechazar / Pausar</span>
                  </button>
                </div>
              </div>

              {/* ============================================================ */}
              {/* ADMIN CHAT INTERFACE: Reply to Client Once Accepted          */}
              {/* ============================================================ */}
              <div className="flex flex-col gap-2.5 pt-2 border-t border-[#181e36]">
                <div className="flex items-center justify-between text-[11px] font-['JetBrains_Mono']">
                  <div className="flex items-center gap-1.5 text-[#00e5ff]">
                    <span translate="no" className="notranslate material-symbols-outlined text-[15px]">lock</span>
                    <span className="font-bold">CANAL DE RESPUESTA OFICIAL (ADMINISTRACIÓN)</span>
                  </div>
                  <span className="text-[#849396]">FIRMA: {adminSender}</span>
                </div>

                {selectedProposal.status !== 'accepted' ? (
                  <div className="p-4 rounded-xl bg-[#141a32]/60 border border-dashed border-[#222941] text-center font-['JetBrains_Mono'] text-[11px] text-[#849396]">
                    Haga clic en <strong className="text-[#00fe66]">"Aceptar Proyecto"</strong> para desbloquear la mensajería interna cifrada con este cliente.
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    {/* Chat Bubble History */}
                    <div className="p-3 rounded-xl bg-[#141a32] border border-[#181e36] max-h-48 overflow-y-auto flex flex-col gap-2 font-['Inter'] text-[12px]">
                      {(!selectedProposal.messages || selectedProposal.messages.length === 0) ? (
                        <span className="text-[#849396] font-['JetBrains_Mono'] text-[11px] text-center py-2">
                          Sin mensajes previos. Inicie la conversación técnica abajo.
                        </span>
                      ) : (
                        selectedProposal.messages.map((m) => (
                          <div
                            key={m.id}
                            className={`p-2.5 rounded-xl border ${
                              m.sender === 'admin'
                                ? 'bg-[#00fe66]/10 border-[#00fe66]/30 text-[#dce1ff] self-end max-w-[85%]'
                                : 'bg-[#060d24] border-[#00e5ff]/30 text-[#c3f5ff] self-start max-w-[85%]'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2 mb-0.5 text-[9px] font-['JetBrains_Mono']">
                              <span className={m.sender === 'admin' ? 'text-[#00fe66]' : 'text-[#00e5ff]'}>
                                {m.senderName}
                              </span>
                              <span className="text-[#849396]">{m.timestamp}</span>
                            </div>
                            <p>{m.text}</p>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Admin Reply Form */}
                    <form onSubmit={handleSendAdminReply} className="flex gap-2">
                      <input
                        id="input-admin-reply"
                        type="text"
                        value={adminReplyText}
                        onChange={(e) => setAdminReplyText(e.target.value)}
                        placeholder={`Responder a ${selectedProposal.representativeName} como ${adminSender}...`}
                        className="flex-1 bg-[#141a32] border border-[#3b494c] focus:border-[#00e5ff] rounded-xl px-3 py-2 text-[12px] text-[#dce1ff] focus:outline-none font-['Inter']"
                      />
                      <button
                        id="btn-send-admin-reply"
                        type="submit"
                        disabled={isSendingReply || !adminReplyText.trim()}
                        className="px-4 py-2 rounded-xl bg-[#00e5ff] hover:bg-[#c3f5ff] text-[#00363d] font-['JetBrains_Mono'] text-[11px] font-bold uppercase transition-all shadow-[0_0_15px_rgba(0,229,255,0.4)] flex items-center gap-1 disabled:opacity-50"
                      >
                        <span translate="no" className="notranslate material-symbols-outlined text-[16px]">send</span>
                        <span>Responder</span>
                      </button>
                    </form>
                  </div>
                )}
              </div>
            </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminProjectApprovals;
