<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    title?: string
    type?: 'info' | 'tip' | 'warning' | 'caution' | 'default'
  }>(),
  {
    type: 'default',
  }
)

const borderAccentColor = computed(() => {
  switch (props.type) {
    case 'tip': return '#10b981'
    case 'warning': return '#f59e0b'
    case 'caution': return '#f43f5e'
    case 'info': return '#cc785c'
    default: return '#cc785c'
  }
})

const badgeIcon = computed(() => {
  switch (props.type) {
    case 'tip': return '💡'
    case 'warning': return '⚠️'
    case 'caution': return '🛑'
    case 'info': return 'ℹ️'
    default: return '📌'
  }
})
</script>

<template>
  <div
    class="anthropic-card"
    :style="{ borderLeftColor: borderAccentColor }"
  >
    <div v-if="title" class="card-header">
      <span class="card-icon">{{ badgeIcon }}</span>
      <span class="card-title">{{ title }}</span>
    </div>
    <div class="card-body">
      <slot />
    </div>
  </div>
</template>

<style scoped>
.anthropic-card {
  margin: 0.35rem 0;
  padding: 0.6rem 0.85rem;
  border-radius: 0.65rem;
  background: #22221f;
  border: 1px solid #383733;
  border-left-width: 4px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.25);
  text-align: left;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.3rem;
}

.card-icon {
  font-size: 0.85rem;
}

.card-title {
  font-size: 0.82rem;
  font-weight: 700;
  color: #faf6ee;
  letter-spacing: 0.02em;
}

.card-body {
  font-size: 0.8rem;
  line-height: 1.45;
  color: #d4cfc5;
}

.card-body :deep(p) {
  margin: 0.25rem 0;
}

.card-body :deep(ul) {
  margin: 0.25rem 0;
  padding-left: 1.1rem;
}

.card-body :deep(li) {
  margin: 0.15rem 0;
}

.card-body :deep(:not(pre) > code) {
  font-family: monospace;
  font-size: 0.75rem;
  background: #141413;
  border: 1px solid #383733;
  padding: 0.1rem 0.35rem;
  border-radius: 0.25rem;
  color: #cc785c;
}

.card-body :deep(pre),
.card-body :deep(.slidev-code) {
  background: #141413 !important;
  border: 1px solid #383733 !important;
  border-radius: 0.5rem !important;
  padding: 0.4rem 0.65rem !important;
  margin: 0.25rem 0 !important;
  box-shadow: none !important;
}

.card-body :deep(pre code),
.card-body :deep(.slidev-code code) {
  font-family: var(--slidev-code-font, monospace) !important;
  background: transparent !important;
  border: none !important;
  padding: 0 !important;
  font-size: 0.75rem !important;
  line-height: 1.3 !important;
  color: inherit !important;
  display: block !important;
  white-space: normal !important;
}

.card-body :deep(pre code .line),
.card-body :deep(.slidev-code code .line) {
  display: block !important;
  white-space: pre !important;
  background: transparent !important;
  border: none !important;
  box-shadow: none !important;
  padding: 0 !important;
  margin: 0 !important;
  line-height: 1.3 !important;
}

.card-body :deep(.slidev-code-line-numbers code .line::before) {
  display: inline-block !important;
  width: 1.25rem !important;
  margin-right: 0.65rem !important;
  text-align: right !important;
  color: #78716c !important;
  opacity: 0.8 !important;
  line-height: 1.3 !important;
}

.card-body :deep(.katex-display) {
  margin: 0.25rem 0 !important;
  padding: 0.35rem 0.5rem !important;
  font-size: 0.85em !important;
  overflow-x: auto !important;
  overflow-y: hidden !important;
  max-width: 100% !important;
}
</style>
