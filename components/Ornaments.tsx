import React, { useMemo, useRef, useLayoutEffect } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { generateOrnaments } from '../utils/math';
import { OrnamentData } from '../types';

interface OrnamentsProps {
  progress: number;
}

interface PhysicsData {
  radius: number;
  mass: number;
}

export const Ornaments: React.FC<OrnamentsProps> = ({ progress }) => {
  const boxMeshRef = useRef<THREE.InstancedMesh>(null);
  const sphereMeshRef = useRef<THREE.InstancedMesh>(null);
  const coneMeshRef = useRef<THREE.InstancedMesh>(null);
  const starMeshRef = useRef<THREE.InstancedMesh>(null);
  const starburstMeshRef = useRef<THREE.InstancedMesh>(null);

  // Unified Data Generation
  const { allData, boxIndices, sphereIndices, coneIndices, starIndices, starburstIndices, physicsData } = useMemo(() => {
    const all = generateOrnaments(600, 14, 5.5);
    const boxIdcs: number[] = [];
    const sphereIdcs: number[] = [];
    const coneIdcs: number[] = [];
    const starIdcs: number[] = [];
    const starburstIdcs: number[] = [];
    const phys: PhysicsData[] = [];

    all.forEach((o, i) => {
      if (o.type === 'box') {
        boxIdcs.push(i);
        phys.push({ radius: 0.35 * o.scale, mass: 1 });
      } else if (o.type === 'sphere') {
        sphereIdcs.push(i);
        phys.push({ radius: 0.3 * o.scale, mass: 1 });
      } else if (o.type === 'cone') {
        coneIdcs.push(i);
        // Teardrop shape approximation
        phys.push({ radius: 0.3 * o.scale, mass: 1 });
      } else if (o.type === 'star') {
        starIdcs.push(i);
        // Star/Diamond shape
        phys.push({ radius: 0.35 * o.scale, mass: 1 });
      } else {
        starburstIdcs.push(i);
        // Starburst shape (slightly larger collision to protect spikes)
        phys.push({ radius: 0.4 * o.scale, mass: 1.2 });
      }
    });

    return { 
      allData: all, 
      boxIndices: boxIdcs, 
      sphereIndices: sphereIdcs,
      coneIndices: coneIdcs,
      starIndices: starIdcs,
      starburstIndices: starburstIdcs,
      physicsData: phys
    };
  }, []);

  // Physics State (Mutable Refs for performance)
  const count = allData.length;
  const currentPositions = useRef(new Float32Array(count * 3));
  const velocities = useRef(new Float32Array(count * 3));
  
  // Helpers
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const vecTarget = useMemo(() => new THREE.Vector3(), []);
  const vecPos = useMemo(() => new THREE.Vector3(), []);
  const vecVel = useMemo(() => new THREE.Vector3(), []);
  const vecForce = useMemo(() => new THREE.Vector3(), []);

  // Initialization
  useLayoutEffect(() => {
    // Initialize positions to scatterPos
    allData.forEach((d, i) => {
      currentPositions.current[i * 3] = d.scatterPos[0];
      currentPositions.current[i * 3 + 1] = d.scatterPos[1];
      currentPositions.current[i * 3 + 2] = d.scatterPos[2];

      // Random initial velocity for liveliness
      velocities.current[i * 3] = (Math.random() - 0.5) * 0.1;
      velocities.current[i * 3 + 1] = (Math.random() - 0.5) * 0.1;
      velocities.current[i * 3 + 2] = (Math.random() - 0.5) * 0.1;
    });

    // Helper to set colors
    const setColors = (ref: React.RefObject<THREE.InstancedMesh>, indices: number[]) => {
      if (ref.current) {
        indices.forEach((dataIndex, i) => {
          ref.current!.setColorAt(i, allData[dataIndex].color);
        });
        ref.current.instanceColor!.needsUpdate = true;
      }
    };

    setColors(boxMeshRef, boxIndices);
    setColors(sphereMeshRef, sphereIndices);
    setColors(coneMeshRef, coneIndices);
    setColors(starMeshRef, starIndices);
    setColors(starburstMeshRef, starburstIndices);

  }, [allData, boxIndices, sphereIndices, coneIndices, starIndices, starburstIndices]);

  useFrame((state, delta) => {
    // Cap delta to prevent explosion on frame drops
    const dt = Math.min(delta, 0.05);
    const time = state.clock.elapsedTime;
    
    // Simulation Parameters based on Progress
    // progress 0 = scattered, 1 = tree
    
    // Stiffness: Much higher now for "snappy" gathering
    const stiffness = THREE.MathUtils.lerp(1.0, 12.0, progress * progress); 
    
    // Refined Drag: 
    // Higher drag when forming Tree to allow "sand pile" settling (no bounce)
    // 0.85 = High Resistance (Scattered), 0.90 = Even Higher Resistance (Tree)
    // Actually, to make it "simple and clear", we want High Damping when they arrive.
    // If we use simple verlet, drag factor < 1.0. 
    // 0.90 is "slippery", 0.80 is "mud". 
    // We want them to slide into place and stop.
    const drag = THREE.MathUtils.lerp(0.85, 0.80, progress); 
    
    // Noise: Only present when scattered
    const noiseAmt = THREE.MathUtils.lerp(0.5, 0.0, progress); // Reduced from 1.5
    
    // Wind Force Factors
    const windStrength = THREE.MathUtils.lerp(1.0, 0.0, progress);
    const windX = Math.sin(time * 0.4) * 0.3; 
    const windZ = Math.cos(time * 0.25) * 0.15;
    
    // Collisions: Disable when tree is almost formed
    const collisionEnabled = progress < 0.8; 

    const posArray = currentPositions.current;
    const velArray = velocities.current;

    // 1. Force Integration Loop
    for (let i = 0; i < count; i++) {
      const idx = i * 3;
      const data = allData[i];

      // Read current state
      vecPos.set(posArray[idx], posArray[idx + 1], posArray[idx + 2]);
      vecVel.set(velArray[idx], velArray[idx + 1], velArray[idx + 2]);

      // Determine Target
      const scatterHome = data.scatterPos;
      const treeHome = data.treePos;
      
      vecTarget.set(
        THREE.MathUtils.lerp(scatterHome[0], treeHome[0], progress),
        THREE.MathUtils.lerp(scatterHome[1], treeHome[1], progress),
        THREE.MathUtils.lerp(scatterHome[2], treeHome[2], progress)
      );

      // Spring Force to Target
      vecForce.copy(vecTarget).sub(vecPos).multiplyScalar(stiffness);

      // Add Noise Force
      if (noiseAmt > 0.01) {
        const nx = Math.sin(time + i * 0.1) * Math.cos(time * 0.5 + vecPos.y);
        const ny = Math.cos(time + i * 0.1);
        const nz = Math.sin(time * 0.3 + vecPos.x);
        vecForce.addScaledVector(new THREE.Vector3(nx, ny, nz), noiseAmt);
      }

      // Add Wind Force
      if (windStrength > 0.01) {
        const localWindVar = 0.8 + 0.4 * Math.sin(vecPos.y * 0.5 + i);
        vecForce.x += windX * windStrength * localWindVar;
        vecForce.z += windZ * windStrength * localWindVar;
      }

      // Apply Force to Velocity
      vecVel.addScaledVector(vecForce, dt);
      
      // Apply Drag
      vecVel.multiplyScalar(drag);

      // Write back velocity
      velArray[idx] = vecVel.x;
      velArray[idx + 1] = vecVel.y;
      velArray[idx + 2] = vecVel.z;
    }

    // 2. Collision Detection
    if (collisionEnabled) {
      for (let i = 0; i < count; i++) {
        const idxI = i * 3;
        const r1 = physicsData[i].radius;

        for (let j = i + 1; j < count; j++) {
          const idxJ = j * 3;
          const r2 = physicsData[j].radius;
          const minDist = r1 + r2;

          const dx = posArray[idxI] - posArray[idxJ];
          const dy = posArray[idxI+1] - posArray[idxJ+1];
          const dz = posArray[idxI+2] - posArray[idxJ+2];
          
          const distSq = dx*dx + dy*dy + dz*dz;

          if (distSq < minDist * minDist && distSq > 0.0001) {
            const dist = Math.sqrt(distSq);
            const overlap = minDist - dist;
            
            const nx = dx / dist;
            const ny = dy / dist;
            const nz = dz / dist;

            const separationFactor = 0.5;
            
            posArray[idxI] += nx * overlap * separationFactor;
            posArray[idxI+1] += ny * overlap * separationFactor;
            posArray[idxI+2] += nz * overlap * separationFactor;

            posArray[idxJ] -= nx * overlap * separationFactor;
            posArray[idxJ+1] -= ny * overlap * separationFactor;
            posArray[idxJ+2] -= nz * overlap * separationFactor;

            const vx = velArray[idxI] - velArray[idxJ];
            const vy = velArray[idxI+1] - velArray[idxJ+1];
            const vz = velArray[idxI+2] - velArray[idxJ+2];
            
            const dot = vx*nx + vy*ny + vz*nz;

            if (dot < 0) { 
              const restitution = 0.3; // Less bounce for "sand" feel
              const impulse = -(1 + restitution) * dot * 0.5;

              velArray[idxI] += nx * impulse;
              velArray[idxI+1] += ny * impulse;
              velArray[idxI+2] += nz * impulse;

              velArray[idxJ] -= nx * impulse;
              velArray[idxJ+1] -= ny * impulse;
              velArray[idxJ+2] -= nz * impulse;
              
              // Heavy damping on collision
              const damping = 0.9;
              velArray[idxI] *= damping;
              velArray[idxI+1] *= damping;
              velArray[idxI+2] *= damping;
              
              velArray[idxJ] *= damping;
              velArray[idxJ+1] *= damping;
              velArray[idxJ+2] *= damping;
            }
          }
        }
      }
    }

    // 3. Integrate Position & Update Meshes
    
    // Generic update function
    const updateMesh = (
      ref: React.RefObject<THREE.InstancedMesh>, 
      indices: number[], 
      baseRot: (t: number, d: any) => THREE.Euler
    ) => {
      if (!ref.current) return;
      indices.forEach((dataIndex, i) => {
        const idx = dataIndex * 3;
        const data = allData[dataIndex];
        
        // Update physics pos
        posArray[idx] += velArray[idx] * dt;
        posArray[idx+1] += velArray[idx+1] * dt;
        posArray[idx+2] += velArray[idx+2] * dt;

        dummy.position.set(posArray[idx], posArray[idx+1], posArray[idx+2]);
        
        // Dynamic rotation
        const r = baseRot(time, data);
        dummy.rotation.set(r.x, r.y, r.z);
        
        dummy.scale.setScalar(data.scale);
        dummy.updateMatrix();
        ref.current!.setMatrixAt(i, dummy.matrix);
      });
      ref.current.instanceMatrix.needsUpdate = true;
    };

    updateMesh(boxMeshRef, boxIndices, (t, d) => new THREE.Euler(
      d.rotation[0] + t * 0.5,
      d.rotation[1] + t * 0.3,
      d.rotation[2]
    ));

    updateMesh(sphereMeshRef, sphereIndices, () => new THREE.Euler(0,0,0));

    updateMesh(coneMeshRef, coneIndices, (t, d) => new THREE.Euler(
      Math.sin(t + d.id) * 0.2, 
      t * 0.5 + d.id, 
      0
    ));

    updateMesh(starMeshRef, starIndices, (t, d) => new THREE.Euler(
      t * 0.3 + d.rotation[0],
      t * 0.5 + d.rotation[1],
      d.rotation[2]
    ));

    updateMesh(starburstMeshRef, starburstIndices, (t, d) => new THREE.Euler(
      t * 0.8 + d.rotation[0], // Faster rotation for sparkle
      t * 0.8 + d.rotation[1],
      t * 0.2 + d.rotation[2]
    ));

  });

  const materialProps = {
    roughness: 0.15,
    metalness: 0.9,
    envMapIntensity: 1.5,
  };

  return (
    <group>
      <instancedMesh
        ref={boxMeshRef}
        args={[undefined, undefined, boxIndices.length]}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[0.5, 0.5, 0.5]} />
        <meshStandardMaterial {...materialProps} />
      </instancedMesh>

      <instancedMesh
        ref={sphereMeshRef}
        args={[undefined, undefined, sphereIndices.length]}
        castShadow
        receiveShadow
      >
        <sphereGeometry args={[0.3, 32, 32]} />
        <meshStandardMaterial {...materialProps} />
      </instancedMesh>

      <instancedMesh
        ref={coneMeshRef}
        args={[undefined, undefined, coneIndices.length]}
        castShadow
        receiveShadow
      >
        <coneGeometry args={[0.2, 0.6, 16]} />
        <meshStandardMaterial {...materialProps} />
      </instancedMesh>

      <instancedMesh
        ref={starMeshRef}
        args={[undefined, undefined, starIndices.length]}
        castShadow
        receiveShadow
      >
        <octahedronGeometry args={[0.3, 0]} />
        <meshStandardMaterial {...materialProps} />
      </instancedMesh>

      {/* New Starburst Mesh */}
      <instancedMesh
        ref={starburstMeshRef}
        args={[undefined, undefined, starburstIndices.length]}
        castShadow
        receiveShadow
      >
        {/* Icosahedron detail=0 creates a 20-sided gem shape that works well as a 'burst' */}
        <icosahedronGeometry args={[0.25, 0]} />
        <meshStandardMaterial {...materialProps} roughness={0.05} metalness={1.0} />
      </instancedMesh>
    </group>
  );
};