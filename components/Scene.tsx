import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Environment, PerspectiveCamera, OrbitControls, Stars, Sparkles } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette, Noise } from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';
import * as THREE from 'three';
import { Foliage } from './Foliage';
import { Ornaments } from './Ornaments';
import { TreeMorphState } from '../types';

interface SceneProps {
  treeState: TreeMorphState;
  userImage: string | null;
}

export const Scene: React.FC<SceneProps> = ({ treeState, userImage }) => {
  const groupRef = useRef<THREE.Group>(null);
  
  // 0 = Scattered, 1 = Tree
  const targetProgress = treeState === TreeMorphState.TREE_SHAPE ? 1 : 0;

  useFrame((state) => {
    if (groupRef.current) {
      // Slow rotation of the whole group for cinematic feel
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.05;
    }
  });

  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 2, 22]} fov={45} />
      <OrbitControls 
        enablePan={false} 
        minPolarAngle={Math.PI / 4} 
        maxPolarAngle={Math.PI / 2}
        minDistance={10}
        maxDistance={35} // Reduced max distance as the cloud is tighter
        autoRotate={false} 
        autoRotateSpeed={0.5}
      />

      {/* Lighting */}
      <ambientLight intensity={0.2} color="#001a0f" />
      <spotLight 
        position={[10, 20, 10]} 
        angle={0.5} 
        penumbra={1} 
        intensity={200} 
        color="#fff5cc" 
        castShadow 
      />
      <pointLight position={[-10, 5, -10]} intensity={50} color="#ffaa00" />
      <pointLight position={[0, -10, 0]} intensity={20} color="#00ff88" distance={20} />

      {/* Environment for Reflections */}
      <Environment preset="city" />

      {/* Scene Content */}
      <group ref={groupRef} position={[0, -2, 0]}>
        <Foliage progress={targetProgress} userImage={userImage} />
        <Ornaments progress={targetProgress} />
        
        {/* Extra Ambient Sparkles */}
        <Sparkles 
          count={200} 
          scale={12} // Reduced scale to match tighter tree
          size={4} 
          speed={0.4} 
          opacity={0.5} 
          color="#FFD700" 
        />
      </group>

      {/* Background Atmosphere */}
      <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />

      {/* Post Processing */}
      <EffectComposer disableNormalPass>
        <Bloom 
          luminanceThreshold={0.8} 
          mipmapBlur 
          intensity={1.5} 
          radius={0.6}
        />
        <Noise opacity={0.05} blendFunction={BlendFunction.OVERLAY} />
        <Vignette eskil={false} offset={0.1} darkness={1.1} />
      </EffectComposer>
    </>
  );
};