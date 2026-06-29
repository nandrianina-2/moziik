import { memo, useCallback } from 'react';
import {
  Play, Pause, SkipBack, SkipForward,
  Shuffle, Repeat, Repeat1, Heart,
  Volume2, VolumeX, Radio, Tag,
  MessageCircle, Download, Share2, Moon, Check,
} from 'lucide-react';
import "./fullplayer.css"

/**
 * @param {{
 *   currentSong: import('../types/player').Song | null,
 *   isPlaying: boolean,
 *   setIsPlaying: (fn: (v: boolean) => boolean) => void,
 *   currentTime: number,
 *   duration: number,
 *   handleNext: () => void,
 *   handlePrev: () => void,
 *   isShuffle: boolean,
 *   setIsShuffle: (fn: (v: boolean) => boolean) => void,
 *   repeatMode: 0 | 1 | 2,
 *   setRepeatMode: (fn: (v: number) => number) => void,
 *   volume: number,
 *   setVolume: React.Dispatch<React.SetStateAction<number>>,
 *   sleepTimer: number,
 *   setSleepTimer: (v: number) => void,
 *   accentHex: string,
 *   accentCSS: string,
 *   heartAnim: boolean,
 *   onLike: () => void,
 *   onSeek: (e: React.MouseEvent) => void,
 *   onSeekTouch: (e: React.TouchEvent) => void,
 *   tsComments: import('../types/player').Comment[],
 *   onSeekToTimestamp: (ts: number) => void,
 *   setActiveTab: (tab: string) => void,
 *   formatTime: (s: number) => string,
 *   initAudioEngine: () => void,
 *   onOpenListenParty?: () => void,
 *   onShareClick: () => void,
 *   isAudioCached: (id?: string) => boolean,
 *   cacheAudio: (song: import('../types/player').Song) => Promise<void>,
 *   removeCached: (song: import('../types/player').Song) => Promise<void>,
 * }} props
 */
