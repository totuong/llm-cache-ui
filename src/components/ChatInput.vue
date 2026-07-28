<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue'
import { useLangStore } from '../stores/lang'

const props = defineProps<{
  disabled: boolean
}>()

const emit = defineEmits<{
  (e: 'send', content: string): void
}>()

const langStore = useLangStore()

const textContent = ref('')
const textareaRef = ref<HTMLTextAreaElement | null>(null)

function adjustHeight() {
  const ta = textareaRef.value
  if (!ta) return
  ta.style.height = 'auto'
  // Cap height at 160px
  const newHeight = Math.min(ta.scrollHeight, 160)
  ta.style.height = `${newHeight}px`
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    submit()
  }
}

function submit() {
  if (!textContent.value.trim() || props.disabled) return
  emit('send', textContent.value.trim())
  textContent.value = ''
  
  // Reset height
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
      <!-- Input container wrapper -->
      <div 
        class="bg-bg-inp border border-border-p rounded-2xl flex flex-col p-1.5 focus-within:border-border-s focus-within:ring-1 focus-within:ring-border-s transition-all"
        :class="props.disabled ? 'opacity-60 cursor-not-allowed' : ''"
      >
        <!-- Text Area input -->
        <textarea
          ref="textareaRef"
          v-model="textContent"
          rows="1"
          :placeholder="langStore.t('inputPlaceholder')"
          class="w-full bg-transparent border-0 ring-0 focus:ring-0 focus:outline-none text-tx-p placeholder-tx-m text-xs px-3 py-1.5 resize-none leading-relaxed overflow-y-auto max-h-40 min-h-[32px] text-left"
          :disabled="props.disabled"
          @input="adjustHeight"
          @keydown="handleKeydown"
        ></textarea>

        <!-- Tool bar actions at the bottom of the textarea -->
        <div class="flex items-center justify-between px-2 pt-1 border-t border-border-p mt-1">
          <!-- Left side icon tools -->
          <div class="flex items-center gap-1.5">
            <!-- File attachments mockup -->
            <button 
              class="w-7 h-7 flex items-center justify-center text-tx-s hover:text-tx-p hover:bg-bg-btn-hover rounded-lg transition-colors cursor-pointer"
              v-tooltip.top="langStore.locale === 'vi' ? 'Đính kèm tài liệu' : 'Attach document'"
              :disabled="props.disabled"
            >
              <i class="pi pi-paperclip text-xs"></i>
            </button>
            <!-- Microphone mockup -->
            <button 
              class="w-7 h-7 flex items-center justify-center text-tx-s hover:text-tx-p hover:bg-bg-btn-hover rounded-lg transition-colors cursor-pointer"
              v-tooltip.top="langStore.locale === 'vi' ? 'Nhập liệu bằng giọng nói' : 'Voice dictation'"
              :disabled="props.disabled"
            >
              <i class="pi pi-microphone text-xs"></i>
            </button>
          </div>

          <!-- Right side: character count and submit button -->
          <div class="flex items-center gap-2">
            <span v-if="textContent.length > 0" class="text-[9px] text-tx-m font-mono select-none">
              {{ textContent.length }} {{ langStore.locale === 'vi' ? 'ký tự' : 'chars' }}
            </span>
            
            <button
              class="w-7 h-7 rounded-lg flex items-center justify-center transition-all cursor-pointer"
              :class="[
                textContent.trim() && !props.disabled
                  ? 'bg-hust-red hover:bg-hust-red-hover text-white shadow-sm'
                  : 'bg-bg-btn-hover text-tx-m cursor-not-allowed'
              ]"
              :disabled="!textContent.trim() || props.disabled"
              @click="submit"
            >
              <i class="pi pi-arrow-up text-xs font-bold"></i>
            </button>
          </div>
        </div>
      </div>

      <!-- University academic disclaimer info banner -->
      <div class="text-[9px] text-tx-m text-center select-none leading-relaxed">
        {{ langStore.t('disclaimer') }}
      </div>
    </div>
  </div>
</template>
