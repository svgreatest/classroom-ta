<script setup lang="ts">
// One-sentence takeaway in very large type: <BigIdea kicker="LIFO">Last in, first out.</BigIdea>
defineProps<{
  kicker?: string
}>()
</script>

<template>
  <div class="bigidea">
    <div v-if="kicker" class="bi-kicker">{{ kicker }}</div>
    <div class="bi-text"><slot /></div>
  </div>
</template>

<style scoped>
.bigidea {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 1rem;
  min-height: 16rem;
}

.bi-kicker {
  color: #cc785c;
  font-family: monospace;
  font-size: 1.1rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.bi-text {
  font-family: 'Charter', 'Bitstream Charter', 'Sitka Text', 'Cambria', serif;
  font-size: 3rem;
  line-height: 1.15;
  font-weight: 800;
  color: #faf6ee;
}

.bi-text :deep(code) {
  font-size: 0.85em;
}
</style>
