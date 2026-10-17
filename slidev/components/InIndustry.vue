<script setup lang="ts">
// Compact "where this shows up at work" callout:
//   <InIndustry where="Chrome · Back button" icon="🌐">Each tab keeps a stack of visited pages.</InIndustry>
withDefaults(
  defineProps<{
    where: string
    icon?: string
  }>(),
  {
    icon: '🏭',
  }
)
</script>

<template>
  <div class="inindustry">
    <span class="ii-icon">{{ icon }}</span>
    <div>
      <div class="ii-where">{{ where }}</div>
      <div class="ii-body"><slot /></div>
    </div>
  </div>
</template>

<style scoped>
.inindustry {
  display: flex;
  align-items: flex-start;
  gap: 0.9rem;
  padding: 0.8rem 1.1rem;
  border-radius: 0.75rem;
  background: rgba(125, 211, 252, 0.08);
  border: 1px solid rgba(125, 211, 252, 0.35);
}

.ii-icon {
  font-size: 1.8rem;
  line-height: 1;
}

.ii-where {
  color: #7dd3fc;
  font-weight: 700;
  font-size: 1.15rem;
}

.ii-body {
  color: #faf6ee;
  font-size: 1.15rem;
  line-height: 1.45;
}
</style>
