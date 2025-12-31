'use client';

import { useState, useRef, useEffect } from 'react';
import Draggable from 'react-draggable';
import { Music, Pause } from 'lucide-react';

const MUSIC_URL = '/music.mp3';

const MusicPlayer = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const nodeRef = useRef(null);

  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio(MUSIC_URL);
      audioRef.current.loop = true;
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
    <Draggable nodeRef={nodeRef}>
      <div ref={nodeRef} className="fixed bottom-5 right-5 z-50 cursor-move">
        <button
          onClick={togglePlay}
          className={`relative w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg
            ${isPlaying
              ? 'bg-primary text-primary-foreground scale-105'
              : 'bg-card text-card-foreground border hover:scale-105'
            }`}
          aria-label={isPlaying ? 'Pause music' : 'Play music'}
        >
          {isPlaying && (
            <div className="absolute inset-0 rounded-full bg-primary opacity-50 animate-pulse"></div>
          )}

          <div className="relative z-10">
            {isPlaying ? <Pause size={24} /> : <Music size={24} />}
          </div>
        </button>
      </div>
    </Draggable>
  );
};

export default MusicPlayer;
