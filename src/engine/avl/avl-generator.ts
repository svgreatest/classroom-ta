import { AVLNodeState, AVLAnimationStep, StepActionType, TreeParameterOptions } from './types';

let idCounter = 1;
function getNextId(): string {
  return `node-${idCounter++}`;
}

export function createNode(key: number): AVLNodeState {
  return {
    id: getNextId(),
    key,
    height: 1,
    balanceFactor: 0,
    left: null,
    right: null
  };
}

export function cloneTree(node: AVLNodeState | null): AVLNodeState | null {
  if (!node) return null;
  return {
    id: node.id,
    key: node.key,
    height: node.height,
    balanceFactor: node.balanceFactor,
    x: node.x,
    y: node.y,
    left: cloneTree(node.left),
    right: cloneTree(node.right)
  };
}

export function getTreeHeight(node: AVLNodeState | null): number {
  return node ? node.height : 0;
}

export function getBalanceFactor(node: AVLNodeState | null): number {
  return node ? getTreeHeight(node.left) - getTreeHeight(node.right) : 0;
}

export function updateNodeHeight(node: AVLNodeState): void {
  const leftH = getTreeHeight(node.left);
  const rightH = getTreeHeight(node.right);
  node.height = 1 + Math.max(leftH, rightH);
  node.balanceFactor = leftH - rightH;
}

export function isAVLBalanced(node: AVLNodeState | null): boolean {
  if (!node) return true;
  const bf = getBalanceFactor(node);
  if (Math.abs(bf) > 1) return false;
  return isAVLBalanced(node.left) && isAVLBalanced(node.right);
}

// Rotations
export function rotateRight(y: AVLNodeState): AVLNodeState {
  if (!y.left) return y;
  const x = y.left;
  const T2 = x.right;

  x.right = y;
  y.left = T2;

  updateNodeHeight(y);
  updateNodeHeight(x);

  return x;
}

export function rotateLeft(x: AVLNodeState): AVLNodeState {
  if (!x.right) return x;
  const y = x.right;
  const T2 = y.left;

  y.left = x;
  x.right = T2;

  updateNodeHeight(x);
  updateNodeHeight(y);

  return y;
}

// Parameterized AVL Tree Builder
export function buildParameterizedTree(options: TreeParameterOptions): AVLNodeState | null {
  const { targetHeight, mode } = options;
  if (targetHeight <= 0) return null;

  if (mode === 'minimal_fibonacci') {
    let keyCounter = 1;
    function buildFib(h: number): AVLNodeState | null {
      if (h <= 0) return null;
      if (h === 1) {
        return createNode(keyCounter++ * 10);
      }
      const left = buildFib(h - 1);
      const key = keyCounter++ * 10;
      const root = createNode(key);
      root.left = left;
      root.right = buildFib(h - 2);
      updateNodeHeight(root);
      return root;
    }
    return buildFib(targetHeight);
  }

  if (mode === 'complete') {
    let keyCounter = 1;
    function buildComplete(h: number): AVLNodeState | null {
      if (h <= 0) return null;
      if (h === 1) {
        return createNode(keyCounter++ * 10);
      }
      const left = buildComplete(h - 1);
      const key = keyCounter++ * 10;
      const root = createNode(key);
      root.left = left;
      root.right = buildComplete(h - 1);
      updateNodeHeight(root);
      return root;
    }
    return buildComplete(targetHeight);
  }

  // Random mode: insert numbers until height is reached
  let tree: AVLNodeState | null = null;
  const used = new Set<number>();
  let attempts = 0;
  while (getTreeHeight(tree) < targetHeight && attempts < 100) {
    attempts++;
    const val = Math.floor(Math.random() * 90) + 10;
    if (!used.has(val)) {
      used.add(val);
      const steps = generateInsertSteps(tree, val);
      tree = steps[steps.length - 1].treeSnapshot;
    }
  }
  return tree;
}

