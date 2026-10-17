---
addons:
  - "@/../../slidev"
theme: default
background: '#181816'
title: "03: Pointers to a Generic Stack"
colorSchema: dark
highlighter: shiki
lineNumbers: true
wakeLock: false
---

<Badge>Lesson 03</Badge>

# From a memory address to a stack that holds any type

<div class="roadmap mt-10">
  <div class="rm-step"><div class="rm-glyph">0x1000</div><div class="rm-name">Address</div><div class="rm-q">Where does data live?</div></div>
  <div class="rm-arrow">→</div>
  <div class="rm-step"><div class="rm-glyph">int *p</div><div class="rm-name">Pointer</div><div class="rm-q">How do we refer to it?</div></div>
  <div class="rm-arrow">→</div>
  <div class="rm-step"><div class="rm-glyph">malloc</div><div class="rm-name">Heap</div><div class="rm-q">How do we get more?</div></div>
  <div class="rm-arrow">→</div>
  <div class="rm-step"><div class="rm-glyph">realloc</div><div class="rm-name">Growth</div><div class="rm-q">What if it fills up?</div></div>
  <div class="rm-arrow">→</div>
  <div class="rm-step"><div class="rm-glyph">void*</div><div class="rm-name">Any type</div><div class="rm-q">What if we don't know T?</div></div>
  <div class="rm-arrow">→</div>
  <div class="rm-step rm-goal"><div class="rm-glyph">push / pop</div><div class="rm-name">GenericStack</div><div class="rm-q">A reusable library</div></div>
</div>

<div class="mt-10 text-xl text-[#d4cfc5]">
Each step answers one question. The last step uses all of them.
</div>

