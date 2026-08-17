import React, { useState, useEffect } from 'react';
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

  // Set initial selected song to middle track when songs load and start playing by default
  useEffect(() => {
    if (songs.length > 0 && !selectedSong) {
      const middleIndex = Math.floor(songs.length / 2);
      setSelectedSong(songs[middleIndex]);
      setIsPlaying(true); // Auto-play the first song when app loads
    }
  }, [songs, selectedSong]);

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
  };

  const totalSongsCount = localAlbumService.getTotalSongCount();
  const displayText = searchQuery 
    ? `${songs.length} results for "${searchQuery}"`
    : `Top ${totalSongsCount} Trending`;

  return (
    <div 
      className="h-screen text-white overflow-hidden relative"
      style={{
        background: 'linear-gradient(to bottom, #000000 0%, #111111 100%)',
        zIndex: 1, // Ensure proper stacking context
        position: 'relative',
        width: '100vw',
        height: '100vh',
        isolation: 'isolate' // Create new stacking context to prevent z-index issues
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
      
      {/* iPod-style header */}
      <div className="relative flex items-center justify-between p-4 bg-black/20 backdrop-blur-md" style={{ zIndex: 500 }}>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-white rounded-full shadow-sm"></div>
          <span className="text-sm font-medium tracking-wide text-gray-300">iPod</span>
          <div className="w-4 h-2 ml-1">
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full text-white/70">
              <path d="M2 17h20v2H2zm1.15-4.05L4 11.47l.85 1.48L6 12l-1.15-.95zM12 8l-6 6h12l-6-6z"/>
            </svg>
          </div>
        </div>
        <div className="text-sm font-medium text-gray-300">
          {loading ? 'Loading...' : displayText}
        </div>
        <div className="flex items-center gap-1">
          <div className="w-6 h-3 bg-gradient-to-r from-green-400 to-green-500 rounded-sm shadow-sm"></div>
          <div className="text-xs text-gray-400">100%</div>
        </div>

      </div>

      {/* Search Bar */}
      <div className="relative p-4" style={{ zIndex: 450 }}>
        <SearchBar onSearch={handleSearch} />
      </div>

      {/* Main Content */}
      <div className="relative flex-1 flex flex-col items-center justify-center px-4 md:px-8 pb-16" style={{ zIndex: 200, height: 'calc(100vh - 140px)' }}>
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
              <div className="mt-8 text-center relative" style={{ zIndex: 250 }}>
                {/* Always visible song info with enhanced contrast when playing */}
                <div className="bg-transparent p-2">
                  <h2 className="text-xl font-light mb-2 text-white drop-shadow-lg">
                    {selectedSong.title}
                  </h2>
                  <p className="text-base mb-1 font-light text-gray-300 drop-shadow-md">
                    {selectedSong.artist}
                  </p>
                  {selectedSong.albumName && (
                    <p className="text-sm mb-4 font-light text-gray-400 drop-shadow-md">
                      from {selectedSong.albumName} {selectedSong.year && `(${selectedSong.year})`}
                    </p>
                  )}
                  <Player 
                    youtubeId={selectedSong.youtubeId} 
                    onPlayingChange={handlePlayingChange}
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