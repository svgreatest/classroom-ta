<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'

const props = withDefaults(
  defineProps<{
    initialSeconds?: number
    title?: string
    autoStart?: boolean
    compact?: boolean
  }>(),
  {
    initialSeconds: 120,
    title: 'Question Timer',
    autoStart: true,
    compact: true,
  }
)

const emit = defineEmits<{
  (e: 'time-expired'): void
}>()

const timeLeft = ref(props.initialSeconds)
const totalSeconds = ref(props.initialSeconds)
const isRunning = ref(props.autoStart)
const isCompleted = ref(false)
const soundEnabled = ref(true)

let intervalId: any = null

function playChime() {
  try {
    const AudioCtx = (window as any).AudioContext || (window as any).webkitAudioContext
    if (!AudioCtx) return
    const ctx = new AudioCtx()
    const now = ctx.currentTime

    // Tone 1: C5 (523.25 Hz)
    const osc1 = ctx.createOscillator()
    const gain1 = ctx.createGain()
    osc1.type = 'sine'
    osc1.frequency.setValueAtTime(523.25, now)
    gain1.gain.setValueAtTime(0.18, now)
    gain1.gain.exponentialRampToValueAtTime(0.0001, now + 0.5)
    osc1.connect(gain1)
    gain1.connect(ctx.destination)
    osc1.start(now)
    osc1.stop(now + 0.5)

    // Tone 2: G5 (783.99 Hz)
    const osc2 = ctx.createOscillator()
    const gain2 = ctx.createGain()
    osc2.type = 'sine'
    osc2.frequency.setValueAtTime(783.99, now + 0.18)
    gain2.gain.setValueAtTime(0.22, now + 0.18)
    gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.85)
    osc2.connect(gain2)
    gain2.connect(ctx.destination)
    osc2.start(now + 0.18)
    osc2.stop(now + 0.85)
  } catch (e) {
    // Graceful fallback if audio context is blocked
  }
}

function startTimer() {
  stopTimer()
  intervalId = setInterval(() => {
    if (timeLeft.value <= 1) {
      timeLeft.value = 0
      isCompleted.value = true
      isRunning.value = false
      stopTimer()
      if (soundEnabled.value) {
        playChime()
      }
      emit('time-expired')
    } else {
      timeLeft.value -= 1
    }
  }, 1000)
}

function stopTimer() {
  if (intervalId) {
    clearInterval(intervalId)
    intervalId = null
  }
}

function togglePlay() {
  if (isCompleted.value) {
    timeLeft.value = props.initialSeconds
    totalSeconds.value = props.initialSeconds
    isCompleted.value = false
    isRunning.value = true
    startTimer()
  } else if (isRunning.value) {
    isRunning.value = false
    stopTimer()
  } else {
    isRunning.value = true
    startTimer()
  }
}

function resetTimer() {
  stopTimer()
  timeLeft.value = props.initialSeconds
  totalSeconds.value = props.initialSeconds
  isCompleted.value = false
  isRunning.value = false
}

function add30Seconds() {
  timeLeft.value += 30
  if (timeLeft.value > totalSeconds.value) {
    totalSeconds.value = timeLeft.value
  }
  if (isCompleted.value) {
    isCompleted.value = false
    isRunning.value = true
    startTimer()
  }
}

const minutes = computed(() => Math.floor(timeLeft.value / 60))
const seconds = computed(() => timeLeft.value % 60)
const formattedTime = computed(
  () => `${String(minutes.value).padStart(2, '0')}:${String(seconds.value).padStart(2, '0')}`
)

const percentage = computed(() => {
  if (totalSeconds.value <= 0) return 0
  return Math.min(100, Math.max(0, (timeLeft.value / totalSeconds.value) * 100))
})

const isDanger = computed(() => timeLeft.value <= 10 && timeLeft.value > 0)
const isWarning = computed(() => timeLeft.value <= 30 && timeLeft.value > 10)

function handleKeydown(e: KeyboardEvent) {
  if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return
  if (e.key === 't' || e.key === 'T') {
    e.preventDefault()
    togglePlay()
  } else if (e.key === 'r' || e.key === 'R') {
    if (!e.ctrlKey && !e.metaKey) {
      e.preventDefault()
      resetTimer()
    }
  }
}

const timerRootRef = ref<HTMLElement | null>(null)
let observer: IntersectionObserver | null = null

onMounted(() => {
  if (typeof IntersectionObserver !== 'undefined') {
    observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting && entry.intersectionRatio > 0.2) {
          // Slide became visible! Restart timer from beginning
          timeLeft.value = props.initialSeconds
          totalSeconds.value = props.initialSeconds
          isCompleted.value = false
          if (props.autoStart) {
            isRunning.value = true
            startTimer()
          }
        } else {
          // Slide navigated away: stop countdown
          stopTimer()
        }
      }
    }, { threshold: [0.1, 0.3, 0.6] })

    if (timerRootRef.value) {
      observer.observe(timerRootRef.value)
    }
  } else if (props.autoStart) {
    startTimer()
  }
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  stopTimer()
  if (observer) {
    observer.disconnect()
    observer = null
  }
  window.removeEventListener('keydown', handleKeydown)
})

