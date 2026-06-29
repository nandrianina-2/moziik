import React from 'react';
import { AlertTriangle, Trash2, X, Check } from 'lucide-react';

/**
 * ConfirmDialog — remplace window.confirm partout dans l'app
 *
 * Usage:
 *   const [confirm, setConfirm] = useState(null);
 *   <ConfirmDialog config={confirm} onClose={() => setConfirm(null)} />
 *
 *   // Déclencher :
 *   setConfirm({
 *     title: 'Supprimer la playlist ?',
 *     message: 'Cette action est irréversible.',
 *     confirmLabel: 'Supprimer',
 *     variant: 'danger',         // 'danger' | 'warning' | 'info'
 *     onConfirm: async () => { ... }
 *   });
 */
const ConfirmDialog = ({ config, onClose }) => {
  const [loading, setLoading] = React.useState(false);

  if (!config) return null;

  const { title, message, confirmLabel = 'Confirmer', cancelLabel = 'Annuler', variant = 'danger', onConfirm, icon } = config;

  const variantStyles = {
    danger:  { btn: 'bg-red-600 hover:bg-red-500', icon: <Trash2 size={20} className="text-red-400" />, ring: 'border-red-500/20', bg: 'bg-red-500/10' },
    warning: { btn: 'bg-orange-600 hover:bg-orange-500', icon: <AlertTriangle size={20} className="text-orange-400" />, ring: 'border-orange-500/20', bg: 'bg-orange-500/10' },
    info:    { btn: 'bg-blue-600 hover:bg-blue-500', icon: <Check size={20} className="text-blue-400" />, ring: 'border-blue-500/20', bg: 'bg-blue-500/10' },
  };

  const s = variantStyles[variant] || variantStyles.danger;

  const handleConfirm = async () => {
    setLoading(true);
    try { await onConfirm?.(); } finally { setLoading(false); onClose(); }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-500 flex items-center justify-center p-4"
      onClick={onClose}>
      <div
        className={`bg-zinc-900 border ${s.ring} rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden`}
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className={`${s.bg} border-b ${s.ring} px-5 py-4 flex items-center gap-3`}>
          <div className={`w-9 h-9 rounded-xl ${s.bg} flex items-center justify-center shrink-0`}>
            {icon || s.icon}
          </div>
          <h3 className="font-black text-sm flex-1">{title}</h3>
          <button onClick={onClose} className="p-1.5 text-zinc-500 hover:text-white hover:bg-zinc-800 rounded-lg transition">
            <X size={14} />
          </button>
        </div>

        {/* Body */}
        {message && (
          <div className="px-5 py-4">
            <p className="text-sm text-zinc-400 leading-relaxed">{message}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 px-5 pb-5">
          <button onClick={handleConfirm} disabled={loading}
            className={`flex-1 ${s.btn} text-white font-bold py-2.5 rounded-xl text-sm transition flex items-center justify-center gap-1.5 disabled:opacity-50 active:scale-[0.98]`}>
            {loading
              ? <><span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> En cours...</>
              : confirmLabel
            }
          </button>
          <button onClick={onClose} disabled={loading}
            className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white font-bold py-2.5 rounded-xl text-sm transition active:scale-[0.98]">
            {cancelLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

/**
 * Hook useConfirm — simplifie l'usage
 *
 * const { confirmDialog, ask } = useConfirm();
 * <ConfirmDialog config={confirmDialog} onClose={...} />
 * ask({ title: '...', onConfirm: () => ... });
 */
export const useConfirm = () => {
  const [confirmDialog, setConfirmDialog] = React.useState(null);
  const ask = React.useCallback((config) => setConfirmDialog(config), []);
  const close = React.useCallback(() => setConfirmDialog(null), []);
  return { confirmDialog, ask, close };
};

export default ConfirmDialog;