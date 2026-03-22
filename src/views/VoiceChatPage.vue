<!-- VoiceCall.vue -->
<template>
  <div class="voice-call-container">
    <!-- 角色信息 -->
    <header class="call-header">
      <img v-if="character.avatar" :src="character.avatar" :alt="character.name" class="avatar-img" />
      <span v-else class="avatar-text">{{ avatarChar }}</span>
      <div class="info">
        <div class="name">{{ character.name }}</div>
        <div class="desc">{{ character.description }}</div>
      </div>
      <button class="close-btn" @click="closeCall">✕</button>
    </header>

    <!-- 对话记录区域（可选） -->
    <div class="conversation-area" ref="conversationArea" v-if="showTranscript">
      <div v-for="(msg, idx) in messages" :key="idx" class="message-item">
        <span class="role">{{ msg.role === 'user' ? '你' : character.name }}：</span>
        <span class="content">{{ msg.text }}</span>
      </div>
    </div>

    <!-- 通话状态 -->
    <div class="call-status">
      <div class="status-indicator" :class="{ active: isSpeaking }">
        {{ statusText }}
      </div>
    </div>

    <!-- 通话控制按钮 -->
    <div class="call-controls">
      <button 
        class="control-btn mic-btn" 
        :class="{ active: isRecording }"
        @click="toggleRecording"
        :disabled="isProcessing"
      >
        <span class="icon">{{ isRecording ? '🎤' : '🎙️' }}</span>
        <span class="text">{{ isRecording ? '说话中...' : '点击说话' }}</span>
      </button>
      
      <button 
        class="control-btn hangup-btn"
        @click="endCall"
      >
        <span class="icon">📞</span>
        <span class="text">挂断</span>
      </button>
    </div>

    <!-- 处理中提示 -->
    <div v-if="isProcessing" class="processing-overlay">
      <div class="spinner"></div>
      <p>{{ processingText }}</p>
    </div>
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
const showTranscript = ref(true)  // 是否显示对话记录
const mediaRecorder = ref(null)
const audioChunks = ref([])
const audioContext = ref(null)
const analyser = ref(null)
const silenceTimer = ref(null)

const avatarChar = computed(() => character.value.name?.[0] || '?')
const statusText = computed(() => {
  if (isProcessing.value) return processingText.value
  if (isRecording.value) return '🎤 正在聆听...'
  if (isSpeaking.value) return '🤖 AI 正在回复...'
  return '📞 点击说话'
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
  closeCall()
}

// 切换录音状态
const toggleRecording = async () => {
  if (isRecording.value) {
    // 停止录音
    stopRecording()
  } else {
    // 开始录音
    await startRecording()
  }
}

// 开始录音
const startRecording = async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    
    // 创建录音器
    mediaRecorder.value = new MediaRecorder(stream)
    audioChunks.value = []
    
    mediaRecorder.value.ondataavailable = (event) => {
      if (event.data.size > 0) {
        audioChunks.value.push(event.data)
      }
    }
    
    mediaRecorder.value.onstop = async () => {
      // 停止录音后发送语音
      const audioBlob = new Blob(audioChunks.value, { type: 'audio/wav' })
      await sendVoiceMessage(audioBlob)
      
      // 关闭音频流
      stream.getTracks().forEach(track => track.stop())
    }
    
    mediaRecorder.value.start()
    isRecording.value = true
    
    // 添加静音检测（可选）
    setupSilenceDetection(stream)
    
    // 3秒后自动停止（可选）
    setTimeout(() => {
      if (mediaRecorder.value && mediaRecorder.value.state === 'recording') {
        stopRecording()
      }
    }, 30000) // 最长30秒
    
  } catch (error) {
    console.error('录音失败:', error)
    alert('无法访问麦克风，请检查权限')
  }
}

// 静音检测
const setupSilenceDetection = (stream) => {
  audioContext.value = new (window.AudioContext || window.webkitAudioContext)()
  analyser.value = audioContext.value.createAnalyser()
  const source = audioContext.value.createMediaStreamSource(stream)
  source.connect(analyser.value)
  analyser.value.fftSize = 256
  
  const dataArray = new Uint8Array(analyser.value.frequencyBinCount)
  
  const checkSilence = () => {
    if (!isRecording.value) return
    
    analyser.value.getByteTimeDomainData(dataArray)
    let maxSample = 0
    for (let i = 0; i < dataArray.length; i++) {
      const sample = Math.abs(dataArray[i] - 128) / 128
      if (sample > maxSample) maxSample = sample
    }
    
    // 如果静音超过1秒，自动停止录音
    if (maxSample < 0.05) {
      if (!silenceTimer.value) {
        silenceTimer.value = setTimeout(() => {
          if (isRecording.value) {
            console.log('检测到静音，自动停止录音')
            stopRecording()
          }
        }, 1500)
      }
    } else {
      if (silenceTimer.value) {
        clearTimeout(silenceTimer.value)
        silenceTimer.value = null
      }
    }
    
    requestAnimationFrame(checkSilence)
  }
  
  checkSilence()
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
  
  if (audioContext.value) {
    audioContext.value.close()
  }
}

