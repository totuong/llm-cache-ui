<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useLangStore } from '../stores/lang'
import {
  ArrowLeft,
  Zap,
  Cpu,
  Layers,
  Database,
  ShieldCheck,
  Sparkles,
  BarChart3,
  ExternalLink,
  Code2,
  HardDrive,
  Cloud,
  CheckCircle2,
  Clock,
  TrendingUp,
  BookOpen,
  Award,
  Sun,
  Moon,
  Github,
  Server,
} from 'lucide-vue-next'

const langStore = useLangStore()
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
</script>

<template>
  <div class="min-h-screen w-full bg-bg-app text-tx-p flex flex-col select-none overflow-x-hidden">
    
    <!-- Top Navigation Header -->
    <header class="h-16 border-b border-border-p bg-bg-head/80 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-50 shadow-xs">
      <div class="flex items-center gap-4">
        <router-link
          to="/"
          class="flex items-center gap-2 text-tx-s hover:text-tx-p bg-bg-inp hover:bg-bg-btn-hover px-3 py-1.5 rounded-xl border border-border-s text-xs font-bold transition-all cursor-pointer shadow-xs"
        >
          <ArrowLeft class="w-4 h-4 text-hust-gold" />
          <span>Chat Studio</span>
        </router-link>

        <div class="h-4 w-px bg-border-p hidden sm:block"></div>

        <div class="flex items-center gap-2.5">
          <img src="/favicon.svg" alt="LLM Cache Logo" class="w-8 h-8 shrink-0 object-contain shadow-xs" />
          <div>
            <h1 class="font-extrabold text-xs tracking-wide text-tx-p flex items-center gap-2">
              LMCache & vLLM System Overview
              <span class="text-[9px] text-hust-gold px-2 py-0.5 rounded-full bg-hust-gold/10 border border-hust-gold/20 font-bold font-mono">
                STUDENT PROJECT
              </span>
            </h1>
            <p class="text-[10px] text-tx-s">Hệ Thống Tối Ưu Hóa Bộ Nhớ Đệm KV Cache</p>
          </div>
        </div>
      </div>

      <div class="flex items-center gap-3">
        <router-link
          to="/dashboard"
          class="bg-bg-inp hover:bg-bg-btn-hover border border-border-s text-tx-p text-xs px-3.5 py-2 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
        >
          <BarChart3 class="w-3.5 h-3.5 text-hust-gold" />
          <span class="hidden sm:inline">Metrics & L2 Advisor</span>
        </router-link>

        <button
          class="text-tx-s hover:text-tx-p p-2 rounded-xl hover:bg-bg-btn-hover border border-border-s transition-colors cursor-pointer"
          @click="toggleTheme"
        >
          <Sun v-if="isDarkMode" class="w-4 h-4 text-hust-gold" />
          <Moon v-else class="w-4 h-4 text-accent-violet" />
        </button>
      </div>
    </header>

    <!-- Main Content Area -->
    <main class="flex-1 max-w-6xl mx-auto w-full p-6 md:p-10 space-y-12">
      
      <!-- HERO BANNER SECTION -->
      <section class="glass-panel p-8 md:p-12 rounded-3xl border border-border-p bg-gradient-to-br from-hust-red/10 via-bg-card to-hust-gold/10 relative overflow-hidden shadow-lg space-y-6">
        <div class="absolute -right-10 -bottom-10 w-72 h-72 bg-hust-red/10 rounded-full blur-3xl pointer-events-none"></div>
        <div class="absolute -left-10 -top-10 w-72 h-72 bg-hust-gold/10 rounded-full blur-3xl pointer-events-none"></div>

        <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-hust-red/15 border border-hust-red/30 text-hust-red text-xs font-bold font-mono">
          <Award class="w-3.5 h-3.5" />
          <span>ĐỀ TÀI CÁ NHÂN / RESEARCH PROJECT</span>
        </div>

        <div class="space-y-3 max-w-3xl">
          <h1 class="text-2xl md:text-4xl font-black tracking-tight leading-tight text-tx-p">
            Nghiên Cứu & Tối Ưu Hóa Tầng Lưu Trữ KV Cache Cho Mô Hình Ngôn Ngữ Lớn Dựa Trên LMCache & vLLM
          </h1>
          <p class="text-sm md:text-base text-tx-s leading-relaxed font-normal">
            Giải pháp tăng tốc xử lý câu hỏi (Time To First Token - TTFT) và giảm chi phí tính toán lại (Prefill Re-computation) bằng cách lưu trữ và tái sử dụng bộ nhớ đệm Key-Value (KV Cache) trên kiến trúc lưu trữ đa tầng (Multi-tier L1/L2 Cache Architecture).
          </p>
        </div>

        <!-- KPI Highlights Bar -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-border-p">
          <div class="bg-bg-inp/70 p-4 rounded-2xl border border-border-p">
            <div class="flex items-center gap-2 text-emerald-400 font-bold text-xs">
              <Clock class="w-4 h-4" />
              <span>GIẢM ĐỘ TRỄ TTFT</span>
            </div>
            <div class="text-2xl font-black text-tx-p font-mono mt-1">Lên đến ~97.2%</div>
            <p class="text-[10px] text-tx-s mt-0.5">Truy xuất tức thì KV Cache có sẵn</p>
          </div>

          <div class="bg-bg-inp/70 p-4 rounded-2xl border border-border-p">
            <div class="flex items-center gap-2 text-hust-gold font-bold text-xs">
              <TrendingUp class="w-4 h-4" />
              <span>THROUGHPUT SYSTEM</span>
            </div>
            <div class="text-2xl font-black text-tx-p font-mono mt-1">Tăng 3.5x - 10.0x</div>
            <p class="text-[10px] text-tx-s mt-0.5">Phục vụ được nhiều yêu cầu đồng thời hơn</p>
          </div>

          <div class="bg-bg-inp/70 p-4 rounded-2xl border border-border-p">
            <div class="flex items-center gap-2 text-accent-cyan font-bold text-xs">
              <Zap class="w-4 h-4" />
              <span>RE-COMPUTATION</span>
            </div>
            <div class="text-2xl font-black text-tx-p font-mono mt-1">0% Re-prefill</div>
            <p class="text-[10px] text-tx-s mt-0.5">Loại bỏ hoàn toàn việc tính lại prompt chung</p>
          </div>
        </div>
      </section>

      <!-- SYSTEM ARCHITECTURE SECTION -->
      <section class="space-y-6">
        <div class="flex flex-col md:flex-row md:items-end justify-between gap-2 border-b border-border-p pb-4">
          <div>
            <h2 class="text-xl font-black text-tx-p flex items-center gap-2">
              <Layers class="w-5 h-5 text-hust-gold" />
              Kiến Trúc Tối Ưu Đa Tầng LMCache Engine
            </h2>
            <p class="text-xs text-tx-s mt-1">Cách thức hoạt động của bộ nhớ đệm KV Cache từ L1 GPU đến các tầng L2 Storage</p>
          </div>
          <span class="text-xs font-mono font-bold text-hust-gold bg-hust-gold/10 px-3 py-1 rounded-full border border-hust-gold/20 self-start md:self-auto">
            PagedAttention + Prefix Caching
          </span>
        </div>

        <!-- 4 Step Flow Cards -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div class="glass-panel p-5 rounded-2xl border border-border-p space-y-3 relative shadow-xs">
            <div class="w-7 h-7 rounded-lg bg-hust-red text-white font-black text-xs flex items-center justify-center font-mono">
              01
            </div>
            <h3 class="font-extrabold text-sm text-tx-p">Prompt Ingestion</h3>
            <p class="text-xs text-tx-s leading-relaxed">
              Người dùng gửi yêu cầu văn bản dài (Long-context Prompt). Hệ thống tính mã Hash Prefix cho từng khối token (Chunk).
            </p>
          </div>

          <div class="glass-panel p-5 rounded-2xl border border-border-p space-y-3 relative shadow-xs">
            <div class="w-7 h-7 rounded-lg bg-hust-gold text-zinc-950 font-black text-xs flex items-center justify-center font-mono">
              02
            </div>
            <h3 class="font-extrabold text-sm text-tx-p">L1 GPU Lookup</h3>
            <p class="text-xs text-tx-s leading-relaxed">
              Kiểm tra nhanh trên bộ nhớ HBM GPU của vLLM Engine. Nếu hit, tiến hành sinh token câu trả lời ngay lập tức.
            </p>
          </div>

          <div class="glass-panel p-5 rounded-2xl border border-border-p space-y-3 relative shadow-xs">
            <div class="w-7 h-7 rounded-lg bg-accent-cyan text-zinc-950 font-black text-xs flex items-center justify-center font-mono">
              03
            </div>
            <h3 class="font-extrabold text-sm text-tx-p">L2 Storage Offload</h3>
            <p class="text-xs text-tx-s leading-relaxed">
              Nếu miss trên L1, LMCache tự động truy xuất KV Cache đã lưu ở Host DRAM RAM, ổ cứng NVMe SSD hoặc Redis Pool.
            </p>
          </div>

          <div class="glass-panel p-5 rounded-2xl border border-border-p space-y-3 relative shadow-xs">
            <div class="w-7 h-7 rounded-lg bg-emerald-500 text-zinc-950 font-black text-xs flex items-center justify-center font-mono">
              04
            </div>
            <h3 class="font-extrabold text-sm text-tx-p">Fast Generation</h3>
            <p class="text-xs text-tx-s leading-relaxed">
              Tải lại KV Tensor về GPU mà không cần chạy giai đoạn Prefill đắt đỏ, giúp trả lời trong thời gian tức thì.
            </p>
          </div>
        </div>
      </section>

      <!-- TECH STACK & COMPONENTS -->
      <section class="space-y-6">
        <div class="border-b border-border-p pb-4">
          <h2 class="text-xl font-black text-tx-p flex items-center gap-2">
            <Code2 class="w-5 h-5 text-hust-gold" />
            Công Nghệ & Thư Viện Sử Dụng (Tech Stack)
          </h2>
          <p class="text-xs text-tx-s mt-1">Các thành phần core xây dựng nên ứng dụng giao diện và hệ thống thử nghiệm</p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- Left: Frontend Stack -->
          <div class="glass-panel p-6 rounded-2xl border border-border-p space-y-4 shadow-xs">
            <h3 class="text-sm font-extrabold text-tx-p flex items-center gap-2 text-hust-gold uppercase tracking-wider">
              <Sparkles class="w-4 h-4" />
              Frontend UI & Dashboard Studio
            </h3>
            <ul class="space-y-2.5 text-xs">
              <li class="flex items-center justify-between bg-bg-inp/60 p-2.5 rounded-xl border border-border-p">
                <span class="font-bold text-tx-p">Vue 3 + Vite</span>
                <span class="text-tx-s font-mono">Composition API, Reactive Core</span>
              </li>
              <li class="flex items-center justify-between bg-bg-inp/60 p-2.5 rounded-xl border border-border-p">
                <span class="font-bold text-tx-p">Tailwind CSS 4 + PrimeVue</span>
                <span class="text-tx-s font-mono">HUST Custom Design System</span>
              </li>
              <li class="flex items-center justify-between bg-bg-inp/60 p-2.5 rounded-xl border border-border-p">
                <span class="font-bold text-tx-p">Pinia State Management</span>
                <span class="text-tx-s font-mono">Real-time Cache Stores</span>
              </li>
              <li class="flex items-center justify-between bg-bg-inp/60 p-2.5 rounded-xl border border-border-p">
                <span class="font-bold text-tx-p">Chart.js + Vue-Chartjs</span>
                <span class="text-tx-s font-mono">Live Doughnut & Bar Benchmarks</span>
              </li>
            </ul>
          </div>

          <!-- Right: Backend & LLM Stack -->
          <div class="glass-panel p-6 rounded-2xl border border-border-p space-y-4 shadow-xs">
            <h3 class="text-sm font-extrabold text-tx-p flex items-center gap-2 text-accent-cyan uppercase tracking-wider">
              <Server class="w-4 h-4" />
              Backend Serving & Infrastructure
            </h3>
            <ul class="space-y-2.5 text-xs">
              <li class="flex items-center justify-between bg-bg-inp/60 p-2.5 rounded-xl border border-border-p">
                <span class="font-bold text-tx-p">LMCache Engine</span>
                <span class="text-tx-s font-mono">Disaggregated KV Cache Layer</span>
              </li>
              <li class="flex items-center justify-between bg-bg-inp/60 p-2.5 rounded-xl border border-border-p">
                <span class="font-bold text-tx-p">vLLM Inference Server</span>
                <span class="text-tx-s font-mono">PagedAttention Engine</span>
              </li>
              <li class="flex items-center justify-between bg-bg-inp/60 p-2.5 rounded-xl border border-border-p">
                <span class="font-bold text-tx-p">Spring Boot Backend Gateway</span>
                <span class="text-tx-s font-mono">Port 8080 Integration API</span>
              </li>
              <li class="flex items-center justify-between bg-bg-inp/60 p-2.5 rounded-xl border border-border-p">
                <span class="font-bold text-tx-p">Redis / S3 Storage Pool</span>
                <span class="text-tx-s font-mono">Remote Distributed L2 Store</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      <!-- ACKNOWLEDGMENTS & RESOURCES -->
      <section class="glass-panel p-8 rounded-2xl border border-border-p space-y-6 shadow-xs">
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border-p pb-4">
          <div>
            <h2 class="text-lg font-black text-tx-p flex items-center gap-2">
              <BookOpen class="w-5 h-5 text-hust-gold" />
              Tài Liệu Tham Khảo Kỹ Thuật
            </h2>
            <p class="text-xs text-tx-s mt-0.5">Các dự án nguồn mở và bài báo khoa học liên quan</p>
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <a
            href="https://github.com/LMCache/LMCache"
            target="_blank"
            class="bg-bg-inp hover:bg-bg-btn-hover p-4 rounded-xl border border-border-s flex items-center justify-between group transition-all"
          >
            <div>
              <p class="font-bold text-tx-p">LMCache Project</p>
              <p class="text-[10px] text-tx-s mt-0.5">GitHub Repository chính thức</p>
            </div>
            <ExternalLink class="w-4 h-4 text-tx-s group-hover:text-hust-gold transition-colors" />
          </a>

          <a
            href="https://github.com/vllm-project/vllm"
            target="_blank"
            class="bg-bg-inp hover:bg-bg-btn-hover p-4 rounded-xl border border-border-s flex items-center justify-between group transition-all"
          >
            <div>
              <p class="font-bold text-tx-p">vLLM Inference Engine</p>
              <p class="text-[10px] text-tx-s mt-0.5">PagedAttention High-throughput Server</p>
            </div>
            <ExternalLink class="w-4 h-4 text-tx-s group-hover:text-hust-gold transition-colors" />
          </a>
        </div>
      </section>

    </main>

    <!-- Footer -->
    <footer class="border-t border-border-p bg-bg-head/60 py-6 px-6 text-center text-xs text-tx-s mt-auto">
      <p>© 2026 LLM Cache Optimization Research Project</p>
      <p class="text-[10px] text-tx-m mt-1 font-mono">LLM Cache Optimization UI • Powered by LMCache & vLLM Engine</p>
    </footer>

  </div>
</template>
