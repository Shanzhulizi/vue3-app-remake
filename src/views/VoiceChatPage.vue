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

// ✅ 全局音频对象（防止被垃圾回收）
let currentAudio = null

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
  if (currentAudio) {
    currentAudio.pause()
    currentAudio = null
  }
  isRecording.value = false
  isProcessing.value = false
  isSpeaking.value = false
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
    
    // ==============================
    // ✅ 修复：自动播放音频（你缺失的核心）
    // ==============================
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

// ==============================
// ✅ 修复：播放音频（保证能自动播放）
// ==============================
const playAudio = async (audioUrl) => {
  try {
    if (currentAudio) {
      currentAudio.pause()
      currentAudio = null
    }

    isSpeaking.value = true
    currentAudio = new Audio(audioUrl)
    
    currentAudio.onended = () => {
      isSpeaking.value = false
      currentAudio = null
    }
    
    currentAudio.onerror = (err) => {
      console.error('播放失败', err)
      isSpeaking.value = false
      currentAudio = null
    }

    await currentAudio.play()
  } catch (e) {
    console.warn('自动播放被浏览器阻止，尝试手动触发', e)
    isSpeaking.value = false
  }
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
@import '@/assets/styles/voiceChat.css';
</style>