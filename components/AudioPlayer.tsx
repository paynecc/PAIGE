import React, { useState, useRef } from 'react';

export const AudioPlayer: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  const togglePlay = () => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(e => {
        console.warn("Autoplay prevented:", e);
      });
    }
    setIsPlaying(!isPlaying);
  };

  return (
    <>
      <audio 
        ref={audioRef} 
        src="https://upload.wikimedia.org/wikipedia/commons/6/61/Silent_Night_piano.ogg" 
        loop 
      />
      
      <button 
        onClick={togglePlay}
        className="fixed top-6 right-6 z-50 group flex items-center gap-2 px-4 py-2 
                   border border-[#C5A059]/30 rounded-full transition-all duration-300
                   hover:bg-[#C5A059]/10 hover:border-[#FFD700] bg-black/20 backdrop-blur-sm"
        aria-label={isPlaying ? "Mute Music" : "Play Music"}
      >
        <span className="hidden md:block font-['Cinzel'] text-xs text-[#C5A059] group-hover:text-[#FFD700] tracking-widest">
          {isPlaying ? "SILENT NIGHT" : "PLAY MUSIC"}
        </span>
        
        {isPlaying ? (
          // Playing Icon
          <svg className="w-5 h-5 text-[#FFD700] animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
          </svg>
        ) : (
          // Muted Icon
          <svg className="w-5 h-5 text-[#C5A059] group-hover:text-[#FFD700]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.25 9.75L19.5 12m0 0l2.25 2.25M19.5 12l2.25-2.25M19.5 12l-2.25 2.25m-10.5-6l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H6.31c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 014.05 12c0-.83.112-1.633.322-2.396C4.606 8.756 5.43 8.25 6.31 8.25H9.75z" />
          </svg>
        )}
      </button>
    </>
  );
};
