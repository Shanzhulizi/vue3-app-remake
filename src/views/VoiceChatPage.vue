<template>
  <div class="chat-page">

    <!-- 顶部角色信息 -->
    <header class="chat-header">
      <div class="avatar">{{ avatarChar }}</div>

      <div class="info">
        <div class="name">{{ character.name }}</div>
        <div class="desc">{{ character.description }}</div>
      </div>
    </header>

    <!-- 消息区 -->
    <main class="chat-messages" ref="messageBox">

      <div
        v-for="(msg, i) in messages"
        :key="msg.id || i"
        class="message"
        :class="msg.sender_type"
      >
        <div
          class="bubble"
          @click="msg.audio_url && playAudio(msg.audio_url)"
        >
          {{ msg.content }}
        </div>
      </div>

      <div v-if="loading" class="message assistant">
        <div class="bubble typing">思考中</div>
      </div>

    </main>

    <!-- 输入区 -->
    <footer class="chat-input">
      <div class="mode-switch">
        <button
          class="mode-btn"
          :class="{ active: inputMode === 'voice' }"
          @click="switchInputMode('voice')"
          :disabled="loading"
        >
          语音输入
        </button>
        <button
          class="mode-btn"
          :class="{ active: inputMode === 'text' }"
          @click="switchInputMode('text')"
          :disabled="loading"
        >
          文字输入
        </button>
      </div>

      <div v-if="inputMode === 'voice'" class="voice-panel">
        <button
          class="record-btn"
          :class="{ recording }"
          @mousedown="startRecord"
          @mouseup="stopRecord"
          @mouseleave="cancelRecord"
        >
          {{ recording ? '松开结束' : '按住说话' }}
        </button>
      </div>

      <div v-else class="text-panel">
        <input
          v-model="input"
          placeholder="输入你想说的话…"
          :disabled="loading"
          @keydown.enter="sendText"
        />
        <button @click="sendText" :disabled="loading || !input.trim()">
          发送
        </button>
      </div>
    </footer>

  </div>
</template>

<script setup>

import { ref, onMounted, computed, nextTick } from 'vue'
import { useRoute } from 'vue-router'

import { getCharacterDetail } from '@/api/character'
import { getHistoryConversation } from '@/api/conversation'
import { chat } from '@/api/chat'
import { voiceChat } from '@/api/chat'

/* 路由 */
const route = useRoute()
const characterId = Number(route.params.character_id)

/* 角色信息 */
const character = ref({
  id: characterId,
  name: '',
  description: ''
})

/* 消息 */
const messages = ref([])

/* 状态 */
const loading = ref(false)
const recording = ref(false)
const inputMode = ref('voice')
const input = ref('')

/* DOM */
const messageBox = ref(null)

/* 音频相关 */
let mediaRecorder = null
let audioChunks = []
let audioPlayer = null
let stream = null
let isCancel = false

/* 头像字母 */
const avatarChar = computed(() =>
  character.value.name ? character.value.name[0] : '?'
)

/* 初始化 */
onMounted(async () => {

  await loadCharacter()
  await loadHistory()

  await scrollBottom()

})

/* 加载角色 */
const loadCharacter = async () => {

  const res = await getCharacterDetail(characterId)

  character.value = res.data

}

/* 加载历史 */
const loadHistory = async () => {

  const res = await getHistoryConversation(characterId)

  messages.value = res.data.messages || []

}

/* =========================
   录音
========================= */

const startRecord = async () => {

  if (loading.value || recording.value) return

  try {

    recording.value = true
    isCancel = false
    audioChunks = []

    stream = await navigator.mediaDevices.getUserMedia({ audio: true })

    mediaRecorder = new MediaRecorder(stream)

    mediaRecorder.ondataavailable = (e) => {

      audioChunks.push(e.data)

    }

    mediaRecorder.onstop = async () => {

      if (isCancel) {
        releaseMic()
        return
      }

      const blob = new Blob(audioChunks, { type: 'audio/webm' })

      await sendVoice(blob)

      releaseMic()

    }

    mediaRecorder.start()

  } catch (err) {

    console.error("麦克风权限错误", err)

    recording.value = false

  }

}

/* 停止录音 */
const stopRecord = () => {

  if (!recording.value) return

  recording.value = false

  mediaRecorder?.stop()

}

/* 取消录音 */
const cancelRecord = () => {

  if (!recording.value) return

  isCancel = true

  recording.value = false

  mediaRecorder?.stop()

}

