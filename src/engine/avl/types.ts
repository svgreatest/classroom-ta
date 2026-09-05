export interface AVLNodeState {
  id: string;
  key: number;
  height: number;
  balanceFactor: number;
  left: AVLNodeState | null;
  right: AVLNodeState | null;
  // Computed layout coordinates for SVG rendering
  x?: number;
  y?: number;
}

export type StepActionType =
  | 'start'
  | 'compare'
  | 'insert_leaf'
  | 'update_height'
  | 'detect_imbalance'
  | 'rotate_left'
  | 'rotate_right'
  | 'delete_node'
  | 'balanced_done';

export interface AVLAnimationStep {
  stepIndex: number;
  totalSteps: number;
  actionType: StepActionType;
  treeSnapshot: AVLNodeState | null;
  activeKey?: number;
  compareWithKey?: number;
  pivotKey?: number;
  rotationCase?: 'LL' | 'RR' | 'LR' | 'RL' | 'NONE';
  description: string;
  pseudocodeLine?: number;
}

export interface TreeParameterOptions {
  targetHeight: number;
  mode: 'minimal_fibonacci' | 'complete' | 'random';
}
