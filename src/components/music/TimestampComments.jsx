import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  MessageCircle, Heart, Reply, Trash2, Flag, Send,
  ChevronDown, ChevronUp, X, Loader2, Check,
  Smile, Clock, Flame, Star, Zap
} from 'lucide-react';
import { API } from '../../config/api';

// ════════════════════════════════════════════
// CONSTANTES
// ════════════════════════════════════════════
const QUICK_EMOJIS = ['🔥', '❤️', '😮', '😂', '🎵', '⚡', '💯', '👑'];
const QUICK_TEXTS  = [
  'Cette partie 🔥', 'Moment parfait !', 'Drop incroyable',
  'J\'adore ce passage', 'Trop bon ici', 'Vibes 🎵'
];

const formatTs = (s) => {
  if (!s && s !== 0) return '0:00';
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${String(sec).padStart(2, '0')}`;
};

const timeAgo = (date) => {
  const d = Date.now() - new Date(date).getTime();
  if (d < 60000)   return 'À l\'instant';
  if (d < 3600000) return `${Math.floor(d/60000)} min`;
  if (d < 86400000)return `${Math.floor(d/3600000)} h`;
  return new Date(date).toLocaleDateString('fr-FR', { day:'numeric', month:'short' });
};

// ════════════════════════════════════════════
// COMPOSANT: Marqueur sur la barre de progression
// ════════════════════════════════════════════
export const TimestampMarkers = ({
  comments,        // liste des commentaires
  duration,        // durée totale en secondes
  currentTime,     // temps actuel
  onMarkerClick,   // (timestamp) => void — seek vers ce point
  activeCommentId, // ID du commentaire survolé/actif
}) => {
  if (!duration || !comments?.length) return null;

  // Grouper les commentaires proches (< 2s) pour éviter l'empilement
  const grouped = useMemo(() => {
    const buckets = {};
    comments.forEach(c => {
      const key = Math.round(c.timestamp / 2) * 2;
      if (!buckets[key]) buckets[key] = [];
      buckets[key].push(c);
    });
    return buckets;
  }, [comments]);

  return (
    <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 5 }}>
      {Object.entries(grouped).map(([ts, group]) => {
        const pct   = (parseFloat(ts) / duration) * 100;
        const isNear= Math.abs(currentTime - parseFloat(ts)) < 3;
        const isActive = group.some(c => c._id === activeCommentId);
        const hasEmoji = group.some(c => c.emoji);
        const emoji    = group.find(c => c.emoji)?.emoji || '';
        const count    = group.length;

        return (
          <div key={ts}
            className="absolute top-0 -translate-x-1/2 pointer-events-auto cursor-pointer"
            style={{ left: `${Math.min(98, Math.max(2, pct))}%` }}
            onClick={e => { e.stopPropagation(); onMarkerClick(parseFloat(ts)); }}>
            {/* Ligne verticale */}
            <div className={`absolute top-0 w-0.5 transition-all duration-200 ${
              isActive || isNear
                ? 'h-4 bg-yellow-400 opacity-100'
                : 'h-2.5 bg-white/50 opacity-70 hover:opacity-100 hover:h-4'
            }`}/>
            {/* Bulle */}
            {(isActive || isNear || count > 1) && (
              <div className={`absolute -top-6 -translate-x-1/2 left-0 flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-bold shadow-lg transition-all ${
                isActive ? 'bg-yellow-400 text-black scale-110' : 'bg-zinc-800/90 text-white border border-zinc-700/60'
              }`}>
                {emoji || '💬'} {count > 1 && count}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

// ════════════════════════════════════════════
// COMPOSANT: Popup commentaire inline (au dessus de la barre)
// Apparaît quand on survole/clique un marqueur
// ════════════════════════════════════════════
const CommentPopup = ({ comment, onClose, onSeek, onLike, userId }) => {
  if (!comment) return null;
  return (
    <div className="absolute z-20 bottom-8 bg-zinc-900/95 border border-zinc-700/60 rounded-2xl p-3 shadow-2xl min-w-[200px] max-w-[260px]"
      style={{ left: `calc(${Math.min(80, Math.max(5, (comment.timestamp / (comment._duration || 200)) * 100))}% - 100px)` }}
      onClick={e => e.stopPropagation()}>
      <div className="flex items-start gap-2.5">
        <div className="w-7 h-7 rounded-full bg-zinc-700 overflow-hidden shrink-0 flex items-center justify-center text-xs font-black text-zinc-400">
          {comment.userId?.avatar
            ? <img src={comment.userId.avatar} className="w-full h-full object-cover" alt=""/>
            : (comment.userId?.nom || '?')[0].toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <p className="text-[10px] font-bold text-zinc-300 truncate">{comment.userId?.nom || 'Utilisateur'}</p>
            <button onClick={() => onSeek(comment.timestamp)}
              className="text-[9px] bg-yellow-500/20 text-yellow-400 px-1.5 py-0.5 rounded-full font-bold flex items-center gap-0.5 hover:bg-yellow-500/30 transition shrink-0">
              <Clock size={7}/> {formatTs(comment.timestamp)}
            </button>
          </div>
          <p className="text-xs text-zinc-200 leading-relaxed">{comment.text}</p>
        </div>
        <button onClick={onClose} className="text-zinc-600 hover:text-white p-0.5 shrink-0"><X size={12}/></button>
      </div>
      {/* Like rapide */}
      <div className="flex items-center justify-between mt-2 pt-2 border-t border-zinc-800">
        <button onClick={() => onLike(comment._id)}
          className={`flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-lg transition ${
            comment.liked ? 'text-red-400 bg-red-500/10' : 'text-zinc-500 hover:text-white hover:bg-zinc-800'
          }`}>
          <Heart size={11} fill={comment.liked ? '#ef4444' : 'none'}/> {comment.likes || 0}
        </button>
        <p className="text-[9px] text-zinc-600">{timeAgo(comment.createdAt)}</p>
      </div>
    </div>
  );
};

// ════════════════════════════════════════════
// COMPOSANT: Carte commentaire individuel
// ════════════════════════════════════════════
const CommentCard = ({
  comment, currentTime, onSeek, onLike, onDelete, onReply, onReport,
  userId, isOwn, isAdmin, isActive,
}) => {
  const [showReplies, setShowReplies]   = useState(false);
  const [replyText, setReplyText]       = useState('');
  const [replying, setReplying]         = useState(false);
  const [sending, setSending]           = useState(false);
  const isNear = Math.abs(currentTime - comment.timestamp) < 3;

  const handleReply = async () => {
    if (!replyText.trim()) return;
    setSending(true);
    await onReply(comment._id, replyText.trim());
    setReplyText(''); setReplying(false); setSending(false);
    setShowReplies(true);
  };

  return (
    <div className={`rounded-2xl p-3.5 transition-all duration-300 ${
      isActive
        ? 'bg-yellow-500/10 border border-yellow-500/30 shadow-lg shadow-yellow-500/5'
        : isNear
        ? 'bg-white/5 border border-white/10'
        : 'bg-zinc-900/50 border border-zinc-800/50 hover:border-zinc-700/50'
    }`}>
      <div className="flex items-start gap-2.5">
        {/* Avatar */}
        <div className="w-8 h-8 rounded-full bg-zinc-800 overflow-hidden shrink-0 flex items-center justify-center text-sm font-black text-zinc-500">
          {comment.userId?.avatar
            ? <img src={comment.userId.avatar} className="w-full h-full object-cover" alt=""/>
            : (comment.userId?.nom || '?')[0].toUpperCase()}
        </div>

        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <p className="text-xs font-bold text-zinc-300">{comment.userId?.nom || 'Utilisateur'}</p>
            {/* Timestamp cliquable → seek */}
            <button onClick={() => onSeek(comment.timestamp)}
              className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full transition active:scale-95 ${
                isNear
                  ? 'bg-yellow-500/25 text-yellow-300 animate-pulse'
                  : 'bg-zinc-800 text-zinc-400 hover:bg-yellow-500/20 hover:text-yellow-300'
              }`}>
              <Clock size={8}/> {formatTs(comment.timestamp)}
            </button>
            {comment.emoji && <span className="text-base">{comment.emoji}</span>}
            <span className="text-[9px] text-zinc-600 ml-auto">{timeAgo(comment.createdAt)}</span>
          </div>

          {/* Texte */}
          <p className="text-sm text-zinc-200 leading-relaxed">{comment.text}</p>

          {/* Actions */}
          <div className="flex items-center gap-1 mt-2">
            <button onClick={() => onLike(comment._id)}
              className={`flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-lg transition active:scale-95 ${
                comment.liked
                  ? 'text-red-400 bg-red-500/10 hover:bg-red-500/15'
                  : 'text-zinc-500 hover:text-white hover:bg-zinc-800'
              }`}>
              <Heart size={11} fill={comment.liked ? '#ef4444' : 'none'}/> {comment.likes || 0}
            </button>

            {userId && (
              <button onClick={() => setReplying(r => !r)}
                className="flex items-center gap-1 text-[10px] text-zinc-500 hover:text-white px-2 py-1 rounded-lg hover:bg-zinc-800 transition">
                <Reply size={11}/> Répondre
              </button>
            )}

            {comment.replies?.length > 0 && (
              <button onClick={() => setShowReplies(r => !r)}
                className="flex items-center gap-1 text-[10px] text-zinc-500 hover:text-violet-400 px-2 py-1 rounded-lg hover:bg-zinc-800 transition">
                <MessageCircle size={11}/>
                {comment.replies.length} réponse{comment.replies.length > 1 ? 's' : ''}
                {showReplies ? <ChevronUp size={9}/> : <ChevronDown size={9}/>}
              </button>
            )}

            {/* Actions owner / admin */}
            <div className="ml-auto flex items-center gap-1">
              {!isOwn && !isAdmin && (
                <button onClick={() => onReport(comment._id)}
                  className="p-1.5 text-zinc-700 hover:text-orange-400 hover:bg-orange-500/10 rounded-lg transition">
                  <Flag size={10}/>
                </button>
              )}
              {(isOwn || isAdmin) && (
                <button onClick={() => onDelete(comment._id)}
                  className="p-1.5 text-zinc-700 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition">
                  <Trash2 size={10}/>
                </button>
              )}
            </div>
          </div>

          {/* Réponses */}
          {showReplies && comment.replies?.length > 0 && (
            <div className="mt-2 pl-3 border-l-2 border-zinc-800 space-y-2">
              {comment.replies.map((r, i) => (
                <div key={i} className="flex items-start gap-2">
                  <div className="w-5 h-5 rounded-full bg-zinc-800 overflow-hidden shrink-0 flex items-center justify-center text-[9px] font-black text-zinc-500">
                    {r.avatar ? <img src={r.avatar} className="w-full h-full object-cover" alt=""/> : (r.nom||'?')[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] font-bold text-zinc-400">{r.nom} </span>
                    <span className="text-xs text-zinc-300">{r.text}</span>
                    <p className="text-[9px] text-zinc-600 mt-0.5">{timeAgo(r.createdAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Input réponse */}
          {replying && (
            <div className="flex gap-2 mt-2">
              <input value={replyText} onChange={e => setReplyText(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleReply()}
                placeholder="Votre réponse..."
                maxLength={280}
                className="flex-1 bg-zinc-800 rounded-xl px-3 py-1.5 text-xs outline-none focus:ring-1 ring-violet-500 text-white placeholder-zinc-600"/>
              <button onClick={handleReply} disabled={sending || !replyText.trim()}
                className="p-1.5 bg-violet-600 hover:bg-violet-500 text-white rounded-xl transition disabled:opacity-40">
                {sending ? <Loader2 size={12} className="animate-spin"/> : <Send size={12}/>}
              </button>
              <button onClick={() => setReplying(false)} className="p-1.5 text-zinc-500 hover:text-white rounded-xl hover:bg-zinc-800 transition">
                <X size={12}/>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ════════════════════════════════════════════
// COMPOSANT PRINCIPAL: TimestampComments
// À intégrer dans FullPlayerPage et/ou SongRow
// ════════════════════════════════════════════
const TimestampComments = ({
  songId,
  currentTime,
  duration,
  onSeek,        // (timestamp) => void
  token,
  isLoggedIn,
  userNom,
  userId,
  isAdmin,
  // Callbacks pour la barre de progression
  onMarkersReady, // (comments) => void — pour afficher les marqueurs dans la barre
}) => {
  const [comments, setComments]       = useState([]);
  const [loading, setLoading]         = useState(true);
  const [inputText, setInputText]     = useState('');
  const [inputEmoji, setInputEmoji]   = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showQuickTexts, setShowQuickTexts]   = useState(false);
  const [posting, setPosting]         = useState(false);
  const [activeId, setActiveId]       = useState(null);
  const [sortBy, setSortBy]           = useState('time');  // 'time' | 'likes' | 'recent'
  const [filter, setFilter]           = useState('all');   // 'all' | 'near'
  const [showAll, setShowAll]         = useState(false);
  const inputRef   = useRef(null);
  const listRef    = useRef(null);
  const prevSongId = useRef(null);

  // ── Charger les commentaires ──
  const load = useCallback(async () => {
    if (!songId) return;
    setLoading(true);
    try {
      const res  = await fetch(`${API}/songs/${songId}/ts-comments`);
      const data = res.ok ? await res.json() : [];
      const list = Array.isArray(data) ? data : [];
      setComments(list);
      onMarkersReady?.(list);
    } catch { setComments([]); }
    setLoading(false);
  }, [songId, onMarkersReady]);

  useEffect(() => {
    if (prevSongId.current !== songId) {
      prevSongId.current = songId;
      setComments([]);
      setActiveId(null);
      setInputText('');
      setInputEmoji('');
    }
    load();
  }, [songId, load]);

  // ── Auto-highlight du commentaire le plus proche ──
  useEffect(() => {
    if (!comments.length || !currentTime) return;
    const nearest = comments.reduce((best, c) => {
      const diff = Math.abs(c.timestamp - currentTime);
      return diff < Math.abs(best.diff) ? { id: c._id, diff } : best;
    }, { id: null, diff: Infinity });
    if (nearest.diff < 4) setActiveId(nearest.id);
    else setActiveId(null);
  }, [Math.floor(currentTime), comments]);

  // ── Auto-scroll vers le commentaire actif ──
  useEffect(() => {
    if (!activeId || !listRef.current) return;
    const el = listRef.current.querySelector(`[data-id="${activeId}"]`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [activeId]);

  // ── Poster un commentaire ──
  const handlePost = async () => {
    if (!inputText.trim() || !token) return;
    setPosting(true);
    try {
      const res = await fetch(`${API}/songs/${songId}/ts-comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ timestamp: currentTime, text: inputText.trim(), emoji: inputEmoji }),
      });
      const data = await res.json();
      if (res.ok) {
        const newComment = { ...data, liked: false };
        setComments(prev => [...prev, newComment].sort((a, b) => a.timestamp - b.timestamp));
        onMarkersReady?.([...comments, newComment]);
        setInputText(''); setInputEmoji(''); setShowEmojiPicker(false);
      }
    } catch {}
    setPosting(false);
  };

  // ── Like ──
  const handleLike = async (commentId) => {
    if (!token) return;
    try {
      const res  = await fetch(`${API}/songs/${songId}/ts-comments/${commentId}/like`, {
        method: 'PUT', headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setComments(prev => prev.map(c => c._id === commentId
          ? { ...c, likes: data.likes, liked: data.liked }
          : c
        ));
      }
    } catch {}
  };

  // ── Répondre ──
  const handleReply = async (commentId, text) => {
    const res = await fetch(`${API}/songs/${songId}/ts-comments/${commentId}/reply`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ text }),
    });
    if (res.ok) {
      const reply = await res.json();
      setComments(prev => prev.map(c => c._id === commentId
        ? { ...c, replies: [...(c.replies || []), reply] }
        : c
      ));
    }
  };

  // ── Supprimer ──
  const handleDelete = async (commentId) => {
    const res = await fetch(`${API}/songs/${songId}/ts-comments/${commentId}`, {
      method: 'DELETE', headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const updated = comments.filter(c => c._id !== commentId);
      setComments(updated);
      onMarkersReady?.(updated);
    }
  };

  // ── Signaler ──
  const handleReport = async (commentId) => {
    await fetch(`${API}/songs/${songId}/ts-comments/${commentId}/report`, {
      method: 'POST', headers: { Authorization: `Bearer ${token}` },
    });
  };

  // ── Trier / filtrer ──
  const sortedComments = useMemo(() => {
    let list = [...comments];
    if (filter === 'near') list = list.filter(c => Math.abs(c.timestamp - currentTime) < 10);
    switch (sortBy) {
      case 'likes':  list.sort((a, b) => (b.likes || 0) - (a.likes || 0)); break;
      case 'recent': list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)); break;
      default:       list.sort((a, b) => a.timestamp - b.timestamp);
    }
    return list;
  }, [comments, sortBy, filter, currentTime]);

  const displayedComments = showAll ? sortedComments : sortedComments.slice(0, 8);
  const nearCount = useMemo(() => comments.filter(c => Math.abs(c.timestamp - currentTime) < 10).length, [comments, currentTime]);

  return (
    <div className="flex flex-col gap-4">

      {/* ── Header ── */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h3 className="text-sm font-black flex items-center gap-2 text-zinc-300">
          <MessageCircle size={15} className="text-blue-400"/>
          Commentaires audio
          <span className="text-[10px] bg-zinc-800 text-zinc-500 px-2 py-0.5 rounded-full">{comments.length}</span>
        </h3>
        {/* Tri + filtre */}
        <div className="flex gap-1">
          {nearCount > 0 && (
            <button onClick={() => setFilter(f => f === 'near' ? 'all' : 'near')}
              className={`text-[10px] font-bold px-2.5 py-1 rounded-full transition border ${
                filter === 'near'
                  ? 'bg-yellow-500/20 border-yellow-500/40 text-yellow-300'
                  : 'bg-zinc-800 border-zinc-700 text-zinc-500 hover:text-white'
              }`}>
              <Clock size={9} className="inline mr-1"/>Ici ({nearCount})
            </button>
          )}
          {['time','likes','recent'].map(s => (
            <button key={s} onClick={() => setSortBy(s)}
              className={`text-[10px] font-bold px-2.5 py-1 rounded-full transition border ${
                sortBy === s
                  ? 'bg-zinc-700 border-zinc-600 text-white'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-600 hover:text-white'
              }`}>
              {s === 'time' ? '⏱' : s === 'likes' ? '❤️' : '🕒'}
            </button>
          ))}
        </div>
      </div>

      {/* ── Zone d'écriture ── */}
      {isLoggedIn ? (
        <div className="bg-zinc-900/80 border border-zinc-800/60 rounded-2xl p-3 space-y-2.5">
          {/* Timestamp actuel */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 text-[10px] font-bold bg-yellow-500/15 text-yellow-300 border border-yellow-500/25 px-2.5 py-1 rounded-full">
              <Clock size={9}/> Commenter à {formatTs(currentTime)}
            </div>
            <p className="text-[10px] text-zinc-600">sur ce moment précis</p>
          </div>

          {/* Emoji rapide */}
          <div className="flex gap-1.5 flex-wrap">
            {QUICK_EMOJIS.map(e => (
              <button key={e} onClick={() => setInputEmoji(inputEmoji === e ? '' : e)}
                className={`text-base px-1.5 py-0.5 rounded-lg transition ${
                  inputEmoji === e ? 'bg-white/15 ring-1 ring-white/30 scale-110' : 'hover:bg-white/10'
                }`}>
                {e}
              </button>
            ))}
          </div>

          {/* Input texte */}
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <input
                ref={inputRef}
                value={inputText}
                onChange={e => setInputText(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handlePost(); } }}
                placeholder={`Votre réaction à ${formatTs(currentTime)}...`}
                maxLength={280}
                className="w-full bg-zinc-800 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-1 ring-blue-500/60 text-white placeholder-zinc-600 pr-10"/>
              <span className="absolute right-3 top-2.5 text-[10px] text-zinc-600">{inputText.length}/280</span>
            </div>
            <button onClick={handlePost} disabled={posting || !inputText.trim()}
              className="px-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-sm transition disabled:opacity-40 flex items-center gap-1.5 active:scale-95 shrink-0">
              {posting ? <Loader2 size={14} className="animate-spin"/> : <Send size={14}/>}
            </button>
          </div>

          {/* Textes rapides */}
          <div className="flex gap-1.5 overflow-x-auto pb-0.5" style={{ scrollbarWidth: 'none' }}>
            {QUICK_TEXTS.map(t => (
              <button key={t} onClick={() => setInputText(t)}
                className="shrink-0 text-[10px] bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white px-2.5 py-1 rounded-full transition">
                {t}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl p-4 text-center">
          <MessageCircle size={22} className="text-zinc-600 mx-auto mb-1.5"/>
          <p className="text-xs text-zinc-500">Connectez-vous pour commenter ce moment</p>
        </div>
      )}

      {/* ── Liste des commentaires ── */}
      {loading ? (
        <div className="flex items-center justify-center py-8 text-zinc-600">
          <Loader2 size={18} className="animate-spin mr-2"/> Chargement...
        </div>
      ) : sortedComments.length === 0 ? (
        <div className="text-center py-8 text-zinc-700">
          <MessageCircle size={28} className="mx-auto mb-2 opacity-20"/>
          <p className="text-sm">Soyez le premier à commenter ce titre</p>
          <p className="text-[11px] mt-1 text-zinc-700">Appuyez Play puis écrivez votre réaction</p>
        </div>
      ) : (
        <div ref={listRef} className="space-y-2.5">
          {displayedComments.map(comment => (
            <div key={comment._id} data-id={comment._id}>
              <CommentCard
                comment={{ ...comment, _duration: duration }}
                currentTime={currentTime}
                onSeek={onSeek}
                onLike={handleLike}
                onDelete={handleDelete}
                onReply={handleReply}
                onReport={handleReport}
                userId={userId}
                isOwn={String(comment.userId?._id || comment.userId) === String(userId)}
                isAdmin={isAdmin}
                isActive={comment._id === activeId}
              />
            </div>
          ))}
          {/* Voir plus */}
          {sortedComments.length > 8 && (
            <button onClick={() => setShowAll(v => !v)}
              className="w-full text-xs text-zinc-500 hover:text-white py-2 rounded-xl hover:bg-zinc-800 transition flex items-center justify-center gap-1.5">
              {showAll
                ? <><ChevronUp size={13}/> Réduire</>
                : <><ChevronDown size={13}/> Voir {sortedComments.length - 8} autres commentaires</>}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default TimestampComments;