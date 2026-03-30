<template>
  <div class="voice-call-container">
    <!-- 角色信息 - 极简头部 -->
    <header class="call-header">
      <button class="back-btn" @click="closeCall">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M15 18L9 12L15 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
      <div class="avatar-wrapper">
        <img v-if="character.avatar" :src="character.avatar" :alt="character.name" class="avatar-img" />
        <span v-else class="avatar-text">{{ avatarChar }}</span>
        <div class="status-dot" :class="{ active: isSpeaking || isRecording }"></div>
      </div>
      <div class="info">
        <div class="name">{{ character.name }}</div>
        <div class="desc">{{ character.description }}</div>
      </div>
      <div class="header-spacer"></div>
    </header>

    <!-- 对话记录区域 - 清爽气泡 -->
    <main class="conversation-area" ref="conversationArea">
      <div v-if="messages.length === 0" class="empty-state">
        <div class="empty-icon">🎙️</div>
        <p>点击下方按钮开始通话</p>
        <span>你的声音会被实时转录并回复</span>
      </div>
      
      <div v-for="(msg, idx) in messages" :key="idx" class="message-item" :class="msg.role">
        <div class="message-bubble">
          <span class="message-text">{{ msg.text }}</span>
        </div>
        <div class="message-time" v-if="msg.time">
          {{ msg.time }}
        </div>
      </div>
      
      <div v-if="isProcessing && !isRecording" class="message-item assistant processing">
        <div class="message-bubble processing-bubble">
          <div class="typing-dots">
            <span></span><span></span><span></span>
          </div>
        </div>
      </div>
    </main>

    <!-- 通话状态 - 极简指示 -->
    <div class="call-status">
      <div class="status-text" :class="{ active: isSpeaking || isRecording }">
        <span class="status-icon">{{ statusIcon }}</span>
        {{ statusText }}
      </div>
    </div>

    <!-- 通话控制按钮 - 极简圆形 -->
    <div class="call-controls">
      <button 
        class="control-btn mic-btn" 
        :class="{ recording: isRecording }"
        @click="toggleRecording"
        :disabled="isProcessing && !isRecording"
      >
        <div class="btn-ring" :class="{ active: isRecording }"></div>
        <span class="btn-icon">{{ isRecording ? '⏹️' : '🎙️' }}</span>
      </button>
      
      <button 
        class="control-btn hangup-btn"
        @click="endCall"
      >
        <span class="btn-icon">📞</span>
      </button>
    </div>

    <!-- 处理中提示 - 轻提示 -->
    <transition name="fade">
      <div v-if="isProcessing && processingText" class="processing-toast">
        <span class="toast-spinner"></span>
        <span>{{ processingText }}</span>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed, watch, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getCharacterDetail } from '@/api/character'
import { voiceChat } from '@/api/chat'

const route = useRoute()
const router = useRouter()
const characterId = Number(route.params.character_id)

const character = ref({})
const messages = ref([])
const isRecording = ref(false)
const isSpeaking = ref(false)
const isProcessing = ref(false)
const processingText = ref('')
const mediaRecorder = ref(null)
const audioChunks = ref([])
const silenceTimer = ref(null)

const avatarChar = computed(() => character.value.name?.[0] || '?')
const statusIcon = computed(() => {
  if (isProcessing.value) return '⌛'
  if (isRecording.value) return '🎤'
  if (isSpeaking.value) return '🔊'
  return '📞'
})
const statusText = computed(() => {
  if (isProcessing.value) return processingText.value
  if (isRecording.value) return '聆听中...'
  if (isSpeaking.value) return 'AI 回复中'
  return '就绪'
})

// 获取角色信息
onMounted(async () => {
  const res = await getCharacterDetail(characterId)
  character.value = res.data.data
})

// 关闭通话
const closeCall = () => {
  endCall()
  router.push(`/chat/${characterId}`)
}

// 结束通话
const endCall = () => {
  if (mediaRecorder.value && mediaRecorder.value.state === 'recording') {
    mediaRecorder.value.stop()
  }
  isRecording.value = false
  isProcessing.value = false
  router.push(`/chat/${characterId}`)
}

// 切换录音状态
const toggleRecording = async () => {
  if (isRecording.value) {
    stopRecording()
  } else {
    await startRecording()
  }
}

