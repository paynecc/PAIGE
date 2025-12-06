import React, { useMemo, useRef, useEffect } from 'react';
import * as THREE from 'three';
import { useFrame, useLoader } from '@react-three/fiber';
import { generateFoliage } from '../utils/math';
import { CONFIG } from '../constants';

// High-Performance Vertex Shader
const vertexShader = `
  uniform float uTime;
  uniform float uProgress; // 0 = Scattered, 1 = Tree
  
  attribute vec3 aScatterPosition;
  attribute float aRandom;
  attribute vec2 aUv;
  
  varying vec3 vColor;
  varying float vAlpha;
  varying vec2 vUv;

  // Cubic Bezier Ease-InOut function for smoother transition
  float easeInOutCubic(float x) {
    return x < 0.5 ? 4.0 * x * x * x : 1.0 - pow(-2.0 * x + 2.0, 3.0) / 2.0;
  }

  void main() {
    vColor = color;
    vUv = aUv;
    
    // Non-linear progress for organic feel
    float t = easeInOutCubic(uProgress);
    
    // Mix between Scatter Position and Tree Position
    vec3 targetPos = mix(aScatterPosition, position, t);
    
    // --- WIND & NOISE EFFECT ---
    
    // 1. Random jitter/noise (Reduced amplitude for "Sand Gathering" effect)
    float noiseAmp = mix(0.5, 0.05, t); // Was 1.5 -> 0.1
    float timeSpeed = mix(0.5, 1.0, t);
    
    vec3 noise = vec3(
      sin(uTime * timeSpeed + aRandom * 10.0),
      cos(uTime * timeSpeed * 0.8 + aRandom * 15.0),
      sin(uTime * timeSpeed * 1.2 + aRandom * 5.0)
    ) * noiseAmp * 0.2; 
    
    // 2. Coherent Wind Sway
    // Only active when scattered or loosely formed
    float windStrength = mix(0.8, 0.0, t * 1.2); // Reduced from 1.0
    
    // Large sine wave moving across space
    float windWave = sin(uTime * 0.5 + targetPos.x * 0.2 + targetPos.y * 0.1);
    
    // Directional push based on the wave
    vec3 windDir = vec3(0.5, 0.1, 0.2); 
    vec3 windOffset = windDir * windWave * windStrength; 

    vec3 finalPos = targetPos + noise + windOffset;

    vec4 mvPosition = modelViewMatrix * vec4(finalPos, 1.0);
    gl_Position = projectionMatrix * mvPosition;

    // Size attenuation
    float size = 12.0 * (10.0 / -mvPosition.z);
    gl_PointSize = size;
    
    // Fade in/out logic
    vAlpha = 0.6 + 0.4 * sin(uTime * 2.0 + aRandom * 10.0);
  }
`;

// Fragment Shader
const fragmentShader = `
  varying vec3 vColor;
  varying float vAlpha;
  varying vec2 vUv;
  
  uniform sampler2D uTexture;
  uniform bool uUseTexture;

  void main() {
    // Circular particle
    vec2 cxy = 2.0 * gl_PointCoord - 1.0;
    float r = dot(cxy, cxy);
    if (r > 1.0) discard;

    // Soft glow edge
    float glow = 1.0 - r;
    glow = pow(glow, 1.5);
    
    vec3 finalColor = vColor;
    if (uUseTexture) {
        vec3 texColor = texture2D(uTexture, vUv).rgb;
        // If texture is active, rely mostly on texture color, but keep a tiny bit of original glitter
        finalColor = mix(vColor * 0.5, texColor, 0.85); 
    }

    gl_FragColor = vec4(finalColor, vAlpha * glow);
  }
`;

interface FoliageProps {
  progress: number;
  userImage: string | null;
}

export const Foliage: React.FC<FoliageProps> = ({ progress, userImage }) => {
  const shaderRef = useRef<THREE.ShaderMaterial>(null);
  
  // Memoize data generation
  const { positions, scatterPositions, randoms, colors } = useMemo(() => 
    generateFoliage(CONFIG.PARTICLE_COUNT, CONFIG.TREE_HEIGHT, CONFIG.TREE_RADIUS), 
  []);
  
  // UV Calculation for texture mapping (Cylindrical)
  const uvs = useMemo(() => {
    const uvArray = new Float32Array((positions.length / 3) * 2);
    for(let i=0; i<positions.length/3; i++) {
        const x = positions[i*3];
        const y = positions[i*3+1];
        const z = positions[i*3+2];
        
        // Cylindrical mapping
        const theta = Math.atan2(x, z);
        const u = (theta + Math.PI) / (2 * Math.PI);
        const v = (y + CONFIG.TREE_HEIGHT/2) / CONFIG.TREE_HEIGHT;
        
        uvArray[i*2] = u;
        uvArray[i*2+1] = v;
    }
    return uvArray;
  }, [positions]);

  // Load Texture (Default or User Uploaded)
  // We use a default fallback if userImage is null, but we toggle uUseTexture based on userImage presence
  const textureUrl = userImage || 'https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?auto=format&fit=crop&w=500&q=60';
  const texture = useLoader(THREE.TextureLoader, textureUrl);

  useFrame((state) => {
    if (shaderRef.current) {
      shaderRef.current.uniforms.uTime.value = state.clock.elapsedTime;
      // Smoothly interpolate uniform value
      shaderRef.current.uniforms.uProgress.value = THREE.MathUtils.lerp(
        shaderRef.current.uniforms.uProgress.value,
        progress,
        0.05
      );
      
      // Update texture uniform
      if (texture) {
        shaderRef.current.uniforms.uTexture.value = texture;
      }
      shaderRef.current.uniforms.uUseTexture.value = !!userImage;
    }
  });

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={positions.length / 3}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-aScatterPosition"
          count={scatterPositions.length / 3}
          array={scatterPositions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-aRandom"
          count={randoms.length}
          array={randoms}
          itemSize={1}
        />
        <bufferAttribute
          attach="attributes-color" // VertexColors auto-injects this into shader
          count={colors.length / 3}
          array={colors}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-aUv"
          count={uvs.length / 2}
          array={uvs}
          itemSize={2}
        />
      </bufferGeometry>
      <shaderMaterial
        ref={shaderRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={{
          uTime: { value: 0 },
          uProgress: { value: 0 },
          uTexture: { value: texture },
          uUseTexture: { value: !!userImage } 
        }}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        vertexColors={true}
      />
    </points>
  );
};