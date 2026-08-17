import React, { useState, useRef, useEffect } from 'react';
import { SimpleBackgroundVideo } from './SimpleBackgroundVideo';
import { useResponsive } from '../hooks/useResponsive';

interface PlayerProps {
  youtubeId: string;
  onPlayingChange?: (isPlaying: boolean) => void;
  onSongEnd?: () => void;
  onNext?: () => void;
  onPrev?: () => void;
  autoPlayOnReady?: boolean;
}

export function Player({ youtubeId, onPlayingChange, onSongEnd, onNext, onPrev, autoPlayOnReady = false }: PlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const playerRef = useRef<any>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const { isMobile } = useResponsive();

  // Refs so callbacks inside YouTube events always see latest values
  const isPlayingRef = useRef(false);
  const onPlayingChangeRef = useRef(onPlayingChange);
  const onSongEndRef = useRef(onSongEnd);
  const autoPlayOnReadyRef = useRef(autoPlayOnReady);

  // Keep refs in sync with latest values
  useEffect(() => { isPlayingRef.current = isPlaying; }, [isPlaying]);
  useEffect(() => { onPlayingChangeRef.current = onPlayingChange; }, [onPlayingChange]);
  useEffect(() => { onSongEndRef.current = onSongEnd; }, [onSongEnd]);
  useEffect(() => { autoPlayOnReadyRef.current = autoPlayOnReady; }, [autoPlayOnReady]);

  // Stable initializePlayer stored in a ref so useEffect doesn't need it as a dependency
  const initializePlayerRef = useRef<() => void>(() => {});
  initializePlayerRef.current = () => {
    if (playerRef.current) {
      playerRef.current.destroy();
      playerRef.current = null;
    }

    playerRef.current = new (window as any).YT.Player('youtube-audio-player', {
      height: '0',
      width: '0',
      videoId: youtubeId,
      playerVars: {
        autoplay: 0,
        controls: 0,
        disablekb: 1,
        fs: 0,
        modestbranding: 1,
        rel: 0,
        showinfo: 0,
        iv_load_policy: 3,
        cc_load_policy: 0,
        playsinline: 1
      },
      events: {
        onReady: () => {
          setIsReady(true);
          // Auto-play if the parent requested it (e.g. after auto-advancing songs)
          if (autoPlayOnReadyRef.current) {
            setTimeout(() => {
              playerRef.current?.playVideo();
            }, 300);
          }
        },
        onStateChange: (event: any) => {
          const state = event.data;
          const YTState = (window as any).YT.PlayerState;

          if (state === YTState.ENDED) {
            // Song finished — notify parent to advance to next
            setIsPlaying(false);
            onPlayingChangeRef.current?.(false);
            onSongEndRef.current?.();
            return;
          }

          const isCurrentlyPlaying = state === YTState.PLAYING;
          setIsPlaying(isCurrentlyPlaying);
          onPlayingChangeRef.current?.(isCurrentlyPlaying);
        }
      }
    });
  };

  // Initialize YouTube API when component mounts or youtubeId changes
  useEffect(() => {
    const init = () => initializePlayerRef.current();

    if (!(window as any).YT || !(window as any).YT.Player) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
      (window as any).onYouTubeIframeAPIReady = init;
    } else {
      init();
    }

    return () => {
      if (playerRef.current) {
        playerRef.current.destroy?.();
        playerRef.current = null;
      }
      setIsReady(false);
      setIsPlaying(false);
    };
  }, [youtubeId]);

  const handleTogglePlay = () => {
    if (!isReady || !playerRef.current) return;

    try {
      if (isPlayingRef.current) {
        playerRef.current.pauseVideo();
      } else {
        playerRef.current.playVideo();
      }
    } catch (error) {
      console.error('Error controlling YouTube player:', error);
    }
  };

  return (
    <>
      {/* Hidden YouTube Audio Player */}
      <div id="youtube-audio-player" style={{ display: 'none' }} />
      
      {/* Simple Background Video */}
      <SimpleBackgroundVideo youtubeId={youtubeId} isPlaying={isPlaying} />

      {/* iOS-style Music Controls */}
      <div className="flex flex-col items-center gap-4 sm:gap-6 relative" style={{ zIndex: 100 }}>
        {/* Main Controls Row */}
        <div className="flex items-center gap-6 sm:gap-8">
          {/* Previous Button */}
          <button
            onClick={onPrev}
            disabled={!onPrev}
            className={`group relative flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12
                       transition-all duration-200 transform active:scale-95
                       ${onPrev ? 'text-white/80 hover:text-white hover:scale-110' : 'text-white/30 cursor-not-allowed'}`}
          >
            <svg className="w-6 h-6 sm:w-8 sm:h-8" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/>
            </svg>
          </button>

          {/* Play/Pause Button */}
          <button
            onClick={handleTogglePlay}
            disabled={!isReady}
            className={`group relative flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20
                       bg-white rounded-full shadow-2xl hover:shadow-3xl 
                       transition-all duration-300 transform hover:scale-105 active:scale-95
                       ${!isReady ? 'opacity-50 cursor-not-allowed' : ''}`}
            style={{
              boxShadow: `
                0 12px 40px rgba(255,255,255,0.3),
                0 4px 16px rgba(0,0,0,0.1),
                inset 0 1px 3px rgba(255,255,255,0.2)
              `
            }}
          >
            {!isReady ? (
              <svg 
                className="w-6 h-6 sm:w-8 sm:h-8 text-black animate-spin" 
                fill="none" 
                viewBox="0 0 24 24"
              >
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : !isPlaying ? (
              <svg 
                className="w-6 h-6 sm:w-8 sm:h-8 text-black ml-1 group-hover:text-gray-800 transition-colors" 
                fill="currentColor" 
                viewBox="0 0 24 24"
              >
                <path d="M8 5v14l11-7z"/>
              </svg>
            ) : (
              <svg 
                className="w-6 h-6 sm:w-8 sm:h-8 text-black group-hover:text-gray-800 transition-colors" 
                fill="currentColor" 
                viewBox="0 0 24 24"
              >
                <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
              </svg>
            )}
            
            {/* iOS-style glow effect */}
            <div className="absolute inset-0 rounded-full bg-white opacity-0 group-hover:opacity-20 
                            transition-opacity duration-300"></div>
          </button>

          {/* Next Button */}
          <button
            onClick={onNext}
            disabled={!onNext}
            className={`group relative flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12
                       transition-all duration-200 transform active:scale-95
                       ${onNext ? 'text-white/80 hover:text-white hover:scale-110' : 'text-white/30 cursor-not-allowed'}`}
          >
            <svg className="w-6 h-6 sm:w-8 sm:h-8" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/>
            </svg>
          </button>
        </div>

        {/* Status Text */}
        <p className="text-sm text-gray-400 font-light tracking-wide relative" style={{ zIndex: 100 }}>
          {!isReady ? 'Loading...' : isPlaying ? 'Now Playing' : 'Tap to play'}
        </p>
      </div>
    </>
  );
}