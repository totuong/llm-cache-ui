import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useCacheStore } from './cache'

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

  // Available models
  const models = ref<LLMModel[]>([
    {
      id: 'hust-gpt-4o',
      name: 'HUST-GPT 4o',
      provider: 'HUST (OpenAI Core)',
      description: 'Mô hình đa nhiệm tối ưu hóa tốc độ và độ chính xác.',
      icon: 'pi pi-bolt',
    },
    {
      id: 'hust-gemini-pro',
      name: 'HUST-Gemini Pro',
      provider: 'HUST (Google Gemini Core)',
      description: 'Mô hình phân tích thông tin chi tiết và xử lý dữ liệu lớn.',
      icon: 'pi pi-sparkles',
    },
    {
      id: 'hust-claude-sonnet',
      name: 'HUST-Claude 3.5 Sonnet',
      provider: 'HUST (Anthropic Core)',
      description: 'Mô hình xuất sắc trong viết lách sáng tạo và lập trình.',
      icon: 'pi pi-pencil',
    },
    {
      id: 'hust-llama-3',
      name: 'HUST-Llama 3.1 (Local)',
      provider: 'HUST Server (Open Source)',
      description: 'Mô hình mã nguồn mở chạy local trên server Đại học Bách Khoa.',
      icon: 'pi pi-server',
    }
  ])

  const selectedModelId = ref<string>('hust-gpt-4o')
  const sessions = ref<ChatSession[]>([])
  const activeSessionId = ref<string | null>(null)
  const isTyping = ref<boolean>(false)
  const searchFilter = ref<string>('')

  // Recommended prompt cards for HUST students
  const recommendations = ref([
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
    },
    {
      title: 'Tạo mã code mẫu',
      desc: 'Code Node.js kết nối Redis Cache cho LLM API',
      prompt: 'Viết code JavaScript/Node.js minh họa cách cài đặt caching đơn giản với Redis khi gọi OpenAI API.'
    }
  ])

  // Initialize from LocalStorage
  const storedChat = localStorage.getItem('hust_chats_history')
  if (storedChat) {
    try {
      const parsed = JSON.parse(storedChat)
      sessions.value = parsed.sessions || []
      activeSessionId.value = parsed.activeSessionId || null
      selectedModelId.value = parsed.selectedModelId || 'hust-gpt-4o'
    } catch (e) {
      console.error('Failed to parse chat history', e)
    }
  }

  // If no sessions, create one default
  if (sessions.value.length === 0) {
    createNewSession()
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

  // Predefined simulated answers to keep interaction intelligent and related to HUST/Cache
  const knowledgeBase: Array<{ keywords: string[]; response: string }> = [
    {
      keywords: ['quy trình', 'đăng ký', 'đồ án tốt nghiệp', 'thủ tục', 'bảo vệ'],
      response: `**Quy trình đăng ký và bảo vệ Đồ án tốt nghiệp (ĐATN) tại Trường CNTT&TT - Bách Khoa Hà Nội:**\n\n1. **Đăng ký đề tài**: Thực hiện trên hệ thống Quản lý đào tạo (SIS) vào tuần đầu tiên của học kỳ tốt nghiệp. Sinh viên cần điền thông tin đề tài và giảng viên hướng dẫn (GVHD).\n2. **Phê duyệt**: GVHD duyệt đề tài online trên SIS.\n3. **Thực hiện**: SV tiến hành nghiên cứu dưới sự chỉ đạo của GVHD trong 15-18 tuần. Hàng tuần phải gặp GVHD báo cáo tiến độ.\n4. **Nộp hồ sơ bảo vệ**: SV chuẩn bị các tài liệu gồm: Quyển báo cáo ĐATN (theo mẫu HUST), Bản nhận xét của GVHD (có chữ ký), Tờ quét đạo văn (mức trùng lặp cho phép dưới 20%).\n5. **Thông qua & Phản biện**: Bộ môn cử giảng viên phản biện chấm chéo quyển báo cáo.\n6. **Hội đồng chấm**: SV trình chiếu PowerPoint và demo phần mềm (nếu có) trước hội đồng chấm ĐATN gồm 3-5 thành viên.\n\n*Chúc bạn hoàn thành xuất sắc đồ án của mình!*`
    },
    {
      keywords: ['semantic caching', 'cách triển khai', 'llm cache', 'vector database'],
      response: `**Cách triển khai Semantic Caching cho mô hình ngôn ngữ lớn (LLM):**\n\n1. **Sử dụng Embedding Model**: Khi người dùng gửi câu hỏi (Prompt $Q_{new}$), ta chuyển đổi nó thành một vector số thực (Embedding Vector $V_{new}$) bằng các mô hình như \`text-embedding-3-small\` của OpenAI hoặc các mô hình mã nguồn mở trên HuggingFace.\n2. **Tìm kiếm Vector tương tự**: Sử dụng cơ sở dữ liệu vector (như Redis, Milvus, Chroma, pgvector) để so sánh $V_{new}$ với các vector câu hỏi đã được lưu trong Cache từ trước ($V_{cached}$).\n3. **Độ tương tự Cosine (Cosine Similarity)**: Đo khoảng cách góc giữa hai vector. \n   - Công thức: $Sim(V_1, V_2) = \\frac{V_1 \\cdot V_2}{||V_1|| \\, ||V_2||}$\n4. **Quyết định Hit/Miss**:\n   - **Nếu $Sim \\ge \\text{Threshold}$ (ví dụ 0.82)**: Xác định là **Cache Hit**. Trả về trực tiếp câu trả lời $A_{cached}$ tương ứng. Tốc độ phản hồi cực nhanh (~50ms) và không tốn phí API LLM.\n   - **Nếu $Sim < \\text{Threshold}$**: Xác định là **Cache Miss**. Gửi prompt tới API LLM để sinh câu trả lời mới, sau đó lưu cặp vector và câu trả lời $(V_{new}, Q_{new}, A_{new})$ vào Vector DB.\n\n*Đây chính là mô hình cốt lõi trong đề tài luận văn này của bạn!*`
    },
    {
      keywords: ['font chữ', 'giãn dòng', 'quy chuẩn', 'luận văn', 'định dạng'],
      response: `**Quy chuẩn định dạng báo cáo ĐATN chuẩn của Đại học Bách Khoa Hà Nội:**\n\n* **Phông chữ**: Times New Roman, cỡ chữ 13pt (hệ soạn thảo Unicode).\n* **Giãn dòng (Line spacing)**: Cài đặt ở chế độ 1.3 - 1.5 lines.\n* **Giãn đoạn (Paragraph spacing)**: Trước (Before) 6pt, Sau (After) 6pt.\n* **Căn lề (Page setup)**: Lề trên: 2.0 - 2.5 cm; Lề dưới: 2.0 - 2.5 cm; Lề trái: 3.0 - 3.5 cm (để đóng gáy); Lề phải: 1.5 - 2.0 cm.\n* **Đánh số trang**: Số trang được đánh ở giữa, phía dưới mỗi trang. Các trang đầu (mục lục, lời cam đoan) đánh số La Mã thường (i, ii, iii...). Trang nội dung chính (Chương 1 trở đi) đánh số 1, 2, 3...\n* **Trình bày hình ảnh/bảng biểu**: Phải có chú thích rõ ràng phía dưới hình (Ví dụ: *Hình 1.1: Sơ đồ kiến trúc cache*) và phía trên bảng (Ví dụ: *Bảng 3.2: So sánh độ trễ*). Nguồn ảnh/bảng phải được trích dẫn chi tiết.`
    },
    {
      keywords: ['code', 'redis', 'kết nối', 'openai', 'javascript', 'nodejs'],
      response: `**Code mẫu Node.js triển khai Caching đơn giản sử dụng Redis và OpenAI SDK:**\n\n\`\`\`javascript\nconst { OpenAI } = require('openai');\nconst { createClient } = require('redis');\n\nconst openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });\nconst redisClient = createClient(); // mặc định localhost:6379\n\nasync function getLLMResponseWithCache(prompt) {\n  await redisClient.connect();\n  \n  // 1. Kiểm tra cache trước (Exact Match)\n  const cachedResponse = await redisClient.get(prompt);\n  if (cachedResponse) {\n    console.log('⚡ Cache Hit!');\n    return JSON.parse(cachedResponse);\n  }\n  \n  console.log('❌ Cache Miss. Calling OpenAI...');\n  const startTime = Date.now();\n  \n  // 2. Gọi OpenAI API\n  const completion = await openai.chat.completions.create({\n    model: 'gpt-4o-mini',\n    messages: [{ role: 'user', content: prompt }],\n  });\n  \n  const responseText = completion.choices[0].message.content;\n  const latency = (Date.now() - startTime) / 1000;\n  const tokens = completion.usage.total_tokens;\n  \n  const result = { response: responseText, latency, tokens };\n  \n  // 3. Lưu kết quả vào Redis Cache với TTL là 1 giờ\n  await redisClient.setEx(prompt, 3600, JSON.stringify(result));\n  \n  return result;\n}\n\`\`\``
    }
  ]

  // Generates a mock response dynamically if no keywords match
  function generateFallbackResponse(prompt: string, modelName: string): string {
    return `Cảm ơn bạn đã hỏi hệ thống **LLM-HUST** (sử dụng lõi ${modelName}).\n\nĐây là phản hồi giả lập dựa trên câu hỏi của bạn:\n> "${prompt}"\n\nĐể hỗ trợ thực hiện luận văn tốt nghiệp về **Tối ưu hóa Cache cho LLM**, giao diện này hiển thị các thông số cache trực quan ở góc phải màn hình. Bạn có thể bật/tắt cache, điều chỉnh ngưỡng trùng lặp ngữ nghĩa (Semantic Similarity Threshold) hoặc thay đổi chính sách thu hồi (LRU/LFU/FIFO) trong bảng điều khiển để so sánh sự khác biệt về **độ trễ (Latency)** và **chi phí (Cost/Tokens)**.\n\n*Hệ thống LLM-HUST ghi nhận thông tin và đang xử lý dữ liệu học thuật từ Đại học Bách Khoa Hà Nội.*`
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
    
    // Automatically rename the chat title if it's the first message
    if (currentSession.messages.length === 1 || currentSession.title === 'Đoạn chat mới') {
      currentSession.title = userPrompt.length > 25 ? userPrompt.substring(0, 25) + '...' : userPrompt
    }
    
    saveToStorage()

    // 2. Simulate AI Processing
    isTyping.value = true
    const chosenModel = models.value.find(m => m.id === selectedModelId.value) || models.value[0]
    const modelName = chosenModel?.name || 'HUST-GPT 4o'

    // 3. Check Cache
    const cacheResult = cacheStore.queryCache(userPrompt)

    // Setup placeholder message for typing streaming
    const assistantMsgId = 'msg_' + Date.now().toString(36) + '_a'
    const assistantMsg: Message = {
      id: assistantMsgId,
      sender: 'assistant',
      content: '',
      timestamp: new Date().toISOString(),
      cacheStatus: null,
    }
    currentSession.messages.push(assistantMsg)

    if (cacheResult && cacheResult.hit) {
      // CACHE HIT - Return result super fast (mock processing delay 250ms for visuals)
      await new Promise(resolve => setTimeout(resolve, 250))
      
      assistantMsg.content = cacheResult.response
      assistantMsg.cacheStatus = {
        hit: true,
        similarity: cacheResult.similarity,
        latency: cacheResult.latency,
        tokens: Math.round(cacheResult.response.length / 4) + 10,
      }
      
      isTyping.value = false
      saveToStorage()
    } else {
      // CACHE MISS - Simulate generation latency (2s) and typing stream
      const originalLatency = parseFloat((1.5 + Math.random() * 1.5).toFixed(2)) // 1.5s - 3s
      
      // Determine response text
      let responseText = ''
      const promptLower = userPrompt.toLowerCase()
      const matchedKB = knowledgeBase.find(item =>
        item.keywords.some(keyword => promptLower.includes(keyword))
      )
      
      if (matchedKB) {
        responseText = matchedKB.response
      } else {
        responseText = generateFallbackResponse(userPrompt, modelName)
      }

      const totalTokens = Math.round(responseText.length / 4) + 15

      // Simulate streaming words
      const words = responseText.split(' ')
      let currentWordIndex = 0
      const totalStreamTime = 1200 // Stream over 1.2 seconds
      const wordDelay = Math.max(15, Math.floor(totalStreamTime / words.length))

      const streamTimer = setInterval(() => {
        if (currentWordIndex < words.length) {
          assistantMsg.content += (currentWordIndex === 0 ? '' : ' ') + words[currentWordIndex]
          currentWordIndex++
        } else {
          clearInterval(streamTimer)
          // Stream completed
          assistantMsg.cacheStatus = {
            hit: false,
            latency: originalLatency,
            tokens: totalTokens,
          }
          
          // Insert into Cache Store
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
    createNewSession,
    selectSession,
    renameSession,
    deleteSession,
    sendMessage,
    clearCurrentSession,
  }
})
