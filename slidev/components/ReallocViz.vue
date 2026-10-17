<script setup lang="ts">
import { computed } from 'vue'

// Step-by-step picture of: items = realloc(items, 4 * sizeof(int)); items[2] = 30;
// Usage (frontmatter clicks: 6): <ReallocViz :step="$clicks" />
const props = withDefaults(defineProps<{ step?: number }>(), { step: 6 })

const CELL = 92
const OLD_X = 30
const NEW_X = 380
const BLOCK_Y = 150
const CELL_H = 62

const captions = [
  'The block holds 2 ints and is full. We need room for a third.',
  'realloc asks the allocator for a NEW block of 4 ints somewhere else.',
  'It copies the old bytes into the new block (memcpy under the hood).',
  'It frees the old block. That memory is no longer yours.',
  'It returns the new address. items now points to the bigger block.',
  'Now there is room: items[2] = 30.',
  'Any pointer saved before realloc still holds the old address. It dangles.',
]

const s = computed(() => Math.max(0, Math.min(props.step, captions.length - 1)))

const oldCells = computed(() => [
  { v: '10' },
  { v: '20' },
])

const newCells = computed(() => {
  const copied = s.value >= 2
  return [
    { v: copied ? '10' : '' },
    { v: copied ? '20' : '' },
    { v: s.value >= 5 ? '30' : '' , fresh: s.value === 5 },
    { v: '' },
  ]
})

const itemsTarget = computed(() => (s.value >= 4 ? 'new' : 'old'))
const itemsValue = computed(() => (itemsTarget.value === 'new' ? '0x2000' : '0x1000'))

// Arrow from a variable box (top) to the middle of a block
function arrow(fromX: number, toX: number) {
  const y1 = 76
  const y2 = BLOCK_Y - 4
  const mid = (y1 + y2) / 2
  return `M ${fromX} ${y1} C ${fromX} ${mid}, ${toX} ${mid}, ${toX} ${y2}`
}

const itemsArrow = computed(() =>
  arrow(OLD_X + CELL, itemsTarget.value === 'new' ? NEW_X + CELL * 2 : OLD_X + CELL)
)
const staleArrow = computed(() => arrow(NEW_X + CELL * 3 + 40, OLD_X + CELL * 1.5))

const copyArrows = computed(() =>
  [0, 1].map(i => {
    const x1 = OLD_X + CELL * i + CELL / 2
    const x2 = NEW_X + CELL * i + CELL / 2
    const y = BLOCK_Y - 4
    return `M ${x1} ${y} C ${x1} ${y - 70}, ${x2} ${y - 70}, ${x2} ${y - 4}`
  })
)
</script>

<template>
  <div class="rv select-none">
    <svg class="rv-svg" width="860" height="300">
      <defs>
        <marker id="rv-head" markerUnits="userSpaceOnUse" markerWidth="14" markerHeight="14" refX="7" refY="7" orient="auto">
          <path d="M0,0 L14,7 L0,14 z" fill="#cc785c" />
        </marker>
        <marker id="rv-head-copy" markerUnits="userSpaceOnUse" markerWidth="12" markerHeight="12" refX="6" refY="6" orient="auto">
          <path d="M0,0 L12,6 L0,12 z" fill="#7dd3fc" />
        </marker>
        <marker id="rv-head-bad" markerUnits="userSpaceOnUse" markerWidth="14" markerHeight="14" refX="7" refY="7" orient="auto">
          <path d="M0,0 L14,7 L0,14 z" fill="#f43f5e" />
        </marker>
      </defs>

      <!-- variable: items -->
      <g>
        <text :x="OLD_X + CELL - 60" y="22" class="rv-var">items</text>
        <rect :x="OLD_X + CELL - 60" y="32" width="120" height="44" rx="6" class="rv-varbox" />
        <text :x="OLD_X + CELL" y="61" text-anchor="middle" class="rv-varval">{{ itemsValue }}</text>
      </g>
      <path :d="itemsArrow" class="rv-ptr" marker-end="url(#rv-head)" />

      <!-- stale pointer -->
      <g v-if="s >= 6">
        <text :x="NEW_X + CELL * 3 - 20" y="22" class="rv-var bad">saved</text>
        <rect :x="NEW_X + CELL * 3 - 20" y="32" width="120" height="44" rx="6" class="rv-varbox bad" />
        <text :x="NEW_X + CELL * 3 + 40" y="61" text-anchor="middle" class="rv-varval">0x1004</text>
        <path :d="staleArrow" class="rv-ptr bad" marker-end="url(#rv-head-bad)" />
      </g>

      <!-- old block: 2 ints -->
      <g :class="{ freed: s >= 3 }">
        <text :x="OLD_X" :y="BLOCK_Y + CELL_H + 24" class="rv-label">old block · 2 ints · 0x1000</text>
        <g v-for="(c, i) in oldCells" :key="'o' + i">
          <rect :x="OLD_X + CELL * i" :y="BLOCK_Y" :width="CELL" :height="CELL_H" class="rv-cell old" />
          <text :x="OLD_X + CELL * i + CELL / 2" :y="BLOCK_Y + 41" text-anchor="middle" class="rv-val">{{ c.v }}</text>
        </g>
        <text v-if="s >= 3" :x="OLD_X + CELL" :y="BLOCK_Y + CELL_H + 52" text-anchor="middle" class="rv-freed">freed</text>
      </g>

      <!-- new block: 4 ints, visibly twice as wide -->
      <g v-if="s >= 1">
        <text :x="NEW_X" :y="BLOCK_Y + CELL_H + 24" class="rv-label">new block · 4 ints · 0x2000</text>
        <g v-for="(c, i) in newCells" :key="'n' + i">
          <rect
            :x="NEW_X + CELL * i" :y="BLOCK_Y" :width="CELL" :height="CELL_H"
            class="rv-cell" :class="{ empty: !c.v, fresh: c.fresh }"
          />
          <text :x="NEW_X + CELL * i + CELL / 2" :y="BLOCK_Y + 41" text-anchor="middle" class="rv-val">{{ c.v }}</text>
        </g>
      </g>

      <!-- copy arrows -->
      <g v-if="s === 2">
        <path v-for="(d, i) in copyArrows" :key="'c' + i" :d="d" class="rv-copy" marker-end="url(#rv-head-copy)" />
        <text :x="(OLD_X + NEW_X + CELL) / 2 + 40" :y="BLOCK_Y - 62" text-anchor="middle" class="rv-copytext">copy 8 bytes</text>
      </g>
    </svg>

    <div class="rv-caption" :class="{ bad: s >= 6, warn: s === 3 }">
      <span class="rv-step">{{ s + 1 }}/{{ captions.length }}</span>
      {{ captions[s] }}
    </div>
  </div>
