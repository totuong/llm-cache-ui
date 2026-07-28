<script setup lang="ts">
import { ref } from 'vue'
import { useChatStore } from '../stores/chat'
import { useAuthStore } from '../stores/auth'
import { useCacheStore } from '../stores/cache'
import { useLangStore } from '../stores/lang'
import InputText from 'primevue/inputtext'

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

    <!-- Top Brand Logo Header -->
    <div class="p-4 border-b border-border-p flex"
      :class="props.collapsed ? 'flex-col gap-4 items-center' : 'flex-col gap-3 justify-between'">
      <div class="flex items-center justify-between w-full" v-if="!props.collapsed">
        <div class="flex items-center gap-2.5">
          <!-- HUST School Red Emblem Logo -->
          <div
            class="w-8 h-8 rounded bg-hust-red flex items-center justify-center text-white font-extrabold text-sm shadow">
            H
          </div>
          <div>
            <h1 class="font-extrabold text-sm tracking-wide text-tx-p flex items-center gap-1.5">
              LLM-HUST <span
                class="text-[10px] text-hust-gold px-1.5 py-0.5 rounded bg-hust-gold/10 border border-hust-gold/20 font-bold">SOICT</span>
            </h1>
            <p class="text-[10px] text-tx-s">
              {{ langStore.locale === 'vi' ? 'Đề tài tối ưu hóa Cache' : 'LLM Cache Optimization' }}
            </p>
          </div>
        </div>

        <!-- Settings button -->
        <button
          class="text-tx-s hover:text-tx-p hover:bg-bg-btn-hover p-1 w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer transition-colors"
          v-tooltip.bottom="langStore.locale === 'vi' ? 'Cài đặt hệ thống' : 'System Settings'"
          @click="emit('open-settings')">
          <i class="pi pi-cog text-sm"></i>
        </button>
      </div>

      <!-- Collapsed Logo & Settings stacked -->
      <template v-else>
        <div
          class="w-8 h-8 rounded bg-hust-red flex items-center justify-center text-white font-extrabold text-sm shadow cursor-pointer shrink-0"
          v-tooltip.right="langStore.locale === 'vi' ? 'Đại học Bách Khoa Hà Nội' : 'HUST University'"
          @click="chatStore.createNewSession()">
          H
        </div>
        <button
          class="text-tx-s hover:text-tx-p hover:bg-bg-btn-hover p-1 w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer transition-colors"
          v-tooltip.right="langStore.locale === 'vi' ? 'Cài đặt hệ thống' : 'System Settings'"
          @click="emit('open-settings')">
          <i class="pi pi-cog text-sm"></i>
        </button>
      </template>

      <!-- New Chat Button -->
      <button v-if="!props.collapsed"
        class="w-full bg-bg-inp border border-border-s text-tx-s hover:bg-bg-btn-hover hover:text-tx-btn-hover text-xs font-semibold py-2 rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
        @click="chatStore.createNewSession()">
        <i class="pi pi-plus text-[10px]"></i>
        <span>{{ langStore.t('newChat') }}</span>
      </button>
      <button v-else
        class="w-8 h-8 rounded-full bg-bg-inp border border-border-s text-tx-s hover:bg-bg-btn-hover flex items-center justify-center cursor-pointer transition-all shrink-0"
        v-tooltip.right="langStore.t('newChat')" @click="chatStore.createNewSession()">
        <i class="pi pi-plus text-xs animate-pulse"></i>
      </button>

      <!-- Search Input (Only when expanded) -->
      <div class=" relative" v-if="!props.collapsed">
        <IconField class="w-full">
          <InputText v-model="chatStore.searchFilter" :placeholder="langStore.t('searchChat')" class="w-full pr-8" />
        </IconField>

        <i v-if="chatStore.searchFilter" class="pi pi-times absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer"
          @click="chatStore.searchFilter = ''" />
      </div>
    </div>

    <!-- Middle Recent Chat List -->
    <div class="flex-1 overflow-y-auto p-2"
      :class="props.collapsed ? 'space-y-3 flex flex-col items-center' : 'space-y-1'">
      <div v-if="!props.collapsed" class="px-2 py-1.5 text-[9px] font-bold text-tx-m tracking-wider uppercase">
        {{ langStore.t('recentChats') }}
      </div>

      <div v-if="chatStore.filteredSessions.length === 0 && !props.collapsed" class="p-3 text-center text-xs text-tx-m">
        {{ langStore.t('noChats') }}
      </div>

      <!-- Expanded List -->
      <template v-if="!props.collapsed">
        <div v-for="sess in chatStore.filteredSessions" :key="sess.id"
          class="group relative flex items-center w-full rounded-lg px-3 py-2 text-xs transition-all cursor-pointer"
          :class="[
            chatStore.activeSessionId === sess.id
              ? 'bg-bg-btn-hover text-tx-p font-medium border border-border-s'
              : 'text-tx-s hover:bg-bg-btn-hover/50 hover:text-tx-p'
          ]" @click="chatStore.selectSession(sess.id)">
          <i class="pi pi-comments mr-2.5 text-tx-s group-hover:text-tx-p"></i>

          <!-- Inline Rename Mode -->
          <div v-if="editingSessionId === sess.id" class="flex-1 flex items-center gap-1 z-10" @click.stop>
            <InputText v-model="editingTitle"
              class="bg-bg-inp text-tx-p text-xs px-1.5 py-0.5 rounded border border-hust-red w-full focus:ring-0 rename-input"
              @keyup.enter="saveRename(sess.id)" @keyup.esc="cancelRename" autofocus />
            <button class="text-green-500 hover:text-green-400 p-0.5 font-bold" @click="saveRename(sess.id)">
              <i class="pi pi-check text-[10px]"></i>
            </button>
            <button class="text-tx-s hover:text-tx-p p-0.5 font-bold" @click="cancelRename">
              <i class="pi pi-times text-[10px]"></i>
            </button>
          </div>

          <!-- Text View Mode -->
          <span v-else class="flex-1 truncate pr-8">
            {{ sess.title }}
          </span>

          <!-- Floating Hover Actions -->
          <div v-if="editingSessionId !== sess.id"
            class="absolute right-2 opacity-0 group-hover:opacity-100 flex items-center gap-1.5 transition-opacity">
            <button class="text-tx-s hover:text-tx-p p-0.5 cursor-pointer"
              v-tooltip.bottom="langStore.locale === 'vi' ? 'Đổi tên' : 'Rename'"
              @click.stop="startRename(sess.id, sess.title)">
              <i class="pi pi-pencil text-[10px]"></i>
            </button>
            <button class="text-tx-s hover:text-red-400 p-0.5 cursor-pointer"
              v-tooltip.bottom="langStore.locale === 'vi' ? 'Xóa' : 'Delete'"
              @click.stop="chatStore.deleteSession(sess.id)">
              <i class="pi pi-trash text-[10px]"></i>
            </button>
          </div>
        </div>
      </template>

      <!-- Collapsed List (Display speech bubbles with tooltips) -->
      <template v-else>
        <button v-for="sess in chatStore.filteredSessions" :key="sess.id"
          class="w-8 h-8 rounded-lg flex items-center justify-center transition-all cursor-pointer shrink-0 border border-transparent"
          :class="[
            chatStore.activeSessionId === sess.id
              ? 'bg-bg-inp text-tx-p border border-border-s'
              : 'text-tx-s hover:bg-bg-btn-hover/50 hover:text-tx-p'
          ]" v-tooltip.right="sess.title" @click="chatStore.selectSession(sess.id)">
          <i class="pi pi-comments text-xs"></i>
        </button>
      </template>
    </div>

    <!-- Bottom Dashboard Nav & Auth Info -->
    <div class="p-3 border-t border-border-p flex flex-col gap-2.5 shrink-0"
      :class="props.collapsed ? 'items-center' : ''">
      <!-- Caching Dashboard Link button with Badge -->
      <button v-if="!props.collapsed"
        class="w-full flex items-center justify-between rounded-lg px-3 py-2 text-xs bg-bg-inp border border-border-s text-tx-s hover:bg-bg-btn-hover hover:text-tx-p transition-all cursor-pointer font-medium"
        @click="emit('toggle-cache')">
        <div class="flex items-center gap-2">
          <i class="pi pi-chart-bar text-hust-gold"></i>
          <span>{{ langStore.t('cachePerformance') }}</span>
        </div>
        <span v-if="cacheStore.enabled"
          class="bg-hust-red text-white text-[9px] px-1.5 py-0.5 rounded-full font-bold shadow-sm">
          Hit: {{ cacheStore.hitRate }}%
        </span>
        <span v-else class="bg-bg-btn-hover text-tx-s text-[9px] px-1.5 py-0.5 rounded-full">
          {{ langStore.locale === 'vi' ? 'Tắt' : 'Off' }}
        </span>
      </button>

      <!-- Collapsed Caching Stats Button -->
      <button v-else
        class="w-8 h-8 rounded-lg bg-bg-inp border border-border-s text-tx-s hover:bg-bg-btn-hover hover:text-tx-p flex items-center justify-center cursor-pointer transition-all relative shrink-0"
        v-tooltip.right="langStore.t('cachePerformance') + ' (' + cacheStore.hitRate + '%)'"
        @click="emit('toggle-cache')">
        <i class="pi pi-chart-bar text-hust-gold text-xs"></i>
        <span v-if="cacheStore.enabled"
          class="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 border border-zinc-950"></span>
      </button>

      <!-- Account Profile / Login Toggle -->
      <template v-if="authStore.isLoggedIn && authStore.profile">
        <!-- Expanded Profile -->
        <div v-if="!props.collapsed"
          class="flex items-center justify-between bg-bg-inp/40 border border-border-p p-2.5 rounded-lg text-xs w-full">
          <div class="flex items-center gap-2 truncate">
            <!-- Small User Avatar -->
            <img v-if="authStore.profile.avatarUrl" :src="authStore.profile.avatarUrl"
              class="w-8 h-8 rounded-full border border-border-s object-cover shrink-0 select-none" />
            <div v-else
              class="w-8 h-8 rounded-full bg-hust-red/20 border border-hust-red/35 flex items-center justify-center text-hust-red font-bold text-xs shrink-0 select-none">
              {{ authStore.profile.fullName.charAt(0) }}
            </div>
            <div class="truncate text-left">
              <p class="font-semibold text-tx-p truncate">{{ authStore.profile.fullName }}</p>
              <p class="text-[9px] text-tx-s truncate">{{ authStore.profile.email }}</p>
            </div>
          </div>

          <button
            class="text-tx-s hover:text-red-400 p-1 rounded hover:bg-bg-btn-hover transition-colors cursor-pointer"
            v-tooltip.bottom="langStore.t('logout')" @click="authStore.logout()">
            <i class="pi pi-sign-out text-xs"></i>
          </button>
        </div>

        <!-- Collapsed Profile (Show only user initials avatar or image, with logout below) -->
        <div v-else class="flex flex-col gap-2 items-center w-full shrink-0">
          <img v-if="authStore.profile.avatarUrl" :src="authStore.profile.avatarUrl"
            class="w-8 h-8 rounded-full border border-border-p object-cover select-none cursor-pointer"
            v-tooltip.right="authStore.profile.fullName" />
          <div v-else
            class="w-8 h-8 rounded-full bg-hust-red/20 border border-hust-red/35 flex items-center justify-center text-hust-red font-bold text-xs cursor-pointer select-none"
            v-tooltip.right="authStore.profile.fullName">
            {{ authStore.profile.fullName.charAt(0) }}
          </div>

          <button
            class="text-tx-s hover:text-red-400 p-1 rounded hover:bg-bg-btn-hover transition-colors cursor-pointer w-8 h-8 flex items-center justify-center"
            v-tooltip.right="langStore.t('logout')" @click="authStore.logout()">
            <i class="pi pi-sign-out text-xs"></i>
          </button>
        </div>
      </template>

      <template v-else>
        <!-- Expanded login -->
        <button v-if="!props.collapsed"
          class="w-full flex items-center justify-center gap-2 rounded-lg border border-dashed border-border-s hover:border-border-p py-2.5 text-xs text-tx-s hover:text-tx-p transition-all font-medium cursor-pointer"
          @click="emit('open-login')">
          <i class="pi pi-user text-xs"></i>
          <span>{{ langStore.t('loginAccount') }}</span>
        </button>

        <!-- Collapsed login -->
        <button v-else
          class="w-8 h-8 rounded-lg border border-dashed border-border-s hover:border-border-p flex items-center justify-center text-tx-s hover:text-tx-p cursor-pointer transition-all bg-bg-inp/10 shrink-0"
          v-tooltip.right="langStore.t('loginAccount')" @click="emit('open-login')">
          <i class="pi pi-user text-xs"></i>
        </button>
      </template>
    </div>
  </aside>
</template>
