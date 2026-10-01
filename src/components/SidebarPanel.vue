<script setup lang="ts">
import { ref } from 'vue'
import { useChatStore } from '../stores/chat'
import { useAuthStore } from '../stores/auth'
import { useCacheStore } from '../stores/cache'
import { useLangStore } from '../stores/lang'
import InputText from 'primevue/inputtext'

// Lucide Icons
import {
  Plus,
  MessageSquare,
  Settings,
  Search,
  X,
  Pencil,
  Trash2,
  Check,
  BarChart3,
  LogOut,
  User,
  Zap,
  Sparkles,
} from 'lucide-vue-next'

const props = defineProps<{
  collapsed?: boolean
}>()

const emit = defineEmits<{
  (e: 'open-login'): void
  (e: 'open-settings'): void
  (e: 'toggle-cache'): void
}>()

const chatStore = useChatStore()
const authStore = useAuthStore()
const cacheStore = useCacheStore()
const langStore = useLangStore()

const editingSessionId = ref<string | null>(null)
const editingTitle = ref('')

function startRename(id: string, currentTitle: string) {
  editingSessionId.value = id
  editingTitle.value = currentTitle
}

function saveRename(id: string) {
  if (editingTitle.value.trim()) {
    chatStore.renameSession(id, editingTitle.value.trim())
  }
  editingSessionId.value = null
}

function cancelRename() {
  editingSessionId.value = null
}
</script>

