import React from 'react';
import { Link } from 'react-router-dom';
import { Mic2 } from 'lucide-react';

const ArtistsListView = ({ artists }) => (
  <div className="animate-in fade-in duration-500">
    <h2 className="text-2xl font-black mb-6 flex items-center gap-2"><Mic2 size={24} className="text-red-500" /> Artistes</h2>
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {artists.map(a => (
        <Link key={a._id} to={`/artist/${a._id}`}
          className="p-4 bg-zinc-900/40 hover:bg-zinc-800 rounded-2xl transition flex flex-col items-center gap-3 text-center group">
          <div className="w-20 h-20 rounded-full bg-zinc-800 flex items-center justify-center overflow-hidden">
            {a.image ? <img src={a.image} className="w-full h-full object-cover" alt="" /> : <Mic2 size={28} className="text-red-600" />}
          </div>
          <div>
            <p className="font-bold text-sm">{a.nom}</p>
            {a.bio && <p className="text-[10px] text-zinc-500 truncate">{a.bio}</p>}
          </div>
        </Link>
      ))}
    </div>
  </div>
);

export default ArtistsListView;
