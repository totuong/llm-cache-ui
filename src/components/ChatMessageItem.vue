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
  return 'U'
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
    return `<div class="my-2 border border-border-p rounded-lg overflow-hidden bg-bg-inp font-mono text-[11px] text-tx-p">
      <div class="bg-bg-head px-3 py-1 border-b border-border-p flex justify-between items-center text-[9px] text-tx-s uppercase select-none font-semibold">
        <span>${lang || 'code'}</span>
        <span>${langStore.locale === 'vi' ? 'Mã mẫu' : 'Sample code'}</span>
      </div>
      <pre class="p-2.5 overflow-x-auto text-left leading-relaxed"><code>${code.trim()}</code></pre>
    </div>`
  })

  // Inline code: `code`
  html = html.replace(/`([^`]+)`/g, '<code class="bg-bg-inp border border-border-p text-hust-red px-1.5 py-0.5 rounded font-mono text-[11px] font-semibold">$1</code>')

  // Headers: ### Header
  html = html.replace(/^### (.*$)/gim, '<h4 class="text-sm font-bold text-tx-p mt-3 mb-1 flex items-center gap-1.5">$1</h4>')
  html = html.replace(/^## (.*$)/gim, '<h3 class="text-base font-extrabold text-tx-p mt-4 mb-1.5">$1</h3>')
  html = html.replace(/^# (.*$)/gim, '<h2 class="text-lg font-black text-tx-p mt-5 mb-2">$1</h2>')

  // Bold: **bold**
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong class="font-bold text-tx-p">$1</strong>')

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
        prefix = '<ul class="list-disc pl-5 my-1.5 space-y-0.5 text-tx-p text-xs text-left">'
      }
      return `${prefix}<li class="leading-relaxed text-tx-p">${text}</li>`
    }
    
    // Ordered list
    if (/^\d+\.\s/.test(line.trim())) {
      const text = line.trim().replace(/^\d+\.\s/, '')
      let prefix = ''
      if (!insideOrderedList) {
        insideOrderedList = true
        prefix = '<ol class="list-decimal pl-5 my-1.5 space-y-0.5 text-tx-p text-xs text-left">'
      }
      return `${prefix}<li class="leading-relaxed text-tx-p">${text}</li>`
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
      return suffix + '<div class="h-1.5"></div>'
    }

    // Wrap line in paragraph if it doesn't contain list tag or code container
    if (!line.trim().startsWith('<li') && !line.trim().startsWith('<ul') && !line.trim().startsWith('<ol') && !line.trim().startsWith('<div') && !line.trim().startsWith('<pre') && !line.trim().startsWith('<code') && !line.trim().startsWith('<h')) {
      return suffix + `<p class="leading-relaxed my-1 text-tx-p text-xs text-left">${line}</p>`
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
    class="py-2 px-4 md:px-8 w-full flex transition-all group select-text"
    :class="props.message.sender === 'user' ? 'justify-end' : 'justify-start'"
  >
    <!-- USER MESSAGE (RIGHT ALIGNED BUBBLE - ChatGPT STYLE) -->
    <div 
      v-if="props.message.sender === 'user'" 
      class="flex flex-row-reverse items-start gap-2.5 max-w-[85%] md:max-w-[72%]"
    >
      <!-- User Avatar -->
      <div class="w-7 h-7 rounded-full bg-hust-gold/20 text-hust-gold border border-hust-gold/30 flex items-center justify-center font-bold text-[10px] shrink-0 select-none shadow-xs mt-0.5">
        {{ userInitials }}
      </div>

      <!-- User Message Box -->
      <div class="flex flex-col items-end min-w-0">
        <div class="bg-hust-red/10 border border-hust-red/25 text-tx-p rounded-2xl rounded-tr-xs px-4 py-2.5 shadow-xs text-xs text-left leading-relaxed break-words">
          <div v-html="formattedContent"></div>
        </div>
        <span class="text-[9px] text-tx-s font-normal mt-1 select-none pr-1">
          {{ new Date(props.message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }}
        </span>
      </div>
    </div>

    <!-- BOT ASSISTANT MESSAGE (LEFT ALIGNED BUBBLE - ChatGPT STYLE) -->
    <div 
      v-else 
      class="flex items-start gap-3 max-w-[95%] md:max-w-[85%] w-full"
    >
      <!-- Bot Avatar Badge -->
      <div class="w-7 h-7 rounded-lg bg-hust-red border border-hust-red-dark text-white flex items-center justify-center font-bold text-[9px] shadow-sm shrink-0 select-none mt-0.5">
        HUST
      </div>

      <!-- Bot Message Body -->
      <div class="flex-1 min-w-0 flex flex-col items-start text-left">
        <!-- Sender Name & Timestamp -->
        <div class="flex items-center gap-2 mb-1">
          <span class="text-xs font-bold text-tx-p">LLM-HUST</span>
          <span class="text-[9px] text-tx-s font-normal select-none">
            {{ new Date(props.message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }}
          </span>
        </div>

        <!-- Text Loading typing animation -->
        <div v-if="!props.message.content" class="w-full flex flex-col gap-2 py-1 text-left">
          <div class="h-2.5 bg-border-s rounded animate-shimmer w-3/4"></div>
          <div class="h-2.5 bg-border-s rounded animate-shimmer w-1/2"></div>
          <div class="h-2.5 bg-border-s rounded animate-shimmer w-5/6"></div>
        </div>

        <!-- Render HTML formatted content -->
        <div 
          v-else 
          v-html="formattedContent" 
          class="w-full text-tx-p text-xs leading-relaxed break-words bg-bg-card border border-border-p rounded-2xl rounded-tl-xs p-4 shadow-xs"
        ></div>

        <!-- Cache performance metrics info bar -->
        <div 
          v-if="props.message.cacheStatus" 
          class="mt-2 pt-1.5 w-full flex flex-wrap gap-2 items-center select-none text-left"
        >
          <!-- Cache HIT state -->
          <template v-if="props.message.cacheStatus.hit">
            <div class="flex items-center gap-1 bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 rounded px-2 py-0.5 text-[9px] font-bold shadow-xs">
              <i class="pi pi-bolt text-hust-gold"></i>
              <span>PREFIX CACHE HIT</span>
              <span v-if="props.message.cacheStatus.cacheHitRatioPercentage !== undefined" class="opacity-90 font-mono ml-0.5">
                ({{ props.message.cacheStatus.cacheHitRatioPercentage.toFixed(1) }}%)
              </span>
            </div>
            <span class="text-[9px] text-tx-s flex items-center gap-1 bg-bg-inp border border-border-p px-2 py-0.5 rounded font-mono">
              <i class="pi pi-clock text-emerald-600 dark:text-emerald-400"></i>
              {{ langStore.locale === 'vi' ? 'Độ trễ' : 'Latency' }}: <strong class="text-emerald-600 dark:text-emerald-400">{{ props.message.cacheStatus.executionTimeMs ? `${props.message.cacheStatus.executionTimeMs}ms` : `${props.message.cacheStatus.latency}s` }}</strong>
            </span>
            <span class="text-[9px] text-tx-s flex items-center gap-1 bg-bg-inp border border-border-p px-2 py-0.5 rounded font-mono">
              <i class="pi pi-ticket text-hust-gold"></i>
              {{ langStore.locale === 'vi' ? 'Tiết kiệm' : 'Saved' }}: <strong class="text-emerald-600 dark:text-emerald-400">{{ props.message.cacheStatus.usage?.cachedTokens || props.message.cacheStatus.tokens }} Tokens</strong>
            </span>
          </template>

          <!-- Cache MISS state -->
          <template v-else>
            <div class="flex items-center gap-1 bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30 rounded px-2 py-0.5 text-[9px] font-bold shadow-xs">
              <i class="pi pi-exclamation-triangle"></i>
              <span>CACHE MISS (LLM Compute)</span>
            </div>
            <span class="text-[9px] text-tx-s flex items-center gap-1 bg-bg-inp border border-border-p px-2 py-0.5 rounded font-mono">
              <i class="pi pi-clock"></i>
              {{ langStore.locale === 'vi' ? 'Thời gian xử lý' : 'Latency' }}: <strong class="text-tx-p">{{ props.message.cacheStatus.executionTimeMs ? `${props.message.cacheStatus.executionTimeMs}ms` : `${props.message.cacheStatus.latency}s` }}</strong>
            </span>
            <span class="text-[9px] text-tx-s flex items-center gap-1 bg-bg-inp border border-border-p px-2 py-0.5 rounded font-mono">
              <i class="pi pi-info-circle"></i>
              Total Tokens: <strong class="text-tx-p">{{ props.message.cacheStatus.tokens }} Tokens</strong>
            </span>
          </template>

          <span v-if="props.message.cacheStatus.vllmMetrics" class="text-[9px] text-cyan-700 dark:text-cyan-400 bg-cyan-500/15 border border-cyan-500/30 px-2 py-0.5 rounded font-mono">
            KV Cache GPU: {{ props.message.cacheStatus.vllmMetrics.kvCacheUsagePerc?.toFixed(1) }}%
          </span>
        </div>

        <!-- Copy & Action buttons -->
        <div 
          v-if="props.message.content" 
          class="mt-1 flex items-center gap-2 select-none opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <button 
            class="text-tx-s hover:text-tx-p p-1 rounded hover:bg-bg-btn-hover transition-colors flex items-center gap-1 text-[10px] cursor-pointer"
            @click="copyText"
          >
            <i :class="copied ? 'pi pi-check text-green-500' : 'pi pi-copy'"></i>
            <span>{{ copied ? langStore.t('copied') : langStore.t('copy') }}</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Scoped adjustments */
</style>
