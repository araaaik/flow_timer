/**
 * Simple Sound Manager
 * Handles notification sounds and volume control
 */

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

  /**
   * Play notification sound with volume control
   */
  async playNotificationSound(soundUrl: string, volume: number = 0.5): Promise<void> {
    try {
      // Stop any currently playing sound
      if (this.currentAudio) {
        this.currentAudio.pause();
        this.currentAudio.currentTime = 0;
      }

      // Create new audio element
      this.currentAudio = new Audio(soundUrl);
      this.currentAudio.volume = Math.max(0, Math.min(1, volume));
      
      // Play the sound
      await this.currentAudio.play();
    } catch (error) {
      console.warn('Failed to play notification sound:', error);
      // Fallback to generated beep if file not found
      this.playBeep(volume);
    }
  }

  /**
   * Fallback beep sound using Web Audio API
   */
  private playBeep(volume: number = 0.5): void {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = 800;
      oscillator.type = 'sine';
      gainNode.gain.value = volume * 0.3;
      
      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.3);
    } catch (error) {
      console.warn('Failed to play fallback beep:', error);
    }
  }

  /**
   * Test play a sound
   */
  async testSound(soundUrl: string, volume: number = 0.5): Promise<void> {
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
  }
}

export const soundManager = new SoundManager();