const PlayerView = memo(({
  currentSong, isPlaying, setIsPlaying,
  currentTime, duration,
  handleNext, handlePrev,
  isShuffle, setIsShuffle,
  repeatMode, setRepeatMode,
  volume, setVolume,
  sleepTimer, setSleepTimer,
  accentHex, accentCSS,
  heartAnim, onLike,
  onSeek, onSeekTouch,
  tsComments, onSeekToTimestamp, setActiveTab,
  formatTime, initAudioEngine,
  onOpenListenParty,
  onShareClick,
  isAudioCached, cacheAudio, removeCached,
}) => {
  const prog = duration > 0 ? (currentTime / duration) * 100 : 0;
  const cached = isAudioCached(currentSong?._id);

  const handleDownload = useCallback(async () => {
    if (!currentSong) return;
    cached ? await removeCached(currentSong) : await cacheAudio(currentSong);
  }, [cached, currentSong, cacheAudio, removeCached]);

  return (
    <div
      className={`fp-pv fp-fade ${isPlaying ? 'fp-playing' : 'fp-paused'}`}
      style={{ '--fp-accent-hex': accentHex }}
    >

      {/* ── Cover ── */}
      <div className="fp-cover-row">
        <div className="fp-cover-col">
          {currentSong?.image && (
            <>
              <div
                className="fp-glow-layer-1"
                style={{ backgroundImage: `url(${currentSong.image})` }}
              />
              <div className="fp-glow-layer-2" style={{ background: `rgba(${accentCSS},.32)` }} />
            </>
          )}
          <div className="fp-cover-wrap">
            <div className="fp-cover-inner">
              <img src={currentSong?.image} alt={currentSong?.titre} className="fp-cover-img" />
              {currentSong?.format && (
                <div className="fp-badge fp-cover-fmt-badge" style={{ background: `rgba(${accentCSS},1)` }}>
                  {currentSong.format}
                </div>
              )}
              {isPlaying && (
                <>
                  <div className="fp-ring fp-ring-1" style={{ borderColor: `rgba(${accentCSS},.4)` }} />
                  <div className="fp-ring fp-ring-2" style={{ borderColor: `rgba(${accentCSS},.4)` }} />
                  <div className="fp-ring fp-ring-3" style={{ borderColor: `rgba(${accentCSS},.4)` }} />
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Title + meta ── */}
      <div className="fp-meta">
        {/* Stats row */}
        {(currentSong?.plays || duration > 0) && (
          <div className="fp-stats-row">
            {currentSong?.plays > 0 && (
              <div>
                <div className="fp-stat-num" style={{ color: `rgba(${accentCSS},1)`, fontFamily: 'var(--fp-mono)' }}>
                  {currentSong.plays >= 1000 ? `${(currentSong.plays / 1000).toFixed(1)}K` : currentSong.plays}
                </div>
                <div className="fp-stat-label">Écoutes</div>
              </div>
            )}
            {duration > 0 && (
              <div>
                <div className="fp-stat-num" style={{ color: `rgba(${accentCSS},.7)` }}>{formatTime(duration)}</div>
                <div className="fp-stat-label">Durée</div>
              </div>
            )}
            {currentSong?.annee && (
              <div>
                <div className="fp-stat-num" style={{ color: `rgba(${accentCSS},.5)` }}>{currentSong.annee}</div>
                <div className="fp-stat-label">Année</div>
              </div>
            )}
          </div>
        )}

        <div className="fp-title-row">
          <div className="fp-title-main">
            <h2 className="fp-title">{currentSong?.titre}</h2>
            <div className="fp-artist-row">
              <span className="fp-artist" style={{ color: `rgba(${accentCSS},1)` }}>{currentSong?.artiste}</span>
              {currentSong?.album && <span className="fp-album">· {currentSong.album}</span>}
            </div>
            {currentSong?.moods?.length > 0 && (
              <div className="fp-moods">
                {currentSong.moods.map((m) => (
                  <span key={m} className="fp-mood"><Tag size={7} />{m}</span>
                ))}
              </div>
            )}
          </div>
          <button
            onClick={onLike}
            className={`fp-like-btn${currentSong?.liked ? ' liked' : ''}${heartAnim ? ' anim' : ''}`}
          >
            <Heart size={24} fill={currentSong?.liked ? '#ef4444' : 'none'} color={currentSong?.liked ? '#ef4444' : 'rgba(255,255,255,.28)'} />
          </button>
        </div>
      </div>

      {/* ── Genre / format tags ── */}
      <div className="fp-tags-row">
        {currentSong?.genre && <span className="fp-tag">{currentSong.genre}</span>}
        {currentSong?.format && (
          <span className="fp-tag accent" style={{ background: `rgba(${accentCSS},.14)`, color: `rgba(${accentCSS},1)`, borderColor: `rgba(${accentCSS},.28)` }}>
            {currentSong.format}
          </span>
        )}
      </div>

      {/* ── Progress bar ── */}
      <div className="fp-prog-section">
        <div className="fp-prog-track" onClick={onSeek} onTouchMove={onSeekTouch}>
          <div className="fp-prog-fill" style={{ width: `${prog}%`, boxShadow: `0 0 8px rgba(${accentCSS},.4)` }}>
            <div className="fp-prog-thumb" />
          </div>
          {duration > 0 && tsComments.map((c) => {
            const pct = Math.min(97, Math.max(2, (c.timestamp / duration) * 100));
            const near = Math.abs(currentTime - c.timestamp) < 3;
            return (
              <div
                key={c._id}
                className="fp-ts-marker"
                style={{
                  left: `${pct}%`,
                  width: near ? 10 : 7,
                  height: near ? 10 : 7,
                  background: near ? `rgba(${accentCSS},1)` : 'rgba(255,255,255,.5)',
                  boxShadow: near ? `0 0 8px rgba(${accentCSS},.8)` : '',
                }}
                onClick={(e) => { e.stopPropagation(); onSeekToTimestamp(c.timestamp); setActiveTab('comments'); }}
              />
            );
          })}
        </div>
        <div className="fp-time-row">
          <span>{formatTime(currentTime)}</span>
          {tsComments.length > 0 && (
            <button
              className="fp-comments-link"
              onClick={() => setActiveTab('comments')}
              style={{ color: `rgba(${accentCSS},1)` }}
            >
              <MessageCircle size={9} /> {tsComments.length}
            </button>
          )}
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* ── Transport controls ── */}
      <div className="fp-transport">
        <button onClick={() => onOpenListenParty?.()} className="fp-party-btn">
          <Radio size={13} /> <span>Party</span>
        </button>

        <button
          onClick={() => setIsShuffle((v) => !v)}
          className={`fp-ctrl fp-ctrl-sm${isShuffle ? ' is-active' : ''}`}
          style={isShuffle ? { color: accentHex, background: `rgba(${accentCSS},.14)` } : undefined}
        >
          <Shuffle size={20} />
        </button>

        <button onClick={handlePrev} className="fp-ctrl fp-ctrl-skip">
          <SkipBack size={26} fill="currentColor" />
        </button>

        <button
          className="fp-play-btn"
          onClick={() => { initAudioEngine(); setIsPlaying((p) => !p); }}
        >
          {isPlaying
            ? <Pause fill="white" size={26} color="white" />
            : <Play fill="white" size={26} color="white" style={{ marginLeft: 3 }} />
          }
        </button>

        <button onClick={handleNext} className="fp-ctrl fp-ctrl-skip">
          <SkipForward size={26} fill="currentColor" />
        </button>

        <button
          onClick={() => setRepeatMode((m) => (m + 1) % 3)}
          className={`fp-ctrl fp-ctrl-sm${repeatMode > 0 ? ' is-active' : ''}`}
          style={repeatMode > 0 ? { color: accentHex, background: `rgba(${accentCSS},.14)` } : undefined}
        >
          {repeatMode === 2 ? <Repeat1 size={20} /> : <Repeat size={20} />}
        </button>

        <div className="fp-party-spacer" />
      </div>

      {/* ── Volume ── */}
      <div className="fp-vol-row">
        <button onClick={() => setVolume((v) => (v > 0 ? 0 : 80))} className="fp-vol-btn">
          {volume === 0 ? <VolumeX size={15} color="rgba(255,255,255,.2)" /> : <Volume2 size={15} color="rgba(255,255,255,.22)" />}
        </button>
        <div className="fp-vol-track">
          <div className="fp-vol-fill" style={{ width: `${volume}%` }} />
          <input type="range" min="0" max="100" value={volume} onChange={(e) => setVolume(parseInt(e.target.value, 10))} className="fp-vol-input" />
        </div>
        <span className="fp-vol-pct">{volume}%</span>
      </div>

      {/* ── Action pills ── */}
      <div className="fp-actions-row">
        <div className="fp-pills">
          <button onClick={onLike} className={`fp-pill${currentSong?.liked ? ' liked' : ''}`}>
            <Heart size={12} fill={currentSong?.liked ? '#f87171' : 'none'} />
            {currentSong?.liked ? 'Aimé' : 'Aimer'}
          </button>

          <button
            className={`fp-pill${cached ? ' cached' : ''}`}
            onClick={handleDownload}
          >
            {cached ? <><Check size={12} /> Téléchargé</> : <><Download size={12} /> Télécharger</>}
          </button>

          <button className="fp-pill" onClick={onShareClick}>
            <Share2 size={12} /> Partager
          </button>

          <button className={`fp-pill${sleepTimer > 0 ? ' sleep-on' : ''}`} onClick={() => setSleepTimer(sleepTimer > 0 ? 0 : 30)}>
            <Moon size={12} /> {sleepTimer > 0 ? `Veille ${sleepTimer}'` : 'Veille'}
          </button>
        </div>
      </div>
    </div>
  );
});

PlayerView.displayName = 'PlayerView';
export default PlayerView;
