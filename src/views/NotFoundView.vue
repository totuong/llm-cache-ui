<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import {
  Home,
  BarChart3,
  BookOpen,
  ArrowLeft,
  AlertTriangle,
  Zap,
  Sun,
  Moon,
} from 'lucide-vue-next'

const router = useRouter()
const isDarkMode = ref(true)

onMounted(() => {
  const theme = localStorage.getItem('hust_theme') || 'dark'
  isDarkMode.value = theme === 'dark'
})

function toggleTheme() {
  isDarkMode.value = !isDarkMode.value
  const newTheme = isDarkMode.value ? 'dark' : 'light'
  localStorage.setItem('hust_theme', newTheme)

  if (isDarkMode.value) {
    document.documentElement.classList.remove('light-mode')
    document.documentElement.classList.add('dark')
  } else {
    document.documentElement.classList.add('light-mode')
    document.documentElement.classList.remove('dark')
  }
}

function goBack() {
  if (window.history.length > 1) {
    router.back()
  } else {
    router.push('/')
  }
}
</script>

<template>
  <div class="w-screen h-screen bg-bg-app text-tx-p flex flex-col items-center justify-between p-6 select-none overflow-hidden relative">
    
    <!-- Background Ambient Glow Effects -->
    <div class="absolute -top-32 -left-32 w-96 h-96 bg-hust-red/15 rounded-full blur-3xl pointer-events-none"></div>
    <div class="absolute -bottom-32 -right-32 w-96 h-96 bg-hust-gold/15 rounded-full blur-3xl pointer-events-none"></div>

    <!-- Header -->
    <header class="w-full max-w-5xl flex items-center justify-between z-10">
      <div class="flex items-center gap-2.5">
        <img src="/favicon.svg" alt="LLM Cache Logo" class="w-8 h-8 shrink-0 object-contain shadow-xs" />
        <span class="font-extrabold text-xs tracking-wide text-tx-p">
          LLM-HUST <span class="text-hust-gold text-[10px]">SOICT</span>
        </span>
      </div>

      <button
        class="text-tx-s hover:text-tx-p p-2 rounded-xl hover:bg-bg-btn-hover border border-border-s transition-colors cursor-pointer"
        @click="toggleTheme"
      >
        <Sun v-if="isDarkMode" class="w-4 h-4 text-hust-gold" />
        <Moon v-else class="w-4 h-4 text-accent-violet" />
      </button>
    </header>

    <!-- Center 404 Content -->
    <main class="flex-1 flex flex-col items-center justify-center text-center max-w-lg z-10 space-y-6">
      
      <!-- Big 404 Glowing Badge -->
      <div class="relative">
        <h1 class="text-8xl md:text-9xl font-black font-mono tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-hust-red via-hust-gold to-accent-cyan select-none drop-shadow-lg">
          404
        </h1>
        <div class="absolute -top-2 -right-2 px-3 py-1 bg-rose-500/20 text-rose-400 border border-rose-500/30 text-[10px] font-bold rounded-full font-mono flex items-center gap-1 uppercase tracking-wider">
          <AlertTriangle class="w-3 h-3" />
          <span>Page Not Found</span>
        </div>
      </div>

      <div class="space-y-2">
        <h2 class="text-xl md:text-2xl font-black text-tx-p tracking-tight">
          Không Tìm Thấy Trang Yêu Cầu
        </h2>
        <p class="text-xs md:text-sm text-tx-s leading-relaxed">
          Đường dẫn URL bạn truy cập không tồn tại, đã bị di chuyển hoặc thiết lập bộ nhớ đệm cache không hợp lệ.
        </p>
      </div>

      <!-- Action Buttons Grid -->
      <div class="flex flex-col sm:flex-row items-center justify-center gap-3 w-full pt-2">
        <router-link
          to="/"
          class="w-full sm:w-auto bg-hust-red hover:bg-hust-red-hover text-white text-xs px-5 py-2.5 rounded-xl font-bold transition-all cursor-pointer flex items-center justify-center gap-2 shadow-xs"
        >
          <Home class="w-4 h-4" />
          <span>Về Chat Studio</span>
        </router-link>

        <router-link
          to="/dashboard"
          class="w-full sm:w-auto bg-bg-inp hover:bg-bg-btn-hover border border-hust-gold/40 text-tx-p text-xs px-5 py-2.5 rounded-xl font-bold transition-all cursor-pointer flex items-center justify-center gap-2 shadow-xs"
        >
          <BarChart3 class="w-4 h-4 text-hust-gold" />
          <span>Mở Metrics Dashboard</span>
        </router-link>

        <button
          class="w-full sm:w-auto bg-bg-inp hover:bg-bg-btn-hover border border-border-s text-tx-s hover:text-tx-p text-xs px-4 py-2.5 rounded-xl font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
          @click="goBack"
        >
          <ArrowLeft class="w-4 h-4" />
          <span>Quay lại</span>
        </button>
      </div>
    </main>

    <!-- Footer -->
    <footer class="text-center text-[10px] text-tx-s font-mono z-10">
      LLM Cache Optimization UI • Powered by LMCache & vLLM Engine
    </footer>

  </div>
</template>
