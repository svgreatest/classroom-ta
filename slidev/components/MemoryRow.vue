<script setup lang="ts">
import { computed } from 'vue'

interface Cell {
  addr: string
  value?: string
  name?: string
  // Index of the cell this one points to; draws an arrow under the row.
  pointsTo?: number
  // First click step at which the cell's value/name/arrow appears (default: always).
  showAt?: number
  // Click steps at which the cell is highlighted.
  highlightAt?: number[]
  // Draw the cell as freed / invalid memory.
  freed?: boolean
}

// Usage: <MemoryRow :cells="[{addr:'0x1000',value:'42',name:'x'},
//                           {addr:'0x1004',value:'0x1000',name:'p',pointsTo:0,showAt:1}]" :step="$clicks" />
const props = withDefaults(
  defineProps<{
    cells: Cell[]
    step?: number
    cellWidth?: number
  }>(),
  {
    step: Number.POSITIVE_INFINITY,
    cellWidth: 118,
  }
)

const visible = (c: Cell) => (c.showAt ?? 0) <= props.step

const arrows = computed(() =>
  props.cells
    .map((c, i) => ({ c, i }))
    .filter(({ c }) => c.pointsTo !== undefined && visible(c))
    .map(({ c, i }) => {
      const x1 = i * props.cellWidth + props.cellWidth / 2
      const x2 = (c.pointsTo as number) * props.cellWidth + props.cellWidth / 2
      const depth = 18 + Math.abs(i - (c.pointsTo as number)) * 10
      return { key: i, d: `M ${x1} 2 C ${x1} ${depth + 2}, ${x2} ${depth + 2}, ${x2} 4`, dangling: props.cells[c.pointsTo as number]?.freed }
    })
)

const svgHeight = computed(() => {
  const spans = arrows.value.length
    ? props.cells.map((c, i) => (c.pointsTo !== undefined ? Math.abs(i - c.pointsTo) : 0))
    : [0]
  return 30 + Math.max(...spans) * 10
})
</script>

<template>
  <div class="memrow select-none" :style="{ width: `${cells.length * cellWidth}px` }">
    <div class="mr-names">
      <div v-for="(c, i) in cells" :key="i" class="mr-name" :style="{ width: `${cellWidth}px` }">
        <span v-if="c.name && visible(c)">{{ c.name }}</span>
      </div>
    </div>
    <div class="mr-cells">
      <div
        v-for="(c, i) in cells"
        :key="i"
        class="mr-cell"
        :class="{ hl: c.highlightAt?.includes(step), freed: c.freed && visible(c) }"
        :style="{ width: `${cellWidth}px` }"
      >
        <span class="mr-value">{{ visible(c) ? c.value ?? '' : '' }}</span>
      </div>
    </div>
    <div class="mr-addrs">
      <div v-for="(c, i) in cells" :key="i" class="mr-addr" :style="{ width: `${cellWidth}px` }">{{ c.addr }}</div>
    </div>
    <svg v-if="arrows.length" class="mr-arrows" :width="cells.length * cellWidth" :height="svgHeight">
      <defs>
        <marker id="mr-head" markerUnits="userSpaceOnUse" markerWidth="14" markerHeight="14" refX="7" refY="7" orient="auto">
          <path d="M0,0 L14,7 L0,14 z" fill="#cc785c" />
        </marker>
        <marker id="mr-head-bad" markerUnits="userSpaceOnUse" markerWidth="14" markerHeight="14" refX="7" refY="7" orient="auto">
          <path d="M0,0 L14,7 L0,14 z" fill="#f43f5e" />
        </marker>
      </defs>
      <path
        v-for="a in arrows"
        :key="a.key"
        :d="a.d"
        fill="none"
        :stroke="a.dangling ? '#f43f5e' : '#cc785c'"
        stroke-width="3"
        :stroke-dasharray="a.dangling ? '6 5' : undefined"
        :marker-end="a.dangling ? 'url(#mr-head-bad)' : 'url(#mr-head)'"
      />
    </svg>
  </div>
</template>

<style scoped>
.memrow {
  display: flex;
  flex-direction: column;
}

.mr-names,
.mr-cells,
.mr-addrs {
  display: flex;
}

.mr-name {
  text-align: center;
  font-family: var(--slidev-code-font, monospace);
  font-size: 1.3rem;
  font-weight: 700;
  color: #d49b53;
  height: 1.9rem;
}

.mr-cell {
  height: 3.4rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid #5c5a54;
  margin-left: -2px;
  background: #22221f;
  transition: background 0.25s ease, border-color 0.25s ease;
}

.mr-cell.hl {
  background: rgba(204, 120, 92, 0.35);
  border-color: #cc785c;
  position: relative;
  z-index: 1;
}

.mr-cell.freed {
  background: repeating-linear-gradient(45deg, #2a1a1d, #2a1a1d 8px, #22221f 8px, #22221f 16px);
  border-color: #f43f5e;
}

.mr-value {
  white-space: nowrap;
  font-family: var(--slidev-code-font, monospace);
  font-size: 1.35rem;
  color: #faf6ee;
}

.mr-addr {
  text-align: center;
  font-family: monospace;
  font-size: 0.95rem;
  color: #9e978c;
  padding-top: 0.25rem;
}

.mr-arrows {
  margin-top: 0.15rem;
  overflow: visible;
}

/* Code fonts render "0x" as a ligature (0×); addresses must read literally */
.memrow {
  font-variant-ligatures: none;
}
</style>
