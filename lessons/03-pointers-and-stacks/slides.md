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
# Off: Slidev's pen grabs the mouse and blocks the always-on laser (slidev/global-top.vue)
drawings:
  enabled: false
---

<a href="https://github.com/torvalds/linux/commit/499485a67fbacf4d9afbdb43522388c64f853428" target="_blank" class="commit-shot">
  <img src="/linux-assisted-by-commit.png" alt="Linux kernel commit 499485a with Assisted-by, Signed-off-by and Reviewed-by tags highlighted" />
</a>

<div class="commit-link">
  <a href="https://github.com/torvalds/linux/commit/499485a67fbacf4d9afbdb43522388c64f853428" target="_blank">github.com/torvalds/linux/commit/499485a</a>
</div>

<style>
.commit-shot img { display: block; max-height: 400px; width: auto; max-width: 100%; margin: 0 auto; border: 1px solid #383733; border-radius: 0.6rem; }
.commit-link { margin-top: 0.8rem; text-align: center; font-size: 1rem; }
.commit-link a { color: #cc785c; border-bottom: 1px solid #cc785c; }
</style>

<!--
HOOK (~2 min). A real Linux kernel commit, merged August 2026.

The bug: a NULL pointer dereference, with a call trace. Both are today's topics.
Two AI tools helped (Assisted-by: Claude, Codex). But the kernel's rules say
"AI agents MUST NOT add Signed-off-by tags" — only humans can certify the code.
So a human signed it, another human reviewed it, and the maintainer signed it again.

Point: AI can help write the code. A human who understands it has to vouch for it.
AI makes generating code cheap. Fundamentals make you valuable.

Sources: https://github.com/torvalds/linux/commit/499485a67fbacf4d9afbdb43522388c64f853428
         https://docs.kernel.org/process/coding-assistants.html
-->

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

```yaml
clicks: 5
```

# What is an address?

<script setup>
// One entry per click: the CPU instructions that line of C turns into.
// op: 'w' write to RAM, 'r' read from RAM, 'bad' read from memory we don't own
const steps = [
  [],
  [{ ins: 'STORE 42 → [0x4000]', op: 'w', addr: '0x4000', val: '42' }],
  [{ ins: 'LOAD [0x4000]', op: 'r', addr: '0x4000', val: '42' },
   { ins: 'STORE 42 → [0x7A10]', op: 'w', addr: '0x7A10', val: '42' }],
  [{ ins: 'STORE 0x4000 → [0x5008]', op: 'w', addr: '0x5008', val: '0x4000' }],
  [{ ins: 'LOAD [0x5008]', op: 'r', addr: '0x5008', val: '0x4000' },
   { ins: 'LOAD [0x4000]', op: 'r', addr: '0x4000', val: '42' }],
  [{ ins: 'LOAD [0x0007]', op: 'bad', addr: '0x0007', val: '✕' }],
]
const code = ['int x = 42;', 'int y = x;', 'int *p = &x;', 'int z = *p;', 'z = *(int *)7;']
// RAM contents after each click, by address
const ram = (c) => [
  { a: '0x0007', n: '', v: c === 5 ? 'not yours' : '', bad: c === 5 },
  { a: '0x4000', n: 'x', v: c >= 1 ? '42' : '' },
  { a: '0x5008', n: 'p', v: c >= 3 ? '0x4000' : '' },
  { a: '0x7A10', n: 'y', v: c >= 2 ? '42' : '' },
]
</script>

<div class="cr mt-6">
  <div class="cr-box">
    <div class="cr-label">C CODE</div>
    <div v-for="(l, i) in code" :key="i" class="cr-line" :class="{ now: $clicks === i + 1, done: $clicks > i + 1 }">{{ l }}</div>
  </div>

  <div class="cr-flow">→</div>

  <div class="cr-box cr-cpu">
    <div class="cr-label">CPU</div>
    <div v-for="(s, k) in steps[$clicks]" :key="`${$clicks}-${k}`" class="cr-ins" :class="s.op" :style="{ '--d': `${k * 1.4}s` }">{{ s.ins }}</div>
  </div>

  <div class="cr-wire">
    <div v-for="(s, k) in steps[$clicks]" :key="`${$clicks}-${k}`" class="cr-msg" :class="s.op" :style="{ '--d': `${k * 1.4 + 0.3}s`, top: `${k * 4.2}rem` }">
      <span v-if="s.op === 'w'">{{ s.val }} → {{ s.addr }}</span>
      <span v-else>{{ s.addr }}?</span>
      <span v-if="s.op !== 'w'" class="cr-back">← {{ s.val }}</span>
    </div>
  </div>

  <div class="cr-box cr-ram">
    <div class="cr-label">RAM</div>
    <template v-for="(r, i) in ram($clicks)" :key="r.a">
      <div v-if="i" class="cr-gap">⋮</div>
      <div class="cr-row" :class="{ hl: steps[$clicks].some(s => s.addr === r.a && s.op !== 'bad'), bad: r.bad }">
        <span class="cr-a">{{ r.a }}</span><span class="cr-v">{{ r.v }}</span><span class="cr-n">{{ r.n }}</span>
      </div>
    </template>
  </div>
</div>

<style>
.cr { display: grid; grid-template-columns: 215px 1.2rem 215px 1fr 215px; align-items: center; gap: 0.8rem; font-variant-ligatures: none; }
.cr-box { border: 2px solid #5c5a54; border-radius: 0.6rem; background: #22221f; padding: 0.7rem 0.8rem; min-height: 15rem; display: flex; flex-direction: column; gap: 0.35rem; }
.cr-cpu { border-color: #cc785c; }
.cr-label { font-size: 0.75rem; letter-spacing: 0.15em; color: #9e978c; margin-bottom: 0.3rem; }
.cr-line, .cr-ins { font-family: var(--slidev-code-font, monospace); }
.cr-line { font-size: 0.95rem; color: #5c5a54; padding: 0.15rem 0.3rem; border-radius: 0.3rem; transition: all 0.3s; background: none; }
.cr-line.done { color: #9e978c; }
.cr-ins { padding: 0.15rem 0.3rem; }
.cr-line.now { color: #faf6ee; background: rgba(204, 120, 92, 0.3); }
.cr-flow { color: #cc785c; font-size: 1.5rem; text-align: center; }
.cr-ins { font-size: 0.9rem; color: #faf6ee; opacity: 0; animation: cr-in 0.4s ease forwards; animation-delay: var(--d); background: none; }
.cr-ins.bad { color: #f43f5e; }
.cr-wire { position: relative; height: 15rem; }
.cr-msg { position: absolute; left: 0; right: 0; margin-top: 3rem; padding-bottom: 0.2rem; border-bottom: 2px dashed #5c5a54; display: flex; flex-direction: column; font-family: var(--slidev-code-font, monospace); font-size: 0.9rem; opacity: 0; animation: cr-in 0.3s ease forwards, cr-go 0.8s ease forwards; animation-delay: var(--d); }
.cr-msg span:first-child { color: #faf6ee; }
.cr-back { align-self: flex-end; position: absolute; right: 0; top: 2.1rem; color: #d49b53; opacity: 0; animation: cr-in 0.4s ease forwards; animation-delay: calc(var(--d) + 0.7s); }
.cr-msg.bad .cr-back { color: #f43f5e; }
.cr-row { display: grid; grid-template-columns: 4.2rem 1fr 1rem; align-items: center; height: 2.3rem; border: 1px solid #383733; padding: 0 0.4rem; font-family: var(--slidev-code-font, monospace); transition: background 0.3s, border-color 0.3s; }
.cr-row.hl { background: rgba(204, 120, 92, 0.3); border-color: #cc785c; }
.cr-row.bad { background: rgba(244, 63, 94, 0.2); border-color: #f43f5e; }
.cr-a { color: #9e978c; font-size: 0.8rem; }
.cr-v { color: #faf6ee; font-size: 1rem; text-align: center; }
.cr-row.bad .cr-v { color: #f43f5e; font-size: 0.8rem; }
.cr-n { color: #d49b53; font-weight: 700; text-align: right; }
.cr-gap { text-align: center; color: #5c5a54; line-height: 0.9rem; }
@keyframes cr-in { to { opacity: 1; } }
@keyframes cr-go { from { transform: translateX(-1.5rem); } to { transform: translateX(0); } }
</style>

<!--
WHAT AN ADDRESS MEANS (~4 min). Follow the flow left to right on every click:
C line → the CPU instruction(s) it becomes → a request on the wire → RAM.

The CPU can't search RAM. Every instruction that touches memory carries a NUMBER.
That number is the address.

Click 1  int x = 42;   one instruction: STORE 42 at 0x4000. "x" is just our name for 0x4000.
Click 2  int y = x;    TWO instructions: LOAD from 0x4000 (42 comes back), STORE it at 0x7A10.
                       y is NOT next to x. The compiler picks where variables live; never assume neighbours.
                       (Only array elements are guaranteed to sit side by side.)
Click 3  int *p = &x;  &x is just the number 0x4000. Storing it is an ordinary STORE, at p's address 0x5008.
Click 4  int z = *p;   TWO loads: first ask 0x5008 → get 0x4000; then ask 0x4000 → get 42.
                       That's what * means: "use this value as the next address".
Click 5  z = *(int *)7; The CPU happily asks for 0x0007. That memory isn't ours → the OS kills
                       the program: segmentation fault. Same failure class as CrowdStrike, later today.

STORE/LOAD are simplified names (x86 calls both "mov"). Addresses are made up.
No buses, caches, registers or virtual memory today.
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
char a[] = "cat";  // your copy
a[0] = 'b';        // ✓ fine

char *s  = "cat";  // read-only literal
s[0] = 'b';        // ✗ crashes
```

<div class="text-2xl space-y-2">
<div v-click="1"><code>*s</code> is <code>'c'</code>: one byte</div>
<div v-click="2"><code>s + 1</code> moves 1 byte</div>
<div v-click="3" class="whitespace-nowrap"><code>'\0'</code> marks the end: <code>while (*s) s++;</code></div>
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
    // changes the caller's ptr
    *pp = NULL;
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

<div class="grid grid-cols-[1.35fr_1fr] gap-6 mt-6">
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

<TutorLink example="arrays_2d" label="Step through a 2-D array in the Tutor" />

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
The parentheses matter. Read it with the declaration rule from the start of class.
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

```yaml
clicks: 4
```

# `void *memcpy(void *dest, const void *src, size_t n);`

<div class="mc-rows mt-14">
<MemoryRow
  :step="$clicks"
  :cells="[
    { addr: '0x2000', value: '2A', name: 'src', highlightAt: [1] },
    { addr: '0x2001', value: '00', highlightAt: [2] },
    { addr: '0x2002', value: '00', highlightAt: [3] },
    { addr: '0x2003', value: '00', highlightAt: [4] },
  ]"
/>
<div class="mc-arrow">↓</div>
<MemoryRow
  :step="$clicks"
  :cells="[
    { addr: '0x5000', value: '2A', name: 'dst', showAt: 1, highlightAt: [1] },
    { addr: '0x5001', value: '00', showAt: 2, highlightAt: [2] },
    { addr: '0x5002', value: '00', showAt: 3, highlightAt: [3] },
    { addr: '0x5003', value: '00', showAt: 4, highlightAt: [4] },
  ]"
/>
</div>

<style>
.mc-rows { display: flex; flex-direction: column; align-items: center; gap: 0.8rem; }
.mc-arrow { font-size: 2rem; color: #cc785c; }
</style>

<!--
NO TEXT ON PURPOSE. Let them narrate it. Argument order is dest first, then src (like dest = src).
Here: memcpy(dst, src, 4).
src holds the int 42 (0x2A) as 4 bytes, little-endian. Each click copies one byte.
Ask: "Does memcpy know this was an int?" No: it only sees an address and a byte count.
That's exactly how GenericStack stores any type: memcpy(target, elem_addr, elem_size).
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

# Find the bug

```c {all|5|all}
void apply_rule(char *fields[20]) {
    for (int i = 0; i < 20; i++)
        check(fields[i]);

    check(fields[20]);
}
```

<div v-click="2" class="cs-reveal">
19 July 2024: this bug, simplified, crashed <strong>8.5 million</strong> Windows PCs.
<div class="cs-who">CrowdStrike Falcon · Windows kernel driver</div>
</div>

<style>
.cs-reveal { margin-top: 2rem; font-size: 1.6rem; color: #faf6ee; }
.cs-reveal strong { color: #cc785c; }
.cs-who { margin-top: 0.4rem; font-size: 1rem; color: #9e978c; }
</style>

<!--
WHY POINTERS MATTER (~3 min). Show the code, ask: "What's wrong?" Give them 30 s.

Click 1: fields[20] is *(fields + 20), one slot past the end. C computes the
address and never checks it. Out-of-bounds read.

Click 2: CrowdStrike, 19 July 2024. A content update (Channel File 291) gave the
kernel driver 21 input fields; the code supplied 20 values and read the 21st.
In the kernel that's a blue screen, then a boot loop. ~8.5 million devices,
many fixed by hand in Safe Mode. (Often called a "NULL pointer bug"; the official
root-cause report says out-of-bounds read.)

Bridge: our push writes base + top * elem_size by hand. Which line stops us
going past the end? (The top >= capacity check.)

Sources: https://www.crowdstrike.com/wp-content/uploads/2024/08/Channel-File-291-Incident-Root-Cause-Analysis-08.06.2024.pdf
         https://blogs.microsoft.com/blog/2024/07/20/helping-our-customers-through-the-crowdstrike-outage/
-->

---

# Pointer code that survives production

<div class="adv mt-8">
<v-clicks>

<div><code>int *p = NULL;</code><span>Never leave a pointer uninitialised</span></div>
<div><code>if (!p) return ERR;</code><span>Check every <code>malloc</code> / <code>realloc</code></span></div>
<div><code>f(buf, len)</code><span>A pointer travels with its length</span></div>
<div><code>free(p); p = NULL;</code><span>One owner frees, exactly once</span></div>
<div><code>-Wall -Wextra -fsanitize=address</code><span>Let the tools find it first</span></div>

</v-clicks>
</div>

<style>
.adv > div { display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; align-items: center; padding: 0.55rem 0; border-bottom: 1px solid #383733; font-size: 1.25rem; }
.adv code { font-variant-ligatures: none; }
.adv span { color: #d4cfc5; }
</style>

<!--
PRACTICAL ADVICE (~3 min). One line each; give a quick story where you have one.
- NULL init: a garbage pointer looks valid; NULL crashes loudly and early.
- Check allocations: tmp = realloc(p, n) so a failure doesn't lose p (our push does this).
- Pointer + length: the CrowdStrike bug was a read past a known size. strncpy, snprintf, memcpy all take n.
- Ownership: decide who frees. Document it in the header. Setting p = NULL turns a double free into a no-op.
- Tools: AddressSanitizer and Valgrind catch out-of-bounds and use-after-free in seconds.
  Real codebases also add code review, fuzzing (Linux syzkaller) and static analysis (clang-tidy, Coverity).
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
Now we build that pile ourselves.
-->

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

# Where you've already used a stack today

<div class="grid grid-cols-2 gap-5 mt-6">
<InIndustry where="Your editor · Ctrl+Z" icon="↩️">Every edit is pushed; undo pops the latest.</InIndustry>
<InIndustry where="Browser Back button" icon="🌐">Each page you visit is pushed onto history.</InIndustry>
<InIndustry where="Function calls" icon="🧵">Each call pushes a frame; <code>return</code> pops it.</InIndustry>
<InIndustry where="Compilers · spreadsheets" icon="🧮">Parsing <code>(3 + 4) * 2</code> uses an operator stack.</InIndustry>
</div>
