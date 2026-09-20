import React from 'react';
import { AVLTreeVisualizer } from './AVLTreeVisualizer';
import { HashMapVisualizer } from './HashMapVisualizer';
import { PointersOPTVisualizer } from './PointersOPTVisualizer';

export interface VisualizerConfig {
  id: string;
  name: string;
  description: string;
  component: React.ComponentType<any>;
}

export const VISUALIZER_REGISTRY: Record<string, VisualizerConfig> = {
  'avl': {
    id: 'avl',
    name: 'AVL Balanced Tree Visualizer',
    description: 'Step-by-step balanced tree rotations with height invariants and balance factors',
    component: AVLTreeVisualizer
  },
  'hashmap': {
    id: 'hashmap',
    name: 'Hash Map & Separate Chaining Visualizer',
    description: 'Dynamic load factor scaling, collisions, and bucket chaining simulation',
    component: HashMapVisualizer
  },
  'pointers-opt': {
    id: 'pointers-opt',
    name: 'Memory & Pointer Tracer Visualizer',
    description: 'Stack frame allocations, pointer dereferencing, and memory addresses',
    component: PointersOPTVisualizer
  }
};

// Map lesson IDs to default visualizers
export const LESSON_VISUALIZER_MAP: Record<string, string> = {
  '01-avl-trees': 'avl',
  '02-hashmaps': 'hashmap',
  '03-pointers-and-stacks': 'pointers-opt'
};

export function getVisualizerForLesson(lessonId: string): VisualizerConfig {
  const visualizerKey = LESSON_VISUALIZER_MAP[lessonId] || 'avl';
  return VISUALIZER_REGISTRY[visualizerKey] || VISUALIZER_REGISTRY['avl'];
}
