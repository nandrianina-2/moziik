import React, { useState, useEffect, useRef } from 'react';
import {
  Settings, Bell, WifiOff, Volume2, Sliders, Shield,
  Users, Trash2, Plus, Save, Check, X, Loader2, Key,
  Eye, EyeOff, Info, ChevronRight, Download, Music,
  RefreshCw, AlertCircle, CheckCircle, Palette, Mic2
} from 'lucide-react';
import { API } from '../config/api';
import ConfirmDialog, { useConfirm } from '../components/ui/ConfirmDialog';

// ── Section wrapper ──────────────────────────
const Section = ({ icon, title, children }) => (
  <div className="bg-zinc-900/60 border border-zinc-800/50 rounded-2xl overflow-hidden">
    <div className="flex items-center gap-2.5 px-5 py-4 border-b border-zinc-800/50">
      <div className="w-7 h-7 rounded-lg bg-zinc-800 flex items-center justify-center text-red-400 shrink-0">{icon}</div>
      <h3 className="font-black text-sm uppercase tracking-widest">{title}</h3>
    </div>
    <div className="p-5 space-y-4">{children}</div>
  </div>
);

// ── Toggle row ────────────────────────────────
const ToggleRow = ({ label, sub, checked, onChange, disabled }) => (
  <div className="flex items-center justify-between gap-4">
    <div>
      <p className="text-sm font-bold">{label}</p>
      {sub && <p className="text-[11px] text-zinc-500 mt-0.5">{sub}</p>}
    </div>
    <button
      onClick={() => !disabled && onChange(!checked)}
      disabled={disabled}
      className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${checked ? 'bg-red-600' : 'bg-zinc-700'} ${disabled ? 'opacity-40' : 'cursor-pointer'}`}>
      <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${checked ? 'translate-x-5' : ''}`}/>
    </button>
  </div>
);