// 开始录音
const startRecording = async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    
    const mimeType = MediaRecorder.isTypeSupported('audio/webm') 
      ? 'audio/webm' 
      : 'audio/mp4'
    
    mediaRecorder.value = new MediaRecorder(stream, { mimeType })
    audioChunks.value = []
    
    mediaRecorder.value.ondataavailable = (event) => {
      if (event.data.size > 0) {
        audioChunks.value.push(event.data)
      }
    }
    
    mediaRecorder.value.onstop = async () => {
      const audioBlob = new Blob(audioChunks.value, { type: 'audio/webm' })
      await sendVoiceMessage(audioBlob)
      stream.getTracks().forEach(track => track.stop())
    }
    
    mediaRecorder.value.start(1000)
    isRecording.value = true
    
    setTimeout(() => {
      if (mediaRecorder.value?.state === 'recording') {
        stopRecording()
      }
    }, 30000)
    
  } catch (error) {
    console.error('录音失败:', error)
    alert('无法访问麦克风')
  }
}

// 停止录音
const stopRecording = () => {
  if (silenceTimer.value) {
    clearTimeout(silenceTimer.value)
    silenceTimer.value = null
  }
  
  if (mediaRecorder.value && mediaRecorder.value.state === 'recording') {
    mediaRecorder.value.stop()
    isRecording.value = false
  }
}

// 发送语音消息
const sendVoiceMessage = async (audioBlob) => {
  isProcessing.value = true
  processingText.value = '识别中'
  
  messages.value.push({
    role: 'user',
    text: '...'
  })
  scrollToBottom()
  
  const formData = new FormData()
  formData.append('character_id', characterId)
  formData.append('audio', audioBlob, 'voice.webm')
  
  try {
    processingText.value = '思考中'
    const response = await voiceChat(formData)
    
    if (response.data.user_text) {
      messages.value[messages.value.length - 1].text = response.data.user_text
    } else {
      messages.value.pop()
      messages.value.push({
        role: 'user',
        text: '未能识别语音'
      })
    }
    
    processingText.value = '生成回复'
    messages.value.push({
      role: 'assistant',
      text: response.data.reply_text || '抱歉，我没有听清楚'
    })
    scrollToBottom()
    
    if (response.data.audio_url) {
      processingText.value = '播放语音'
      await playAudio(response.data.audio_url)
    }
    
  } catch (error) {
    console.error('语音请求失败:', error)
    messages.value.push({
      role: 'assistant',
      text: '处理失败，请重试'
    })
  } finally {
    isProcessing.value = false
    processingText.value = ''
  }
}

// 播放音频
const playAudio = (audioUrl) => {
  return new Promise((resolve) => {
    const audio = new Audio(audioUrl)
    isSpeaking.value = true
    
    audio.onended = () => {
      isSpeaking.value = false
      resolve()
    }
    
    audio.onerror = () => {
      console.error('播放失败')
      isSpeaking.value = false
      resolve()
    }
    
    audio.play().catch(e => {
      console.warn('播放被阻止', e)
      isSpeaking.value = false
      resolve()
    })
  })
}

// 滚动到底部
const scrollToBottom = async () => {
  await nextTick()
  const area = document.querySelector('.conversation-area')
  if (area) area.scrollTop = area.scrollHeight
}

// 监听消息变化自动滚动
watch(messages, () => {
  scrollToBottom()
}, { deep: true })
</script>

<style scoped>
/* =========================
   ChatGPT 风格语音通话 - 极简优雅
========================= */

.voice-call-container {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: #ffffff;
  display: flex;
  flex-direction: column;
  z-index: 1000;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif;
}

/* ========== 头部 ========== */
.call-header {
  display: flex;
  align-items: center;
  padding: 12px 20px;
  background: rgba(255,255,255,0.98);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(0,0,0,0.05);
  flex-shrink: 0;
  gap: 12px;
}

.back-btn {
  background: none;
  border: none;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #5b6e8c;
  transition: all 0.2s ease;
}

.back-btn:hover {
  background: #f1f5f9;
  color: #1e293b;
}

.avatar-wrapper {
  position: relative;
  flex-shrink: 0;
}

.avatar-img {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  object-fit: cover;
}

.avatar-text {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: #f1f5f9;
  color: #475569;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  font-weight: 500;
}

.status-dot {
  position: absolute;
  bottom: 2px;
  right: 2px;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #cbd5e1;
  border: 2px solid white;
}

.status-dot.active {
  background: #22c55e;
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.6; transform: scale(0.9); }
}

.info {
  flex: 1;
}

.name {
  font-size: 16px;
  font-weight: 500;
  color: #1e293b;
  margin-bottom: 2px;
}

.desc {
  font-size: 12px;
  color: #64748b;
  line-height: 1.3;
}

.header-spacer {
  width: 36px;
}

/* ========== 对话区域 ========== */
.conversation-area {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  background: #ffffff;
}

/* 空状态 */
.empty-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  color: #94a3b8;
  gap: 8px;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 8px;
  opacity: 0.5;
}

.empty-state p {
  font-size: 15px;
  margin: 0;
  color: #475569;
}

