<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { RouterView } from 'vue-router'
import { useCacheStore, AUTO_REFRESH_INTERVAL_MS } from './stores/cache'
import { useChatStore } from './stores/chat'
import { useAuthStore } from './stores/auth'

const cacheStore = useCacheStore()
const chatStore = useChatStore()
const authStore = useAuthStore()

let autoRefreshTimer: any = null

onMounted(async () => {
  // Single, authoritative metrics & status fetch on page load / F5
  await cacheStore.refreshBackendMetrics(true)
  chatStore.isBackendLive = cacheStore.isBackendLive

  // Sync user's cloud chat history if already authenticated
  if (authStore.isLoggedIn) {
    try {
      await chatStore.syncHistoryFromBackend()
    } catch {
      // Non-blocking on initial load
    }
  }

  // Background refresh every 30 minutes
  autoRefreshTimer = setInterval(() => {
    cacheStore.refreshBackendMetrics()
  }, AUTO_REFRESH_INTERVAL_MS)
})

onUnmounted(() => {
  if (autoRefreshTimer) {
    clearInterval(autoRefreshTimer)
  }
})
</script>

<template>
  <RouterView />
</template>

<style>
/* Dynamic styling resets */
body, html, #app {
  margin: 0;
  padding: 0;
  width: 100%;
  height: 100%;
}
</style>