watch(() => props.initialSeconds, (newVal) => {
  timeLeft.value = newVal
  totalSeconds.value = newVal
  isCompleted.value = false
  if (props.autoStart) {
    isRunning.value = true
    startTimer()
  }
})
</script>

<template>
  <div
    ref="timerRootRef"
    class="compact-timer-bar select-none"
    :class="{
      'is-completed': isCompleted,
      'is-danger': isDanger,
      'is-warning': isWarning
    }"
  >
    <!-- Left: Clock & Status -->
    <div class="timer-left">
      <span class="timer-clock font-mono">{{ formattedTime }}</span>
      <span class="timer-pill">
        {{ isCompleted ? "Time's Up!" : isRunning ? 'Active' : 'Paused' }}
      </span>
    </div>

    <!-- Center: Progress Bar -->
    <div class="timer-center-track">
      <div
        class="timer-center-fill"
        :style="{ width: `${percentage}%` }"
      />
    </div>

    <!-- Right: Mini Action Buttons -->
    <div class="timer-actions">
      <button
        type="button"
        class="mini-btn btn-primary"
        :title="isRunning ? 'Pause (T)' : 'Play (T)'"
        @click="togglePlay"
      >
        {{ isRunning ? '❚❚ Pause' : isCompleted ? '↺ Restart' : '▶ Play' }}
      </button>

      <button
        type="button"
        class="mini-btn"
        title="Add 30 seconds"
        @click="add30Seconds"
      >
        +30s
      </button>

      <button
        type="button"
        class="mini-btn"
        title="Reset timer (R)"
        @click="resetTimer"
      >
        Reset
      </button>

      <button
        type="button"
        class="mini-btn btn-icon"
        :title="soundEnabled ? 'Mute chime' : 'Enable chime'"
        @click="soundEnabled = !soundEnabled"
      >
        {{ soundEnabled ? '🔔' : '🔕' }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.compact-timer-bar {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.35rem 0.65rem;
  border-radius: 0.5rem;
  background: #1c1c1a;
  border: 1px solid #383733;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  margin: 0.4rem 0;
  height: 38px;
  box-sizing: border-box;
}

.compact-timer-bar.is-completed {
  border-color: rgba(244, 63, 94, 0.8);
  box-shadow: 0 0 12px rgba(244, 63, 94, 0.25);
}

.compact-timer-bar.is-danger {
  border-color: rgba(244, 63, 94, 0.6);
}

.compact-timer-bar.is-warning {
  border-color: rgba(212, 155, 83, 0.6);
}

.timer-left {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  flex-shrink: 0;
}

.timer-clock {
  font-size: 1.1rem;
  font-weight: 800;
  letter-spacing: 0.05em;
  color: #faf6ee;
}

.is-danger .timer-clock {
  color: #fb7185;
  animation: pulse 1s infinite;
}

.is-warning .timer-clock {
  color: #d49b53;
}

.is-completed .timer-clock {
  color: #fb7185;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.timer-pill {
  font-size: 0.6rem;
  font-family: monospace;
  font-weight: 700;
  text-transform: uppercase;
  padding: 0.1rem 0.35rem;
  border-radius: 0.25rem;
  background: rgba(204, 120, 92, 0.15);
  color: #cc785c;
  border: 1px solid rgba(204, 120, 92, 0.3);
}

.is-completed .timer-pill {
  background: rgba(244, 63, 94, 0.2);
  color: #fb7185;
  border-color: rgba(244, 63, 94, 0.4);
}

.timer-center-track {
  flex: 1;
  height: 4px;
  background: #141413;
  border-radius: 9999px;
  overflow: hidden;
  border: 1px solid rgba(56, 55, 51, 0.4);
  min-width: 40px;
}

.timer-center-fill {
  height: 100%;
  background: #cc785c;
  transition: width 1s linear;
}

.is-warning .timer-center-fill {
  background: #d49b53;
}

.is-danger .timer-center-fill,
.is-completed .timer-center-fill {
  background: #f43f5e;
}

.timer-actions {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  flex-shrink: 0;
}

.mini-btn {
  padding: 0.2rem 0.45rem;
  border-radius: 0.35rem;
  font-size: 0.65rem;
  font-weight: 600;
  background: #252522;
  color: #d4cfc5;
  border: 1px solid #383733;
  cursor: pointer;
  transition: all 0.15s ease;
  line-height: 1.2;
}

.mini-btn:hover {
  background: #2e2e2a;
  border-color: rgba(204, 120, 92, 0.5);
  color: #faf6ee;
}

.btn-primary {
  background: #cc785c;
  color: #181816;
  border-color: #cc785c;
  font-weight: 700;
}

.btn-primary:hover {
  background: #d98266;
  color: #181816;
}

.is-completed .btn-primary {
  background: #e11d48;
  color: white;
  border-color: #e11d48;
}

.btn-icon {
  padding: 0.2rem 0.3rem;
  font-size: 0.7rem;
}
</style>
