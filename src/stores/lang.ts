import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useLangStore = defineStore('lang', () => {
  const locale = ref<'vi' | 'en'>('vi')

  const storedLang = localStorage.getItem('hust_lang_locale')
  if (storedLang === 'en' || storedLang === 'vi') {
    locale.value = storedLang
  }

  function setLocale(newLocale: 'vi' | 'en') {
    locale.value = newLocale
    localStorage.setItem('hust_lang_locale', newLocale)
  }

  // Translation dictionary
  const messages = {
    vi: {
      newChat: 'Đoạn chat mới',
      searchChat: 'Tìm đoạn chat...',
      recentChats: 'Lịch sử cuộc gọi',
      noChats: 'Không tìm thấy đoạn chat nào',
      cachePerformance: 'Hiệu suất LLM Cache',
      logout: 'Đăng xuất',
      loginAccount: 'Đăng nhập tài khoản',
      cacheStats: 'Thống kê Cache',
      clearChat: 'Xóa nội dung cuộc chat',
      toggleSidebar: 'Ẩn/Hiện thanh lịch sử',
      welcomeTitle: 'Trợ lý Học thuật LLM-HUST',
      welcomeDesc: 'Hệ thống thử nghiệm tích hợp Cache ngữ nghĩa (Semantic Cache) giúp tối ưu hóa chi phí API và giảm thiểu độ trễ phản hồi.',
      loginPrompt: 'Đăng nhập tài khoản?',
      loginDesc: 'Đăng nhập tài khoản để lưu trữ lịch sử trò chuyện và đồng bộ hóa các tham số cache.',
      loginBtn: 'Đăng nhập',
      member: 'Thành viên',
      suggestedPrompts: 'Gợi ý câu hỏi đề xuất',
      inputPlaceholder: 'Hỏi trợ lý LLM-HUST về Đồ án tốt nghiệp hoặc Caching...',
      disclaimer: 'Hệ thống thử nghiệm Luận văn tốt nghiệp Bách Khoa. LLM-HUST có thể đưa ra thông tin không chính xác. Hãy kiểm chứng nguồn tài liệu chính thức.',
      settingsTitle: 'CÀI ĐẶT HỆ THỐNG',
      themeMode: 'Chế độ giao diện',
      themeDesc: 'Chuyển đổi giao diện Sáng / Tối.',
      light: 'Sáng',
      dark: 'Tối',
      clearHistory: 'Xóa lịch sử hội thoại',
      clearHistoryDesc: 'Xóa tất cả các phiên chat hiện tại khỏi bộ nhớ.',
      clearBtn: 'Xóa hết',
      resetCache: 'Đặt lại bộ nhớ Cache',
      resetCacheDesc: 'Xóa sạch các chỉ số hit/miss và lịch sử cache của luận văn.',
      resetBtn: 'Đặt lại cache',
      version: 'Phiên bản giao diện',
      copyright: 'Bản quyền đề tài',
      close: 'Đóng',
      cacheDashboardTitle: 'Độ Đo Luận Văn Cache',
      cacheDashboardDesc: 'Giám sát hiệu suất bộ nhớ đệm',
      hitRate: 'Hit Rate',
      queries: 'Truy vấn',
      hitsMiss: 'Hits / Miss',
      latencySaved: 'Độ trễ giảm',
      costSaved: 'Chi phí API tiết kiệm',
      cacheConfig: 'Cấu Hình Chính Sách Cache',
      enableCache: 'Kích hoạt Cache',
      enableCacheDesc: 'Bật/tắt toàn bộ tính năng cache đệm.',
      matchType: 'Kiểu đối sánh (Match Type)',
      similarityThreshold: 'Ngưỡng tương đồng (Threshold)',
      similarityDesc: 'Giá trị Cosine Similarity tối thiểu để Hit cache.',
      evictionPolicy: 'Thu hồi bộ nhớ (Eviction Policy)',
      capacity: 'Dung lượng tối đa (Capacity)',
      capacityDesc: 'Giới hạn số bản ghi lưu trữ.',
      cacheRecords: 'Bản Ghi Bộ Nhớ Đệm',
      clearAllCache: 'Xóa Sạch',
      noCacheData: 'Không có dữ liệu trong cache',
      copied: 'Đã sao chép',
      copy: 'Sao chép',
      useful: 'Hữu ích',
      notUseful: 'Không hữu ích',
      language: 'Ngôn ngữ hệ thống',
      languageDesc: 'Chọn ngôn ngữ hiển thị giao diện.',
    },
    en: {
      newChat: 'New Chat',
      searchChat: 'Search chats...',
      recentChats: 'Recent Chats',
      noChats: 'No chats found',
      cachePerformance: 'LLM Cache Performance',
      logout: 'Logout',
      loginAccount: 'Log In',
      cacheStats: 'Cache Stats',
      clearChat: 'Clear current chat',
      toggleSidebar: 'Toggle history panel',
      welcomeTitle: 'LLM-HUST Academic Assistant',
      welcomeDesc: 'Experimental system integrating Semantic Caching to optimize API costs and reduce response latency.',
      loginPrompt: 'Log in to your account?',
      loginDesc: 'Log in to store conversation history and synchronize cache parameters.',
      loginBtn: 'Log In',
      member: 'Member',
      suggestedPrompts: 'Suggested Prompts',
      inputPlaceholder: 'Ask LLM-HUST about Thesis templates or Caching...',
      disclaimer: 'HUST Graduation Thesis Experimental System. LLM-HUST can make mistakes. Verify important info.',
      settingsTitle: 'SYSTEM SETTINGS',
      themeMode: 'Appearance Mode',
      themeDesc: 'Toggle Light / Dark mode.',
      light: 'Light',
      dark: 'Dark',
      clearHistory: 'Clear Chat History',
      clearHistoryDesc: 'Delete all current chat sessions from storage.',
      clearBtn: 'Delete All',
      resetCache: 'Reset Cache Database',
      resetCacheDesc: 'Clear all hit/miss performance logs and cache history.',
      resetBtn: 'Reset Cache',
      version: 'Interface Version',
      copyright: 'Thesis Copyright',
      close: 'Close',
      cacheDashboardTitle: 'Cache Performance metrics',
      cacheDashboardDesc: 'Monitor caching database logs',
      hitRate: 'Hit Rate',
      queries: 'Queries',
      hitsMiss: 'Hits / Miss',
      latencySaved: 'Latency Saved',
      costSaved: 'API Cost Saved',
      cacheConfig: 'Cache Policy Settings',
      enableCache: 'Enable Cache',
      enableCacheDesc: 'Turn caching features on/off globally.',
      matchType: 'Match Policy Type',
      similarityThreshold: 'Similarity Threshold',
      similarityDesc: 'Minimum Cosine Similarity score to count as hit.',
      evictionPolicy: 'Eviction Cache Policy',
      capacity: 'Cache Capacity',
      capacityDesc: 'Limit of stored cache records.',
      cacheRecords: 'Cached Queries Log',
      clearAllCache: 'Clear All',
      noCacheData: 'No cached records available',
      copied: 'Copied',
      copy: 'Copy',
      useful: 'Helpful',
      notUseful: 'Not helpful',
      language: 'System Language',
      languageDesc: 'Choose interface display language.',
    }
  }

  function t(key: keyof typeof messages.vi): string {
    return messages[locale.value][key] || messages.vi[key] || key
  }

  return {
    locale,
    setLocale,
    t,
  }
})
