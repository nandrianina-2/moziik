import { memo } from 'react';
import { ListMusic, GripVertical, X } from 'lucide-react';

/**
 * @param {{
 *   queue: import('../types/player').Song[],
 *   setQueue: React.Dispatch<React.SetStateAction<import('../types/player').Song[]>>,
 *   currentSong: import('../types/player').Song | null,
 *   setCurrentSong: (song: import('../types/player').Song) => void,
 *   setIsPlaying: (v: boolean) => void,
 *   dragOver: number | null,
 *   onDragStart: (i: number) => void,
 *   onDragOver: (e: React.DragEvent, i: number) => void,
 *   onDrop: (i: number) => void,
 *   accentColor: string,
 * }} props
 */
const QueuePanel = memo(({
  queue, setQueue,
  setCurrentSong, setIsPlaying,
  dragOver, onDragStart, onDragOver, onDrop,
  accentColor,
}) => (
  <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
    {/* Header */}
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,.06)', flexShrink: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <ListMusic size={13} color={accentColor} />
        <span className="fp-sec">File d'attente</span>
        <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 99, background: 'rgba(255,255,255,.07)', color: 'rgba(255,255,255,.4)' }}>{queue.length}</span>
      </div>
      {queue.length > 0 && (
        <button
          onClick={() => setQueue([])}
          style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,.22)', border: 'none', background: 'none', cursor: 'pointer', padding: '4px 8px', borderRadius: 8, transition: 'color .15s', fontFamily: 'var(--fp-font)' }}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#f87171')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,.22)')}
        >
          Vider
        </button>
      )}
    </div>

    {/* List */}
    <div
      className="fp-scroll"
      style={{ flex: 1, overflowY: 'auto', padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 4, overscrollBehavior: 'contain' }}
    >
      {queue.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '52px 16px', color: 'rgba(255,255,255,.12)' }}>
          <ListMusic size={40} style={{ margin: '0 auto 12px', display: 'block', opacity: .15 }} />
          <p style={{ fontSize: 14, margin: 0, fontWeight: 600 }}>File vide</p>
          <p style={{ fontSize: 11, margin: '4px 0 0', opacity: .5 }}>Les titres à venir apparaîtront ici</p>
        </div>
      ) : queue.map((s, i) => (
        <div
          key={`${s._id}-${i}`}
          draggable
          onDragStart={() => onDragStart(i)}
          onDragOver={(e) => onDragOver(e, i)}
          onDrop={() => onDrop(i)}
          onClick={() => {
            setQueue((prev) => prev.filter((_, j) => j !== i));
            setCurrentSong(s);
            setIsPlaying(true);
          }}
          className={`fp-qi${dragOver === i ? ' drop-over' : ''}`}
          style={{ animationDelay: `${i * 0.03}s` }}
        >
          <GripVertical size={12} style={{ color: 'rgba(255,255,255,.12)', flexShrink: 0 }} />
          <img src={s.image} style={{ width: 36, height: 36, borderRadius: 9, objectFit: 'cover', display: 'block', flexShrink: 0 }} alt="" />
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,.82)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: '0 0 2px' }}>{s.titre}</p>
            <p style={{ fontSize: 10, color: 'rgba(255,255,255,.3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: 0 }}>{s.artiste}</p>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); setQueue((prev) => prev.filter((_, j) => j !== i)); }}
            style={{ padding: 5, borderRadius: 8, border: 'none', background: 'transparent', color: 'rgba(255,255,255,.18)', cursor: 'pointer', flexShrink: 0, transition: 'all .15s' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(239,68,68,.12)'; e.currentTarget.style.color = '#f87171'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,.18)'; }}
          >
            <X size={12} />
          </button>
        </div>
      ))}
    </div>
  </div>
));

QueuePanel.displayName = 'QueuePanel';
export default QueuePanel;