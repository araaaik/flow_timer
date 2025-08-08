import React, { useEffect, useRef } from 'react';
import { useMusicPlayer } from '../hooks/useMusicPlayer';

/**
 * GlobalMusicIframe
 * A single hidden iframe that stays mounted for the lifetime of the app.
 * Prevents audio from stopping when UI widgets are hidden or layout changes.
 */
function GlobalMusicIframe() {
  const { setIframeRef } = useMusicPlayer();
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  useEffect(() => {
    setIframeRef(iframeRef.current);
    return () => setIframeRef(null);
  }, [setIframeRef]);

  return (
    <iframe
      ref={iframeRef}
      width="0"
      height="0"
      title="Global YouTube audio"
      style={{ display: 'none' }}
      allow="autoplay; encrypted-media"
    />
  );
}

export default GlobalMusicIframe;



