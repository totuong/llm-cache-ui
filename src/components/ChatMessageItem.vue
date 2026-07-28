<script setup lang="ts">
import { computed, ref } from 'vue'
import type { Message } from '../stores/chat'
import { useAuthStore } from '../stores/auth'
import { useLangStore } from '../stores/lang'

const props = defineProps<{
  message: Message
}>()

const authStore = useAuthStore()
const langStore = useLangStore()
const copied = ref(false)

const userInitials = computed(() => {
  if (authStore.isLoggedIn && authStore.profile) {
    return authStore.profile.fullName.substring(0, 2).toUpperCase()
  }
  return 'G'
})

// Quick inline markdown formatter to parse basic text structure without heavy external libraries
const formattedContent = computed(() => {
  let html = props.message.content

  // Escape HTML characters
  html = html
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

  // Code blocks: ```javascript code ```
  html = html.replace(/&lt;pre class="[^"]*"&gt;|&lt;\/pre&gt;/g, '') // avoid duplicate escaping
  html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (_, lang, code) => {
    return `<div class="my-3 border border-zinc-800 rounded-lg overflow-hidden bg-zinc-950 font-mono text-[11px] text-zinc-300">
      <div class="bg-zinc-900 px-3 py-1.5 border-b border-zinc-800 flex justify-between items-center text-[9px] text-zinc-500 uppercase select-none">
        <span>${lang || 'code'}</span>
        <span>${langStore.locale === 'vi' ? 'Mã mẫu' : 'Sample code'}</span>
      </div>
      <pre class="p-3 overflow-x-auto text-left leading-relaxed"><code>${code.trim()}</code></pre>
    </div>`
  })

  // Inline code: `code`
  html = html.replace(/`([^`]+)`/g, '<code class="bg-zinc-900 border border-zinc-800 text-hust-red px-1 py-0.5 rounded font-mono text-[11px] font-semibold">$1</code>')

  // Headers: ### Header
  html = html.replace(/^### (.*$)/gim, '<h4 class="text-sm font-bold text-white mt-4 mb-1.5 flex items-center gap-1.5">$1</h4>')
  html = html.replace(/^## (.*$)/gim, '<h3 class="text-base font-extrabold text-white mt-5 mb-2">$1</h3>')
  html = html.replace(/^# (.*$)/gim, '<h2 class="text-lg font-black text-white mt-6 mb-2.5">$1</h2>')

  // Bold: **bold**
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong class="font-bold text-zinc-100">$1</strong>')

  // Lists: 1. Item or - Item
  const lines = html.split('\n')
  let insideList = false
  let insideOrderedList = false

  const processedLines = lines.map(line => {
    // Bullet list
    if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
      const text = line.trim().substring(2)
      let prefix = ''
      if (!insideList) {
        insideList = true
        prefix = '<ul class="list-disc pl-5 my-2 space-y-1 text-zinc-300 text-xs text-left">'
      }
      return `${prefix}<li class="leading-relaxed">${text}</li>`
    }
    
    // Ordered list
    if (/^\d+\.\s/.test(line.trim())) {
      const text = line.trim().replace(/^\d+\.\s/, '')
      let prefix = ''
      if (!insideOrderedList) {
        insideOrderedList = true
        prefix = '<ol class="list-decimal pl-5 my-2 space-y-1 text-zinc-300 text-xs text-left">'
      }
      return `${prefix}<li class="leading-relaxed">${text}</li>`
    }

    // Close lists if we hit a regular line
    let suffix = ''
    if (insideList && !line.trim().startsWith('- ') && !line.trim().startsWith('* ')) {
      insideList = false
      suffix += '</ul>'
    }
    if (insideOrderedList && !/^\d+\.\s/.test(line.trim())) {
      insideOrderedList = false
      suffix += '</ol>'
    }

    if (line.trim() === '') {
      return suffix + '<div class="h-2"></div>'
    }

    // Wrap line in paragraph if it doesn't contain list tag or code container
    if (!line.trim().startsWith('<li') && !line.trim().startsWith('<ul') && !line.trim().startsWith('<ol') && !line.trim().startsWith('<div') && !line.trim().startsWith('<pre') && !line.trim().startsWith('<code') && !line.trim().startsWith('<h')) {
      return suffix + `<p class="leading-relaxed my-1.5 text-zinc-300 text-xs text-left">${line}</p>`
    }

    return suffix + line
  })

  // Cleanup unclosed lists
  let finalHtml = processedLines.join('\n')
  if (insideList) finalHtml += '</ul>'
  if (insideOrderedList) finalHtml += '</ol>'

  return finalHtml
})

function copyText() {
  navigator.clipboard.writeText(props.message.content)
  copied.value = true
  setTimeout(() => {
    copied.value = false
  }, 2000)
}
</script>

<template>
  <div 
    class="py-5 px-4 md:px-6 w-full flex gap-4 transition-all"
    :class="props.message.sender === 'user' ? 'bg-bg-app/20' : 'bg-bg-card border-y border-border-p'"
  >
    <!-- Avatar badge container -->
    <div class="shrink-0 select-none">
      <div 
        v-if="props.message.sender === 'user'"
        class="w-8 h-8 rounded-lg bg-bg-inp border border-border-p text-tx-p flex items-center justify-center font-bold text-xs shadow-sm"
      >
        {{ userInitials }}
      </div>
      <div 
        v-else
        class="w-8 h-8 rounded-lg bg-hust-red border border-hust-red-dark text-white flex items-center justify-center font-black text-xs shadow"
      >
        HUST
      </div>
    </div>

    <!-- Message bubble body -->
    <div class="flex-1 min-w-0 flex flex-col items-start">
      <!-- Sender Identifier -->
      <div class="flex items-center gap-2 mb-1.5">
        <span class="text-xs font-bold text-tx-p">
          {{ props.message.sender === 'user' ? (langStore.locale === 'vi' ? 'Bạn' : 'You') : 'LLM-HUST' }}
        </span>
        <span class="text-[9px] text-tx-s font-normal select-none">
          {{ new Date(props.message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }}
        </span>
      </div>

      <!-- Text Loading typing animation -->
      <div v-if="!props.message.content && props.message.sender === 'assistant'" class="w-full flex flex-col gap-2 py-1 text-left">
        <div class="h-2.5 bg-border-s rounded animate-shimmer w-3/4"></div>
        <div class="h-2.5 bg-border-s rounded animate-shimmer w-1/2"></div>
        <div class="h-2.5 bg-border-s rounded animate-shimmer w-5/6"></div>
      </div>

      <!-- Render HTML formatted content -->
      <div 
        v-else 
        v-html="formattedContent" 
        class="w-full text-tx-p text-xs leading-relaxed break-words"
      ></div>

      <!-- Cache performance metrics info bar (thesis-critical metadata) -->
      <div 
        v-if="props.message.sender === 'assistant' && props.message.cacheStatus" 
        class="mt-3.5 pt-2 border-t border-border-p w-full flex flex-wrap gap-2 items-center select-none"
      >
        <!-- Cache HIT state -->
        <template v-if="props.message.cacheStatus.hit">
          <div class="flex items-center gap-1 bg-emerald-950/30 text-emerald-400 border border-emerald-900/60 rounded px-2 py-0.5 text-[9px] font-bold">
            <i class="pi pi-bolt"></i>
            <span>CACHE HIT</span>
            <span v-if="props.message.cacheStatus.similarity" class="opacity-75 font-normal ml-0.5">
              ({{ langStore.locale === 'vi' ? 'Khớp ngữ nghĩa' : 'Semantic Similarity' }}: {{ Math.round(props.message.cacheStatus.similarity * 100) }}%)
            </span>
          </div>
          <span class="text-[9px] text-tx-s flex items-center gap-1 bg-bg-inp border border-border-p px-2 py-0.5 rounded">
            <i class="pi pi-clock"></i>
            {{ langStore.locale === 'vi' ? 'Độ trễ' : 'Latency' }}: <strong class="text-emerald-400">{{ props.message.cacheStatus.latency }}s</strong>
          </span>
          <span class="text-[9px] text-tx-s flex items-center gap-1 bg-bg-inp border border-border-p px-2 py-0.5 rounded">
            <i class="pi pi-ticket"></i>
            {{ langStore.locale === 'vi' ? 'Tiết kiệm' : 'Saved' }}: <strong class="text-emerald-400">{{ props.message.cacheStatus.tokens }} Tokens</strong>
          </span>
        </template>

        <!-- Cache MISS state -->
        <template v-else>
          <div class="flex items-center gap-1 bg-amber-950/30 text-amber-500 border border-amber-900/60 rounded px-2 py-0.5 text-[9px] font-bold">
            <i class="pi pi-exclamation-triangle"></i>
            <span>CACHE MISS</span>
          </div>
          <span class="text-[9px] text-tx-s flex items-center gap-1 bg-bg-inp border border-border-p px-2 py-0.5 rounded">
            <i class="pi pi-clock"></i>
            {{ langStore.locale === 'vi' ? 'Độ trễ LLM' : 'LLM Latency' }}: <strong class="text-tx-p">{{ props.message.cacheStatus.latency }}s</strong>
          </span>
          <span class="text-[9px] text-tx-s flex items-center gap-1 bg-bg-inp border border-border-p px-2 py-0.5 rounded">
            <i class="pi pi-info-circle"></i>
            {{ langStore.locale === 'vi' ? 'Nạp cache' : 'Cached' }}: <strong class="text-tx-p">+{{ props.message.cacheStatus.tokens }} Tokens</strong>
          </span>
        </template>
      </div>

      <!-- Action buttons -->
      <div 
        v-if="props.message.content" 
        class="mt-2.5 flex items-center gap-2 select-none opacity-0 group-hover:opacity-100 focus-within:opacity-100 parent-hover-trigger"
        :class="props.message.sender === 'assistant' ? 'self-start' : 'self-start'"
      >
        <button 
          class="text-tx-s hover:text-tx-p p-1 rounded hover:bg-bg-btn-hover transition-colors flex items-center gap-1 text-[10px] cursor-pointer"
          @click="copyText"
        >
          <i :class="copied ? 'pi pi-check text-green-500' : 'pi pi-copy'"></i>
          <span>{{ copied ? langStore.t('copied') : langStore.t('copy') }}</span>
        </button>
        
        <span v-if="props.message.sender === 'assistant'" class="h-3 w-px bg-border-p"></span>
        
        <button 
          v-if="props.message.sender === 'assistant'"
          class="text-tx-s hover:text-tx-p p-1 rounded hover:bg-bg-btn-hover transition-colors cursor-pointer"
          v-tooltip.bottom="langStore.t('useful')"
        >
          <i class="pi pi-thumbs-up text-[10px]"></i>
        </button>
        <button 
          v-if="props.message.sender === 'assistant'"
          class="text-tx-s hover:text-tx-p p-1 rounded hover:bg-bg-btn-hover transition-colors cursor-pointer"
          v-tooltip.bottom="langStore.t('notUseful')"
        >
          <i class="pi pi-thumbs-down text-[10px]"></i>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Force display copy actions on hover of the container */
.py-5:hover .parent-hover-trigger {
  opacity: 1 !important;
}
</style>
