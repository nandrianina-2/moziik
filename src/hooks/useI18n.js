// ════════════════════════════════════════════
// useI18n.js
// Gestion multi-langue — FR/EN/SW/LN/MG
// ════════════════════════════════════════════

import { useState, useEffect, useCallback } from 'react';

const TRANSLATIONS = {
  fr: {
    home: 'Accueil', favorites: 'Favoris', artists: 'Artistes',
    history: 'Historique', notifications: 'Notifications',
    settings: 'Paramètres', account: 'Mon compte', logout: 'Déconnexion',
    login: 'Se connecter', register: "Créer un compte",
    search: 'Rechercher...', addMusic: 'Ajouter une musique',
    play: 'Lire', pause: 'Pause', next: 'Suivant', prev: 'Précédent',
    shuffle: 'Aléatoire', repeat: 'Répéter', volume: 'Volume',
    noResults: 'Aucun résultat', loading: 'Chargement...',
    follow: "S'abonner", unfollow: 'Abonné', followers: 'abonnés',
    certified: 'Vérifié', certGold: 'Certifié Or',
    newSong: 'Nouveau titre', newAlbum: 'Nouvel album',
    share: 'Partager', download: 'Télécharger', offline: 'Hors-ligne',
  },
  en: {
    home: 'Home', favorites: 'Favorites', artists: 'Artists',
    history: 'History', notifications: 'Notifications',
    settings: 'Settings', account: 'My account', logout: 'Logout',
    login: 'Sign in', register: 'Create account',
    search: 'Search...', addMusic: 'Add music',
    play: 'Play', pause: 'Pause', next: 'Next', prev: 'Previous',
    shuffle: 'Shuffle', repeat: 'Repeat', volume: 'Volume',
    noResults: 'No results', loading: 'Loading...',
    follow: 'Follow', unfollow: 'Following', followers: 'followers',
    certified: 'Verified', certGold: 'Gold Certified',
    newSong: 'New track', newAlbum: 'New album',
    share: 'Share', download: 'Download', offline: 'Offline',
  },
  sw: {
    home: 'Nyumbani', favorites: 'Vipendwa', artists: 'Wasanii',
    history: 'Historia', notifications: 'Arifa',
    settings: 'Mipangilio', account: 'Akaunti yangu', logout: 'Toka',
    login: 'Ingia', register: 'Fungua akaunti',
    search: 'Tafuta...', addMusic: 'Ongeza muziki',
    play: 'Cheza', pause: 'Simamisha', next: 'Inayofuata', prev: 'Iliyotangulia',
    shuffle: 'Changanya', repeat: 'Rudia', volume: 'Sauti',
    noResults: 'Hakuna matokeo', loading: 'Inapakia...',
    follow: 'Fuata', unfollow: 'Unafuata', followers: 'wafuasi',
    certified: 'Imethibitishwa', certGold: 'Dhahabu',
    newSong: 'Wimbo mpya', newAlbum: 'Album mpya',
    share: 'Shiriki', download: 'Pakua', offline: 'Nje ya mtandao',
  },
  ln: {
    home: 'Ndako', favorites: 'Bilingáká', artists: 'Banganga-mboka',
    history: 'Esaleli', notifications: 'Bilakisi',
    settings: 'Mitinda', account: 'Compte na ngai', logout: 'Bima',
    login: 'Kɔtá', register: 'Bongisa compte',
    search: 'Luka...', addMusic: 'Tiya miziki',
    play: 'Saka', pause: 'Tɛlɛma', next: 'Elandeli', prev: 'Eleki',
    shuffle: 'Sangola', repeat: 'Wela lisusu', volume: 'Mongongo',
    noResults: 'Eloko te', loading: 'Kozela...',
    follow: 'Landela', unfollow: 'Ozali kolandela', followers: 'balandeli',
    certified: 'Etalelami', certGold: 'Wolo',
    newSong: 'Nzela ya sika', newAlbum: 'Album ya sika',
    share: 'Pana', download: 'Kokɛngɛla', offline: 'Kozanga internet',
  },
  mg: {
    home: 'Fandraisana', favorites: 'Tiako indrindra', artists: 'Mpihira',
    history: 'Tantara', notifications: 'Fampandrenesana',
    settings: 'Fikirana', account: 'Ny kaontiko', logout: 'Hiala',
    login: 'Miditra', register: 'Hamorona kaonty',
    search: 'Hikaroka...', addMusic: 'Hanampy mozika',
    play: 'Alefa', pause: 'Ampitsaharo', next: 'Manaraka', prev: 'Teo aloha',
    shuffle: 'Fifangahazana', repeat: 'Averina', volume: 'Feo',
    noResults: 'Tsy misy vokatra', loading: 'Enti-miandrandra...',
    follow: 'Araho', unfollow: 'Arahinao', followers: 'mpanaraka',
    certified: 'Voamarina', certGold: 'Volamena',
    newSong: 'Hira vaovao', newAlbum: 'Album vaovao',
    share: 'Zarao', download: 'Alaina', offline: 'Tsy misy internet',
  },
};

export const useI18n = () => {
  const [lang, setLangState] = useState(() => localStorage.getItem('moozik_lang') || 'fr');

  const setLang = (code) => {
    setLangState(code);
    localStorage.setItem('moozik_lang', code);
  };

  const t = (key) => TRANSLATIONS[lang]?.[key] || TRANSLATIONS['fr']?.[key] || key;

  return { lang, setLang, t, languages: Object.keys(TRANSLATIONS) };
};