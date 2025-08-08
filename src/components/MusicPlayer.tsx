import React from 'react';
import { Play, Pause, Volume2, VolumeX, ChevronUp, ChevronDown, Edit3, Check } from 'lucide-react';
import { useMusicPlayer } from '../hooks/useMusicPlayer';

interface MusicPlayerProps {
  theme: 'light' | 'dark';
  layout?: 'compact' | 'full';
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

function MusicPlayer({ theme, layout = 'full' }: MusicPlayerProps) {
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
  
  const [isExpanded, setIsExpanded] = React.useState(false);
  const [isEditMode, setIsEditMode] = React.useState(false);

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
    const hex: Record<string, string> = {
      blue: '#3b82f6', purple: '#8b5cf6', green: '#266a5b', red: '#ef4444',
      orange: '#f97316', pink: '#ec4899', indigo: '#6366f1', yellow: '#eab308',
      teal: '#14b8a6', cyan: '#06b6d4', lime: '#84cc16', emerald: '#10b981',
      violet: '#8b5cf6', rose: '#f43f5e', slate: '#64748b', black: '#111827'
    };
    return hex[accentColor] ?? '#3b82f6';
  })();


  const togglePlayPause = () => {
    setPlaying(!isPlaying);
  };

  const toggleMute = () => {
    setMuted(!isMuted);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setVolume(parseInt(e.target.value));
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
    <div
      className={`rounded-lg transition-all transition-size overflow-hidden ${wrapperBg} ${layout === 'compact' ? (isExpanded ? '' : 'h-10') : ''}`}
      style={{ ['--slider-accent' as any]: accentHex, ['--accent-hex' as any]: accentHex }}
    >
      {/* Compact Header */}
      <div className={`flex items-center justify-between ${layout === 'compact' ? 'px-3 py-2' : 'px-6 py-3'} ${layout === 'compact' ? 'h-10' : ''}`}>
        {/* Left group: swap indicator with Play in compact layout */}
        <div className={`flex items-center ${layout === 'compact' ? 'space-x-3' : 'space-x-3'}`}>
          {layout === 'compact' ? (
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
        
        {/* Right group: controls (no duplicate indicator in compact layout) */}
        <div className={`flex items-center ${layout === 'compact' ? 'space-x-2' : 'space-x-2'}`}>
          <button
            onClick={() => {
              setIsExpanded(!isExpanded);
              if (isExpanded) setIsEditMode(false); // Exit edit mode when collapsing
            }}
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
      <div
        className={`collapse-container ${isExpanded ? 'expanded' : 'collapsed'} border-t ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}
      >
                 {isExpanded && (
           <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} ${layout === 'compact' ? 'px-3' : 'px-6'} pt-3 pb-2 animate-slide-in-up`}>
            {/* Stream Selection as tiles */}
            <div className="mb-3">
              <div className="flex items-center justify-between mb-2">
                <label className={`text-xs font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                  STATION
                </label>
                <button
                  onClick={() => setIsEditMode(!isEditMode)}
                  className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors ${
                    isEditMode
                      ? `text-white`
                      : (theme === 'dark'
                          ? 'hover:bg-gray-700 text-gray-400 hover:text-gray-300'
                          : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700')
                  }`}
                  style={isEditMode ? { backgroundColor: accentHex } : undefined}
                  title={isEditMode ? 'Done editing' : 'Edit stations'}
                >
                  {isEditMode ? <Check size={12} /> : <Edit3 size={12} />}
                  <span>{isEditMode ? 'Done' : 'Edit'}</span>
                </button>
              </div>
              {layout === 'compact' ? (
                <div className="grid grid-cols-2 gap-2">
                  {(isEditMode ? streams : visibleStreams).map((stream, index) => {
                    // In edit mode, use original index; in normal mode, find original index
                    const originalIndex = isEditMode ? index : streams.findIndex(s => s === stream);
                    const active = currentStream === originalIndex;
                    const hidden = isStreamHidden(originalIndex);
                    const thumb = getThumb(stream.url);
                    
                    return (
                      <button
                        key={originalIndex}
                        onClick={() => isEditMode ? toggleStreamVisibility(originalIndex) : setCurrentStream(originalIndex)}
                        className={`relative group overflow-hidden rounded-lg aspect-video transition border ${
                          isEditMode
                            ? (hidden
                                ? (theme === 'dark' ? 'border-gray-600' : 'border-gray-400')
                                : 'border-2')
                            : (active
                                ? 'border-2'
                                : (theme === 'dark'
                                    ? 'border-gray-700 hover:border-gray-600'
                                    : 'border-gray-300 hover:border-gray-400'))
                        }`}
                        title={isEditMode ? (hidden ? 'Show station' : 'Hide station') : stream.name}
                        style={
                          isEditMode
                            ? (hidden ? undefined : { borderColor: accentHex })
                            : (active ? { borderColor: accentHex } : undefined)
                        }
                      >
                        <img
                          src={thumb}
                          alt={stream.name}
                          className={`w-full h-full object-cover transition-all ${
                            isEditMode && hidden ? 'opacity-50 grayscale' : 'opacity-100'
                          }`}
                          loading="lazy"
                        />
                        {!isEditMode && active && (
                          <div className="absolute inset-0 opacity-20" style={{ backgroundColor: accentHex }} />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                        <div className="absolute bottom-0 left-0 right-0 p-2">
                          <div className="text-xs font-medium text-white drop-shadow">
                            {stream.name}
                          </div>
                        </div>
                        {!isEditMode && active && (
                          <div className="absolute top-2 right-2">
                            <div className="px-1.5 py-0.5 text-[10px] rounded text-white" style={{ backgroundColor: accentHex }}>Active</div>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div
                  className="grid gap-2"
                  style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(88px, 1fr))' }}
                >
                  {(isEditMode ? streams : visibleStreams).map((stream, index) => {
                    // In edit mode, use original index; in normal mode, find original index
                    const originalIndex = isEditMode ? index : streams.findIndex(s => s === stream);
                    const active = currentStream === originalIndex;
                    const hidden = isStreamHidden(originalIndex);
                    const thumb = getThumb(stream.url);
                    
                    return (
                      <button
                        key={originalIndex}
                        onClick={() => isEditMode ? toggleStreamVisibility(originalIndex) : setCurrentStream(originalIndex)}
                        className={`relative group overflow-hidden rounded-lg aspect-video transition border ${
                          isEditMode
                            ? (hidden
                                ? (theme === 'dark' ? 'border-gray-600' : 'border-gray-400')
                                : 'border-2')
                            : (active
                                ? 'border-2'
                                : (theme === 'dark'
                                    ? 'border-gray-700 hover:border-gray-600'
                                    : 'border-gray-300 hover:border-gray-400'))
                        }`}
                        title={isEditMode ? (hidden ? 'Show station' : 'Hide station') : stream.name}
                        style={
                          isEditMode
                            ? (hidden ? undefined : { borderColor: accentHex })
                            : (active ? { borderColor: accentHex } : undefined)
                        }
                      >
                        <img
                          src={thumb}
                          alt={stream.name}
                          className={`w-full h-full object-cover transition-all ${
                            isEditMode && hidden ? 'opacity-50 grayscale' : 'opacity-100'
                          }`}
                          loading="lazy"
                        />
                        {!isEditMode && active && (
                          <div className="absolute inset-0 opacity-20" style={{ backgroundColor: accentHex }} />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                        <div className="absolute bottom-0 left-0 right-0 p-2">
                          <div className="text-xs font-medium text-white drop-shadow">
                            {stream.name}
                          </div>
                        </div>
                        {!isEditMode && active && (
                          <div className="absolute top-2 right-2">
                            <div className="px-1.5 py-0.5 text-[10px] rounded text-white" style={{ backgroundColor: accentHex }}>Active</div>
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
        .slider::-webkit-slider-thumb {
          appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: var(--slider-accent);
          cursor: pointer;
          border: 2px solid white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }
        .slider::-moz-range-thumb {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: var(--slider-accent);
          cursor: pointer;
          border: 2px solid white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }
      `}</style>
    </div>
  );
}

export default MusicPlayer;