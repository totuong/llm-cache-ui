import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useCacheStore } from './cache'
import {
  checkBackendHealth,
  streamChatRequest,
  sendChatRequest,
  fetchChatHistory,
} from '../services/apiService'
import type { VllmMetricsDTO, UsageInfo, ChatHistory } from '../types/api'

export interface Message {
  id: string
  sender: 'user' | 'assistant'
  content: string
  timestamp: string
  cacheStatus: {
    hit: boolean
    similarity?: number
    latency: number
    tokens: number
    executionTimeMs?: number
    cacheHitRatioPercentage?: number
    vllmMetrics?: VllmMetricsDTO
    usage?: UsageInfo
  } | null
}

export interface ChatSession {
  id: string
  title: string
  messages: Message[]
  modelId: string
  createdAt: string
}

export interface LLMModel {
  id: string
  name: string
  provider: string
  description: string
  icon: string
}

export const useChatStore = defineStore('chat', () => {
  const cacheStore = useCacheStore()

  // Connection & API state
  const isBackendLive = ref<boolean>(false)
  const apiMode = ref<'live' | 'mock'>('live')
  const isSyncingHistory = ref<boolean>(false)

  // Available models (Only Qwen/Qwen2.5-1.5B-Instruct backend model)
  const models = ref<LLMModel[]>([
    {
      id: 'Qwen/Qwen2.5-1.5B-Instruct',
      name: 'Qwen 2.5 1.5B (LMCache + vLLM)',
      provider: 'Backend vLLM Engine + LMCache',
      description: 'Mô hình chính thức chạy thực tế với kỹ thuật Prefix Caching & KV Cache GPU.',
      icon: 'pi pi-bolt',
    }
  ])

  const selectedModelId = ref<string>('Qwen/Qwen2.5-1.5B-Instruct')
  const sessions = ref<ChatSession[]>([])
  const activeSessionId = ref<string | null>(null)
  const isTyping = ref<boolean>(false)
  const searchFilter = ref<string>('')

  // Recommended prompt cards for HUST students
  const recommendations = ref([
    {
      title: 'Prefix Caching LMCache',
      desc: 'Giải thích kỹ thuật Prefix Caching trong LMCache và vLLM',
      prompt: 'Giải thích kỹ thuật Prefix Caching trong LMCache và vLLM?'
    },
    {
      title: 'Đăng ký Tốt nghiệp',
      desc: 'Hướng dẫn quy trình nộp đồ án tốt nghiệp tại HUST',
      prompt: 'Quy trình và thời hạn đăng ký bảo vệ đồ án tốt nghiệp CNTT HUST gồm các bước nào?'
    },
    {
      title: 'Tối ưu hóa Cache LLM',
      desc: 'Giải thích kỹ thuật Semantic Caching trong luận văn',
      prompt: 'Trình bày cách triển khai Semantic Caching cho LLM và lợi ích của nó đối với chi phí API.'
    },
    {
      title: 'Quy chuẩn viết Báo cáo',
      desc: 'Quy chuẩn trình bày quyển luận văn đại học HUST',
      prompt: 'Quy chuẩn định dạng font chữ, giãn dòng và cấu trúc bìa đồ án tốt nghiệp của HUST như thế nào?'
    }
  ])

  // Initialize from LocalStorage
  const storedChat = localStorage.getItem('hust_chats_history')
  if (storedChat) {
    try {
      const parsed = JSON.parse(storedChat)
      sessions.value = parsed.sessions || []
      activeSessionId.value = parsed.activeSessionId || null
      selectedModelId.value = parsed.selectedModelId || 'Qwen/Qwen2.5-1.5B-Instruct'
      apiMode.value = parsed.apiMode || 'live'
    } catch (e) {
      console.error('Failed to parse chat history', e)
    }
  }

  // If no sessions, create one default
  if (sessions.value.length === 0) {
    createNewSession()
  }

  // Check health on store initialization
  checkHealth()

  async function checkHealth(): Promise<boolean> {
    const alive = await checkBackendHealth()
    isBackendLive.value = alive
    return alive
  }

  const activeSession = computed(() => {
    return sessions.value.find(s => s.id === activeSessionId.value) || null
  })

  const filteredSessions = computed(() => {
    if (!searchFilter.value.trim()) return sessions.value
    const filter = searchFilter.value.toLowerCase()
    return sessions.value.filter(s => s.title.toLowerCase().includes(filter))
  })

  function saveToStorage() {
    localStorage.setItem(
      'hust_chats_history',
      JSON.stringify({
        sessions: sessions.value,
        activeSessionId: activeSessionId.value,
        selectedModelId: selectedModelId.value,
        apiMode: apiMode.value,
      })
    )
  }

  function createNewSession() {
    const newId = 'session_' + Date.now().toString(36)
    const newSess: ChatSession = {
      id: newId,
      title: 'Đoạn chat mới',
      messages: [],
      modelId: selectedModelId.value,
      createdAt: new Date().toISOString(),
    }
    sessions.value.unshift(newSess)
    activeSessionId.value = newId
    saveToStorage()
    return newSess
  }

  function selectSession(id: string) {
    activeSessionId.value = id
    const sess = sessions.value.find(s => s.id === id)
    if (sess) {
      selectedModelId.value = sess.modelId
    }
    saveToStorage()
  }

  function renameSession(id: string, newTitle: string) {
    const sess = sessions.value.find(s => s.id === id)
    if (sess) {
      sess.title = newTitle.trim() || 'Không có tiêu đề'
      saveToStorage()
    }
  }

  function deleteSession(id: string) {
    sessions.value = sessions.value.filter(s => s.id !== id)
    if (activeSessionId.value === id) {
      const firstSess = sessions.value[0]
      if (firstSess) {
        activeSessionId.value = firstSess.id
      } else {
        createNewSession()
      }
    }
    saveToStorage()
  }

  /**
   * Sync chat history stored in PostgreSQL database into Pinia store sessions
   */
  async function syncHistoryFromBackend(): Promise<number> {
    isSyncingHistory.value = true
    try {
      const histories: ChatHistory[] = await fetchChatHistory(50)
      if (histories && histories.length > 0) {
        const dbSessionId = 'session_postgres_history'
        let dbSess = sessions.value.find(s => s.id === dbSessionId)
        
        const mappedMessages: Message[] = histories.flatMap(h => [
          {
            id: `msg_pg_${h.id}_u`,
            sender: 'user',
            content: h.prompt,
            timestamp: h.createdAt || new Date().toISOString(),
            cacheStatus: null,
          },
          {
            id: `msg_pg_${h.id}_a`,
            sender: 'assistant',
            content: h.response,
            timestamp: h.createdAt || new Date().toISOString(),
            cacheStatus: {
              hit: (h.cacheHitRatioPercentage || 0) > 50,
              latency: parseFloat(((h.executionTimeMs || 300) / 1000).toFixed(2)),
              tokens: h.totalTokens || 100,
              executionTimeMs: h.executionTimeMs,
              cacheHitRatioPercentage: h.cacheHitRatioPercentage,
              usage: {
                promptTokens: h.promptTokens,
                completionTokens: h.completionTokens,
                totalTokens: h.totalTokens,
                cachedTokens: h.cachedTokens,
                cacheHitRatioPercentage: h.cacheHitRatioPercentage,
              },
            },
          },
        ])

        if (!dbSess) {
          dbSess = {
            id: dbSessionId,
            title: 'Lịch sử PostgreSQL (DB)',
            messages: mappedMessages,
            modelId: selectedModelId.value,
            createdAt: new Date().toISOString(),
          }
          sessions.value.unshift(dbSess)
        } else {
          dbSess.messages = mappedMessages
        }

        activeSessionId.value = dbSessionId
        saveToStorage()
        return histories.length
      }
      return 0
    } catch (err) {
      console.warn('Could not sync history from PostgreSQL:', err)
      throw err
    } finally {
      isSyncingHistory.value = false
    }
  }

  // Fallback Knowledge Base for Offline / Demo Mode
  const knowledgeBase: Array<{ keywords: string[]; response: string }> = [
    {
      keywords: ['prefix caching', 'lmcache', 'vllm', 'kv cache', 'giải thích'],
      response: `**Giải thích Kỹ thuật Prefix Caching trong LMCache & vLLM Engine:**\n\n1. **Khái niệm Prefix Caching**: Khi xử lý nhiều truy vấn có phần mở đầu (System Prompt, Context, hoặc tài liệu tham khảo) giống nhau, vLLM kết hợp với LMCache sẽ lưu trữ các trạng thái **Key-Value (KV) Cache** của các token đó trực tiếp trên bộ nhớ GPU/Host RAM.\n2. **Tái sử dụng KV Cache**: Thay vì phải thực hiện bước tính toán lại prompt (Prefill phase) tốn tài nguyên GPU đối với các đoạn text lặp lại, vLLM chỉ cần tải lại trạng thái KV Cache đã lưu từ trước.\n3. **Lợi ích Vượt trội**:\n   - **Giảm Time To First Token (TTFT)**: Thời gian nhận được token đầu tiên giảm tới 70-90% (từ vài giây xuống vài miligiây).\n   - **Tiết kiệm tài nguyên GPU**: Tăng throughput (số lượng request/giây) cho cùng một hạ tầng server vLLM.\n   - **Tối ưu chi phí API**: Tiết kiệm tổng số Tokens cần xử lý tính toán thực tế.\n\n*Hệ thống Backend Spring Boot của bạn đang kết nối trực tiếp với vLLM Engine để tính toán các chỉ số Prefix Cache Hit Ratio này!*`
    },
    {
      keywords: ['quy trình', 'đăng ký', 'đồ án tốt nghiệp', 'thủ tục', 'bảo vệ'],
      response: `**Quy trình đăng ký và bảo vệ Đồ án tốt nghiệp (ĐATN) tại Trường CNTT&TT - Bách Khoa Hà Nội:**\n\n1. **Đăng ký đề tài**: Thực hiện trên hệ thống Quản lý đào tạo (SIS) vào tuần đầu tiên của học kỳ tốt nghiệp. Sinh viên cần điền thông tin đề tài và giảng viên hướng dẫn (GVHD).\n2. **Phê duyệt**: GVHD duyệt đề tài online trên SIS.\n3. **Thực hiện**: SV tiến hành nghiên cứu dưới sự chỉ đạo của GVHD trong 15-18 tuần. Hàng tuần phải gặp GVHD báo cáo tiến độ.\n4. **Nộp hồ sơ bảo vệ**: SV chuẩn bị các tài liệu gồm: Quyển báo cáo ĐATN (theo mẫu HUST), Bản nhận xét của GVHD (có chữ ký), Tờ quét đạo văn (mức trùng lặp cho phép dưới 20%).\n5. **Thông qua & Phản biện**: Bộ môn cử giảng viên phản biện chấm chéo quyển báo cáo.\n6. **Hội đồng chấm**: SV trình chiếu PowerPoint và demo phần mềm (nếu có) trước hội đồng chấm ĐATN gồm 3-5 thành viên.\n\n*Chúc bạn hoàn thành xuất sắc đồ án của mình!*`
    },
    {
      keywords: ['semantic caching', 'cách triển khai', 'llm cache', 'vector database'],
      response: `**Cách triển khai Semantic Caching cho mô hình ngôn ngữ lớn (LLM):**\n\n1. **Sử dụng Embedding Model**: Khi người dùng gửi câu hỏi (Prompt $Q_{new}$), ta chuyển đổi nó thành một vector số thực (Embedding Vector $V_{new}$) bằng các mô hình embedding.\n2. **Tìm kiếm Vector tương tự**: Sử dụng cơ sở dữ liệu vector (như Redis, Milvus, Chroma, pgvector) để so sánh $V_{new}$ với các vector câu hỏi đã được lưu trong Cache từ trước.\n3. **Độ tương tự Cosine (Cosine Similarity)**: Đo khoảng cách góc giữa hai vector. \n   - Công thức: $Sim(V_1, V_2) = \\frac{V_1 \\cdot V_2}{||V_1|| \\, ||V_2||}$\n4. **Quyết định Hit/Miss**:\n   - **Nếu $Sim \\ge \\text{Threshold}$ (ví dụ 0.82)**: Xác định là **Cache Hit**. Trả về trực tiếp câu trả lời $A_{cached}$ tương ứng. Tốc độ phản hồi cực nhanh (~50ms) và không tốn phí API LLM.\n   - **Nếu $Sim < \\text{Threshold}$**: Xác định là **Cache Miss**. Gửi prompt tới API LLM để sinh câu trả lời mới, sau đó lưu cặp vector và câu trả lời $(V_{new}, Q_{new}, A_{new})$ vào Vector DB.`
    },
    {
      keywords: ['font chữ', 'giãn dòng', 'quy chuẩn', 'luận văn', 'định dạng'],
      response: `**Quy chuẩn định dạng báo cáo ĐATN chuẩn của Đại học Bách Khoa Hà Nội:**\n\n* **Phông chữ**: Times New Roman, cỡ chữ 13pt (hệ soạn thảo Unicode).\n* **Giãn dòng (Line spacing)**: Cài đặt ở chế độ 1.3 - 1.5 lines.\n* **Giãn đoạn (Paragraph spacing)**: Trước (Before) 6pt, Sau (After) 6pt.\n* **Căn lề (Page setup)**: Lề trên: 2.0 - 2.5 cm; Lề dưới: 2.0 - 2.5 cm; Lề trái: 3.0 - 3.5 cm; Lề phải: 1.5 - 2.0 cm.\n* **Đánh số trang**: Số trang được đánh ở giữa, phía dưới mỗi trang.`
    },
  ]

  function generateFallbackResponse(prompt: string, modelName: string): string {
    return `Cảm ơn bạn đã gửi câu hỏi tới **LLM-HUST Assistant** (mô hình ${modelName}).\n\nPhản hồi tự động cho prompt:\n> "${prompt}"\n\nHệ thống đã tiếp nhận dữ liệu và sẵn sàng kết nối trực tiếp với backend Spring Boot (LMCache + vLLM Engine) qua cổng \`http://localhost:8080/api/v1\`. Mọi câu hỏi và câu trả lời trong phiên giao tiếp sẽ được tự động lưu vào PostgreSQL database (\`chat_history\`) và tính toán các chỉ số Prefix Cache Hit Ratio theo thời gian thực.`
  }

  async function sendMessage(content: string) {
    if (!content.trim() || isTyping.value || !activeSession.value) return

    const currentSession = activeSession.value
    const userPrompt = content.trim()

    // 1. Create User Message
    const userMsg: Message = {
      id: 'msg_' + Date.now().toString(36) + '_u',
      sender: 'user',
      content: userPrompt,
      timestamp: new Date().toISOString(),
      cacheStatus: null,
    }

    currentSession.messages.push(userMsg)
    
    // Automatically rename title if first message
    if (currentSession.messages.length === 1 || currentSession.title === 'Đoạn chat mới') {
      currentSession.title = userPrompt.length > 25 ? userPrompt.substring(0, 25) + '...' : userPrompt
    }
    
    saveToStorage()
    isTyping.value = true

    // Setup Assistant Message Placeholder
    const assistantMsgId = 'msg_' + Date.now().toString(36) + '_a'
    const assistantMsg: Message = {
      id: assistantMsgId,
      sender: 'assistant',
      content: '',
      timestamp: new Date().toISOString(),
      cacheStatus: null,
    }
    currentSession.messages.push(assistantMsg)

    // Check if Backend is alive & user is in live mode
    const isAlive = apiMode.value === 'live' && (await checkHealth())

    if (isAlive) {
      // --- CALL REGULAR SYNCHRONOUS CHAT API (/api/v1/chat) ---
      const startTime = Date.now()
      try {
        const res = await sendChatRequest({
          prompt: userPrompt,
          model: selectedModelId.value,
        })

        const msgIndex = currentSession.messages.findIndex(m => m.id === assistantMsgId)
        const totalMs = res.executionTimeMs || (Date.now() - startTime)
        const hitRatio = res.usage?.cacheHitRatioPercentage ?? res.vllmMetrics?.prefixCacheHitRatio ?? 0

        const updatedMsg: Message = {
          id: assistantMsgId,
          sender: 'assistant',
          content: res.response,
          timestamp: new Date().toISOString(),
          cacheStatus: {
            hit: hitRatio > 50,
            latency: parseFloat((totalMs / 1000).toFixed(2)),
            tokens: res.usage?.totalTokens || Math.round(res.response.length / 4) + 10,
            executionTimeMs: totalMs,
            cacheHitRatioPercentage: hitRatio,
            usage: res.usage,
            vllmMetrics: res.vllmMetrics,
          },
        }

        if (msgIndex !== -1) {
          currentSession.messages[msgIndex] = updatedMsg
        } else {
          currentSession.messages.push(updatedMsg)
        }

        isTyping.value = false
        cacheStore.refreshBackendMetrics()
        saveToStorage()
        return
      } catch (err) {
        console.warn('Regular chat API error, falling back to offline simulation:', err)
        executeOfflineSimulation(userPrompt, assistantMsgId)
      }
    } else {
      // --- OFFLINE SIMULATION MODE ---
      executeOfflineSimulation(userPrompt, assistantMsgId)
    }
  }

  function executeOfflineSimulation(userPrompt: string, assistantMsgId: string) {
    if (!activeSession.value) return
    const currentSession = activeSession.value

    const chosenModel = models.value.find(m => m.id === selectedModelId.value) || models.value[0]
    const modelName = chosenModel?.name || 'Qwen 2.5 1.5B'

    const cacheResult = cacheStore.queryCache(userPrompt)

    if (cacheResult && cacheResult.hit) {
      setTimeout(() => {
        const msgIndex = currentSession.messages.findIndex(m => m.id === assistantMsgId)
        if (msgIndex !== -1) {
          currentSession.messages[msgIndex] = {
            ...currentSession.messages[msgIndex],
            content: cacheResult.response,
            cacheStatus: {
              hit: true,
              similarity: cacheResult.similarity,
              latency: cacheResult.latency,
              tokens: Math.round(cacheResult.response.length / 4) + 10,
              cacheHitRatioPercentage: 85.5,
              executionTimeMs: Math.round(cacheResult.latency * 1000),
            },
          }
        }
        isTyping.value = false
        saveToStorage()
      }, 250)
    } else {
      const originalLatency = parseFloat((1.5 + Math.random() * 1.5).toFixed(2))
      let responseText = ''
      const promptLower = userPrompt.toLowerCase()
      const matchedKB = knowledgeBase.find(item =>
        item.keywords.some(keyword => promptLower.includes(keyword))
      )
      
      responseText = matchedKB ? matchedKB.response : generateFallbackResponse(userPrompt, modelName)
      const totalTokens = Math.round(responseText.length / 4) + 15

      const words = responseText.split(' ')
      let currentWordIndex = 0
      const totalStreamTime = 1000
      const wordDelay = Math.max(15, Math.floor(totalStreamTime / words.length))

      const streamTimer = setInterval(() => {
        const msgIndex = currentSession.messages.findIndex(m => m.id === assistantMsgId)
        if (msgIndex === -1) {
          clearInterval(streamTimer)
          return
        }

        if (currentWordIndex < words.length) {
          const currentContent = currentSession.messages[msgIndex].content
          const newChunk = (currentWordIndex === 0 ? '' : ' ') + words[currentWordIndex]
          currentSession.messages[msgIndex].content = currentContent + newChunk
          currentWordIndex++
        } else {
          clearInterval(streamTimer)
          currentSession.messages[msgIndex].cacheStatus = {
            hit: false,
            latency: originalLatency,
            tokens: totalTokens,
            executionTimeMs: Math.round(originalLatency * 1000),
            cacheHitRatioPercentage: 0,
          }
          cacheStore.insertCache(userPrompt, responseText, totalTokens, originalLatency)
          isTyping.value = false
          saveToStorage()
        }
      }, wordDelay)
    }
  }

  function clearCurrentSession() {
    if (activeSession.value) {
      activeSession.value.messages = []
      saveToStorage()
    }
  }

  return {
    models,
    selectedModelId,
    sessions,
    activeSessionId,
    isTyping,
    searchFilter,
    recommendations,
    activeSession,
    filteredSessions,
    isBackendLive,
    apiMode,
    isSyncingHistory,
    checkHealth,
    syncHistoryFromBackend,
    createNewSession,
    selectSession,
    renameSession,
    deleteSession,
    sendMessage,
    clearCurrentSession,
  }
})
