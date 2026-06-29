import React, { useState, useEffect, useRef } from 'react';
import {
  Send, Users, CheckCircle, Star, Link2, Calendar, Music,
  Plus, Trash2, Save, Loader2, Check, AlertCircle, X, Eye, Clock,
  Bell, BarChart2, ExternalLink, DollarSign, Image as ImageIcon,
  Ticket, Camera, MapPin, Video, Volume2, FileText, Mic2,
  ChevronRight, Globe
} from 'lucide-react';
import { API } from '../config/api';
import ConfirmDialog, { useConfirm } from '../components/ui/ConfirmDialog';
import { FaInstagram, FaYoutube, FaXTwitter, FaFacebook, FaTiktok } from 'react-icons/fa6';
import { RoyaltiesDashboard } from '../components/RevenueComponents';
import ArtistAnalyticsView from './ArtistAnalyticsView';

// ── Section wrapper ──────────────────────────
const Section = ({ icon, title, children }) => (
  <div className="bg-zinc-900/60 border border-zinc-800/50 rounded-2xl overflow-hidden">
    <div className="flex items-center gap-2.5 px-5 py-4 border-b border-zinc-800/50">
      <div className="w-7 h-7 rounded-lg bg-zinc-800 flex items-center justify-center text-red-400 shrink-0">{icon}</div>
      <h3 className="font-black text-sm uppercase tracking-widest">{title}</h3>
    </div>
    <div className="p-5">{children}</div>
  </div>
);

