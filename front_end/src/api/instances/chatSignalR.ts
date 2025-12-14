import * as signalR from '@microsoft/signalr'
import { getAuthToken } from './httpClient'
import type { ChatMessage } from './ChatApi'

const backend_url_http = 'http://localhost:5002'
const backend_url_https = 'https://localhost:7267'

let chatConnection: signalR.HubConnection | null = null
let connectionPromise: Promise<signalR.HubConnection> | null = null

/**
 * Tạo hoặc lấy SignalR connection cho ChatHub
 */
export const getChatConnection = async (): Promise<signalR.HubConnection> => {
  // Nếu đã có connection và đang connected, trả về ngay
  if (chatConnection && chatConnection.state === signalR.HubConnectionState.Connected) {
    return chatConnection
  }

  // Nếu đang có promise đang tạo connection, đợi nó
  if (connectionPromise) {
    return connectionPromise
  }

  // Tạo connection mới
  const token = getAuthToken()
  if (!token) {
    throw new Error('Vui lòng đăng nhập để tiếp tục trò chuyện.')
  }

  // Tạo connection promise
  connectionPromise = (async () => {
    try {
      // Thử HTTP trước (vì thường backend chạy HTTP), fallback về HTTPS nếu cần
      let hubUrl = `${backend_url_http}/chathub`
      let connection: signalR.HubConnection | null = null
      let lastError: Error | null = null

      try {
        connection = new signalR.HubConnectionBuilder()
          .withUrl(hubUrl, {
            accessTokenFactory: () => token,
            skipNegotiation: false,
            transport: signalR.HttpTransportType.WebSockets | signalR.HttpTransportType.LongPolling
          })
          .withAutomaticReconnect({
            nextRetryDelayInMilliseconds: (retryContext) => {
              // Exponential backoff: 0s, 2s, 10s, 30s, sau đó mỗi 30s
              if (retryContext.previousRetryCount === 0) return 0
              if (retryContext.previousRetryCount === 1) return 2000
              if (retryContext.previousRetryCount === 2) return 10000
              return 30000
            }
          })
          .build()

        await connection.start()
        console.log('[ChatSignalR] Connected to ChatHub via HTTP')
      } catch (httpError: any) {
        lastError = httpError
        console.warn('[ChatSignalR] HTTP connection failed, trying HTTPS:', httpError?.message || httpError)
        
        // Thử HTTPS nếu HTTP fail
        try {
          hubUrl = `${backend_url_https}/chathub`
          connection = new signalR.HubConnectionBuilder()
            .withUrl(hubUrl, {
              accessTokenFactory: () => token,
              skipNegotiation: false,
              transport: signalR.HttpTransportType.WebSockets | signalR.HttpTransportType.LongPolling
            })
            .withAutomaticReconnect({
              nextRetryDelayInMilliseconds: (retryContext) => {
                if (retryContext.previousRetryCount === 0) return 0
                if (retryContext.previousRetryCount === 1) return 2000
                if (retryContext.previousRetryCount === 2) return 10000
                return 30000
              }
            })
            .build()

          await connection.start()
          console.log('[ChatSignalR] Connected to ChatHub via HTTPS')
        } catch (httpsError: any) {
          // Cả HTTP và HTTPS đều fail
          lastError = httpsError
          throw new Error(
            `Không thể kết nối đến ChatHub. Đã thử:\n` +
            `- ${backend_url_http}/chathub\n` +
            `- ${backend_url_https}/chathub\n` +
            `Lỗi: ${httpsError?.message || httpsError || 'Unknown error'}\n\n` +
            `Vui lòng kiểm tra:\n` +
            `1. Backend đã chạy chưa?\n` +
            `2. URL backend có đúng không?\n` +
            `3. Có vấn đề về CORS không?`
          )
        }
      }

      if (!connection) {
        throw lastError || new Error('Không thể tạo SignalR connection')
      }

      chatConnection = connection
      connectionPromise = null

      // Xử lý disconnect để reset connection
      connection.onclose(() => {
        console.log('[ChatSignalR] Connection closed')
        chatConnection = null
        connectionPromise = null
      })

      return connection
    } catch (error) {
      connectionPromise = null
      chatConnection = null
      console.error('[ChatSignalR] Failed to create connection:', error)
      throw error
    }
  })()

  return connectionPromise
}

/**
 * Gửi tin nhắn qua SignalR ChatHub
 * @param toUserId - ID người nhận (string)
 * @param content - Nội dung tin nhắn
 * @param imageUrl - URL ảnh từ Firebase Storage (optional)
 * @returns Promise<ChatMessage> - Tin nhắn đã gửi (từ server response)
 */
