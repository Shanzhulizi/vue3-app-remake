<template>
  <div class="chat-page">

    <!-- 角色信息 -->
    <header class="chat-header">
      <img v-if="character.avatar" :src="character.avatar" :alt="character.name" class="avatar-img"
        @error="handleImageError" />
      <span v-else class="avatar-text">{{ avatarChar }}</span>
      <div class="info">
        <div class="name">{{ character.name }}</div>
        <div class="desc">{{ character.description }}</div>
      </div>
    </header>


    <!-- 聊天消息 -->
    <main class="chat-messages" ref="messageBox">

      <div v-for="(msg, i) in messages" :key="msg.id || i" class="message" :class="msg.sender_type">

        <div class="bubble">

          {{ msg.content }}

          <!-- AI消息语音播放 -->
          <button v-if="msg.sender_type === 'assistant'" class="tts-btn" @click="playTTS(msg.content)">
            🔈
          </button>

        </div>

      </div>


      <div v-if="loading" class="message assistant">
        <div class="bubble typing">思考中...</div>
      </div>

    </main>


    <!-- 输入区 -->
    <footer class="chat-input">

      <input v-model="input" placeholder="输入消息..." :disabled="loading" @keydown.enter="sendText" />

      <button @click="sendText" :disabled="loading || !input.trim()">
        发送
      </button>

      <!-- 语音通话 -->
      <button class="call-btn" @click="startVoiceCall">
        📞

      </button>

    </footer>

  </div>
</template>

<script setup>

import { ref, onMounted, computed, nextTick, reactive } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { chat } from '@/api/chat'
import { tts } from '@/api/voice'
import { fetchStream } from '@/api/stream'
import { getCharacterDetail } from '@/api/character'
import { getHistoryConversation } from '@/api/conversation'

const route = useRoute()
const router = useRouter()

const characterId = Number(route.params.character_id)

const character = ref({})
const messages = ref([])

const loading = ref(false)
const input = ref('')

const messageBox = ref(null)

let audioPlayer = null


const avatarChar = computed(() =>
  character.value.name ? character.value.name[0] : '?'
)


onMounted(async () => {

  const res1 = await getCharacterDetail(characterId)
  character.value = res1.data.data

  const res2 = await getHistoryConversation(characterId)
  messages.value = res2.data.messages || []

  scrollBottom()

})


/* 发送文字 */

// const sendText = async () => {

//   if (!input.value.trim()) return

//   const userText = input.value

//   input.value = ''

//   messages.value.push({
//     sender_type: 'user',
//     content: userText
//   })

//   loading.value = true

//   await scrollBottom()

//   const res = await chat({
//     character_id: characterId,
//     message: userText
//   })

//   messages.value.push({
//     sender_type: 'assistant',
//     content: res.data.reply
//   })

//   loading.value = false

//   await scrollBottom()

// }


/* 流式 */
const sendText = async () => {
  if (!input.value.trim()) return

  const userText = input.value
  input.value = ''

  messages.value.push({
    sender_type: 'user',
    content: userText
  })

  const msgIndex = messages.value.length
  messages.value.push({
    sender_type: 'assistant',
    content: ''
  })

  loading.value = true
  await scrollBottom()

  console.log('🚀 开始请求流式接口')  // <-- 加这里

  await fetchStream("/chat/stream",
    {
      character_id: characterId,
      message: userText
    },
    (chunk) => {
      // 🔥 关键：这个回调到底执不执行？
      console.log('🔥【前端收到chunk】:', chunk, '长度:', chunk.length)

      messages.value[msgIndex].content += chunk
      messages.value = [...messages.value]
      scrollBottom()
    }
  )

  console.log('🏁 流式请求完成')  // <-- 加这里
  loading.value = false
}



/* 播放TTS */

