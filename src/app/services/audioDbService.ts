interface iTunesSearchResult {
  artistName: string;
  trackName?: string;
  collectionName?: string;
  artworkUrl100?: string;
  artworkUrl60?: string;
  artworkUrl30?: string;
  kind: string;
  wrapperType: string;
}

interface iTunesResponse {
  resultCount: number;
  results: iTunesSearchResult[];
}

class AudioDbService {
  private cache = new Map<string, string>();
  private requestQueue = new Map<string, Promise<string>>();

  // Get real album cover using iTunes Search API
  async getAlbumCover(songTitle: string, artistName: string): Promise<string> {
    const cacheKey = `${artistName}-${songTitle}`;
    
    // Check cache first
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    // Check if request is already in progress
    if (this.requestQueue.has(cacheKey)) {
      return this.requestQueue.get(cacheKey)!;
    }

    // Create new request
    const request = this.fetchAlbumCoverFromiTunes(songTitle, artistName);
    this.requestQueue.set(cacheKey, request);

    try {
      const result = await request;
      this.cache.set(cacheKey, result);
      return result;
    } finally {
      this.requestQueue.delete(cacheKey);
    }
  }

  private async fetchAlbumCoverFromiTunes(songTitle: string, artistName: string): Promise<string> {
    try {
      // Strategy 1: Search for exact song match
      const exactSongCover = await this.searchiTunes(songTitle, artistName, 'song');
      if (exactSongCover) return exactSongCover;

      // Strategy 2: Search for album by combining artist and song title
      const albumSearchCover = await this.searchiTunes(`${artistName} ${songTitle}`, '', 'album');
      if (albumSearchCover) return albumSearchCover;

      // Strategy 3: Search for any music by the artist
      const artistSearchCover = await this.searchiTunes('', artistName, 'song');
      if (artistSearchCover) return artistSearchCover;

      // Strategy 4: Search for music by simplified artist name
      const simplifiedArtist = this.simplifyArtistName(artistName);
      if (simplifiedArtist !== artistName) {
        const simplifiedSearchCover = await this.searchiTunes('', simplifiedArtist, 'song');
        if (simplifiedSearchCover) return simplifiedSearchCover;
      }

      // Fallback to placeholder
      return this.getPlaceholderImage();
    } catch (error) {
      console.warn(`Failed to fetch album cover for: ${songTitle} by ${artistName}`, error);
      return this.getPlaceholderImage();
    }
  }

