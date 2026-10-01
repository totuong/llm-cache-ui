<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue'
import { useLangStore } from '../stores/lang'
import {
  ArrowUp,
  Paperclip,
  Mic,
  MicOff,
  Sparkles,
} from 'lucide-vue-next'

const props = defineProps<{
  disabled: boolean
}>()

const emit = defineEmits<{
  (e: 'send', content: string): void
}>()

const langStore = useLangStore()

const textContent = ref('')
const isRecording = ref(false)
const textareaRef = ref<HTMLTextAreaElement | null>(null)

function adjustHeight() {
  const ta = textareaRef.value
  if (!ta) return
  ta.style.height = 'auto'
  const newHeight = Math.min(ta.scrollHeight, 160)
  ta.style.height = `${newHeight}px`
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    submit()
  }
}

function toggleDictation() {
  isRecording.value = !isRecording.value
  if (isRecording.value) {
    textContent.value += ' ' + (langStore.locale === 'vi' ? '[Ghi âm]: Trình bày thuật toán LMCache' : '[Dictation]: Explain LMCache algorithm')
    adjustHeight()
  }
}

function submit() {
  if (!textContent.value.trim() || props.disabled) return
  emit('send', textContent.value.trim())
  textContent.value = ''
  
  nextTick(() => {
    if (textareaRef.value) {
      textareaRef.value.style.height = 'auto'
    }
  })
}

onMounted(() => {
  if (textareaRef.value) {
    adjustHeight()
  }
})
</script>

<template>
  <div class="p-3 md:p-4 bg-bg-app shrink-0 select-none border-t border-border-p">
    <div class="max-w-2xl mx-auto w-full flex flex-col gap-2">
      <!-- Input Container Container Box -->
      <div 
        class="glass-panel border border-border-p rounded-2xl flex flex-col p-2 focus-within:border-border-s focus-within:ring-1 focus-within:ring-border-s transition-all shadow-xs"
        :class="props.disabled ? 'opacity-60 cursor-not-allowed' : ''"
      >
        <!-- Text Area Input Field -->
        <textarea
          ref="textareaRef"
          v-model="textContent"
          rows="1"
          :placeholder="langStore.t('inputPlaceholder')"
          class="w-full bg-transparent border-0 ring-0 focus:ring-0 focus:outline-none text-tx-p placeholder-tx-m text-xs px-3 py-1.5 resize-none leading-relaxed overflow-y-auto max-h-40 min-h-[36px] text-left"
          :disabled="props.disabled"
          @input="adjustHeight"
          @keydown="handleKeydown"
        ></textarea>

        <!-- Bottom Actions Bar -->
        <div class="flex items-center justify-between px-2 pt-1 border-t border-border-p/50 mt-1">
          <!-- Left Tool Icons -->
          <div class="flex items-center gap-1.5">
            <button 
              class="w-7 h-7 flex items-center justify-center text-tx-s hover:text-tx-p hover:bg-bg-btn-hover rounded-lg transition-colors cursor-pointer"
              v-tooltip.top="langStore.locale === 'vi' ? 'Đính kèm tài liệu' : 'Attach document'"
              :disabled="props.disabled"
            >
              <Paperclip class="w-3.5 h-3.5" />
            </button>

            <button 
              class="w-7 h-7 flex items-center justify-center text-tx-s hover:text-tx-p hover:bg-bg-btn-hover rounded-lg transition-colors cursor-pointer"
              :class="isRecording ? 'text-rose-400 bg-rose-500/10 animate-pulse' : ''"
              v-tooltip.top="langStore.locale === 'vi' ? 'Nhập liệu bằng giọng nói' : 'Voice dictation'"
              :disabled="props.disabled"
              @click="toggleDictation"
            >
              <MicOff v-if="isRecording" class="w-3.5 h-3.5" />
              <Mic v-else class="w-3.5 h-3.5" />
            </button>
          </div>

          <!-- Right side: char count and send button -->
          <div class="flex items-center gap-2">
            <span v-if="textContent.length > 0" class="text-[9px] text-tx-m font-mono select-none">
              {{ textContent.length }} {{ langStore.locale === 'vi' ? 'ký tự' : 'chars' }}
            </span>
            
            <button
              class="w-8 h-8 rounded-xl flex items-center justify-center transition-all cursor-pointer shadow-xs"
              :class="[
                textContent.trim() && !props.disabled
                  ? 'bg-hust-red hover:bg-hust-red-hover text-white shadow-xs'
                  : 'bg-bg-btn-hover text-tx-m cursor-not-allowed'
              ]"
              :disabled="!textContent.trim() || props.disabled"
              @click="submit"
            >
              <ArrowUp class="w-4 h-4 font-bold" />
            </button>
          </div>
        </div>
      </div>

      <!-- University academic disclaimer info banner -->
      <div class="text-[9px] text-tx-m text-center select-none leading-relaxed font-mono">
        {{ langStore.t('disclaimer') }}
      </div>
    </div>
  </div>
</template>
