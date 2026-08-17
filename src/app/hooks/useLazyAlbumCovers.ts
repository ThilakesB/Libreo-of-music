import { useState, useEffect, useRef, useCallback } from 'react';
import { Song } from '../types/Song';
import { itunesApiService } from '../services/itunesApiService';

interface LazyLoadState {
  loadedCovers: Map<string, string>;
  loadingCovers: Set<string>;
  failedCovers: Set<string>;
  loadedCount: number;
}

interface UseLazyAlbumCoversProps {
  songs: Song[];
  centerIndex: number;
  preloadRadius?: number; // How many songs around center to preload
  lazyLoadRadius?: number; // How many songs around visible area to lazy load
}

interface UseLazyAlbumCoversReturn {
  getSongCover: (song: Song) => string;
  isSongLoading: (songId: string) => boolean;
  isSongFailed: (songId: string) => boolean;
  loadedCount: number;
  totalCount: number;
  loadingProgress: number;
  preloadCoversBatch: (songs: Song[]) => Promise<void>;
  clearCache: () => void;
}

export function useLazyAlbumCovers({
  songs,
  centerIndex,
  preloadRadius = 5,
  lazyLoadRadius = 10
}: UseLazyAlbumCoversProps): UseLazyAlbumCoversReturn {
  
  const [state, setState] = useState<LazyLoadState>({
    loadedCovers: new Map(),
    loadingCovers: new Set(),
    failedCovers: new Set(),
    loadedCount: 0
  });
  
  const abortControllerRef = useRef<AbortController | null>(null);
  const loadingQueue = useRef<Set<string>>(new Set());
  
  // Load a single album cover
  const loadAlbumCover = useCallback(async (song: Song, signal?: AbortSignal): Promise<void> => {
    const songKey = `${song.artist}-${song.title}`;
    
    // Skip if already loaded, loading, or failed
    if (state.loadedCovers.has(songKey) || state.loadingCovers.has(songKey) || state.failedCovers.has(songKey)) {
      return;
    }
    
    // Add to loading queue
    if (loadingQueue.current.has(songKey)) {
      return;
    }
    
    loadingQueue.current.add(songKey);
    
    setState(prev => ({
      ...prev,
      loadingCovers: new Set([...prev.loadingCovers, songKey])
    }));
    
    try {
      // Check if request was aborted
      if (signal?.aborted) {
        throw new Error('Request aborted');
      }
      
      // Try to get iTunes cover first
      let albumCover = await itunesApiService.searchTrack(song.artist, song.title);
      
      // Check again for abort after async operation
      if (signal?.aborted) {
        throw new Error('Request aborted');
      }
      
      // If iTunes fails, use fallback
      if (!albumCover) {
        albumCover = itunesApiService.getFallbackArtwork(song.artist, song.title);
      }
      
      // Preload the image to ensure it's cached
      if (albumCover && !albumCover.startsWith('data:')) {
        await new Promise<void>((resolve, reject) => {
          const img = new Image();
          img.onload = () => resolve();
          img.onerror = () => reject(new Error('Image load failed'));
          img.src = albumCover;
          
          // Timeout after 10 seconds
          setTimeout(() => reject(new Error('Image load timeout')), 10000);
        });
      }
      
      setState(prev => {
        const newLoadedCovers = new Map(prev.loadedCovers);
        const newLoadingCovers = new Set(prev.loadingCovers);
        
        newLoadedCovers.set(songKey, albumCover!);
        newLoadingCovers.delete(songKey);
        
        return {
          ...prev,
          loadedCovers: newLoadedCovers,
          loadingCovers: newLoadingCovers,
          loadedCount: newLoadedCovers.size
        };
      });
      
      console.log(`✅ Loaded cover for: ${song.artist} - ${song.title}`);
      
    } catch (error) {
      if (signal?.aborted) {
        console.log(`⏹️ Aborted loading cover for: ${song.artist} - ${song.title}`);
      } else {
        console.error(`❌ Failed to load cover for: ${song.artist} - ${song.title}`, error);
        
        // Use fallback for failed loads
        const fallbackCover = itunesApiService.getFallbackArtwork(song.artist, song.title);
        
        setState(prev => {
          const newLoadedCovers = new Map(prev.loadedCovers);
          const newLoadingCovers = new Set(prev.loadingCovers);
          const newFailedCovers = new Set(prev.failedCovers);
          
          newLoadedCovers.set(songKey, fallbackCover);
          newLoadingCovers.delete(songKey);
          newFailedCovers.add(songKey);
          
          return {
            ...prev,
            loadedCovers: newLoadedCovers,
            loadingCovers: newLoadingCovers,
            failedCovers: newFailedCovers,
            loadedCount: newLoadedCovers.size
          };
        });
      }
    } finally {
      loadingQueue.current.delete(songKey);
    }
  }, [state.loadedCovers, state.loadingCovers, state.failedCovers]);
  
  // Load covers for songs in priority order
  const loadCoversBatch = useCallback(async (songsToLoad: Song[]): Promise<void> => {
    // Cancel any existing loading operation
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // Create new abort controller
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;
    
    // Load covers with small delays to avoid overwhelming the API
    for (let i = 0; i < songsToLoad.length; i++) {
      if (signal.aborted) break;
      
      const song = songsToLoad[i];
      await loadAlbumCover(song, signal);
      
      // Small delay between requests (respectful to iTunes API)
      if (i < songsToLoad.length - 1 && !signal.aborted) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }
  }, [loadAlbumCover]);
  
  // Effect to load covers based on current center index
  useEffect(() => {
    if (songs.length === 0) return;
    
    // Calculate which songs to load
    const songsToLoad: Song[] = [];
    
    // First priority: songs in preload radius (immediately visible)
    const preloadStart = Math.max(0, centerIndex - preloadRadius);
    const preloadEnd = Math.min(songs.length - 1, centerIndex + preloadRadius);
    
    for (let i = preloadStart; i <= preloadEnd; i++) {
      const songKey = `${songs[i].artist}-${songs[i].title}`;
      if (!state.loadedCovers.has(songKey) && !state.loadingCovers.has(songKey)) {
        songsToLoad.push(songs[i]);
      }
    }
    
    // Second priority: songs in lazy load radius (potentially visible soon)
    const lazyStart = Math.max(0, centerIndex - lazyLoadRadius);
    const lazyEnd = Math.min(songs.length - 1, centerIndex + lazyLoadRadius);
    
    for (let i = lazyStart; i <= lazyEnd; i++) {
      if (i < preloadStart || i > preloadEnd) {
        const songKey = `${songs[i].artist}-${songs[i].title}`;
        if (!state.loadedCovers.has(songKey) && !state.loadingCovers.has(songKey)) {
          songsToLoad.push(songs[i]);
        }
      }
    }
    
    if (songsToLoad.length > 0) {
      loadCoversBatch(songsToLoad);
    }
    
  }, [songs, centerIndex, preloadRadius, lazyLoadRadius, loadCoversBatch, state.loadedCovers, state.loadingCovers]);
  
  // Get cover for a specific song
  const getSongCover = useCallback((song: Song): string => {
    const songKey = `${song.artist}-${song.title}`;
    return state.loadedCovers.get(songKey) || song.albumCover;
  }, [state.loadedCovers]);
  
  // Check if a song is currently loading
  const isSongLoading = useCallback((songId: string): boolean => {
    const song = songs.find(s => s.id === songId);
    if (!song) return false;
    
    const songKey = `${song.artist}-${song.title}`;
    return state.loadingCovers.has(songKey);
  }, [songs, state.loadingCovers]);
  
  // Check if a song failed to load
  const isSongFailed = useCallback((songId: string): boolean => {
    const song = songs.find(s => s.id === songId);
    if (!song) return false;
    
    const songKey = `${song.artist}-${song.title}`;
    return state.failedCovers.has(songKey);
  }, [songs, state.failedCovers]);
  
  // Preload a batch of covers (for search results, etc.)
  const preloadCoversBatch = useCallback(async (songsToPreload: Song[]): Promise<void> => {
    await loadCoversBatch(songsToPreload);
  }, [loadCoversBatch]);
  
  // Clear all cached covers
  const clearCache = useCallback((): void => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    setState({
      loadedCovers: new Map(),
      loadingCovers: new Set(),
      failedCovers: new Set(),
      loadedCount: 0
    });
    
    itunesApiService.clearCache();
    loadingQueue.current.clear();
  }, []);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);
  
  const loadingProgress = songs.length > 0 ? (state.loadedCount / songs.length) * 100 : 0;
  
  return {
    getSongCover,
    isSongLoading,
    isSongFailed,
    loadedCount: state.loadedCount,
    totalCount: songs.length,
    loadingProgress,
    preloadCoversBatch,
    clearCache
  };
}