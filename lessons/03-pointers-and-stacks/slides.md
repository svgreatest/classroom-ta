---
theme: default
background: '#181816'
title: "03: Pointers & Physical Memory"
colorSchema: dark
highlighter: shiki
lineNumbers: true
wakeLock: false
---

<h1 class="text-3xl font-bold text-slate-100">Physical RAM & Architecture</h1>
<Badge>Systems Architecture • Memory Model</Badge>

<div class="grid grid-cols-2 gap-4 my-2">
<Card title="The Contiguous Byte Street" type="info">

RAM is physically organized as a linear array of **1-byte cells** (8 bits each).

Every byte has a unique numeric **Address** in hexadecimal:  
`0x1000`, `0x1001`, `0x1002`, `0x1003`, ...

Think of RAM as a long street where each byte is a house, and its numeric address is the house number!
</Card>

<Card title="Anatomy of a C Program in RAM" type="tip">

The OS divides program address space into dedicated zones:
- **Text / Code**: Read-only machine instructions.
- **Data / BSS**: Global and static variables.
- **Heap**: Dynamic memory via `malloc()` and `free()`.
- **Stack**: Fast scratch space for function call frames.
</Card>
</div>

<!--
Welcome students. In this lecture, we build data structures from the silicon up.
Notice: a variable's type tells the compiler two things: how many bytes to reserve, and how to interpret the bits stored inside those bytes!
-->

---

# Basic Pointers: Addresses & Dereferencing
<Badge>Building Block 1 • Memory Pointers</Badge>

A **pointer** is simply a variable whose value is the **memory address** of another variable!

<div class="grid grid-cols-2 gap-4 my-2">
<Card title="& Operator (&quot;Address-Of&quot;)" type="info">

**"Where is this variable located in RAM?"**
- `&target` evaluates to the address of `target`.
- If `target` is an `int`, `&target` is `int*`.
```c
int target = 42;
int *ptr = &target; // ptr holds 0x7FFEE4
```
</Card>

<Card title="* Operator (&quot;Dereference&quot;)" type="tip">

**"Follow the arrow and mutate what is inside!"**
- `*ptr` jumps to the address and touches the bytes.
- Direct physical mutation across memory:
```c
*ptr = 99; // target is now 99!
```
</Card>
</div>

<TutorLink example="basics" label="Step Through Basic Pointers in C Memory Tutor" />

<!--
Pedagogical distinction: '*' has two meanings in C syntax:
1. In a declaration (int *ptr), it declares a pointer type.
2. In an expression (*ptr = 99), it performs a dereference (reads/writes target).
-->

---

# Pointer Arithmetic: Scaling by sizeof(T)
<Badge>Building Block 2 • Address Offsets</Badge>

When you add `1` to an integer, it increments by 1.  
**When you add `1` to a pointer `T*`, the CPU advances the address by $\mathtt{sizeof}(T)$ bytes!**

<div class="grid grid-cols-2 gap-4 my-2">
<Card title="The Scaling Rule" type="info">

$$\mathtt{p + i} = \text{Address}(p) + (i \times \mathtt{sizeof}(*p))$$

- For `char*` (1 byte): `p + 1` advances by **1 byte**.
- For `int*` (4 bytes): `p + 1` advances by **4 bytes**.
- For `double*` (8 bytes): `p + 1` advances by **8 bytes**.
</Card>

<Card title="Pointer Walking" type="tip">

Because addition scales by type size, you can step through contiguous array elements by simply incrementing the pointer:

```c
int *p = numbers;
int first  = *p++; // Reads element, advances 4 bytes
int second = *p++; // Reads next element
```
</Card>
</div>

<TutorLink example="pointer_arithmetic" label="Step Through Pointer Arithmetic in C Memory Tutor" />

<!--
Emphasize why pointer arithmetic is type-safe: you navigate logical elements rather than calculating raw byte offsets by hand.
-->

---

## Understanding Check: Pointer Dereference & Precedence
<Badge>Concept Check 1 • Operators & Side Effects</Badge>