export const sendChatMessageViaSignalR = async (
  toUserId: string,
  content: string,
  imageUrl?: string
): Promise<ChatMessage> => {
  if (!toUserId || !toUserId.trim()) {
    throw new Error('ReceiverId không hợp lệ.')
  }
  if (!content || !content.trim()) {
    // Cho phép gửi tin nhắn chỉ có ảnh (content có thể rỗng)
    if (!imageUrl) {
      throw new Error('Nội dung tin nhắn hoặc ảnh không được để trống.')
    }
  }

  try {
    const connection = await getChatConnection()

    if (connection.state !== signalR.HubConnectionState.Connected) {
      throw new Error('Chưa kết nối đến server. Vui lòng thử lại.')
    }

    console.log('[ChatSignalR] Sending message via SignalR:', { 
      toUserId, 
      contentLength: content.length,
      hasImage: !!imageUrl 
    })

    // Gọi method SendMessage trên ChatHub
    // Backend ChatHub.SendMessage(string toUserId, string content) sẽ:
    // 1. Lưu vào DB
    // 2. Gửi ReceiveMessage event cho cả sender và receiver
    // Note: Backend hiện tại chưa hỗ trợ imageUrl
    await connection.invoke('SendMessage', toUserId, content)

    // Tạo ChatMessage tạm từ dữ liệu đã gửi
    // Backend sẽ gửi ReceiveMessage event với format:
    // { senderId, receiverId, content, imageUrl, timestamp }
    // Nhưng vì đây là async, ta tạo message tạm để UI cập nhật ngay
    const now = new Date().toISOString()
    
    // Lấy currentUserId từ localStorage hoặc JWT token
    let currentUserId = 0
    try {
      // Thử lấy từ userInfo trong localStorage trước
      const userInfoStr = localStorage.getItem('userInfo')
      if (userInfoStr) {
        const userInfo = JSON.parse(userInfoStr)
        currentUserId = Number(userInfo.Id ?? userInfo.id ?? userInfo.userId ?? userInfo.UserId ?? 0)
      }
      
      // Nếu không có, thử decode từ JWT token
      if (!currentUserId || currentUserId === 0) {
        const token = getAuthToken()
        if (token) {
          // Decode JWT payload (phần giữa của token)
          const parts = token.split('.')
          if (parts.length === 3) {
            const payload = JSON.parse(atob(parts[1]))
            // JWT claim cho user ID có thể là: nameid, sub, userId, id
            const tokenUserId = payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'] 
              ?? payload.nameid ?? payload.sub ?? payload.userId ?? payload.id
            if (tokenUserId) {
              currentUserId = Number(tokenUserId)
              console.log('[ChatSignalR] Got currentUserId from JWT token:', currentUserId)
            }
          }
        }
      }
      
      console.log('[ChatSignalR] Final currentUserId:', currentUserId)
    } catch (e) {
      console.warn('[ChatSignalR] Could not get currentUserId:', e)
    }
    
    return {
      id: 0, // Sẽ được cập nhật khi nhận ReceiveMessage từ server
      senderId: currentUserId, // Đặt senderId = currentUserId để UI hiển thị đúng bên phải
      receiverId: Number(toUserId),
      content,
      imageUrl,
      createdAt: now,
      isRead: false
    }
  } catch (error: any) {
    const errorMessage = error?.message || 'Không thể gửi tin nhắn'
    console.error('[ChatSignalR] sendChatMessageViaSignalR failed:', error)

    if (
      errorMessage.includes('Failed to fetch') ||
      errorMessage.includes('NetworkError') ||
      errorMessage.includes('Network request failed') ||
      errorMessage.includes('WebSocket')
    ) {
      throw new Error(
        'Không thể kết nối đến server. Vui lòng kiểm tra:\n' +
          '1. Backend đã chạy chưa?\n' +
          '2. URL backend có đúng không?\n' +
          '3. Có vấn đề về CORS không?'
      )
    }

    throw error
  }
}

/**
 * Đăng ký listener cho event ReceiveMessage từ ChatHub
 * @param callback - Hàm callback nhận ChatMessage khi có tin nhắn mới
 * @returns Hàm unsubscribe
 */
export const onReceiveMessage = (
  callback: (message: {
    senderId: string
    receiverId: string
    content: string
    imageUrl?: string
    timestamp: string
  }) => void
): (() => void) => {
  let connectionRef: signalR.HubConnection | null = null
  let isUnsubscribed = false

  // Tạo connection và đăng ký listener (không throw error để không làm crash component)
  getChatConnection()
    .then((connection) => {
      if (isUnsubscribed) return
      connectionRef = connection
      connection.on('ReceiveMessage', callback)
      console.log('[ChatSignalR] Registered ReceiveMessage listener')
    })
    .catch((error) => {
      // Chỉ log error, không throw để không làm crash component
      console.warn('[ChatSignalR] Failed to register ReceiveMessage listener (will retry on next message send):', error)
      // Connection sẽ được retry khi user gửi tin nhắn
    })

  // Trả về hàm unsubscribe
  return () => {
    isUnsubscribed = true
    if (connectionRef) {
      connectionRef.off('ReceiveMessage', callback)
      console.log('[ChatSignalR] Unregistered ReceiveMessage listener')
    }
  }
}

/**
 * Ngắt kết nối SignalR (cleanup)
 */
export const disconnectChat = async (): Promise<void> => {
  if (chatConnection) {
    try {
      await chatConnection.stop()
      console.log('[ChatSignalR] Disconnected from ChatHub')
    } catch (error) {
      console.error('[ChatSignalR] Error disconnecting:', error)
    } finally {
      chatConnection = null
      connectionPromise = null
    }
  }
}

