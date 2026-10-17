<script setup lang="ts">
// Progress strip for the feature walkthrough: <ShipFlow at="Code" />
const STAGES = ['Ticket', 'Design', 'Reuse', 'Code', 'Test', 'Review', 'Ship']

const props = defineProps<{ at: string }>()
const atIndex = () => STAGES.indexOf(props.at)
</script>

<template>
  <div class="shipflow select-none">
    <template v-for="(stage, i) in STAGES" :key="stage">
      <span class="sf-stage" :class="{ done: i < atIndex(), now: i === atIndex() }">{{ stage }}</span>
      <span v-if="i < STAGES.length - 1" class="sf-sep">›</span>
    </template>
  </div>
</template>

<style scoped>
.shipflow {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  margin-bottom: 0.6rem;
  font-family: monospace;
  font-size: 0.9rem;
}

.sf-stage {
  padding: 0.15rem 0.55rem;
  border-radius: 9999px;
  color: #78716c;
  border: 1px solid #383733;
}

.sf-stage.done {
  color: #9e978c;
  border-color: #5c5a54;
}

.sf-stage.now {
  color: #181816;
  background: #cc785c;
  border-color: #cc785c;
  font-weight: 700;
}

.sf-sep {
  color: #5c5a54;
}
</style>