<MCQ
  context="Consider the following C code snippet executing on an array:"
  :code="[
    'int a[] = {10, 20, 30, 40, 50};',
    'int *p = a;',
    ' ',
    'int x = *p++;',
    'int y = ++*p;',
    'int z = *++p;'
  ]"
  question="What will be printed by printf(&quot;%d %d %d %d&quot;, x, y, z, a[1]);?"
  :options="[
    'A) 10 20 30 20',
    'B) 10 21 21 20',
    'C) 10 21 30 21',
    'D) 11 21 31 21'
  ]"
  answer="C"
  :timer="120"
  timer-title="Concept Check 1 • 2-Min Timer"
  tutor-example="quiz_basics"
  tutor-label="Step Through Quiz 1 in C Memory Tutor"
>
  <template #explanation>
    <ol class="text-xs space-y-1">
      <li><code>*p++</code>: Postfix <code>++</code> has higher precedence than <code>*</code>. Evaluates to <code>*p</code> (<code>10</code>), then advances <code>p</code> to <code>&a[1]</code>.</li>
      <li><code>++*p</code>: Prefix <code>++</code> and <code>*</code> associate right-to-left: <code>++(*p)</code>. <code>a[1]</code> becomes <code>21</code>, <code>y = 21</code>.</li>
      <li><code>*++p</code>: Increments <code>p</code> to <code>&a[2]</code>, dereferences to <code>30</code> (<code>z = 30</code>).</li>
      <li><code>a[1]</code> remains <code>21</code> due to step 2!</li>
    </ol>
  </template>
</MCQ>

---

## Understanding Check: Pointer Subtraction & ptrdiff_t
<Badge>Concept Check 2 • Pointer Differences</Badge>

<MCQ
  context="Now that you know pointers scale by sizeof(T), consider pointer subtraction in C:"
  :code="[
    '#include <stdio.h>',
    '#include <stddef.h>',
    'int a[] = {10, 20, 30, 40, 50, 60};',
    'int *p1 = a + 1; // points to 20',
    'int *p2 = a + 4; // points to 50',
    ' ',
    'ptrdiff_t diff = p2 - p1;',
    'int val = *(p1 + diff - 1);'
  ]"
  question="What will be the values of diff and val?"
  :options="[
    'A) diff = 12, val = 40',
    'B) diff = 3,  val = 40',
    'C) diff = 3,  val = 50',
    'D) diff = 12, val = 50'
  ]"
  answer="B"
  :timer="120"
  timer-title="Concept Check 2 • 2-Min Timer"
  tutor-example="quiz_arithmetic"
  tutor-label="Step Through Quiz 2 in C Memory Tutor"
>
  <template #explanation>
    <ol class="text-xs space-y-1">
      <li>In C, pointer subtraction <code>p2 - p1</code> returns the count of <strong>elements</strong> of type <code>T</code> between them, not raw byte count!</li>
      <li>$$\mathtt{diff} = \frac{12 \text{ bytes}}{4 \text{ bytes/int}} = 3$$</li>
      <li><code>p1 + diff - 1 = p1 + 2</code> points to <code>a[3] = 40</code>. Result: <code>diff = 3, val = 40</code>.</li>
    </ol>
  </template>
</MCQ>

---

# Dynamic Memory Allocation: malloc, calloc & realloc
<Badge>Building Block 3 • Heap Memory Management</Badge>

Stack variables are transient—they are destroyed when the function returns.  
**To allocate data that survives function returns or has dynamic size, request memory from the Heap!**

<div class="grid grid-cols-2 gap-4 my-2">
<Card title="1. malloc vs calloc" type="info">

- `malloc(total_bytes)`:
  Contiguous raw bytes on heap. **Uninitialized** (garbage bytes).
  ```c
  int *p = (int*)malloc(5 * sizeof(int)); // 20 bytes
  ```
