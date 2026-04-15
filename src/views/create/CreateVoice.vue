<template>
  <div class="cosyvoice-container">
    <h1>声音创作</h1>
    
    <!-- 创建声音表单 -->
    <div class="create-voice-section">
      <h2>上传参考音频，创建新声音</h2>
      
      <form @submit.prevent="handleCreateVoice" class="form">
        <div class="form-group">
          <label>声音名称</label>
          <input 
            type="text" 
            v-model="createForm.voice_name" 
            placeholder="例如：哈基米声音、温柔女声..."
            required
          >
        </div>

        <div class="form-group">
          <label>参考音频文本</label>
          <textarea 
            v-model="createForm.voice_text" 
            placeholder="输入音频中的说话内容，必须和音频内容完全一致..."
            rows="4"
            required
          ></textarea>
          <small>⚠️ 必须和音频内容完全一致，这很重要！</small>
        </div>

        <div class="form-group">
          <label>参考音频文件</label>
          <div class="file-upload-area" @click="$refs.audioFile.click()">
            <input 
              type="file" 
              ref="audioFile"
              @change="handleFileSelect"
              accept=".wav,.mp3,.m4a"
              style="display: none"
            >
            <div v-if="!audioPreview" class="upload-placeholder">
              <span class="upload-icon">📁</span>
              <p>点击选择音频文件</p>
              <small>支持 WAV、MP3 格式，建议 3-10 秒，超过10秒部分将截断</small>
            </div>
            <div v-else class="audio-preview">
              <audio :src="audioPreview" controls></audio>
              <button type="button" class="remove-btn" @click.stop="removeAudio">✕</button>
            </div>
          </div>
        </div>

        <button 
          type="submit" 
          class="submit-btn"
          :disabled="uploading"
        >
          <span v-if="uploading">⏳ 上传中...</span>
          <span v-else>创建声音</span>
        </button>
      </form>

      <!-- 创建成功提示 -->
      <div v-if="createResult" class="result success">
        <h3>创建成功！</h3>
        <div class="result-info">
          <p><strong>声音名称：</strong>{{ createResult.voice_name }}</p>
          <p><strong>声音ID：</strong>{{ createResult.voice_id }}</p>
          <p><strong>音频时长：</strong>{{ createResult.duration }}秒</p>
          <p><strong>文件路径：</strong>{{ createResult.voice_url }}</p>
        </div>
        <div class="result-audio">
          <audio 
            v-if="createResult.voice_url" 
            :src="getFullUrl(createResult.voice_url)" 
            controls
          ></audio>
        </div>
        <button class="create-another-btn" @click="resetForm">
          创建另一个声音
        </button>
      </div>
    </div>

    <!-- 声音列表 -->
    <div class="voice-list-section">
      <h2>已有声音库</h2>
      
      <div v-if="loadingVoices" class="loading">
        <span class="loading-spinner"></span>
        加载中...
      </div>
      
      <div v-else-if="voices.length === 0" class="empty">
        <span class="empty-icon">🎵</span>
        <p>暂无声音，请先创建</p>
      </div>
      
      <div class="voice-grid">
        <div 
          v-for="voice in voices" 
          :key="voice.voice_id"
          class="voice-card"
        >
          <div class="voice-card-header">
            <span class="voice-icon"></span>
            <h3>{{ voice.voice_name }}</h3>
          </div>
          <div class="voice-card-body">
            <p class="voice-id">ID: {{ voice.voice_id }}</p>
            <p class="voice-duration">时长: {{ voice.duration }}秒</p>
            <div class="voice-preview">
              <audio 
                :src="getFullUrl(voice.voice_url)" 
                controls
              ></audio>
            </div>
            <p class="voice-text-preview" v-if="voice.voice_text">
              {{ voice.voice_text.substring(0, 80) }}{{ voice.voice_text.length > 80 ? '...' : '' }}
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { createVoice, getVoices } from '@/api/voice'

// 创建声音表单
const createForm = reactive({
  voice_name: '',
  voice_text: ''
})

const audioFile = ref(null)
const audioPreview = ref('')
const uploading = ref(false)
const createResult = ref(null)

// 声音列表
const voices = ref([])
const loadingVoices = ref(false)

// 获取完整的URL（用于音频播放）
const getFullUrl = (url) => {
  if (!url) return ''
  if (url.startsWith('http')) return url
  return `http://localhost:8000${url}`
}

// 处理文件选择
// 在 handleFileSelect 中添加时长检测
const handleFileSelect = (event) => {
  const file = event.target.files[0]
  if (!file) return
  
  // 创建临时音频元素来获取时长
  const audio = new Audio()
  const url = URL.createObjectURL(file)
  
  audio.addEventListener('loadedmetadata', () => {
    const duration = audio.duration
    console.log('音频时长:', duration, '秒')
    
    if (duration < 3) {
      alert('⚠️ 音频时长不足3秒，无法克隆')
    } else if (duration > 10) {
      alert('⚠️ 音频时长超过10秒，无法克隆')
      // 可以选择截断或只是警告
    } else {
      console.log('音频时长合适')
    }
    
    URL.revokeObjectURL(url)
  })
  
  audio.src = url
  
  // 预览
  audioPreview.value = url
}

// 移除音频
const removeAudio = () => {
  if (audioPreview.value) {
    URL.revokeObjectURL(audioPreview.value)
  }
  audioPreview.value = ''
  if (audioFile.value) {
    audioFile.value.value = ''
  }
}

// 重置表单
const resetForm = () => {
  createForm.voice_name = ''
  createForm.voice_text = ''
  removeAudio()
  createResult.value = null
}

// 创建声音
const handleCreateVoice = async () => {
  if (!audioFile.value.files[0]) {
    alert('请选择音频文件')
    return
  }

  uploading.value = true
  createResult.value = null

  const formData = new FormData()
  formData.append('voice_name', createForm.voice_name)
  formData.append('voice_text', createForm.voice_text)
  formData.append('audio', audioFile.value.files[0])

  try {
    const response = await createVoice(formData)
    
    console.log('上传成功响应:', response.data)
    
    if (response.data.code === 200) {
      createResult.value = response.data.data
      
      // 刷新声音列表
      await fetchVoices()
      
    } else {
      alert('创建失败：' + response.data.message)
    }
    
  } catch (error) {
    console.error('上传错误:', error)
    console.error('错误响应:', error.response?.data)
    
    if (error.response?.status === 401) {
      alert('认证失败，请重新登录')
    } else if (error.response?.status === 422) {
      alert('参数验证失败：' + JSON.stringify(error.response.data.detail))
    } else {
      alert('创建失败：' + (error.response?.data?.detail || error.message))
    }
  } finally {
    uploading.value = false
  }
}

// 获取所有声音
const fetchVoices = async () => {
  loadingVoices.value = true
  try {
    const response = await getVoices()
    console.log('获取到的声音列表:', response.data.data.voices)
    voices.value = response.data.data.voices || []
  } catch (error) {
    console.error('获取声音列表失败', error)
    if (error.response?.status === 401) {
      alert('认证失败，请重新登录')
    }
  } finally {
    loadingVoices.value = false
  }
}

// 组件挂载时加载声音列表
onMounted(() => {
  fetchVoices()
})
</script>



<style scoped>

@import '@/assets/styles/createVoice.css';
</style>