<style>
.roadmap { display: flex; align-items: stretch; gap: 0.4rem; }
.rm-step { flex: 1; padding: 0.8rem 0.6rem; border-radius: 0.6rem; background: #22221f; border: 1px solid #383733; text-align: center; }
.rm-goal { border-color: #cc785c; background: rgba(204, 120, 92, 0.15); }
.rm-glyph { font-family: var(--slidev-code-font, monospace); font-variant-ligatures: none; font-size: 1.15rem; color: #cc785c; }
.rm-name { margin-top: 0.4rem; font-size: 1.15rem; font-weight: 700; color: #faf6ee; }
.rm-q { margin-top: 0.3rem; font-size: 0.85rem; line-height: 1.3; color: #9e978c; }
.rm-arrow { align-self: center; color: #5c5a54; font-size: 1.4rem; }
</style>

<!--
The roadmap for today. Each box is one slide group; point back to it as you move along.
Next lesson we use the finished GenericStack to ship a real feature.
-->

---

# Why stacks: a real crash report

```text {all|2|3|4|5}
Program received signal SIGSEGV, Segmentation fault.
#0  send_request (req=0x0) at gateway.c:88    ← newest call, crashed here
#1  charge_card (amount=4999) at payment.c:17
#2  place_order (cart=0x4052a0) at checkout.c:42
#3  main () at main.c:9                       ← oldest call
```

<InIndustry where="gdb · lldb · crash reporters (Sentry, Crashlytics)" icon="🧯">
Calls pile up; the newest one fails first. That pile is a <strong>stack</strong>.
</InIndustry>

<!--
This is gdb's `bt` (backtrace) after a C program crashed: main called place_order, which called charge_card, which called send_request with a NULL pointer.
Click from #0 down: frame #0 is the newest call. We unwind in reverse order: last in, first out.
To build a stack in C we first need to talk about where data lives: memory and pointers.
-->

---

```yaml
clicks: 3
```

# Memory is one long street of numbered houses

<div class="mt-10">
<MemoryRow
  :step="$clicks"
  :cells="[
    { addr: '0x1000', value: '42', name: 'x', highlightAt: [1] },
    { addr: '0x1004', value: '7',  name: 'y' },
    { addr: '0x1008', value: '0x1000', name: 'p', pointsTo: 0, showAt: 2, highlightAt: [3] },
    { addr: '0x100C', value: '' },
    { addr: '0x1010', value: '' },
  ]"
/>
</div>

<div class="mt-6 text-2xl space-y-2">
<div v-click="1"><code>&x</code> is the <em>address</em> of x: <code>0x1000</code></div>
<div v-click="2"><code>int *p = &x;</code> stores that address in p</div>
<div v-click="3"><code>*p</code> follows the arrow and reads 42</div>
</div>

<TutorLink example="basics" label="Watch it in the C Memory Tutor" />

<!--
Each int takes 4 bytes. A pointer is just a variable whose value is an address.
& = "address of", * = "go to that address". Open the Tutor and step through basics.
-->

---

```yaml
clicks: 3
```

# Pointer arithmetic moves by `sizeof(T)`, not by 1

<div class="mt-8">
<MemoryRow
  :step="$clicks"
  :cells="[
    { addr: '0x2000', value: '10', name: 'a[0]', highlightAt: [0,1] },
    { addr: '0x2004', value: '20', name: 'a[1]', highlightAt: [2] },
    { addr: '0x2008', value: '30', name: 'a[2]', highlightAt: [3] },
    { addr: '0x200C', value: '40', name: 'a[3]' },
  ]"
/>
</div>

<div class="mt-6 text-2xl font-mono">
<div v-click="1"><code>int *p = a;</code> → 0x2000</div>
<div v-click="2"><code>p + 1</code> → 0x2004 &nbsp;<span class="opacity-60">(+4 bytes)</span></div>
<div v-click="3"><code>p + 2</code> → 0x2008</div>
</div>

$$\texttt{p + i} \;=\; \text{address}(p) + i \times \texttt{sizeof}(T) \qquad\qquad \texttt{a[i]} \equiv \texttt{*(a + i)}$$

<InIndustry where="Network stacks · file parsers (PNG, ZIP, TCP headers)" icon="📦">
Parsers walk raw byte buffers with pointer arithmetic. Off-by-one here = security bug.
</InIndustry>

---

<MCQ
  label="Check 1 · *p++"
  :code="[
    'int a[] = {10, 20, 30, 40, 50};',
    'int *p = a;',
    'int x = *p++;',
    'int y = ++*p;',
    'int z = *++p;'
  ]"
  question="What does printf(&quot;%d %d %d %d&quot;, x, y, z, a[1]) print?"
  :options="['10 20 30 20', '10 21 21 20', '10 21 30 21', '11 21 31 21']"
  answer="C"
  :timer="120"
  timer-title="2 min"
  tutor-example="quiz_basics"
>
  <template #explanation>
    <p><code>*p++</code> reads 10, then moves p to <code>a[1]</code>.</p>
    <p><code>++*p</code> is <code>++(*p)</code>: a[1] becomes 21.</p>
    <p><code>*++p</code> moves p to <code>a[2]</code> and reads 30.</p>
  </template>
</MCQ>

---

<MCQ
  label="Check 2 · Pointer subtraction"
  :code="[
    'int a[] = {10, 20, 30, 40, 50, 60};',
    'int *p1 = a + 1;   // points to 20',
    'int *p2 = a + 4;   // points to 50',
    'ptrdiff_t diff = p2 - p1;',
    'int val = *(p1 + diff - 1);'
  ]"
  question="What are diff and val?"
  :options="['diff = 12, val = 40', 'diff = 3, val = 40', 'diff = 3, val = 50', 'diff = 12, val = 50']"
  answer="B"
  :timer="120"
  timer-title="2 min"
  tutor-example="quiz_arithmetic"
>
  <template #explanation>
    <p>Subtracting pointers counts <strong>elements</strong>, not bytes: <Tex expr="\texttt{diff} = \dfrac{12 \text{ bytes}}{4 \text{ bytes per int}} = 3" /></p>
    <p><code>p1 + 2</code> points to <code>a[3]</code>, so val = 40.</p>
  </template>
</MCQ>

---

```yaml
clicks: 3
```

# Strings are `char` arrays ending in `'\0'`

<div class="mt-6">
<MemoryRow
  :step="$clicks"
  :cell-width="96"
  :cells="[
    { addr: '0x3000', value: `'c'`, name: 's[0]', highlightAt: [1] },
    { addr: '0x3001', value: `'a'`, name: 's[1]', highlightAt: [2] },
    { addr: '0x3002', value: `'t'`, name: 's[2]', highlightAt: [2] },
    { addr: '0x3003', value: `'\\0'`, name: 's[3]', highlightAt: [3] },
    { addr: '' },
    { addr: '0x3010', value: '0x3000', name: 'char *s', pointsTo: 0 },
  ]"
/>
</div>

<div class="grid grid-cols-2 gap-6 mt-4">

```c
char a[] = "cat";  // 4 bytes you own: a[0] = 'b' ✓
char *s  = "cat";  // points at a read-only literal:
                   // s[0] = 'b' crashes ✗
```

<div class="text-2xl space-y-2">
<div v-click="1"><code>*s</code> is <code>'c'</code>: one byte</div>
<div v-click="2"><code>s + 1</code> moves 1 byte</div>
<div v-click="3"><code>'\0'</code> marks the end: <code>while (*s) s++;</code></div>
</div>
</div>

<!--
A string is just a pointer to the first char; the length is found by walking to the 0 byte. That's why strlen is a loop and why a missing '\0' runs off the end (buffer overread).
Industry: many C security bugs (Heartbleed-style) are string/buffer walks gone wrong.
-->

---

<MCQ
  label="Check 3 · Strings"
  :code="[
    'char s[] = &quot;stack&quot;;',
    'char *p = s + 2;',
    'printf(&quot;%c %s&quot;, *p, p + 1);'
  ]"
  question="What is printed?"
  :options="['a ck', 't ack', 'a ack', 'c k']"
  answer="A"
  :timer="60"
  timer-title="60 s"
