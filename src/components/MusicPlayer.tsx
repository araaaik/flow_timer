import React from 'react';
import { Play, Pause, Volume2, VolumeX, ChevronUp, ChevronDown } from 'lucide-react';
import { useMusicPlayer } from '../hooks/useMusicPlayer';
import { useColorSystemContext } from '../contexts/ColorSystemContext';

interface MusicPlayerProps {
  theme: 'light' | 'dark';
  layout?: 'compact' | 'full';
  cardShadow?: string;
}

// Helper function to get thumbnail for a given stream (custom or YouTube)
const getThumb = (stream: { name: string; url: string; customThumbnail?: string }) => {
  if (stream.customThumbnail) {
    return stream.customThumbnail;
  }
  
  try {
    // Try parsing as URL first
    const url = new URL(stream.url);
    const id = url.searchParams.get('v');
    if (id) {
      return `https://img.youtube.com/vi/${id}/hqdefault.jpg`;
    }
  } catch {
    // Fallback: extract ID from various YouTube URL formats
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
      /v=([^&\n?#]+)/
    ];
    
    for (const pattern of patterns) {
      const match = stream.url.match(pattern);
      if (match && match[1]) {
        return `https://img.youtube.com/vi/${match[1]}/hqdefault.jpg`;
      }
    }
  }
  
  // Return placeholder if no ID found
  return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIwIiBoZWlnaHQ9IjkwIiB2aWV3Qm94PSIwIDAgMTIwIDkwIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8cmVjdCB3aWR0aD0iMTIwIiBoZWlnaHQ9IjkwIiBmaWxsPSIjMzc0MTUxIi8+CjxwYXRoIGQ9Ik00OCA0MEw3MiA1NUw0OCA3MFY0MFoiIGZpbGw9IndoaXRlIi8+Cjwvc3ZnPgo=';
};

function MusicPlayer({ theme, layout = 'full', cardShadow = 'shadow-lg' }: MusicPlayerProps) {
  const {
    isPlaying,
    currentStream,
    volume,
    streams,
    visibleStreams,
    setPlaying,
    setCurrentStream,
    setVolume,
    isMuted,
    setMuted,
    toggleStreamVisibility,
    isStreamHidden
  } = useMusicPlayer();
  
  const colorSystem = useColorSystemContext();
  const [isExpanded, setIsExpanded] = React.useState(false);

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

  // Resolve accent color to HEX for consistent styling (slider, thumb, etc.)
  const accentHex = (() => {
    const allColors = colorSystem.getAllAccentColors();
    const color = allColors.find(c => c.value === accentColor);
    return color?.hexValue || '#3b82f6'; // fallback to blue
  })();


  const togglePlayPause = () => {
    try {
      setPlaying(!isPlaying);
    } catch (error) {
      console.warn('Failed to toggle play/pause:', error);
    }
  };

  const toggleMute = () => {
    try {
      setMuted(!isMuted);
    } catch (error) {
      console.warn('Failed to toggle mute:', error);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setVolume(parseInt(e.target.value));
    } catch (error) {
      console.warn('Failed to change volume:', error);
    }
  };

  // Background depends on layout/theme
  // Compact layout: force pure white card with no outer lighter background (match Timer)
  // Dark theme keeps dark surfaces
  // In compact layout we render inside an outer white card from App.
  // Remove inner border/shadow to avoid a smaller inset panel with thin outline.
  // Use a uniform dark surface to avoid mixed patches (e.g., #374151 bg-gray-700)
  // Prefer bg-gray-800 for all dark surfaces to match other cards
  const wrapperBg =
    layout === 'compact'
      ? (theme === 'dark' ? 'bg-gray-800' : 'bg-white')
      : (theme === 'dark' ? 'bg-gray-800' : 'bg-white');

  return (
    <>
      <style>{`
        .music-accent-indicator {
          background-color: var(--accent-color);
        }
        
        .music-accent-border {
          border-color: var(--accent-color) !important;
        }
        
        .music-accent-overlay {
          background-color: var(--accent-color);
          opacity: 0.2;
        }
        
        .music-accent-badge {
          background-color: var(--accent-color);
          color: white;
        }
      `}</style>
      <div
        className={`${layout === 'compact' ? `rounded-2xl ${cardShadow} p-2` : 'rounded-lg'} transition-colors duration-300 ease-out-smooth overflow-hidden ${wrapperBg}`}
        style={{ 
          '--slider-accent': accentHex, 
          '--accent-hex': accentHex,
          '--accent-color': accentHex,
          '--accent-color-hover': accentHex + 'dd',
        } as React.CSSProperties}
      >
      {/* Compact Header */}
      <div className={`flex items-center justify-between ${layout === 'compact' ? 'px-3 py-2' : 'px-6 py-3'} ${layout === 'compact' ? 'h-10' : ''}`}>
        {/* Left group: indicator or Play in compact layout */}
        <div className={`flex items-center ${layout === 'compact' ? 'space-x-3' : 'space-x-3'}`}>
          {layout === 'compact' ? (
            <>
              <div
                className={`w-2 h-2 rounded-full ${isPlaying ? 'animate-pulse music-accent-indicator' : (theme === 'dark' ? 'bg-gray-400' : 'bg-gray-400')}`}
              />
              <button
                onClick={togglePlayPause}
                className={`p-2 rounded-lg transition-colors duration-300 ease-out-smooth ${
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
                    return accentHex;
                  })(),
                }}
              />
              <button
                onClick={togglePlayPause}
                className={`p-2 rounded-lg transition-colors duration-300 ease-out-smooth ${
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
        
        {/* Right group: controls */}
        <div className={`flex items-center ${layout === 'compact' ? 'space-x-2' : 'space-x-2'}`}>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className={`p-2 rounded-lg transition-colors duration-300 ease-out-smooth ${
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
      <div
        className={`transition-height ${isExpanded ? 'max-h-[32rem] opacity-100' : 'max-h-0 opacity-0'} border-t ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}
        style={{
          '--max-height': '32rem'
        } as React.CSSProperties}
      >
        {isExpanded && (
          <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} ${layout === 'compact' ? 'px-3' : 'px-6'} pt-3 pb-2 animate-slide-in-up overflow-y-auto max-h-[28rem]`}>
            {/* Stream Selection as tiles */}
            <div className="mb-3">
              <div className="flex items-center justify-between mb-2">
                <label className={`text-xs font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                  STATION
                </label>
              </div>
              {layout === 'compact' ? (
                <div className="grid grid-cols-2 gap-2">
                  {visibleStreams.map((stream, index) => {
                    const originalIndex = streams.findIndex(s => s === stream);
                    const active = currentStream === originalIndex;
                    const thumb = getThumb(stream);
                    
                    return (
                      <button
                        key={originalIndex}
                        onClick={() => {
                          try {
                            setCurrentStream(originalIndex);
                          } catch (error) {
                            console.warn('Failed to set current stream:', error);
                          }
                        }}
                        className={`relative overflow-hidden rounded-lg aspect-video transition-colors duration-300 ease-out-smooth border ${
                          active
                            ? 'border-2 music-accent-border'
                            : (theme === 'dark'
                                ? 'border-gray-700 hover:border-gray-600'
                                : 'border-gray-300 hover:border-gray-400')
                        }`}
                        title={stream.name}

                      >
                        <img
                          src={thumb}
                          alt={stream.name}
                          className="w-full h-full object-cover transition-opacity duration-300 ease-out-smooth"
                          loading="lazy"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIwIiBoZWlnaHQ9IjkwIiB2aWV3Qm94PSIwIDAgMTIwIDkwIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8cmVjdCB3aWR0aD0iMTIwIiBoZWlnaHQ9IjkwIiBmaWxsPSIjMzc0MTUxIi8+CjxwYXRoIGQ9Ik00OCA0MEw3MiA1NUw0OCA3MFY0MFoiIGZpbGw9IndoaXRlIi8+Cjwvc3ZnPgo=';
                          }}
                        />
                        {active && (
                          <div className="absolute inset-0 music-accent-overlay" />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                        <div className="absolute bottom-0 left-0 right-0 p-2">
                          <div className="text-xs font-medium text-white drop-shadow">
                            {stream.name}
                          </div>
                        </div>
                        {active && (
                          <div className="absolute top-2 right-2">
                            <div className="px-1.5 py-0.5 text-[10px] rounded music-accent-badge">Active</div>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div
                  className="grid gap-2"
                  style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(88px, 1fr))' }}
                >
                  {visibleStreams.map((stream, index) => {
                    const originalIndex = streams.findIndex(s => s === stream);
                    const active = currentStream === originalIndex;
                    const thumb = getThumb(stream);
                    
                    return (
                      <button
                        key={originalIndex}
                        onClick={() => {
                          try {
                            setCurrentStream(originalIndex);
                          } catch (error) {
                            console.warn('Failed to set current stream:', error);
                          }
                        }}
                        className={`relative overflow-hidden rounded-lg aspect-video transition-colors duration-300 ease-out-smooth border ${
                          active
                            ? 'border-2 music-accent-border'
                            : (theme === 'dark'
                                ? 'border-gray-700 hover:border-gray-600'
                                : 'border-gray-300 hover:border-gray-400')
                        }`}
                        title={stream.name}

                      >
                        <img
                          src={thumb}
                          alt={stream.name}
                          className="w-full h-full object-cover transition-opacity duration-300 ease-out-smooth"
                          loading="lazy"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIwIiBoZWlnaHQ9IjkwIiB2aWV3Qm94PSIwIDAgMTIwIDkwIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8cmVjdCB3aWR0aD0iMTIwIiBoZWlnaHQ9IjkwIiBmaWxsPSIjMzc0MTUxIi8+CjxwYXRoIGQ9Ik00OCA0MEw3MiA1NUw0OCA3MFY0MFoiIGZpbGw9IndoaXRlIi8+Cjwvc3ZnPgo=';
                          }}
                        />
                        {active && (
                          <div className="absolute inset-0 music-accent-overlay" />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                        <div className="absolute bottom-0 left-0 right-0 p-2">
                          <div className="text-xs font-medium text-white drop-shadow">
                            {stream.name}
                          </div>
                        </div>
                        {active && (
                          <div className="absolute top-2 right-2">
                            <div className="px-1.5 py-0.5 text-[10px] rounded music-accent-badge">Active</div>
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
                    className={`transition-colors duration-300 ease-out-smooth ${theme === 'dark' ? 'hover:text-gray-300 text-gray-400' : 'hover:text-gray-700 text-gray-500'}`}
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
                        ? `linear-gradient(to right, ${accentHex} 0%, ${accentHex} ${isMuted ? 0 : volume}%, #374151 ${isMuted ? 0 : volume}%, #374151 100%)`
                        : `linear-gradient(to right, ${accentHex} 0%, ${accentHex} ${isMuted ? 0 : volume}%, #d1d5db ${isMuted ? 0 : volume}%, #d1d5db 100%)`
                    }}
                  />
                  <span className={`text-xs w-8 text-right ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                    {isMuted ? 0 : volume}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        .transition-height {
          transition: max-height 0.3s ease-out-smooth, opacity 0.3s ease-out-smooth;
          overflow: hidden;
        }
        
        /* Custom scrollbar styles */
        .overflow-y-auto::-webkit-scrollbar {
          width: 4px;
        }
        
        .overflow-y-auto::-webkit-scrollbar-track {
          background: transparent;
        }
        
        .overflow-y-auto::-webkit-scrollbar-thumb {
          background: ${theme === 'dark' ? '#4b5563' : '#d1d5db'};
          border-radius: 2px;
        }
        
        .overflow-y-auto::-webkit-scrollbar-thumb:hover {
          background: ${theme === 'dark' ? '#6b7280' : '#9ca3af'};
        }
        
        /* Firefox scrollbar */
        .overflow-y-auto {
          scrollbar-width: thin;
          scrollbar-color: ${theme === 'dark' ? '#4b5563' : '#d1d5db'} transparent;
        }
        
        .slider::-webkit-slider-thumb {
          appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: var(--slider-accent);
          cursor: pointer;
          border: 2px solid white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
          transition: transform 0.3s ease-out-smooth;
        }
        .slider::-webkit-slider-thumb:hover {
          transform: scale(1.1);
        }
        .slider::-moz-range-thumb {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: var(--slider-accent);
          cursor: pointer;
          border: 2px solid white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
          transition: transform 0.3s ease-out-smooth;
        }
        .slider::-moz-range-thumb:hover {
          transform: scale(1.1);
        }
      `}</style>
    </div>
    </>
  );
}

export default MusicPlayer;