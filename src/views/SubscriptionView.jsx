import React, { useState } from 'react';
import {
  Crown, Check, Zap, Wifi, Download, Volume2,
  X, Loader2, Star, CreditCard, Smartphone
} from 'lucide-react';
import { useSubscription } from '../hooks/useSubscription';

const FeatureRow = ({ ok, label }) => (
  <div className="flex items-center gap-2.5 text-sm">
    {ok
      ? <Check size={14} className="text-green-400 shrink-0" />
      : <X size={14} className="text-zinc-700 shrink-0" />}
    <span className={ok ? 'text-zinc-300' : 'text-zinc-600'}>{label}</span>
  </div>
);

const SubscriptionView = ({ token, isLoggedIn }) => {
  const { subscription, plans, isPremium, loading, subscribe, cancel } = useSubscription(token);
  const [provider, setProvider]   = useState('stripe');
  const [processing, setProcessing] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [showCancel, setShowCancel] = useState(false);

  const freePlan    = plans.find(p => p.name === 'free')    || { name: 'free',    price: 0 };
  const premiumPlan = plans.find(p => p.name === 'premium') || { name: 'premium', price: 999 };

  const handleSubscribe = async (planId) => {
    if (!isLoggedIn) return alert('Connectez-vous pour vous abonner');
    setProcessing(true);
    try { await subscribe(planId, provider); }
    catch {}
    setProcessing(false);
  };

  const handleCancel = async () => {
    setCancelling(true);
    await cancel();
    setCancelling(false);
    setShowCancel(false);
  };


  console.log("Vérification premiumPlan:", premiumPlan);

  const endDate = subscription?.currentPeriodEnd
    ? new Date(subscription.currentPeriodEnd).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
    : null;

  return (
    <div className="max-w-2xl mx-auto space-y-8 pb-12 animate-in fade-in duration-500">

      {/* Hero */}
      <div className="text-center">
        <div className="w-14 h-14 bg-linear-to-br from-yellow-500 to-orange-500 rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-lg shadow-yellow-500/30">
          <Crown size={26} className="text-white" />
        </div>
        <h1 className="text-3xl font-black mb-2">Choisissez votre plan</h1>
        <p className="text-zinc-500 text-sm">Accédez à toute la musique, sans interruption</p>
      </div>

      {/* Abonnement actif */}
      {isPremium && (
        <div className="bg-linear-to-r from-yellow-900/30 to-orange-900/20 border border-yellow-600/30 rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Crown size={20} className="text-yellow-400" />
              <div>
                <p className="font-black text-yellow-300">MOOZIK Premium actif</p>
                {endDate && <p className="text-[11px] text-zinc-400 mt-0.5">Prochain renouvellement : {endDate}</p>}
                {subscription?.cancelAtPeriodEnd && <p className="text-[11px] text-orange-400 mt-0.5">⚠️ Annulation prévue le {endDate}</p>}
              </div>
            </div>
            {!subscription?.cancelAtPeriodEnd && (
              <button onClick={() => setShowCancel(true)} className="text-xs text-zinc-500 hover:text-red-400 transition">
                Gérer
              </button>
            )}
          </div>
        </div>
      )}

      {/* Sélecteur de provider */}
      <div>
        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Méthode de paiement</p>
        <div className="flex gap-2">
          {[
            { k: 'stripe',   label: 'Carte bancaire', icon: <CreditCard size={14}/> },
            { k: 'paydunya', label: 'Mobile Money',   icon: <Smartphone size={14}/> },
          ].map(p => (
            <button key={p.k} onClick={() => setProvider(p.k)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition border ${
                provider === p.k
                  ? 'bg-red-600/20 border-red-500/40 text-white'
                  : 'bg-zinc-900/40 border-zinc-800 text-zinc-500 hover:text-white'
              }`}>
              {p.icon} {p.label}
            </button>
          ))}
        </div>
        {provider === 'paydunya' && (
          <p className="text-[10px] text-zinc-600 mt-1.5">
            Orange Money, Airtel Money, Wave, MTN Mobile Money — via PayDunya
          </p>
        )}
      </div>

      {/* Plans */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

        {/* Free */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 space-y-4">
          <div>
            <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-1">Gratuit</p>
            <p className="text-3xl font-black">0 €<span className="text-sm text-zinc-500 font-normal"> /mois</span></p>
          </div>
          <div className="space-y-2.5">
            <FeatureRow ok={true}  label="Accès à toute la bibliothèque" />
            <FeatureRow ok={true}  label="Qualité standard (128k)" />
            <FeatureRow ok={true}  label="Historique & playlists" />
            <FeatureRow ok={false} label="Qualité HD (320k)" />
            <FeatureRow ok={false} label="Sans publicité" />
            <FeatureRow ok={false} label="Téléchargement hors-ligne" />
          </div>
          {!isPremium
            ? <div className="w-full py-2.5 rounded-xl text-center text-xs font-bold text-zinc-500 bg-zinc-800/40 border border-zinc-700">Plan actuel</div>
            : <button onClick={handleCancel} className="w-full py-2.5 rounded-xl text-xs font-bold text-zinc-400 hover:text-red-400 hover:bg-red-500/10 transition border border-zinc-700">
                Passer au gratuit
              </button>
          }
        </div>

        {/* Premium */}
        <div className="relative bg-linear-to-br from-yellow-900/30 via-zinc-900/80 to-zinc-900/80 border border-yellow-600/40 rounded-2xl p-6 space-y-4 overflow-hidden">
          {/* Badge populaire */}
          <div className="absolute top-4 right-4 bg-yellow-500 text-black text-[9px] font-black px-2 py-0.5 rounded-full uppercase">
            Populaire
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Crown size={16} className="text-yellow-400" />
              <p className="text-xs font-bold text-yellow-400 uppercase tracking-widest">Premium</p>
            </div>
            <p className="text-3xl font-black">
              {(premiumPlan.price / 100).toFixed(2)} €
              <span className="text-sm text-zinc-500 font-normal"> /mois</span>
            </p>
          </div>
          <div className="space-y-2.5">
            <FeatureRow ok={true} label="Accès à toute la bibliothèque" />
            <FeatureRow ok={true} label="Qualité HD (320k)" />
            <FeatureRow ok={true} label="Historique & playlists" />
            <FeatureRow ok={true} label="Sans publicité" />
            <FeatureRow ok={true} label="Téléchargement hors-ligne illimité" />
            <FeatureRow ok={true} label="Téléchargement MP3 gratuit" />
          </div>
          {isPremium ? (
            <div className="w-full py-2.5 rounded-xl text-center text-xs font-bold text-yellow-400 bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-center gap-1.5">
              <Check size={13}/> Plan actuel
            </div>
          ) : (
            <button
              onClick={() => handleSubscribe(premiumPlan._id)}
              disabled={processing || loading}
              className="w-full py-3 rounded-xl text-sm font-black text-white bg-linear-to-r from-yellow-600 to-orange-600 hover:from-yellow-500 hover:to-orange-500 transition active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-yellow-600/20">
              {processing ? <Loader2 size={16} className="animate-spin"/> : <Crown size={16}/>}
              {processing ? 'Redirection...' : 'Passer Premium'}
            </button>
          )}
        </div>
      </div>

      {/* Modal annulation */}
      {showCancel && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-400 flex items-center justify-center p-4" onClick={() => setShowCancel(false)}>
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-sm p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
            <h3 className="font-black text-base mb-2">Annuler l'abonnement ?</h3>
            <p className="text-sm text-zinc-400 mb-6">Vous conservez l'accès Premium jusqu'au {endDate}. Après cette date, votre compte repassera en gratuit.</p>
            <div className="flex gap-2">
              <button onClick={handleCancel} disabled={cancelling}
                className="flex-1 bg-red-600 hover:bg-red-500 text-white font-bold py-2.5 rounded-xl text-sm transition disabled:opacity-50 flex items-center justify-center gap-1.5">
                {cancelling ? <Loader2 size={13} className="animate-spin"/> : null}
                Confirmer l'annulation
              </button>
              <button onClick={() => setShowCancel(false)} className="flex-1 bg-zinc-800 text-zinc-300 font-bold py-2.5 rounded-xl text-sm transition hover:bg-zinc-700">
                Garder Premium
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FAQ */}
      <div className="space-y-3 text-sm text-zinc-500">
        <p><span className="text-zinc-300 font-bold">Paiement sécurisé ?</span> Oui — Stripe (carte) et PayDunya (Mobile Money). MOOZIK ne stocke jamais vos données bancaires.</p>
        <p><span className="text-zinc-300 font-bold">Résiliation ?</span> À tout moment, sans frais. Accès jusqu'à la fin de la période payée.</p>
        <p><span className="text-zinc-300 font-bold">Mobile Money disponible ?</span> Orange Money, Airtel Money, Wave, MTN Mobile Money via PayDunya.</p>
      </div>
    </div>
  );
};

export default SubscriptionView;