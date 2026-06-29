
export interface Track {
  id: string;
  title: string;
  artist: string;
  audioUrl: string;
  coverUrl: string;
  bpm?: number;
  duration?: number;
}

export interface Playlist {
  id: string;
  name: string;
  tracks: string[]; 
}