import { useState, useEffect, useRef } from 'react';

interface MusicState {
  isPlaying: boolean;
  currentStream: number;
  volume: number;
  isMuted: boolean;
  hiddenStreams: number[]; // Array of hidden stream indices
}

interface MusicStream {
  name: string;
  url: string;
  customThumbnail?: string; // Optional custom thumbnail URL
}

const defaultStreams: MusicStream[] = [
  { name: 'Lofi Hip Hop Radio', url: 'https://www.youtube.com/watch?v=jfKfPfyJRdk' },
  { name: 'Chillhop Radio', url: 'https://www.youtube.com/watch?v=SXySxLgCV-8' },
  { name: 'Chill Beats', url: 'https://www.youtube.com/watch?v=xORCbIptqcc' },
  { name: 'Study Vibes', url: 'https://www.youtube.com/watch?v=1oDrJba2PSs' },
  { name: 'Jazz Cafe', url: 'https://www.youtube.com/watch?v=HuFYqnbVbzY' },
  { name: 'Ambient Focus', url: 'https://www.youtube.com/watch?v=P6Segk8cr-c' },
  { name: 'Deep Focus', url: 'https://www.youtube.com/watch?v=TtkFsfOP9QI' },
  { name: 'Cozy Vibes', url: 'https://www.youtube.com/watch?v=28KRPhVzCus' },
  { name: 'Sad Lofi', url: 'https://www.youtube.com/watch?v=4xDzrJKXOOY' },
  { name: 'Rain Sounds', url: 'https://www.youtube.com/watch?v=-OekvEFm1lo' }
];

// Lazy load streams to avoid blocking initial render
let streams: MusicStream[] | null = null;

const getStreams = (): MusicStream[] => {
  if (streams === null) {
    try {
      const saved = localStorage.getItem('flow-music-streams');
      if (saved) {
        const parsed = JSON.parse(saved);
        streams = Array.isArray(parsed) && parsed.length > 0 ? parsed : defaultStreams;
      } else {
        streams = defaultStreams;
      }
    } catch (error) {
      console.error('Failed to load music streams:', error);
      streams = defaultStreams;
    }
  }
  return streams;
};

class MusicPlayerManager {
  private static instance: MusicPlayerManager;
  private state: MusicState = {
    isPlaying: false,
    currentStream: 0,
    volume: 50,
    isMuted: false,
    hiddenStreams: []
  };
  private listeners: Array<(state: MusicState) => void> = [];
  private iframeRef: HTMLIFrameElement | null = null;

  private constructor() {
    // Load state from localStorage
    try {
      const saved = localStorage.getItem('flow-music-state');
      if (saved) {
        this.state = { ...this.state, ...JSON.parse(saved) };
      }
    } catch (error) {
      console.error('Failed to load music state:', error);
    }
  }

  public static getInstance(): MusicPlayerManager {
    if (!MusicPlayerManager.instance) {
      MusicPlayerManager.instance = new MusicPlayerManager();
    }
    return MusicPlayerManager.instance;
  }

  public getState(): MusicState {
    return { ...this.state };
  }