>
  <template #explanation>
    <p><code>p</code> points at <code>s[2]</code>, which is <code>'a'</code>, so <code>*p</code> prints <code>a</code>.</p>
    <p><code>%s</code> prints from <code>p + 1</code> up to <code>'\0'</code>: <code>ck</code>.</p>
  </template>
</MCQ>

---

```yaml
clicks: 3
```

# Double pointers: a pointer to a pointer

<div class="mt-8">
<MemoryRow
  :step="$clicks"
  :cells="[
    { addr: '0x1000', value: '42', name: 'val', highlightAt: [3] },
    { addr: '0x1004', value: '0x1000', name: 'int *ptr', pointsTo: 0, showAt: 1, highlightAt: [2] },
    { addr: '0x1008', value: '0x1004', name: 'int **pp', pointsTo: 1, showAt: 2 },
  ]"
/>
</div>

<div class="grid grid-cols-2 gap-6 mt-4">

```c
void set_null(int **pp) {
    *pp = NULL;   // changes the CALLER's pointer
}
set_null(&ptr);
```

<div class="text-2xl space-y-2">
<div v-click="1"><code>int *ptr = &val;</code></div>
<div v-click="2"><code>int **pp = &ptr;</code> → <code>*pp</code> is ptr</div>
<div v-click="3"><code>**pp</code> is val: two hops</div>
</div>
</div>

<TutorLink example="double_pointers" label="Step through double pointers" />

<!--
C passes arguments by value. To let a function change where YOUR pointer points (allocate for you, retarget it), pass its address: an int**.
Industry: every "out parameter" API: getline(&buf, &n, f), strtol(s, &end, 10), main(int argc, char **argv).
-->

---

<MCQ
  label="Check 4 · Double pointers"
  :code="[
    'void modify(int **p, int *q) {',
    '    *p = q;  **p = 40;',
    '}',
    'int a = 10, b = 20, *p1 = &a;',
    'modify(&p1, &b);'
  ]"
  question="What does printf(&quot;%d %d %d&quot;, a, b, *p1) print?"
  :options="['40 20 40', '10 20 40', '10 40 40', '40 40 40']"
  answer="C"
  :timer="120"
  timer-title="2 min"
  tutor-example="quiz_double_pointers"
>
  <template #explanation>
    <p><code>*p = q</code> retargets <code>p1</code> (in main) to <code>b</code>.</p>
    <p><code>**p = 40</code> writes into <code>b</code>. <code>a</code> is untouched: <code>10 40 40</code>.</p>
  </template>
</MCQ>

---

# Pointer to an array: `int (*row)[4]`

<div class="grid grid-cols-2 gap-8 mt-6">
<div>

```c
int m[3][4];          // 3 rows of 4 ints
int (*row)[4] = m;    // pointer to a whole row
row + 1;              // jumps 16 bytes: next row

int *arr[4];          // NOT the same: 4 pointers
```

</div>
<div class="row-grid">
  <div class="rg-label">row →</div><div class="rg-row hl"><span>1</span><span>2</span><span>3</span><span>4</span></div>
  <div class="rg-label">row + 1 →</div><div class="rg-row"><span>5</span><span>6</span><span>7</span><span>8</span></div>
  <div class="rg-label">row + 2 →</div><div class="rg-row"><span>9</span><span>10</span><span>11</span><span>12</span></div>
