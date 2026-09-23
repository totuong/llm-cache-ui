<script setup lang="ts">
import { ref, watch, nextTick, onMounted } from 'vue'
import type { Message } from '../stores/chat'
import ChatMessageItem from './ChatMessageItem.vue'

const props = defineProps<{
  messages: Message[]
}>()

const scrollContainer = ref<HTMLDivElement | null>(null)

function scrollToBottom() {
  if (scrollContainer.value) {
    scrollContainer.value.scrollTop = scrollContainer.value.scrollHeight
  }
}

// Watch messages and scroll to bottom
watch(
  () => props.messages,
  async () => {
    await nextTick()
    scrollToBottom()
  },
  { deep: true }
)

// Scroll to bottom on mount
onMounted(() => {
  scrollToBottom()
})
</script>

<template>
  <div 
    ref="scrollContainer"
    class="flex-1 overflow-y-auto overflow-x-hidden flex flex-col scroll-smooth py-3 px-2 md:px-4"
  >
    <div v-if="props.messages.length === 0" class="flex-1 flex flex-col">
      <!-- Slot for welcome screen -->
      <slot name="welcome"></slot>
    </div>
    
    <div v-else class="flex flex-col w-full pb-6 space-y-1.5 max-w-5xl mx-auto">
      <ChatMessageItem
        v-for="msg in props.messages"
        :key="msg.id"
        :message="msg"
      />
    </div>
  </div>
</template>
