import { itunesApiService } from './itunesApiService';
import { ALBUMS_DATABASE, AlbumData } from '../data/albumsDatabase';

interface UpdateProgress {
  current: number;
  total: number;
  currentSong: string;
  completed: AlbumData[];
  failed: string[];
}

class AlbumCoverUpdater {
  private updateInProgress = false;
  private progressCallback?: (progress: UpdateProgress) => void;
  
  /**
   * Update all album covers with iTunes API data
   */
  async updateAllCovers(
    onProgress?: (progress: UpdateProgress) => void,
    delayBetweenRequests: number = 1000 // 1 second delay to be respectful to iTunes API
  ): Promise<AlbumData[]> {
    
    if (this.updateInProgress) {
      throw new Error('Album cover update already in progress');
    }
    
    this.updateInProgress = true;
    this.progressCallback = onProgress;
    
    try {
      const updatedAlbums: AlbumData[] = [];
      const failedUpdates: string[] = [];
      
      console.log(`🎵 Starting album cover update for ${ALBUMS_DATABASE.length} songs...`);
      
      for (let i = 0; i < ALBUMS_DATABASE.length; i++) {
        const album = ALBUMS_DATABASE[i];
        const progress: UpdateProgress = {
          current: i + 1,
          total: ALBUMS_DATABASE.length,
          currentSong: `${album.artist} - ${album.title}`,
          completed: updatedAlbums,
          failed: failedUpdates
        };
        
        // Report progress
        this.progressCallback?.(progress);
        
        try {
          // Search for the album cover
          const albumCover = await itunesApiService.searchTrack(album.artist, album.title);
          
          const updatedAlbum: AlbumData = {
            ...album,
            albumCover: albumCover || itunesApiService.getFallbackArtwork(album.artist, album.title)
          };
          
          updatedAlbums.push(updatedAlbum);
          
          if (albumCover) {
            console.log(`✅ ${i + 1}/${ALBUMS_DATABASE.length}: Updated ${album.artist} - ${album.title}`);
          } else {
            console.log(`⚠️ ${i + 1}/${ALBUMS_DATABASE.length}: Fallback used for ${album.artist} - ${album.title}`);
            failedUpdates.push(`${album.artist} - ${album.title}`);
          }
          
        } catch (error) {
          console.error(`❌ ${i + 1}/${ALBUMS_DATABASE.length}: Failed to update ${album.artist} - ${album.title}:`, error);
          
          // Use fallback cover for failed requests
          const updatedAlbum: AlbumData = {
            ...album,
            albumCover: itunesApiService.getFallbackArtwork(album.artist, album.title)
          };
          
          updatedAlbums.push(updatedAlbum);
          failedUpdates.push(`${album.artist} - ${album.title}`);
        }
        
        // Respectful delay between API requests
        if (i < ALBUMS_DATABASE.length - 1) {
          await new Promise(resolve => setTimeout(resolve, delayBetweenRequests));
        }
      }
      
      const finalProgress: UpdateProgress = {
        current: ALBUMS_DATABASE.length,
        total: ALBUMS_DATABASE.length,
        currentSong: 'Complete!',
        completed: updatedAlbums,
        failed: failedUpdates
      };
      
      this.progressCallback?.(finalProgress);
      
      console.log(`🎉 Album cover update complete!`);
      console.log(`📊 Results: ${updatedAlbums.length - failedUpdates.length} successful, ${failedUpdates.length} fallbacks`);
      
      return updatedAlbums;
      
    } finally {
      this.updateInProgress = false;
      this.progressCallback = undefined;
    }
  }
  