- `calloc(n, size)`:
  Contiguous heap memory **cleared to zero** (`0x00`).
  ```c
  int *p = (int*)calloc(5, sizeof(int));  // 20 zeroed bytes
  ```
</Card>

<Card title="2. realloc & The Golden Rule of free" type="tip">

- `realloc(ptr, new_bytes)`:
  Resizes heap block. Expands in place or moves to new address.
  ```c
  int *temp = (int*)realloc(p, 10 * sizeof(int));
  if (temp != NULL) p = temp;
  ```
- **The Golden Rule**: Every `malloc`/`calloc` MUST be paired with `free(p)`! Always set `p = NULL` afterward to avoid dangling pointers.
</Card>
</div>

<TutorLink example="dynamic_memory" label="Step Through Dynamic Memory in C Memory Tutor" />

---

# Double Pointers: Pointers to Pointers (**)
<Badge>Building Block 4 • Multiple Indirection</Badge>

What happens when a function needs to modify where a pointer points? We use a **double pointer** (`**`).

<div class="grid grid-cols-2 gap-4 my-2">
<Card title="Memory Chains & Two-Hop Arrows" type="info">

```c
int val = 42;
int *ptr = &val;     // ptr holds &val (0x1000)
int **pptr = &ptr;   // pptr holds &ptr (0x2000)
```
- Box 1: `val` stores `42` at `0x1000`.
- Box 2: `ptr` stores `0x1000` at `0x2000`.
- Box 3: `pptr` stores `0x2000` at `0x3000`.
</Card>

<Card title="Dereferencing & Scope Mutability" type="tip">

- `*pptr`: One hop $\to$ yields `ptr` (`0x1000`).
- `**pptr`: Two hops $\to$ touches `val` (`42`)!
- Mutating: `**pptr = 999` directly modifies `val`!

*Why double pointers?* In C, arguments pass by value. To let a helper function allocate memory or retarget a caller's pointer, you must pass `&ptr` as `int**`!
</Card>
</div>

<TutorLink example="double_pointers" label="Step Through Double Pointers in C Memory Tutor" />

---

## Understanding Check: Cross-Frame Pointer Mutation
<Badge>Concept Check 3 • Double Pointers & Function Scope</Badge>

<MCQ
  context="Consider this classic problem involving double pointers and function calls:"
  :code="[
    'void modify(int **p, int *q) {',
    '    *p = q;',
    '    **p = 40;',
    '}',
    'int main() {',
    '    int a = 10, b = 20;',
    '    int *p1 = &a;',
    '    modify(&p1, &b);',
    '    printf(&quot;%d %d %d&quot;, a, b, *p1);',
    '}'
  ]"
  question="What is printed by the program?"
  :options="[
    'A) 40 20 40',
    'B) 10 20 40',
    'C) 10 40 40',
    'D) 40 40 40'
  ]"
  answer="C"
  :timer="120"
  timer-title="Concept Check 3 • 2-Min Timer"
  tutor-example="quiz_double_pointers"
  tutor-label="Step Through Quiz 3 in C Memory Tutor"
>
  <template #explanation>
    <ol class="text-xs space-y-1">
      <li><code>main</code> passes <code>&p1</code> (address of pointer <code>p1</code>). Inside <code>modify</code>, <code>p</code> points to <code>p1</code>.</li>
      <li><code>*p = q;</code> accesses <code>p1</code> in <code>main</code>'s frame and retargets it to <code>b</code>.</li>
      <li><code>**p = 40;</code> writes <code>40</code> directly into <code>b</code>!</li>
      <li><code>a</code> was untouched (<code>10</code>). <code>b</code> is <code>40</code>. <code>*p1</code> is <code>40</code>. Output: <code>10 40 40</code>.</li>
    </ol>
  </template>
</MCQ>

---

# Arrays in Memory & The Array Decay Rule
<Badge>Building Block 5 • Contiguous Memory & Multidimensional Layout</Badge>

In C, an array is a **single, unbroken contiguous sequence of memory cells** stored without extra overhead, bounds checking, or length metadata.

