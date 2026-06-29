import React, { useState, useEffect, useRef } from 'react';
import {
  Shield, UserPlus, Trash2, Edit3, Check, X, AlertCircle,
  Loader2, Search, Crown, Users, Mic2, User, ChevronDown,
  Key, Mail, Lock, Eye, EyeOff, RefreshCw, AlertTriangle,
  ShieldOff, ShieldCheck, Star, ArrowUpDown, MoreVertical,
  CheckCircle, Clock, Ban, Unlock, Save, Copy, Zap,
  LogOut, Hash, Activity, Settings
} from 'lucide-react';
import { API } from '../config/api';
import { createPortal } from 'react-dom';


// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────
const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

const ROLES = [
  { key: 'user',   label: 'Utilisateur', icon: <User size={13}/>,       color: 'blue',   bg: 'bg-blue-500/15 text-blue-400 border-blue-500/30'   },
  { key: 'artist', label: 'Artiste',     icon: <Mic2 size={13}/>,       color: 'purple', bg: 'bg-purple-500/15 text-purple-400 border-purple-500/30' },
  { key: 'admin',  label: 'Admin',       icon: <Shield size={13}/>,     color: 'red',    bg: 'bg-red-500/15 text-red-400 border-red-500/30'       },
];

const RoleBadge = ({ role }) => {
  const r = ROLES.find(r => r.key === role) || ROLES[0];
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${r.bg}`}>
      {r.icon} {r.label}
    </span>
  );
};

// ─────────────────────────────────────────────────────────────
// CONFIRM DIALOG
// ─────────────────────────────────────────────────────────────
const ConfirmModal = ({ config, onClose }) => {
  if (!config) return null;
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6 w-full max-w-sm shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4 ${config.variant === 'danger' ? 'bg-red-500/15 text-red-400' : 'bg-orange-500/15 text-orange-400'}`}>
          <AlertTriangle size={22}/>
        </div>
        <h3 className="text-base font-black text-center mb-2">{config.title}</h3>
        {config.message && <p className="text-xs text-zinc-500 text-center mb-5">{config.message}</p>}
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-sm font-bold transition">
            Annuler
          </button>
          <button onClick={() => { config.onConfirm(); onClose(); }}
            className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition text-white ${config.variant === 'danger' ? 'bg-red-600 hover:bg-red-500' : 'bg-orange-600 hover:bg-orange-500'}`}>
            {config.confirmLabel || 'Confirmer'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────
const AdminTeamView = ({ token, currentAdminId, isPrimary }) => {

  // ── State ─────────────────────────────────────────────────
  const [tab, setTab]           = useState('admins');   // 'admins' | 'roles'
  const [admins, setAdmins]     = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [confirm, setConfirm]   = useState(null);

  // Feedback
  const [feedback, setFeedback] = useState(null);
  const showFeedback = (text, isError = false) => {
    setFeedback({ text, type: isError ? 'error' : 'success' });
    setTimeout(() => setFeedback(null), 4500);
  };

  // ── Créer admin ───────────────────────────────────────────
  const [showAddForm, setShowAddForm]   = useState(false);
  const [newNom, setNewNom]             = useState('');
  const [newEmail, setNewEmail]         = useState('');
  const [newPassword, setNewPassword]   = useState('');
  const [newSecret, setNewSecret]       = useState('');
  const [showPwd, setShowPwd]           = useState(false);
  const [showSecret, setShowSecret]     = useState(false);
  const [creating, setCreating]         = useState(false);

  // ── Éditer admin ──────────────────────────────────────────
  const [editingAdmin, setEditingAdmin] = useState(null); // { _id, nom, email, isPrimary }
  const [editNom, setEditNom]           = useState('');
  const [editEmail, setEditEmail]       = useState('');
  const [editPwd, setEditPwd]           = useState('');
  const [editIsPrimary, setEditIsPrimary] = useState(false);
  const [showEditPwd, setShowEditPwd]   = useState(false);
  const [saving, setSaving]             = useState(false);

  // ── Gestion rôles users ───────────────────────────────────
  const [userSearch, setUserSearch]     = useState('');
  const [roleFilter, setRoleFilter]     = useState('all');
  const [changingRole, setChangingRole] = useState({}); // { userId: true }
  const [openRoleMenu, setOpenRoleMenu] = useState(null);

  const h = { Authorization: `Bearer ${token}` };


  // Dans le composant, avec les autres states
    const roleMenuBtnRefs = useRef({});  // un ref par user

    const openRoleDropdown = (userId) => {
    const btn = roleMenuBtnRefs.current[userId];
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    setOpenRoleMenu({ id: userId, top: rect.bottom + 4, right: window.innerWidth - rect.right });
    };

    // Fermer en cliquant ailleurs
    useEffect(() => {
    if (!openRoleMenu) return;
    const close = () => setOpenRoleMenu(null);
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
    }, [openRoleMenu]);

  // ── Chargement ─────────────────────────────────────────────
  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [admRes, usrRes] = await Promise.all([
        fetch(`${API}/admin/team`, { headers: h }).then(r => r.ok ? r.json() : []),
        fetch(`${API}/admin/users`, { headers: h }).then(r => r.ok ? r.json() : []),
      ]);
      setAdmins(Array.isArray(admRes) ? admRes : []);
      setAllUsers(Array.isArray(usrRes) ? usrRes : []);
    } catch { showFeedback('Erreur de chargement', true); }
    setLoading(false);
  };

  // ─────────────────────────────────────────────────────────
  // HANDLERS ADMINS
  // ─────────────────────────────────────────────────────────

  const generatePassword = () => {
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$';
    const pwd = Array.from({ length: 12 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    setNewPassword(pwd);
    setShowPwd(true);
  };

  const createAdmin = async (e) => {
    e.preventDefault();
    if (!newEmail.trim() || !newPassword.trim() || !newSecret.trim())
      return showFeedback('Email, mot de passe et secret requis', true);
    setCreating(true);
    try {
      const body = { email: newEmail.trim(), password: newPassword.trim(), secret: newSecret.trim() };
      if (newNom.trim()) body.nom = newNom.trim();
      const res  = await fetch(`${API}/admin/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Erreur création — secret incorrect ?');
      // Ajouter à la liste locale avec les infos disponibles
      const newAdmin = { _id: data._id || data.id || Date.now(), nom: newNom.trim() || newEmail.trim(), email: newEmail.trim(), createdAt: new Date().toISOString(), ...data };
      setAdmins(prev => [...prev, newAdmin]);
      setNewNom(''); setNewEmail(''); setNewPassword(''); setNewSecret('');
      setShowAddForm(false);
      showFeedback(`Admin "${newAdmin.nom}" créé avec succès !`);
    } catch (err) { showFeedback(err.message, true); }
    setCreating(false);
  };

  const openEdit = (admin) => {
    setEditingAdmin(admin);
    setEditNom(admin.nom || '');
    setEditEmail(admin.email || '');
    setEditPwd('');
    setEditIsPrimary(admin.isPrimary || false);
  };

  const saveEdit = async (e) => {
    e.preventDefault();
    if (!editNom.trim() || !editEmail.trim()) return showFeedback('Nom et email requis', true);
    setSaving(true);
    try {
      const body = { nom: editNom.trim(), email: editEmail.trim(), isPrimary: editIsPrimary };
      if (editPwd.trim()) body.password = editPwd.trim();
      const res  = await fetch(`${API}/admin/team/${editingAdmin._id}`, {
        method: 'PUT',
        headers: { ...h, 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Erreur mise à jour');
      setAdmins(prev => prev.map(a => a._id === editingAdmin._id ? { ...a, ...data } : a));
      setEditingAdmin(null);
      showFeedback('Admin mis à jour !');
    } catch (err) { showFeedback(err.message, true); }
    setSaving(false);
  };

  const deleteAdmin = (admin) => {
    if (admin._id === currentAdminId) return showFeedback('Vous ne pouvez pas supprimer votre propre compte', true);
    if (admin.isPrimary && !isPrimary) return showFeedback('Seul un admin primaire peut supprimer un autre admin primaire', true);
    setConfirm({
      title: `Supprimer l'admin "${admin.nom}" ?`,
      message: 'Cette action est irréversible. L\'admin n\'aura plus accès à la plateforme.',
      confirmLabel: 'Supprimer',
      variant: 'danger',
      onConfirm: async () => {
        try {
          const res = await fetch(`${API}/admin/team/${admin._id}`, { method: 'DELETE', headers: h });
          if (!res.ok) throw new Error((await res.json()).message);
          setAdmins(prev => prev.filter(a => a._id !== admin._id));
          showFeedback(`Admin "${admin.nom}" supprimé`);
        } catch (err) { showFeedback(err.message, true); }
      }
    });
  };

  const revokeSession = (admin) => {
    setConfirm({
      title: `Révoquer la session de "${admin.nom}" ?`,
      message: 'L\'admin sera déconnecté immédiatement.',
      confirmLabel: 'Révoquer',
      variant: 'danger',
      onConfirm: async () => {
        try {
          await fetch(`${API}/admin/team/${admin._id}/revoke`, { method: 'POST', headers: h });
          showFeedback('Session révoquée');
        } catch { showFeedback('Erreur', true); }
      }
    });
  };

  // ─────────────────────────────────────────────────────────
  // HANDLERS RÔLES
  // ─────────────────────────────────────────────────────────

  const changeRole = async (userId, currentRole, newRole) => {
    if (currentRole === newRole) { setOpenRoleMenu(null); return; }
    setConfirm({
      title: `Changer le rôle ?`,
      message: `Passer de "${ROLES.find(r=>r.key===currentRole)?.label}" à "${ROLES.find(r=>r.key===newRole)?.label}" ?`,
      confirmLabel: 'Confirmer',
      variant: 'warning',
      onConfirm: async () => {
        setChangingRole(p => ({ ...p, [userId]: true }));
        try {
          const res  = await fetch(`${API}/admin/users/${userId}/role`, {
            method: 'PUT',
            headers: { ...h, 'Content-Type': 'application/json' },
            body: JSON.stringify({ role: newRole })
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.message || 'Erreur');
          setAllUsers(prev => prev.map(u => u._id === userId ? { ...u, role: newRole } : u));
          showFeedback(`Rôle mis à jour → ${ROLES.find(r=>r.key===newRole)?.label}`);
        } catch (err) { showFeedback(err.message, true); }
        setChangingRole(p => ({ ...p, [userId]: false }));
        setOpenRoleMenu(null);
      }
    });
  };

  // ── Filtrage users ─────────────────────────────────────────
  const filteredUsers = allUsers.filter(u => {
    const matchSearch = !userSearch ||
      u.nom?.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email?.toLowerCase().includes(userSearch.toLowerCase());
    const matchRole = roleFilter === 'all' || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  const roleCounts = ROLES.reduce((acc, r) => {
    acc[r.key] = allUsers.filter(u => u.role === r.key).length;
    return acc;
  }, {});

  // ─────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────
  return (
    <div className="space-y-5 animate-in fade-in duration-400 mx-auto">

      <ConfirmModal config={confirm} onClose={() => setConfirm(null)}/>

      {/* ── Header ── */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-red-600/20 border border-red-500/20 rounded-2xl flex items-center justify-center shrink-0">
          <Shield size={22} className="text-red-400"/>
        </div>
        <div>
          <h1 className="text-xl font-black">Gestion de l'équipe</h1>
          <p className="text-xs text-zinc-500">
            {admins.length} admin{admins.length > 1 ? 's' : ''} ·{' '}
            {allUsers.length} compte{allUsers.length > 1 ? 's' : ''} au total
          </p>
        </div>
      </div>

      {/* ── Feedback ── */}
      {feedback && (
        <div className={`px-4 py-3 rounded-xl text-xs font-bold flex items-center gap-2 ${
          feedback.type === 'success'
            ? 'bg-green-500/10 border border-green-500/20 text-green-400'
            : 'bg-red-500/10 border border-red-500/20 text-red-400'
        }`}>
          {feedback.type === 'success' ? <Check size={13}/> : <AlertCircle size={13}/>}
          {feedback.text}
        </div>
      )}

      {/* ── Tabs ── */}
      <div className="flex gap-1 bg-zinc-900/40 border border-zinc-800/50 rounded-xl p-1">
        {[
          { k: 'admins', icon: <Shield size={13}/>, label: `Admins (${admins.length})` },
          { k: 'roles',  icon: <Users size={13}/>,  label: `Rôles (${allUsers.length})`  },
        ].map(t => (
          <button key={t.k} onClick={() => setTab(t.k)}
            className={`flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg text-xs font-bold transition ${
              tab === t.k ? 'bg-red-600 text-white' : 'text-zinc-500 hover:text-white hover:bg-zinc-800/60'
            }`}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48 text-zinc-500">
          <Loader2 size={24} className="animate-spin mr-2"/> Chargement...
        </div>
      ) : (
        <>
          {/* ══════════════════════════════════════
              TAB: ADMINS
          ══════════════════════════════════════ */}
          {tab === 'admins' && (
            <div className="space-y-4">

              {/* Bouton ajouter */}
              {!showAddForm && (
                <button onClick={() => setShowAddForm(true)}
                  className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-500 text-white font-bold py-3 rounded-2xl text-sm transition active:scale-[0.98]">
                  <UserPlus size={15}/> Ajouter un administrateur
                </button>
              )}

              {/* Formulaire création ─────────────────── */}
              {showAddForm && (
                <div className="bg-zinc-900/60 border border-red-500/20 rounded-2xl overflow-hidden">
                  <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-zinc-800/50 bg-red-500/5">
                    <div className="w-7 h-7 rounded-lg bg-red-500/15 text-red-400 flex items-center justify-center shrink-0">
                      <UserPlus size={14}/>
                    </div>
                    <h3 className="font-black text-xs uppercase tracking-widest flex-1 text-red-300">Nouvel administrateur</h3>
                    <button onClick={() => setShowAddForm(false)} className="text-zinc-600 hover:text-white p-1 rounded-lg hover:bg-zinc-800 transition">
                      <X size={14}/>
                    </button>
                  </div>
                  <form onSubmit={createAdmin} className="p-5 space-y-4">

                    {/* Nom (optionnel) + Email */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-1.5">
                          Nom <span className="text-zinc-600 normal-case font-normal">(optionnel)</span>
                        </label>
                        <input value={newNom} onChange={e => setNewNom(e.target.value)}
                          placeholder="Jean Dupont"
                          className="w-full bg-zinc-800 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-1 ring-red-600 text-white placeholder-zinc-600"/>
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-1.5">Email *</label>
                        <input type="text" value={newEmail} onChange={e => setNewEmail(e.target.value)} required
                          placeholder="nandrian@admin"
                          className="w-full bg-zinc-800 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-1 ring-red-600 text-white placeholder-zinc-600"/>
                      </div>
                    </div>

                    {/* Mot de passe */}
                    <div>
                      <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-1.5">Mot de passe *</label>
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <input type={showPwd ? 'text' : 'password'} value={newPassword}
                            onChange={e => setNewPassword(e.target.value)} required
                            placeholder="••••••••"
                            className="w-full bg-zinc-800 rounded-xl px-4 py-2.5 pr-10 text-sm outline-none focus:ring-1 ring-red-600 text-white placeholder-zinc-600 font-mono"/>
                          <button type="button" onClick={() => setShowPwd(p => !p)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition">
                            {showPwd ? <EyeOff size={14}/> : <Eye size={14}/>}
                          </button>
                        </div>
                        <button type="button" onClick={generatePassword}
                          className="px-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white rounded-xl transition text-xs font-bold flex items-center gap-1.5 shrink-0 border border-zinc-700">
                          <RefreshCw size={12}/> Générer
                        </button>
                        {newPassword && (
                          <button type="button" onClick={() => { navigator.clipboard?.writeText(newPassword); showFeedback('Mot de passe copié !'); }}
                            className="px-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white rounded-xl transition shrink-0 border border-zinc-700"
                            title="Copier">
                            <Copy size={12}/>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Secret */}
                    <div>
                      <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-1.5">
                        Code secret *
                        <span className="ml-2 text-zinc-600 font-normal normal-case">Requis par le serveur pour créer un admin</span>
                      </label>
                      <div className="relative">
                        <Key size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"/>
                        <input type={showSecret ? 'text' : 'password'} value={newSecret}
                          onChange={e => setNewSecret(e.target.value)} required
                          placeholder="Code secret d'enregistrement"
                          className="w-full bg-zinc-800 rounded-xl pl-9 pr-10 py-2.5 text-sm outline-none focus:ring-1 ring-red-600 text-white placeholder-zinc-600 font-mono"/>
                        <button type="button" onClick={() => setShowSecret(p => !p)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition">
                          {showSecret ? <EyeOff size={14}/> : <Eye size={14}/>}
                        </button>
                      </div>
                      <p className="text-[10px] text-zinc-600 mt-1 flex items-center gap-1">
                        <AlertTriangle size={9}/> Ce secret est défini côté serveur (variable d'environnement).
                      </p>
                    </div>

                    <div className="flex gap-2 pt-1">
                      <button type="submit" disabled={creating}
                        className="flex-1 bg-red-600 hover:bg-red-500 text-white font-bold py-2.5 rounded-xl text-sm transition flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.98]">
                        {creating ? <Loader2 size={14} className="animate-spin"/> : <UserPlus size={14}/>}
                        {creating ? 'Création...' : 'Créer l\'administrateur'}
                      </button>
                      <button type="button" onClick={() => setShowAddForm(false)}
                        className="px-4 text-zinc-400 hover:text-white text-sm rounded-xl hover:bg-zinc-800 transition">
                        Annuler
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Formulaire édition ─────────────────── */}
              {editingAdmin && (
                <div className="bg-zinc-900/60 border border-blue-500/20 rounded-2xl overflow-hidden">
                  <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-zinc-800/50 bg-blue-500/5">
                    <div className="w-7 h-7 rounded-lg bg-blue-500/15 text-blue-400 flex items-center justify-center shrink-0">
                      <Edit3 size={14}/>
                    </div>
                    <h3 className="font-black text-xs uppercase tracking-widest flex-1 text-blue-300">Modifier — {editingAdmin.nom}</h3>
                    <button onClick={() => setEditingAdmin(null)} className="text-zinc-600 hover:text-white p-1 rounded-lg hover:bg-zinc-800 transition">
                      <X size={14}/>
                    </button>
                  </div>
                  <form onSubmit={saveEdit} className="p-5 space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-1.5">Nom *</label>
                        <input value={editNom} onChange={e => setEditNom(e.target.value)} required
                          className="w-full bg-zinc-800 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-1 ring-blue-600 text-white"/>
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-1.5">Email *</label>
                        <input type="email" value={editEmail} onChange={e => setEditEmail(e.target.value)} required
                          className="w-full bg-zinc-800 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-1 ring-blue-600 text-white"/>
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-1.5">Nouveau mot de passe <span className="text-zinc-600 font-normal normal-case">(laisser vide = inchangé)</span></label>
                      <div className="relative">
                        <input type={showEditPwd ? 'text' : 'password'} value={editPwd}
                          onChange={e => setEditPwd(e.target.value)} placeholder="••••••••"
                          className="w-full bg-zinc-800 rounded-xl px-4 py-2.5 pr-10 text-sm outline-none focus:ring-1 ring-blue-600 text-white placeholder-zinc-600 font-mono"/>
                        <button type="button" onClick={() => setShowEditPwd(p => !p)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition">
                          {showEditPwd ? <EyeOff size={14}/> : <Eye size={14}/>}
                        </button>
                      </div>
                    </div>

                    {isPrimary && editingAdmin._id !== currentAdminId && (
                      <div>
                        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2">Niveau</label>
                        <div className="flex gap-2">
                          <button type="button" onClick={() => setEditIsPrimary(false)}
                            className={`flex-1 py-2 rounded-xl text-xs font-bold border transition ${!editIsPrimary ? 'bg-red-600 border-red-600 text-white' : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-white'}`}>
                            <Shield size={12} className="inline mr-1.5"/> Standard
                          </button>
                          <button type="button" onClick={() => setEditIsPrimary(true)}
                            className={`flex-1 py-2 rounded-xl text-xs font-bold border transition ${editIsPrimary ? 'bg-yellow-600 border-yellow-600 text-white' : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-white'}`}>
                            <Crown size={12} className="inline mr-1.5"/> Primaire
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2 pt-1">
                      <button type="submit" disabled={saving}
                        className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 rounded-xl text-sm transition flex items-center justify-center gap-2 disabled:opacity-50">
                        {saving ? <Loader2 size={14} className="animate-spin"/> : <Save size={14}/>}
                        Enregistrer
                      </button>
                      <button type="button" onClick={() => setEditingAdmin(null)}
                        className="px-4 text-zinc-400 hover:text-white text-sm rounded-xl hover:bg-zinc-800 transition">
                        Annuler
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Liste des admins ──────────────────── */}
              <div className="space-y-3">
                {admins.length === 0 ? (
                  <div className="text-center py-12 text-zinc-600">
                    <Shield size={36} className="mx-auto mb-3 opacity-20"/>
                    <p className="text-sm">Aucun administrateur trouvé</p>
                  </div>
                ) : admins.map(admin => {
                  const isMe = admin._id === currentAdminId;
                  return (
                    <div key={admin._id}
                      className={`bg-zinc-900/60 border rounded-2xl p-4 transition ${isMe ? 'border-red-500/30 bg-red-500/5' : 'border-zinc-800/60 hover:border-zinc-700/80'}`}>
                      <div className="flex items-start gap-3">
                        {/* Avatar */}
                        <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-base font-black shrink-0 ${admin.isPrimary ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/15 text-red-400'}`}>
                          {admin.isPrimary ? <Crown size={20}/> : (admin.nom || '?')[0].toUpperCase()}
                        </div>

                        {/* Infos */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-black">{admin.nom}</p>
                            {isMe && <span className="text-[9px] font-bold bg-red-600 text-white px-1.5 py-0.5 rounded-full">VOUS</span>}
                            {admin.isPrimary && (
                              <span className="text-[9px] font-bold bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 px-1.5 py-0.5 rounded-full flex items-center gap-1">
                                <Crown size={9}/> PRIMAIRE
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-zinc-500 mt-0.5">{admin.email}</p>
                          <div className="flex items-center gap-3 mt-1.5 text-[10px] text-zinc-600">
                            {admin.lastLogin && <span className="flex items-center gap-1"><Activity size={9}/> Dernière co. {fmtDate(admin.lastLogin)}</span>}
                            {admin.createdAt && <span className="flex items-center gap-1"><Clock size={9}/> Créé le {fmtDate(admin.createdAt)}</span>}
                          </div>
                        </div>

                        {/* Actions */}
                        {(isPrimary || isMe) && (
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button onClick={() => openEdit(admin)}
                              className="p-2 bg-zinc-800 hover:bg-blue-600 text-zinc-400 hover:text-white rounded-xl transition"
                              title="Modifier">
                              <Edit3 size={13}/>
                            </button>
                            {!isMe && isPrimary && (
                              <>
                                <button onClick={() => revokeSession(admin)}
                                  className="p-2 bg-zinc-800 hover:bg-orange-600 text-zinc-400 hover:text-white rounded-xl transition"
                                  title="Révoquer la session">
                                  <LogOut size={13}/>
                                </button>
                                <button onClick={() => deleteAdmin(admin)}
                                  className="p-2 bg-zinc-800 hover:bg-red-600 text-zinc-400 hover:text-white rounded-xl transition"
                                  title="Supprimer">
                                  <Trash2 size={13}/>
                                </button>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Note sécurité */}
              <div className="bg-zinc-900/40 border border-zinc-800/40 rounded-xl px-4 py-3 flex items-start gap-2.5">
                <ShieldCheck size={14} className="text-zinc-500 mt-0.5 shrink-0"/>
                <p className="text-[10px] text-zinc-600 leading-relaxed">
                  Les admins <strong className="text-zinc-500">primaires</strong> ont accès à la gestion de l'équipe admin.
                  Les admins <strong className="text-zinc-500">standard</strong> ont accès à toutes les autres fonctionnalités.
                  Révoquer une session déconnecte l'admin immédiatement.
                </p>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════
              TAB: RÔLES
          ══════════════════════════════════════ */}
          {tab === 'roles' && (
            <div className="space-y-4">

              {/* Stats rôles */}
              <div className="grid grid-cols-3 gap-3">
                {ROLES.map(r => (
                  <div key={r.key} className={`rounded-2xl border p-4 ${r.bg}`}>
                    <div className="flex items-center gap-2 mb-1.5">
                      {r.icon}
                      <span className="text-[10px] font-bold uppercase tracking-widest">{r.label}</span>
                    </div>
                    <p className="text-2xl font-black">{roleCounts[r.key] || 0}</p>
                  </div>
                ))}
              </div>

              {/* Filtres */}
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={13}/>
                  <input value={userSearch} onChange={e => setUserSearch(e.target.value)}
                    placeholder="Rechercher un compte..."
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-8 pr-4 py-2.5 text-xs outline-none focus:ring-1 ring-red-600 text-white placeholder-zinc-600"/>
                </div>
                <div className="flex gap-1 bg-zinc-900 border border-zinc-800 rounded-xl p-1">
                  <button onClick={() => setRoleFilter('all')}
                    className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition ${roleFilter === 'all' ? 'bg-zinc-700 text-white' : 'text-zinc-500 hover:text-white'}`}>
                    Tous
                  </button>
                  {ROLES.map(r => (
                    <button key={r.key} onClick={() => setRoleFilter(r.key)}
                      className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition flex items-center gap-1 ${roleFilter === r.key ? 'bg-zinc-700 text-white' : 'text-zinc-500 hover:text-white'}`}>
                      {r.icon} <span className="hidden sm:inline">{r.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Liste */}
              <div className="bg-zinc-900/60 border border-zinc-800/60 rounded-2xl overflow-auto ">
                <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-zinc-800/50">
                  <div className="w-7 h-7 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center shrink-0">
                    <Users size={14}/>
                  </div>
                  <h3 className="font-black text-xs uppercase tracking-widest flex-1">Comptes</h3>
                  <span className="text-[10px] font-bold bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded-full">{filteredUsers.length}</span>
                </div>

                <div className="divide-y divide-zinc-800/50">
                  {filteredUsers.length === 0 ? (
                    <div className="text-center py-10 text-zinc-600">
                      <Search size={28} className="mx-auto mb-2 opacity-20"/>
                      <p className="text-sm">Aucun résultat</p>
                    </div>
                  ) : filteredUsers.map(user => {
                    const isCurrentAdmin = user._id === currentAdminId;
                    return (
                      <div key={user._id} className="flex items-center gap-3 px-5 py-3 hover:bg-zinc-800/30 transition group">
                        {/* Avatar */}
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-black shrink-0 overflow-hidden ${
                          user.role === 'admin'  ? 'bg-red-500/20 text-red-400' :
                          user.role === 'artist' ? 'bg-purple-500/20 text-purple-400' :
                                                   'bg-blue-500/20 text-blue-400'}`}>
                          {user.avatar
                            ? <img src={user.avatar} className="w-full h-full object-cover" alt=""/>
                            : (user.nom || '?')[0].toUpperCase()
                          }
                        </div>

                        {/* Infos */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className="text-xs font-bold truncate">{user.nom || 'Utilisateur'}</p>
                            {user.banned && <span className="text-[9px] font-bold bg-red-500/15 text-red-400 px-1.5 py-0.5 rounded-full">BANNI</span>}
                          </div>
                          <p className="text-[10px] text-zinc-500 truncate">{user.email}</p>
                        </div>

                        {/* Rôle actuel */}
                        <RoleBadge role={user.role}/>

                        {/* Sélecteur de rôle */}
                        {!isCurrentAdmin && (
                        <div className="relative shrink-0">
                            <button
                            ref={el => roleMenuBtnRefs.current[user._id] = el}
                            onClick={() => openRoleDropdown(user._id)}
                            disabled={!!changingRole[user._id]}
                            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-xl text-xs text-zinc-400 hover:text-white transition disabled:opacity-50">
                            {changingRole[user._id]
                                ? <Loader2 size={11} className="animate-spin"/>
                                : <><ArrowUpDown size={11}/> <span className="hidden sm:inline">Changer</span></>
                            }
                            </button>

                            {openRoleMenu?.id === user._id && createPortal(
                            <div
                                onMouseDown={e => e.stopPropagation()}
                                style={{ top: openRoleMenu.top, right: openRoleMenu.right }}
                                className="fixed z-[9999] bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl overflow-hidden min-w-[160px]">
                                <div className="px-3 py-2 border-b border-zinc-800">
                                <p className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest">Choisir un rôle</p>
                                </div>
                                {ROLES.map(r => (
                                <button key={r.key}
                                    onClick={() => { changeRole(user._id, user.role, r.key); setOpenRoleMenu(null); }}
                                    className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-xs font-bold transition hover:bg-zinc-800 ${user.role === r.key ? 'text-white bg-zinc-800' : 'text-zinc-400 hover:text-white'}`}>
                                    <span className={`${r.bg} border rounded-md w-5 h-5 flex items-center justify-center`}>{r.icon}</span>
                                    {r.label}
                                    {user.role === r.key && <Check size={11} className="ml-auto text-green-400"/>}
                                </button>
                                ))}
                            </div>,
                            document.body
                            )}
                        </div>
                        )}

                        {isCurrentAdmin && (
                          <span className="text-[9px] text-zinc-600 italic shrink-0">Vous</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Légende des rôles */}
              <div className="bg-zinc-900/40 border border-zinc-800/40 rounded-xl p-4 space-y-2.5">
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Permissions par rôle</p>
                <div className="space-y-2">
                  {[
                    { role: 'user',   perms: 'Écouter, créer des playlists, suivre des artistes, acheter des billets' },
                    { role: 'artist', perms: 'Uploader des musiques, albums, stories, événements, newsletter fans' },
                    { role: 'admin',  perms: 'Accès complet à la plateforme, modération, gestion du contenu' },
                  ].map(({ role, perms }) => (
                    <div key={role} className="flex items-start gap-2.5">
                      <RoleBadge role={role}/>
                      <p className="text-[10px] text-zinc-500 pt-0.5">{perms}</p>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AdminTeamView;