const playTTS = async (text) => {

  stopAudio()
  const voice_id = character.value.voice_id
  console.log(character.value)
  console.log('🎤 请求TTS接口，文本:', text, '角色ID:', characterId, '声音ID:', voice_id)
  const res = await tts({
    text,
    // character_id: characterId,
    voice_id: voice_id
  })
  console.log('audio_url:', res.data.data.audio_url)
  audioPlayer = new Audio(res.data.data.audio_url)

  audioPlayer.play()

}
const playTTSStream = async (text) => {
  stopAudio()

  const voice_id = character.value.voice_id
  console.log('🎤 请求流式TTS接口，文本:', text)

  try {
    const response = await fetch("http://127.0.0.1:8000/api/voice/cosyvoice_tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, voice_id }),
    })

    if (!response.ok) throw new Error('TTS请求失败')

    const reader = response.body.getReader()
    
    // 先读取WAV header
    const headerResult = await reader.read()
    const headerData = headerResult.value
    console.log('WAV header:', headerData.byteLength, 'bytes')
    
    // 解析WAV header
    const view = new DataView(headerData.buffer)
    const sampleRate = view.getUint32(24, true)
    const numChannels = view.getUint16(22, true)
    
    console.log('音频参数:', { sampleRate, numChannels })
    
    // 创建AudioContext
    const audioContext = new (window.AudioContext || window.webkitAudioContext)()
    await audioContext.resume()
    
    // 使用Uint8Array来累积字节数据
    let byteBuffer = new Uint8Array(0)
    let isPlaying = false
    
    const playPCMData = () => {
      // 确保至少有2字节（一个16-bit样本）
      if (byteBuffer.length < 2 || isPlaying) return
      
      // 只处理2的倍数长度的数据
      const validLength = Math.floor(byteBuffer.length / 2) * 2
      const pcmData = new Int16Array(byteBuffer.slice(0, validLength).buffer)
      
      // 剩余未处理的字节
      const remaining = byteBuffer.slice(validLength)
      byteBuffer = remaining
      
      console.log(`处理音频块: ${validLength} bytes, ${pcmData.length} samples, 剩余: ${remaining.length} bytes`)
      
      const numFrames = pcmData.length
      const audioBuffer = audioContext.createBuffer(numChannels, numFrames, sampleRate)
      
      // 填充数据
      for (let channel = 0; channel < numChannels; channel++) {
        const channelData = audioBuffer.getChannelData(channel)
        for (let i = 0; i < numFrames; i++) {
          if (numChannels === 2) {
            channelData[i] = pcmData[i * 2 + channel] / 32768.0
          } else {
            channelData[i] = pcmData[i] / 32768.0
          }
        }
      }
      
      isPlaying = true
      const source = audioContext.createBufferSource()
      source.buffer = audioBuffer
      source.connect(audioContext.destination)
      
      source.onended = () => {
        console.log('音频块播放完成')
        isPlaying = false
        // 播放下一块
        if (byteBuffer.length >= 2) {
          playPCMData()
        }
      }
      
      source.start()
      console.log('开始播放音频块')
    }
    
    // 读取后续音频数据
    while (true) {
      const { done, value } = await reader.read()
      if (done) {
        console.log('所有音频数据接收完成')
        // 播放最后剩余的完整样本
        if (byteBuffer.length >= 2 && !isPlaying) {
          playPCMData()
        }
        break
      }
      
      console.log(`收到音频块: ${value.byteLength} bytes`)
      
      // 累积字节数据
      const combined = new Uint8Array(byteBuffer.length + value.byteLength)
      combined.set(byteBuffer)
      combined.set(new Uint8Array(value), byteBuffer.length)
      byteBuffer = combined
      
      // 如果有足够数据且没有在播放，开始播放
      if (byteBuffer.length >= 8192 && !isPlaying) {
        playPCMData()
      }
    }
    
  } catch (error) {
    console.error('流式TTS失败:', error)
  
  }
}

const stopAudio = () => {

  if (audioPlayer) {

    audioPlayer.pause()

    audioPlayer = null

  }

}


/* 语音通话 */

const startVoiceCall = () => {

  router.push(`/voice-call/${characterId}`)

}


/* 滚动 */

const scrollBottom = async () => {

  await nextTick()

  if (messageBox.value) {
    messageBox.value.scrollTop = messageBox.value.scrollHeight
  }

}

</script>

<style scoped>
@import '@/assets/styles/pages/chatPage.css';
</style>