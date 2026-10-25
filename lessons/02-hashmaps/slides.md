---
addons:
  - "@/../../slidev"
theme: default
background: '#181816'
title: "02: Hash Maps & Collision Resolution"
colorSchema: dark
highlighter: shiki
lineNumbers: true
wakeLock: false
# Off: Slidev's pen grabs the mouse and blocks the always-on laser (slidev/global-top.vue)
drawings:
  enabled: false
---

# Hash Maps: Constant-Time Dictionaries & Collisions
<Badge>Core Data Structures</Badge>

How do we search, insert, and delete items with arbitrary keys (strings, objects, UUIDs) in $\mathcal{O}(1)$ expected time without allocating terabytes of memory?

<div class="grid grid-cols-2 gap-4 my-2">
<Card title="Direct Access Array (Impractical)" type="caution">

Indexing by arbitrary 64-bit keys or strings would require an array with $M = 2^{64}$ slots—more memory than exists on Earth.
$$\text{Memory} = \Omega(|U|) \gg 10^{19} \text{ bytes}$$
</Card>

<Card title="The Hash Map Solution" type="tip">

Map keys from huge universe $U$ into $m$ table slots using a hash function $h: U \to \{0, \dots, m-1\}$:
$$\text{Expected Time: } \mathcal{O}(1) \quad \text{Space: } \mathcal{O}(n + m)$$
</Card>
</div>

---

# The Pigeonhole Principle & Expected Chain Length
<Badge>Inevitability & Load Factor Math</Badge>

<div class="grid grid-cols-2 gap-4 my-2">
<Card title="The Inevitability of Collisions" type="info">

Because $|U| > m$, by Dirichlet's **Pigeonhole Principle**, there must exist distinct keys $k_1 \neq k_2$ such that:
$$h(k_1) = h(k_2) \pmod m$$

Collisions cannot be prevented by any clever hash function when universe $U$ exceeds table size $m$!
</Card>

<Card title="Simple Uniform Hashing Assumption (SUHA)" type="warning">

Under SUHA, any given key is equally likely to hash to any of the $m$ slots independently:
$$\text{Load Factor } \alpha = \frac{n}{m} \implies \mathbb{E}[\text{chain length}] = \alpha$$

When load factor $\alpha \le 0.75$, average search time is strictly bounded:
$$\mathcal{O}(1 + \alpha) = \mathcal{O}(1)$$
</Card>
</div>

---

# Collision Resolution Strategies
<Badge>Chaining vs Open Addressing</Badge>

When two keys hash to the same bucket, how do we store them? Two primary paradigms exist:

<div class="grid grid-cols-2 gap-4 my-2">
<Card title="Strategy 1: Separate Chaining (Our Choice)" type="tip">

Each bucket is a linked list. Colliding keys are chained together in $\mathcal{O}(1)$ time:
$$\text{Bucket}[i] \to (k_1, v_1) \to (k_2, v_2) \to \text{NULL}$$
*✓ Simple deletion • Never runs out of slots • Resilient to load spikes*
</Card>

<Card title="Strategy 2: Open Addressing" type="warning">

All entries live directly inside the table array. On collision, probe for next available slot:
$$h(k, i) = (h(k) + i) \pmod m$$
*⚠ Primary clustering • Requires tombstone deletion • Fails when $\alpha \ge 1$*
</Card>
</div>

---

# Interactive Hash Map Lab: Buckets & Collisions
<Badge>Live In-Class Simulation</Badge>

<Card title="Live Hash Map Bucket Visualizer" type="tip">

Switch to the **VisuAlgo Lab** tab in the top navigation bar to test DJB2 hash distribution, watch collisions create bucket chains, and monitor dynamic table resizing in real time!
</Card>