const switchInputMode = (mode) => {

  if (inputMode.value === mode) return

  if (recording.value) {

    isCancel = true

    recording.value = false

    mediaRecorder?.stop()

  }

  inputMode.value = mode

}

/* 释放麦克风 */
const releaseMic = () => {

  if (stream) {

    stream.getTracks().forEach(track => track.stop())

    stream = null

  }

}

/* =========================
   发送语音
========================= */

const sendVoice = async (audioBlob) => {

  loading.value = true

  stopAudio()

  try {

    const formData = new FormData()

    formData.append('audio', audioBlob)

    formData.append('character_id', characterId)

    const res = await voiceChat(formData)

    /* 用户消息 */
    messages.value.push({
      sender_type: 'user',
      content: res.data.user_text
    })

    await scrollBottom()

    /* AI 回复 */
    messages.value.push({
      sender_type: 'assistant',
      content: res.data.reply_text,
      audio_url: res.data.audio_url
    })

    await scrollBottom()

    /* 自动播放 */
    if (res.data.audio_url) {

      playAudio(res.data.audio_url)

    }

  } catch (err) {

    console.error("语音发送失败", err)

  } finally {

    loading.value = false

  }

}

/* =========================
   发送文字
========================= */

const sendText = async () => {

  if (!input.value.trim() || loading.value) return

  const userText = input.value.trim()

  input.value = ''

  loading.value = true

  stopAudio()

  messages.value.push({
    sender_type: 'user',
    content: userText
  })

  await scrollBottom()

  try {

    const res = await chat({
      character_id: characterId,
      message: userText
    })

    messages.value.push({
      sender_type: 'assistant',
      content: res.data.reply
    })

    await scrollBottom()

  } catch (err) {

    console.error("文字发送失败", err)

  } finally {

    loading.value = false

  }

}

/* =========================
   音频播放
========================= */

const playAudio = (url) => {

  stopAudio()

  audioPlayer = new Audio(url)

  audioPlayer.play().catch(err => {

    console.warn("Audio play failed", err)

  })

}

const stopAudio = () => {

  if (audioPlayer) {

    audioPlayer.pause()

    audioPlayer.currentTime = 0

    audioPlayer = null

  }

}

/* =========================
   滚动
========================= */

const scrollBottom = async () => {

  await nextTick()

  if (messageBox.value) {

    messageBox.value.scrollTop = messageBox.value.scrollHeight

  }

}

</script>

<style scoped>
.chat-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #f5f5f5;
}

.chat-header {
  display: flex;
  align-items: center;
  padding: 12px;
  background: #ffffff;
  border-bottom: 1px solid #eee;
}

.avatar {
  width: 40px;
  height: 40px;
  background: #409eff;
  color: #fff;
  border-radius: 50%;
  text-align: center;
  line-height: 40px;
  font-weight: bold;
  margin-right: 12px;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.message {
  margin-bottom: 12px;
  display: flex;
}

.message.user {
  justify-content: flex-end;
}

.message.assistant {
  justify-content: flex-start;
}

.bubble {
  max-width: 70%;
  padding: 10px 14px;
  border-radius: 12px;
  background: #fff;
  line-height: 1.6;
}

.message.user .bubble {
  background: #409eff;
  color: #fff;
}

.typing {
  opacity: 0.7;
}

/* 输入区 */
.chat-input {
  padding: 12px;
  background: #fff;
  border-top: 1px solid #eee;
}

.mode-switch {
  display: flex;
  gap: 8px;
  margin-bottom: 10px;
}

.mode-btn {
  flex: 1;
  padding: 8px 0;
  border: 1px solid #dcdfe6;
  border-radius: 8px;
  background: #fff;
  color: #606266;
}

.mode-btn.active {
  color: #fff;
  background: #409eff;
  border-color: #409eff;
}

.voice-panel {
  display: flex;
  justify-content: center;
}

.record-btn {
  width: 70%;
  padding: 14px 0;
  border-radius: 24px;
  border: none;
  font-size: 16px;
  background: #409eff;
  color: #fff;
}

.record-btn.recording {
  background: #e74c3c;
}

.text-panel {
  display: flex;
  gap: 8px;
}

.text-panel input {
  flex: 1;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 8px;
}

.text-panel button {
  padding: 0 16px;
  border: none;
  border-radius: 8px;
  background: #409eff;
  color: #fff;
}
</style>