  private async searchiTunes(songTitle: string, artistName: string, mediaType: 'song' | 'album'): Promise<string | null> {
    try {
      // Build search query
      let searchTerm = '';
      if (songTitle && artistName) {
        searchTerm = `${this.cleanSearchTerm(songTitle)} ${this.cleanSearchTerm(artistName)}`;
      } else if (songTitle) {
        searchTerm = this.cleanSearchTerm(songTitle);
      } else if (artistName) {
        searchTerm = this.cleanSearchTerm(artistName);
      }

      if (!searchTerm.trim()) return null;

      // iTunes Search API endpoint
      const baseUrl = 'https://itunes.apple.com/search';
      const params = new URLSearchParams({
        term: searchTerm,
        media: 'music',
        entity: mediaType,
        limit: '10',
        country: 'US'
      });

      const response = await fetch(`${baseUrl}?${params}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`iTunes API error: ${response.status}`);
      }

      const data: iTunesResponse = await response.json();

      if (data.results && data.results.length > 0) {
        // Find the best match
        const bestMatch = this.findBestMatch(data.results, songTitle, artistName);
        
        if (bestMatch?.artworkUrl100) {
          // Get high-resolution artwork (replace 100x100 with 600x600)
          return bestMatch.artworkUrl100.replace('100x100bb', '600x600bb');
        }
      }

      return null;
    } catch (error) {
      console.warn(`iTunes search failed for: ${songTitle} by ${artistName}`, error);
      return null;
    }
  }

  private findBestMatch(results: iTunesSearchResult[], songTitle: string, artistName: string): iTunesSearchResult | null {
    if (results.length === 0) return null;

    const cleanSongTitle = this.cleanSearchTerm(songTitle).toLowerCase();
    const cleanArtistName = this.cleanSearchTerm(artistName).toLowerCase();

    // First, try to find exact or close matches
    for (const result of results) {
      const resultArtist = result.artistName.toLowerCase();
      const resultTrack = (result.trackName || result.collectionName || '').toLowerCase();

      // Check for artist match
      const artistMatch = this.isArtistMatch(cleanArtistName, resultArtist);
      
      // Check for song/album title match
      const titleMatch = songTitle && (
        this.calculateSimilarity(cleanSongTitle, resultTrack) > 0.6 ||
        resultTrack.includes(cleanSongTitle) ||
        cleanSongTitle.includes(resultTrack)
      );

      // Prefer exact matches
      if (artistMatch && titleMatch) {
        return result;
      }
    }

    // If no exact match, find best artist match
    for (const result of results) {
      const resultArtist = result.artistName.toLowerCase();
      if (this.isArtistMatch(cleanArtistName, resultArtist)) {
        return result;
      }
    }

    // Return first result with artwork as last resort
    return results.find(result => result.artworkUrl100) || results[0];
  }

  private isArtistMatch(searchArtist: string, resultArtist: string): boolean {
    if (!searchArtist || !resultArtist) return false;

    // Direct match
    if (searchArtist === resultArtist) return true;

    // Remove common words and check
    const searchWords = searchArtist.split(' ').filter(word => word.length > 2);
    const resultWords = resultArtist.split(' ').filter(word => word.length > 2);

    // Check if main artist words are present
    return searchWords.some(searchWord => 
      resultWords.some(resultWord => 
        resultWord.includes(searchWord) || searchWord.includes(resultWord)
      )
    );
  }

  private cleanSearchTerm(term: string): string {
    return term
      .toLowerCase()
      // Remove common features/collaborations
      .replace(/\s*\(.*?\)\s*/g, '') // Remove parentheses content
      .replace(/\s*\[.*?\]\s*/g, '') // Remove brackets content
      .replace(/\s*ft\.?\s*.*/g, '') // Remove "ft" and everything after
      .replace(/\s*feat\.?\s*.*/g, '') // Remove "feat" and everything after
      .replace(/\s*featuring\s*.*/g, '') // Remove "featuring" and everything after
      .replace(/\s*&\s*.*/g, '') // Remove "&" and everything after for collaborations
      .replace(/\s*x\s*.*/g, '') // Remove "x" collaborations
      .replace(/\s*with\s*.*/g, '') // Remove "with" collaborations
      // Clean up punctuation and spacing
      .replace(/[^\w\s]/g, ' ') // Replace punctuation with spaces
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .trim();
  }

  private simplifyArtistName(artistName: string): string {
    return artistName
      .split(' ')[0] // Take first word only
      .replace(/[^\w]/g, '') // Remove all non-word characters
      .toLowerCase();
  }

  private calculateSimilarity(str1: string, str2: string): number {
    if (!str1 || !str2) return 0;
    
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length <= str2.length ? str1 : str2;
    
    if (longer.length === 0) return 1.0;
    
    const distance = this.levenshteinDistance(longer, shorter);
    return (longer.length - distance) / longer.length;
  }

  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
    
    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;
    
    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const substitution = matrix[j - 1][i - 1] + (str1[i - 1] === str2[j - 1] ? 0 : 1);
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1, // insertion
          matrix[j - 1][i] + 1, // deletion
          substitution // substitution
        );
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  getPlaceholderImage(): string {
    // Return a music-themed SVG placeholder
    return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSJsaW5lYXItZ3JhZGllbnQoMTM1ZGVnLCAjMjEyMTIxIDAlLCAjMTExMTExIDEwMCUpIi8+CjxjaXJjbGUgY3g9IjEwMCIgY3k9IjEwMCIgcj0iNDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzU1NTU1NSIgc3Ryb2tlLXdpZHRoPSIyIi8+CjxjaXJjbGUgY3g9IjEwMCIgY3k9IjEwMCIgcj0iMTIiIGZpbGw9IiM3Nzc3NzciLz4KPHN2ZyB4PSI4MCIgeT0iNzAiIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSIjOTk5OTk5Ij4KPHA+PHBhdGggZD0iTTEyIDNWMTMuNTVBNCA0IDAgMSAwIDE0IDEwVjQuNzVMOSA2VjEwLjU1QTQgNCAwIDEgMCAxMSA4VjNaMTIgM1oiLz48L3A+PC9zdmc+Cjx0ZXh0IHg9IjEwMCIgeT0iMTcwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjNzc3Nzc3IiBmb250LXNpemU9IjEyIiBmb250LWZhbWlseT0iQXJpYWwiPk5vIENvdmVyPC90ZXh0Pgo8L3N2Zz4K';
  }

  // Progressive loading for individual album covers with priority support
  async loadAlbumCoverProgressive(
    songTitle: string, 
    artistName: string, 
    onCoverLoaded: (cover: string) => void,
    priority: 'high' | 'normal' | 'low' = 'normal'
  ): Promise<void> {
    const cacheKey = `${artistName}-${songTitle}`;
    
    // Check cache first
    if (this.cache.has(cacheKey)) {
      onCoverLoaded(this.cache.get(cacheKey)!);
      return;
    }

    // Check if request is already in progress
    if (this.requestQueue.has(cacheKey)) {
      try {
        const result = await this.requestQueue.get(cacheKey)!;
        onCoverLoaded(result);
      } catch (error) {
        onCoverLoaded(this.getPlaceholderImage());
      }
      return;
    }

    // Add delay for non-high priority items to avoid API rate limiting
    const delay = priority === 'high' ? 0 : (priority === 'normal' ? 200 : 500);
    
    const request = (async () => {
      if (delay > 0) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }
      return this.fetchAlbumCoverFromiTunes(songTitle, artistName);
    })();

    this.requestQueue.set(cacheKey, request);

    try {
      const result = await request;
      this.cache.set(cacheKey, result);
      onCoverLoaded(result);
    } catch (error) {
      console.warn(`Progressive loading failed for ${songTitle} by ${artistName}:`, error);
      const placeholder = this.getPlaceholderImage();
      this.cache.set(cacheKey, placeholder);
      onCoverLoaded(placeholder);
    } finally {
      this.requestQueue.delete(cacheKey);
    }
  }

  // Batch processing with rate limiting for iTunes API and progress tracking (kept for compatibility)
  async batchGetAlbumCovers(
    songs: Array<{title: string, artist: string}>, 
    onProgress?: (progress: number) => void
  ): Promise<Map<string, string>> {
    const results = new Map<string, string>();
    const totalSongs = songs.length;
    let completedSongs = 0;
    
    // Return placeholders immediately for all songs
    songs.forEach(song => {
      const key = `${song.artist}-${song.title}`;
      results.set(key, this.getPlaceholderImage());
    });
    
    // Simulate immediate completion for backwards compatibility
    if (onProgress) {
      onProgress(100);
    }
    
    return results;
  }

  // Legacy methods for compatibility (return null/empty without logging)
  async searchArtist(artistName: string): Promise<null> {
    return null;
  }

  async getArtistAlbums(artistId: string): Promise<[]> {
    return [];
  }

  async searchTrack(trackName: string, artistName: string): Promise<null> {
    return null;
  }
}

export const audioDbService = new AudioDbService();