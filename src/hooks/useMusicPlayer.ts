import { useState, useEffect, useRef } from 'react';

interface MusicState {
  isPlaying: boolean;
  currentStream: number;
  volume: number;
  isMuted: boolean;
}

const streams = [
  { name: 'Lofi Hip Hop Radio', url: 'https://www.youtube.com/watch?v=jfKfPfyJRdk' },
  { name: 'Chillhop Radio', url: 'https://www.youtube.com/watch?v=SXySxLgCV-8' },
  { name: 'Jazz Radio', url: 'https://www.youtube.com/watch?v=HuFYqnbVbzY' },
  { name: 'Study Music', url: 'https://www.youtube.com/watch?v=TtkFsfOP9QI' },
  { name: 'Ambient Focus', url: 'https://www.youtube.com/watch?v=28KRPhVzCus' },
  { name: 'Deep Focus', url: 'https://www.youtube.com/watch?v=4xDzrJKXOOY' }
];

class MusicPlayerManager {
  private static instance: MusicPlayerManager;
  private state: MusicState = {
    isPlaying: false,
    currentStream: 0,
    volume: 50,
    isMuted: false
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
    this.listeners.forEach(listener => listener(this.state));
    this.saveState();
  }

  private saveState() {
    try {
      localStorage.setItem('flow-music-state', JSON.stringify(this.state));
    } catch (error) {
      console.error('Failed to save music state:', error);
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
    if (index >= 0 && index < streams.length && this.state.currentStream !== index) {
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

    const streamUrl = streams[this.state.currentStream].url;
    const videoId = streamUrl.split('v=')[1]?.split('&')[0];
    
    if (!videoId) return;

    const autoplay = this.state.isPlaying && !this.state.isMuted ? 1 : 0;
    const mute = this.state.isMuted || this.state.volume === 0 ? 1 : 0;
    
    const newSrc = `https://www.youtube.com/embed/${videoId}?autoplay=${autoplay}&mute=${mute}&controls=0&modestbranding=1&rel=0&loop=1`;
    
    // Only update src if it actually changed
    if (this.iframeRef.src !== newSrc) {
      this.iframeRef.src = newSrc;
    }
  }

  public getStreams() {
    return streams;
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
    setPlaying: managerRef.current.setPlaying.bind(managerRef.current),
    setCurrentStream: managerRef.current.setCurrentStream.bind(managerRef.current),
    setVolume: managerRef.current.setVolume.bind(managerRef.current),
    setMuted: managerRef.current.setMuted.bind(managerRef.current),
    setIframeRef: managerRef.current.setIframeRef.bind(managerRef.current)
  };
}