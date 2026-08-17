import React, { useState, useEffect } from 'react';

interface SimpleBackgroundVideoProps {
  youtubeId: string;
  isPlaying: boolean;
}

export function SimpleBackgroundVideo({ youtubeId, isPlaying }: SimpleBackgroundVideoProps) {
  const [hasError, setHasError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  
  // Reset error state when youtubeId changes
  useEffect(() => {
    setHasError(false);
    setRetryCount(0);
    setIsLoading(true);
  }, [youtubeId]);
  
  if (!isPlaying) return null;

  const handleIframeError = () => {
    setIsLoading(false);
    if (retryCount < 2) {
      setRetryCount(prev => prev + 1);
      // Reset error to trigger retry
      setTimeout(() => setHasError(false), 1000);
    } else {
      setHasError(true);
    }
  };

  const handleIframeLoad = () => {
    setIsLoading(false);
    setHasError(false);
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: -10,
        overflow: 'hidden',
        pointerEvents: 'none'
      }}
    >
      {!hasError ? (
        <iframe
          key={`simple-video-${youtubeId}-${retryCount}`}
          src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&mute=1&controls=0&showinfo=0&rel=0&modestbranding=1&loop=1&playlist=${youtubeId}&iv_load_policy=3&fs=0&cc_load_policy=0&playsinline=1&disablekb=1&start=0&enablejsapi=1`}
          title="Background Video"
          frameBorder="0"
          allow="autoplay; encrypted-media"
          onError={handleIframeError}
          onLoad={handleIframeLoad}
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: '200vw',
            height: '200vh',
            transform: 'translate(-50%, -50%)',
            border: 'none',
            outline: 'none',
            pointerEvents: 'none',
            filter: 'blur(20px) brightness(0.5) contrast(1.2)',
            opacity: isLoading ? 0.3 : 0.7,
            transition: 'opacity 1s ease-in-out'
          }}
        />
      ) : (
        /* Fallback gradient when video fails to load */
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'linear-gradient(45deg, #000000 0%, #1a1a1a 25%, #000000 50%, #0d0d0d 75%, #000000 100%)',
            backgroundSize: '400% 400%',
            animation: 'gradientShift 15s ease infinite',
            opacity: 0.7
          }}
        />
      )}
      
      {/* Subtle overlay for better contrast */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'rgba(0, 0, 0, 0.2)',
          pointerEvents: 'none'
        }}
      />
    </div>
  );
}