  public subscribe(listener: (state: MusicState) => void): () => void {
    this.listeners.push(listener);
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  private notifyListeners() {
    // Send a fresh copy to trigger React state updates reliably
    this.listeners.forEach(listener => listener({ ...this.state }));
    this.saveState();
  }

  private saveState() {
    try {
      localStorage.setItem('flow-music-state', JSON.stringify(this.state));
    } catch (error) {
      console.error('Failed to save music state:', error);
    }
  }

  private saveStreams() {
    try {
      const currentStreams = getStreams();
      localStorage.setItem('flow-music-streams', JSON.stringify(currentStreams));
    } catch (error) {
      console.error('Failed to save music streams:', error);
    }
  }

  public setPlaying(isPlaying: boolean) {
    if (this.state.isPlaying !== isPlaying) {
      this.state.isPlaying = isPlaying;
      this.updateIframe();
      this.notifyListeners();
    }
  }

  public setCurrentStream(index: number) {
    const currentStreams = getStreams();
    if (index >= 0 && index < currentStreams.length && this.state.currentStream !== index) {
      this.state.currentStream = index;
      this.updateIframe();
      this.notifyListeners();
    }
  }

  public setVolume(volume: number) {
    if (this.state.volume !== volume) {
      this.state.volume = Math.max(0, Math.min(100, volume));
      this.state.isMuted = false;
      this.updateIframe();
      this.notifyListeners();
    }
  }

  public setMuted(isMuted: boolean) {
    if (this.state.isMuted !== isMuted) {
      this.state.isMuted = isMuted;
      this.updateIframe();
      this.notifyListeners();
    }
  }

  public setIframeRef(iframe: HTMLIFrameElement | null) {
    this.iframeRef = iframe;
    this.updateIframe();
  }

  private updateIframe() {
    if (!this.iframeRef) return;

    const currentStreams = getStreams();
    const streamUrl = currentStreams[this.state.currentStream]?.url;
    if (!streamUrl) return;
    
    const videoId = streamUrl.split('v=')[1]?.split('&')[0];
    if (!videoId) return;

    const params = new URLSearchParams({
      autoplay: (this.state.isPlaying && !this.state.isMuted) ? '1' : '0',
      mute: (this.state.isMuted || this.state.volume === 0) ? '1' : '0',
      controls: '0',
      modestbranding: '1',
      rel: '0',
      loop: '1',
      enablejsapi: '1',
      origin: window.location.origin,
    });

    const base = `https://www.youtube.com/embed/${videoId}`;
    const newSrc = `${base}?${params.toString()}`;

    if (this.iframeRef.src !== newSrc) {
      this.iframeRef.src = newSrc;
    }

    // Send commands after a delay to ensure iframe is ready
    setTimeout(() => {
      if (!this.iframeRef || !this.iframeRef.contentWindow) return;

      const playerCommand = (func: string, args: unknown[] = []) => {
        this.iframeRef!.contentWindow!.postMessage(
          JSON.stringify({ event: 'command', func, args }),
          '*'
        );
      };

      if (this.state.isMuted || this.state.volume === 0) {
        playerCommand('mute');
      } else {
        playerCommand('unMute');
      }

      playerCommand('setVolume', [this.state.volume]);

      if (this.state.isPlaying && !this.state.isMuted) {
        playerCommand('playVideo');
      } else {
        playerCommand('pauseVideo');
      }
    }, 1000);
  }

  public getStreams() {
    return getStreams();
  }

  public getVisibleStreams() {
    const currentStreams = getStreams();
    return currentStreams.filter((_, index) => !this.state.hiddenStreams.includes(index));
  }

  public toggleStreamVisibility(index: number) {
    const currentStreams = getStreams();
    if (index < 0 || index >= currentStreams.length) return;
    
    const hiddenStreams = [...this.state.hiddenStreams];
    const hiddenIndex = hiddenStreams.indexOf(index);
    
    if (hiddenIndex > -1) {
      // Show stream
      hiddenStreams.splice(hiddenIndex, 1);
    } else {
      // Hide stream
      hiddenStreams.push(index);
    }
    
    this.state.hiddenStreams = hiddenStreams;
    
    // If current stream is being hidden, switch to first visible stream
    if (hiddenStreams.includes(this.state.currentStream)) {
      const currentStreams = getStreams();
      const visibleStreams = currentStreams
        .map((_, i) => i)
        .filter(i => !hiddenStreams.includes(i));
      
      if (visibleStreams.length > 0) {
        this.state.currentStream = visibleStreams[0];
        this.updateIframe();
      }
    }
    
    this.notifyListeners();
  }

  public isStreamHidden(index: number): boolean {
    return this.state.hiddenStreams.includes(index);
  }

  public addStream(name: string, url: string, customThumbnail?: string) {
    const currentStreams = getStreams();
    currentStreams.push({ name, url, customThumbnail });
    streams = currentStreams; // Update cached reference
    this.saveStreams();
    this.notifyListeners();
  }

  public updateStream(index: number, name: string, url: string, customThumbnail?: string) {
    const currentStreams = getStreams();
    if (index >= 0 && index < currentStreams.length) {
      currentStreams[index] = { name, url, customThumbnail };
      streams = currentStreams; // Update cached reference
      this.saveStreams();
      this.updateIframe();
      this.notifyListeners();
    }
  }

  public updateStreamThumbnail(index: number, customThumbnail?: string) {
    const currentStreams = getStreams();
    if (index >= 0 && index < currentStreams.length) {
      currentStreams[index].customThumbnail = customThumbnail;
      streams = currentStreams; // Update cached reference
      this.saveStreams();
      this.notifyListeners();
    }
  }

  public deleteStream(index: number) {
    const currentStreams = getStreams();
    if (index >= 0 && index < currentStreams.length && currentStreams.length > 1) {
      currentStreams.splice(index, 1);
      streams = currentStreams; // Update cached reference
      
      // Update hidden streams indices
      this.state.hiddenStreams = this.state.hiddenStreams
        .map(hiddenIndex => hiddenIndex > index ? hiddenIndex - 1 : hiddenIndex)
        .filter(hiddenIndex => hiddenIndex < currentStreams.length);
      
      // Update current stream if needed
      if (this.state.currentStream >= currentStreams.length) {
        this.state.currentStream = currentStreams.length - 1;
      } else if (this.state.currentStream > index) {
        this.state.currentStream = this.state.currentStream - 1;
      }
      
      this.saveStreams();
      this.updateIframe();
      this.notifyListeners();
    }
  }
}

export function useMusicPlayer() {
  const [state, setState] = useState<MusicState>(MusicPlayerManager.getInstance().getState());
  const managerRef = useRef(MusicPlayerManager.getInstance());

  useEffect(() => {
    const unsubscribe = managerRef.current.subscribe(setState);
    return unsubscribe;
  }, []);

  return {
    ...state,
    streams: managerRef.current.getStreams(),
    visibleStreams: managerRef.current.getVisibleStreams(),
    setPlaying: managerRef.current.setPlaying.bind(managerRef.current),
    setCurrentStream: managerRef.current.setCurrentStream.bind(managerRef.current),
    setVolume: managerRef.current.setVolume.bind(managerRef.current),
    setMuted: managerRef.current.setMuted.bind(managerRef.current),
    setIframeRef: managerRef.current.setIframeRef.bind(managerRef.current),
    toggleStreamVisibility: managerRef.current.toggleStreamVisibility.bind(managerRef.current),
    isStreamHidden: managerRef.current.isStreamHidden.bind(managerRef.current),
    addStream: managerRef.current.addStream.bind(managerRef.current),
    updateStream: managerRef.current.updateStream.bind(managerRef.current),
    updateStreamThumbnail: managerRef.current.updateStreamThumbnail.bind(managerRef.current),
    deleteStream: managerRef.current.deleteStream.bind(managerRef.current)
  };
}