// pages/VerifyEmail/VerifyEmail.jsx
import { useEffect, useState, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { API } from '../../config/api';

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const navigate        = useNavigate();
  const token           = searchParams.get('token');
  const [status,  setStatus]  = useState('loading');
  const [message, setMessage] = useState('');
  const hasVerified = useRef(false); // ← bloque le double appel React StrictMode

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Token manquant.');
      return;
    }

    if (hasVerified.current) return; // ← 2ème exécution ignorée
    hasVerified.current = true;

    fetch(`${API}/users/verify-email?token=${encodeURIComponent(token)}`)
      .then(async (r) => {
        const data = await r.json();
        if (r.ok) {
          setStatus('success');
          setMessage(data.message);
          setTimeout(() => navigate('/'), 3000);
        } else {
          setStatus('error');
          setMessage(data.message || 'Lien invalide ou expiré.');
        }
      })
      .catch(() => {
        setStatus('error');
        setMessage('Impossible de contacter le serveur.');
      });
  }, [token, navigate]);

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4 fixed w-full top-0 left-0 z-50">
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 max-w-sm w-full text-center flex flex-col items-center gap-4">
        {status === 'loading' && (
          <Loader2 size={40} className="text-red-600 animate-spin" />
        )}
        {status === 'success' && (
          <>
            <div className="w-14 h-14 rounded-full bg-green-500/10 flex items-center justify-center">
              <CheckCircle2 size={30} className="text-green-400" />
            </div>
            <h2 className="text-white font-black italic text-xl">EMAIL CONFIRMÉ ✅</h2>
            <p className="text-zinc-400 text-sm">{message}</p>
            <p className="text-zinc-500 text-xs">Redirection dans 3 secondes…</p>
            <button
              onClick={() => navigate('/')}
              className="bg-red-600 hover:bg-red-500 text-white font-bold py-3 px-8 rounded-xl transition"
            >
              Se connecter maintenant
            </button>
          </>
        )}
        {status === 'error' && (
          <>
            <div className="w-14 h-14 rounded-full bg-red-500/10 flex items-center justify-center">
              <XCircle size={30} className="text-red-500" />
            </div>
            <h2 className="text-white font-black italic text-xl">LIEN INVALIDE</h2>
            <p className="text-zinc-400 text-sm">{message}</p>
            <button
              onClick={() => navigate('/')}
              className="bg-red-600 hover:bg-red-500 text-white font-bold py-3 px-8 rounded-xl transition"
            >
              Retour à l'accueil
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default VerifyEmail;