'use client';

import { useState, useRef, useEffect } from 'react';
import { Music, Pause } from 'lucide-react';

// --- CONFIGURATION ---
// You can replace this URL with your actual music file
const MUSIC_URL = '/music.mp3'; 

const MusicPlayer = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Create a single Audio object and reuse it
  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio(MUSIC_URL);
      audioRef.current.loop = true; // Loop the music
    }
  }, []);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play().catch(error => console.error("Audio play failed:", error));
      }
      setIsPlaying(!isPlaying);
    }
  };

  return (
    <div className="fixed bottom-5 right-5 z-50">
      <button
        onClick={togglePlay}
        className={`relative w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg
          ${isPlaying 
            ? 'bg-primary text-primary-foreground scale-105' 
            : 'bg-card text-card-foreground border hover:scale-105'
          }`}
        aria-label={isPlaying ? 'Pause music' : 'Play music'}
      >
        {/* Pulsing animation when playing */}
        {isPlaying && (
          <div className="absolute inset-0 rounded-full bg-primary opacity-50 animate-pulse"></div>
        )}

        {/* Icon */}
        <div className="relative z-10">
          {isPlaying ? <Pause size={24} /> : <Music size={24} />}
        </div>
      </button>
    </div>
  );
};

export default MusicPlayer;
