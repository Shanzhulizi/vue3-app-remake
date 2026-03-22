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

      <div v-for="(msg, i) in messages" :key="msg.id || i" 
           class="message" 
           :class="[msg.sender_type, { 'error-message': msg.isError }]">
        <div class="bubble">
          {{ msg.content }}
          
          <!-- AI消息语音播放 - 只在正常消息且没有错误时显示 -->
          <button v-if="msg.sender_type === 'assistant' && !msg.isError && !msg.content.includes('失败') && !msg.content.includes('错误')" 
                  class="tts-btn" @click="playTTS(msg.content)">
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
      <button @click="sendText" :disabled="loading || !input.trim()">发送</button>
      <button class="call-btn" @click="startVoiceCall">📞</button>
    </footer>

  </div>
</template>

<script setup>
import { ref, onMounted, computed, nextTick } from 'vue'
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
let pendingReplace = false  // 标记是否需要替换

const avatarChar = computed(() =>
  character.value.name ? character.value.name[0] : '?'
)


onMounted(async () => {
  const res1 = await getCharacterDetail(characterId)
  character.value = res1.data.data

  const res2 = await getHistoryConversation(characterId)
  messages.value = res2.data.data || []

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

  // 添加用户消息
  messages.value.push({
    sender_type: 'user',
    content: userText
  })

  // 准备助手消息占位
  const msgIndex = messages.value.length
  messages.value.push({
    sender_type: 'assistant',
    content: '',
    isError: false
  })

  loading.value = true
  await scrollBottom()

  console.log('🚀 开始请求流式接口')
  
  let hasError = false
  let errorMessage = ''
  let receivedNormalContent = false
  let fullResponse = ''  // 记录完整回复用于检测

  try {
    await fetchStream("/chat/stream",
      {
        character_id: characterId,
        message: userText
      },
      (chunk) => {
        console.log('🔥【前端收到chunk】:', chunk)
        
        // ========== 检查是否是替换标记 ==========
        // 格式: [REPLACE]新内容
        if (chunk.includes('[REPLACE]')) {
          const parts = chunk.split('[REPLACE]')
          const newContent = parts[1] || '抱歉，我无法回答这个问题。'
          
          console.log('🔄 检测到替换标记，替换内容为:', newContent)
          
          // 替换整个助手消息
          messages.value[msgIndex].content = newContent
          messages.value[msgIndex].isError = true
          messages.value = [...messages.value]
          
          // 标记已经处理，不再继续追加
          return
        }
        
        // ========== 检查错误信息 ==========
        if (chunk.includes('[流式回复系统错误:') || 
            chunk.includes('【系统错误】') ||
            chunk.includes('[系统错误:')) {
          hasError = true
          errorMessage = chunk
          console.warn('⚠️ 检测到错误信息:', chunk)
        }
        
        // 正常内容，累加
        fullResponse += chunk
        messages.value[msgIndex].content = fullResponse
        messages.value = [...messages.value]
        scrollBottom()
        
        // 标记收到了正常内容
        if (chunk.trim() && !chunk.includes('[REPLACE]')) {
          receivedNormalContent = true
        }
      }
    )
  } catch (error) {
    console.error('流式请求异常:', error)
    hasError = true
    errorMessage = error.message
  }

  console.log('🏁 流式请求完成', { hasError, receivedNormalContent, fullResponse })

  // 处理错误情况
  if (hasError || !receivedNormalContent) {
    console.log('❌ 发生错误，更新消息为错误提示')
    
    let friendlyError = '生成失败，请稍后再试'
    
    if (errorMessage.includes('10061') || errorMessage.includes('积极拒绝')) {
      friendlyError = '😴 AI服务未启动，请稍后再试'
    } else if (errorMessage.includes('timeout')) {
      friendlyError = '⏰ 响应超时，请重试'
    } else if (errorMessage.includes('network') || errorMessage.includes('网络')) {
      friendlyError = '📡 网络连接失败，请检查网络'
    }
    
    messages.value[msgIndex].content = friendlyError
    messages.value[msgIndex].isError = true
    messages.value = [...messages.value]
  }

  loading.value = false
  await scrollBottom()
}


/* 播放TTS */
const playTTS = async (text) => {
  stopAudio()
  const voice_id = character.value.voice_id
  console.log('🎤 请求TTS接口，文本:', text, '角色ID:', characterId, '声音ID:', voice_id)
  const res = await tts({
    text,
    voice_id: voice_id
  })
  console.log('audio_url:', res.data.data.audio_url)
  audioPlayer = new Audio(res.data.data.audio_url)
  audioPlayer.play()
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

/* 添加错误消息样式 */
.error-message .bubble {
  background-color: #fef0f0;
  color: #f56c6c;
  border-left: 3px solid #f56c6c;
}

/* 确保错误消息不显示喇叭按钮 */
.error-message .tts-btn {
  display: none;
}
</style>