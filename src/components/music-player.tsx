'use client';

import { useState, useRef, useEffect } from 'react';
import Draggable, { DraggableEvent, DraggableData } from 'react-draggable';
import { Music, Pause } from 'lucide-react';

const MUSIC_URL = '/music.mp3';

// Create a single audio instance to be reused.
let audio: HTMLAudioElement | null = null;

const MusicPlayer = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isAudioInitialized, setIsAudioInitialized] = useState(false);
  const nodeRef = useRef(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // This effect will run once to set up the audio listeners if the audio object is ever created.
  useEffect(() => {
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);

    if (isAudioInitialized && audio) {
      audio.addEventListener('play', onPlay);
      audio.addEventListener('pause', onPause);
    }

    return () => {
      if (audio) {
        audio.removeEventListener('play', onPlay);
        audio.removeEventListener('pause', onPause);
      }
    };
  }, [isAudioInitialized]);

  const handleDragStart = (e: DraggableEvent, data: DraggableData) => {
    setDragStart({ x: data.x, y: data.y });
  };

  const handleDragStop = (e: DraggableEvent, data: DraggableData) => {
    const distance = Math.sqrt(Math.pow(data.x - dragStart.x, 2) + Math.pow(data.y - dragStart.y, 2));

    if (distance < 10) { // Treat as a tap if moved less than 10px
      togglePlay();
    }
  };

  const togglePlay = () => {
    // On first tap, create and play the audio.
    if (!audio) {
      audio = new Audio(MUSIC_URL);
      audio.loop = true;
      setIsAudioInitialized(true); // This will trigger the useEffect to add listeners.

      audio.play().catch(error => {
        console.error("Audio failed to play on initialization:", error);
      });
    } else {
      // On subsequent taps, just toggle.
      if (audio.paused) {
        audio.play().catch(error => console.error("Audio failed to play:", error));
      } else {
        audio.pause();
      }
    }
  };

  return (
    <Draggable
      nodeRef={nodeRef}
      onStart={handleDragStart}
      onStop={handleDragStop}
    >
      <div ref={nodeRef} className="fixed bottom-5 right-5 z-50 cursor-move">
        <div
          role="button"
          aria-label={isPlaying ? 'Pause music' : 'Play music'}
          className={`relative w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg
            ${isPlaying
              ? 'bg-primary text-primary-foreground scale-105'
              : 'bg-card text-card-foreground border hover:scale-105'
            }`}
        >
          {isPlaying && (
            <div className="absolute inset-0 rounded-full bg-primary opacity-50 animate-pulse"></div>
          )}
          <div className="relative z-10">
            {isPlaying ? <Pause size={24} /> : <Music size={24} />}
          </div>
        </div>
      </div>
    </Draggable>
  );
};

export default MusicPlayer;
