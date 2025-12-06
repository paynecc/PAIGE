import * as THREE from 'three';
import { OrnamentData } from '../types';

// Helper to get a random point in a sphere
export const getRandomSpherePoint = (radius: number): [number, number, number] => {
  const u = Math.random();
  const v = Math.random();
  const theta = 2 * Math.PI * u;
  const phi = Math.acos(2 * v - 1);
  const r = Math.cbrt(Math.random()) * radius;
  const sinPhi = Math.sin(phi);
  return [
    r * sinPhi * Math.cos(theta),
    r * sinPhi * Math.sin(theta),
    r * Math.cos(phi)
  ];
};

// Generate Foliage Particles
export const generateFoliage = (count: number, height: number, radius: number) => {
  const positions = new Float32Array(count * 3);
  const scatterPositions = new Float32Array(count * 3);
  const randoms = new Float32Array(count);
  const colors = new Float32Array(count * 3);

  const color1 = new THREE.Color('#004d25'); // Deep Emerald
  const color2 = new THREE.Color('#022b1c'); // Darker Green
  const color3 = new THREE.Color('#C5A059'); // Gold highlight

  for (let i = 0; i < count; i++) {
    const i3 = i * 3;

    // Tree Shape (Cone)
    // Normalized height 0 to 1 (bottom to top)
    const yNorm = Math.random(); 
    // Cone logic: radius gets smaller as y gets bigger
    const r = (1 - yNorm) * radius; 
    const theta = Math.random() * Math.PI * 2;
    
    // Add some spiral/noise to make it look organic
    const x = r * Math.cos(theta);
    const z = r * Math.sin(theta);
    const y = (yNorm * height) - (height / 2);

    positions[i3] = x;
    positions[i3 + 1] = y;
    positions[i3 + 2] = z;

    // Scatter Shape (Dense Cloud instead of Explosion)
    // Reduced multiplier from 1.5 to 0.75 for "gathering sand" feel
    const scatter = getRandomSpherePoint(height * 0.75);
    scatterPositions[i3] = scatter[0];
    scatterPositions[i3 + 1] = scatter[1];
    scatterPositions[i3 + 2] = scatter[2];

    // Attributes
    randoms[i] = Math.random();
    
    // Color mixing
    const isGold = Math.random() > 0.9;
    const c = isGold ? color3 : (Math.random() > 0.5 ? color1 : color2);
    colors[i3] = c.r;
    colors[i3 + 1] = c.g;
    colors[i3 + 2] = c.b;
  }

  return { positions, scatterPositions, randoms, colors };
};

// Generate Ornaments
export const generateOrnaments = (count: number, height: number, radius: number): OrnamentData[] => {
  const data: OrnamentData[] = [];
  const palette = [
    new THREE.Color('#FFD700'), // Bright Gold
    new THREE.Color('#C5A059'), // Muted Gold
    new THREE.Color('#E5E4E2'), // Platinum
    new THREE.Color('#8a0303'), // Ruby Red
    new THREE.Color('#0f52ba'), // Sapphire Blue
    new THREE.Color('#50c878'), // Emerald Green (Gem)
    new THREE.Color('#9966cc'), // Amethyst
  ];

  for (let i = 0; i < count; i++) {
    // Tree Position (Surface of cone mostly)
    const yNorm = Math.random();
    const rBase = (1 - yNorm) * radius;
    // Push slightly inside or outside
    const r = rBase * (0.8 + Math.random() * 0.4); 
    const theta = Math.random() * Math.PI * 2;

    const x = r * Math.cos(theta);
    const y = (yNorm * height) - (height / 2);
    const z = r * Math.sin(theta);

    // Scatter Position - Tighter radius
    const scatter = getRandomSpherePoint(height * 0.7);
    
    // Shape distribution
    const randShape = Math.random();
    let type: OrnamentData['type'] = 'sphere';
    if (randShape < 0.25) type = 'box';
    else if (randShape < 0.50) type = 'sphere';
    else if (randShape < 0.70) type = 'cone';
    else if (randShape < 0.85) type = 'star';
    else type = 'starburst'; // New type ~15%

    // Color logic
    let color = palette[Math.floor(Math.random() * palette.length)];
    
    // Starbursts are strictly luxury metals (Gold or Platinum)
    if (type === 'starburst') {
        color = Math.random() > 0.5 
            ? new THREE.Color('#FFD700') // Bright Gold
            : new THREE.Color('#E5E4E2'); // Platinum
    }

    data.push({
      id: i,
      treePos: [x, y, z],
      scatterPos: [scatter[0], scatter[1], scatter[2]],
      rotation: [Math.random() * Math.PI, Math.random() * Math.PI, 0],
      scale: 0.4 + Math.random() * 0.6, // Slight size variation
      type: type,
      color: color
    });
  }
  return data;
};