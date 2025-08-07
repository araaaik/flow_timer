import React, { useRef, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, Music, ChevronUp, ChevronDown } from 'lucide-react';
import { useMusicPlayer } from '../hooks/useMusicPlayer';

interface MusicPlayerProps {
  theme: 'light' | 'dark';
  layout?: 'horizontal' | 'vertical';
}

// Helper to get thumbnail for a given YouTube watch URL (hqdefault)
const getThumb = (watchUrl: string) => {
  try {
    const id = new URL(watchUrl).searchParams.get('v');
    return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : '';
  } catch {
    const id = watchUrl.split('v=')[1] || '';
    return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : '';
  }
};

function MusicPlayer({ theme, layout = 'vertical' }: MusicPlayerProps) {
  const {
    isPlaying,
    currentStream,
    volume,
    streams,
    togglePlayPause,
    setCurrentStream,
    setVolume,
    setIframeRef
  } = useMusicPlayer();
  
  const [isExpanded, setIsExpanded] = React.useState(false);
  const [isMuted, setIsMuted] = React.useState(false);
  const audioRef = useRef<HTMLIFrameElement>(null);

  // Read accentColor from settings to keep component independent of props drilling
  const accentColor = (() => {
    try {
      const raw = window.localStorage.getItem('flow-settings');
      if (!raw) return '';
      const parsed = JSON.parse(raw) as { accentColor?: string };
      return parsed?.accentColor ?? '';
    } catch {
      return '';
    }
  })();

  // Set iframe ref for global state management
  useEffect(() => {
    if (audioRef.current) {
      setIframeRef(audioRef.current);
    }
  }, [setIframeRef]);

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setVolume(parseInt(e.target.value));
    setIsMuted(false);
  };

  // Background depends on layout/theme
  // Horizontal layout: force pure white card with no outer lighter background (match Timer)
  // Dark theme keeps dark surfaces
  // In horizontal layout we render inside an outer white card from App.
  // Remove inner border/shadow to avoid a smaller inset panel with thin outline.
  // Use a uniform dark surface to avoid mixed patches (e.g., #374151 bg-gray-700)
  // Prefer bg-gray-800 for all dark surfaces to match other cards
  const wrapperBg =
    layout === 'horizontal'
      ? (theme === 'dark' ? 'bg-gray-800' : 'bg-white')
      : (theme === 'dark' ? 'bg-gray-800' : 'bg-white');

  return (
    <div className={`rounded-lg transition-all overflow-hidden ${wrapperBg} ${layout === 'horizontal' ? (isExpanded ? '' : 'h-10') : ''}`}>
      {/* Compact Header */}
      <div className={`flex items-center justify-between ${layout === 'horizontal' ? 'px-3 py-2' : 'p-3'} ${layout === 'horizontal' ? 'h-10' : ''}`}>
        {/* Left group: swap indicator with Play in horizontal layout */}
        <div className="flex items-center space-x-3">
          {layout === 'horizontal' ? (
            <>
              <div
                className={`w-2 h-2 rounded-full ${isPlaying ? 'animate-pulse' : ''}`}
                style={{
                  backgroundColor: (() => {
                    if (!isPlaying) return theme === 'dark' ? '#9ca3af' : '#9ca3af'; // gray-400
                    const hex: Record<string, string> = {
                      blue: '#3b82f6', purple: '#8b5cf6', green: '#266a5b', red: '#ef4444',
                      orange: '#f97316', pink: '#ec4899', indigo: '#6366f1', yellow: '#eab308',
                      teal: '#14b8a6', cyan: '#06b6d4', lime: '#84cc16', emerald: '#10b981',
                      violet: '#8b5cf6', rose: '#f43f5e', slate: '#64748b', black: '#111827'
                    };
                    return hex[accentColor] ?? '#3b82f6';
                  })()
                }}
              />
              <button
                onClick={togglePlayPause}
                className={`p-2 rounded-lg transition-colors ${
                  theme === 'dark'
                    ? 'hover:bg-gray-700 text-gray-300'
                    : 'hover:bg-gray-200 text-gray-600'
                }`}
                title={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? <Pause size={16} /> : <Play size={16} />}
              </button>
              <span className={`text-sm font-medium ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
              }`}>
                {streams[currentStream].name}
              </span>
            </>
          ) : (
            <>
              <div
                className={`w-2 h-2 rounded-full ${isPlaying ? 'animate-pulse' : ''}`}
                style={{
                  backgroundColor: (() => {
                    if (!isPlaying) return theme === 'dark' ? '#9ca3af' : '#9ca3af';
                    const hex: Record<string, string> = {
                      blue: '#3b82f6', purple: '#8b5cf6', green: '#266a5b', red: '#ef4444',
                      orange: '#f97316', pink: '#ec4899', indigo: '#6366f1', yellow: '#eab308',
                      teal: '#14b8a6', cyan: '#06b6d4', lime: '#84cc16', emerald: '#10b981',
                      violet: '#8b5cf6', rose: '#f43f5e', slate: '#64748b', black: '#111827'
                    };
                    return hex[accentColor] ?? '#3b82f6';
                  })()
                }}
              />
              <button
                onClick={togglePlayPause}
                className={`p-2 rounded-lg transition-colors ${
                  theme === 'dark'
                    ? 'hover:bg-gray-700 text-gray-300'
                    : 'hover:bg-gray-200 text-gray-600'
                }`}
                title={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? <Pause size={16} /> : <Play size={16} />}
              </button>
              <span className={`text-sm font-medium ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
              }`}>
                {streams[currentStream].name}
              </span>
            </>
          )}
        </div>
        
        {/* Right group: controls (no duplicate indicator in horizontal layout) */}
        <div className={`flex items-center space-x-2 ${layout === 'horizontal' && theme === 'light' ? '' : ''}`}>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className={`p-2 rounded-lg transition-colors ${
              theme === 'dark'
                ? 'hover:bg-gray-700 text-gray-300'
                : 'hover:bg-gray-200 text-gray-600'
            }`}
            title={isExpanded ? 'Collapse' : 'Expand'}
          >
            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
      </div>

      {/* Expanded Controls */}
      {isExpanded && (
        <div
          className={`px-3 pb-2 border-t ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}
        >
          {/* Seamless continuation of the outer card (full width) */}
          <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} -mx-3 px-3 pt-3 pb-2`}>
            {/* Stream Selection as tiles */}
            <div className="mb-3">
              <label className={`block text-xs font-medium mb-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                STATION
              </label>
              {layout === 'horizontal' ? (
                <div className="grid grid-cols-2 gap-2">
                  {streams.map((stream, index) => {
                    const active = currentStream === index;
                    const thumb = getThumb(stream.url);
                    return (
                      <button
                        key={index}
                        onClick={() => setCurrentStream(index)}
                        className={`relative group overflow-hidden rounded-lg border aspect-video transition ${
                          active
                            ? (theme === 'dark'
                                ? 'border-blue-400 ring-1 ring-blue-400'
                                : 'border-blue-500 ring-1 ring-blue-500')
                            : (theme === 'dark'
                                ? 'border-gray-700 hover:border-gray-600'
                                : 'border-gray-300 hover:border-gray-400')
                        }`}
                        title={stream.name}
                      >
                        <img
                          src={thumb}
                          alt={stream.name}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                        <div className="absolute bottom-0 left-0 right-0 p-2">
                          <div className="text-xs font-medium text-white drop-shadow">
                            {stream.name}
                          </div>
                        </div>
                        {active && (
                          <div className="absolute top-2 right-2">
                            <div className="px-1.5 py-0.5 text-[10px] rounded bg-blue-500 text-white">Active</div>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div
                  className="grid gap-2"
                  style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))' }}
                >
                  {streams.map((stream, index) => {
                    const active = currentStream === index;
                    const thumb = getThumb(stream.url);
                    return (
                      <button
                        key={index}
                        onClick={() => setCurrentStream(index)}
                        className={`relative group overflow-hidden rounded-lg border aspect-video transition ${
                          active
                            ? (theme === 'dark'
                                ? 'border-blue-400 ring-1 ring-blue-400'
                                : 'border-blue-500 ring-1 ring-blue-500')
                            : (theme === 'dark'
                                ? 'border-gray-700 hover:border-gray-600'
                                : 'border-gray-300 hover:border-gray-400')
                        }`}
                        title={stream.name}
                      >
                        <img
                          src={thumb}
                          alt={stream.name}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                        <div className="absolute bottom-0 left-0 right-0 p-2">
                          <div className="text-xs font-medium text-white drop-shadow">
                            {stream.name}
                          </div>
                        </div>
                        {active && (
                          <div className="absolute top-2 right-2">
                            <div className="px-1.5 py-0.5 text-[10px] rounded bg-blue-500 text-white">Active</div>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
              {/* Volume Control */}
              <div className="mt-4">
                <label className={`block text-xs font-medium mb-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                  VOLUME
                </label>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={toggleMute}
                    className={`transition-colors ${theme === 'dark' ? 'hover:text-gray-300 text-gray-400' : 'hover:text-gray-700 text-gray-500'}`}
                  >
                    {isMuted || volume === 0 ? <VolumeX size={16} /> : <Volume2 size={16} />}
                  </button>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={isMuted ? 0 : volume}
                    onChange={handleVolumeChange}
                    className="flex-1 h-2 rounded-lg appearance-none cursor-pointer focus:outline-none slider"
                    style={{
                      background: theme === 'dark'
                        ? `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${isMuted ? 0 : volume}%, #374151 ${isMuted ? 0 : volume}%, #374151 100%)`
                        : `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${isMuted ? 0 : volume}%, #d1d5db ${isMuted ? 0 : volume}%, #d1d5db 100%)`
                    }}
                  />
                  <span className={`text-xs w-8 text-right ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                    {isMuted ? 0 : volume}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hidden iframe for YouTube playback (would need proper implementation) */}
      <iframe
        ref={audioRef}
        src={`https://www.youtube.com/embed/${streams[currentStream].url.split('v=')[1]}?autoplay=${isPlaying ? 1 : 0}&controls=0&modestbranding=1&rel=0`}
        width="0"
        height="0"
        allow="autoplay"
        style={{ display: 'none' }}
        title="YouTube audio"
      />

      <style>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          border: 2px solid white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }
        .slider::-moz-range-thumb {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          border: 2px solid white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }
      `}</style>
    </div>
  );
}

export default MusicPlayer;