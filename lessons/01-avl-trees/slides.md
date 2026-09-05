# AVL Trees: Strictly Balanced Binary Search Trees
:::badge Lesson 01 • Advanced Data Structures & Algorithms

Standard Binary Search Trees suffer from pathological degeneration: when keys arrive sorted ($1, 2, 3, \dots, n$), the tree collapses into a linear chain with $\mathcal{O}(n)$ search time.

:::grid
:::card Naive BST Degeneration ($h = n$) [caution]
Sequential insertions degrade the height to $h = n$. Every operation deteriorates from logarithmic to linear time:
$$1 \to 2 \to 3 \to \cdots \to n \implies \mathcal{O}(n) \text{ search}$$
:::
:::card The AVL Guarantee (Adelson-Velsky & Landis, 1962) [tip]
By maintaining local balance factors at every node, the height is mathematically constrained to $h < 1.44 \log_2(n+2)$:
$$\text{Search, Insert, Delete: Strictly } \mathcal{O}(\log n)$$
:::
:::

:::notes
Remind students how quicksort degrades to O(n^2) on sorted arrays—BSTs have the exact same problem without balancing.
:::

---

# The Balance Factor Invariant & Height Proof
:::badge Invariant & Mathematical Proof

:::card Definition: Balance Factor $BF(v)$
For every node $v \in T$, the height difference between left and right subtrees must not exceed 1:
$$BF(v) = \text{height}(v.\text{left}) - \text{height}(v.\text{right}) \in \{-1, 0, +1\}$$
:::

:::card Theorem: Worst-Case Height via Minimal Fibonacci Trees [warning]
Let $N(h)$ denote the minimum number of nodes in an AVL tree of height $h$. One subtree must have height $h-1$ and the other $h-2$:
$$N(h) = N(h - 1) + N(h - 2) + 1 \quad \text{with } N(0) = 0, \ N(1) = 1, \ N(2) = 2$$

Adding $1$ to both sides yields $N(h) + 1 = (N(h-1) + 1) + (N(h-2) + 1)$. This is the shifted Fibonacci sequence $F_{h+2}$:
$$N(h) = F_{h+2} - 1 \approx \frac{\phi^{h+2}}{\sqrt{5}} - 1 \quad \text{where } \phi = \frac{1 + \sqrt{5}}{2} \approx 1.61803$$

> [!TIP]
> Taking base-2 logarithms yields the strict upper bound:
> $$h < \log_\phi(n + 2) \approx \frac{\log_2(n + 2)}{\log_2 \phi} \approx 1.4404 \log_2(n + 2) = \mathcal{O}(\log n)$$
:::

:::notes
Walk through why Fibonacci trees represent the absolute leanest AVL tree possible for a given height.
:::

---

# The 4 Rebalancing Rotations
:::badge Local Pointer Transformations

When an insertion causes an imbalance ($|BF(z)| = 2$), exactly one of four local rotations restores the AVL invariant in $\mathcal{O}(1)$ pointer updates:

:::grid
:::card Case 1: Left-Left (LL) - Single Right Rotation [warning]
$$y = \text{rotRight}(z) \iff y.\text{right} = z, \ z.\text{left} = T_2$$
:::
:::card Case 2: Right-Right (RR) - Single Left Rotation [warning]
$$y = \text{rotLeft}(z) \iff y.\text{left} = z, \ z.\text{right} = T_2$$
:::
:::card Case 3: Left-Right (LR) - Double Rotation
$$z.\text{left} = \text{rotLeft}(z.\text{left}); \quad \text{return } \text{rotRight}(z)$$
:::
:::card Case 4: Right-Left (RL) - Double Rotation
$$z.\text{right} = \text{rotRight}(z.\text{right}); \quad \text{return } \text{rotLeft}(z)$$
:::
:::

:::notes
Emphasize that double rotations are just two single rotations composed together.
:::

---

# Interactive VisuAlgo Lab: Parameterize & Animate
:::badge Live In-Class Simulation

Define tree parameters, watch rotations trigger in slow motion, or step forward/backward through tree balance transformations:

:::visualizer

:::notes
Ask a student to pick a number between 1 and 100, then show how the tree balances step-by-step.
:::

---

# Pure C Implementation & Memory Architecture
:::badge Production Tested Code

Our C implementation in `avl_tree.c` was built strictly following **Test-Driven Development (TDD)** with 311 passing assertions.

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

:::code

:::notes
Intentionally introduce a syntax error or change a rotation pointer to demonstrate compiler and runtime safety checks.
:::