// 发送语音消息
const sendVoiceMessage = async (audioBlob) => {
  isProcessing.value = true
  processingText.value = '正在识别语音...'
  
  // 添加用户消息到对话记录
  messages.value.push({
    role: 'user',
    text: '...（语音消息）'
  })
  
  const formData = new FormData()
  formData.append('character_id', characterId)
  formData.append('audio', audioBlob, 'voice.wav')
  
  try {
    const response = await voiceChat(formData)
    console.log('语音回复:', response.data)
    
    // 更新用户消息文本
    if (response.data.user_text) {
      messages.value[messages.value.length - 1].text = response.data.user_text
    }
    
    // 添加助手回复
    messages.value.push({
      role: 'assistant',
      text: response.data.reply_text
    })
    
    // 播放AI回复
    if (response.data.audio_url) {
      processingText.value = '正在播放回复...'
      await playAudio(response.data.audio_url)
    }
    
  } catch (error) {
    console.error('语音请求失败:', error)
    messages.value.push({
      role: 'assistant',
      text: '抱歉，处理失败，请重试'
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
    
    audio.onplay = () => {
      console.log('开始播放')
    }
    
    audio.onended = () => {
      isSpeaking.value = false
      resolve()
    }
    
    audio.onerror = () => {
      console.error('播放失败')
      isSpeaking.value = false
      resolve()
    }
    
    audio.play()
  })
}

// 滚动到底部
const scrollToBottom = () => {
  const area = document.querySelector('.conversation-area')
  if (area) area.scrollTop = area.scrollHeight
}

// 监听消息变化自动滚动
watch(messages, () => {
  nextTick(() => scrollToBottom())
})
</script>

<style scoped>
.voice-call-container {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  display: flex;
  flex-direction: column;
  z-index: 1000;
}

.call-header {
  display: flex;
  align-items: center;
  padding: 20px;
  background: rgba(255,255,255,0.1);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(255,255,255,0.2);
  flex-shrink: 0;
}

.avatar-img {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  object-fit: cover;
  margin-right: 15px;
}

.avatar-text {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: #667eea;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  font-weight: bold;
  color: white;
  margin-right: 15px;
}

.info {
  flex: 1;
}

.name {
  font-size: 18px;
  font-weight: bold;
  color: white;
}

.desc {
  font-size: 12px;
  color: rgba(255,255,255,0.7);
}

.close-btn {
  background: rgba(255,255,255,0.2);
  border: none;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  font-size: 20px;
  cursor: pointer;
  color: white;
  transition: all 0.3s;
}

.close-btn:hover {
  background: rgba(255,255,255,0.3);
}

.conversation-area {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.message-item {
  background: rgba(255,255,255,0.1);
  border-radius: 12px;
  padding: 12px 16px;
  color: white;
}

.message-item .role {
  font-weight: bold;
  color: #667eea;
  margin-right: 8px;
}

.message-item .content {
  color: rgba(255,255,255,0.9);
}

.call-status {
  padding: 20px;
  text-align: center;
  flex-shrink: 0;
}

.status-indicator {
  display: inline-block;
  padding: 8px 20px;
  background: rgba(255,255,255,0.1);
  border-radius: 30px;
  color: white;
  font-size: 14px;
  transition: all 0.3s;
}

.status-indicator.active {
  background: #667eea;
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.7; transform: scale(1.05); }
}

.call-controls {
  display: flex;
  justify-content: center;
  gap: 30px;
  padding: 30px;
  flex-shrink: 0;
}

.control-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 20px;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.3s;
  width: 80px;
  height: 80px;
}

.control-btn .icon {
  font-size: 32px;
}

.control-btn .text {
  font-size: 12px;
  white-space: nowrap;
}

.mic-btn {
  background: #4caf50;
  color: white;
}

.mic-btn.active {
  background: #ff9800;
  animation: pulse 1s infinite;
}

.hangup-btn {
  background: #f44336;
  color: white;
}

.control-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.processing-overlay {
  position: fixed;
  bottom: 150px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0,0,0,0.8);
  padding: 12px 24px;
  border-radius: 40px;
  display: flex;
  align-items: center;
  gap: 12px;
  color: white;
  z-index: 1001;
}

.spinner {
  width: 20px;
  height: 20px;
  border: 2px solid rgba(255,255,255,0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>