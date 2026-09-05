# Hash Maps: Constant-Time Dictionaries & Collisions
:::badge Lesson 02 • Core Data Structures

How do we search, insert, and delete items with arbitrary keys (strings, objects, UUIDs) in $\mathcal{O}(1)$ expected time without allocating terabytes of memory?

:::grid
:::card Direct Access Array (Impractical) [caution]
Indexing by arbitrary 64-bit keys or strings would require an array with $M = 2^{64}$ slots—more memory than exists on Earth.
$$\text{Memory} = \Omega(|U|) \gg 10^{19} \text{ bytes}$$
:::
:::card The Hash Map Solution [tip]
Map keys from huge universe $U$ into $m$ table slots using a hash function $h: U \to \{0, \dots, m-1\}$:
$$\text{Expected Time: } \mathcal{O}(1) \quad \text{Space: } \mathcal{O}(n + m)$$
:::
:::

:::notes
Explain why a hash function is needed to map huge universes into bounded array ranges.
:::

---

# The Pigeonhole Principle & Expected Chain Length
:::badge Inevitability & Load Factor Math

:::card The Inevitability of Collisions
Because $|U| > m$, by Dirichlet's **Pigeonhole Principle**, there must exist distinct keys $k_1 \neq k_2$ such that:
$$h(k_1) = h(k_2) \pmod m \quad (\text{Collision Inevitability})$$
:::

:::card Simple Uniform Hashing Assumption (SUHA) [warning]
Under SUHA, any given key is equally likely to hash to any of the $m$ slots, independently of where other keys hash.
$$\text{Load Factor } \alpha = \frac{n}{m} \implies \mathbb{E}[\text{chain length}] = \alpha$$

> [!TIP]
> When load factor $\alpha \le 0.75$, average search time is strictly bounded:
> $$\mathcal{O}(1 + \alpha) = \mathcal{O}(1)$$
:::

:::notes
Show how DJB2 achieves good distribution using prime 5381 and bit-shifts.
:::

---

# Collision Resolution Strategies
:::badge Chaining vs Open Addressing

When two keys hash to the same bucket, how do we store them? Two primary paradigms exist:

:::grid
:::card Strategy 1: Separate Chaining (Our Choice)
Each bucket is a linked list. Colliding keys are chained together in $\mathcal{O}(1)$ time:
$$\text{Bucket}[i] \to (k_1, v_1) \to (k_2, v_2) \to \text{NULL}$$
*✓ Simple deletion • Never runs out of slots • Resilient to load spikes*
:::
:::card Strategy 2: Open Addressing [warning]
All entries live directly inside the table array. On collision, probe for next available slot:
$$h(k, i) = (h(k) + i) \pmod m \quad (\text{Linear Probing})$$
*⚠ Primary clustering • Requires tombstone deletion • Fails when $\alpha \ge 1$*
:::
:::

:::notes
Compare cache locality vs dynamic resizing overhead between chaining and open addressing.
:::

---

# Interactive VisuAlgo Lab: Hash Maps & Rehashing
:::badge Live In-Class Simulation

Define table capacity, watch collisions chain, and observe automatic table doubling when load factor exceeds $\alpha_{\max} = 0.75$:

:::visualizer

:::notes
Insert strings that hash to the same bucket to visually illustrate separate chaining.
:::

---

# Pure C Implementation & Dynamic Table Doubling
:::badge Production Tested Code

Our C implementation in `hashmap.c` was built strictly following **Test-Driven Development (TDD)** with 139 passing assertions.

```c
// djb2 Hash Algorithm in C
unsigned long hashmap_hash_djb2(const char* str) {
  unsigned long hash = 5381;
  int c;
  while ((c = (unsigned char)*str++)) {
    hash = ((hash << 5) + hash) + c; // * 33 + c
  }
  return hash;
}
```

:::code

:::notes
Demonstrate what happens if max_load_factor is exceeded or freed memory is accessed.
:::
