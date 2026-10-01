<script setup lang="ts">
import { useChatStore } from '../stores/chat'
import { useAuthStore } from '../stores/auth'
import { useLangStore } from '../stores/lang'
import { computed } from 'vue'

// Lucide Icons
import {
  Sparkles,
  ArrowUpRight,
  UserCheck,
  LogIn,
  GraduationCap,
  Zap,
  BookOpen,
  Code2,
} from 'lucide-vue-next'

const emit = defineEmits<{
  (e: 'select-prompt', prompt: string): void
  (e: 'open-login'): void
}>()

const chatStore = useChatStore()
const authStore = useAuthStore()
const langStore = useLangStore()

// Dynamically translate recommendation prompt cards
const translatedRecommendations = computed(() => {
  if (langStore.locale === 'en') {
    return [
      {
        title: 'Prefix Caching LMCache',
        desc: 'Explain prefix caching technique in LMCache and vLLM',
        prompt: 'Explain prefix caching technique in LMCache and vLLM?',
        icon: Zap,
      },
      {
        title: 'Graduation Registration',
        desc: 'Guide on submission processes for graduation thesis at HUST',
        prompt: 'What are the steps and deadlines for IT graduation thesis registration at HUST?',
        icon: GraduationCap,
      },
      {
        title: 'Optimize LLM Cache',
        desc: 'Explain semantic caching techniques for your thesis',
        prompt: 'Explain how to implement Semantic Caching for LLMs and its benefits on API cost.',
        icon: Sparkles,
      },
      {
        title: 'Thesis Formatting Rules',
        desc: 'Formatting standards for writing HUST university thesis report',
        prompt: 'What are HUST standards for font family, line spacing, and cover structure in graduation reports?',
        icon: BookOpen,
      }
    ]
  }

  const icons = [Zap, GraduationCap, Sparkles, BookOpen]
  return chatStore.recommendations.map((item, idx) => ({
    ...item,
    icon: icons[idx % icons.length]
  }))
})
</script>

<template>
  <div class="flex-1 flex flex-col justify-center items-center px-4 max-w-2xl mx-auto w-full text-center select-none py-8">
    
    <!-- Central Brand Emblem Badge -->
    <div class="relative w-14 h-14 rounded-2xl bg-gradient-to-br from-hust-red via-hust-red-hover to-hust-red-dark flex items-center justify-center text-white shadow-lg border border-hust-red/40 mb-4 glow-border-red">
      <span class="font-black text-base tracking-wider">HUST</span>
      <div class="absolute -top-1 -right-1 flex items-center justify-center px-1.5 py-0.5 rounded-full bg-hust-gold text-zinc-950 font-black text-[9px] shadow">
        AI
      </div>
    </div>

    <!-- Main Headings -->
    <h2 class="text-2xl md:text-3xl font-black text-tx-p tracking-tight flex items-center gap-2">
      <span>{{ langStore.t('welcomeTitle') }}</span>
    </h2>
    <p class="text-xs text-tx-s max-w-md mt-2 leading-relaxed">
      {{ langStore.t('welcomeDesc') }}
    </p>

    <!-- General Profile Box if Logged In -->
    <div 
      v-if="authStore.isLoggedIn && authStore.profile"
      class="mt-6 w-full glass-panel p-3.5 rounded-2xl flex items-center gap-3.5 text-left border border-border-p shadow-xs"
    >
      <img 
        v-if="authStore.profile.avatarUrl" 
        :src="authStore.profile.avatarUrl" 
        class="w-10 h-10 rounded-xl border border-border-s object-cover shrink-0 select-none" 
      />
      <div 
        v-else 
        class="w-10 h-10 rounded-xl bg-hust-red/20 border border-hust-red/40 flex items-center justify-center text-hust-red font-bold text-sm shrink-0"
      >
        {{ authStore.profile.fullName.charAt(0) }}
      </div>
      <div class="flex-1 truncate">
        <div class="flex items-center gap-1.5">
          <span class="font-bold text-xs text-tx-p">{{ authStore.profile.fullName }}</span>
          <span class="text-[8px] bg-bg-btn-hover text-tx-s border border-border-p px-1.5 py-0.5 rounded font-mono uppercase font-semibold">{{ authStore.profile.authMethod }}</span>
        </div>
        <p class="text-[10px] text-tx-m truncate mt-0.5 font-mono">
          {{ authStore.profile.email }}
        </p>
      </div>
      <div class="text-[10px] text-emerald-400 flex items-center gap-1.5 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20 font-bold">
        <UserCheck class="w-3.5 h-3.5" />
        <span>{{ langStore.t('member') }}</span>
      </div>
    </div>

    <!-- Generic Invite Box if Not Logged In -->
    <div 
      v-else
      class="mt-6 w-full glass-panel p-4 rounded-2xl flex items-center justify-between text-left border border-border-p shadow-xs"
    >
      <div>
        <p class="text-xs font-bold text-tx-p">{{ langStore.t('loginPrompt') }}</p>
        <p class="text-[10px] text-tx-s mt-0.5">{{ langStore.t('loginDesc') }}</p>
      </div>
      <button 
        class="bg-hust-red hover:bg-hust-red-hover text-white px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap shadow-xs flex items-center gap-1.5"
        @click="emit('open-login')"
      >
        <LogIn class="w-3.5 h-3.5" />
        <span>{{ langStore.t('loginBtn') }}</span>
      </button>
    </div>

    <!-- Suggested Cards Grid -->
    <div class="mt-8 w-full flex flex-col gap-3">
      <div class="text-left text-[10px] font-bold tracking-wider text-tx-m uppercase flex items-center gap-1.5">
        <Sparkles class="w-3.5 h-3.5 text-hust-gold" />
        <span>{{ langStore.t('suggestedPrompts') }}</span>
      </div>
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div
          v-for="(card, idx) in translatedRecommendations"
          :key="idx"
          class="glass-panel border border-border-p hover:border-border-s rounded-2xl p-3.5 text-left transition-all hover:bg-bg-btn-hover/60 cursor-pointer shadow-xs group"
          @click="emit('select-prompt', card.prompt)"
        >
          <div class="flex items-center justify-between">
            <span class="font-bold text-xs text-tx-p group-hover:text-hust-red transition-colors flex items-center gap-1.5">
              <component :is="card.icon" class="w-3.5 h-3.5 text-hust-gold" />
              {{ card.title }}
            </span>
            <ArrowUpRight class="w-3.5 h-3.5 text-tx-m group-hover:text-tx-p group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
          </div>
          <p class="text-[10px] text-tx-s mt-1.5 line-clamp-2 leading-relaxed">
            {{ card.desc }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
