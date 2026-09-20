<script setup lang="ts">
import { ref, computed } from 'vue'
import QuestionTimer from './QuestionTimer.vue'
import TutorLink from './TutorLink.vue'

interface OptionItem {
  letter: string
  text: string
  isCorrect: boolean
  index: number
}

const props = withDefaults(
  defineProps<{
    question?: string
    context?: string
    code?: string | string[]
    codeLang?: string
    options?: (string | { text: string; correct?: boolean })[]
    answer?: number | string
    timer?: number
    timerTitle?: string
    explanation?: string
    tutorExample?: string
    tutorLabel?: string
  }>(),
  {
    timer: 0,
    timerTitle: 'Question Timer',
    options: () => [],
    tutorLabel: 'Step Through in C Memory Tutor',
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

const parsedOptions = computed<OptionItem[]>(() => {
  return props.options.map((opt, idx) => {
    const letter = String.fromCharCode(65 + idx)
    let text = ''
    let isCorrect = false

    if (typeof opt === 'string') {
      text = opt
      if (typeof props.answer === 'number' && props.answer === idx) {
        isCorrect = true
      } else if (typeof props.answer === 'string' && props.answer.trim().toUpperCase() === letter) {
        isCorrect = true
      }
    } else {
      text = opt.text
      isCorrect = Boolean(opt.correct)
    }

    return { letter, text, isCorrect, index: idx }
  })
})

function selectOption(idx: number) {
  selectedIdx.value = idx
  showExplanation.value = true
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
  <div class="mcq-split-container select-none">
    <!-- LEFT COLUMN: Context, Code, Question Prompt, Slim Timer, Tutor Button -->
    <div class="mcq-left-pane">
      <div v-if="context" class="mcq-context">
        {{ context }}
      </div>

      <!-- Code block with C Syntax Highlighting -->
      <div v-if="formattedCode" class="mcq-code-box">
        <pre class="mcq-code-pre"><code class="font-mono" v-html="highlightedCode" /></pre>
      </div>

      <!-- Question prompt (via prop or slot) -->
      <div v-if="question" class="mcq-question-prompt">
        {{ question }}
      </div>

      <slot name="left" />

      <!-- Compact Timer directly on the left -->
      <QuestionTimer
        v-if="timer > 0"
        :initial-seconds="timer"
        :title="timerTitle"
        compact
      />

      <!-- Optional C Tutor Launch Link -->
      <div v-if="tutorExample" class="tutor-bridge-wrap">
        <TutorLink :example="tutorExample" :label="tutorLabel" />
      </div>
    </div>

    <!-- RIGHT COLUMN: Options & Step-by-Step Analysis -->
    <div class="mcq-right-pane">
      <!-- Options Meta Bar -->
      <div class="mcq-meta-bar">
        <span class="meta-label">
          <span class="dot">●</span> Select Your Answer:
        </span>
        <div class="meta-actions">
          <button
            v-if="selectedIdx !== null"
            type="button"
            class="btn-reset"
            @click="resetSelection"
          >
            Reset
          </button>
          <button
            v-if="explanation || $slots.explanation"
            type="button"
            class="btn-toggle-explain"
            @click="toggleExplanation"
          >
            {{ showExplanation ? 'Hide' : 'Explain' }}
          </button>
        </div>
      </div>

      <!-- Options Grid -->
      <div class="options-list">
        <button
          v-for="item in parsedOptions"
          :key="item.index"
          type="button"
          class="option-row"
          :class="{
            'is-selected-correct': selectedIdx === item.index && item.isCorrect,
            'is-selected-wrong': selectedIdx === item.index && !item.isCorrect,
            'is-neutral': selectedIdx !== item.index
          }"
          @click="selectOption(item.index)"
        >
          <!-- Option Letter Badge or Status Icon -->
          <span
            class="option-letter"
            :class="{
              'correct-letter': selectedIdx === item.index && item.isCorrect,
              'wrong-letter': selectedIdx === item.index && !item.isCorrect
            }"
          >
            <span v-if="selectedIdx === item.index">
              {{ item.isCorrect ? '✓' : '✗' }}
            </span>
            <span v-else>{{ item.letter }}</span>
          </span>

          <!-- Option Text -->
          <span class="option-text font-mono">
            {{ item.text }}
          </span>

          <!-- Outcome Badge -->
          <span
            v-if="selectedIdx === item.index"
            class="outcome-badge"
            :class="item.isCorrect ? 'badge-correct' : 'badge-wrong'"
          >
            {{ item.isCorrect ? '✓ Correct' : '✗ Incorrect' }}
          </span>
        </button>
      </div>

      <!-- Step-by-Step Analysis Box below options -->
      <div
        v-if="showExplanation && (explanation || $slots.explanation)"
        class="explanation-card"
      >
        <div class="explanation-header">
          <span class="explanation-icon">💡</span>
          <span class="explanation-title">Analysis</span>
        </div>
        <div class="explanation-content">
          <slot name="explanation">
            <div class="explanation-text" v-html="explanation" />
          </slot>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.mcq-split-container {
  display: grid;
  grid-template-columns: 1.05fr 0.95fr;
  gap: 1.25rem;
  align-items: start;
  margin-top: 0.25rem;
  box-sizing: border-box;
}

/* LEFT PANE */
.mcq-left-pane {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.mcq-context {
  font-size: 0.82rem;
  color: #d4cfc5;
  line-height: 1.4;
  margin: 0;
}

.mcq-question-prompt {
  font-size: 0.92rem;
  font-weight: 700;
  color: #faf6ee;
  line-height: 1.45;
  margin: 0.15rem 0;
}

.mcq-code-box {
  margin: 0.15rem 0;
}

.mcq-code-pre {
  margin: 0 !important;
  padding: 0.35rem 0.6rem !important;
  font-size: 0.72rem !important;
  font-family: 'JetBrains Mono', 'Fira Code', ui-monospace, monospace !important;
  background: #141413 !important;
  border: 1px solid #383733 !important;
  border-radius: 0.5rem !important;
  color: #faf6ee !important;
  line-height: 1.25 !important;
  overflow-x: auto;
}

.mcq-code-pre code {
  font-family: inherit !important;
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

.mcq-left-pane :deep(pre) {
  margin: 0.25rem 0 !important;
  padding: 0.45rem 0.7rem !important;
  font-size: 0.75rem !important;
  border-radius: 0.5rem !important;
}

.tutor-bridge-wrap {
  margin-top: 0.25rem;
}

/* RIGHT PANE */
.mcq-right-pane {
  display: flex;
  flex-direction: column;
}

.mcq-meta-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.4rem;
  font-size: 0.7rem;
  color: #9e978c;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-family: monospace;
}

.meta-label {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  color: #cc785c;
  font-weight: 700;
}

.dot {
  font-size: 0.55rem;
}

.meta-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.btn-reset, .btn-toggle-explain {
  background: none;
  border: none;
  color: #9e978c;
  font-size: 0.68rem;
  cursor: pointer;
  padding: 0.15rem 0.35rem;
  border-radius: 0.25rem;
  transition: all 0.15s;
}

.btn-reset:hover, .btn-toggle-explain:hover {
  color: #faf6ee;
  background: #252522;
  text-decoration: underline;
}

.options-list {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.option-row {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 0.65rem;
  padding: 0.5rem 0.75rem;
  border-radius: 0.5rem;
  background: #22221f;
  border: 1px solid #383733;
  color: #d4cfc5;
  text-align: left;
  cursor: pointer;
  transition: all 0.15s ease;
  box-sizing: border-box;
}

.option-row:hover {
  background: #282824;
  border-color: rgba(204, 120, 92, 0.5);
}

.option-row.is-selected-correct {
  background: rgba(16, 185, 129, 0.15);
  border-color: #10b981;
  color: #faf6ee;
  box-shadow: 0 0 10px rgba(16, 185, 129, 0.2);
}

.option-row.is-selected-wrong {
  background: rgba(244, 63, 94, 0.15);
  border-color: #f43f5e;
  color: #faf6ee;
  box-shadow: 0 0 10px rgba(244, 63, 94, 0.2);
}

.option-letter {
  width: 1.35rem;
  height: 1.35rem;
  border-radius: 9999px;
  background: #181816;
  border: 1px solid rgba(158, 151, 140, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.7rem;
  font-family: monospace;
  font-weight: 700;
  color: #9e978c;
  flex-shrink: 0;
}

.correct-letter {
  background: #10b981;
  border-color: #10b981;
  color: #0f172a;
}

.wrong-letter {
  background: #f43f5e;
  border-color: #f43f5e;
  color: #ffffff;
}

.option-text {
  flex: 1;
  font-size: 0.8rem;
  line-height: 1.3;
}

.outcome-badge {
  font-size: 0.65rem;
  font-family: monospace;
  font-weight: 700;
  padding: 0.15rem 0.45rem;
  border-radius: 0.25rem;
  flex-shrink: 0;
}

.badge-correct {
  background: rgba(16, 185, 129, 0.2);
  color: #34d399;
  border: 1px solid rgba(16, 185, 129, 0.4);
}

.badge-wrong {
  background: rgba(244, 63, 94, 0.2);
  color: #fb7185;
  border: 1px solid rgba(244, 63, 94, 0.4);
}

.explanation-card {
  margin-top: 0.5rem;
  padding: 0.65rem 0.85rem;
  border-radius: 0.5rem;
  background: #1c1c1a;
  border: 1px solid #383733;
  border-left: 3px solid #cc785c;
  animation: fadeIn 0.25s ease;
}

.explanation-header {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  margin-bottom: 0.3rem;
}

.explanation-icon {
  font-size: 0.8rem;
}

.explanation-title {
  font-size: 0.75rem;
  font-weight: 700;
  color: #d49b53;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.explanation-content {
  font-size: 0.74rem;
  line-height: 1.45;
  color: #d4cfc5;
}

.explanation-content :deep(p) {
  margin: 0.2rem 0;
}

.explanation-content :deep(code) {
  font-size: 0.7rem;
  padding: 0.05rem 0.25rem;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(3px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
