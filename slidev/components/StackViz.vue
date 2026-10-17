<script setup lang="ts">
import { computed } from 'vue'
import { simulateStack } from './stack-sim'

// Usage on a slide (frontmatter `clicks: 5`):
//   <StackViz :ops="['push 10','push 20','pop','push 30','push 40']" :step="$clicks" />
const props = withDefaults(
  defineProps<{
    ops?: string[]
    step?: number
    capacity?: number
    title?: string
    slotWidth?: string
    showMeta?: boolean
  }>(),
  {
    ops: () => [],
    step: undefined,
    capacity: 4,
    title: '',
    slotWidth: '9rem',
    showMeta: true,
  }
)

const state = computed(() =>
  simulateStack(props.ops, props.step ?? props.ops.length, props.capacity)
)

// Slots drawn top-down so index 0 (the bottom) sits at the bottom of the box.
const slots = computed(() => {
  const { items, capacity } = state.value
  return Array.from({ length: capacity }, (_, i) => capacity - 1 - i).map(idx => ({
    idx,
    value: items[idx],
    isTop: idx === items.length - 1,
  }))
})
</script>

<template>
  <div class="stackviz select-none" :class="`last-${state.last.kind}`">
    <div v-if="title" class="sv-title">{{ title }}</div>
    <div class="sv-body">
      <div class="sv-box" :key="state.capacity">
        <div
          v-for="slot in slots"
          :key="slot.idx"
          class="sv-slot"
          :style="{ width: slotWidth }"
          :class="{ filled: slot.value !== undefined, top: slot.isTop }"
        >
          <span class="sv-index">[{{ slot.idx }}]</span>
          <span class="sv-value">{{ slot.value ?? '' }}</span>
          <span v-if="slot.isTop" class="sv-top">← top</span>
        </div>
      </div>
      <div v-if="showMeta" class="sv-meta">
        <div><span class="k">size</span> {{ state.items.length }}</div>
        <div><span class="k">capacity</span> {{ state.capacity }}</div>
      </div>
    </div>
    <div class="sv-caption font-mono">{{ state.last.message }}</div>
  </div>
</template>

<style scoped>
.stackviz {
  font-variant-ligatures: none;
  display: inline-flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.6rem;
}

.sv-title {
  color: #d49b53;
  font-weight: 700;
  font-size: 1.1rem;
}

.sv-body {
  display: flex;
  align-items: flex-end;
  gap: 1.25rem;
}

.sv-box {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 6px;
  border: 3px solid #5c5a54;
  border-top: none;
  border-radius: 0 0 10px 10px;
  animation: pop-in 0.35s ease;
}

.last-grow .sv-box {
  border-color: #d49b53;
}

.sv-slot {
  position: relative;
  height: 2.6rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  border: 2px dashed #383733;
  transition: background 0.25s ease, border-color 0.25s ease;
}

.sv-slot.filled {
  border: 2px solid #cc785c;
  background: rgba(204, 120, 92, 0.18);
}

.sv-slot.top {
  background: rgba(204, 120, 92, 0.38);
}

.last-push .sv-slot.top,
.last-grow .sv-slot.top {
  animation: drop-in 0.35s ease;
}

.sv-index {
  position: absolute;
  left: 0.4rem;
  font-family: monospace;
  font-size: 0.8rem;
  color: #78716c;
}

.sv-value {
  font-family: var(--slidev-code-font, monospace);
  font-size: 1.5rem;
  font-weight: 700;
  color: #faf6ee;
}

.sv-top {
  position: absolute;
  left: calc(100% + 0.6rem);
  white-space: nowrap;
  color: #cc785c;
  font-weight: 700;
  font-size: 1.1rem;
}

.sv-meta {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  margin-left: 4rem;
  font-family: monospace;
  font-size: 1.2rem;
  color: #faf6ee;
}

.sv-meta .k {
  display: inline-block;
  width: 5.5rem;
  color: #9e978c;
}

.sv-caption {
  font-size: 1.25rem;
  color: #faf6ee;
  padding: 0.3rem 0.7rem;
  border-radius: 6px;
  background: #22221f;
}

.last-error .sv-caption {
  background: rgba(244, 63, 94, 0.2);
  color: #fb7185;
}

.last-grow .sv-caption {
  background: rgba(212, 155, 83, 0.2);
  color: #fde68a;
}

@keyframes drop-in {
  from { transform: translateY(-14px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

@keyframes pop-in {
  from { transform: scale(0.96); }
  to { transform: scale(1); }
}
</style>