</template>

<style scoped>
.rv {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  font-variant-ligatures: none;
}

.rv-svg {
  overflow: visible;
}

.rv-var {
  fill: #d49b53;
  font-family: var(--slidev-code-font, monospace);
  font-size: 20px;
  font-weight: 700;
}

.rv-var.bad {
  fill: #fb7185;
}

.rv-varbox {
  fill: #22221f;
  stroke: #5c5a54;
  stroke-width: 2;
}

.rv-varbox.bad {
  stroke: #f43f5e;
}

.rv-varval {
  fill: #faf6ee;
  font-family: var(--slidev-code-font, monospace);
  font-size: 20px;
}

.rv-ptr {
  fill: none;
  stroke: #cc785c;
  stroke-width: 3;
  transition: d 0.4s ease;
}

.rv-ptr.bad {
  stroke: #f43f5e;
  stroke-dasharray: 7 6;
}

.rv-label {
  fill: #9e978c;
  font-family: var(--slidev-code-font, monospace);
  font-size: 15px;
}

.rv-cell {
  fill: rgba(204, 120, 92, 0.2);
  stroke: #cc785c;
  stroke-width: 2;
}

.rv-cell.empty {
  fill: #1c1c1a;
  stroke: #5c5a54;
  stroke-dasharray: 6 5;
}

.rv-cell.fresh {
  fill: rgba(16, 185, 129, 0.3);
  stroke: #10b981;
}

.freed .rv-cell {
  fill: rgba(244, 63, 94, 0.12);
  stroke: #f43f5e;
  stroke-dasharray: 6 5;
}

.freed .rv-val {
  fill: #78716c;
}

.rv-val {
  fill: #faf6ee;
  font-family: var(--slidev-code-font, monospace);
  font-size: 26px;
  font-weight: 700;
}

.rv-freed {
  fill: #fb7185;
  font-weight: 700;
  font-size: 18px;
}

.rv-copy {
  fill: none;
  stroke: #7dd3fc;
  stroke-width: 2.5;
  stroke-dasharray: 6 5;
}

.rv-copytext {
  fill: #7dd3fc;
  font-family: var(--slidev-code-font, monospace);
  font-size: 16px;
}

.rv-caption {
  font-size: 1.35rem;
  color: #faf6ee;
  padding: 0.5rem 0.9rem;
  border-radius: 8px;
  background: #22221f;
  border-left: 4px solid #cc785c;
}

.rv-caption.warn {
  border-left-color: #f59e0b;
}

.rv-caption.bad {
  border-left-color: #f43f5e;
  color: #fb7185;
}

.rv-step {
  font-family: monospace;
  color: #9e978c;
  margin-right: 0.6rem;
}
</style>