// ════════════════════════════════════════════
// ARTIST DASHBOARD
// ════════════════════════════════════════════
const ArtistDashboard = ({ token, userArtistId, userNom }) => {
  const [tab, setTab] = useState('newsletter');

  // ── Données partagées ──
  const [followers, setFollowers] = useState({ count: 0, followers: [] });
  const [campaigns, setCampaigns] = useState([]);
  const [cert, setCert]           = useState(null);
  const [smartLink, setSmartLink] = useState(null);
  const [scheduled, setScheduled] = useState([]);
  const [songs, setSongs]         = useState([]);
  const [events, setEvents]       = useState([]);
  const [stories, setStories]     = useState([]);
  const [loading, setLoading]     = useState(false);
  const [success, setSuccess]     = useState('');
  const [error, setError]         = useState('');
  const { confirmDialog, ask, close } = useConfirm();
  // const [feedback, setFeedback] = useState(null);

  // ── Newsletter ──
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  // ── Smart Link ──
  const [slug, setSlug]           = useState('');
  const [customBio, setCustomBio] = useState('');
  const [socials, setSocials]     = useState({ instagram:'', youtube:'', tiktok:'', twitter:'', facebook:'' });
  const [savingLink, setSavingLink] = useState(false);

  // ── Stories ──
  const [storyFile, setStoryFile]       = useState(null);
  const [storyPreview, setStoryPreview] = useState('');
  const [storyCaption, setStoryCaption] = useState('');
  const [storyDuration, setStoryDuration] = useState(30);
  const [uploadingStory, setUploadingStory] = useState(false);
  const storyFileRef = useRef();

  // ── Événements ──
  const [showEventForm, setShowEventForm] = useState(false);
  const [eventForm, setEventForm] = useState({
    title: '', description: '', venue: '', city: '', country: '',
    date: '', ticketPrice: '', ticketCapacity: '', ticketCurrency: 'EUR'
  });
  const [eventImg, setEventImg]     = useState(null);
  const [savingEvent, setSavingEvent] = useState(false);
  const eventImgRef = useRef();

  const h = { Authorization: `Bearer ${token}` };

  // ── Chargement initial ──
  useEffect(() => {
    if (!userArtistId) return;
    Promise.all([
      fetch(`${API}/artists/${userArtistId}/followers`,         { headers: h }).then(r => r.ok ? r.json() : null),
      fetch(`${API}/artists/${userArtistId}/newsletter/history`,{ headers: h }).then(r => r.ok ? r.json() : null),
      fetch(`${API}/artists/${userArtistId}/certification`,     { headers: h }).then(r => r.ok ? r.json() : null),
      fetch(`${API}/artists/${userArtistId}/smart-link`,        { headers: h }).then(r => r.ok ? r.json() : null),
      fetch(`${API}/artists/${userArtistId}/schedule`,          { headers: h }).then(r => r.ok ? r.json() : null),
      fetch(`${API}/songs?artisteId=${userArtistId}&limit=50`).then(r => r.json()),
      fetch(`${API}/events?artistId=${userArtistId}`).then(r => r.ok ? r.json() : []),
      fetch(`${API}/artists/${userArtistId}/stories`).then(r => r.ok ? r.json() : []),
    ]).then(([fol, camp, cer, sl, sched, songsData, evts, stor]) => {
      if (fol)  setFollowers(fol);
      if (camp) setCampaigns(camp);
      if (cer)  setCert(cer);
      if (sl)   { setSmartLink(sl); setSlug(sl.slug||''); setCustomBio(sl.customBio||''); setSocials(sl.socialLinks||{}); }
      if (sched) setScheduled(Array.isArray(sched) ? sched : []);
      if (songsData?.songs) setSongs(songsData.songs);
      setEvents(Array.isArray(evts) ? evts : []);
      setStories(Array.isArray(stor) ? stor : []);
    });
  }, [userArtistId]);

  const showFeedback = (msg, isError = false) => {
    if (isError) { setError(msg); setSuccess(''); }
    else         { setSuccess(msg); setError(''); }
    setTimeout(() => { setSuccess(''); setError(''); }, 4000);
  };

  // ════════════════════════════════════════════
  // HANDLERS
  // ════════════════════════════════════════════

  // Newsletter
  const sendNewsletter = async (e) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) return showFeedback('Sujet et message requis', true);
    setSending(true);
    try {
      const res  = await fetch(`${API}/artists/${userArtistId}/newsletter`, {
        method: 'POST', headers: { ...h, 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject: subject.trim(), message: message.trim() })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      showFeedback(`✅ Envoyé à ${data.sent} abonné${data.sent > 1 ? 's' : ''} !`);
      setSubject(''); setMessage('');
      setCampaigns(prev => [data.campaign, ...prev]);
    } catch (err) { showFeedback(err.message, true); }
    setSending(false);
  };

  // Smart Link
  const saveSmartLink = async (e) => {
    e.preventDefault();
    setSavingLink(true);
    try {
      const res  = await fetch(`${API}/artists/${userArtistId}/smart-link`, {
        method: 'PUT', headers: { ...h, 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, socialLinks: socials, customBio })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setSmartLink(data);
      showFeedback('Lien sauvegardé !');
    } catch (err) { showFeedback(err.message, true); }
    setSavingLink(false);
  };

  // Certification
  const requestCert = async () => {
    setLoading(true);
    const res = await fetch(`${API}/artists/${userArtistId}/certification`, {
      method: 'POST', headers: h
    }).then(r => r.json()).catch(() => null);
    if (res) setCert(res);
    setLoading(false);
  };

  // Story — sélectionner le fichier
  const handleStoryFile = (e) => {
    const f = e.target.files[0]; if (!f) return;
    setStoryFile(f);
    if (f.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => setStoryPreview(reader.result);
      reader.readAsDataURL(f);
    } else {
      setStoryPreview('');
    }
  };

  // Story — upload
  const uploadStory = async (e) => {
    e.preventDefault();
    if (!storyFile) return showFeedback('Sélectionnez un fichier', true);
    setUploadingStory(true);
    try {
      const fd = new FormData();
      fd.append('media', storyFile);
      fd.append('caption', storyCaption);
      fd.append('duration', String(storyDuration));
      const res  = await fetch(`${API}/artists/${userArtistId}/stories`, {
        method: 'POST', headers: h, body: fd
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setStories(prev => [data, ...prev]);
      setStoryFile(null); setStoryPreview(''); setStoryCaption(''); setStoryDuration(30);
      showFeedback('Story publiée ! Elle disparaîtra dans 24h 🎉');
    } catch (err) { showFeedback(err.message, true); }
    setUploadingStory(false);
  };

  // Story — supprimer
  const deleteStory = (storyId) => {
    ask({
      title: 'Supprimer cette story ?',
      message: 'Elle sera retirée immédiatement.',
      confirmLabel: 'Supprimer',
      variant: 'danger',
      onConfirm: async () => {
        try {
          const res = await fetch(`${API}/stories/${storyId}`, { 
            method: 'DELETE', 
            headers: h 
          });
          
          const data = await res.json();

          if (!res.ok) throw new Error(data.message);

          // Mise à jour de l'interface
          setStories(prev => prev.filter(s => s._id !== storyId));
          
          // Affichage du succès (comme pour l'upload)
          showFeedback(data.message || 'Story supprimée !');
          
        } catch (err) {
          // Affichage de l'erreur avec le paramètre true pour le style "danger"
          showFeedback(err.message, true);
        }
      }
    });
  };

  // Événement — créer
  const createEvent = async (e) => {
    e.preventDefault();
    if (!eventForm.title || !eventForm.venue || !eventForm.date || !eventForm.ticketPrice)
      return showFeedback('Titre, lieu, date et prix sont requis', true);
    setSavingEvent(true);
    try {
      const fd = new FormData();
      Object.entries(eventForm).forEach(([k, v]) => fd.append(k, v));
      if (eventImg) fd.append('image', eventImg);
      const res  = await fetch(`${API}/events`, { method: 'POST', headers: h, body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setEvents(prev => [data, ...prev]);
      setEventForm({ title:'', description:'', venue:'', city:'', country:'', date:'', ticketPrice:'', ticketCapacity:'', ticketCurrency:'EUR' });
      setEventImg(null); setShowEventForm(false);
      showFeedback('Événement créé ! Vos fans peuvent acheter des billets 🎫');
    } catch (err) { showFeedback(err.message, true); }
    setSavingEvent(false);
  };

  // Événement — supprimer
  const deleteEvent = (eventId, title) => {
    ask({
      title: `Supprimer "${title}" ?`,
      confirmLabel: 'Supprimer',
      variant: 'danger',
      onConfirm: async () => {
        await fetch(`${API}/events/${eventId}`, { method: 'DELETE', headers: h }).catch(() => {});
        setEvents(prev => prev.filter(e => e._id !== eventId));
      }
    });
  };

  // ── Tabs ──
  const tabs = [
    { k: 'newsletter', icon: <Send size={13}/>,        label: 'Newsletter'    },
    { k: 'smartlink',  icon: <Link2 size={13}/>,       label: 'Smart Link'    },
    { k: 'schedule',   icon: <Calendar size={13}/>,    label: 'Planning'      },
    { k: 'cert',       icon: <CheckCircle size={13}/>, label: 'Certification' },
    { k: 'revenus',    icon: <DollarSign size={13}/>,  label: 'Revenus'       },
    { k: 'stories',    icon: <Camera size={13}/>,      label: 'Stories'       },
    { k: 'events',     icon: <Ticket size={13}/>,      label: 'Événements'    },
    { k: 'analytics',  icon: <BarChart2 size={13}/>,   label: 'Analytics'     },
  ];

  const minDate = new Date(Date.now() + 3600000).toISOString().slice(0, 16);

  // ════════════════════════════════════════════
  // RENDER
  // ════════════════════════════════════════════
  return (
    <div className="space-y-5 animate-in fade-in duration-500">
      <ConfirmDialog config={confirmDialog} onClose={close} />

      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-purple-600/20 rounded-2xl flex items-center justify-center">
          <BarChart2 size={18} className="text-purple-400"/>
        </div>
        <div>
          <h1 className="text-xl font-black">Espace Artiste</h1>
          <p className="text-xs text-zinc-500">{userNom} · {followers.count} abonné{followers.count !== 1 ? 's' : ''}</p>
        </div>
      </div>

      {/* Tabs — scroll horizontal sur mobile */}
      <div className="flex gap-1 overflow-x-auto bg-zinc-900/40 border border-zinc-800/50 rounded-xl p-1" style={{ scrollbarWidth: 'none' }}>
        {tabs.map(t => (
          <button key={t.k} onClick={() => setTab(t.k)}
            className={`shrink-0 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition ${tab === t.k ? 'bg-red-600 text-white' : 'text-zinc-500 hover:text-white'}`}>
            {t.icon} <span className="hidden sm:inline">{t.label}</span>
          </button>
        ))}
      </div>

      {/* Feedback global */}
      {(success || error) && (
        <div className={`px-4 py-3 rounded-xl text-xs font-bold flex items-center gap-2 ${success ? 'bg-green-500/10 border border-green-500/20 text-green-400' : 'bg-red-500/10 border border-red-500/20 text-red-400'}`}>
          {success ? <Check size={13}/> : <AlertCircle size={13}/>} {success || error}
        </div>
      )}

      {/* ══════════════════════════════════════
          TAB: NEWSLETTER
      ══════════════════════════════════════ */}
      {tab === 'newsletter' && (
        <div className="space-y-4">
          <Section icon={<Users size={15}/>} title={`Abonnés (${followers.count})`}>
            {followers.followers.length === 0
              ? <p className="text-sm text-zinc-600 text-center py-4">Aucun abonné pour le moment</p>
              : <div className="space-y-2 max-h-48 overflow-y-auto">
                  {followers.followers.slice(0, 10).map(f => (
                    <div key={f._id} className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-zinc-800 flex items-center justify-center text-xs font-black text-zinc-400 shrink-0">
                        {(f.userId?.nom || '?')[0].toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold truncate">{f.userId?.nom || 'Utilisateur'}</p>
                        <p className="text-[10px] text-zinc-600 truncate">{f.userId?.email}</p>
                      </div>
                    </div>
                  ))}
                  {followers.count > 10 && <p className="text-[10px] text-zinc-600 text-center">+{followers.count - 10} autres</p>}
                </div>
            }
          </Section>

          <Section icon={<Send size={15}/>} title="Envoyer une newsletter">
            <form onSubmit={sendNewsletter} className="space-y-3">
              <div>
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-1.5">Sujet *</label>
                <input value={subject} onChange={e => setSubject(e.target.value)} required
                  placeholder="Nouveau single disponible !"
                  className="w-full bg-zinc-800 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-1 ring-red-600 text-white placeholder-zinc-600" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-1.5">Message *</label>
                <textarea value={message} onChange={e => setMessage(e.target.value)} required rows={4}
                  placeholder="Votre message pour vos fans..."
                  className="w-full bg-zinc-800 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-1 ring-red-600 text-white placeholder-zinc-600 resize-none" />
              </div>
              <button type="submit" disabled={sending || followers.count === 0}
                className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-2.5 rounded-xl text-sm transition flex items-center justify-center gap-2 disabled:opacity-50">
                {sending ? <Loader2 size={15} className="animate-spin"/> : <Send size={15}/>}
                {sending ? 'Envoi...' : `Envoyer à ${followers.count} abonné${followers.count !== 1 ? 's' : ''}`}
              </button>
            </form>
          </Section>

          {campaigns.length > 0 && (
            <Section icon={<Bell size={15}/>} title="Historique des campagnes">
              <div className="space-y-2">
                {campaigns.map(c => (
                  <div key={c._id} className="flex items-start gap-3 p-3 bg-zinc-800/40 rounded-xl">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold truncate">{c.subject}</p>
                      <p className="text-[10px] text-zinc-500 mt-0.5">
                        {new Date(c.sentAt).toLocaleDateString('fr-FR')} · {c.sentTo} envois
                      </p>
                    </div>
                    <span className="text-[9px] font-bold text-green-400 bg-green-500/10 px-2 py-0.5 rounded-full shrink-0">ENVOYÉ</span>
                  </div>
                ))}
              </div>
            </Section>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════
          TAB: SMART LINK
      ══════════════════════════════════════ */}
      {tab === 'smartlink' && (
        <Section icon={<Link2 size={15}/>} title="Votre Smart Link">
          <form onSubmit={saveSmartLink} className="space-y-4">
            <div>
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-1.5">Slug (URL) *</label>
              <div className="flex items-center gap-2 bg-zinc-800 rounded-xl px-4 py-2.5">
                <span className="text-zinc-500 text-sm shrink-0">moozik.app/a/</span>
                <input value={slug}
                  onChange={e => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, ''))}
                  required placeholder="nom-artiste"
                  className="flex-1 bg-transparent text-sm outline-none text-white placeholder-zinc-600" />
              </div>
              {smartLink && (
                <p className="text-[10px] text-green-400 mt-1 flex items-center gap-1">
                  <Check size={9}/> Actif · {smartLink.views} vues · {smartLink.clicks} clics
                </p>
              )}
            </div>
            <div>
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-1.5">Bio personnalisée</label>
              <textarea value={customBio} onChange={e => setCustomBio(e.target.value)} rows={3}
                placeholder="Description affichée sur votre page publique..."
                className="w-full bg-zinc-800 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-1 ring-red-600 text-white placeholder-zinc-600 resize-none" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2">Réseaux sociaux</label>
              <div className="space-y-2">
                {[
                  ['instagram', <FaInstagram size={14}/>, 'https://instagram.com/...'],
                  ['youtube',   <FaYoutube size={14}/>,   'https://youtube.com/...'],
                  ['tiktok',    <FaTiktok size={14}/>,    'https://tiktok.com/@...'],
                  ['twitter',   <FaXTwitter size={14}/>,  'https://twitter.com/...'],
                  ['facebook',  <FaFacebook size={14}/>,  'https://facebook.com/...'],
                ].map(([k, icon, ph]) => (
                  <div key={k} className="flex items-center gap-2 bg-zinc-800/60 rounded-xl px-3 py-2">
                    <div className="text-zinc-500 shrink-0 w-5 flex items-center justify-center">{icon}</div>
                    <input value={socials[k] || ''} onChange={e => setSocials(p => ({ ...p, [k]: e.target.value }))}
                      placeholder={ph} type="url"
                      className="flex-1 bg-transparent text-sm outline-none text-white placeholder-zinc-600" />
                  </div>
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <button type="submit" disabled={savingLink}
                className="flex-1 bg-red-600 hover:bg-red-500 text-white font-bold py-2.5 rounded-xl text-sm transition flex items-center justify-center gap-2 disabled:opacity-50">
                {savingLink ? <Loader2 size={14} className="animate-spin"/> : <Save size={14}/>}
                Sauvegarder
              </button>
              {smartLink && (
                <a href={`/a/${smartLink.slug}`} target="_blank" rel="noreferrer"
                  className="px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-sm transition flex items-center gap-1.5">
                  <ExternalLink size={13}/> Voir
                </a>
              )}
            </div>
          </form>
        </Section>
      )}

      {/* ══════════════════════════════════════
          TAB: PLANNING
      ══════════════════════════════════════ */}
      {tab === 'schedule' && (
        <Section icon={<Calendar size={15}/>} title="Sorties programmées">
          {scheduled.length === 0
            ? <div className="text-center py-8 text-zinc-600">
                <Calendar size={32} className="mx-auto mb-2 opacity-20"/>
                <p className="text-sm">Aucune sortie programmée</p>
                <p className="text-[11px] mt-1 text-zinc-700">Lors d'un upload, choisissez une date future</p>
              </div>
            : <div className="space-y-3">
                {scheduled.map(r => {
                  const future = new Date(r.releaseAt) > new Date();
                  return (
                    <div key={r._id} className="flex items-center gap-3 p-3 bg-zinc-800/40 rounded-xl">
                      {r.songId?.image && <img src={r.songId.image} className="w-10 h-10 rounded-lg object-cover shrink-0" alt="" />}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold truncate">{r.songId?.titre}</p>
                        <p className="text-[10px] text-zinc-500 flex items-center gap-1 mt-0.5">
                          <Clock size={9}/>
                          {new Date(r.releaseAt).toLocaleDateString('fr-FR', { day:'numeric', month:'long', year:'numeric' })}
                        </p>
                      </div>
                      <span className={`text-[9px] font-bold px-2 py-1 rounded-full shrink-0 ${future ? 'bg-orange-500/15 text-orange-400' : 'bg-green-500/15 text-green-400'}`}>
                        {future ? 'EN ATTENTE' : 'PUBLIÉ'}
                      </span>
                    </div>
                  );
                })}
              </div>
          }
        </Section>
      )}

      {/* ══════════════════════════════════════
          TAB: CERTIFICATION
      ══════════════════════════════════════ */}
      {tab === 'cert' && (
        <Section icon={<CheckCircle size={15}/>} title="Certification artiste">
          <div className="space-y-4">
            {cert?.status === 'approved' ? (
              <div className="text-center py-6">
                <div className={`w-16 h-16 rounded-full mx-auto mb-3 flex items-center justify-center ${cert.level === 'gold' ? 'bg-yellow-500/20' : 'bg-blue-500/20'}`}>
                  {cert.level === 'gold' ? <Star size={32} className="text-yellow-400" fill="currentColor"/> : <CheckCircle size={32} className="text-blue-400"/>}
                </div>
                <p className="font-black text-lg">{cert.level === 'gold' ? 'Certifié Or' : 'Artiste vérifié'}</p>
                <p className="text-zinc-500 text-sm mt-1">Badge affiché sur votre profil et vos sorties</p>
              </div>
            ) : cert?.status === 'pending' ? (
              <div className="text-center py-6 text-zinc-500">
                <Clock size={32} className="mx-auto mb-2 opacity-40"/>
                <p className="font-bold">Demande en cours de révision</p>
                <p className="text-sm mt-1">L'équipe MOOZIK examine votre demande</p>
              </div>
            ) : cert?.status === 'rejected' ? (
              <div className="space-y-3">
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
                  <p className="text-sm font-bold text-red-400">Demande refusée</p>
                  {cert.note && <p className="text-xs text-zinc-400 mt-1">{cert.note}</p>}
                </div>
                <button onClick={requestCert} disabled={loading}
                  className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-2.5 rounded-xl text-sm transition flex items-center justify-center gap-2 disabled:opacity-50">
                  {loading ? <Loader2 size={14} className="animate-spin"/> : <CheckCircle size={14}/>}
                  Redemander la certification
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { level: 'blue', icon: <CheckCircle size={20} className="text-blue-400"/>,             label: 'Badge Vérifié', desc: 'Confirme votre identité' },
                    { level: 'gold', icon: <Star size={20} className="text-yellow-400" fill="currentColor"/>, label: 'Badge Or',     desc: 'Artiste professionnel' },
                  ].map(b => (
                    <div key={b.level} className="bg-zinc-800/40 border border-zinc-700/50 rounded-xl p-4 text-center">
                      <div className="flex justify-center mb-2">{b.icon}</div>
                      <p className="text-sm font-bold">{b.label}</p>
                      <p className="text-[10px] text-zinc-500 mt-1">{b.desc}</p>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-zinc-500 text-center">Gratuit · validation manuelle par l'équipe MOOZIK</p>
                <button onClick={requestCert} disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 rounded-xl text-sm transition flex items-center justify-center gap-2 disabled:opacity-50">
                  {loading ? <Loader2 size={14} className="animate-spin"/> : <CheckCircle size={14}/>}
                  Demander la certification
                </button>
              </div>
            )}
          </div>
        </Section>
      )}

      {/* ══════════════════════════════════════
          TAB: REVENUS  ← FIX: était imbriqué dans Newsletter
      ══════════════════════════════════════ */}
      {tab === 'revenus' && (
        <RoyaltiesDashboard token={token} artistId={userArtistId} />
      )}

      {/* ══════════════════════════════════════
          TAB: STORIES 24H  ← NOUVEAU
      ══════════════════════════════════════ */}
      {tab === 'stories' && (
        <div className="space-y-4">
          {/* Upload nouvelle story */}
          <Section icon={<Camera size={15}/>} title="Publier une story">
            <form onSubmit={uploadStory} className="space-y-4">

              {/* Zone de dépôt fichier */}
              <div
                onClick={() => storyFileRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition ${storyFile ? 'border-green-500/40 bg-green-500/5' : 'border-zinc-700 hover:border-zinc-500 hover:bg-zinc-800/30'}`}>
                {storyPreview ? (
                  <img src={storyPreview} className="w-24 h-24 object-cover rounded-xl mx-auto mb-2" alt="" />
                ) : (
                  <div className="flex flex-col items-center gap-2 text-zinc-600">
                    <div className="w-12 h-12 rounded-2xl bg-zinc-800 flex items-center justify-center">
                      {storyFile?.type?.startsWith('audio') ? <Volume2 size={20}/> : storyFile?.type?.startsWith('video') ? <Video size={20}/> : <ImageIcon size={20}/>}
                    </div>
                    <p className="text-xs font-bold">Cliquer pour choisir</p>
                    <p className="text-[10px]">Image, Audio (extrait 30s) ou Vidéo</p>
                  </div>
                )}
                {storyFile && !storyPreview && (
                  <p className="text-xs text-green-400 font-bold mt-2">✓ {storyFile.name}</p>
                )}
                <input ref={storyFileRef} type="file" className="hidden"
                  accept="image/*,audio/*,video/*" onChange={handleStoryFile} />
              </div>

              {storyFile && (
                <div className="flex items-center gap-2 text-[10px] text-zinc-500">
                  <span className="bg-zinc-800 px-2 py-0.5 rounded-full font-bold uppercase">
                    {storyFile.type.startsWith('image') ? '🖼 IMAGE' : storyFile.type.startsWith('audio') ? '🎵 AUDIO' : '🎬 VIDÉO'}
                  </span>
                  <span>{(storyFile.size / 1024 / 1024).toFixed(1)} Mo</span>
                </div>
              )}

              <div>
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-1.5">Légende (optionnel)</label>
                <input value={storyCaption} onChange={e => setStoryCaption(e.target.value)}
                  placeholder="Nouveau single dispo demain 🔥"
                  maxLength={150}
                  className="w-full bg-zinc-800 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-1 ring-red-600 text-white placeholder-zinc-600" />
                <p className="text-[10px] text-zinc-600 mt-1">{storyCaption.length}/150</p>
              </div>

              {storyFile?.type?.startsWith('audio') && (
                <div>
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-1.5">Durée (secondes)</label>
                  <input type="number" value={storyDuration} onChange={e => setStoryDuration(parseInt(e.target.value))}
                    min={5} max={60}
                    className="w-full bg-zinc-800 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-1 ring-red-600 text-white" />
                </div>
              )}

              <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl px-3 py-2 text-[10px] text-blue-400">
                ⏳ La story expire automatiquement dans 24h
              </div>

              <button type="submit" disabled={uploadingStory || !storyFile}
                className="w-full bg-linear-to-r from-pink-600 to-red-600 hover:from-pink-500 hover:to-red-500 text-white font-bold py-3 rounded-xl text-sm transition flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.98]">
                {uploadingStory ? <Loader2 size={15} className="animate-spin"/> : <Camera size={15}/>}
                {uploadingStory ? 'Publication...' : 'Publier la story'}
              </button>
            </form>
          </Section>

          {/* Stories actives */}
          <Section icon={<Eye size={15}/>} title={`Stories actives (${stories.length})`}>
            {stories.length === 0 ? (
              <div className="text-center py-6 text-zinc-600">
                <Camera size={28} className="mx-auto mb-2 opacity-20"/>
                <p className="text-sm">Aucune story active</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {stories.map(s => {
                  const expiresIn = Math.max(0, new Date(s.expiresAt) - Date.now());
                  const hoursLeft = Math.floor(expiresIn / 3600000);
                  return (
                    <div key={s._id} className="relative bg-zinc-800/40 rounded-2xl overflow-hidden">
                      {s.type === 'image' ? (
                        <img src={s.mediaUrl} className="w-full aspect-square object-cover" alt="" />
                      ) : (
                        <div className="w-full aspect-square bg-zinc-800 flex flex-col items-center justify-center gap-2">
                          {s.type === 'audio' ? <Volume2 size={28} className="text-zinc-500"/> : <Video size={28} className="text-zinc-500"/>}
                          <span className="text-[10px] text-zinc-500 capitalize">{s.type}</span>
                        </div>
                      )}
                      {/* Overlay infos */}
                      <div className="absolute inset-0 bg-linear-to-t from-black/70 to-transparent flex flex-col justify-end p-2.5">
                        {s.caption && <p className="text-[10px] text-white font-bold truncate">{s.caption}</p>}
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-[9px] text-white/60 flex items-center gap-1"><Eye size={8}/> {s.views}</span>
                          <span className={`text-[9px] font-bold ${hoursLeft < 4 ? 'text-red-400' : 'text-orange-400'}`}>
                            {hoursLeft < 1 ? '< 1h' : `${hoursLeft}h`}
                          </span>
                        </div>
                      </div>
                      {/* Bouton supprimer */}
                      <button onClick={() => deleteStory(s._id)}
                        className="absolute top-2 right-2 w-6 h-6 bg-black/60 hover:bg-red-600 rounded-full flex items-center justify-center transition">
                        <X size={10} className="text-white"/>
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </Section>
        </div>
      )}

      {/* ══════════════════════════════════════
          TAB: ÉVÉNEMENTS  ← NOUVEAU
      ══════════════════════════════════════ */}
      {tab === 'events' && (
        <div className="space-y-4">
          {/* Bouton créer */}
          {!showEventForm && (
            <button onClick={() => setShowEventForm(true)}
              className="w-full flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-500 text-white font-bold py-3 rounded-2xl text-sm transition active:scale-[0.98]">
              <Plus size={15}/> Créer un nouvel événement
            </button>
          )}

          {/* Formulaire création */}
          {showEventForm && (
            <Section icon={<Ticket size={15}/>} title="Nouvel événement">
              <form onSubmit={createEvent} className="space-y-4">

                {/* Image événement */}
                <div
                  onClick={() => eventImgRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition ${eventImg ? 'border-purple-500/40 bg-purple-500/5' : 'border-zinc-700 hover:border-zinc-500'}`}>
                  {eventImg ? (
                    <img src={URL.createObjectURL(eventImg)} className="w-full h-32 object-cover rounded-xl" alt="" />
                  ) : (
                    <div className="text-zinc-600 py-3">
                      <ImageIcon size={22} className="mx-auto mb-1.5"/>
                      <p className="text-xs">Photo de l'événement (optionnel)</p>
                    </div>
                  )}
                  <input ref={eventImgRef} type="file" accept="image/*" className="hidden" onChange={e => setEventImg(e.target.files[0])} />
                </div>

                {/* Titre */}
                <div>
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-1.5">Titre de l'événement *</label>
                  <input value={eventForm.title} onChange={e => setEventForm(p => ({ ...p, title: e.target.value }))}
                    required placeholder="Concert Kinshasa Live"
                    className="w-full bg-zinc-800 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-1 ring-purple-600 text-white placeholder-zinc-600" />
                </div>

                {/* Description */}
                <div>
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-1.5">Description</label>
                  <textarea value={eventForm.description} onChange={e => setEventForm(p => ({ ...p, description: e.target.value }))}
                    rows={2} placeholder="Détails, programme de la soirée..."
                    className="w-full bg-zinc-800 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-1 ring-purple-600 text-white placeholder-zinc-600 resize-none" />
                </div>

                {/* Lieu */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-1.5">Lieu / Salle *</label>
                    <input value={eventForm.venue} onChange={e => setEventForm(p => ({ ...p, venue: e.target.value }))}
                      required placeholder="Palais du Peuple"
                      className="w-full bg-zinc-800 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-1 ring-purple-600 text-white placeholder-zinc-600" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-1.5">Ville</label>
                    <input value={eventForm.city} onChange={e => setEventForm(p => ({ ...p, city: e.target.value }))}
                      placeholder="Kinshasa"
                      className="w-full bg-zinc-800 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-1 ring-purple-600 text-white placeholder-zinc-600" />
                  </div>
                </div>

                {/* Pays */}
                <div>
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-1.5">Pays</label>
                  <input value={eventForm.country} onChange={e => setEventForm(p => ({ ...p, country: e.target.value }))}
                    placeholder="RDC, Congo, Madagascar..."
                    className="w-full bg-zinc-800 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-1 ring-purple-600 text-white placeholder-zinc-600" />
                </div>

                {/* Date */}
                <div>
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-1.5">Date et heure *</label>
                  <input type="datetime-local" value={eventForm.date} min={minDate}
                    onChange={e => setEventForm(p => ({ ...p, date: e.target.value }))} required
                    className="w-full bg-zinc-800 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-1 ring-purple-600 text-white" />
                </div>

                {/* Prix + devise */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-1.5">Prix du billet *</label>
                    <div className="flex items-center gap-2 bg-zinc-800 rounded-xl px-3 py-2.5">
                      <input type="number" min="0" step="0.01" value={eventForm.ticketPrice}
                        onChange={e => setEventForm(p => ({ ...p, ticketPrice: e.target.value }))} required placeholder="5000"
                        className="flex-1 bg-transparent text-sm outline-none text-white placeholder-zinc-600" />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-1.5">Devise</label>
                    <select value={eventForm.ticketCurrency}
                      onChange={e => setEventForm(p => ({ ...p, ticketCurrency: e.target.value }))}
                      className="w-full bg-zinc-800 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-1 ring-purple-600 text-white">
                      {[['EUR','€'],['USD','$'],['CDF','FC'],['XAF','FCFA'],['MGA','Ar']].map(([c,s]) => (
                        <option key={c} value={c}>{c} ({s})</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Capacité */}
                <div>
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-1.5">Capacité (0 = illimitée)</label>
                  <input type="number" min="0" value={eventForm.ticketCapacity}
                    onChange={e => setEventForm(p => ({ ...p, ticketCapacity: e.target.value }))}
                    placeholder="500"
                    className="w-full bg-zinc-800 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-1 ring-purple-600 text-white placeholder-zinc-600" />
                </div>

                <div className="flex gap-2">
                  <button type="submit" disabled={savingEvent}
                    className="flex-1 bg-purple-600 hover:bg-purple-500 text-white font-bold py-2.5 rounded-xl text-sm transition flex items-center justify-center gap-2 disabled:opacity-50">
                    {savingEvent ? <Loader2 size={14} className="animate-spin"/> : <Ticket size={14}/>}
                    {savingEvent ? 'Création...' : 'Créer l\'événement'}
                  </button>
                  <button type="button" onClick={() => setShowEventForm(false)}
                    className="px-4 py-2.5 text-zinc-400 hover:text-white text-sm rounded-xl hover:bg-zinc-800 transition">
                    Annuler
                  </button>
                </div>
              </form>
            </Section>
          )}

          {/* Liste des événements */}
          <Section icon={<Calendar size={15}/>} title={`Mes événements (${events.length})`}>
            {events.length === 0 ? (
              <div className="text-center py-8 text-zinc-600">
                <Ticket size={32} className="mx-auto mb-2 opacity-20"/>
                <p className="text-sm">Aucun événement créé</p>
                <p className="text-[11px] mt-1 text-zinc-700">Vos fans pourront acheter des billets directement depuis MOOZIK</p>
              </div>
            ) : (
              <div className="space-y-3">
                {events.map(ev => {
                  const isPast     = new Date(ev.date) < new Date();
                  const isSoldOut  = ev.ticketCapacity > 0 && ev.ticketsSold >= ev.ticketCapacity;
                  const revenue    = ((ev.ticketsSold || 0) * (ev.ticketPrice || 0) / 100).toFixed(2);
                  return (
                    <div key={ev._id} className="bg-zinc-800/40 rounded-2xl overflow-hidden">
                      <div className="flex gap-3 p-3">
                        {ev.image ? (
                          <img src={ev.image} className="w-14 h-14 rounded-xl object-cover shrink-0" alt="" />
                        ) : (
                          <div className="w-14 h-14 bg-zinc-700 rounded-xl flex items-center justify-center shrink-0">
                            <Ticket size={20} className="text-zinc-500"/>
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-sm font-bold truncate">{ev.title}</p>
                            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full shrink-0 ${isPast ? 'bg-zinc-700 text-zinc-500' : isSoldOut ? 'bg-red-500/20 text-red-400' : 'bg-green-500/15 text-green-400'}`}>
                              {isPast ? 'PASSÉ' : isSoldOut ? 'COMPLET' : 'EN VENTE'}
                            </span>
                          </div>
                          <p className="text-[10px] text-zinc-500 flex items-center gap-1 mt-0.5">
                            <MapPin size={9}/> {ev.venue}{ev.city ? `, ${ev.city}` : ''}
                          </p>
                          <p className="text-[10px] text-zinc-500 flex items-center gap-1">
                            <Calendar size={9}/>
                            {new Date(ev.date).toLocaleDateString('fr-FR', { weekday:'short', day:'numeric', month:'short', hour:'2-digit', minute:'2-digit' })}
                          </p>
                        </div>
                      </div>
                      {/* Stats ventes */}
                      <div className="border-t border-zinc-700/50 px-3 py-2 flex items-center justify-between">
                        <div className="flex items-center gap-4 text-[10px] text-zinc-500">
                          <span className="flex items-center gap-1"><Ticket size={9}/> {ev.ticketsSold || 0} billet{(ev.ticketsSold || 0) > 1 ? 's' : ''}{ev.ticketCapacity > 0 ? `/${ev.ticketCapacity}` : ''}</span>
                          <span className="flex items-center gap-1 text-green-400 font-bold"><DollarSign size={9}/> {revenue} {ev.ticketCurrency}</span>
                        </div>
                        <button onClick={() => deleteEvent(ev._id, ev.title)}
                          className="p-1.5 text-zinc-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition">
                          <Trash2 size={12}/>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Section>
        </div>
      )}

      {/* ══════════════════════════════════════
          TAB: ANALYTICS
      ══════════════════════════════════════ */}
      {tab === 'analytics' && (
        <ArtistAnalyticsView token={token} artistId={userArtistId} />
      )}
    </div>
  );
};

export default ArtistDashboard;