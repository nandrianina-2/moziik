import React, { useState, useEffect } from 'react';
import { CheckCircle, Star, X, Clock, Check, Loader2, RefreshCw, Eye } from 'lucide-react';
import { API } from '../config/api';
import ConfirmDialog, { useConfirm } from '../components/ui/ConfirmDialog';

const AdminCertificationsView = ({ token }) => {
  const [certs, setCerts]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter]   = useState('pending'); // 'pending' | 'approved' | 'rejected' | 'all'
  const [selected, setSelected] = useState(null);
  const [note, setNote]         = useState('');
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess]   = useState('');
  const { confirmDialog, ask, close } = useConfirm();

  const load = async () => {
    setLoading(true);
    try {
      const url = filter === 'all' ? `${API}/admin/certifications` : `${API}/admin/certifications?status=${filter}`;
      const data = await fetch(url, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json());
      setCerts(Array.isArray(data) ? data : []);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { load(); }, [filter]);

  const decide = async (certId, status, level = 'blue') => {
    setProcessing(true);
    try {
      const res = await fetch(`${API}/admin/certifications/${certId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status, level, note }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setSuccess(status === 'approved' ? '✅ Certification approuvée !' : '❌ Demande refusée');
      setSelected(null); setNote('');
      load();
      setTimeout(() => setSuccess(''), 3000);
    } catch {}
    setProcessing(false);
  };

  const statusConfig = {
    pending:  { label: 'En attente', color: 'text-orange-400', bg: 'bg-orange-500/10', icon: <Clock size={12}/> },
    approved: { label: 'Approuvé',   color: 'text-green-400',  bg: 'bg-green-500/10',  icon: <Check size={12}/> },
    rejected: { label: 'Refusé',     color: 'text-red-400',    bg: 'bg-red-500/10',    icon: <X size={12}/> },
  };

  return (
    <div className="animate-in fade-in duration-500 space-y-5">
      <ConfirmDialog config={confirmDialog} onClose={close} />

      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-black flex items-center gap-2">
          <CheckCircle size={24} className="text-blue-400"/> Certifications
        </h2>
        <button onClick={load} className="p-2 text-zinc-500 hover:text-white hover:bg-zinc-800 rounded-xl transition">
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''}/>
        </button>
      </div>

      {success && (
        <div className="bg-green-500/10 border border-green-500/20 text-green-400 text-sm px-4 py-3 rounded-xl font-bold">
          {success}
        </div>
      )}

      {/* Filtres */}
      <div className="flex gap-1 bg-zinc-900/40 rounded-xl p-1 border border-zinc-800/50">
        {[['pending','En attente'],['approved','Approuvés'],['rejected','Refusés'],['all','Tous']].map(([k,l]) => (
          <button key={k} onClick={() => setFilter(k)}
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition ${filter===k?'bg-red-600 text-white':'text-zinc-500 hover:text-white'}`}>
            {l}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 text-zinc-600">
          <Loader2 size={24} className="animate-spin mr-2"/> Chargement...
        </div>
      ) : certs.length === 0 ? (
        <div className="text-center py-16 text-zinc-600">
          <CheckCircle size={40} className="mx-auto mb-3 opacity-20"/>
          <p className="text-sm">Aucune demande {filter !== 'all' ? statusConfig[filter]?.label?.toLowerCase() : ''}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {certs.map(cert => {
            const sc = statusConfig[cert.status] || statusConfig.pending;
            return (
              <div key={cert._id}
                className={`border rounded-2xl p-4 transition cursor-pointer ${selected?._id === cert._id ? 'border-red-500/40 bg-zinc-800/60' : 'border-zinc-800/50 bg-zinc-900/40 hover:bg-zinc-800/40'}`}
                onClick={() => { setSelected(selected?._id === cert._id ? null : cert); setNote(''); }}>
                <div className="flex items-center gap-3">
                  {/* Avatar artiste */}
                  <div className="w-12 h-12 rounded-xl overflow-hidden bg-zinc-800 shrink-0">
                    {cert.artistId?.image
                      ? <img src={cert.artistId.image} className="w-full h-full object-cover" alt="" />
                      : <div className="w-full h-full flex items-center justify-center text-lg font-black text-zinc-600">{(cert.artistId?.nom||'?')[0]}</div>}
                  </div>
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-black text-sm">{cert.artistId?.nom}</p>
                    <p className="text-[10px] text-zinc-500">{cert.artistId?.email}</p>
                    {cert.artistId?.bio && <p className="text-[10px] text-zinc-600 truncate mt-0.5">{cert.artistId.bio}</p>}
                  </div>
                  {/* Status */}
                  <div className={`flex items-center gap-1 text-[9px] font-black px-2 py-1 rounded-full shrink-0 ${sc.bg} ${sc.color}`}>
                    {sc.icon} {sc.label.toUpperCase()}
                  </div>
                </div>

                {/* Panel d'action */}
                {selected?._id === cert._id && cert.status === 'pending' && (
                  <div className="mt-4 space-y-3 border-t border-zinc-800 pt-4">
                    <div>
                      <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-1.5">
                        Note (optionnel, visible par l'artiste)
                      </label>
                      <textarea value={note} onChange={e => setNote(e.target.value)} rows={2}
                        placeholder="Raison du refus ou félicitations..."
                        className="w-full bg-zinc-800 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-600 outline-none focus:ring-1 ring-red-600 resize-none" />
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => ask({
                          title: `Approuver ${cert.artistId?.nom} (badge Bleu) ?`,
                          confirmLabel: 'Approuver Bleu', variant: 'info',
                          onConfirm: () => decide(cert._id, 'approved', 'blue')
                        })}
                        disabled={processing}
                        className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 rounded-xl text-xs transition flex items-center justify-center gap-1.5 disabled:opacity-50">
                        <CheckCircle size={12}/> Badge Bleu
                      </button>
                      <button onClick={() => ask({
                          title: `Approuver ${cert.artistId?.nom} (badge Or) ?`,
                          confirmLabel: 'Approuver Or', variant: 'info',
                          onConfirm: () => decide(cert._id, 'approved', 'gold')
                        })}
                        disabled={processing}
                        className="flex-1 bg-yellow-600 hover:bg-yellow-500 text-white font-bold py-2 rounded-xl text-xs transition flex items-center justify-center gap-1.5 disabled:opacity-50">
                        <Star size={12}/> Badge Or
                      </button>
                      <button onClick={() => ask({
                          title: `Refuser la demande de ${cert.artistId?.nom} ?`,
                          message: 'L\'artiste sera notifié du refus.',
                          confirmLabel: 'Refuser', variant: 'danger',
                          onConfirm: () => decide(cert._id, 'rejected')
                        })}
                        disabled={processing}
                        className="px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 font-bold rounded-xl text-xs transition flex items-center gap-1.5 disabled:opacity-50">
                        <X size={12}/> Refuser
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AdminCertificationsView;