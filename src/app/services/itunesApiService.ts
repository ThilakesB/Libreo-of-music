interface iTunesSearchResult {
  results: iTunesTrack[];
  resultCount: number;
}

interface iTunesTrack {
  trackId: number;
  artistName: string;
  trackName: string;
  collectionName: string;
  artworkUrl30: string;
  artworkUrl60: string;
  artworkUrl100: string;
  releaseDate: string;
  primaryGenreName: string;
}

class iTunesAPIService {
  private readonly baseURL = 'https://itunes.apple.com/search';
  private readonly coverCache = new Map<string, string>();
  
  /**
   * Search for a track on iTunes and return the high-quality album artwork
   */
  async searchTrack(artist: string, track: string): Promise<string | null> {
    const cacheKey = `${artist.toLowerCase()}-${track.toLowerCase()}`;
    
    // Check cache first
    if (this.coverCache.has(cacheKey)) {
      return this.coverCache.get(cacheKey)!;
    }
    
    try {
      // Clean up search terms for better matching
      const cleanArtist = this.cleanSearchTerm(artist);
      const cleanTrack = this.cleanSearchTerm(track);
      
      const searchQuery = encodeURIComponent(`${cleanArtist} ${cleanTrack}`);
      const url = `${this.baseURL}?term=${searchQuery}&media=music&entity=song&limit=5`;
      
      console.log(`Searching iTunes for: ${cleanArtist} - ${cleanTrack}`);
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`iTunes API error: ${response.status}`);
      }
      
      const data: iTunesSearchResult = await response.json();
      
      if (data.results && data.results.length > 0) {
        // Find the best match
        const bestMatch = this.findBestMatch(data.results, cleanArtist, cleanTrack);
        
        if (bestMatch && bestMatch.artworkUrl100) {
          // Get high-quality artwork (600x600)
          const highQualityArtwork = bestMatch.artworkUrl100.replace('100x100bb', '600x600bb');
          
          // Cache the result
          this.coverCache.set(cacheKey, highQualityArtwork);
          
          console.log(`✓ Found cover for ${cleanArtist} - ${cleanTrack}`);
          return highQualityArtwork;
        }
      }
      
      console.log(`✗ No cover found for ${cleanArtist} - ${cleanTrack}`);
      return null;
      
    } catch (error) {
      console.error(`Error searching iTunes for ${artist} - ${track}:`, error);
      return null;
    }
  }
  
  /**
   * Search specifically by artist for multiple tracks
   */
  async searchArtistTracks(artist: string, limit: number = 20): Promise<iTunesTrack[]> {
    try {
      const cleanArtist = this.cleanSearchTerm(artist);
      const searchQuery = encodeURIComponent(cleanArtist);
      const url = `${this.baseURL}?term=${searchQuery}&media=music&entity=song&limit=${limit}`;
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`iTunes API error: ${response.status}`);
      }
      
      const data: iTunesSearchResult = await response.json();
      return data.results || [];
      
    } catch (error) {
      console.error(`Error searching iTunes for artist ${artist}:`, error);
      return [];
    }
  }
  
  /**
   * Clean search terms for better matching
   */
  private cleanSearchTerm(term: string): string {
    return term
      .toLowerCase()
      .replace(/[^\w\s]/g, '') // Remove special characters except spaces
      .replace(/\s+/g, ' ') // Normalize spaces
      .trim();
  }
  
  /**
   * Find the best matching track from search results
   */
  private findBestMatch(results: iTunesTrack[], artist: string, track: string): iTunesTrack | null {
    if (results.length === 0) return null;
    
    // Score each result based on similarity
    const scoredResults = results.map(result => {
      const resultArtist = this.cleanSearchTerm(result.artistName);
      const resultTrack = this.cleanSearchTerm(result.trackName);
      
      let score = 0;
      
      // Artist name similarity (more weight)
      if (resultArtist.includes(artist) || artist.includes(resultArtist)) {
        score += 10;
      }
      
      // Exact artist match bonus
      if (resultArtist === artist) {
        score += 20;
      }
      
      // Track name similarity
      if (resultTrack.includes(track) || track.includes(resultTrack)) {
        score += 8;
      }
      
      // Exact track match bonus
      if (resultTrack === track) {
        score += 15;
      }
      
      // Prefer tracks with album artwork
      if (result.artworkUrl100) {
        score += 5;
      }
      
      return { result, score };
    });
    
    // Sort by score and return the best match
    scoredResults.sort((a, b) => b.score - a.score);
    
    // Only return results with a reasonable score
    const bestMatch = scoredResults[0];
    return bestMatch && bestMatch.score > 5 ? bestMatch.result : null;
  }
  
  /**
   * Get fallback artwork for when iTunes search fails
   */
  getFallbackArtwork(artist: string, trackTitle: string): string {
    // Generate a consistent color based on the artist name
    const hash = this.simpleHash(artist + trackTitle);
    const hue = hash % 360;
    const saturation = 30 + (hash % 40); // 30-70%
    const lightness = 20 + (hash % 30); // 20-50%
    
    return `data:image/svg+xml;base64,${btoa(`
      <svg width="600" height="600" viewBox="0 0 600 600" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:hsl(${hue}, ${saturation}%, ${lightness + 10}%);stop-opacity:1" />
            <stop offset="100%" style="stop-color:hsl(${(hue + 60) % 360}, ${saturation}%, ${lightness}%);stop-opacity:1" />
          </linearGradient>
        </defs>
        <rect width="600" height="600" fill="url(#grad1)"/>
        <circle cx="300" cy="300" r="120" fill="none" stroke="rgba(255,255,255,0.3)" stroke-width="3"/>
        <circle cx="300" cy="300" r="80" fill="none" stroke="rgba(255,255,255,0.2)" stroke-width="2"/>
        <circle cx="300" cy="300" r="40" fill="rgba(255,255,255,0.2)"/>
        <circle cx="300" cy="300" r="15" fill="rgba(255,255,255,0.4)"/>
        <text x="300" y="480" text-anchor="middle" fill="rgba(255,255,255,0.8)" font-family="Arial, sans-serif" font-size="24" font-weight="300">${this.truncate(artist, 20)}</text>
        <text x="300" y="520" text-anchor="middle" fill="rgba(255,255,255,0.6)" font-family="Arial, sans-serif" font-size="18" font-weight="300">${this.truncate(trackTitle, 25)}</text>
      </svg>
    `)}`;
  }
  
  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }
  
  private truncate(text: string, maxLength: number): string {
    return text.length > maxLength ? text.substring(0, maxLength - 3) + '...' : text;
  }
  
  /**
   * Clear the cache
   */
  clearCache(): void {
    this.coverCache.clear();
  }
  
  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.coverCache.size,
      keys: Array.from(this.coverCache.keys())
    };
  }
}

export const itunesApiService = new iTunesAPIService();