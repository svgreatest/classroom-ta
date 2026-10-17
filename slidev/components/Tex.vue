<script setup lang="ts">
import { computed } from 'vue'
import katex from 'katex'

// Inline or display math inside HTML blocks, where Slidev's $...$ is not parsed.
const props = defineProps<{ expr: string; display?: boolean }>()
const html = computed(() => katex.renderToString(props.expr, { displayMode: props.display, throwOnError: false }))
</script>

<template>
  <span v-html="html" />
</template>