  /**
   * Update covers for a specific list of songs
   */
  async updateSpecificCovers(
    albums: AlbumData[],
    onProgress?: (progress: UpdateProgress) => void,
    delayBetweenRequests: number = 1000
  ): Promise<AlbumData[]> {
    
    if (this.updateInProgress) {
      throw new Error('Album cover update already in progress');
    }
    
    this.updateInProgress = true;
    this.progressCallback = onProgress;
    
    try {
      const updatedAlbums: AlbumData[] = [];
      const failedUpdates: string[] = [];
      
      for (let i = 0; i < albums.length; i++) {
        const album = albums[i];
        const progress: UpdateProgress = {
          current: i + 1,
          total: albums.length,
          currentSong: `${album.artist} - ${album.title}`,
          completed: updatedAlbums,
          failed: failedUpdates
        };
        
        this.progressCallback?.(progress);
        
        try {
          const albumCover = await itunesApiService.searchTrack(album.artist, album.title);
          
          const updatedAlbum: AlbumData = {
            ...album,
            albumCover: albumCover || itunesApiService.getFallbackArtwork(album.artist, album.title)
          };
          
          updatedAlbums.push(updatedAlbum);
          
          if (!albumCover) {
            failedUpdates.push(`${album.artist} - ${album.title}`);
          }
          
        } catch (error) {
          const updatedAlbum: AlbumData = {
            ...album,
            albumCover: itunesApiService.getFallbackArtwork(album.artist, album.title)
          };
          
          updatedAlbums.push(updatedAlbum);
          failedUpdates.push(`${album.artist} - ${album.title}`);
        }
        
        // Delay between requests
        if (i < albums.length - 1) {
          await new Promise(resolve => setTimeout(resolve, delayBetweenRequests));
        }
      }
      
      return updatedAlbums;
      
    } finally {
      this.updateInProgress = false;
      this.progressCallback = undefined;
    }
  }
  
  /**
   * Generate updated database file content
   */
  generateDatabaseFileContent(updatedAlbums: AlbumData[]): string {
    const timestamp = new Date().toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    
    let fileContent = `export interface AlbumData {
  id: string;
  title: string;
  artist: string;
  youtubeId: string;
  albumCover: string;
  albumName?: string;
  year?: number;
}

// Local database of top 50 trending songs with authentic iTunes album covers
// Last updated: ${timestamp}
export const ALBUMS_DATABASE: AlbumData[] = [\n`;

    updatedAlbums.forEach((album, index) => {
      const isLast = index === updatedAlbums.length - 1;
      fileContent += `  {\n`;
      fileContent += `    id: '${album.id}',\n`;
      fileContent += `    title: '${album.title.replace(/'/g, "\\'")}',\n`;
      fileContent += `    artist: '${album.artist.replace(/'/g, "\\'")}',\n`;
      fileContent += `    youtubeId: '${album.youtubeId}',\n`;
      if (album.albumName) {
        fileContent += `    albumName: '${album.albumName.replace(/'/g, "\\'")}',\n`;
      }
      if (album.year) {
        fileContent += `    year: ${album.year},\n`;
      }
      fileContent += `    albumCover: '${album.albumCover}'\n`;
      fileContent += `  }${isLast ? '' : ','}\n`;
      
      if (!isLast) fileContent += '\n';
    });

    fileContent += `];

// Helper functions for database operations
export const getAlbumById = (id: string): AlbumData | undefined => {
  return ALBUMS_DATABASE.find(album => album.id === id);
};

export const getAlbumsByArtist = (artist: string): AlbumData[] => {
  return ALBUMS_DATABASE.filter(album => 
    album.artist.toLowerCase().includes(artist.toLowerCase())
  );
};

export const searchAlbums = (query: string): AlbumData[] => {
  const lowerQuery = query.toLowerCase();
  return ALBUMS_DATABASE.filter(album =>
    album.title.toLowerCase().includes(lowerQuery) ||
    album.artist.toLowerCase().includes(lowerQuery) ||
    (album.albumName && album.albumName.toLowerCase().includes(lowerQuery))
  );
};

export const getAllAlbums = (): AlbumData[] => {
  return ALBUMS_DATABASE;
};

// Get random subset of albums
export const getRandomAlbums = (count: number): AlbumData[] => {
  const shuffled = [...ALBUMS_DATABASE].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
};`;

    return fileContent;
  }
  
  /**
   * Check if an update is currently in progress
   */
  isUpdateInProgress(): boolean {
    return this.updateInProgress;
  }
}

export const albumCoverUpdater = new AlbumCoverUpdater();