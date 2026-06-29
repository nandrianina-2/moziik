import React, { useState, useEffect } from 'react';
import { MessageCircle, ChevronUp, ChevronDown, Send, Heart, Reply, Loader2 } from 'lucide-react';
import { API } from '../../config/api';

const CommentsSection = ({ songId, token, userNom, isLoggedIn, theme = 'dark' }) => {
  const [comments, setComments]   = useState([]);
  const [total, setTotal]         = useState(0);
  const [page, setPage]           = useState(1);
  const [hasMore, setHasMore]     = useState(false);
  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo]     = useState(null);
  const [replyText, setReplyText] = useState('');
  const [loading, setLoading]     = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [expanded, setExpanded]   = useState(false);

  // ── theme classes ──────────────────────────
  const isDark = theme === 'dark';
  const t = {
    card:        isDark ? 'bg-zinc-900/40'          : 'bg-zinc-100',
    input:       isDark ? 'bg-zinc-800/60 border-zinc-700 text-white placeholder-zinc-600 focus:ring-red-600'
                        : 'bg-white border-zinc-300 text-zinc-900 placeholder-zinc-400 focus:ring-red-500',
    text:        isDark ? 'text-zinc-400'            : 'text-zinc-700',
    textBold:    isDark ? 'text-zinc-300'            : 'text-zinc-800',
    textMuted:   isDark ? 'text-zinc-600'            : 'text-zinc-500',
    avatar:      isDark ? 'bg-zinc-700'              : 'bg-zinc-200',
    avatarMe:    isDark ? 'bg-red-600/20 border border-red-600/40' : 'bg-red-100 border border-red-300',
    border:      isDark ? 'border-zinc-700/50'       : 'border-zinc-200',
    trigger:     isDark ? 'text-zinc-400 hover:text-white' : 'text-zinc-500 hover:text-zinc-900',
    replyInput:  isDark ? 'bg-zinc-800 border-zinc-700 text-white placeholder-zinc-600 focus:ring-blue-500'
                        : 'bg-white border-zinc-300 text-zinc-900 placeholder-zinc-400 focus:ring-blue-400',
    moreBtn:     isDark ? 'text-zinc-500 hover:text-zinc-300 bg-zinc-800/40 hover:bg-zinc-800'
                        : 'text-zinc-500 hover:text-zinc-700 bg-zinc-100 hover:bg-zinc-200',
  };

  // ── charger les commentaires ───────────────
  const loadComments = async (p = 1, append = false) => {
    if (p === 1) setLoading(true); else setLoadingMore(true);
    try {
      const res = await fetch(`${API}/songs/${songId}/comments?page=${p}&limit=5`);
      if (!res.ok) throw new Error();
      const data = await res.json();

      // Le serveur retourne { comments: [...], pagination: {...} }
      // ou un tableau directement selon la version — on gère les deux
      const list  = Array.isArray(data) ? data : (data.comments || []);
      const pages = data.pagination?.pages || 1;
      const tot   = data.pagination?.total || list.length;

      if (append) setComments(prev => [...prev, ...list]);
      else        setComments(list);

      setTotal(tot);
      setHasMore(p < pages);
      setPage(p);
    } catch {}
    setLoading(false);
    setLoadingMore(false);
  };

  useEffect(() => {
    if (expanded) loadComments(1, false);
    else { setComments([]); setPage(1); }
  }, [songId, expanded]);

  // ── poster un commentaire ──────────────────
  const postComment = async () => {
    if (!newComment.trim() || !isLoggedIn) return;
    setLoading(true);
    try {
      const res = await fetch(`${API}/songs/${songId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ texte: newComment.trim(), auteur: userNom })
      });
      if (res.ok) { setNewComment(''); loadComments(1, false); }
    } catch {}
    setLoading(false);
  };

  // ── répondre ──────────────────────────────
  const postReply = async (commentId) => {
    if (!replyText.trim() || !isLoggedIn) return;
    try {
      const res = await fetch(`${API}/songs/${songId}/comments/${commentId}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ texte: replyText.trim(), auteur: userNom })
      });
      if (res.ok) { setReplyText(''); setReplyTo(null); loadComments(1, false); }
    } catch {}
  };

  // ── liker ─────────────────────────────────
  const likeComment = async (commentId) => {
    if (!isLoggedIn) return;
    try {
      await fetch(`${API}/songs/${songId}/comments/${commentId}/like`, {
        method: 'PUT', headers: { 'Authorization': `Bearer ${token}` }
      });
      loadComments(page, false);
    } catch {}
  };

  const countLabel = total > 0
    ? `${total} commentaire${total > 1 ? 's' : ''}`
    : 'Commenter';

  return (
    <div className="mt-3">
      {/* Trigger */}
      <button onClick={() => setExpanded(v => !v)}
        className={`flex items-center gap-1.5 text-xs font-bold transition ${t.trigger}`}>
        <MessageCircle size={13} />
        {countLabel}
        {expanded ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
      </button>

      {expanded && (
        <div className="mt-3 space-y-3">

          {/* Champ nouveau commentaire */}
          {isLoggedIn ? (
            <div className="flex gap-2">
              <div className={`w-7 h-7 rounded-full ${t.avatarMe} flex items-center justify-center text-xs font-black shrink-0`}>
                {(userNom || '?')[0].toUpperCase()}
              </div>
              <div className="flex-1 flex gap-2">
                <input
                  value={newComment}
                  onChange={e => setNewComment(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && postComment()}
                  placeholder="Écrire un commentaire..."
                  className={`flex-1 border rounded-xl px-3 py-2 text-xs outline-none focus:ring-1 transition ${t.input}`}
                />
                <button
                  onClick={postComment}
                  disabled={loading || !newComment.trim()}
                  className="p-2 bg-red-600 hover:bg-red-500 rounded-xl transition disabled:opacity-40 shrink-0 text-white">
                  {loading ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
                </button>
              </div>
            </div>
          ) : (
            <p className={`text-[10px] italic ${t.textMuted}`}>Connectez-vous pour commenter.</p>
          )}

          {/* Liste des commentaires */}
          {loading && comments.length === 0 ? (
            <div className={`flex items-center justify-center py-4 ${t.textMuted}`}>
              <Loader2 size={16} className="animate-spin mr-2" /> Chargement...
            </div>
          ) : comments.length === 0 ? (
            <p className={`text-[10px] italic py-2 ${t.textMuted}`}>Aucun commentaire pour l'instant.</p>
          ) : (
            <>
              {comments.map(c => (
                <div key={c._id} className={`${t.card} rounded-xl p-3 space-y-2`}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2 flex-1 min-w-0">
                      <div className={`w-6 h-6 rounded-full ${t.avatar} flex items-center justify-center text-[10px] font-black shrink-0`}>
                        {(c.auteur || '?')[0].toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className={`text-[10px] font-bold ${t.textBold}`}>{c.auteur}</p>
                        <p className={`text-xs mt-0.5 wrap-break-word ${t.text}`}>{c.texte}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => likeComment(c._id)}
                        className={`flex items-center gap-1 text-[10px] transition ${c.likedByMe ? 'text-red-400' : t.textMuted + ' hover:text-red-400'}`}>
                        <Heart size={11} fill={c.likedByMe ? 'red' : 'none'} />
                        {c.likes || 0}
                      </button>
                      {isLoggedIn && (
                        <button
                          onClick={() => setReplyTo(replyTo === c._id ? null : c._id)}
                          className={`flex items-center gap-1 text-[10px] transition ${replyTo === c._id ? 'text-blue-400' : t.textMuted + ' hover:text-blue-400'}`}>
                          <Reply size={11} /> Répondre
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Réponses */}
                  {c.reponses && c.reponses.length > 0 && (
                    <div className={`ml-8 space-y-2 border-l ${t.border} pl-3`}>
                      {c.reponses.map((r, i) => (
                        <div key={i} className="flex items-start gap-2">
                          <div className={`w-5 h-5 rounded-full ${t.avatar} flex items-center justify-center text-[9px] font-black shrink-0`}>
                            {(r.auteur || '?')[0].toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className={`text-[10px] font-bold ${t.textMuted}`}>{r.auteur}</p>
                            <p className={`text-[11px] wrap-break-word ${t.text}`}>{r.texte}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Champ réponse */}
                  {replyTo === c._id && isLoggedIn && (
                    <div className="ml-8 flex gap-2 mt-2">
                      <input
                        value={replyText}
                        onChange={e => setReplyText(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && postReply(c._id)}
                        placeholder="Votre réponse..."
                        className={`flex-1 border rounded-lg px-3 py-1.5 text-xs outline-none focus:ring-1 transition ${t.replyInput}`}
                      />
                      <button
                        onClick={() => postReply(c._id)}
                        disabled={!replyText.trim()}
                        className="p-1.5 bg-blue-600 hover:bg-blue-500 rounded-lg transition disabled:opacity-40 text-white shrink-0">
                        <Send size={12} />
                      </button>
                    </div>
                  )}
                </div>
              ))}

              {/* Charger plus */}
              {hasMore && (
                <button
                  onClick={() => loadComments(page + 1, true)}
                  disabled={loadingMore}
                  className={`w-full py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${t.moreBtn}`}>
                  {loadingMore ? <><Loader2 size={12} className="animate-spin" /> Chargement...</> : 'Voir plus de commentaires'}
                </button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default CommentsSection;