import React, { useMemo, useRef, useState, useEffect } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Image } from '@react-three/drei';
import { CONFIG } from '../constants';

interface PhotoAlbumProps {
  images: string[];
  progress: number; // 0 = Scattered, 1 = Tree
}

export const PhotoAlbum: React.FC<PhotoAlbumProps> = ({ images, progress }) => {
  const groupRef = useRef<THREE.Group>(null);
  
  // Generate positions for photos
  const photoData = useMemo(() => {
    return images.map((url, i) => {
      // Tree Position: Spiral around the cone
      const totalPhotos = images.length;
      const yNorm = i / totalPhotos; // 0 to 1
      const height = CONFIG.TREE_HEIGHT;
      const radiusAtHeight = (1 - yNorm) * CONFIG.TREE_RADIUS * 1.2; // Slightly outside ornaments
      
      const angle = yNorm * Math.PI * 10; // 5 spirals
      const x = Math.cos(angle) * radiusAtHeight;
      const z = Math.sin(angle) * radiusAtHeight;
      const y = (yNorm * height) - (height / 2);

      // Scatter Position
      const r = height * 0.8;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos((Math.random() * 2) - 1);
      const sx = r * Math.sin(phi) * Math.cos(theta);
      const sy = r * Math.sin(phi) * Math.sin(theta);
      const sz = r * Math.cos(phi);

      return {
        id: i,
        url,
        treePos: new THREE.Vector3(x, y, z),
        scatterPos: new THREE.Vector3(sx, sy, sz),
        rotation: new THREE.Euler(0, -angle, 0) // Face outward
      };
    });
  }, [images]);

  useFrame((state, delta) => {
    if (!groupRef.current) return;
    
    // Animate each photo group
    groupRef.current.children.forEach((child, i) => {
      const data = photoData[i];
      if (!data) return;

      const target = new THREE.Vector3().lerpVectors(
        data.scatterPos,
        data.treePos,
        progress
      );

      // Smooth damp
      child.position.lerp(target, 0.05);

      // Rotation logic
      if (progress > 0.8) {
        // Look away from center (standard tree orientation)
        const lookAtPos = new THREE.Vector3(0, child.position.y, 0);
        child.lookAt(lookAtPos);
        // Flip to face outward
        child.rotateY(Math.PI); 
      } else {
        // Tumble when scattered
        child.rotation.x += delta * 0.2;
        child.rotation.y += delta * 0.1;
      }
    });
  });

  if (images.length === 0) return null;

  return (
    <group ref={groupRef}>
      {photoData.map((data, i) => (
        <group key={i} position={[data.scatterPos.x, data.scatterPos.y, data.scatterPos.z]}>
          {/* Gold Frame */}
          <mesh position={[0, 0, -0.01]}>
            <boxGeometry args={[1.2, 1.5, 0.05]} />
            <meshStandardMaterial 
              color="#FFD700" 
              metalness={1} 
              roughness={0.2} 
            />
          </mesh>
          
          {/* Photo */}
          <Image 
            url={data.url} 
            scale={[1, 1]} 
            position={[0, 0.1, 0.03]}
            transparent
            opacity={1}
          />
          
          {/* "Polaroid" Text area */}
          <mesh position={[0, -0.6, 0.03]}>
             <planeGeometry args={[1, 0.2]} />
             <meshBasicMaterial color="#FFF8E7" />
          </mesh>
        </group>
      ))}
    </group>
  );
};