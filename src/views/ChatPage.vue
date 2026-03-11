<template>
  <div class="chat-page">

    <!-- 角色信息 -->
    <header class="chat-header">
      <img 
      v-if="character.avatar" 
      :src="character.avatar" 
      :alt="character.name" 
      class="avatar-img"  
      @error="handleImageError" 
    />
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
  character.value = res1.data

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
  const voice_id= character.value.voice_id
  console.log(character.value)
  console.log('🎤 请求TTS接口，文本:', text, '角色ID:', characterId, '声音ID:', voice_id)
  const res = await tts({
    text,
    // character_id: characterId,
    voice_id: voice_id
  })
  console.log('audio_url:', res.data.data.audio_url  )
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
</style>