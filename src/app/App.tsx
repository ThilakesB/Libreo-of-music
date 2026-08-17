import React, { useState, useEffect, useRef } from 'react';
import { CoverFlow } from './components/CoverFlow';
import { SearchBar } from './components/SearchBar';
import { Player } from './components/Player';
import { Song } from './types/Song';
import { localAlbumService } from './services/localAlbumService';
import { useFastAlbumCovers } from './hooks/useFastAlbumCovers';

export default function App() {
  const [songs, setSongs] = useState<Song[]>([]);
  const [selectedSong, setSelectedSong] = useState<Song | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [autoPlayNext, setAutoPlayNext] = useState(false); // triggers autoplay when song auto-advances

  // Drag-to-open state
  const dragStartY = useRef<number | null>(null);
  const isDragging = useRef(false);

  // Fast iTunes album cover loading - no fallbacks, direct API only
  const {
    getCover,
    isLoading,
    loadedCount,
    totalSongs,
    loadingProgress
  } = useFastAlbumCovers({
    songs,
    centerIndex: currentIndex,
    preloadRadius: 4 // Load 4 songs around center for smooth scrolling
  });

  // Load songs from local database - instant loading, covers from iTunes API
  const loadSongs = async (query: string = ''): Promise<Song[]> => {
    // Minimal delay for smooth UX
    await new Promise(resolve => setTimeout(resolve, 50));

    if (!query.trim()) {
      // Return all trending songs - covers loaded dynamically from iTunes
      return localAlbumService.getTrendingSongs();
    } else {
      // Search in local database - covers loaded dynamically
      return localAlbumService.searchSongs(query);
    }
  };

  const fetchSongs = async (query: string = '') => {
    setLoading(true);
    setError(null);
    setSearchQuery(query);

    try {
      const songsData = await loadSongs(query);
      setSongs(songsData);
      setCurrentIndex(Math.floor(songsData.length / 2));
      setLoading(false);
    } catch (err) {
      setError('Failed to load songs');
      setSongs([]);
      setCurrentIndex(0);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSongs();
  }, []);

  // Set initial selected song to middle track when songs load
  useEffect(() => {
    if (songs.length > 0 && !selectedSong) {
      const middleIndex = Math.floor(songs.length / 2);
      setSelectedSong(songs[middleIndex]);
      // isPlaying stays false - user must click play to start
    }
  }, [songs, selectedSong]);

  // Close drawer on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setSearchOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const handleSearch = (query: string) => {
    fetchSongs(query);
  };

  const handleSongSelect = (song: Song) => {
    setSelectedSong(song);
    setIsPlaying(false); // Reset playing state when selecting new song

    // Update current index
    const index = songs.findIndex(s => s.id === song.id);
    if (index !== -1) {
      setCurrentIndex(index);
    }
  };

  const handlePlayingChange = (playing: boolean) => {
    setIsPlaying(playing);
    if (playing) setAutoPlayNext(false); // clear flag once playing starts
  };

  // Auto-advance to next song when current one ends
  const handleSongEnd = () => {
    if (songs.length === 0) return;
    const nextIndex = (currentIndex + 1) % songs.length; // wraps around
    const nextSong = songs[nextIndex];
    setCurrentIndex(nextIndex);
    setSelectedSong(nextSong);
    setAutoPlayNext(true); // tell Player to auto-start when ready
  };

  const handleNext = () => {
    if (songs.length === 0) return;
    const nextIndex = (currentIndex + 1) % songs.length;
    setCurrentIndex(nextIndex);
    setSelectedSong(songs[nextIndex]);
    setAutoPlayNext(isPlaying); // keep playing if already playing
  };

  const handlePrev = () => {
    if (songs.length === 0) return;
    const prevIndex = (currentIndex - 1 + songs.length) % songs.length;
    setCurrentIndex(prevIndex);
    setSelectedSong(songs[prevIndex]);
    setAutoPlayNext(isPlaying); // keep playing if already playing
  };

  // Handle drag/tap on the pill handle
  const handleHandlePointerDown = (e: React.PointerEvent) => {
    dragStartY.current = e.clientY;
    isDragging.current = false;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handleHandlePointerMove = (e: React.PointerEvent) => {
    if (dragStartY.current === null) return;
    const delta = e.clientY - dragStartY.current;
    if (Math.abs(delta) > 5) isDragging.current = true;
    if (delta > 30 && !searchOpen) setSearchOpen(true);
    if (delta < -30 && searchOpen) setSearchOpen(false);
  };

  const handleHandlePointerUp = () => {
    if (!isDragging.current) setSearchOpen(prev => !prev);
    dragStartY.current = null;
  };

  return (
    <div
      className="h-screen text-white overflow-hidden relative"
      style={{
        background: 'linear-gradient(to bottom, #000000 0%, #111111 100%)',
        zIndex: 1,
        position: 'relative',
        width: '100vw',
        height: '100vh',
        isolation: 'isolate'
      }}
    >
      {/* Reflective floor */}
      <div
        className="fixed bottom-0 left-0 right-0 h-1/2 pointer-events-none"
        style={{
          background: 'linear-gradient(to top, rgba(255,255,255,0.02) 0%, transparent 100%)',
          transform: 'perspective(1000px) rotateX(60deg)',
          transformOrigin: 'bottom',
          zIndex: 1
        }}
      />

      {/* ── Slide-down search drawer ── */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 600,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        {/* Search panel – slides in/out */}
        <div
          style={{
            width: '100%',
            maxWidth: '480px',
            overflow: 'hidden',
            maxHeight: searchOpen ? '80px' : '0px',
            transition: 'max-height 0.35s cubic-bezier(0.4,0,0.2,1)',
            paddingTop: searchOpen ? '12px' : '0px',
          }}
        >
          <SearchBar onSearch={handleSearch} />
        </div>

        {/* Draggable pill handle */}
        <div
          onPointerDown={handleHandlePointerDown}
          onPointerMove={handleHandlePointerMove}
          onPointerUp={handleHandlePointerUp}
          style={{
            marginTop: '6px',
            cursor: 'grab',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '3px',
            userSelect: 'none',
            touchAction: 'none',
            padding: '6px 16px',
          }}
          title={searchOpen ? 'Close search' : 'Open search'}
        >
          {/* Pill */}
          <div style={{
            width: '36px',
            height: '4px',
            borderRadius: '9999px',
            background: searchOpen ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.25)',
            transition: 'background 0.2s, transform 0.2s',
            transform: searchOpen ? 'scaleX(0.7)' : 'scaleX(1)',
          }} />
          {/* Chevron arrow */}
          <svg
            width="16" height="10" viewBox="0 0 16 10" fill="none"
            style={{
              transition: 'transform 0.35s',
              transform: searchOpen ? 'rotate(180deg)' : 'rotate(0deg)',
              opacity: 0.45,
            }}
          >
            <path d="M1 1.5L8 8.5L15 1.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </div>

      {/* Main Content - fills full viewport, centred vertically */}
      <div
        className="relative flex-1 flex flex-col items-center justify-center px-2 sm:px-4 md:px-8 pb-4 sm:pb-16"
        style={{ zIndex: 200, height: '100dvh' }}
      >
        {loading ? (
          <div className="flex flex-col items-center justify-center gap-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-400"></div>
            <span className="text-gray-300">Loading songs...</span>
          </div>
        ) : error ? (
          <div className="text-center text-red-400">
            <p>{error}</p>
            <button
              onClick={() => fetchSongs()}
              className="mt-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : songs.length === 0 ? (
          <div className="text-center text-gray-400">
            <p>No songs found for "{searchQuery}"</p>
            <button
              onClick={() => fetchSongs()}
              className="mt-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
            >
              Show All Songs
            </button>
          </div>
        ) : (
          <>
            <CoverFlow
              songs={songs}
              onSongSelect={handleSongSelect}
              selectedSong={selectedSong}
              isPlaying={isPlaying}
              getCover={getCover}
              isLoading={isLoading}
            />

            {selectedSong && (
              <div className="mt-4 sm:mt-8 text-center relative" style={{ zIndex: 250 }}>
                <div className="bg-transparent p-2">
                  <h2 className="text-base sm:text-xl font-light mb-1 sm:mb-2 text-white drop-shadow-lg px-4 truncate max-w-xs sm:max-w-none">
                    {selectedSong.title}
                  </h2>
                  <p className="text-sm sm:text-base mb-1 font-light text-gray-300 drop-shadow-md">
                    {selectedSong.artist}
                  </p>
                  {selectedSong.albumName && (
                    <p className="text-xs sm:text-sm mb-3 sm:mb-4 font-light text-gray-400 drop-shadow-md">
                      from {selectedSong.albumName} {selectedSong.year && `(${selectedSong.year})`}
                    </p>
                  )}
                  <Player
                    youtubeId={selectedSong.youtubeId}
                    onPlayingChange={handlePlayingChange}
                    onSongEnd={handleSongEnd}
                    onNext={currentIndex < songs.length - 1 ? handleNext : undefined}
                    onPrev={currentIndex > 0 ? handlePrev : undefined}
                    autoPlayOnReady={autoPlayNext}
                  />
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}