.empty-state span {
  font-size: 13px;
}

/* 消息气泡 */
.message-item {
  display: flex;
  flex-direction: column;
  max-width: 85%;
}

.message-item.user {
  align-self: flex-end;
}

.message-item.assistant {
  align-self: flex-start;
}

.message-bubble {
  padding: 10px 14px;
  border-radius: 20px;
  font-size: 14px;
  line-height: 1.45;
  word-break: break-word;
}

.message-item.user .message-bubble {
  background: #1e293b;
  color: #ffffff;
  border-bottom-right-radius: 6px;
}

.message-item.assistant .message-bubble {
  background: #f1f5f9;
  color: #1e293b;
  border-bottom-left-radius: 6px;
}

.message-text {
  white-space: pre-wrap;
}

.message-time {
  font-size: 10px;
  color: #94a3b8;
  margin-top: 4px;
  margin-inline: 12px;
}

.message-item.user .message-time {
  text-align: right;
}

/* 思考中动画 */
.processing-bubble {
  padding: 12px 16px;
  background: #f1f5f9;
}

.typing-dots {
  display: flex;
  gap: 4px;
  align-items: center;
}

.typing-dots span {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #94a3b8;
  animation: typing 1.4s infinite ease-in-out;
}

.typing-dots span:nth-child(1) { animation-delay: 0s; }
.typing-dots span:nth-child(2) { animation-delay: 0.2s; }
.typing-dots span:nth-child(3) { animation-delay: 0.4s; }

@keyframes typing {
  0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
  30% { transform: translateY(-4px); opacity: 1; }
}

/* ========== 通话状态 ========== */
.call-status {
  padding: 12px 20px;
  text-align: center;
  border-top: 1px solid #eef2f6;
  flex-shrink: 0;
  background: #ffffff;
}

.status-text {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #64748b;
  background: #f8fafc;
  padding: 6px 16px;
  border-radius: 30px;
  transition: all 0.2s ease;
}

.status-text.active {
  background: #f1f5f9;
  color: #1e293b;
}

.status-icon {
  font-size: 14px;
}

/* ========== 控制按钮 ========== */
.call-controls {
  display: flex;
  justify-content: center;
  gap: 32px;
  padding: 20px 20px 32px;
  flex-shrink: 0;
  background: #ffffff;
}

.control-btn {
  position: relative;
  width: 72px;
  height: 72px;
  border-radius: 50%;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  background: #f1f5f9;
  color: #475569;
}

.control-btn .btn-icon {
  font-size: 28px;
  position: relative;
  z-index: 2;
}

.mic-btn {
  background: #f1f5f9;
  color: #475569;
}

.mic-btn.recording {
  background: #1e293b;
  color: #ffffff;
}

.btn-ring {
  position: absolute;
  top: -4px;
  left: -4px;
  right: -4px;
  bottom: -4px;
  border-radius: 50%;
  border: 2px solid transparent;
  transition: all 0.2s ease;
}

.btn-ring.active {
  border-color: #22c55e;
  animation: ringPulse 1.5s infinite;
}

@keyframes ringPulse {
  0%, 100% { transform: scale(1); opacity: 1; border-color: #22c55e; }
  50% { transform: scale(1.1); opacity: 0.6; border-color: #4ade80; }
}

.hangup-btn {
  background: #fee2e2;
  color: #e5484d;
}

.hangup-btn:hover {
  background: #fecaca;
  transform: scale(1.02);
}

.control-btn:active {
  transform: scale(0.98);
}

.control-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

/* ========== 提示 Toast ========== */
.processing-toast {
  position: fixed;
  bottom: 140px;
  left: 50%;
  transform: translateX(-50%);
  background: #1e293b;
  color: white;
  padding: 8px 20px;
  border-radius: 40px;
  font-size: 13px;
  display: flex;
  align-items: center;
  gap: 8px;
  z-index: 1001;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.toast-spinner {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255,255,255,0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* ========== 滚动条 ========== */
.conversation-area::-webkit-scrollbar {
  width: 5px;
}

.conversation-area::-webkit-scrollbar-track {
  background: transparent;
}

.conversation-area::-webkit-scrollbar-thumb {
  background: #e2e8f0;
  border-radius: 10px;
}

.conversation-area::-webkit-scrollbar-thumb:hover {
  background: #cbd5e1;
}

/* ========== 响应式 ========== */
@media (max-width: 480px) {
  .control-btn {
    width: 64px;
    height: 64px;
  }
  
  .control-btn .btn-icon {
    font-size: 24px;
  }
  
  .message-item {
    max-width: 90%;
  }
  
  .call-controls {
    gap: 24px;
  }
}
</style>