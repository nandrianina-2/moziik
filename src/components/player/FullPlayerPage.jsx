import React, { useState, useMemo, useCallback, useRef } from 'react';
import {
  ChevronDown, Sliders, ListMusic, MessageCircle,
  Info, Sparkles,
} from 'lucide-react';

import './fullPlayer.css';
import { useNavigate } from 'react-router-dom';

import { useAccentColor }      from './hooks/useAccentColor';
import { usePlayerAnalytics }  from './hooks/usePlayerAnalytics';
import { useAutoQueue }        from './hooks/useAutoQueue';
import { useQueueDrag }        from './hooks/useQueueDrag';
import { useLocalAuth }        from './hooks/useLocalAuth';
import { useAudioCache }       from '../../hooks/usePWA';

// import PlayerView    from './PlayerView';
import { EQPanel }  from './panels/EQPanel';
import QueuePanel   from './panels/QueuePanel';
import InfosPanel   from './panels/InfosPanel';
import CommentsPanel from './panels/CommentsPanel';

import ShareModal from './modals/ShareModal';
import Toast      from './modals/Toast';

import { eqPresets } from './constants/eq';

function TABS_MOBILE(queueLen, commentsLen) {
  return [
    { key: 'player',   icon: null,                       label: 'Lecture' },
    { key: 'eq',       icon: <Sliders size={13} />,       label: 'EQ' },
    { key: 'queue',    icon: <ListMusic size={13} />,     label: `File${queueLen > 0 ? ` (${queueLen})` : ''}` },
    { key: 'comments', icon: <MessageCircle size={13} />, label: `Comms${commentsLen > 0 ? ` (${commentsLen})` : ''}` },
    { key: 'infos',    icon: <Info size={13} />,          label: 'Infos' },
  ];
}

const TABS_DESKTOP = (queueLen, commentsLen) => [
  { key: 'eq',       icon: <Sliders size={12} />,       label: 'Égaliseur' },
  { key: 'queue',    icon: <ListMusic size={12} />,      label: `File (${queueLen})` },
  { key: 'comments', icon: <MessageCircle size={12} />,  label: `Comms${commentsLen > 0 ? ` (${commentsLen})` : ''}` },
  { key: 'infos',    icon: <Info size={12} />,           label: 'Infos' },
];

const HEADER_ICONS = (queueLen, commentsLen) => [
  { key: 'eq',       icon: <Sliders size={15} />,       badge: 0 },
  { key: 'queue',    icon: <ListMusic size={15} />,     badge: queueLen },
  { key: 'comments', icon: <MessageCircle size={15} />, badge: commentsLen },
];

