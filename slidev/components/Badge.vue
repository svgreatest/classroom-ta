<script setup lang="ts">
defineProps<{
  text?: string
}>()
</script>

<template>
  <div class="anthropic-badge select-none">
    <span class="badge-dot">●</span>
    <span class="badge-text"><slot>{{ text }}</slot></span>
  </div>
</template>

<style scoped>
.anthropic-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.2rem 0.6rem;
  border-radius: 0.375rem;
  background: rgba(204, 120, 92, 0.15);
  border: 1px solid rgba(204, 120, 92, 0.3);
  color: #cc785c;
  font-family: monospace;
  font-size: 0.72rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 0.75rem;
}

.badge-dot {
  font-size: 0.55rem;
}
</style>
