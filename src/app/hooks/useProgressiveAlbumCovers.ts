import { useState, useEffect, useCallback, useRef } from 'react';
import { Song } from '../types/Song';
import { audioDbService } from '../services/audioDbService';

interface UseProgressiveAlbumCoversOptions {
  songs: Song[];
  visibleRange?: { start: number; end: number };
  centerIndex?: number;
}

export function useProgressiveAlbumCovers({ 
  songs, 
  visibleRange, 
  centerIndex = Math.floor(songs.length / 2) 
}: UseProgressiveAlbumCoversOptions) {
  const [songCovers, setSongCovers] = useState<Map<string, string>>(new Map());
  const [loadingStates, setLoadingStates] = useState<Map<string, boolean>>(new Map());
  const [loadedCount, setLoadedCount] = useState(0);
  const loadingQueueRef = useRef<Set<string>>(new Set());
  const loadedIdsRef = useRef<Set<string>>(new Set());

  // Get song key for consistent mapping
  const getSongKey = useCallback((song: Song) => `${song.artist}-${song.title}`, []);

  // Update loading state for a song
  const updateLoadingState = useCallback((songId: string, isLoading: boolean) => {
    setLoadingStates(prev => {
      const next = new Map(prev);
      if (isLoading) {
        next.set(songId, true);
      } else {
        next.delete(songId);
      }
      return next;
    });
  }, []);

  // Load album cover for a specific song
  const loadSongCover = useCallback(async (
    song: Song, 
    priority: 'high' | 'normal' | 'low' = 'normal'
  ) => {
    const songKey = getSongKey(song);
    
    // Skip if already loaded or loading
    if (loadedIdsRef.current.has(song.id) || loadingQueueRef.current.has(song.id)) {
      return;
    }

    loadingQueueRef.current.add(song.id);
    updateLoadingState(song.id, true);

    try {
      await audioDbService.loadAlbumCoverProgressive(
        song.title,
        song.artist,
        (cover: string) => {
          // Update the song cover
          setSongCovers(prev => {
            const next = new Map(prev);
            next.set(song.id, cover);
            return next;
          });

          // Mark as loaded
          loadedIdsRef.current.add(song.id);
          setLoadedCount(prev => prev + 1);
          updateLoadingState(song.id, false);
        },
        priority
      );
    } catch (error) {
      console.warn(`Failed to load cover for ${song.title}:`, error);
      updateLoadingState(song.id, false);
    } finally {
      loadingQueueRef.current.delete(song.id);
    }
  }, [getSongKey, updateLoadingState]);

  // Initialize with placeholder covers
  useEffect(() => {
    if (songs.length === 0) return;

    // Set initial placeholder covers
    const initialCovers = new Map<string, string>();
    songs.forEach(song => {
      initialCovers.set(song.id, audioDbService.getPlaceholderImage());
    });
    setSongCovers(initialCovers);
    setLoadedCount(0);
    loadedIdsRef.current.clear();
    loadingQueueRef.current.clear();
  }, [songs]);

  // Progressive loading strategy
  useEffect(() => {
    if (songs.length === 0) return;

    const loadCovers = async () => {
      // Phase 1: Load center/current song first (highest priority)
      if (centerIndex >= 0 && centerIndex < songs.length) {
        await loadSongCover(songs[centerIndex], 'high');
      }

      // Phase 2: Load visible range (high priority)
      if (visibleRange) {
        const visibleSongs = songs.slice(
          Math.max(0, visibleRange.start), 
          Math.min(songs.length, visibleRange.end + 1)
        );
        
        // Load visible songs in parallel but with slight delays
        const visiblePromises = visibleSongs.map((song, index) => 
          loadSongCover(song, index < 3 ? 'high' : 'normal')
        );
        
        // Don't wait for all visible to complete before starting background loading
        Promise.all(visiblePromises);
      }

      // Phase 3: Load remaining songs (lower priority, background loading)
      const remainingSongs = songs.filter(song => !loadedIdsRef.current.has(song.id));
      
      // Load remaining songs with spacing to avoid API rate limits
      for (let i = 0; i < remainingSongs.length; i++) {
        // Small delay between background loads
        if (i > 0 && i % 3 === 0) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        loadSongCover(remainingSongs[i], 'low');
      }
    };

    loadCovers();
  }, [songs, centerIndex, visibleRange, loadSongCover]);

  // Get cover for a specific song
  const getSongCover = useCallback((song: Song): string => {
    return songCovers.get(song.id) || audioDbService.getPlaceholderImage();
  }, [songCovers]);

  // Check if a song is loading
  const isSongLoading = useCallback((songId: string): boolean => {
    return loadingStates.get(songId) || false;
  }, [loadingStates]);

  return {
    getSongCover,
    isSongLoading,
    loadedCount,
    totalCount: songs.length,
    loadingProgress: songs.length > 0 ? (loadedCount / songs.length) * 100 : 0,
    loadSongCover: (song: Song, priority?: 'high' | 'normal' | 'low') => loadSongCover(song, priority)
  };
}