const FullPlayerPage = ({
  currentSong, isPlaying, setIsPlaying,
  setCurrentSong,
  currentTime, duration,
  handleNext, handlePrev,
  isShuffle, setIsShuffle,
  repeatMode, setRepeatMode,
  toggleLike,
  volume, setVolume,
  queue, setQueue, musiques,
  audioRef, initAudioEngine, audioContextRef,
  eqGains, setEqGains, eqFiltersRef,
  playbackRate, setPlaybackRate,
  sleepTimer, setSleepTimer, sleepRemaining,
  formatTime, canvasRef,
  token, isLoggedIn, userId, isAdmin,
  onOpenListenParty,
  smartMode, setSmartMode,
}) => {
  const [activeTab, setActiveTab]       = useState('player');
  const [activePreset, setActivePreset] = useState('Flat');
  const [tsComments, setTsComments]     = useState([]);
  const [heartAnim, setHeartAnim]       = useState(false);
  const [showShare, setShowShare]       = useState(false);
  const [toast, setToast]               = useState(null);
  const rootRef = useRef(null);

  const navigate = useNavigate();
  const handleClose = () => navigate(-1);

  const { accentHex, accentCSS } = useAccentColor(currentSong?.image);
  const { role, userNom }        = useLocalAuth();
  const { cacheAudio, removeCached, isAudioCached } = useAudioCache();
  const { dragOver, onDragStart, onDragOver, onDrop } = useQueueDrag(setQueue);

  const isAdminResolved = isAdmin || role === 'admin';

  usePlayerAnalytics(currentSong, currentTime, duration);
  useAutoQueue(currentSong, musiques, queue, setQueue);

  const safeEqGains = useMemo(
    () => (eqGains?.length === 12 ? eqGains : Array(12).fill(0)),
    [eqGains],
  );

  const smartQueueCount = useMemo(() => {
    if (!smartMode || !musiques?.length || !currentSong?.moods?.length) return 0;
    return musiques.filter(
      (s) => s._id !== currentSong._id && s.moods?.some((m) => currentSong.moods.includes(m)),
    ).length;
  }, [smartMode, musiques, currentSong]);

  const handleEqBand = useCallback((idx, value) => {
    setEqGains((prev) => {
      const next = prev?.length === 12 ? [...prev] : Array(12).fill(0);
      next[idx] = value;
      return next;
    });
    if (eqFiltersRef.current[idx]) eqFiltersRef.current[idx].gain.value = value;
    setActivePreset('');
  }, [setEqGains, eqFiltersRef]);

  const applyPreset = useCallback((name) => {
    const gains = eqPresets[name] ?? Array(12).fill(0);
    setEqGains([...gains]);
    setActivePreset(name);
    gains.forEach((v, i) => {
      if (eqFiltersRef.current[i]) eqFiltersRef.current[i].gain.value = v;
    });
  }, [setEqGains, eqFiltersRef]);

  const onSeek = useCallback((e) => {
    const r = e.currentTarget.getBoundingClientRect();
    if (audioRef.current) {
      audioRef.current.currentTime = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)) * duration;
    }
  }, [audioRef, duration]);

  const onSeekTouch = useCallback((e) => {
    e.preventDefault();
    const r = e.currentTarget.getBoundingClientRect();
    if (audioRef.current) {
      audioRef.current.currentTime = Math.max(0, Math.min(1, (e.touches[0].clientX - r.left) / r.width)) * duration;
    }
  }, [audioRef, duration]);

  const onSeekToTimestamp = useCallback((ts) => {
    if (audioRef.current) {
      audioRef.current.currentTime = ts;
      if (!isPlaying) setIsPlaying(true);
    }
    setActiveTab('player');
  }, [audioRef, isPlaying, setIsPlaying]);

  const handleLike = useCallback(() => {
    setHeartAnim(true);
    toggleLike(currentSong?._id);
    setTimeout(() => setHeartAnim(false), 550);
  }, [toggleLike, currentSong]);

  const showToast = useCallback((message, icon) => {
    setToast({ message, icon, key: Date.now() });
  }, []);

  const eqPanelProps = {
    safeEqGains, activePreset, applyPreset,
    smartMode, setSmartMode, smartQueueCount,
    playbackRate, setPlaybackRate,
    sleepTimer, setSleepTimer, sleepRemaining,
    handleEqBand, accentColor: accentHex,
  };

  const queuePanelProps = {
    queue, setQueue,
    currentSong,
    setCurrentSong,
    setIsPlaying,
    dragOver, onDragStart, onDragOver, onDrop,
    accentColor: accentHex,
  };

  // const playerViewProps = {
  //   currentSong, isPlaying, setIsPlaying,
  //   currentTime, duration,
  //   handleNext, handlePrev,
  //   isShuffle, setIsShuffle,
  //   repeatMode, setRepeatMode,
  //   volume, setVolume,
  //   sleepTimer, setSleepTimer,
  //   accentHex, accentCSS,
  //   heartAnim, onLike: handleLike,
  //   onSeek, onSeekTouch,
  //   tsComments, onSeekToTimestamp, setActiveTab,
  //   formatTime, initAudioEngine,
  //   onOpenListenParty,
  //   onShareClick: () => setShowShare(true),
  //   isAudioCached, cacheAudio, removeCached,
  // };

  const commentsPanelProps = {
    songId: currentSong?._id,
    currentTime, duration,
    onSeek: onSeekToTimestamp,
    token, isLoggedIn, userId,
    isAdmin: isAdminResolved,
    userNom,
    onMarkersReady: setTsComments,
    accentColor: accentHex,
  };

  const infosPanelProps = {
    currentSong, currentTime, duration, audioRef, audioContextRef,
    accentColor: accentHex,
  };

  const tabsMobile   = TABS_MOBILE(queue.length, tsComments.length);
  const tabsDesktop  = TABS_DESKTOP(queue.length, tsComments.length);
  const headerIcons  = HEADER_ICONS(queue.length, tsComments.length);

  const renderPanel = (tab) => {
    switch (tab) {
      // case 'player':
        // return <PlayerView {...playerViewProps} />;
      case 'eq':
        return (
          <div className="fp-fade" style={{ flex: 1 }}>
            <EQPanel {...eqPanelProps} />
          </div>
        );
      case 'queue':
        return (
          <div className="fp-fade" style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
            <QueuePanel {...queuePanelProps} />
          </div>
        );
      case 'comments':
        return currentSong ? (
          <div className="fp-fade" style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, overscrollBehavior: 'contain' }}>
            <CommentsPanel {...commentsPanelProps} />
          </div>
        ) : null;
      case 'infos':
        return (
          <div className="fp-fade" style={{ flex: 1 }}>
            <InfosPanel {...infosPanelProps} />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div
      ref={rootRef}
      className="fp-root"
      style={{ '--fp-accent': accentCSS }}
    >
      {/* Background */}
      <div className="fp-bg-layer">
        {currentSong?.image && (
          <img src={currentSong.image} alt="" className="fp-bg-img" />
        )}
        <div className="fp-bg-grad-1" />
        <div className="fp-bg-grad-2" />
        <div className="fp-bg-glow-bottom" style={{ background: `radial-gradient(ellipse at center, rgba(${accentCSS},.14) 0%, transparent 70%)` }} />
        <div className="fp-bg-glow-top" style={{ background: `radial-gradient(ellipse at center, rgba(${accentCSS},.06) 0%, transparent 70%)` }} />
        <div className="fp-bg-noise" />
      </div>

      {/* Main column */}
      <div className={`fp-main-col ${isPlaying ? 'fp-playing' : 'fp-paused'}`}>
        <canvas ref={canvasRef} width="1000" height="6" className="fp-wave-canvas" />

        {/* Header */}
        <div className="fp-header">
          <button onClick={handleClose} className="fp-ctrl fp-ctrl-sm">
            <ChevronDown size={22} color="rgba(255,255,255,.55)" />
          </button>

          <div className="fp-header-center">
            <span className="fp-header-label">En cours</span>
            {smartMode && (
              <span className="fp-header-smart" style={{ background: `rgba(${accentCSS},.18)`, color: accentHex, borderColor: `rgba(${accentCSS},.3)` }}>
                <Sparkles size={8} /> Smart
              </span>
            )}
            {isPlaying && (
              <div className="fp-bars">
                <div className="fp-bar" />
                <div className="fp-bar" />
                <div className="fp-bar" />
                <div className="fp-bar" />
              </div>
            )}
          </div>

          <div className="fp-header-actions">
            {headerIcons.map(({ key, icon, badge }) => (
              <div key={key} className="fp-icon-badge">
                <button
                  onClick={() => setActiveTab((t) => (t === key ? 'player' : key))}
                  className={`fp-ctrl fp-ctrl-sm${activeTab === key ? ' is-active' : ''}`}
                  style={{
                    color: activeTab === key ? accentHex : 'rgba(255,255,255,.35)',
                    background: activeTab === key ? `rgba(${accentCSS},.16)` : undefined,
                    border: `1px solid ${activeTab === key ? `rgba(${accentCSS},.3)` : 'transparent'}`,
                  }}
                >
                  {icon}
                </button>
                {badge > 0 && (
                  <span className="fp-icon-badge-dot" style={{ background: `rgba(${accentCSS},1)` }}>
                    {badge > 9 ? '9+' : badge}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Mobile tabs */}
        <div className="fp-mobile-tabs">
          {tabsMobile.map(({ key, icon, label }) => (
            <button key={key} className={`fp-tab${activeTab === key ? ' on' : ''}`} onClick={() => setActiveTab(key)}>
              {icon}<span>{label}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="fp-scroll">
          {renderPanel(activeTab)}
        </div>
      </div>

      {/* Right column — desktop */}
      <div className="fp-right" style={{ borderLeft: `1px solid rgba(${accentCSS},.1)` }}>
        <div className="fp-right-blur" />
        <div className="fp-right-inner">
          <div className="fp-right-tabs">
            {tabsDesktop.map(({ key, icon, label }) => (
              <button key={key} onClick={() => setActiveTab(key)} className={`fp-tab${activeTab === key ? ' on' : ''}`}>
                {icon}<span style={{ fontSize: 9 }}>{label}</span>
              </button>
            ))}
          </div>
          <div className="fp-right-body">
            <div className="fp-scroll">
              {(activeTab === 'player' || activeTab === 'queue') && <QueuePanel {...queuePanelProps} />}
              {activeTab !== 'player' && activeTab !== 'queue' && renderPanel(activeTab)}
            </div>
          </div>
        </div>
      </div>

      {showShare && currentSong && (
        <ShareModal song={currentSong} onClose={() => setShowShare(false)} onToast={showToast} />
      )}

      {toast && <Toast key={toast.key} message={toast.message} icon={toast.icon} onDone={() => setToast(null)} />}
    </div>
  );
};

export default FullPlayerPage;
