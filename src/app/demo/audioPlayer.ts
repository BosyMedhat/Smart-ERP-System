export type AudioMode = 'speech' | 'mp3';

export interface AudioPlayer {
  play: (text: string, file?: string | null) => Promise<void>;
  stop: () => void;
}

function createSpeechPlayer(): AudioPlayer {
  let currentResolve: (() => void) | null = null;

  const finish = () => {
    if (currentResolve) {
      currentResolve();
      currentResolve = null;
    }
  };

  return {
    play(text: string) {
      return new Promise<void>((resolve) => {
        currentResolve = resolve;

        if (!window.speechSynthesis) {
          resolve();
          return;
        }

        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'ar-SA';
        utterance.rate = 0.86;
        utterance.pitch = 1.05;
        utterance.volume = 1.0;
        utterance.onend = finish;
        utterance.onerror = finish;
        window.speechSynthesis.speak(utterance);
      });
    },
    stop() {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      finish();
    },
  };
}

function createMP3Player(): AudioPlayer {
  let audio: HTMLAudioElement | null = null;
  let currentResolve: (() => void) | null = null;

  const finish = () => {
    if (currentResolve) {
      currentResolve();
      currentResolve = null;
    }
  };

  return {
    play(_text: string, file?: string | null) {
      return new Promise<void>((resolve) => {
        currentResolve = resolve;

        if (!file) {
          resolve();
          return;
        }

        if (audio) {
          audio.pause();
          audio.currentTime = 0;
        }

        audio = new Audio(file);
        audio.onended = finish;
        audio.onerror = finish;
        audio.play().catch(() => finish());
      });
    },
    stop() {
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
        audio = null;
      }
      finish();
    },
  };
}

export function createAudioPlayer(mode: AudioMode): AudioPlayer {
  if (mode === 'mp3') return createMP3Player();
  return createSpeechPlayer();
}

export const demoAudio = createAudioPlayer('speech');
