import React, { useState, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { Scene } from './components/Scene';
import { AudioPlayer } from './components/AudioPlayer';
import { TreeMorphState } from './types';
import * as THREE from 'three';

const App: React.FC = () => {
  const [treeState, setTreeState] = useState<TreeMorphState>(TreeMorphState.SCATTERED);

  const toggleState = useCallback(() => {
    setTreeState(prev => 
      prev === TreeMorphState.TREE_SHAPE 
        ? TreeMorphState.SCATTERED 
        : TreeMorphState.TREE_SHAPE
    );
  }, []);

  return (
    <div className="relative w-full h-screen bg-[#000502] text-white overflow-hidden">
      {/* Audio Player Control */}
      <AudioPlayer />
      
      {/* Est. 2025 Label - Positioned below Audio Player with spacing */}
      <div className="fixed top-24 right-6 z-40 hidden md:flex flex-col items-end pointer-events-none animate-fade-in-down">
         <span className="font-['Cinzel'] text-xs text-[#C5A059] border border-[#C5A059]/30 px-3 py-1 rounded-full bg-black/20 backdrop-blur-sm shadow-[0_0_15px_rgba(197,160,89,0.1)]">
           Est. 2025
         </span>
      </div>

      {/* 3D Canvas */}
      <Canvas
        dpr={[1, 2]}
        gl={{ 
          antialias: false,
          toneMapping: THREE.ReinhardToneMapping,
          toneMappingExposure: 1.5
        }}
        shadows
      >
        {/* Fog to blend floor into nothingness */}
        <fog attach="fog" args={['#000502', 10, 50]} />
        <Scene treeState={treeState} />
      </Canvas>

      {/* UI Overlay */}
      <main className="absolute inset-0 pointer-events-none flex flex-col justify-between p-8 md:p-16 z-10">
        
        {/* Header */}
        <header className="flex justify-between items-start animate-fade-in-down">
          <div>
            <h1 className="font-['Cinzel'] text-3xl md:text-5xl text-[#C5A059] tracking-widest uppercase drop-shadow-lg">
              PAIGE
            </h1>
            <h2 className="font-['Playfair_Display'] text-sm md:text-lg text-emerald-200/80 italic tracking-wide mt-2">
              Signature Collection
            </h2>
          </div>
          {/* Previous location of Est. 2025 removed from here */}
        </header>

        {/* Footer Controls */}
        <footer className="flex flex-col items-center pointer-events-auto gap-6 animate-fade-in-up">
          <p className="font-['Playfair_Display'] text-white/60 italic text-center max-w-md text-sm md:text-base">
            "Experience the convergence of luxury and technology. 
            Summon the spirit of the season."
          </p>

          <button
            onClick={toggleState}
            className={`
              relative group overflow-hidden px-10 py-4 
              border border-[#C5A059] transition-all duration-700 ease-out
              ${treeState === TreeMorphState.TREE_SHAPE ? 'bg-[#C5A059]/10' : 'bg-transparent'}
              hover:bg-[#C5A059]/20 hover:border-[#FFD700] hover:shadow-[0_0_30px_rgba(197,160,89,0.3)]
            `}
          >
            {/* Button Inner Text */}
            <span className="relative z-10 font-['Cinzel'] text-sm md:text-lg tracking-[0.2em] text-[#FFD700] group-hover:text-white transition-colors duration-300">
              {treeState === TreeMorphState.TREE_SHAPE ? 'SCATTER ESSENCE' : 'ASSEMBLE TREE'}
            </span>
            
            {/* Shine Effect */}
            <div className="absolute top-0 -left-[100%] w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12 group-hover:animate-shine" />
          </button>

          <div className="h-px w-24 bg-gradient-to-r from-transparent via-[#C5A059]/50 to-transparent mt-4" />
        </footer>
      </main>

      {/* Overlay Vignette CSS */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,5,2,0.6)_100%)]" />
      
      {/* Tailwind Animations */}
      <style>{`
        @keyframes shine {
          0% { left: -100%; }
          100% { left: 200%; }
        }
        .animate-shine {
          animation: shine 1.5s infinite linear;
        }
        .animate-fade-in-down {
          animation: fadeInDown 1.5s ease-out forwards;
        }
        .animate-fade-in-up {
          animation: fadeInUp 1.5s ease-out forwards;
        }
        @keyframes fadeInDown {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default App;