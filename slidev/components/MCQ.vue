<script setup lang="ts">
import { ref, computed } from 'vue'
import QuestionTimer from './QuestionTimer.vue'
import TutorLink from './TutorLink.vue'
import { renderTex } from './render-tex'
import { parseOptions, useSingleColumn, type RawOption } from './mcq-utils'

const props = withDefaults(
  defineProps<{
    question?: string
    context?: string
    code?: string | string[]
    codeLang?: string
    options?: RawOption[]
    answer?: number | string
    timer?: number
    timerTitle?: string
    label?: string
    explanation?: string
    tutorExample?: string
    tutorLabel?: string
  }>(),
  {
    timer: 0,
    timerTitle: 'Question Timer',
    options: () => [],
    tutorLabel: 'Step through in Tutor',
    codeLang: 'c',
  }
)

const selectedIdx = ref<number | null>(null)
const showExplanation = ref(false)

const formattedCode = computed(() => {
  if (Array.isArray(props.code)) return props.code.join('\n')
  return props.code || ''
})

function highlightCCode(raw: string): string {
  if (!raw) return ''
  let text = raw
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

  const stashed: { placeholder: string; html: string }[] = []
  let count = 0
  const stash = (html: string) => {
    const key = `__TK_${count++}__`
    stashed.push({ placeholder: key, html })
    return key
  }

  // Comments
  text = text.replace(/(\/\/[^\n]*)/g, (_, c) => stash(`<span class="token-comment">${c}</span>`))
  // Preprocessor
  text = text.replace(/(#(?:include|define)\b[^\n]*)/g, (_, p) => stash(`<span class="token-preproc">${p}</span>`))
  // Strings & HTML entities
  text = text.replace(/(&quot;.*?&quot;|".*?")/g, (_, s) => stash(`<span class="token-string">${s}</span>`))
  // Chars
  text = text.replace(/('(?:\\'|[^'])*')/g, (_, ch) => stash(`<span class="token-char">${ch}</span>`))
  // Types
  text = text.replace(/\b(int|char|void|float|double|size_t|ptrdiff_t|bool|long|short|unsigned|struct|typedef|AVLNode|IntStack|GenericStack)\b/g, (t) => stash(`<span class="token-type">${t}</span>`))
  // Keywords
  text = text.replace(/\b(return|if|else|while|for|switch|case|break|continue|sizeof|NULL)\b/g, (k) => stash(`<span class="token-keyword">${k}</span>`))
  // Functions
  text = text.replace(/\b([a-zA-Z_]\w*)(?=\s*\()/g, (fn) => stash(`<span class="token-func">${fn}</span>`))
  // Numbers
  text = text.replace(/\b(0x[0-9a-fA-F]+|\d+)\b/g, (num) => stash(`<span class="token-number">${num}</span>`))
  // Operators
  text = text.replace(/(\*|&amp;(?![a-zA-Z]+;)|-&gt;|\+\+|--|==|!=|&lt;=|&gt;=|[+\-/%=])/g, (op) => `<span class="token-op">${op}</span>`)

  for (let i = stashed.length - 1; i >= 0; i--) {
    text = text.replace(stashed[i].placeholder, stashed[i].html)
  }
  return text
}

const highlightedCode = computed(() => {
  return highlightCCode(formattedCode.value)
})

const parsedOptions = computed(() => parseOptions(props.options, props.answer))
const singleColumn = computed(() => useSingleColumn(parsedOptions.value))
const correctOption = computed(() => parsedOptions.value.find(o => o.isCorrect))

// The header label falls back to the timer title so existing decks keep their wording.
const headerLabel = computed(() => props.label || props.timerTitle)

function selectOption(idx: number) {
  selectedIdx.value = idx
}

function resetSelection() {
  selectedIdx.value = null
  showExplanation.value = false
}

function toggleExplanation() {
  showExplanation.value = !showExplanation.value
}
</script>

<template>
  <div class="mcq select-none">
    <div class="mcq-header">
      <span class="mcq-label"><span class="dot">●</span> {{ headerLabel }}</span>
      <QuestionTimer
        v-if="timer > 0"
        :initial-seconds="timer"
        :title="timerTitle"
        compact
        class="mcq-timer"
      />
    </div>

    <div class="mcq-prompt">
      <p v-if="context" class="mcq-context" v-html="renderTex(context)" />
      <p v-if="question" class="mcq-question" v-html="renderTex(question)" />
      <slot name="left" />
    </div>

    <div v-if="formattedCode" class="mcq-code-box">
      <pre class="mcq-code-pre"><code class="font-mono" v-html="highlightedCode" /></pre>
    </div>

    <!-- Reveal swaps the options for the explanation so neither has to shrink to fit -->
    <div
      v-if="!showExplanation"
      class="options-grid"
      :class="{ 'single-column': singleColumn }"
    >
      <button
        v-for="item in parsedOptions"
        :key="item.index"
        type="button"
        class="option"
        :class="{
          'is-correct': selectedIdx === item.index && item.isCorrect,
          'is-wrong': selectedIdx === item.index && !item.isCorrect,
        }"
        @click="selectOption(item.index)"
      >
        <span class="option-letter">
          <template v-if="selectedIdx === item.index">{{ item.isCorrect ? '✓' : '✗' }}</template>
          <template v-else>{{ item.letter }}</template>
        </span>
        <span class="option-text font-mono" v-html="renderTex(item.text)" />
      </button>
    </div>

    <div v-else class="explanation-card">
      <div v-if="correctOption" class="explanation-answer">
        <span class="option-letter answer-letter">{{ correctOption.letter }}</span>
        <span class="font-mono" v-html="renderTex(correctOption.text)" />
      </div>
      <div class="explanation-content">
        <slot name="explanation">
          <div v-html="explanation" />
        </slot>
      </div>
    </div>

    <div class="mcq-footer">
      <button
        v-if="explanation || $slots.explanation"
        type="button"
        class="btn-reveal"
        @click="toggleExplanation"
      >
        {{ showExplanation ? '◀ Back to options' : 'Reveal answer' }}
      </button>
      <button
        v-if="selectedIdx !== null || showExplanation"
        type="button"
        class="btn-ghost"
        @click="resetSelection"
      >
        Reset
      </button>
      <TutorLink v-if="tutorExample" :example="tutorExample" :label="tutorLabel" class="mcq-tutor" />
    </div>
  </div>
</template>

<style scoped>
.mcq {
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
  margin-top: 0.25rem;
}

.mcq-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.mcq-label {
  color: #cc785c;
  font-family: monospace;
  font-size: 0.95rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  white-space: nowrap;
}

.dot {
  font-size: 0.6rem;
  vertical-align: middle;
}

.mcq-timer {
  flex: 0 1 22rem;
  margin: 0 !important;
}

.mcq-prompt p {
  margin: 0;
}

.mcq-context {
  font-size: 1.55rem !important;
  line-height: 1.4 !important;
  color: #d4cfc5;
}

.mcq-question {
  margin-top: 0.4rem !important;
  font-size: 1.55rem !important;
  line-height: 1.25 !important;
  font-weight: 400;
  color: #faf6ee !important;
}

.mcq-code-pre {
  margin: 0 !important;
  padding: 0.6rem 0.9rem !important;
  font-family: 'JetBrains Mono', 'Fira Code', ui-monospace, monospace !important;
  background: #141413 !important;
  border: 1px solid #383733 !important;
  border-radius: 0.6rem !important;
  overflow-x: auto;
}

.mcq-code-pre code {
  font-family: inherit !important;
  font-size: 1.1rem !important;
  line-height: 1.4 !important;
  white-space: pre !important;
  background: transparent !important;
  border: none !important;
  color: #e2ded4 !important;
  padding: 0 !important;
}

.mcq-code-pre :deep(.token-comment) {
  color: #78716c !important;
  font-style: italic !important;
}

.mcq-code-pre :deep(.token-preproc) {
  color: #e08d73 !important;
  font-weight: 600 !important;
}

.mcq-code-pre :deep(.token-string),
.mcq-code-pre :deep(.token-char) {
  color: #86efac !important;
}

.mcq-code-pre :deep(.token-type) {
  color: #7dd3fc !important;
  font-weight: 600 !important;
}

.mcq-code-pre :deep(.token-keyword) {
  color: #cc785c !important;
  font-weight: 700 !important;
}

.mcq-code-pre :deep(.token-func) {
  color: #fde68a !important;
  font-weight: 600 !important;
}

.mcq-code-pre :deep(.token-number) {
  color: #fca5a5 !important;
}

.mcq-code-pre :deep(.token-op) {
  color: #d49b53 !important;
  font-weight: 600 !important;
}

.options-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
}

.options-grid.single-column {
  grid-template-columns: 1fr;
  gap: 0.55rem;
}

.option {
  display: flex;
  align-items: center;
  gap: 0.9rem;
  padding: 0.75rem 1rem;
  border-radius: 0.75rem;
  background: #22221f;
  border: 2px solid #383733;
  color: #faf6ee;
  text-align: left;
  cursor: pointer;
  transition: background 0.15s ease, border-color 0.15s ease;
}

.option:hover {
  background: #2a2a26;
  border-color: rgba(204, 120, 92, 0.6);
}

.option.is-correct {
  background: rgba(16, 185, 129, 0.15);
  border-color: #10b981;
}

.option.is-wrong {
  background: rgba(244, 63, 94, 0.15);
  border-color: #f43f5e;
}

.option-letter {
  width: 2.4rem;
  height: 2.4rem;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 9999px;
  background: #181816;
  border: 2px solid rgba(204, 120, 92, 0.5);
  color: #cc785c;
  font-family: monospace;
  font-size: 1.3rem;
  font-weight: 800;
}

.is-correct .option-letter {
  background: #10b981;
  border-color: #10b981;
  color: #0f172a;
}

.is-wrong .option-letter {
  background: #f43f5e;
  border-color: #f43f5e;
  color: #ffffff;
}

.option-text {
  flex: 1;
  font-size: 1.55rem;
  line-height: 1.25;
}

.single-column .option-text {
  font-size: 1.5rem;
}

.explanation-card {
  padding: 0.9rem 1.2rem;
  border-radius: 0.75rem;
  background: #1c1c1a;
  border: 1px solid #383733;
  border-left: 5px solid #10b981;
  animation: fadeIn 0.25s ease;
}

.explanation-answer {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  margin-bottom: 0.6rem;
  font-size: 1.5rem;
  font-weight: 700;
  color: #34d399;
}

.answer-letter {
  background: #10b981;
  border-color: #10b981;
  color: #0f172a;
}

.explanation-content {
  font-size: 1.25rem;
  line-height: 1.5;
  color: #d4cfc5;
}

.explanation-content :deep(p),
.explanation-content :deep(li) {
  font-size: inherit !important;
  margin: 0.25rem 0;
}

.explanation-content :deep(code) {
  font-size: 0.95em;
}

.mcq-footer {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.btn-reveal {
  padding: 0.5rem 1.1rem;
  border-radius: 0.5rem;
  background: #faf6ee;
  color: #181816;
  font-size: 1rem;
  font-weight: 700;
  border: none;
  cursor: pointer;
}

.btn-reveal:hover {
  background: #ffffff;
}

.btn-ghost {
  padding: 0.5rem 0.9rem;
  border-radius: 0.5rem;
  background: none;
  border: 1px solid #383733;
  color: #9e978c;
  font-size: 1rem;
  cursor: pointer;
}

.btn-ghost:hover {
  color: #faf6ee;
}

.mcq-tutor {
  margin: 0 !important;
  font-size: 1rem !important;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(3px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
