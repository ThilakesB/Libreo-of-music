import { Song } from '../types/Song';
import { 
  ALBUMS_DATABASE, 
  getAllAlbums, 
  getAlbumsByArtist, 
  searchAlbums,
  getRandomAlbums,
  AlbumData 
} from '../data/albumsDatabase';

// Convert AlbumData to Song interface
const convertAlbumToSong = (album: AlbumData): Song => {
  return {
    id: album.id,
    title: album.title,
    artist: album.artist,
    albumCover: album.albumCover,
    youtubeId: album.youtubeId,
    albumName: album.albumName,
    year: album.year
  };
};

class LocalAlbumService {
  // Get all trending songs (our top 50 database)
  getTrendingSongs(): Song[] {
    return getAllAlbums().map(convertAlbumToSong);
  }

  // Search for songs by artist or title
  searchSongs(query: string): Song[] {
    if (!query.trim()) {
      return this.getTrendingSongs();
    }

    const results = searchAlbums(query);
    
    // If no results found, return a subset of trending songs
    if (results.length === 0) {
      return getRandomAlbums(20).map(convertAlbumToSong);
    }

    return results.map(convertAlbumToSong);
  }

  // Get songs by specific artist
  getSongsByArtist(artist: string): Song[] {
    if (!artist.trim()) {
      return this.getTrendingSongs();
    }

    const results = getAlbumsByArtist(artist);
    
    // If no results found, return trending songs
    if (results.length === 0) {
      return this.getTrendingSongs();
    }

    return results.map(convertAlbumToSong);
  }

  // Get a random selection of songs
  getRandomSelection(count: number = 25): Song[] {
    return getRandomAlbums(count).map(convertAlbumToSong);
  }

  // Get song by ID
  getSongById(id: string): Song | null {
    const album = ALBUMS_DATABASE.find(a => a.id === id);
    return album ? convertAlbumToSong(album) : null;
  }

  // Get songs for specific genres or moods (simulated)
  getSongsByMood(mood: string): Song[] {
    // Simple mood-based filtering using artist names and titles
    const moodKeywords: Record<string, string[]> = {
      'pop': ['taylor swift', 'dua lipa', 'ariana grande', 'olivia rodrigo'],
      'hip-hop': ['drake', 'lil nas x', 'doja cat', 'megan thee stallion'],
      'rock': ['glass animals', 'måneskin', 'coldplay'],
      'r&b': ['the weeknd', 'steve lacy', 'justin bieber'],
      'electronic': ['justice', 'glass animals'],
      'indie': ['steve lacy', 'glass animals', 'joji']
    };

    const keywords = moodKeywords[mood.toLowerCase()] || [];
    
    if (keywords.length === 0) {
      return this.getRandomSelection(15);
    }

    const filtered = ALBUMS_DATABASE.filter(album =>
      keywords.some(keyword =>
        album.artist.toLowerCase().includes(keyword) ||
        album.title.toLowerCase().includes(keyword)
      )
    );

    return filtered.length > 0 
      ? filtered.map(convertAlbumToSong)
      : this.getRandomSelection(15);
  }

  // Get total count of available songs
  getTotalSongCount(): number {
    return ALBUMS_DATABASE.length;
  }
}

export const localAlbumService = new LocalAlbumService();