<template>
  <aside class="w-full h-full bg-bg-side flex flex-col select-none">

    <!-- Top Brand Header -->
    <div 
      class="p-4 border-b border-border-p flex"
      :class="props.collapsed ? 'flex-col gap-4 items-center' : 'flex-col gap-3 justify-between'"
    >
      <div class="flex items-center justify-between w-full" v-if="!props.collapsed">
        <router-link
          to="/about"
          class="flex items-center gap-2.5 hover:opacity-90 transition-opacity cursor-pointer"
          v-tooltip.bottom="langStore.locale === 'vi' ? 'Xem thông tin đề tài HUST SOICT' : 'View HUST SOICT thesis overview'"
        >
          <!-- Custom SVG Emblem Logo -->
          <img src="/favicon.svg" alt="LLM-HUST Cache Logo" class="w-7 h-7 shadow-xs shrink-0 object-contain" />
          <div>
            <h1 class="font-extrabold text-xs tracking-wide text-tx-p flex items-center gap-1.5">
              LLM-HUST <span class="text-[9px] text-hust-gold px-1.5 py-0.5 rounded-full bg-hust-gold/10 border border-hust-gold/20 font-bold">SOICT</span>
            </h1>
            <p class="text-[9px] text-tx-s">
              {{ langStore.locale === 'vi' ? 'Đề tài tối ưu hóa Cache' : 'LLM Cache Optimization' }}
            </p>
          </div>
        </router-link>

        <!-- Settings Button -->
        <button
          class="text-tx-s hover:text-tx-p hover:bg-bg-btn-hover p-1.5 w-7 h-7 rounded-lg flex items-center justify-center cursor-pointer transition-colors"
          v-tooltip.bottom="langStore.locale === 'vi' ? 'Cài đặt hệ thống' : 'System Settings'"
          @click="emit('open-settings')"
        >
          <Settings class="w-4 h-4" />
        </button>
      </div>

      <!-- Collapsed Header Elements -->
      <template v-else>
        <img
          src="/favicon.svg"
          alt="LLM-HUST Cache Logo"
          class="w-8 h-8 shadow-xs cursor-pointer shrink-0 object-contain hover:scale-105 transition-transform"
          v-tooltip.right="langStore.locale === 'vi' ? 'LLM Cache Engine' : 'LLM Cache Engine'"
          @click="chatStore.createNewSession()"
        />
        <button
          class="text-tx-s hover:text-tx-p hover:bg-bg-btn-hover p-1.5 w-7 h-7 rounded-lg flex items-center justify-center cursor-pointer transition-colors"
          v-tooltip.right="langStore.locale === 'vi' ? 'Cài đặt hệ thống' : 'System Settings'"
          @click="emit('open-settings')"
        >
          <Settings class="w-4 h-4" />
        </button>
      </template>

      <!-- New Chat Button -->
      <button 
        v-if="!props.collapsed"
        class="w-full bg-bg-inp border border-border-s text-tx-s hover:bg-bg-btn-hover hover:text-tx-p text-xs font-bold py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
        @click="chatStore.createNewSession()"
      >
        <Plus class="w-4 h-4 text-hust-gold" />
        <span>{{ langStore.t('newChat') }}</span>
      </button>

      <button 
        v-else
        class="w-8 h-8 rounded-xl bg-bg-inp border border-border-s text-tx-s hover:bg-bg-btn-hover flex items-center justify-center cursor-pointer transition-all shrink-0"
        v-tooltip.right="langStore.t('newChat')" 
        @click="chatStore.createNewSession()"
      >
        <Plus class="w-4 h-4 text-hust-gold" />
      </button>

      <!-- Search Input (Expanded mode) -->
      <div class="relative" v-if="!props.collapsed">
        <input 
          v-model="chatStore.searchFilter"
          type="text"
          :placeholder="langStore.t('searchChat')" 
          class="w-full bg-bg-inp border border-border-p text-tx-p text-xs px-3 py-1.5 rounded-lg pl-8 focus:outline-none focus:border-border-s"
        />
        <Search class="w-3.5 h-3.5 text-tx-m absolute left-2.5 top-1/2 -translate-y-1/2" />
        <X 
          v-if="chatStore.searchFilter" 
          class="w-3.5 h-3.5 text-tx-s hover:text-tx-p absolute right-2.5 top-1/2 -translate-y-1/2 cursor-pointer"
          @click="chatStore.searchFilter = ''" 
        />
      </div>
    </div>

    <!-- Middle Recent Chat List -->
    <div 
      class="flex-1 overflow-y-auto p-2"
      :class="props.collapsed ? 'space-y-3 flex flex-col items-center' : 'space-y-1'"
    >
      <div v-if="!props.collapsed" class="px-2 py-1.5 text-[9px] font-bold text-tx-m tracking-wider uppercase flex items-center justify-between">
        <span>{{ langStore.t('recentChats') }}</span>
        <span class="text-tx-s font-mono">({{ chatStore.filteredSessions.length }})</span>
      </div>

      <div v-if="chatStore.filteredSessions.length === 0 && !props.collapsed" class="p-4 text-center text-xs text-tx-m border border-dashed border-border-p rounded-xl">
        {{ langStore.t('noChats') }}
      </div>

      <!-- Expanded List -->
      <template v-if="!props.collapsed">
        <div 
          v-for="sess in chatStore.filteredSessions" 
          :key="sess.id"
          class="group relative flex items-center w-full rounded-xl px-3 py-2 text-xs transition-all cursor-pointer border border-transparent"
          :class="[
            chatStore.activeSessionId === sess.id
              ? 'bg-bg-btn-hover text-tx-p font-semibold border-border-s shadow-xs'
              : 'text-tx-s hover:bg-bg-btn-hover/50 hover:text-tx-p'
          ]" 
          @click="chatStore.selectSession(sess.id)"
        >
          <MessageSquare class="w-4 h-4 mr-2.5 shrink-0 text-tx-s group-hover:text-tx-p" />

          <!-- Inline Rename Mode -->
          <div v-if="editingSessionId === sess.id" class="flex-1 flex items-center gap-1 z-10" @click.stop>
            <input 
              v-model="editingTitle"
              type="text"
              class="bg-bg-inp text-tx-p text-xs px-2 py-0.5 rounded-md border border-hust-red w-full focus:outline-none rename-input font-mono"
              @keyup.enter="saveRename(sess.id)" 
              @keyup.esc="cancelRename" 
              autofocus 
            />
            <button class="text-emerald-400 p-0.5 font-bold cursor-pointer" @click="saveRename(sess.id)">
              <Check class="w-3.5 h-3.5" />
            </button>
            <button class="text-tx-s hover:text-tx-p p-0.5 font-bold cursor-pointer" @click="cancelRename">
              <X class="w-3.5 h-3.5" />
            </button>
          </div>

          <!-- Title Display -->
          <span v-else class="flex-1 truncate pr-8">
            {{ sess.title }}
          </span>

          <!-- Hover Action Controls -->
          <div 
            v-if="editingSessionId !== sess.id"
            class="absolute right-2 opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity"
          >
            <button 
              class="text-tx-s hover:text-tx-p p-1 cursor-pointer"
              v-tooltip.bottom="langStore.locale === 'vi' ? 'Đổi tên' : 'Rename'"
              @click.stop="startRename(sess.id, sess.title)"
            >
              <Pencil class="w-3 h-3" />
            </button>
            <button 
              class="text-tx-s hover:text-rose-400 p-1 cursor-pointer"
              v-tooltip.bottom="langStore.locale === 'vi' ? 'Xóa' : 'Delete'"
              @click.stop="chatStore.deleteSession(sess.id)"
            >
              <Trash2 class="w-3 h-3" />
            </button>
          </div>
        </div>
      </template>

      <!-- Collapsed Icon List -->
      <template v-else>
        <button 
          v-for="sess in chatStore.filteredSessions" 
          :key="sess.id"
          class="w-8 h-8 rounded-xl flex items-center justify-center transition-all cursor-pointer shrink-0 border border-transparent"
          :class="[
            chatStore.activeSessionId === sess.id
              ? 'bg-bg-inp text-tx-p border-border-s shadow-xs'
              : 'text-tx-s hover:bg-bg-btn-hover/50 hover:text-tx-p'
          ]" 
          v-tooltip.right="sess.title" 
          @click="chatStore.selectSession(sess.id)"
        >
          <MessageSquare class="w-4 h-4" />
        </button>
      </template>
    </div>

    <!-- Bottom Performance Dashboard & Account Info -->
    <div 
      class="p-3 border-t border-border-p flex flex-col gap-2 shrink-0"
      :class="props.collapsed ? 'items-center' : ''"
    >
      <!-- Full Dashboard & L2 Advisor Router Link -->
      <router-link
        to="/dashboard"
        v-if="!props.collapsed"
        class="w-full flex items-center justify-between rounded-xl px-3 py-2 text-xs bg-gradient-to-r from-hust-red/10 via-bg-inp to-hust-gold/10 border border-hust-gold/30 text-tx-p hover:border-hust-gold/60 transition-all cursor-pointer font-bold shadow-xs mb-1"
      >
        <div class="flex items-center gap-2">
          <Sparkles class="w-4 h-4 text-hust-gold" />
          <span>{{ langStore.locale === 'vi' ? 'Analytics & L2 Advisor' : 'L2 Storage Advisor' }}</span>
        </div>
        <span class="bg-hust-gold/20 text-hust-gold text-[9px] px-2 py-0.5 rounded-full font-mono font-bold">
          NEW
        </span>
      </router-link>

      <router-link
        to="/dashboard"
        v-else
        class="w-8 h-8 rounded-xl bg-bg-inp border border-hust-gold/30 text-tx-s hover:bg-bg-btn-hover hover:text-tx-p flex items-center justify-center cursor-pointer transition-all shrink-0 mb-1"
        v-tooltip.right="langStore.locale === 'vi' ? 'Analytics & Tư vấn L2 Storage' : 'L2 Storage Advisor'"
      >
        <Sparkles class="w-4 h-4 text-hust-gold" />
      </router-link>

      <!-- Quick Caching Stats Drawer Toggle Button -->
      <button 
        v-if="!props.collapsed"
        class="w-full flex items-center justify-between rounded-xl px-3 py-2 text-xs bg-bg-inp border border-border-s text-tx-s hover:bg-bg-btn-hover hover:text-tx-p transition-all cursor-pointer font-bold shadow-xs"
        @click="emit('toggle-cache')"
      >
        <div class="flex items-center gap-2">
          <BarChart3 class="w-4 h-4 text-hust-gold" />
          <span>{{ langStore.t('cachePerformance') }}</span>
        </div>
        <span 
          v-if="cacheStore.enabled"
          class="bg-hust-red text-white text-[9px] px-2 py-0.5 rounded-full font-mono font-bold shadow-xs"
        >
          Hit: {{ cacheStore.hitRate }}%
        </span>
        <span v-else class="bg-bg-btn-hover text-tx-s text-[9px] px-2 py-0.5 rounded-full">
          {{ langStore.locale === 'vi' ? 'Off' : 'Off' }}
        </span>
      </button>

      <!-- Collapsed Caching Stats Button -->
      <button 
        v-else
        class="w-8 h-8 rounded-xl bg-bg-inp border border-border-s text-tx-s hover:bg-bg-btn-hover hover:text-tx-p flex items-center justify-center cursor-pointer transition-all relative shrink-0"
        v-tooltip.right="langStore.t('cachePerformance') + ' (' + cacheStore.hitRate + '%)'"
        @click="emit('toggle-cache')"
      >
        <BarChart3 class="w-4 h-4 text-hust-gold" />
        <span 
          v-if="cacheStore.enabled"
          class="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border border-zinc-950"
        ></span>
      </button>

      <!-- Account Profile / Login Toggle -->
      <template v-if="authStore.isLoggedIn && authStore.profile">
        <!-- Expanded Profile -->
        <div 
          v-if="!props.collapsed"
          class="flex items-center justify-between bg-bg-inp/50 border border-border-p p-2.5 rounded-xl text-xs w-full shadow-xs"
        >
          <div class="flex items-center gap-2 truncate">
            <img 
              v-if="authStore.profile.avatarUrl" 
              :src="authStore.profile.avatarUrl" 
              class="w-8 h-8 rounded-lg border border-border-s object-cover shrink-0 select-none" 
            />
            <div 
              v-else 
              class="w-8 h-8 rounded-lg bg-hust-red/20 border border-hust-red/40 flex items-center justify-center text-hust-red font-bold text-xs shrink-0 select-none"
            >
              {{ authStore.profile.fullName.charAt(0) }}
            </div>
            <div class="truncate text-left">
              <p class="font-bold text-tx-p truncate text-xs">{{ authStore.profile.fullName }}</p>
              <p class="text-[9px] text-tx-s truncate font-mono">{{ authStore.profile.email }}</p>
            </div>
          </div>

          <button
            class="text-tx-s hover:text-rose-400 p-1.5 rounded-lg hover:bg-bg-btn-hover transition-colors cursor-pointer"
            v-tooltip.bottom="langStore.t('logout')" 
            @click="authStore.logout()"
          >
            <LogOut class="w-4 h-4" />
          </button>
        </div>

        <!-- Collapsed Profile -->
        <div v-else class="flex flex-col gap-2 items-center w-full shrink-0">
          <img 
            v-if="authStore.profile.avatarUrl" 
            :src="authStore.profile.avatarUrl" 
            class="w-8 h-8 rounded-lg border border-border-p object-cover select-none cursor-pointer"
            v-tooltip.right="authStore.profile.fullName" 
          />
          <div 
            v-else 
            class="w-8 h-8 rounded-lg bg-hust-red/20 border border-hust-red/40 flex items-center justify-center text-hust-red font-bold text-xs cursor-pointer select-none"
            v-tooltip.right="authStore.profile.fullName"
          >
            {{ authStore.profile.fullName.charAt(0) }}
          </div>

          <button
            class="text-tx-s hover:text-rose-400 p-1 rounded hover:bg-bg-btn-hover transition-colors cursor-pointer w-8 h-8 flex items-center justify-center"
            v-tooltip.right="langStore.t('logout')" 
            @click="authStore.logout()"
          >
            <LogOut class="w-4 h-4" />
          </button>
        </div>
      </template>

      <template v-else>
        <!-- Expanded Login -->
        <button 
          v-if="!props.collapsed"
          class="w-full flex items-center justify-center gap-2 rounded-xl border border-dashed border-border-s hover:border-border-p py-2.5 text-xs text-tx-s hover:text-tx-p transition-all font-bold cursor-pointer"
          @click="emit('open-login')"
        >
          <User class="w-4 h-4" />
          <span>{{ langStore.t('loginAccount') }}</span>
        </button>

        <!-- Collapsed Login -->
        <button 
          v-else
          class="w-8 h-8 rounded-xl border border-dashed border-border-s hover:border-border-p flex items-center justify-center text-tx-s hover:text-tx-p cursor-pointer transition-all bg-bg-inp/20 shrink-0"
          v-tooltip.right="langStore.t('loginAccount')" 
          @click="emit('open-login')"
        >
          <User class="w-4 h-4" />
        </button>
      </template>
    </div>
  </aside>
</template>