// Step-by-Step Animation Generator for Insertion
export function generateInsertSteps(initialTree: AVLNodeState | null, key: number): AVLAnimationStep[] {
  const steps: AVLAnimationStep[] = [];
  let root = cloneTree(initialTree);

  function pushStep(
    actionType: StepActionType,
    description: string,
    activeKey?: number,
    compareWithKey?: number,
    pivotKey?: number,
    rotationCase?: 'LL' | 'RR' | 'LR' | 'RL' | 'NONE',
    line?: number
  ) {
    steps.push({
      stepIndex: steps.length,
      totalSteps: 0, // will patch at end
      actionType,
      treeSnapshot: cloneTree(root),
      activeKey,
      compareWithKey,
      pivotKey,
      rotationCase,
      description,
      pseudocodeLine: line
    });
  }

  pushStep('start', `Begin insertion of key ${key}`, key, undefined, undefined, 'NONE', 1);

  function insertRecursive(node: AVLNodeState | null): AVLNodeState {
    if (!node) {
      const leaf = createNode(key);
      pushStep('insert_leaf', `Placed new node ${key} as leaf (height = 1, BF = 0)`, key, undefined, undefined, 'NONE', 3);
      return leaf;
    }

    pushStep('compare', `Compare ${key} with ${node.key}: ${key < node.key ? `${key} < ${node.key}, move left` : `${key} > ${node.key}, move right`}`, key, node.key, undefined, 'NONE', 5);

    if (key < node.key) {
      node.left = insertRecursive(node.left);
    } else if (key > node.key) {
      node.right = insertRecursive(node.right);
    } else {
      pushStep('balanced_done', `Key ${key} already exists in tree (duplicates ignored)`, key, undefined, undefined, 'NONE', 7);
      return node;
    }

    updateNodeHeight(node);
    pushStep('update_height', `Updated node ${node.key}: height = ${node.height}, Balance Factor = ${node.balanceFactor}`, key, node.key, undefined, 'NONE', 9);

    const balance = node.balanceFactor;

    // Case 1: Left-Left (LL)
    if (balance > 1 && node.left && key < node.left.key) {
      pushStep('detect_imbalance', `Imbalance at node ${node.key} (BF = ${balance} > 1). Left-Left (LL) condition detected!`, key, undefined, node.key, 'LL', 12);
      const rotated = rotateRight(node);
      node = rotated;
      pushStep('rotate_right', `Performed single Right Rotation around pivot ${node.right?.key}. New subtree root is ${node.key}`, key, undefined, node.key, 'LL', 14);
      return node;
    }

    // Case 2: Right-Right (RR)
    if (balance < -1 && node.right && key > node.right.key) {
      pushStep('detect_imbalance', `Imbalance at node ${node.key} (BF = ${balance} < -1). Right-Right (RR) condition detected!`, key, undefined, node.key, 'RR', 16);
      const rotated = rotateLeft(node);
      node = rotated;
      pushStep('rotate_left', `Performed single Left Rotation around pivot ${node.left?.key}. New subtree root is ${node.key}`, key, undefined, node.key, 'RR', 18);
      return node;
    }

    // Case 3: Left-Right (LR)
    if (balance > 1 && node.left && key > node.left.key) {
      pushStep('detect_imbalance', `Imbalance at node ${node.key} (BF = ${balance} > 1). Left-Right (LR) condition detected!`, key, undefined, node.key, 'LR', 20);
      node.left = rotateLeft(node.left);
      pushStep('rotate_left', `Step 1/2: Performed Left Rotation on left child ${node.left.left?.key}`, key, undefined, node.left.key, 'LR', 22);
      const rotated = rotateRight(node);
      node = rotated;
      pushStep('rotate_right', `Step 2/2: Performed Right Rotation on root ${node.right?.key}. Subtree now balanced!`, key, undefined, node.key, 'LR', 24);
      return node;
    }

    // Case 4: Right-Left (RL)
    if (balance < -1 && node.right && key < node.right.key) {
      pushStep('detect_imbalance', `Imbalance at node ${node.key} (BF = ${balance} < -1). Right-Left (RL) condition detected!`, key, undefined, node.key, 'RL', 26);
      node.right = rotateRight(node.right);
      pushStep('rotate_right', `Step 1/2: Performed Right Rotation on right child ${node.right.right?.key}`, key, undefined, node.right.key, 'RL', 28);
      const rotated = rotateLeft(node);
      node = rotated;
      pushStep('rotate_left', `Step 2/2: Performed Left Rotation on root ${node.left?.key}. Subtree now balanced!`, key, undefined, node.key, 'RL', 30);
      return node;
    }

    return node;
  }

  root = insertRecursive(root);
  pushStep('balanced_done', `Insertion of key ${key} complete! Tree satisfies AVL invariant: |BF| <= 1 at every node.`, key, undefined, undefined, 'NONE', 35);

  const total = steps.length;
  steps.forEach(s => (s.totalSteps = total));
  return steps;
}

