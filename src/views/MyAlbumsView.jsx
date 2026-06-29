import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Disc3, Plus, Trash2 } from 'lucide-react';
import { API } from '../config/api';
import CreateAlbumModal from '../components/modals/CreateAlbumModal';
import ConfirmDialog, { useConfirm } from '../components/ui/ConfirmDialog';

const MyAlbumsView = ({ token, userArtistId, userNom }) => {
  const [albums, setAlbums] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const { confirmDialog, ask, close } = useConfirm();

  const load = () => {
    fetch(`${API}/albums?artisteId=${userArtistId}`)
      .then(r => r.json()).then(d => setAlbums(Array.isArray(d) ? d : []));
  };
  useEffect(() => { load(); }, [userArtistId]);

  const deleteAlbum = (id, titre) => {
    ask({
      title: `Supprimer l'album "${titre}" ?`,
      message: 'Toutes les musiques de cet album seront dissociées.',
      confirmLabel: 'Supprimer',
      variant: 'danger',
      onConfirm: async () => {
        await fetch(`${API}/albums/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
        load();
      }
    });
  };

  return (
    <div className="animate-in fade-in duration-500">
      <ConfirmDialog config={confirmDialog} onClose={close} />
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-black flex items-center gap-2"><Disc3 size={24} className="text-indigo-400" /> Mes Albums</h2>
        <button onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-4 py-2 rounded-xl transition">
          <Plus size={14} /> Nouvel album
        </button>
      </div>
      {showCreate && (
        <CreateAlbumModal token={token} userArtistId={userArtistId}
          onClose={() => setShowCreate(false)}
          onSuccess={() => { load(); setShowCreate(false); }} />
      )}
      {albums.length === 0
        ? <p className="p-8 text-zinc-500 italic">Aucun album créé pour l'instant.</p>
        : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {albums.map(album => (
              <div key={album._id} className="bg-zinc-900/40 hover:bg-zinc-800 rounded-2xl p-4 transition group relative">
                <Link to={`/album/${album._id}`}>
                  <div className="aspect-square bg-zinc-800 rounded-xl overflow-hidden mb-3">
                    {album.image
                      ? <img src={album.image} className="w-full h-full object-cover" alt="" />
                      : <Disc3 size={32} className="text-indigo-400 m-auto mt-[30%]" />}
                  </div>
                  <p className="font-bold text-sm truncate">{album.titre}</p>
                  <p className="text-[10px] text-zinc-500">{album.annee}</p>
                </Link>
                <button onClick={() => deleteAlbum(album._id, album.titre)}
                  className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 p-1.5 bg-red-600/20 hover:bg-red-600 rounded-lg transition">
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>
        )}
    </div>
  );
};

export default MyAlbumsView;