// ── Téléchargements hors-ligne ────────────────
const OfflineDownloadsSection = ({ musiques, isAudioCached, cachedIds, removeCached, cacheAudio }) => {
  const [downloading, setDownloading] = useState(new Set());
  const [removing, setRemoving] = useState(new Set());
  const { confirmDialog, ask, close } = useConfirm();

  const cached = (musiques || []).filter(s => isAudioCached && isAudioCached(s._id));

  const handleDownload = async (song) => {
    if (!cacheAudio) return;
    setDownloading(prev => new Set([...prev, song._id]));
    await cacheAudio(song);
    setDownloading(prev => { const s = new Set(prev); s.delete(song._id); return s; });
  };

  const handleRemove = (song) => {
    ask({
      title: `Supprimer "${song.titre}" du cache ?`,
      message: 'La musique ne sera plus disponible hors-ligne.',
      confirmLabel: 'Supprimer',
      variant: 'warning',
      onConfirm: async () => {
        setRemoving(prev => new Set([...prev, song._id]));
        await removeCached(song);
        setRemoving(prev => { const s = new Set(prev); s.delete(song._id); return s; });
      }
    });
  };

  return (
    <Section icon={<Download size={15}/>} title="Téléchargements hors-ligne">
      <ConfirmDialog config={confirmDialog} onClose={close} />

      {cached.length === 0 ? (
        <div className="text-center py-6 text-zinc-600">
          <WifiOff size={32} className="mx-auto mb-2 opacity-20" />
          <p className="text-sm">Aucun titre en cache</p>
          <p className="text-[11px] mt-1">Appuyez sur l'icône ↓ sur une musique pour l'écouter hors-ligne</p>
        </div>
      ) : (
        <>
          <p className="text-xs text-zinc-500">{cached.length} titre{cached.length > 1 ? 's' : ''} téléchargé{cached.length > 1 ? 's' : ''}</p>
          <div className="space-y-2">
            {cached.map(song => (
              <div key={song._id} className="flex items-center gap-3 p-3 bg-zinc-800/40 rounded-xl group">
                <img src={song.image} className="w-10 h-10 rounded-lg object-cover shrink-0" alt="" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold truncate">{song.titre}</p>
                  <p className="text-[10px] text-zinc-500 truncate uppercase">{song.artiste}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <span className="flex items-center gap-1 text-[10px] text-green-400 bg-green-500/10 px-2 py-0.5 rounded-full">
                    <Check size={9}/> Hors-ligne
                  </span>
                  {removing.has(song._id) ? (
                    <Loader2 size={14} className="animate-spin text-zinc-500 ml-1" />
                  ) : (
                    <button onClick={() => handleRemove(song)}
                      className="ml-1 p-1.5 text-zinc-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition opacity-0 group-hover:opacity-100">
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
          <button onClick={() => {
            ask({
              title: 'Tout supprimer du cache ?',
              message: 'Toutes les musiques téléchargées seront supprimées.',
              confirmLabel: 'Tout supprimer',
              variant: 'danger',
              onConfirm: async () => {
                for (const song of cached) await removeCached(song);
              }
            });
          }} className="w-full py-2 text-xs text-red-400 hover:bg-red-500/10 rounded-xl transition font-bold flex items-center justify-center gap-1.5">
            <Trash2 size={12}/> Tout supprimer
          </button>
        </>
      )}
    </Section>
  );
};

// ── Gestion admins (admin principal) ─────────
const AdminManagementSection = ({ token, isPrimary }) => {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ email: '', password: '', nom: '' });
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { confirmDialog, ask, close } = useConfirm();

  const load = async () => {
    if (!isPrimary) return;
    setLoading(true);
    try {
      const data = await fetch(`${API}/admin/admins`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json());
      setAdmins(Array.isArray(data) ? data : []);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { load(); }, [isPrimary]);

  const create = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) return setError('Email et mot de passe requis');
    setCreating(true); setError(''); setSuccess('');
    try {
      const res = await fetch(`${API}/admin/admins`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setSuccess('Admin créé !'); setForm({ email: '', password: '', nom: '' }); setShowForm(false); load();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) { setError(err.message); }
    finally { setCreating(false); }
  };

  const deleteAdmin = (admin) => {
    ask({
      title: `Supprimer l'admin "${admin.nom || admin.email}" ?`,
      message: 'Cet administrateur perdra tout accès à la plateforme.',
      confirmLabel: 'Supprimer',
      variant: 'danger',
      onConfirm: async () => {
        await fetch(`${API}/admin/admins/${admin._id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
        load();
      }
    });
  };

  if (!isPrimary) return (
    <Section icon={<Shield size={15}/>} title="Gestion des admins">
      <p className="text-sm text-zinc-500">Réservé à l'administrateur principal.</p>
    </Section>
  );

  return (
    <Section icon={<Shield size={15}/>} title="Gestion des admins">
      <ConfirmDialog config={confirmDialog} onClose={close} />
      {success && <div className="flex items-center gap-2 text-green-400 text-xs bg-green-500/10 border border-green-500/20 px-3 py-2.5 rounded-xl"><CheckCircle size={13}/>{success}</div>}
      {loading ? (
        <div className="flex items-center gap-2 text-zinc-600 py-4"><Loader2 size={16} className="animate-spin"/>Chargement...</div>
      ) : (
        <div className="space-y-2">
          {admins.map(admin => (
            <div key={admin._id} className="flex items-center gap-3 p-3 bg-zinc-800/40 rounded-xl group">
              <div className="w-8 h-8 rounded-full bg-red-600/20 flex items-center justify-center text-xs font-black text-red-400 shrink-0">
                {(admin.nom || admin.email)[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold truncate">{admin.nom || <span className="text-zinc-500 italic">Sans nom</span>}</p>
                <p className="text-[10px] text-zinc-500">{admin.email}</p>
              </div>
              {admin.isPrimary
                ? <span className="text-[9px] font-black text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full">PRINCIPAL</span>
                : <button onClick={() => deleteAdmin(admin)}
                    className="opacity-0 group-hover:opacity-100 p-1.5 text-zinc-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition">
                    <Trash2 size={13}/>
                  </button>
              }
            </div>
          ))}
        </div>
      )}

      {!showForm ? (
        <button onClick={() => setShowForm(true)}
          className="w-full py-2.5 border border-dashed border-zinc-700 hover:border-red-600/50 rounded-xl text-xs text-zinc-500 hover:text-white transition flex items-center justify-center gap-1.5">
          <Plus size={13}/> Ajouter un admin
        </button>
      ) : (
        <form onSubmit={create} className="space-y-3 border border-zinc-700/50 rounded-xl p-4 bg-zinc-800/30">
          <p className="text-xs font-bold text-zinc-400">Nouvel administrateur</p>
          {[['Nom (optionnel)', 'nom', 'text'], ['Email *', 'email', 'email'], ['Mot de passe *', 'password', 'password']].map(([label, key, type]) => (
            <div key={key}>
              <label className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest block mb-1">{label}</label>
              <input type={type} value={form[key]} onChange={e => setForm({...form, [key]: e.target.value})}
                className="w-full bg-zinc-800 rounded-xl px-3 py-2 text-sm outline-none focus:ring-1 ring-red-600 text-white" />
            </div>
          ))}
          {error && <p className="text-xs text-red-400">{error}</p>}
          <div className="flex gap-2">
            <button type="submit" disabled={creating}
              className="flex-1 bg-red-600 hover:bg-red-500 text-white font-bold py-2 rounded-xl text-xs transition flex items-center justify-center gap-1.5 disabled:opacity-50">
              {creating ? <Loader2 size={12} className="animate-spin"/> : <Plus size={12}/>} Créer
            </button>
            <button type="button" onClick={() => { setShowForm(false); setError(''); }}
              className="px-3 py-2 text-zinc-400 hover:text-white text-xs rounded-xl hover:bg-zinc-700 transition">Annuler</button>
          </div>
        </form>
      )}
    </Section>
  );
};

// ════════════════════════════════════════════
// SETTINGS VIEW
// ════════════════════════════════════════════
const SettingsView = ({
  token, isAdmin, isLoggedIn, userNom, userEmail, userRole,
  isPrimary = false,
  // Préférences locales
  musiques,
  isAudioCached, cachedIds, cacheAudio, removeCached,
}) => {
  // Préférences stockées localement
  const [prefs, setPrefs] = useState(() => {
    try { return JSON.parse(localStorage.getItem('moozik_prefs') || '{}'); } catch { return {}; }
  });

  const updatePref = (key, val) => {
    const next = { ...prefs, [key]: val };
    setPrefs(next);
    localStorage.setItem('moozik_prefs', JSON.stringify(next));
  };

  // Info app
  const [appInfo, setAppInfo] = useState(null);
  useEffect(() => {
    if (!isAdmin || !token) return;
    fetch(`${API}/admin/stats`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : null).then(d => d && setAppInfo(d)).catch(() => {});
  }, [isAdmin, token]);

  return (
    <div className="w-full mx-auto space-y-5 pb-10 animate-in fade-in duration-500">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 bg-zinc-800 rounded-2xl flex items-center justify-center">
          <Settings size={18} className="text-red-400" />
        </div>
        <div>
          <h1 className="text-xl font-black">Paramètres</h1>
          <p className="text-xs text-zinc-500">Personnalisez votre expérience</p>
        </div>
      </div>

      {/* ── Lecture ── */}
      <Section icon={<Volume2 size={15}/>} title="Lecture">
        <ToggleRow label="Démarrage automatique" sub="Lancer la lecture au chargement de l'app"
          checked={!!prefs.autoplay} onChange={v => updatePref('autoplay', v)} />
        <ToggleRow label="Lecture continue" sub="Enchaîner automatiquement les titres"
          checked={prefs.continuous !== false} onChange={v => updatePref('continuous', v)} />
        <ToggleRow label="Fondu enchaîné" sub="Transition douce entre les titres (crossfade)"
          checked={!!prefs.crossfade} onChange={v => updatePref('crossfade', v)} />
        <ToggleRow label="Normalisation audio" sub="Égaliser le volume entre les titres"
          checked={!!prefs.normalization} onChange={v => updatePref('normalization', v)} />
      </Section>

      {/* ── Notifications ── */}
      {isLoggedIn && (
        <Section icon={<Bell size={15}/>} title="Notifications">
          <ToggleRow label="Nouveaux titres" sub="Être notifié lors d'un nouvel ajout"
            checked={prefs.notif_new_song !== false} onChange={v => updatePref('notif_new_song', v)} />
          <ToggleRow label="Commentaires" sub="Notifier quand quelqu'un commente"
            checked={prefs.notif_comments !== false} onChange={v => updatePref('notif_comments', v)} />
          <ToggleRow label="Réactions" sub="Notifier pour les ❤️ sur mes musiques"
            checked={prefs.notif_reactions !== false} onChange={v => updatePref('notif_reactions', v)} />
          <ToggleRow label="Nouveaux albums" sub="Être notifié lors d'un nouvel album"
            checked={prefs.notif_albums !== false} onChange={v => updatePref('notif_albums', v)} />
        </Section>
      )}

      {/* ── Affichage ── */}
      <Section icon={<Palette size={15}/>} title="Affichage">
        <ToggleRow label="Thème dynamique" sub="Changer la couleur selon la pochette en cours"
          checked={prefs.dynamic_theme !== false} onChange={v => updatePref('dynamic_theme', v)} />
        <ToggleRow label="Animations" sub="Animations et transitions"
          checked={prefs.animations !== false} onChange={v => updatePref('animations', v)} />
        <ToggleRow label="Afficher le compte d'écoutes" sub="Visible sur chaque titre"
          checked={prefs.show_plays !== false} onChange={v => updatePref('show_plays', v)} />
        <ToggleRow label="Fond ambiant (mini player)" sub="Effet de flou coloré sur mobile"
          checked={prefs.ambient_bg !== false} onChange={v => updatePref('ambient_bg', v)} />
      </Section>

      {/* ── Hors-ligne ── */}
      <OfflineDownloadsSection
        musiques={musiques} isAudioCached={isAudioCached}
        cachedIds={cachedIds} removeCached={removeCached} cacheAudio={cacheAudio}
      />

      {/* ── Gestion admins ── */}
      {isAdmin && (
        <AdminManagementSection token={token} isPrimary={isPrimary} />
      )}

      {/* ── Infos app ── */}
      <Section icon={<Info size={15}/>} title="À propos">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center shadow-lg shadow-red-600/30">
            <Music size={18} className="text-white" />
          </div>
          <div>
            <p className="font-black text-sm">MOOZIK</p>
            <p className="text-[11px] text-zinc-500">Version 2.0</p>
          </div>
        </div>
        {appInfo && (
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'Titres', value: appInfo.totalSongs },
              { label: 'Artistes', value: appInfo.totalArtists },
              { label: 'Utilisateurs', value: appInfo.totalUsers },
            ].map(s => (
              <div key={s.label} className="bg-zinc-800/40 rounded-xl p-3 text-center">
                <p className="text-lg font-black">{s.value?.toLocaleString()}</p>
                <p className="text-[10px] text-zinc-500 uppercase tracking-wide">{s.label}</p>
              </div>
            ))}
          </div>
        )}
        <div className="space-y-1 text-xs text-zinc-600 mt-2">
          <p>Connecté en tant que : <span className="text-zinc-400 font-bold">{userEmail}</span></p>
          <p>Rôle : <span className="text-zinc-400 font-bold capitalize">{userRole}</span></p>
          {isAdmin && isPrimary && <p className="text-red-400">👑 Administrateur principal</p>}
        </div>
        <button onClick={() => { localStorage.removeItem('moozik_prefs'); window.location.reload(); }}
          className="w-full mt-2 py-2.5 text-xs text-zinc-500 hover:text-white hover:bg-zinc-800 rounded-xl transition flex items-center justify-center gap-1.5 border border-zinc-800">
          <RefreshCw size={12}/> Réinitialiser les préférences
        </button>
      </Section>
    </div>
  );
};

export default SettingsView;