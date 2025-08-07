import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, Music, ChevronUp, ChevronDown } from 'lucide-react';

interface MusicPlayerProps {
  theme: 'light' | 'dark';
  layout?: 'horizontal' | 'vertical';
}

const streams = [
  { name: 'Lofi Hip Hop Radio', url: 'https://www.youtube.com/watch?v=jfKfPfyJRdk' },
  { name: 'Chillhop Radio', url: 'https://www.youtube.com/watch?v=SXySxLgCV-8' },
  { name: 'Jazz Radio', url: 'https://www.youtube.com/watch?v=HuFYqnbVbzY' },
  { name: 'Study Music', url: 'https://www.youtube.com/watch?v=TtkFsfOP9QI' },
  { name: 'Ambient Focus', url: 'https://www.youtube.com/watch?v=28KRPhVzCus' },
  { name: 'Deep Focus', url: 'https://www.youtube.com/watch?v=4xDzrJKXOOY' }
];

function MusicPlayer({ theme, layout = 'vertical' }: MusicPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStream, setCurrentStream] = useState(0);
  const [volume, setVolume] = useState(50);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef<HTMLIFrameElement>(null);

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setVolume(parseInt(e.target.value));
    setIsMuted(false);
  };

  // Remove light background in horizontal layout; keep theme backgrounds in others
  const wrapperBg =
    layout === 'horizontal'
      ? '' // no bg (removes #f3f4f6)
      : theme === 'dark'
        ? 'bg-gray-700'
        : 'bg-gray-100';

  return (
    <div className={`rounded-lg transition-all ${wrapperBg}`}>
      {/* Compact Header */}
      <div className="flex items-center justify-between p-3">
        {/* Left group: swap indicator with Play in horizontal layout */}
        <div className="flex items-center space-x-3">
          {layout === 'horizontal' ? (
            <>
              <div className={`w-2 h-2 rounded-full ${isPlaying ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
              <button
                onClick={togglePlayPause}
                className={`p-2 rounded-lg transition-colors ${
                  theme === 'dark'
                    ? 'hover:bg-gray-600 text-gray-300'
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
              <div className={`w-2 h-2 rounded-full ${isPlaying ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
              <button
                onClick={togglePlayPause}
                className={`p-2 rounded-lg transition-colors ${
                  theme === 'dark'
                    ? 'hover:bg-gray-600 text-gray-300'
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
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className={`p-2 rounded-lg transition-colors ${
              theme === 'dark'
                ? 'hover:bg-gray-600 text-gray-300'
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
        <div className={`px-3 pb-3 border-t ${
          theme === 'dark' ? 'border-gray-600' : 'border-gray-200'
        }`}>
          {/* Stream Selection */}
          <div className="mb-4 pt-3">
            <label className={`block text-xs font-medium mb-2 ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
            }`}>
              STATION
            </label>
            <select
              value={currentStream}
              onChange={(e) => setCurrentStream(parseInt(e.target.value))}
              className={`w-full px-3 py-2 text-sm rounded-md border ${
                theme === 'dark'
                  ? 'bg-gray-600 border-gray-500 text-white'
                  : 'bg-white border-gray-300 text-gray-900'
              } focus:outline-none`}
            >
              {streams.map((stream, index) => (
                <option key={index} value={index}>
                  {stream.name}
                </option>
              ))}
            </select>
          </div>

          {/* Volume Control */}
          <div>
            <label className={`block text-xs font-medium mb-2 ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
            }`}>
              VOLUME
            </label>
            <div className="flex items-center space-x-3">
              <button
                onClick={toggleMute}
                className={`transition-colors ${
                  theme === 'dark'
                    ? 'hover:text-gray-300 text-gray-400'
                    : 'hover:text-gray-700 text-gray-500'
                }`}
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
                    ? `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${isMuted ? 0 : volume}%, #4b5563 ${isMuted ? 0 : volume}%, #4b5563 100%)`
                    : `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${isMuted ? 0 : volume}%, #d1d5db ${isMuted ? 0 : volume}%, #d1d5db 100%)`
                }}
              />
              
              <span className={`text-xs w-8 text-right ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
              }`}>
                {isMuted ? 0 : volume}
              </span>
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