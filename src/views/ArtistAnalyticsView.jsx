import React, { useState, useEffect, useRef } from 'react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, Cell, RadarChart,
  PolarGrid, PolarAngleAxis, Radar
} from 'recharts';
import {
  Map, TrendingUp, Users, MessageCircle, BarChart2,
  Loader2, Globe, Clock, Smartphone, Monitor, Tablet,
  AlertTriangle, CheckCircle, Meh, Frown, Smile,
  Download, ChevronDown, ChevronUp, Eye, Mail
} from 'lucide-react';

const API = import.meta.env.VITE_API_URL || 'https://moozik-gft1.onrender.com';

// ── Mini carte monde (SVG + points) ───────────
const GeoMapMini = ({ data }) => {
  if (!data?.length) return (
    <div className="flex items-center justify-center h-40 text-zinc-700">
      <Globe size={28} className="opacity-30" />
    </div>
  );
  const max = Math.max(...data.map(d => d.count));
  return (
    <div className="space-y-3">
      {/* Tableau top pays */}
      <div className="space-y-1.5">
        {data.slice(0, 8).map((item, i) => (
          <div key={item.country} className="flex items-center gap-2.5">
            <span className="text-[10px] text-zinc-600 w-4 text-right shrink-0">{i + 1}</span>
            <span className="text-sm" title={item.countryName}>{countryFlag(item.country)}</span>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-0.5">
                <p className="text-xs font-bold">{item.countryName || item.country}</p>
                <p className="text-[10px] text-zinc-500">{item.count.toLocaleString()}</p>
              </div>
              <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
                <div className="h-full bg-red-500 rounded-full" style={{ width: `${(item.count / max) * 100}%` }} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Emoji drapeau depuis code ISO
const countryFlag = (code) => {
  if (!code || code === 'XX') return '🌍';
  return String.fromCodePoint(...[...code.toUpperCase()].map(c => 0x1F1E6 + c.charCodeAt(0) - 65));
};

// ── Courbe de rétention ───────────────────────
const RetentionChart = ({ data }) => {
  if (!data?.buckets?.length) return null;
  const chartData = data.buckets.map((v, i) => ({ percent: `${i * 5}%`, retention: v }));
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-3 text-center">
        {[
          { l: 'Complétion', v: `${data.completionRate || 0}%`, color: 'text-green-400' },
          { l: 'Écoute moy.', v: `${data.avgListenPercent || 0}%`, color: 'text-blue-400' },
          { l: 'Auditeurs', v: (data.totalListeners || 0).toLocaleString(), color: 'text-orange-400' },
        ].map(s => (
          <div key={s.l} className="bg-zinc-800/40 rounded-xl p-3">
            <p className={`text-lg font-black ${s.color}`}>{s.v}</p>
            <p className="text-[9px] text-zinc-500 uppercase tracking-wide">{s.l}</p>
          </div>
        ))}
      </div>
      <ResponsiveContainer width="100%" height={160}>
        <AreaChart data={chartData} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
          <defs>
            <linearGradient id="retGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
          <XAxis dataKey="percent" tick={{ fill: '#52525b', fontSize: 9 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: '#52525b', fontSize: 9 }} axisLine={false} tickLine={false} domain={[0, 100]} />
          <Tooltip formatter={(v) => [`${v}%`, 'Rétention']} contentStyle={{ background: '#18181b', border: '1px solid #3f3f46', borderRadius: 8 }} />
          <Area type="monotone" dataKey="retention" stroke="#ef4444" strokeWidth={2} fill="url(#retGrad)" dot={false} />
        </AreaChart>
      </ResponsiveContainer>
      {/* Points de chute */}
      {data.dropPoints?.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {data.dropPoints.map(dp => (
            <span key={dp.percent} className="text-[9px] bg-orange-500/10 border border-orange-500/20 text-orange-400 px-2 py-0.5 rounded-full flex items-center gap-1">
              <ChevronDown size={8} /> Chute de {dp.drop}% à {dp.percent}%
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

// ── Sentiment score ───────────────────────────
const SentimentDisplay = ({ data }) => {
  if (!data) return null;
  const total = Math.max(data.positive + data.negative + data.neutral, 1);
  const score = data.score || 0;
  return (
    <div className="space-y-3">
      {data.alert && (
        <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 px-3 py-2 rounded-xl text-red-400 text-xs font-bold">
          <AlertTriangle size={13} /> ⚠️ Pic de commentaires négatifs détecté
        </div>
      )}
      <div className="flex items-center gap-3">
        <div className="text-4xl">
          {score > 0.3 ? '😊' : score < -0.2 ? '😞' : '😐'}
        </div>
        <div className="flex-1">
          <p className="font-black text-sm">{score > 0.3 ? 'Sentiment positif' : score < -0.2 ? 'Sentiment négatif' : 'Sentiment neutre'}</p>
          <p className="text-[10px] text-zinc-500">Sur {data.commentCount || 0} commentaires analysés par IA</p>
        </div>
        <div className={`text-xl font-black ${score > 0 ? 'text-green-400' : score < 0 ? 'text-red-400' : 'text-zinc-400'}`}>
          {score > 0 ? '+' : ''}{(score * 100).toFixed(0)}
        </div>
      </div>
      {/* Barres */}
      <div className="space-y-1.5">
        {[
          { l: '😊 Positif', v: data.positive, color: 'bg-green-500' },
          { l: '😐 Neutre',  v: data.neutral,  color: 'bg-zinc-500' },
          { l: '😞 Négatif', v: data.negative, color: 'bg-red-500' },
        ].map(s => (
          <div key={s.l} className="flex items-center gap-2">
            <span className="text-[10px] text-zinc-500 w-20 shrink-0">{s.l}</span>
            <div className="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
              <div className={`h-full ${s.color} rounded-full transition-all`} style={{ width: `${s.v}%` }} />
            </div>
            <span className="text-[10px] text-zinc-500 w-8 text-right">{s.v}%</span>
          </div>
        ))}
      </div>
      {/* Keywords */}
      {(data.keywords?.positive?.length > 0 || data.keywords?.negative?.length > 0) && (
        <div className="flex gap-2 flex-wrap">
          {data.keywords.positive?.map(k => <span key={k} className="text-[9px] bg-green-500/10 text-green-400 px-2 py-0.5 rounded-full">{k}</span>)}
          {data.keywords.negative?.map(k => <span key={k} className="text-[9px] bg-red-500/10 text-red-400 px-2 py-0.5 rounded-full">{k}</span>)}
        </div>
      )}
    </div>
  );
};

// ════════════════════════════════════════════
// ArtistAnalyticsView — vue principale analytics
// ════════════════════════════════════════════
const ArtistAnalyticsView = ({ token, artistId }) => {
  const [tab, setTab]     = useState('geo');
  const [geo, setGeo]     = useState([]);
  const [demo, setDemo]   = useState(null);
  const [retention, setRetention] = useState(null);
  const [sentiment, setSentiment] = useState(null);
  const [weeklyReports, setWeeklyReports] = useState([]);
  const [songs, setSongs] = useState([]);
  const [selectedSong, setSelectedSong] = useState(null);
  const [loading, setLoading] = useState(false);
  const h = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    if (!artistId) return;
    fetch(`${API}/analytics/geo?artistId=${artistId}`, { headers: h })
        .then(r => r.ok ? r.json() : [])
        .then(setGeo)
        .catch(() => {});

    fetch(`${API}/artists/${artistId}/demographics`, { headers: h }).then(r => r.ok ? r.json() : null).then(setDemo).catch(() => {});
    fetch(`${API}/artists/${artistId}/weekly-report`, { headers: h }).then(r => r.ok ? r.json() : []).then(d => setWeeklyReports(Array.isArray(d) ? d : [])).catch(() => {});
    fetch(`${API}/songs?artisteId=${artistId}&limit=20`).then(r => r.json()).then(d => { const s = d.songs||[]; setSongs(s); if (s.length) setSelectedSong(s[0]._id); }).catch(() => {});
  }, [artistId]);

  useEffect(() => {
    if (!selectedSong) return;
    fetch(`${API}/songs/${selectedSong}/retention`, { headers: h }).then(r => r.ok ? r.json() : null).then(setRetention).catch(() => {});
    fetch(`${API}/songs/${selectedSong}/sentiment`, { headers: h }).then(r => r.ok ? r.json() : null).then(setSentiment).catch(() => {});
  }, [selectedSong]);

  const TABS = [
    { k: 'geo',      label: '🌍 Carte' },
    { k: 'retention',label: '📈 Rétention' },
    { k: 'demo',     label: '👥 Audience' },
    { k: 'sentiment',label: '💬 Sentiment IA' },
    { k: 'reports',  label: '📧 Rapports' },
  ];

  const Section = ({ title, children }) => (
    <div className="bg-zinc-900/60 border border-zinc-800/50 rounded-2xl p-5 space-y-4">
      <h3 className="font-bold text-sm text-zinc-300">{title}</h3>
      {children}
    </div>
  );

  return (
    <div className="space-y-4 animate-in fade-in duration-500">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-red-600/20 rounded-2xl flex items-center justify-center">
          <BarChart2 size={18} className="text-red-400" />
        </div>
        <h2 className="text-xl font-black">Analytics avancées</h2>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto bg-zinc-900/40 rounded-xl p-1 border border-zinc-800/50" style={{ scrollbarWidth: 'none' }}>
        {TABS.map(t => (
          <button key={t.k} onClick={() => setTab(t.k)}
            className={`shrink-0 py-1.5 px-3 rounded-lg text-xs font-bold transition ${tab===t.k?'bg-red-600 text-white':'text-zinc-500 hover:text-white'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Géolocalisation ── */}
      {tab === 'geo' && (
        <Section title="🌍 Carte des écoutes par pays">
          <GeoMapMini data={geo} />
          {geo.length === 0 && <p className="text-xs text-zinc-600 text-center py-4">Les données géographiques apparaîtront après les premières écoutes</p>}
        </Section>
      )}

      {/* ── Rétention ── */}
      {tab === 'retention' && (
        <Section title="📈 Courbe de rétention audio">
          {songs.length > 0 && (
            <select value={selectedSong || ''} onChange={e => setSelectedSong(e.target.value)}
              className="w-full bg-zinc-800 rounded-xl px-3 py-2 text-sm outline-none focus:ring-1 ring-red-600 text-white mb-2">
              {songs.map(s => <option key={s._id} value={s._id}>{s.titre}</option>)}
            </select>
          )}
          {retention ? <RetentionChart data={retention} /> : <p className="text-xs text-zinc-600 text-center py-4">Sélectionnez un titre pour voir sa courbe</p>}
        </Section>
      )}

      {/* ── Demographics ── */}
      {tab === 'demo' && demo && (
        <div className="space-y-4">
          <Section title="⏰ Heures de pointe">
            <ResponsiveContainer width="100%" height={100}>
              <BarChart data={demo.hourly.map((v, i) => ({ h: `${i}h`, plays: v }))} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
                <XAxis dataKey="h" tick={{ fill: '#52525b', fontSize: 8 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: '#18181b', border: '1px solid #3f3f46', borderRadius: 8 }} />
                <Bar dataKey="plays" fill="#ef4444" radius={[2, 2, 0, 0]}>
                  {demo.hourly.map((v, i) => <Cell key={i} fill={i === demo.peakHour ? '#ef4444' : '#3f3f46'} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <p className="text-[10px] text-zinc-500 text-center">Heure de pointe : {demo.peakHour}h00</p>
          </Section>

          <Section title="📱 Appareils utilisés">
            <div className="grid grid-cols-3 gap-3 text-center">
              {[
                { l: 'Mobile', v: demo.devices?.mobile || 0, icon: <Smartphone size={16}/>, color: 'text-blue-400' },
                { l: 'Desktop', v: demo.devices?.desktop || 0, icon: <Monitor size={16}/>, color: 'text-green-400' },
                { l: 'Tablette', v: demo.devices?.tablet || 0, icon: <Tablet size={16}/>, color: 'text-orange-400' },
              ].map(s => {
                const totalDevices = (demo.devices?.mobile || 0) + (demo.devices?.desktop || 0) + (demo.devices?.tablet || 0) || 1;
                return (
                  <div key={s.l} className="bg-zinc-800/40 rounded-xl p-3">
                    <div className={`flex justify-center mb-1.5 ${s.color}`}>{s.icon}</div>
                    <p className="text-lg font-black">{Math.round((s.v / totalDevices) * 100)}%</p>
                    <p className="text-[9px] text-zinc-500 uppercase">{s.l}</p>
                  </div>
                );
              })}
            </div>
          </Section>

          <Section title="🌍 Top pays">
            <GeoMapMini data={demo.topCountries?.map(c => ({ country: c._id, count: c.count, countryName: c.countryName || c._id })) || []} />
          </Section>
        </div>
      )}

      {/* ── Sentiment ── */}
      {tab === 'sentiment' && (
        <Section title="💬 Analyse de sentiment (IA Anthropic)">
          {songs.length > 0 && (
            <select value={selectedSong || ''} onChange={e => setSelectedSong(e.target.value)}
              className="w-full bg-zinc-800 rounded-xl px-3 py-2 text-sm outline-none focus:ring-1 ring-red-600 text-white mb-2">
              {songs.map(s => <option key={s._id} value={s._id}>{s.titre}</option>)}
            </select>
          )}
          {sentiment ? <SentimentDisplay data={sentiment} /> : <p className="text-xs text-zinc-600 text-center py-4">Sélectionnez un titre pour analyser les commentaires</p>}
        </Section>
      )}

      {/* ── Rapports hebdo ── */}
      {tab === 'reports' && (
        <Section title="📧 Rapports hebdomadaires">
          <p className="text-xs text-zinc-500 mb-3">Envoyés chaque lundi par email. Données des 7 derniers jours.</p>
          {weeklyReports.length === 0 ? (
            <p className="text-xs text-zinc-600 text-center py-4">Aucun rapport disponible pour le moment</p>
          ) : (
            <div className="space-y-2">
              {weeklyReports.map(r => (
                <div key={r._id} className="flex items-center gap-3 p-3 bg-zinc-800/40 rounded-xl">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold">Semaine {r.week}</p>
                    <p className="text-[10px] text-zinc-500">
                      {r.plays?.toLocaleString()} écoutes · +{r.newFollowers} fans
                      {r.topCountry && ` · 🌍 ${r.topCountry}`}
                    </p>
                  </div>
                  {r.topSong?.image && <img src={r.topSong.image} className="w-8 h-8 rounded-lg object-cover shrink-0" alt="" />}
                  <div className="text-right shrink-0">
                    {r.emailSent
                      ? <span className="text-[9px] text-green-400 bg-green-500/10 px-1.5 py-0.5 rounded-full flex items-center gap-0.5"><Mail size={8}/> Envoyé</span>
                      : <span className="text-[9px] text-zinc-600">Non envoyé</span>
                    }
                  </div>
                </div>
              ))}
            </div>
          )}
        </Section>
      )}
    </div>
  );
};

export default ArtistAnalyticsView;