<div class="grid grid-cols-2 gap-4 my-2">
<Card title="1D Array Decay & Indexing Identity" type="info">

```c
int a[3] = {10, 20, 30};
int *p = a; // Decays to &a[0]
```
- **Array Decay**: `a` decays to pointer to element 0 (`&a[0]`).
- **Bracket Identity**: $a[i] \equiv *(a + i)$. Commutative: `i[a]` is identical!
- **Byte Stride**: `p + 1` advances by `sizeof(int) = 4` bytes.
</Card>

<Card title="Multidimensional 2D Arrays & Row Pointers" type="tip">

```c
int matrix[3][4];           // 3 rows × 4 cols (48 bytes)
int (*row_ptr)[4] = matrix; // Pointer to row of 4 ints!
```
- **Row Stride**: `row_ptr + 1` advances by 16 bytes.
- **2D Identity**: $m[i][j] \equiv *(*(m + i) + j)$.
- **Critical Syntax**: `int (*ptr)[4]` is a row pointer; `int *ptr[4]` is an array of 4 pointers.
</Card>
</div>

<TutorLink example="arrays" label="Step Through Arrays in C Memory Tutor" />

---

## Understanding Check: 2D Array Pointer Offsets
<Badge>Concept Check 4 • Multidimensional Pointer Decay</Badge>

<MCQ
  context="Consider this tricky question testing 2D array memory layout:"
  :code="[
    'int arr[3][4] = {',
    '    {1,  2,  3,  4},',
    '    {5,  6,  7,  8},',
    '    {9, 10, 11, 12}',
    '};',
    'int (*ptr)[4] = arr;',
    'ptr++;',
    'int first = *(*ptr + 2);',
    'int second = *(*(ptr + 1) - 1);'
  ]"
  question="What are the values of first and second?"
  :options="[
    'A) first = 7,  second = 11',
    'B) first = 7,  second = 8',
    'C) first = 6,  second = 9',
    'D) first = 3,  second = 7'
  ]"
  answer="B"
  :timer="120"
  timer-title="Concept Check 4 • 2-Min Timer"
  tutor-example="quiz_arrays"
  tutor-label="Step Through Quiz 4 in C Memory Tutor"
>
  <template #explanation>
    <ol class="text-xs space-y-1">
      <li><code>int (*ptr)[4]</code> points to rows of 4 ints. <code>ptr++</code> advances to row 1 (<code>{5, 6, 7, 8}</code>).</li>
      <li><code>*ptr + 2</code> points to <code>arr[1][2] = 7</code>, so <code>first = 7</code>.</li>
      <li><code>*(ptr + 1)</code> is <code>&arr[2][0]</code>. Subtracting <code>1</code> moves back 1 int to <code>arr[1][3] = 8</code>!</li>
      <li>Result: <code>first = 7, second = 8</code>.</li>
    </ol>
  </template>
</MCQ>

---

# Void Pointers (void*): The Universal Byte Pointer
<Badge>Building Block 6 • Generic Memory</Badge>

In C, how can we reference memory when we don't know the data type in advance? We use a **void pointer** (`void*`).

<div class="grid grid-cols-2 gap-4 my-2">
<Card title="What is void*?" type="info">

- A `void*` is a generic pointer that can hold the address of **any data type** without casting:
  ```c
  void *vp;
  int x = 42;
  double d = 3.14;
  vp = &x; // Perfectly valid
  vp = &d; // Also perfectly valid!
  ```
</Card>

<Card title="Strict Rules of void*" type="caution">

Because `void` has no size (`sizeof(void)` is unknown):
1. **You CANNOT dereference `*vp` directly** (Compile error!).
2. **You CANNOT perform arithmetic `vp + 1` directly**.
3. **To step by bytes**: cast to `(char*)vp + offset`!
4. **To copy memory**: use `memcpy(dest, src, num_bytes)`.
</Card>
</div>

<TutorLink example="void_pointers" label="Step Through Void Pointers in C Memory Tutor" />

