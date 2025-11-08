// src/components/AudioButton.tsx
import { toggleBackgroundMusic, initSounds, isBgmPlaying } from '../../lib/sound';
import { Volume2, VolumeX } from 'lucide-react';
import { useState, useEffect } from 'react';

export function AudioButton() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);

  useEffect(() => {
    initSounds();
    // Always start BGM on mount (regardless of refresh)
    setHasStarted(true);
    setIsPlaying(true);
  }, []);

  const handleClick = () => {
    // Only toggle BGM, don't touch intro or SFX
    toggleBackgroundMusic();
    setIsPlaying(isBgmPlaying());
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className="fixed top-4 right-4 z-50 p-3 bg-black/50 hover:bg-black/70 rounded-full transition-colors"
      aria-label={isPlaying ? "Mute audio" : "Play audio"}
    >
      {isPlaying ? (
        <Volume2 className="w-6 h-6 text-white" />
      ) : (
        <VolumeX className="w-6 h-6 text-white" />
      )}
    </button>
  );
}