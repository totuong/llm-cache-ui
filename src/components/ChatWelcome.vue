<script setup lang="ts">
import { useChatStore } from '../stores/chat'
import { useAuthStore } from '../stores/auth'
import { useLangStore } from '../stores/lang'
import { computed } from 'vue'

const emit = defineEmits<{
  (e: 'select-prompt', prompt: string): void
  (e: 'open-login'): void
}>()

const chatStore = useChatStore()
const authStore = useAuthStore()
const langStore = useLangStore()

// Dynamically translate suggestion cards based on active locale
const translatedRecommendations = computed(() => {
  if (langStore.locale === 'en') {
    return [
      {
        title: 'Graduation Registration',
        desc: 'Guide on submission processes for graduation thesis at HUST',
        prompt: 'What are the steps and deadlines for IT graduation thesis registration at HUST?'
      },
      {
        title: 'Optimize LLM Cache',
        desc: 'Explain semantic caching techniques for your thesis',
        prompt: 'Explain how to implement Semantic Caching for LLMs and its benefits on API cost.'
      },
      {
        title: 'Thesis Formatting Rules',
        desc: 'Formatting standards for writing HUST university thesis report',
        prompt: 'What are HUST standards for font family, line spacing, and cover structure in graduation reports?'
      },
      {
        title: 'Sample Code Snippets',
        desc: 'JavaScript Node.js code connecting Redis Cache to LLM APIs',
        prompt: 'Write a sample JavaScript Node.js code showing simple caching setup with Redis when calling OpenAI APIs.'
      }
    ]
  }
  return chatStore.recommendations
})
</script>

<template>
  <div class="flex-1 flex flex-col justify-center items-center px-4 max-w-2xl mx-auto w-full text-center select-none py-8">
    
    <!-- Central Brand Ring Icon -->
    <div class="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-hust-red to-hust-red-dark flex items-center justify-center text-white shadow-xl shadow-hust-red/10 border border-hust-red/30 mb-5 animate-pulse">
      <span class="font-black text-2xl tracking-widest">HUST</span>
      <div class="absolute -top-1.5 -right-1.5 flex items-center justify-center w-5 h-5 rounded-full bg-hust-gold text-zinc-950 font-bold text-[10px] shadow">
        AI
      </div>
    </div>

    <!-- Main Headings -->
    <h2 class="text-xl md:text-2xl font-black text-tx-p tracking-tight">
      {{ langStore.t('welcomeTitle') }}
    </h2>
    <p class="text-xs text-tx-s max-w-md mt-2">
      {{ langStore.t('welcomeDesc') }}
    </p>

    <!-- General Profile Box if Logged In -->
    <div 
      v-if="authStore.isLoggedIn && authStore.profile"
      class="mt-5 w-full bg-gradient-to-r from-hust-red/5 to-hust-gold/5 border border-border-p p-3 rounded-xl flex items-center gap-3.5 text-left animate-fade-in"
    >
      <img 
        v-if="authStore.profile.avatarUrl" 
        :src="authStore.profile.avatarUrl" 
        class="w-9 h-9 rounded-lg border border-border-s object-cover shrink-0 select-none" 
      />
      <div 
        v-else 
        class="w-9 h-9 rounded-lg bg-hust-red/15 border border-hust-red/30 flex items-center justify-center text-hust-red font-bold text-sm shrink-0"
      >
        {{ authStore.profile.fullName.charAt(0) }}
      </div>
      <div class="flex-1 truncate">
        <div class="flex items-center gap-1.5">
          <span class="font-bold text-xs text-tx-p">{{ authStore.profile.fullName }}</span>
          <span class="text-[8px] bg-bg-btn-hover text-tx-s border border-border-p px-1.5 py-0.5 rounded font-mono uppercase font-semibold">{{ authStore.profile.authMethod }}</span>
        </div>
        <p class="text-[10px] text-tx-m truncate mt-0.5">
          {{ authStore.profile.email }}
        </p>
      </div>
      <div class="text-[10px] text-emerald-400 flex items-center gap-1 bg-emerald-500/5 px-2 py-0.5 rounded border border-emerald-500/10">
        <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
        <span>{{ langStore.t('member') }}</span>
      </div>
    </div>

    <!-- Generic Invite Box if Not Logged In -->
    <div 
      v-else
      class="mt-5 w-full bg-bg-card border border-border-p p-3.5 rounded-xl flex items-center justify-between text-left"
    >
      <div>
        <p class="text-xs font-semibold text-tx-p">{{ langStore.t('loginPrompt') }}</p>
        <p class="text-[10px] text-tx-s mt-0.5">{{ langStore.t('loginDesc') }}</p>
      </div>
      <button 
        class="bg-bg-btn-hover hover:text-tx-btn-hover px-3 py-1.5 rounded-lg border border-border-p text-[10px] font-bold transition-all cursor-pointer whitespace-nowrap text-tx-s"
        @click="emit('open-login')"
      >
        {{ langStore.t('loginBtn') }}
      </button>
    </div>

    <!-- Suggested Cards Grid -->
    <div class="mt-8 w-full flex flex-col gap-2.5">
      <div class="text-left text-[9px] font-bold tracking-wider text-tx-m uppercase">
        {{ langStore.t('suggestedPrompts') }}
      </div>
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div
          v-for="(card, idx) in translatedRecommendations"
          :key="idx"
          class="bg-bg-card border border-border-s hover:border-border-p rounded-xl p-3 text-left transition-all hover:bg-bg-btn-hover cursor-pointer shadow-sm group"
          @click="emit('select-prompt', card.prompt)"
        >
          <div class="flex items-center justify-between">
            <span class="font-bold text-xs text-tx-p group-hover:text-hust-red transition-colors">{{ card.title }}</span>
            <i class="pi pi-arrow-up-right text-[9px] text-tx-m group-hover:text-tx-s group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all"></i>
          </div>
          <p class="text-[10px] text-tx-s mt-1 line-clamp-2 leading-relaxed">
            {{ card.desc }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
