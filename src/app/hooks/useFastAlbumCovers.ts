import { useState, useEffect, useRef, useCallback } from 'react';
import { Song } from '../types/Song';
import { fastItunesService } from '../services/fastItunesService';

interface UseFastAlbumCoversProps {
  songs: Song[];
  centerIndex: number;
  preloadRadius?: number;
}

interface UseFastAlbumCoversReturn {
  getCover: (song: Song) => string | null;
  isLoading: (songId: string) => boolean;
  loadedCount: number;
  totalSongs: number;
  loadingProgress: number;
}

export function useFastAlbumCovers({
  songs,
  centerIndex,
  preloadRadius = 5
}: UseFastAlbumCoversProps): UseFastAlbumCoversReturn {
  
  const [loadedCovers, setLoadedCovers] = useState<Map<string, string>>(new Map());
  const [loadingItems, setLoadingItems] = useState<Set<string>>(new Set());
  const [attemptedLoads, setAttemptedLoads] = useState<Set<string>>(new Set());
  const loadingQueue = useRef<Set<string>>(new Set());
  const loadedCount = loadedCovers.size;
  const totalSongs = songs.length;
  
  // Get cache key for a song
  const getCacheKey = useCallback((song: Song) => {
    return `${song.artist.toLowerCase()}-${song.title.toLowerCase()}`;
  }, []);
  
  // Load a single cover
  const loadCover = useCallback(async (song: Song) => {
    const cacheKey = getCacheKey(song);
    
    // Skip if already attempted, loaded, or loading
    if (attemptedLoads.has(cacheKey) || loadedCovers.has(cacheKey) || loadingQueue.current.has(cacheKey)) {
      return;
    }
    
    loadingQueue.current.add(cacheKey);
    setLoadingItems(prev => new Set([...prev, song.id]));
    
    try {
      const cover = await fastItunesService.getAlbumCover(song.artist, song.title);
      
      if (cover) {
        setLoadedCovers(prev => new Map([...prev, [cacheKey, cover]]));
      }
    } catch (error) {
      console.error(`Failed to load cover for ${song.artist} - ${song.title}:`, error);
    } finally {
      // Mark as attempted regardless of success/failure
      setAttemptedLoads(prev => new Set([...prev, cacheKey]));
      loadingQueue.current.delete(cacheKey);
      setLoadingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(song.id);
        return newSet;
      });
    }
  }, [getCacheKey, loadedCovers, attemptedLoads]);
  
  // Load covers for songs around center index
  useEffect(() => {
    if (songs.length === 0) return;
    
    // Determine priority loading order: center first, then expand outward
    const songsToLoad: Song[] = [];
    
    // Center song first
    if (songs[centerIndex]) {
      songsToLoad.push(songs[centerIndex]);
    }
    
    // Then songs around center, expanding outward
    for (let radius = 1; radius <= preloadRadius; radius++) {
      // Previous song
      const prevIndex = centerIndex - radius;
      if (prevIndex >= 0 && songs[prevIndex]) {
        songsToLoad.push(songs[prevIndex]);
      }
      
      // Next song
      const nextIndex = centerIndex + radius;
      if (nextIndex < songs.length && songs[nextIndex]) {
        songsToLoad.push(songs[nextIndex]);
      }
    }
    
    // Load covers in priority order with small delays
    const loadSequence = async () => {
      for (let i = 0; i < songsToLoad.length; i++) {
        await loadCover(songsToLoad[i]);
        
        // Very small delay to avoid overwhelming the API
        if (i < songsToLoad.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 50));
        }
      }
    };
    
    loadSequence();
  }, [songs, centerIndex, preloadRadius, loadCover]);
  
  // Background loading for remaining songs
  useEffect(() => {
    if (songs.length === 0 || loadedCount < preloadRadius * 2) return;
    
    // Load remaining songs in background
    const remainingSongs = songs.filter(song => {
      const cacheKey = getCacheKey(song);
      return !attemptedLoads.has(cacheKey) && !loadedCovers.has(cacheKey) && !loadingQueue.current.has(cacheKey);
    });
    
    if (remainingSongs.length > 0) {
      // Load in small batches with delays
      const loadBackground = async () => {
        const batchSize = 3;
        for (let i = 0; i < remainingSongs.length; i += batchSize) {
          const batch = remainingSongs.slice(i, i + batchSize);
          
          // Load batch concurrently
          await Promise.all(batch.map(song => loadCover(song)));
          
          // Delay between batches
          if (i + batchSize < remainingSongs.length) {
            await new Promise(resolve => setTimeout(resolve, 200));
          }
        }
      };
      
      // Start background loading after a short delay
      const timer = setTimeout(loadBackground, 1000);
      return () => clearTimeout(timer);
    }
  }, [songs, loadedCount, preloadRadius, getCacheKey, attemptedLoads, loadedCovers, loadCover]);
  
  // Get cover for a song
  const getCover = useCallback((song: Song): string | null => {
    const cacheKey = getCacheKey(song);
    return loadedCovers.get(cacheKey) || null;
  }, [getCacheKey, loadedCovers]);
  
  // Check if a song is currently loading
  const isLoading = useCallback((songId: string): boolean => {
    return loadingItems.has(songId);
  }, [loadingItems]);
  
  // Calculate progress based on attempted loads rather than just successful ones
  // This ensures progress reaches 100% even if some covers fail
  const attemptedCount = attemptedLoads.size;
  const loadingProgress = totalSongs > 0 ? (attemptedCount / totalSongs) * 100 : 0;
  
  return {
    getCover,
    isLoading,
    loadedCount,
    totalSongs,
    loadingProgress
  };
}