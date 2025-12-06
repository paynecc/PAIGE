import { Color } from 'three';

export enum TreeMorphState {
  SCATTERED = 'SCATTERED',
  TREE_SHAPE = 'TREE_SHAPE'
}

export interface ParticleData {
  positions: Float32Array;
  scatterPositions: Float32Array;
  colors: Float32Array;
  randoms: Float32Array;
}

export interface OrnamentData {
  id: number;
  treePos: [number, number, number];
  scatterPos: [number, number, number];
  rotation: [number, number, number];
  scale: number;
  type: 'box' | 'sphere' | 'cone' | 'star' | 'starburst';
  color: Color;
}