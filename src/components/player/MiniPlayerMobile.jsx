import React from 'react';
import { Play, Pause, SkipForward, Heart, ChevronUp, Download, Check } from 'lucide-react';
// import "./fullplayer.css";

const MiniPlayerMobile = ({
  currentSong,
  isPlaying,
  setIsPlaying,
  handleNext,
  toggleLike,
  onOpenFullPlayer,
  currentTime,
  duration,
  initAudioEngine,
  audioRef,
  cacheAudio,
  removeCached,
  isAudioCached,
}) => {
  if (!currentSong) return null;

  const prog = duration > 0 ? (currentTime / duration) * 100 : 0;
  const cached = isAudioCached ? isAudioCached(currentSong._id ?? currentSong) : false;

  const handleCacheToggle = async (e) => {
    e.stopPropagation();
    if (!cacheAudio || !removeCached) return;
    if (cached) {
      await removeCached(currentSong);
    } else {
      await cacheAudio(currentSong);
    }
  };

  const handleSeek = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    if (audioRef?.current) {
      audioRef.current.currentTime = ((e.clientX - r.left) / r.width) * duration;
    }
  };

  return (
    <div className="fp-mini">

      {/* ── Barre de progression cliquable ── */}
      <div className="fp-mini-prog" onClick={handleSeek}>
        <div className="fp-mini-prog-fill" style={{ width: `${prog}%` }} />
        <div className="fp-mini-prog-thumb" style={{ left: `${prog}%` }} />
      </div>

      {/* ── Corps ── */}
      <div className="fp-mini-body">

        {/* Fond ambiant depuis la pochette */}
        {currentSong.image && (
          <div className="fp-mini-bg">
            <img src={currentSong.image} className="fp-mini-bg-img" alt="" />
            <div className="fp-mini-bg-tint" />
          </div>
        )}

        {/* Contenu — tap sur le fond ouvre le FullPlayer */}
        <div className="fp-mini-content" onClick={onOpenFullPlayer}>
          {/* Pochette */}
          <div className="fp-mini-cover-wrap">
            <img
              src={currentSong.image}
              className={`fp-mini-cover${isPlaying ? '' : ' paused'}`}
              alt=""
            />
            {isPlaying && <div className="fp-mini-live-dot" />}
          </div>

          {/* Titre + artiste */}
          <div className="fp-mini-meta">
            <p className="fp-mini-title">{currentSong.titre}</p>
            <p className="fp-mini-artist">{currentSong.artiste}</p>
          </div>

          {/* Boutons — stopPropagation pour ne pas ouvrir le FullPlayer */}
          <div className="fp-mini-actions" onClick={(e) => e.stopPropagation()}>

            {/* Cache hors-ligne */}
            {(cacheAudio || removeCached) && (
              <button
                onClick={handleCacheToggle}
                title={cached ? 'Supprimer du hors-ligne' : 'Écouter hors-ligne'}
                className="fp-mini-btn"
              >
                {cached
                  ? <Check size={16} color="#4ade80" />
                  : <Download size={16} />
                }
              </button>
            )}

            {/* Like */}
            <button onClick={() => toggleLike(currentSong._id)} className="fp-mini-btn">
              <Heart
                size={18}
                fill={currentSong.liked ? '#ef4444' : 'none'}
                color={currentSong.liked ? '#ef4444' : 'currentColor'}
              />
            </button>

            {/* Play/Pause avec anneau gradient */}
            <button
              onClick={() => { initAudioEngine(); setIsPlaying((p) => !p); }}
              className="fp-mini-play"
            >
              <div className="fp-mini-play-ring">
                <div className="fp-mini-play-ring-inner" />
              </div>
              <div className="fp-mini-play-icon">
                {isPlaying
                  ? <Pause fill="white" size={16} color="white" />
                  : <Play fill="white" size={16} color="white" style={{ marginLeft: 2 }} />
                }
              </div>
            </button>

            {/* Suivant */}
            <button onClick={handleNext} className="fp-mini-btn">
              <SkipForward size={18} color="rgba(255,255,255,.7)" />
            </button>
          </div>

          <ChevronUp size={14} className="fp-mini-chevron" />
        </div>
      </div>
    </div>
  );
};

export default MiniPlayerMobile;
