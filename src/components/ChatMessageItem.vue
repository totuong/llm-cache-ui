<script setup lang="ts">
import { computed, ref } from 'vue'
import type { Message } from '../stores/chat'
import { useAuthStore } from '../stores/auth'
import { useLangStore } from '../stores/lang'

// Lucide Icons
import {
  Zap,
  Clock,
  Coins,
  Copy,
  Check,
  Cpu,
  AlertTriangle,
  Info,
  Terminal,
  Sparkles,
} from 'lucide-vue-next'

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

// Rich Markdown formatting for code snippets, lists, headings, and bold text
const formattedContent = computed(() => {
  let html = props.message.content

  if (!html) return ''

  // Escape HTML characters
  html = html
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

  // Code blocks: ```javascript code ```
  html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (_, lang, code) => {
    return `<div class="my-3 border border-border-p rounded-xl overflow-hidden bg-bg-inp/90 font-mono text-[11px] text-tx-p shadow-xs">
      <div class="bg-bg-head px-3 py-1.5 border-b border-border-p flex justify-between items-center text-[9px] text-tx-s uppercase select-none font-bold">
        <span class="flex items-center gap-1 text-hust-gold">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg>
          ${lang || 'code'}
        </span>
        <span>${langStore.locale === 'vi' ? 'Mã nguồn mẫu' : 'Sample code'}</span>
      </div>
      <pre class="p-3 overflow-x-auto text-left leading-relaxed"><code>${code.trim()}</code></pre>
    </div>`
  })

  // Inline code: `code`
  html = html.replace(/`([^`]+)`/g, '<code class="bg-bg-inp border border-border-p text-hust-gold px-1.5 py-0.5 rounded font-mono text-[11px] font-semibold">$1</code>')

  // Headers: ### Header
  html = html.replace(/^### (.*$)/gim, '<h4 class="text-xs font-extrabold text-tx-p mt-3 mb-1 flex items-center gap-1.5">$1</h4>')
  html = html.replace(/^## (.*$)/gim, '<h3 class="text-sm font-black text-tx-p mt-4 mb-1.5">$1</h3>')
  html = html.replace(/^# (.*$)/gim, '<h2 class="text-base font-black text-tx-p mt-5 mb-2">$1</h2>')

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

    if (!line.trim().startsWith('<li') && !line.trim().startsWith('<ul') && !line.trim().startsWith('<ol') && !line.trim().startsWith('<div') && !line.trim().startsWith('<pre') && !line.trim().startsWith('<code') && !line.trim().startsWith('<h')) {
      return suffix + `<p class="leading-relaxed my-1 text-tx-p text-xs text-left">${line}</p>`
    }

    return suffix + line
  })

  let finalHtml = processedLines.join('\n')
  if (insideList) finalHtml += '</ul>'
  if (insideOrderedList) finalHtml += '</ol>'

  return finalHtml
})

function copyText() {
  if (!props.message.content) return
  navigator.clipboard.writeText(props.message.content)
  copied.value = true
  setTimeout(() => {
    copied.value = false
  }, 2500)
}
</script>

<template>
  <div 
    class="py-2.5 px-4 md:px-8 w-full flex transition-all group select-text"
    :class="props.message.sender === 'user' ? 'justify-end' : 'justify-start'"
  >
    <!-- USER MESSAGE BUBBLE -->
    <div 
      v-if="props.message.sender === 'user'" 
      class="flex flex-row-reverse items-start gap-2.5 max-w-[85%] md:max-w-[72%]"
    >
      <!-- User Avatar -->
      <div class="w-8 h-8 rounded-full bg-hust-gold/20 text-hust-gold border border-hust-gold/40 flex items-center justify-center font-bold text-xs shrink-0 select-none shadow-xs mt-0.5">
        {{ userInitials }}
      </div>

      <!-- User Text Box -->
      <div class="flex flex-col items-end min-w-0">
        <div class="bg-hust-red/15 border border-hust-red/30 text-tx-p rounded-2xl rounded-tr-xs px-4 py-2.5 shadow-xs text-xs text-left leading-relaxed break-words">
          <div v-html="formattedContent"></div>
        </div>
        <span class="text-[9px] text-tx-s font-normal mt-1 select-none pr-1">
          {{ new Date(props.message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }}
        </span>
      </div>
    </div>

    <!-- BOT ASSISTANT MESSAGE BUBBLE -->
    <div 
      v-else 
      class="flex items-start gap-3 max-w-[95%] md:max-w-[85%] w-full"
    >
      <!-- Bot Emblem Avatar -->
      <div class="w-8 h-8 rounded-xl bg-gradient-to-br from-hust-red to-hust-red-dark border border-hust-red/40 text-white flex items-center justify-center font-black text-[10px] shadow-sm shrink-0 select-none mt-0.5">
        HUST
      </div>

      <!-- Bot Message Body -->
      <div class="flex-1 min-w-0 flex flex-col items-start text-left">
        <!-- Sender Header & Time -->
        <div class="flex items-center gap-2 mb-1">
          <span class="text-xs font-bold text-tx-p flex items-center gap-1">
            LLM-HUST
            <Sparkles class="w-3 h-3 text-hust-gold" />
          </span>
          <span class="text-[9px] text-tx-s font-normal select-none font-mono">
            {{ new Date(props.message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }}
          </span>
        </div>

        <!-- Loading Shimmer State -->
        <div v-if="!props.message.content" class="w-full flex flex-col gap-2 py-2 text-left">
          <div class="h-3 bg-border-s rounded-lg animate-shimmer w-3/4"></div>
          <div class="h-3 bg-border-s rounded-lg animate-shimmer w-1/2"></div>
          <div class="h-3 bg-border-s rounded-lg animate-shimmer w-5/6"></div>
        </div>

        <!-- Render Assistant Content -->
        <div 
          v-else 
          v-html="formattedContent" 
          class="w-full text-tx-p text-xs leading-relaxed break-words glass-panel rounded-2xl rounded-tl-xs p-4 shadow-xs"
        ></div>

        <!-- LMCache & vLLM Performance Badges -->
        <div 
          v-if="props.message.cacheStatus" 
          class="mt-2.5 pt-1.5 w-full flex flex-wrap gap-2 items-center select-none text-left"
        >
          <!-- CACHE HIT BADGE -->
          <template v-if="props.message.cacheStatus.hit">
            <div class="flex items-center gap-1.5 bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 rounded-lg px-2.5 py-1 text-[10px] font-extrabold shadow-xs">
              <Zap class="w-3.5 h-3.5 text-hust-gold animate-pulse" />
              <span>PREFIX CACHE HIT</span>
              <span v-if="props.message.cacheStatus.cacheHitRatioPercentage !== undefined" class="font-mono ml-0.5">
                ({{ props.message.cacheStatus.cacheHitRatioPercentage.toFixed(1) }}%)
              </span>
            </div>

            <span class="text-[10px] text-tx-s flex items-center gap-1 bg-bg-inp border border-border-p px-2.5 py-1 rounded-lg font-mono">
              <Clock class="w-3 h-3 text-emerald-400" />
              {{ langStore.locale === 'vi' ? 'Độ trễ' : 'Latency' }}: <strong class="text-emerald-400">{{ props.message.cacheStatus.executionTimeMs ? `${props.message.cacheStatus.executionTimeMs}ms` : `${props.message.cacheStatus.latency}s` }}</strong>
            </span>

            <span class="text-[10px] text-tx-s flex items-center gap-1 bg-bg-inp border border-border-p px-2.5 py-1 rounded-lg font-mono">
              <Coins class="w-3 h-3 text-hust-gold" />
              {{ langStore.locale === 'vi' ? 'Tiết kiệm' : 'Saved' }}: <strong class="text-emerald-400">{{ props.message.cacheStatus.usage?.cachedTokens || props.message.cacheStatus.tokens }} Tokens</strong>
            </span>
          </template>

          <!-- CACHE MISS BADGE -->
          <template v-else>
            <div class="flex items-center gap-1.5 bg-amber-500/15 text-amber-400 border border-amber-500/30 rounded-lg px-2.5 py-1 text-[10px] font-extrabold shadow-xs">
              <AlertTriangle class="w-3.5 h-3.5" />
              <span>CACHE MISS (LLM Compute)</span>
            </div>

            <span class="text-[10px] text-tx-s flex items-center gap-1 bg-bg-inp border border-border-p px-2.5 py-1 rounded-lg font-mono">
              <Clock class="w-3 h-3 text-tx-s" />
              {{ langStore.locale === 'vi' ? 'Thời gian xử lý' : 'Latency' }}: <strong class="text-tx-p">{{ props.message.cacheStatus.executionTimeMs ? `${props.message.cacheStatus.executionTimeMs}ms` : `${props.message.cacheStatus.latency}s` }}</strong>
            </span>

            <span class="text-[10px] text-tx-s flex items-center gap-1 bg-bg-inp border border-border-p px-2.5 py-1 rounded-lg font-mono">
              <Info class="w-3 h-3 text-tx-s" />
              Total Tokens: <strong class="text-tx-p">{{ props.message.cacheStatus.tokens }} Tokens</strong>
            </span>
          </template>

          <span v-if="props.message.cacheStatus.vllmMetrics" class="text-[10px] text-accent-cyan bg-accent-cyan/15 border border-accent-cyan/30 px-2.5 py-1 rounded-lg font-mono flex items-center gap-1">
            <Cpu class="w-3 h-3" />
            KV Cache GPU: {{ props.message.cacheStatus.vllmMetrics.kvCacheUsagePerc?.toFixed(1) }}%
          </span>
        </div>

        <!-- Copy Action Bar -->
        <div 
          v-if="props.message.content" 
          class="mt-1.5 flex items-center gap-2 select-none opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <button 
            class="text-tx-s hover:text-tx-p px-2 py-1 rounded-md hover:bg-bg-btn-hover transition-colors flex items-center gap-1 text-[10px] cursor-pointer font-medium"
            @click="copyText"
          >
            <Check v-if="copied" class="w-3.5 h-3.5 text-emerald-400" />
            <Copy v-else class="w-3.5 h-3.5" />
            <span>{{ copied ? langStore.t('copied') : langStore.t('copy') }}</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
