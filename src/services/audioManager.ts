let currentAudio: HTMLAudioElement | null = null;

export const AudioManager = {
  stopAll() {
    if (currentAudio) {
      try {
        currentAudio.pause();
        currentAudio.currentTime = 0;
      } catch {
        // ignore
      }
      currentAudio = null;
    }

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // ignore
      }
    }
  },

  async playFromUrl(url: string): Promise<HTMLAudioElement> {
    this.stopAll();
    const audio = new Audio(url);
    currentAudio = audio;
    await audio.play();
    return audio;
  },
};


