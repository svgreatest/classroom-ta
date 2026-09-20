---
theme: default
background: '#181816'
title: "01: AVL Trees & Self-Balancing Rotations"
colorSchema: dark
highlighter: shiki
lineNumbers: true
wakeLock: false
---

# AVL Trees: Strictly Balanced Binary Search Trees
<Badge>Advanced Data Structures & Algorithms</Badge>

Standard Binary Search Trees suffer from pathological degeneration: when keys arrive sorted ($1, 2, 3, \dots, n$), the tree collapses into a linear chain with $\mathcal{O}(n)$ search time.

<div class="grid grid-cols-2 gap-4 my-2">
<Card title="Naive BST Degeneration (h = n)" type="caution">

Sequential insertions degrade the height to $h = n$. Every operation deteriorates from logarithmic to linear time:
$$1 \to 2 \to 3 \to \cdots \to n \implies \mathcal{O}(n) \text{ search}$$
</Card>

<Card title="The AVL Guarantee (Adelson-Velsky & Landis, 1962)" type="tip">

By maintaining local balance factors at every node, the height is mathematically constrained to $h < 1.44 \log_2(n+2)$:
$$\text{Search, Insert, Delete: Strictly } \mathcal{O}(\log n)$$
</Card>
</div>

<!--
Remind students how quicksort degrades to O(n^2) on sorted arrays—BSTs have the exact same problem without balancing.
-->

---

# The Balance Factor Invariant & Height Proof
<Badge>Invariant & Mathematical Proof</Badge>

<div class="grid grid-cols-2 gap-4 my-2">
<Card title="Definition: Balance Factor BF(v)" type="info">

For every node $v \in T$, the height difference between left and right subtrees must not exceed 1:
$$BF(v) = \text{height}(v.\text{left}) - \text{height}(v.\text{right}) \in \{-1, 0, +1\}$$
</Card>

<Card title="Theorem: Worst-Case Height via Minimal Fibonacci Trees" type="warning">

Let $N(h)$ denote the minimum nodes in an AVL tree of height $h$:
$$N(h) = N(h - 1) + N(h - 2) + 1$$
Adding $1$ yields shifted Fibonacci sequence $F_{h+2}$:
$$h < 1.44 \log_2(n + 2) = \mathcal{O}(\log n)$$
</Card>
</div>

---

# The 4 Rebalancing Rotations
<Badge>Local Pointer Transformations</Badge>

When an insertion causes an imbalance ($|BF(z)| = 2$), exactly one of four local rotations restores the AVL invariant in $\mathcal{O}(1)$ pointer updates:

<div class="grid grid-cols-2 gap-3 my-2">
<Card title="Case 1: Left-Left (LL) - Right Rotation" type="warning">

$$y = \text{rotRight}(z) \iff y.\text{right} = z, \ z.\text{left} = T_2$$
</Card>

<Card title="Case 2: Right-Right (RR) - Left Rotation" type="warning">

$$y = \text{rotLeft}(z) \iff y.\text{left} = z, \ z.\text{right} = T_2$$
</Card>

<Card title="Case 3: Left-Right (LR) - Double Rotation" type="info">

$$z.\text{left} = \text{rotLeft}(z.\text{left})$$
$$\text{return } \text{rotRight}(z)$$
</Card>

<Card title="Case 4: Right-Left (RL) - Double Rotation" type="info">

$$z.\text{right} = \text{rotRight}(z.\text{right})$$
$$\text{return } \text{rotLeft}(z)$$
</Card>
</div>

---

# Interactive VisuAlgo Lab: Parameterize & Animate
<Badge>Live In-Class Simulation</Badge>

Define tree parameters, watch rotations trigger in slow motion, or step forward/backward through tree balance transformations.

<Card title="Live Interactive AVL Tree Simulator" type="tip">

Switch to the **VisuAlgo Lab** tab in the top navigation bar to interact with real-time AVL balancing and step-by-step animations!
</Card>

---

# Pure C Implementation & Memory Architecture
<Badge>Production Tested Code</Badge>

<div class="grid grid-cols-2 gap-4 my-2">
<div>

```c
// Both rotRight and rotLeft in O(1) time
AVLNode* avl_rotate_left(AVLNode* x) {
  AVLNode* y = x->right;
  AVLNode* T2 = y->left;
  y->left = x;
  x->right = T2;
  update_height(x);
  update_height(y);
  return y;
}
```
</div>

<Card title="Verification Suite" type="info">

- **O(1) Rotations**: Exact local pointer adjustments.
- **TDD Rigor**: Tested across 311 programmatic tree permutations.
- **Memory**: Height cached directly on node struct.
</Card>
</div>
