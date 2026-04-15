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
    <main class="chat-messages" ref="messageBox" @scroll="handleScroll">
      <!-- 加载更多提示 -->
      <div v-if="loadingMore" class="loading-more">
        <span class="loading-spinner"></span>
        加载历史消息中...
      </div>

      <!-- 没有更多历史消息提示 -->
      <div v-else-if="!hasMore && messages.length > 0" class="no-more">
        — 已经没有更多历史消息 —
      </div>

      <!-- 消息列表 -->
      <div v-for="(msg, i) in messages" :key="msg.id || i" :data-id="msg.id" class="message"
        :class="[msg.sender_type, { 'error-message': msg.isError }]">
        <div class="bubble">
          {{ msg.content }}

          <!-- AI消息语音播放 -->
          <button
            v-if="msg.sender_type === 'assistant' && !msg.isError && !msg.content.includes('失败') && !msg.content.includes('错误')"
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

import { ref, onMounted, computed, nextTick, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { chat } from '@/api/chat'
import { tts } from '@/api/voice'
import { fetchStream } from '@/api/stream'
import { getCharacterDetail } from '@/api/character'
import { getHistoryConversation ,createConversationWithGreeting } from '@/api/conversation'

const route = useRoute()
const router = useRouter()

const characterId = Number(route.params.character_id)

const character = ref({})
const messages = ref([])

const loading = ref(false)
const loadingMore = ref(false)
const input = ref('')
const hasMore = ref(true)
const currentPage = ref(1)
const pageSize = ref(20)

const messageBox = ref(null)
let audioPlayer = null
let lastScrollHeight = 0  // 用于保持滚动位置
const conversationId = ref(null)        // 保存会话ID
let conversationCreated = ref(false)  // 标记是否已创建会话

const avatarChar = computed(() =>
  character.value.name ? character.value.name[0] : '?'
)

// 创建会话并插入开场白
const createConversation = async (greeting) => {
  if (conversationCreated.value) return
  
  try {
    const res = await createConversationWithGreeting(characterId, greeting)
    
    if (res.data.code === 200) {
      conversationId.value = res.data.data.conversation_id
      conversationCreated.value = true
      console.log('✅ 会话创建成功，ID:', conversationId.value)
      
      
      
      // 直接在前端插入开场白
      messages.value.push({
        id: `greeting_${Date.now()}`,
        sender_type: 'assistant',
        content: greeting,
        isError: false
      })
      
      
      
      return true
    }
    return false
  } catch (error) {
    console.error('创建会话失败:', error)
    return false
  }
}
// 获取角色信息和历史消息
// 组件挂载时
onMounted(async () => {
  const res1 = await getCharacterDetail(characterId)
  character.value = res1.data.data

  // 加载第一页历史消息
  await loadHistoryMessages(false)

  // ✅ 等待 DOM 更新完成后，滚动到底部
  await nextTick()

  // 3. 如果没有历史消息，创建会话并插入开场白
  if (messages.value.length === 0 && character.value.greeting) {
     await createConversation(character.value.greeting)
 
  }

  scrollBottom()

  // ✅ 延迟一小段时间后，允许滚动加载
  setTimeout(() => {
    isInitialLoad.value = false
  }, 500)
})








const isInitialLoad = ref(true)  // 标记是否首次加载
const isLoadingMore = ref(false)  // 重命名，避免与 loadingMore 混淆
let snapshotScrollHeight = 0
let snapshotScrollTop = ref(0)
let isRestoringScroll = false  // 防止滚动事件触发加载

const loadHistoryMessages = async (isLoadMore = false) => {
  if (loadingMore.value) return
  if (!hasMore.value && isLoadMore) return

  if (isLoadMore) {
    loadingMore.value = true
    isRestoringScroll = true  // 开始恢复滚动

    // 保存滚动位置
    if (messageBox.value) {
      snapshotScrollTop = messageBox.value.scrollTop
    }
  }

  try {
    const res = await getHistoryConversation(characterId, currentPage.value, pageSize.value)

    if (res.data.code === 200) {
      const newMessages = res.data.data || []
      const pagination = res.data.pagination

      if (isLoadMore && newMessages.length > 0) {
        // ✅ 记录插入前的高度
        const oldScrollHeight = messageBox.value?.scrollHeight || 0

        // 插入新消息
        messages.value = [...newMessages, ...messages.value]

        await nextTick()

        // ✅ 计算并恢复滚动位置
        if (messageBox.value) {
          const newScrollHeight = messageBox.value.scrollHeight
          const heightAdded = newScrollHeight - oldScrollHeight
          // 注意：这里不需要乘以2，直接加上增加的高度
          messageBox.value.scrollTop = snapshotScrollTop + heightAdded
        }

        // 延迟解除恢复标志
        setTimeout(() => {
          isRestoringScroll = false
        }, 100)
      } else {
        messages.value = newMessages
      }

      currentPage.value = pagination.page + 1
      hasMore.value = currentPage.value <= pagination.pages
    }
  } catch (error) {
    console.error('加载历史消息失败:', error)
  } finally {
    if (isLoadMore) {
      loadingMore.value = false
    }
  }
}

// 修改滚动事件，避免恢复过程中触发加载
const handleScroll = async (event) => {
  // 如果在恢复滚动位置，不触发加载
  if (isRestoringScroll) return
  if (loadingMore.value) return
  if (isInitialLoad.value) return

  const scrollTop = event.target.scrollTop
  if (scrollTop < 50 && hasMore.value && messages.value.length > 0) {
    await loadHistoryMessages(true)
  }
}

// // 滚动事件处理
// const handleScroll = async (event) => {
//   // ✅ 首次加载时不触发滚动加载
//   if (isInitialLoad.value) return

//   const scrollTop = event.target.scrollTop
//   // 当滚动到顶部附近时加载更多
//   if (scrollTop < 50 && hasMore.value && !isLoadingMore.value && messages.value.length > 0) {
//     console.log('触发加载更多历史消息')
//     await loadHistoryMessages(true)
//   }
// }

/* 发送文字 - 流式 */
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
  let fullResponse = ''

  try {
    await fetchStream("/chat/stream",
      {
        character_id: characterId,
        message: userText,
        conversation_id: conversationId.value  // 传递会话ID
      },
      (chunk) => {
        console.log('🔥【前端收到chunk】:', chunk)

        if (chunk.includes('[DONE]')) {
          loading.value = false
          return
        }

        // 检查是否是替换标记
        if (chunk.includes('[REPLACE]')) {
          const parts = chunk.split('[REPLACE]')
          const newContent = parts[1] || '抱歉，我无法回答这个问题。'

          console.log('🔄 检测到替换标记，替换内容为:', newContent)

          messages.value[msgIndex].content = newContent
          messages.value[msgIndex].isError = true
          messages.value = [...messages.value]
          return
        }

        // 检查错误信息
        if (chunk.includes('[流式回复系统错误:') ||
          chunk.includes('【系统错误】') ||
          chunk.includes('[系统错误:') ||
          chunk.includes('[连接中断')) {
          hasError = true
          errorMessage = chunk
          console.warn('⚠️ 检测到错误信息:', chunk)
        }

        // 正常内容，累加
        fullResponse += chunk
        messages.value[msgIndex].content = fullResponse
        messages.value = [...messages.value]
        scrollBottom()

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
  router.push(`/chat/${characterId}/voice`)
}

/* 滚动到底部 */
const scrollBottom = async () => {
  await nextTick()
  if (messageBox.value) {
    messageBox.value.scrollTop = messageBox.value.scrollHeight
  }
}

// 组件卸载时清理
onUnmounted(() => {
  stopAudio()
})
</script>

<style scoped>
@import '@/assets/styles/pages/chatPage.css';
</style>