</div>
</div>

$$\texttt{row + i} = \text{address}(\texttt{row}) + i \times \texttt{sizeof(int[4])} \qquad \texttt{m[i][j]} \equiv \texttt{*(*(m + i) + j)}$$

<TutorLink example="arrays" label="Step through arrays in the Tutor" />

<style>
.row-grid { display: grid; grid-template-columns: auto 1fr; gap: 0.5rem 0.8rem; align-items: center; font-size: 1.4rem; }
.rg-label { font-family: 'JetBrains Mono', monospace; color: #d49b53; text-align: right; }
.rg-row { display: grid; grid-template-columns: repeat(4, 1fr); border: 2px solid #383733; border-radius: 0.4rem; }
.rg-row span { text-align: center; padding: 0.35rem 0; border-right: 1px solid #383733; font-family: 'JetBrains Mono', monospace; }
.rg-row span:last-child { border-right: none; }
.rg-row.hl { border-color: #cc785c; }
</style>

<!--
Memory is still one flat street: 12 ints in a row. The pointer's TYPE decides the step size: int* steps 4 bytes, int (*)[4] steps a whole 16-byte row.
The parentheses matter. The next slide shows how to read declarations like this.
-->

---

```yaml
clicks: 4
```

# Reading declarations (K&R §5.12)

<div class="text-xl opacity-80 mb-4">Start at the name. Go <strong>right</strong> (<code>[]</code>, <code>()</code>) before <strong>left</strong> (<code>*</code>). Parentheses first.</div>

<div class="space-y-6">
<DeclRead
  :step="$clicks"
  :tokens="[{t:'int',n:4},{t:'('},{t:'*',n:2},{t:'row',n:1},{t:')'},{t:'[4]',n:3}]"
  :say="['row is', 'a pointer to', 'an array of 4', 'ints']"
/>
<DeclRead
  :step="$clicks"
  :tokens="[{t:'int',n:4},{t:'*',n:3},{t:'arr',n:1},{t:'[4]',n:2}]"
  :say="['arr is', 'an array of 4', 'pointers to', 'int']"
/>
</div>

<div v-click="4" class="mt-6 grid grid-cols-2 gap-x-8 gap-y-1 text-lg font-mono">
<div><code>char **argv</code></div><div class="font-sans">pointer to pointer to char</div>
<div><code>void *comp()</code></div><div class="font-sans">function returning pointer to void</div>
<div><code>void (*comp)()</code></div><div class="font-sans">pointer to function returning void</div>
</div>

<!--
Same tokens, different order, totally different types: that's why int (*row)[4] needs the parentheses.
The table is from K&R §5.12 "Complicated Declarations". Ask the class to read void (*comp)() aloud before revealing.
Tool tip: cdecl.org translates declarations to English.
-->

---

<MCQ
  label="Check 5 · Row pointers"
  :code="[
    'int arr[3][4] = {{1,2,3,4}, {5,6,7,8}, {9,10,11,12}};',
    'int (*ptr)[4] = arr;',
    'ptr++;',
    'int first  = *(*ptr + 2);',
    'int second = *(*(ptr + 1) - 1);'
  ]"
  question="What are first and second?"
  :options="['first = 7, second = 11', 'first = 7, second = 8', 'first = 6, second = 9', 'first = 3, second = 7']"
  answer="B"
  :timer="120"
  timer-title="2 min"
  tutor-example="quiz_arrays"
>
  <template #explanation>
    <p><code>ptr++</code> jumps one whole row, to <code>{5, 6, 7, 8}</code>; <code>*ptr + 2</code> is <code>arr[1][2]</code> = 7.</p>
    <p><code>*(ptr + 1)</code> is <code>&amp;arr[2][0]</code>; one int back is <code>arr[1][3]</code> = 8.</p>
  </template>
</MCQ>

---

# The stack frame is small. The heap is big and yours to manage.

```c {1|2|3-4|5}
int *nums = malloc(4 * sizeof(int));     // ask the heap for 16 bytes
nums[0] = 10;                            // use it like an array
int *bigger = realloc(nums, 8 * sizeof(int));
if (bigger) nums = bigger;               // block may MOVE to a new address
free(nums);                              // give it back exactly once
```

<TutorLink example="dynamic_memory" label="Step through malloc / realloc / free" />

<!--
Local variables vanish when the function returns. malloc gives memory that lives until you free it.
Key teaching point for later: realloc may move the block.
-->

---

```yaml
clicks: 6
```

# How `realloc` grows a block

<div class="flex items-start gap-6">

```c
items = realloc(items, 4 * sizeof(int));
items[2] = 30;
```

<TutorLink example="realloc_moves" label="Step through what realloc does" />

</div>

<ReallocViz :step="$clicks" />

<!--
Click through the 7 steps. Stress: realloc = allocate new + copy + free old + return new address.
Optimisation worth mentioning: if the bytes right after the block are free, realloc can grow in place and skip the copy. You can't know which happens, so always use the returned pointer.
Industry link: C++ std::vector, Rust Vec and Go slices grow exactly this way; "iterator invalidation" is the dangling pointer in step 7.
-->

---

# `void*` — a pointer that forgot its type

```c {1|2|3-4}
void *raw = &x;                     // any address fits
// *raw;                            // ✗ compiler: how many bytes?
memcpy(&copy, raw, sizeof(int));    // ✓ you supply the size
```

<div class="mt-6 grid grid-cols-2 gap-6">
<InIndustry where="C standard library" icon="📚">
<code>malloc</code>, <code>memcpy</code>, <code>qsort</code> all speak <code>void*</code> + a size.
</InIndustry>
<InIndustry where="Linux kernel · Redis · SQLite" icon="🐧">
Generic containers in C = <code>void*</code> + <code>elem_size</code>.
</InIndustry>
</div>

<TutorLink example="void_pointers" label="Step through void* in the Tutor" />

---

<MCQ
  label="Check 6 · void* swap"
  :code="[
    'void generic_swap(void *a, void *b, size_t n) {',
    '    char t[16];',
    '    memcpy(t, a, n);  memcpy(a, b, n);  memcpy(b, t, n);',
    '}',
    'int arr[] = {10, 20, 30, 40};',
    'generic_swap(&arr[1], &arr[3], sizeof(int));'
  ]"
  question="What does arr hold now?"
  :options="['10 40 30 20', '10 20 30 40', '40 30 20 10', 'Segmentation fault']"
  answer="A"
  :timer="90"
  timer-title="90 s"
  tutor-example="quiz_void_pointers"
>
  <template #explanation>
    <p><code>memcpy</code> moves exactly <code>sizeof(int)</code> = 4 bytes through <code>t</code>.</p>
    <p>Elements 1 and 3 swap: <code>{10, 40, 30, 20}</code>. GenericStack copies items exactly this way.</p>
  </template>
</MCQ>

---

```yaml
clicks: 6
```

# The Stack: one rule

<div class="grid grid-cols-2 gap-8 items-center mt-4">
<StackViz :ops="['push 10','push 20','push 30','pop','push 40','pop']" :step="$clicks" />

<div class="text-2xl leading-relaxed">

**push** → add on top

**pop** → remove from top

**peek** → look at top

</div>
</div>

<!--
Click through slowly; ask the class to predict each pop before you click.
-->

---

<BigIdea kicker="LIFO">
Last in, first out.<br/>You can only touch the top.
</BigIdea>

---

# Where you've already used a stack today

<div class="grid grid-cols-2 gap-5 mt-6">
<InIndustry where="Your editor · Ctrl+Z" icon="↩️">Every edit is pushed; undo pops the latest.</InIndustry>
<InIndustry where="Browser Back button" icon="🌐">Each page you visit is pushed onto history.</InIndustry>
<InIndustry where="Function calls" icon="🧵">Each call pushes a frame; <code>return</code> pops it.</InIndustry>
<InIndustry where="Compilers · spreadsheets" icon="🧮">Parsing <code>(3 + 4) * 2</code> uses an operator stack.</InIndustry>
</div>

---

```yaml
clicks: 5
```

# Build it: `IntStack`

<div class="grid grid-cols-[1.25fr_1fr] gap-6 items-start">

```c {1-5|7-9|10-14|15|all}
typedef struct {
    int *items;     // heap array
    int capacity;   // slots allocated
    int top;        // slots used
} IntStack;

bool int_stack_push(IntStack *s, int v) {
    if (s->top == s->capacity) {
        // full → double
        int *bigger = realloc(s->items,
                  2 * s->capacity * sizeof(int));
        if (!bigger) return false;
        s->items = bigger;  s->capacity *= 2;
    }
    s->items[s->top++] = v;
    return true;
}
```

<div>
<StackViz :ops="['push 1','push 2','push 3','pop','push 4']" :capacity="2" :step="$clicks" />
<TutorLink example="int_stack" label="Run IntStack in the Tutor" />
</div>
</div>

<!--
Point at the sv-caption when capacity doubles. Doubling means copies are rare: most pushes just write one slot.
-->

---

<MCQ
  label="Check 7 · LIFO"
  context="Push 1, 2, 3, 4, 5 in order. You may pop at any time."
  question="Which output order is IMPOSSIBLE?"
  :options="['3 4 5 2 1', '2 4 3 5 1', '1 5 2 4 3', '4 5 3 2 1']"
  answer="C"
  :timer="90"
  timer-title="90 s"
  tutor-example="quiz_int_stack"
>
  <template #explanation>
    <p>After popping 1 then 5, the stack holds <code>2 3 4</code> with <code>4</code> on top.</p>
    <p><code>2</code> is buried — it can't come out before 4 and 3.</p>
  </template>
</MCQ>

---

# The interface: `generic_stack.h`

```c {all|1|3-6|8-9|11-12|all}
GenericStack *generic_stack_create(size_t elem_size, int initial_capacity);

// copies elem_size bytes IN from elem_addr
bool generic_stack_push(GenericStack *s, const void *elem_addr);
// copies the top element OUT into out_elem (pass NULL to discard)
bool generic_stack_pop (GenericStack *s, void *out_elem);

bool generic_stack_peek(const GenericStack *s, void *out_elem);
int  generic_stack_size(const GenericStack *s);

// frees the buffer and the stack itself
void generic_stack_destroy(GenericStack *s);
```

<div class="grid grid-cols-3 gap-4 mt-6 text-lg">
<Card title="You choose the type" type="info">

`elem_size = sizeof(T)` once, at create.

</Card>
<Card title="Values are copied" type="tip">

Push copies bytes in. Your variable can go away.

</Card>
<Card title="You own the stack" type="warning">

Every `create` needs one `destroy`.

</Card>
</div>

<!--
This is the contract users of the library rely on. They never touch elems, top or capacity.
Next lesson we build a feature using only these functions.
-->

---

# Inside: one stack for every type

```c {1-6|8-9|10-11|all}
typedef struct {
    void  *elems;      // raw bytes on the heap
    size_t elem_size;  // sizeof(T), chosen by the caller
    int    capacity;
    int    top;
} GenericStack;

// address of slot i = base + i * elem_size
char *slot = (char *)s->elems + s->top * s->elem_size;
memcpy(slot, elem_addr, s->elem_size);   // copy the bytes in
s->top++;
```

<TutorLink example="generic_stack" label="Push a struct through GenericStack" />

<!--
Everything from today combines here: heap (malloc/realloc), pointer arithmetic, void*, memcpy.
-->

---

# Same code, any type

```c
GenericStack *pts = generic_stack_create(sizeof(Point), 4);
Point p = { 3, 4 };
generic_stack_push(pts, &p);          // copies 8 bytes

GenericStack *names = generic_stack_create(sizeof(char *), 4);
char *who = "Ada";
generic_stack_push(names, &who);      // copies one pointer
```

<InIndustry where="Production C: Redis, nginx, SQLite, the Linux kernel" icon="🏭">
This "void* + elem_size" pattern is how C codebases build reusable containers.
</InIndustry>

---

<MCQ
  label="Check 8 · realloc"
  question="Before a push grows the stack, you saved int *top = &s->items[s->top - 1]. After the push, *top is…"
  :options="['Always still valid', 'Possibly dangling — realloc may have moved the block', 'A compile error', 'Freed by push automatically']"
  answer="B"
  :timer="60"
  timer-title="60 s"
  tutor-example="realloc_moves"
>
  <template #explanation>
    <p><code>realloc</code> may copy the data to a new address and free the old block.</p>
    <p>Pointers into the old buffer dangle — the same "iterator invalidation" bug as <code>std::vector</code>.</p>
  </template>
</MCQ>

---

<BigIdea kicker="Takeaway">
A generic stack is just a heap buffer, a size, and a top index — plus the discipline to only touch the top.
</BigIdea>
