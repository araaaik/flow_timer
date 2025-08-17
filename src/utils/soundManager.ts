/**
 * Simple Sound Manager
 * Handles notification sounds and volume control
 */

import { DEFAULTS } from './constants';

export interface NotificationSound {
  id: string;
  name: string;
  filename: string;
  url: string;
}

// Available notification sounds
export const NOTIFICATION_SOUNDS: NotificationSound[] = [
  {
    id: 'default',
    name: 'Default',
    filename: 'default.mp3',
    url: '/sounds/default.mp3'
  },
  {
    id: 'bell',
    name: 'Bell',
    filename: 'bell.mp3', 
    url: '/sounds/bell.mp3'
  },
  {
    id: 'chime',
    name: 'Chime',
    filename: 'chime.mp3',
    url: '/sounds/chime.mp3'
  },
  {
    id: 'ding',
    name: 'Ding',
    filename: 'ding.mp3',
    url: '/sounds/ding.mp3'
  }
];

class SoundManager {
  private currentAudio: HTMLAudioElement | null = null;
  private audioCache = new Map<string, HTMLAudioElement>();

  /**
   * Play notification sound with volume control (optimized with caching)
   */
  async playNotificationSound(soundUrl: string, volume: number = DEFAULTS.SOUND_VOLUME): Promise<void> {
    try {
      // Stop any currently playing sound
      if (this.currentAudio && !this.currentAudio.paused) {
        this.currentAudio.pause();
        this.currentAudio.currentTime = 0;
      }

      // Get or create cached audio element
      let audio = this.audioCache.get(soundUrl);
      if (!audio) {
        audio = new Audio(soundUrl);
        this.audioCache.set(soundUrl, audio);
      }

      // Reset and configure audio
      audio.currentTime = 0;
      audio.volume = Math.max(0, Math.min(1, volume));
      
      this.currentAudio = audio;
      await audio.play();
    } catch (error) {
      console.warn('Failed to play notification sound:', error);
      this.playBeep(volume);
    }
  }

  /**
   * Fallback beep sound using Web Audio API
   */
  private playBeep(volume: number = DEFAULTS.SOUND_VOLUME): void {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = DEFAULTS.BEEP_FREQUENCY;
      oscillator.type = 'sine';
      gainNode.gain.value = volume * DEFAULTS.BEEP_VOLUME;
      
      oscillator.start();
      oscillator.stop(audioContext.currentTime + DEFAULTS.BEEP_DURATION);
    } catch (error) {
      console.warn('Failed to play fallback beep:', error);
    }
  }

  /**
   * Test play a sound
   */
  async testSound(soundUrl: string, volume: number = DEFAULTS.SOUND_VOLUME): Promise<void> {
    return this.playNotificationSound(soundUrl, volume);
  }

  /**
   * Find sound by ID
   */
  findSoundById(soundId: string): NotificationSound | undefined {
    return NOTIFICATION_SOUNDS.find(sound => sound.id === soundId);
  }

  /**
   * Clean up resources
   */
  cleanup(): void {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio = null;
    }
    
    // Clear audio cache
    this.audioCache.forEach(audio => {
      audio.pause();
      audio.src = '';
    });
    this.audioCache.clear();
  }
}

export const soundManager = new SoundManager();