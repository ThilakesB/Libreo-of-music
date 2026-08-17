export interface Song {
  id: string;
  title: string;
  artist: string;
  albumCover: string;
  youtubeId: string;
  albumName?: string;
  year?: number;
}