---

## Understanding Check: Generic Memory Swap with void*
<Badge>Concept Check 5 • Generic Memory & memcpy</Badge>

<MCQ
  context="Consider the following implementation of a type-agnostic swap function in C:"
  :code="[
    '#include <stdio.h>',
    '#include <string.h>',
    'void generic_swap(void *a, void *b, size_t size) {',
    '    char temp[16];',
    '    memcpy(temp, a, size);',
    '    memcpy(a, b, size);',
    '    memcpy(b, temp, size);',
    '}',
    'int main() {',
    '    int arr[] = {10, 20, 30, 40};',
    '    generic_swap(&arr[1], &arr[3], sizeof(int));',
    '    printf(&quot;%d %d %d %d&quot;, arr[0], arr[1], arr[2], arr[3]);',
    '}'
  ]"
  question="What will be printed when this program runs?"
  :options="[
    'A) 10 40 30 20',
    'B) 10 20 30 40',
    'C) 40 30 20 10',
    'D) Segmentation fault'
  ]"
  answer="A"
  :timer="120"
  timer-title="Concept Check 5 • 2-Min Timer"
  tutor-example="quiz_void_pointers"
  tutor-label="Step Through Quiz 5 in C Memory Tutor"
>
  <template #explanation>
    <ol class="text-xs space-y-1">
      <li><code>&arr[1]</code> and <code>&arr[3]</code> are passed into <code>void*</code> pointers.</li>
      <li><code>memcpy</code> moves exactly <code>sizeof(int) = 4</code> bytes via scratch buffer <code>temp</code>.</li>
      <li>Elements at index 1 and 3 swap cleanly: <code>arr</code> is <code>{10, 40, 30, 20}</code>.</li>
    </ol>
  </template>
</MCQ>

---

# The Stack Data Structure: The Cafeteria Plate Analogy
<Badge>Core Data Structure • The Plate Dispenser</Badge>

Imagine a **spring-loaded tray dispenser of cafeteria plates** in a dining hall:

<div class="grid grid-cols-2 gap-4 my-2">
<Card title="The Cafeteria Plate Rules" type="info">

- **Push (Add a Plate)**: You place a clean plate onto the top of the stack. The spring compresses.
- **Pop (Take a Plate)**: A diner takes the plate sitting on the very top.
- **LIFO (Last-In, First-Out)**: The plate placed on top most recently is the first one taken!
- **Physical Constraint**: You can **never** pull a plate out from the middle without breaking the stack!
</Card>

<Card title="Systems Applications of the Stack" type="tip">

- **CPU Call Stack**: Function call frames (local variables, return address) are pushed and popped.
- **Undo / Redo Buffer**: Actions are pushed; Ctrl+Z pops the most recent action.
- **Syntax Matching**: Checking balanced parentheses `((()))` in compilers.
</Card>
</div>

---

# Building an Integer Stack in C (IntStack)
<Badge>Implementation Architecture • Dynamic Memory</Badge>

```c
typedef struct { int *items; int capacity, top; } IntStack;
```

<div class="grid grid-cols-2 gap-4 my-2">
<Card title="Push Operation" type="info">

```c
void push(IntStack *s, int plate) {
    if (s->top == s->capacity) {
        s->capacity *= 2;
        s->items = realloc(s->items, s->capacity * sizeof(int));
    }
    s->items[s->top++] = plate;
}
```
</Card>

<Card title="Pop Operation" type="tip">

```c
int pop(IntStack *s) {
    if (s->top == 0) return -1; // Empty
    return s->items[--s->top];
}
```
When `top == 0`, the dispenser is empty!
</Card>
</div>

<TutorLink example="int_stack" label="Step Through IntStack in C Memory Tutor" />

---

## Understanding Check: Stack Permutation Validity
<Badge>Concept Check 6 • LIFO Permutation Constraints</Badge>

