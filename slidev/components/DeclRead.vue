<script setup lang="ts">
import { computed } from 'vue'

// Reads a C declaration one piece per click, K&R style: start at the name,
// then go right ([] and ()) before left (*), parentheses first.
// Usage: <DeclRead :tokens="[{t:'int',n:3},{t:'*',n:2},{t:'p',n:1}]"
//                  :say="['p is','a pointer to','int']" :step="$clicks" />
interface Token {
  t: string
  // Reading order (1 = first); tokens without n are punctuation.
  n?: number
}

const props = withDefaults(
  defineProps<{ tokens: Token[]; say: string[]; step?: number }>(),
  { step: Number.POSITIVE_INFINITY }
)

const sentence = computed(() => props.say.slice(0, props.step).join(' '))
const isCurrent = (tok: Token) => tok.n !== undefined && tok.n === Math.min(props.step, props.say.length)
const isRead = (tok: Token) => tok.n !== undefined && tok.n <= props.step
</script>

<template>
  <div class="dr select-none">
    <div class="dr-tokens">
      <span
        v-for="(tok, i) in tokens"
        :key="i"
        class="dr-tok"
        :class="{ read: isRead(tok), current: isCurrent(tok), punct: tok.n === undefined }"
      >
        <span v-if="tok.n !== undefined" class="dr-num" :style="{ visibility: isRead(tok) ? 'visible' : 'hidden' }">{{ tok.n }}</span>
        <code>{{ tok.t }}</code>
      </span>
      <span class="dr-tok punct"><code>;</code></span>
    </div>
    <div class="dr-say">{{ sentence || ' ' }}</div>
  </div>
</template>

<style scoped>
.dr { display: flex; flex-direction: column; gap: 0.6rem; }
.dr-tokens { display: flex; align-items: flex-end; gap: 0.35rem; }
.dr-tok { display: flex; flex-direction: column; align-items: center; gap: 0.2rem; }
.dr-tok code {
  font-size: 1.9rem; padding: 0.15rem 0.5rem; border-radius: 0.4rem;
  border: 2px solid #383733; background: #141413; color: #a8a29e;
  font-variant-ligatures: none;
}
.dr-tok.punct code { border-color: transparent; background: transparent; }
.dr-tok.read code { color: #faf6ee; border-color: #d49b53; }
.dr-tok.current code { background: #cc785c; border-color: #cc785c; color: #181816; }
.dr-num {
  width: 1.6rem; height: 1.6rem; border-radius: 999px; background: #d49b53; color: #181816;
  font-weight: 800; font-size: 0.95rem; display: flex; align-items: center; justify-content: center;
}
.dr-say { font-size: 1.6rem; color: #faf6ee; min-height: 2.2rem; }
</style>
