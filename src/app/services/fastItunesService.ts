interface iTunesSearchResult {
  results: iTunesTrack[];
}

interface iTunesTrack {
  trackId: number;
  artistName: string;
  trackName: string;
  artworkUrl100: string;
}

class FastItunesService {
  private readonly baseURL = 'https://itunes.apple.com/search';
  private coverCache = new Map<string, string>();
  
  /**
   * Fast search for album cover - optimized for speed
   */
  async getAlbumCover(artist: string, track: string): Promise<string | null> {
    const cacheKey = `${artist.toLowerCase()}-${track.toLowerCase()}`;
    
    // Check cache first
    if (this.coverCache.has(cacheKey)) {
      return this.coverCache.get(cacheKey)!;
    }
    
    try {
      // Clean search terms for better matching
      const cleanArtist = this.cleanTerm(artist);
      const cleanTrack = this.cleanTerm(track);
      
      // Simplified search query - faster than complex queries
      const searchQuery = encodeURIComponent(`${cleanArtist} ${cleanTrack}`);
      const url = `${this.baseURL}?term=${searchQuery}&media=music&entity=song&limit=3`;
      
      const response = await fetch(url);
      if (!response.ok) return null;
      
      const data: iTunesSearchResult = await response.json();
      
      if (data.results && data.results.length > 0) {
        // Get first result with artwork
        const track = data.results.find(t => t.artworkUrl100);
        if (track) {
          // Get high-quality version (600x600)
          const highQualityArtwork = track.artworkUrl100.replace('100x100bb', '600x600bb');
          
          // Cache and return
          this.coverCache.set(cacheKey, highQualityArtwork);
          return highQualityArtwork;
        }
      }
      
      return null;
      
    } catch (error) {
      console.error(`Failed to fetch cover for ${artist} - ${track}:`, error);
      return null;
    }
  }
  
  /**
   * Batch load multiple covers with controlled concurrency
   */
  async loadCoversBatch(requests: Array<{artist: string, track: string}>, maxConcurrent: number = 3): Promise<Map<string, string>> {
    const results = new Map<string, string>();
    
    // Process in batches to avoid overwhelming the API
    for (let i = 0; i < requests.length; i += maxConcurrent) {
      const batch = requests.slice(i, i + maxConcurrent);
      
      const promises = batch.map(async (req) => {
        const cover = await this.getAlbumCover(req.artist, req.track);
        if (cover) {
          const key = `${req.artist.toLowerCase()}-${req.track.toLowerCase()}`;
          results.set(key, cover);
        }
      });
      
      await Promise.all(promises);
      
      // Small delay between batches to be respectful
      if (i + maxConcurrent < requests.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    return results;
  }
  
  /**
   * Clean search terms for better API results
   */
  private cleanTerm(term: string): string {
    return term
      .toLowerCase()
      .replace(/[^\w\s]/g, '') // Remove special characters
      .replace(/\s+/g, ' ') // Normalize spaces
      .trim();
  }
  
  /**
   * Clear cache
   */
  clearCache(): void {
    this.coverCache.clear();
  }
  
  /**
   * Get cache size
   */
  getCacheSize(): number {
    return this.coverCache.size;
  }
}

export const fastItunesService = new FastItunesService();