<MCQ
  context="A stack initially empty is subjected to push operations for elements 1, 2, 3, 4, 5 in that exact order. Elements may be popped at any intermediate step."
  question="Which of the following output sequences is IMPOSSIBLE to generate?"
  :options="[
    'A) 3, 4, 5, 2, 1',
    'B) 2, 4, 3, 5, 1',
    'C) 1, 5, 2, 4, 3',
    'D) 4, 5, 3, 2, 1'
  ]"
  answer="C"
  :timer="120"
  timer-title="Concept Check 6 • 2-Min Timer"
  tutor-example="quiz_int_stack"
  tutor-label="Step Through Quiz 6 in C Memory Tutor"
>
  <template #explanation>
    <ol class="text-xs space-y-1">
      <li>Outputting <code>1</code> pops <code>1</code> immediately.</li>
      <li>To output <code>5</code>, elements <code>2, 3, 4, 5</code> must be pushed.</li>
      <li>Popping <code>5</code> leaves <code>4</code> on the top of the stack, followed by <code>3</code> and <code>2</code>.</li>
      <li>Under LIFO discipline, <code>4</code> and <code>3</code> must be popped before <code>2</code> can ever be reached! Outputting <code>2</code> next is physically impossible.</li>
    </ol>
  </template>
</MCQ>

---

# Building a Generic Stack in C

A generic stack stores raw bytes using `void*` and `memcpy`; callers cast the popped pointer back to their concrete type.

<div class="grid grid-cols-2 gap-4 my-2">
<Card title="1. Generic Push & Pop" type="info">

```c
void push(GenericStack *s, const void *elem) {
    int offset = s->top * s->elem_size;
    void *target = (char*)s->elems + offset;
    memcpy(target, elem, s->elem_size);
    s->top++;
}
void* pop(GenericStack *s) {
    if (s->top == 0) return NULL;
    int offset = --s->top * s->elem_size;
    return (char*)s->elems + offset;
}
```
Push copies bytes into offset; Pop decrements and returns `void*`.
</Card>

<Card title="2. Type Restoration via Casting" type="tip">

```c
// Store & retrieve int: elem_size = 4
GenericStack *s = create_stack(sizeof(int), 4);
int val = 42; push(s, &val);
int popped = *(int*)pop(s); // void* -> int*

// Store & retrieve char: elem_size = 1
GenericStack *cs = create_stack(sizeof(char), 4);
char letter = 'Z'; push(cs, &letter);
char ch = *(char*)pop(cs);   // void* -> char*
```
Flat buffers hold no types; caller must cast explicitly.
</Card>
</div>

---

# Comprehensive Summary: Pointers, Memory & Stacks
<Badge>Lecture Review • Key Takeaways & Cheatsheet</Badge>

Here is your end-to-end mental model for low-level memory management and generic data structures in C:

<div class="grid grid-cols-2 gap-4 my-2">
<Card title="1. Pointer Mechanics & Traps" type="info">

- **Address vs Value**: `&x` extracts location; `*p` reads/writes the target.
- **Scaling Rule**: `p + 1` advances by $\mathtt{sizeof}(*p)$ bytes automatically.
- **Pointer Difference**: `p2 - p1` returns the count of typed elements (`ptrdiff_t`).
- **Double Pointers (`**`)**: Required when a helper function must alter where a caller's pointer points.
- **Trap**: Always match `malloc` with `free(p)` and reset to `NULL` to avoid dangling pointers.
</Card>

<Card title="2. Arrays, void* & Generic Data Structures" type="tip">

- **Array Decay**: 1D arrays decay to `&a[0]`; 2D arrays decay to row pointer `int (*)[C]`.
- **Bracket Identity**: $a[i] \equiv *(a + i)$ and $m[i][j] \equiv *(*(m + i) + j)$.
- **Void Pointers (`void*`)**: Universal memory. Cast to `char*` for byte arithmetic; move memory via `memcpy`.
- **Generic Stack**: LIFO plate dispenser backed by a flat heap buffer (`void* elems`), parameterized by `elem_size`.
</Card>
</div>
