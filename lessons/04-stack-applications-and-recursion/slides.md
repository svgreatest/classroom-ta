---
theme: default
background: '#181816'
title: "Case study: text editor"
colorSchema: dark
highlighter: shiki
lineNumbers: true
wakeLock: false
---

# Implement Undo/Redo and an Expression Evaluator

Two core user-facing features we want to implement in our application:

<div class="grid grid-cols-2 gap-6 my-3">
<Card title="1. Undo & Redo History" type="info">

Users make edits and mistakes while typing.

- **Undo (`Ctrl+Z`)**: Reverts the most recent edit. Repeated undos walk backward through history.
- **Redo (`Ctrl+Y`)**: Re-applies the edit that was just undone.

*How do we track, reverse, and restore changes efficiently?*
</Card>

<Card title="2. Inline Expression Evaluator" type="tip">

Users write math expressions directly into their document:
$$\mathbf{(2 + 3) \times 4 - 6 / 2}$$

- **Evaluate (`Ctrl+E`)**: Computes the formula in-place respecting operator priority (parentheses, $\times$, $/$, $+$, $-$).

*How do we evaluate nested expressions in a single pass?*
</Card>
</div>

---

# Dijkstra's Train Yard Analogy
<span class="text-amber-500 font-medium text-sm">Visualizing Infix-to-Postfix Translation: Railroad Tracks as Data Structures</span>

<div class="grid grid-cols-12 gap-5 mt-3 items-start">
<div class="col-span-7">

<video src="/dijkstra_train_yard.mp4" poster="/dijkstra_train_yard.gif" autoplay loop muted playsinline controls class="w-full rounded-lg shadow-xl border border-neutral-700"></video>

<div class="mt-2 text-xs text-neutral-400 text-center">
  Animation: Converting <code class="text-amber-400 font-mono">2 + 3 * 4</code> into postfix <code class="text-emerald-400 font-mono">2 3 4 * +</code>
</div>

</div>

<div class="col-span-5 flex flex-col gap-2">

<Card title="1. The Main Line (Operands)" type="info">
Numbers roll straight across the junction directly onto the output line. Operands preserve their original sequence: <code>2</code>, <code>3</code>, <code>4</code>.
</Card>

<Card title="2. The Siding Spur (Stack)" type="warning">
Operators (<code>+</code>, <code>*</code>) divert into the dead-end siding track. Because of the bumper at the bottom, the <strong>last car in is the first that can reverse out (LIFO)</strong>.
</Card>

<Card title="3. Precedence & Departure" type="tip">
When <code>*</code> arrives, it has higher precedence than <code>+</code>, parking on top. At the end of input, <code>*</code> backs out first, then <code>+</code>, assembling <strong><code>2 3 4 * +</code></strong>.
</Card>

</div>
</div>
