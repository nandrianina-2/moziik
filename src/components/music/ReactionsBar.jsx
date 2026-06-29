import React, { useState, useEffect } from 'react';
import { API } from '../../config/api.js';

const ReactionsBar = ({ songId, token, isLoggedIn }) => {
  const [reactions, setReactions] = useState({ fire: 0, heart: 0, star: 0, userReaction: null });

  useEffect(() => {
    fetch(`${API}/songs/${songId}/reactions`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setReactions(d); });
  }, [songId]);

  const react = async (type) => {
    if (!isLoggedIn) return;
    const res = await fetch(`${API}/songs/${songId}/reactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ type })
    });
    if (res.ok) setReactions(await res.json());
  };

  const emojis = [
    { type: 'fire', emoji: '🔥', label: reactions.fire || 0 },
    { type: 'heart', emoji: '❤️', label: reactions.heart || 0 },
    { type: 'star', emoji: '⭐', label: reactions.star || 0 },
  ];

  return (
    <div className="flex items-center gap-2 mt-2">
      {emojis.map(e => (
        <button key={e.type} onClick={() => react(e.type)}
          className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-bold transition ${reactions.userReaction === e.type ? 'bg-white/10 ring-1 ring-white/20' : 'hover:bg-white/5'} ${isLoggedIn ? 'cursor-pointer' : 'cursor-default opacity-70'}`}>
          {e.emoji} <span className="text-zinc-400">{e.label}</span>
        </button>
      ))}
    </div>
  );
};

export default ReactionsBar;
