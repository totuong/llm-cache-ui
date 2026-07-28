<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useChatStore } from '../stores/chat'
import SidebarPanel from '../components/SidebarPanel.vue'
import ChatHeader from '../components/ChatHeader.vue'
import ChatWelcome from '../components/ChatWelcome.vue'
import ChatMessageList from '../components/ChatMessageList.vue'
import ChatInput from '../components/ChatInput.vue'
import CacheDashboard from '../components/CacheDashboard.vue'
import AuthModal from '../components/AuthModal.vue'
import SettingsModal from '../components/SettingsModal.vue'
import Toast from 'primevue/toast'
import { useToast } from 'primevue/usetoast'

const chatStore = useChatStore()
const toast = useToast()

const showMobileSidebar = ref(false)
const showSidebar = ref(true) // Collapsible sidebar on desktop
const showCacheDashboard = ref(true) // Open by default to highlight the thesis metrics
const showAuthModal = ref(false)
const showSettingsModal = ref(false)

onMounted(() => {
  const theme = localStorage.getItem('hust_theme') || 'dark'
  if (theme === 'light') {
    document.documentElement.classList.add('light-mode')
    document.documentElement.classList.remove('dark')
  } else {
    document.documentElement.classList.remove('light-mode')
    document.documentElement.classList.add('dark')
  }
})

function handleSendPrompt(prompt: string) {
  chatStore.sendMessage(prompt)
}

function handleSelectSuggestion(prompt: string) {
  chatStore.sendMessage(prompt)
  toast.add({
    severity: 'info',
    summary: 'Đã gửi câu hỏi mẫu',
    detail: prompt.length > 35 ? prompt.substring(0, 35) + '...' : prompt,
    life: 2000
  })
}

function toggleSidebar() {
  if (window.innerWidth < 768) {
    showMobileSidebar.value = !showMobileSidebar.value
  } else {
    showSidebar.value = !showSidebar.value
  }
}

function toggleCacheDashboard() {
  showCacheDashboard.value = !showCacheDashboard.value
}
</script>

<template>
  <div class="w-screen h-screen flex bg-bg-app overflow-hidden text-tx-p">
    <Toast position="top-right" />

    <!-- 1. Collapsible Sidebar Panel -->
    <!-- Desktop Sidebar (Hidden on mobile) -->
    <div 
      class="hidden md:block h-full transition-all duration-300 ease-in-out border-r border-border-p shrink-0"
      :class="showSidebar ? 'w-72' : 'w-16'"
    >
      <SidebarPanel
        :collapsed="!showSidebar"
        @open-login="showAuthModal = true"
        @open-settings="showSettingsModal = true"
        @toggle-cache="toggleCacheDashboard"
      />
    </div>

    <!-- Mobile Sidebar overlay panel -->
    <div
      v-if="showMobileSidebar"
      class="fixed inset-0 bg-black/60 z-30 md:hidden"
      @click="showMobileSidebar = false"
    >
      <div 
        class="w-72 h-full bg-bg-side border-r border-border-p"
        @click.stop
      >
        <SidebarPanel
          @open-login="showAuthModal = true"
          @open-settings="showSettingsModal = true"
          @toggle-cache="toggleCacheDashboard"
        />
      </div>
    </div>

    <!-- 2. Chat Section (Center Panel) -->
    <div class="flex-1 flex flex-col min-w-0 bg-bg-app h-full">
      <ChatHeader
        @toggle-sidebar="toggleSidebar"
        @toggle-cache="toggleCacheDashboard"
      />

      <!-- Message History List -->
      <ChatMessageList :messages="chatStore.activeSession?.messages || []">
        <template #welcome>
          <ChatWelcome
            @select-prompt="handleSelectSuggestion"
            @open-login="showAuthModal = true"
          />
        </template>
      </ChatMessageList>

      <!-- Input Text Bar -->
      <ChatInput
        :disabled="chatStore.isTyping"
        @send="handleSendPrompt"
      />
    </div>

    <!-- 3. Collapsible Cache Dashboard (Right Panel) -->
    <!-- Desktop Cache Drawer -->
    <div 
      v-if="showCacheDashboard" 
      class="hidden lg:block shrink-0 h-full"
    >
      <CacheDashboard @close="showCacheDashboard = false" />
    </div>

    <!-- Mobile/Tablet Cache Slide-out (Overlay) -->
    <div 
      v-if="showCacheDashboard" 
      class="fixed inset-y-0 right-0 z-20 flex lg:hidden bg-black/50"
      @click="showCacheDashboard = false"
    >
      <div 
        class="h-full bg-bg-card border-l border-border-p shadow-xl"
        @click.stop
      >
        <CacheDashboard @close="showCacheDashboard = false" />
      </div>
    </div>

    <!-- 4. Overlay Modal Dialogs -->
    <AuthModal v-model:visible="showAuthModal" />
    <SettingsModal v-model:visible="showSettingsModal" />
  </div>
</template>

<style scoped>
/* Scoped adjustments if any */
</style>
