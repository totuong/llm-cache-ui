# 🔐 API Authentication & Chat — Frontend Integration Guide

> Base URL: `http://localhost:8081`  
> All protected endpoints require header: `Authorization: Bearer <accessToken>`

---

## 1. Đăng ký tài khoản

**`POST /api/v1/auth/register`**

### Request Body
```json
{
  "username": "alice",
  "password": "secret123",
  "email": "alice@example.com"
}
```

| Field | Type | Bắt buộc | Mô tả |
|-------|------|----------|-------|
| `username` | string | ✅ | Tên đăng nhập, phải unique |
| `password` | string | ✅ | Tối thiểu 6 ký tự |
| `email` | string | ❌ | Email, phải unique nếu có |

### Response `201 Created`
```json
{
  "status": "SUCCESS",
  "message": "User registered successfully",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiJ9...",
    "tokenType": "Bearer",
    "userId": 1,
    "username": "alice",
    "expiresInMs": 86400000
  },
  "timestamp": "2026-11-13T16:00:00"
}
```

### Response `400 Bad Request` (lỗi)
```json
{
  "status": "ERROR",
  "message": "Username already taken",
  "data": null,
  "timestamp": "2026-11-13T16:00:00"
}
```

> **Lỗi có thể gặp:** `"Username already taken"` · `"Email already registered"` · `"Password must be at least 6 characters"`

---

## 2. Đăng nhập

**`POST /api/v1/auth/login`**

### Request Body
```json
{
  "username": "alice",
  "password": "secret123"
}
```

| Field | Type | Bắt buộc |
|-------|------|----------|
| `username` | string | ✅ |
| `password` | string | ✅ |

### Response `200 OK`
```json
{
  "status": "SUCCESS",
  "message": "Login successful",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiJ9...",
    "tokenType": "Bearer",
    "userId": 1,
    "username": "alice",
    "expiresInMs": 86400000
  },
  "timestamp": "2026-11-13T16:00:00"
}
```

### Response `401 Unauthorized` (sai thông tin)
```json
{
  "status": "ERROR",
  "message": "Invalid username or password",
  "data": null,
  "timestamp": "2026-11-13T16:00:00"
}
```

> 💡 **Sau khi nhận được `accessToken`**, frontend lưu vào `localStorage` hoặc `sessionStorage` và đính vào mọi request tiếp theo.

---

## 3. Gửi chat (có auth)

**`POST /api/v1/chat`** 🔒

### Headers
```
Authorization: Bearer eyJhbGciOiJIUzI1NiJ9...
Content-Type: application/json
```

### Request Body
```json
{
  "prompt": "Giải thích về LLM cache là gì?"
}
```

### Response `200 OK`
```json
{
  "status": "SUCCESS",
  "message": "Response generated successfully",
  "data": {
    "response": "LLM cache là...",
    "model": "Qwen/Qwen2.5-1.5B-Instruct",
    "executionTimeMs": 1234,
    "usage": {
      "promptTokens": 20,
      "completionTokens": 150,
      "totalTokens": 170,
      "cachedTokens": 10,
      "cacheHitRatioPercentage": 5.88
    }
  },
  "timestamp": "2026-11-13T16:00:00"
}
```

---

## 4. Stream chat (có auth)

**`POST /api/v1/chat/stream`** 🔒 · `text/event-stream`

### Headers
```
Authorization: Bearer eyJhbGciOiJIUzI1NiJ9...
Content-Type: application/json
```

### Request Body
```json
{
  "prompt": "Giải thích về LLM cache là gì?"
}
```

### SSE Response (từng chunk)
```
data: {"status":"SUCCESS","data":{"response":"LLM ","model":null,...}}

data: {"status":"SUCCESS","data":{"response":"cache ","model":null,...}}

data: {"status":"SUCCESS","data":{"response":"là...","model":"Qwen/...",...}}
```

> 💡 Dùng `EventSource` hoặc `fetch` với `ReadableStream` để đọc SSE. Mỗi `data:` là một JSON chunk, nối field `response` lại để hiển thị realtime.

---

## 5. Xem lịch sử chat của tôi

**`GET /api/v1/chat/history/me`** 🔒

### Headers
```
Authorization: Bearer eyJhbGciOiJIUzI1NiJ9...
```

### Response `200 OK`
```json
{
  "status": "SUCCESS",
  "message": "Your chat history fetched successfully",
  "data": [
    {
      "id": 42,
      "userId": 1,
      "prompt": "Giải thích về LLM cache?",
      "response": "LLM cache là...",
      "model": "Qwen/Qwen2.5-1.5B-Instruct",
      "executionTimeMs": 1234,
      "promptTokens": 20,
      "completionTokens": 150,
      "totalTokens": 170,
      "cachedTokens": 10,
      "cacheHitRatioPercentage": 5.88,
      "createdAt": "2026-11-13T16:00:00"
    }
  ],
  "timestamp": "2026-11-13T16:00:00"
}
```

> Danh sách sắp xếp theo `createdAt` giảm dần (mới nhất trước).

---

## 6. Xem toàn bộ lịch sử (admin, không filter theo user)

**`GET /api/v1/chat/history`** 🔒

### Query Params
| Param | Default | Mô tả |
|-------|---------|-------|
| `limit` | `50` | Số bản ghi tối đa trả về |

### Example
```
GET /api/v1/chat/history?limit=20
Authorization: Bearer ...
```

---

## Hướng dẫn tích hợp

### Lưu token sau login/register
```js
const res = await fetch('/api/v1/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ username, password })
});
const json = await res.json();
localStorage.setItem('accessToken', json.data.accessToken);
localStorage.setItem('userId', json.data.userId);
```

### Gắn token vào mọi request
```js
const token = localStorage.getItem('accessToken');

fetch('/api/v1/chat', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ prompt: 'Hello!' })
});
```

### Xử lý token hết hạn (`401`)
```js
if (response.status === 401) {
  localStorage.removeItem('accessToken');
  // redirect về trang login
}
```

### Stream chat với fetch
```js
const res = await fetch('/api/v1/chat/stream', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ prompt })
});

const reader = res.body.getReader();
const decoder = new TextDecoder();

while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  const text = decoder.decode(value);
  // Parse "data: {...}\n\n" chunks
  const lines = text.split('\n').filter(l => l.startsWith('data:'));
  for (const line of lines) {
    const chunk = JSON.parse(line.replace('data:', '').trim());
    console.log(chunk.data.response); // append to UI
  }
}
```

---

## Tóm tắt nhanh

| # | Method | URL | Auth | Mô tả |
|---|--------|-----|------|-------|
| 1 | POST | `/api/v1/auth/register` | Public | Đăng ký |
| 2 | POST | `/api/v1/auth/login` | Public | Đăng nhập |
| 3 | POST | `/api/v1/chat` | 🔒 JWT | Chat thường |
| 4 | POST | `/api/v1/chat/stream` | 🔒 JWT | Chat stream SSE |
| 5 | GET | `/api/v1/chat/history/me` | 🔒 JWT | Lịch sử của tôi |
| 6 | GET | `/api/v1/chat/history` | 🔒 JWT | Toàn bộ lịch sử |

> **Token hết hạn sau 24 giờ** (`expiresInMs: 86400000`). Frontend cần redirect về login khi nhận HTTP `401`.
