<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    example?: string
    label?: string
  }>(),
  {
    example: 'basics',
    label: 'Open C Tutor Visualizer',
  }
)

function launch() {
  if (window.parent && window.parent !== window) {
    window.parent.postMessage(
      {
        type: 'launch-tutor-example',
        detail: props.example,
      },
      '*'
    )
  } else {
    // If running standalone, navigate to hash
    window.location.hash = `demo:${props.example}`
  }
}
</script>

<template>
  <button
    type="button"
    class="tutor-launch-btn select-none"
    @click="launch"
  >
    <span class="tutor-icon">▶</span>
    <span class="tutor-label">{{ label }}</span>
  </button>
</template>

<style scoped>
.tutor-launch-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.4rem 0.85rem;
  margin: 0.5rem 0;
  border-radius: 0.5rem;
  background: #cc785c;
  color: #181816;
  font-weight: 700;
  font-size: 0.75rem;
  border: none;
  cursor: pointer;
  box-shadow: 0 4px 10px rgba(204, 120, 92, 0.3);
  transition: all 0.2s ease;
}

.tutor-launch-btn:hover {
  background: #d98266;
  transform: translateY(-1px);
  box-shadow: 0 6px 14px rgba(204, 120, 92, 0.4);
}

.tutor-icon {
  font-size: 0.65rem;
}
</style>
