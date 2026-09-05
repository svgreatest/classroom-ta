import { describe, it, expect } from 'vitest';
import {
  generateInsertSteps,
  generateDeleteSteps,
  buildParameterizedTree,
  calculateTreeLayout,
  getTreeHeight,
  isAVLBalanced
} from '../avl-generator';
import { AVLNodeState } from '../types';

describe('Classroom TA - AVL Animation & Parameterized Engine (TDD)', () => {
  describe('Parameterized Tree Builder by Height (h)', () => {
    it('creates minimal Fibonacci AVL tree of height 1 (1 node)', () => {
      const tree = buildParameterizedTree({ targetHeight: 1, mode: 'minimal_fibonacci' });
      expect(tree).not.toBeNull();
      expect(getTreeHeight(tree)).toBe(1);
      expect(isAVLBalanced(tree)).toBe(true);
    });

    it('creates minimal Fibonacci AVL tree of height 2 (2 nodes)', () => {
      const tree = buildParameterizedTree({ targetHeight: 2, mode: 'minimal_fibonacci' });
      expect(tree).not.toBeNull();
      expect(getTreeHeight(tree)).toBe(2);
      expect(isAVLBalanced(tree)).toBe(true);
    });

    it('creates minimal Fibonacci AVL tree of height 3 (4 nodes: N(3) = N(2) + N(1) + 1 = 2 + 1 + 1 = 4)', () => {
      const tree = buildParameterizedTree({ targetHeight: 3, mode: 'minimal_fibonacci' });
      expect(tree).not.toBeNull();
      expect(getTreeHeight(tree)).toBe(3);
      expect(isAVLBalanced(tree)).toBe(true);
      // In minimal AVL, root balance factor is +1
      expect(tree?.balanceFactor).toBe(1);
    });

    it('creates minimal Fibonacci AVL tree of height 4 (7 nodes: N(4) = 4 + 2 + 1 = 7)', () => {
      const tree = buildParameterizedTree({ targetHeight: 4, mode: 'minimal_fibonacci' });
      expect(tree).not.toBeNull();
      expect(getTreeHeight(tree)).toBe(4);
      expect(isAVLBalanced(tree)).toBe(true);
    });

    it('creates complete balanced AVL tree of height 3 (7 nodes: 2^3 - 1 = 7)', () => {
      const tree = buildParameterizedTree({ targetHeight: 3, mode: 'complete' });
      expect(tree).not.toBeNull();
      expect(getTreeHeight(tree)).toBe(3);
      expect(tree?.balanceFactor).toBe(0);
      expect(isAVLBalanced(tree)).toBe(true);
    });
  });

  describe('Step-by-Step Animation Generator for Insertions', () => {
    it('records LL single right rotation steps when inserting 30 -> 20 -> 10', () => {
      let tree: AVLNodeState | null = null;
      // Insert 30
      let steps = generateInsertSteps(tree, 30);
      tree = steps[steps.length - 1].treeSnapshot;

      // Insert 20
      steps = generateInsertSteps(tree, 20);
      tree = steps[steps.length - 1].treeSnapshot;

      // Insert 10 (triggers LL rotation at 30)
      steps = generateInsertSteps(tree, 10);
      expect(steps.length).toBeGreaterThan(3);

      const imbalanceStep = steps.find(s => s.actionType === 'detect_imbalance');
      expect(imbalanceStep).toBeDefined();
      expect(imbalanceStep?.rotationCase).toBe('LL');
      expect(imbalanceStep?.pivotKey).toBe(30);

      const rotateStep = steps.find(s => s.actionType === 'rotate_right');
      expect(rotateStep).toBeDefined();

      const finalStep = steps[steps.length - 1];
      expect(finalStep.actionType).toBe('balanced_done');
      expect(finalStep.treeSnapshot?.key).toBe(20);
      expect(finalStep.treeSnapshot?.left?.key).toBe(10);
      expect(finalStep.treeSnapshot?.right?.key).toBe(30);
      expect(isAVLBalanced(finalStep.treeSnapshot)).toBe(true);
    });

    it('records RR single left rotation steps when inserting 10 -> 20 -> 30', () => {
      let tree: AVLNodeState | null = null;
      let steps = generateInsertSteps(tree, 10);
      tree = steps[steps.length - 1].treeSnapshot;

      steps = generateInsertSteps(tree, 20);
      tree = steps[steps.length - 1].treeSnapshot;

      steps = generateInsertSteps(tree, 30);
      const imbalanceStep = steps.find(s => s.actionType === 'detect_imbalance');
      expect(imbalanceStep?.rotationCase).toBe('RR');

      const rotateStep = steps.find(s => s.actionType === 'rotate_left');
      expect(rotateStep).toBeDefined();

      const finalStep = steps[steps.length - 1];
      expect(finalStep.treeSnapshot?.key).toBe(20);
      expect(isAVLBalanced(finalStep.treeSnapshot)).toBe(true);
    });

    it('records LR double rotation steps when inserting 30 -> 10 -> 20', () => {
      let tree: AVLNodeState | null = null;
      let steps = generateInsertSteps(tree, 30);
      tree = steps[steps.length - 1].treeSnapshot;

      steps = generateInsertSteps(tree, 10);
      tree = steps[steps.length - 1].treeSnapshot;

      steps = generateInsertSteps(tree, 20);
      const imbalanceStep = steps.find(s => s.actionType === 'detect_imbalance');
      expect(imbalanceStep?.rotationCase).toBe('LR');

      // Should perform left rotation first, then right rotation
      const leftRot = steps.find(s => s.actionType === 'rotate_left');
      const rightRot = steps.find(s => s.actionType === 'rotate_right');
      expect(leftRot).toBeDefined();
      expect(rightRot).toBeDefined();

      const finalStep = steps[steps.length - 1];
      expect(finalStep.treeSnapshot?.key).toBe(20);
      expect(isAVLBalanced(finalStep.treeSnapshot)).toBe(true);
    });

    it('records RL double rotation steps when inserting 10 -> 30 -> 20', () => {
      let tree: AVLNodeState | null = null;
      let steps = generateInsertSteps(tree, 10);
      tree = steps[steps.length - 1].treeSnapshot;

      steps = generateInsertSteps(tree, 30);
      tree = steps[steps.length - 1].treeSnapshot;

      steps = generateInsertSteps(tree, 20);
      const imbalanceStep = steps.find(s => s.actionType === 'detect_imbalance');
      expect(imbalanceStep?.rotationCase).toBe('RL');

      const rightRot = steps.find(s => s.actionType === 'rotate_right');
      const leftRot = steps.find(s => s.actionType === 'rotate_left');
      expect(rightRot).toBeDefined();
      expect(leftRot).toBeDefined();

      const finalStep = steps[steps.length - 1];
      expect(finalStep.treeSnapshot?.key).toBe(20);
      expect(isAVLBalanced(finalStep.treeSnapshot)).toBe(true);
    });
  });

  describe('Step-by-Step Deletion Generator', () => {
    it('deletes a node and records rebalancing steps', () => {
      // Build a tree with 20, 10, 30, 5
      let tree = buildParameterizedTree({ targetHeight: 3, mode: 'minimal_fibonacci' });
      expect(tree).not.toBeNull();

      const steps = generateDeleteSteps(tree, 10);
      expect(steps.length).toBeGreaterThan(1);
      const finalStep = steps[steps.length - 1];
      expect(isAVLBalanced(finalStep.treeSnapshot)).toBe(true);
    });
  });

  describe('SVG Tree Layout Engine', () => {
    it('assigns non-overlapping (x, y) coordinates to all nodes', () => {
      const tree = buildParameterizedTree({ targetHeight: 3, mode: 'complete' });
      const layoutTree = calculateTreeLayout(tree, 800, 500);

      expect(layoutTree).not.toBeNull();
      expect(layoutTree?.x).toBeDefined();
      expect(layoutTree?.y).toBeDefined();
      expect(layoutTree?.left?.x).toBeLessThan(layoutTree!.x!);
      expect(layoutTree?.right?.x).toBeGreaterThan(layoutTree!.x!);
    });
  });
});
