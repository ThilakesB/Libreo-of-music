import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

interface BackgroundVideoProps {
  youtubeId: string;
  isPlaying: boolean;
}

export function BackgroundVideo({ youtubeId, isPlaying }: BackgroundVideoProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (isPlaying) {
      // Create a container element that gets appended directly to body
      const container = document.createElement('div');
      container.id = 'background-video-portal';
      container.style.cssText = `
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
        width: 100vw !important;
        height: 100vh !important;
        z-index: -1000 !important;
        overflow: hidden !important;
        pointer-events: none !important;
        background: black !important;
      `;
      
      // Append directly to body to bypass any container restrictions
      document.body.appendChild(container);
      containerRef.current = container;

      // Cleanup function
      return () => {
        if (containerRef.current && document.body.contains(containerRef.current)) {
          document.body.removeChild(containerRef.current);
        }
      };
    } else {
      // Remove container when not playing
      if (containerRef.current && document.body.contains(containerRef.current)) {
        document.body.removeChild(containerRef.current);
        containerRef.current = null;
      }
    }
  }, [isPlaying, youtubeId]);

  // Only render if playing and container exists
  if (!isPlaying || !containerRef.current) {
    return null;
  }

  return createPortal(
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        overflow: 'hidden'
      }}
    >
      {/* YouTube iframe */}
      <iframe
        src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&mute=0&controls=0&showinfo=0&rel=0&modestbranding=1&loop=1&playlist=${youtubeId}&iv_load_policy=3&fs=0&cc_load_policy=0&playsinline=1&disablekb=1`}
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          width: '133.33vw', // 4/3 aspect ratio coverage
          height: '177.78vh', // Ensure full coverage
          minWidth: '133.33vw',
          minHeight: '177.78vh',
          transform: 'translate(-50%, -50%)',
          border: 'none',
          outline: 'none',
          pointerEvents: 'none',
          filter: 'blur(3px) brightness(0.4) contrast(1.2) saturate(0.7)',
          opacity: 0.7
        }}
        frameBorder="0"
        allow="autoplay; encrypted-media"
        allowFullScreen={false}
        title="Background Video"
      />
      
      {/* Dark overlay */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'rgba(0, 0, 0, 0.5)',
          pointerEvents: 'none'
        }}
      />
      
      {/* Radial gradient overlay */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'radial-gradient(ellipse at center, transparent 15%, rgba(0,0,0,0.4) 80%)',
          pointerEvents: 'none'
        }}
      />
    </div>,
    containerRef.current
  );
}