// Step-by-Step Animation Generator for Deletion
export function generateDeleteSteps(initialTree: AVLNodeState | null, key: number): AVLAnimationStep[] {
  const steps: AVLAnimationStep[] = [];
  let root = cloneTree(initialTree);

  function pushStep(
    actionType: StepActionType,
    description: string,
    activeKey?: number,
    compareWithKey?: number,
    pivotKey?: number,
    rotationCase?: 'LL' | 'RR' | 'LR' | 'RL' | 'NONE'
  ) {
    steps.push({
      stepIndex: steps.length,
      totalSteps: 0,
      actionType,
      treeSnapshot: cloneTree(root),
      activeKey,
      compareWithKey,
      pivotKey,
      rotationCase,
      description
    });
  }

  pushStep('start', `Begin deletion of key ${key}`, key);

  function minNode(n: AVLNodeState): AVLNodeState {
    let curr = n;
    while (curr.left) curr = curr.left;
    return curr;
  }

  function deleteRecursive(node: AVLNodeState | null): AVLNodeState | null {
    if (!node) {
      pushStep('balanced_done', `Key ${key} not found in tree`, key);
      return null;
    }

    if (key < node.key) {
      node.left = deleteRecursive(node.left);
    } else if (key > node.key) {
      node.right = deleteRecursive(node.right);
    } else {
      pushStep('delete_node', `Found target node ${key} to delete`, key);
      if (!node.left || !node.right) {
        const temp = node.left ? node.left : node.right;
        if (!temp) {
          node = null;
          return null;
        } else {
          node = temp;
        }
      } else {
        const succ = minNode(node.right);
        node.key = succ.key;
        pushStep('delete_node', `Replaced node with in-order successor ${succ.key}`, succ.key);
        // delete successor
        const stepsSub = generateDeleteSteps(node.right, succ.key);
        node.right = stepsSub[stepsSub.length - 1].treeSnapshot;
      }
    }

    if (!node) return null;

    updateNodeHeight(node);
    pushStep('update_height', `Updated node ${node.key}: height = ${node.height}, BF = ${node.balanceFactor}`, node.key);

    const balance = node.balanceFactor;

    // LL Case
    if (balance > 1 && getBalanceFactor(node.left) >= 0) {
      pushStep('detect_imbalance', `Imbalance at node ${node.key} (BF = ${balance}). LL rebalancing on deletion`, key, undefined, node.key, 'LL');
      return rotateRight(node);
    }

    // LR Case
    if (balance > 1 && getBalanceFactor(node.left) < 0) {
      pushStep('detect_imbalance', `Imbalance at node ${node.key} (BF = ${balance}). LR rebalancing on deletion`, key, undefined, node.key, 'LR');
      if (node.left) node.left = rotateLeft(node.left);
      return rotateRight(node);
    }

    // RR Case
    if (balance < -1 && getBalanceFactor(node.right) <= 0) {
      pushStep('detect_imbalance', `Imbalance at node ${node.key} (BF = ${balance}). RR rebalancing on deletion`, key, undefined, node.key, 'RR');
      return rotateLeft(node);
    }

    // RL Case
    if (balance < -1 && getBalanceFactor(node.right) > 0) {
      pushStep('detect_imbalance', `Imbalance at node ${node.key} (BF = ${balance}). RL rebalancing on deletion`, key, undefined, node.key, 'RL');
      if (node.right) node.right = rotateRight(node.right);
      return rotateLeft(node);
    }

    return node;
  }

  root = deleteRecursive(root);
  pushStep('balanced_done', `Deletion complete! Tree is valid AVL.`, key);

  const total = steps.length;
  steps.forEach(s => (s.totalSteps = total));
  return steps;
}

// Tree Layout Calculator for SVG Renderer
export function calculateTreeLayout(root: AVLNodeState | null, width: number, height: number): AVLNodeState | null {
  if (!root) return null;

  const cloned = cloneTree(root);
  if (!cloned) return null;

  const maxH = getTreeHeight(cloned);
  const levelHeight = Math.min(80, (height - 120) / Math.max(1, maxH));

  function assignPositions(node: AVLNodeState | null, depth: number, minX: number, maxX: number): void {
    if (!node) return;

    node.x = (minX + maxX) / 2;
    node.y = 60 + depth * levelHeight;

    const mid = (minX + maxX) / 2;
    assignPositions(node.left, depth + 1, minX, mid);
    assignPositions(node.right, depth + 1, mid, maxX);
  }

  assignPositions(cloned, 0, 40, width - 40);
  return cloned;
}
