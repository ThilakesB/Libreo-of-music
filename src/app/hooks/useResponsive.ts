import { useState, useEffect } from 'react';

export function useResponsive() {
  const [windowWidth, setWindowWidth] = useState(
    typeof window !== 'undefined' ? window.innerWidth : 768
  );

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobile = windowWidth < 768;
  const isSmallMobile = windowWidth < 400;

  // Album size: small phones get 130px, regular phones 155px, desktop 200px
  const albumSize = isSmallMobile ? 130 : isMobile ? 155 : 200;

  return { isMobile, isSmallMobile, windowWidth, albumSize };
}