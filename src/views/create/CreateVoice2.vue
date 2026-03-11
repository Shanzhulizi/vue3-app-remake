<template>
  <div class="cosyvoice-container">
    <h1>🎵 CosyVoice 音频创作测试</h1>
    
    <!-- 两个标签页：创建声音 / 生成音频 -->
    <div class="tabs">
      <button 
        class="tab-btn" 
        :class="{ active: activeTab === 'create' }"
        @click="activeTab = 'create'"
      >
        📤 创建声音
      </button>
      <button 
        class="tab-btn" 
        :class="{ active: activeTab === 'generate' }"
        @click="activeTab = 'generate'"
      >
        🎤 生成音频
      </button>
    </div>

    <!-- 创建声音表单 -->
    <div v-if="activeTab === 'create'" class="tab-content">
      <h2>上传参考音频，创建新声音</h2>
      
      <form @submit.prevent="handleCreateVoice" class="form">
        <div class="form-group">
          <label>声音名称</label>
          <input 
            type="text" 
            v-model="createForm.voice_name" 
            placeholder="例如：哈基米声音"
            required
          >
        </div>

        <div class="form-group">
          <label>参考音频文本</label>
          <textarea 
            v-model="createForm.voice_text" 
            placeholder="输入音频中的说话内容..."
            rows="4"
            required
          ></textarea>
          <small>必须和音频内容完全一致，这很重要！</small>
        </div>

        <div class="form-group">
          <label>参考音频文件</label>
          <input 
            type="file" 
            ref="audioFile"
            @change="handleFileSelect"
            accept=".wav,.mp3,.m4a"
            required
          >
          <small>支持 WAV、MP3 格式，建议 3-15 秒</small>
        </div>

        <div v-if="audioPreview" class="audio-preview">
          <audio :src="audioPreview" controls></audio>
        </div>

        <button 
          type="submit" 
          class="submit-btn"
          :disabled="uploading"
        >
          {{ uploading ? '上传中...' : '创建声音' }}
        </button>
      </form>

      <!-- 创建成功提示 -->
      <div v-if="createResult" class="result success">
        <h3>✅ 创建成功！</h3>
        <p>声音ID: {{ createResult.voice_id }}</p>
        <p>音频时长: {{ createResult.duration }}秒</p>
        <p>文件路径: {{ createResult.voice_wav_url }}</p>
        <!-- 添加音频预览 -->
        <audio 
          v-if="createResult.voice_wav_url" 
          :src="getFullUrl(createResult.voice_wav_url)" 
          controls
        ></audio>
      </div>
    </div>

    <!-- 生成音频表单 -->
    <div v-else class="tab-content">
      <h2>用已有声音生成新音频</h2>
      
      <!-- 声音列表 -->
      <div class="voice-list">
        <h3>选择声音</h3>
        <div v-if="loadingVoices" class="loading">加载中...</div>
        
        <div v-else-if="voices.length === 0" class="empty">
          暂无声音，请先创建
        </div>
        
        <div 
          v-for="voice in voices" 
          :key="voice.voice_id"
          class="voice-item"
          :class="{ selected: selectedVoiceId === voice.voice_id }"
          @click="selectedVoiceId = voice.voice_id"
        >
          <strong>{{ voice.voice_name }}</strong>
          <small>ID: {{ voice.voice_id }}</small>
          <small>时长: {{ voice.duration }}秒</small>
          <!-- 添加音频预览 -->
          <div v-if="voice.voice_url" class="audio-preview-small" @click.stop>
            <audio 
              :src="getFullUrl(voice.voice_url)" 
              controls
            ></audio>
          </div>
        </div>
      </div>

      <!-- 生成表单 -->
      <form @submit.prevent="handleGenerateAudio" class="form">
        <div class="form-group">
          <label>目标文本</label>
          <textarea 
            v-model="generateText" 
            placeholder="输入要生成的文本..."
            rows="3"
            required
          ></textarea>
        </div>

        <button 
          type="submit" 
          class="submit-btn"
          :disabled="generating || !selectedVoiceId"
        >
          {{ generating ? '生成中...' : '生成音频' }}
        </button>
      </form>

      <!-- 生成结果 -->
      <div v-if="generateResult" class="result success">
        <h3>✅ 生成成功！</h3>
        <audio 
          :src="getFullUrl(generateResult.audio_url)" 
          controls
        ></audio>
        <p>
          <a :href="getFullUrl(generateResult.audio_url)" download>下载音频</a>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { createVoice, getVoices, generateAudio } from '@/api/cosyvoice'  // 导入API函数

// 标签页状态
const activeTab = ref('create')

// 创建声音表单
const createForm = reactive({
  voice_name: '',
  voice_text: ''
})

const audioFile = ref(null)
const audioPreview = ref('')
const uploading = ref(false)
const createResult = ref(null)

// 生成音频相关
const voices = ref([])
const loadingVoices = ref(false)
const selectedVoiceId = ref('')
const generateText = ref('')
const generating = ref(false)
const generateResult = ref(null)

// 获取完整的URL（用于音频播放）
const getFullUrl = (url) => {
  if (!url) return ''
  if (url.startsWith('http')) return url
  return `http://localhost:8000${url}`
}

// 处理文件选择
const handleFileSelect = (event) => {
  const file = event.target.files[0]
  if (file) {
    audioPreview.value = URL.createObjectURL(file)
  }
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
    // 使用抽离出来的 API 函数
    const response = await createVoice(formData)
    
    console.log('上传成功响应:', response.data)
    
    // 处理后端返回的数据
    if (response.data.code === 200) {
      createResult.value = response.data.data
      
      // 清空表单
      createForm.voice_name = ''
      createForm.voice_text = ''
      audioFile.value.value = ''
      audioPreview.value = ''
      
      // 刷新声音列表
      await fetchVoices()
      
      // 自动切换到生成标签页
      setTimeout(() => {
        activeTab.value = 'generate'
      }, 2000)
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
    // 使用抽离出来的 API 函数
    const response = await getVoices()
    console.log('获取到的声音列表:', response.data.data.voices)
    voices.value = response.data.data.voices
  } catch (error) {
    console.error('获取声音列表失败', error)
    if (error.response?.status === 401) {
      alert('认证失败，请重新登录')
    }
  } finally {
    loadingVoices.value = false
  }
}

// 生成音频
const handleGenerateAudio = async () => {
  if (!selectedVoiceId.value) {
    alert('请先选择一个声音')
    return
  }

  generating.value = true
  generateResult.value = null

  try {
    // 使用抽离出来的 API 函数
    const response = await generateAudio({
      voice_id: selectedVoiceId.value,
      text: generateText.value
    })
    
    console.log('生成成功响应:', response.data)
    generateResult.value = response.data
    generateText.value = ''
    
  } catch (error) {
    console.error('生成错误:', error)
    if (error.response?.status === 401) {
      alert('认证失败，请重新登录')
    } else {
      alert('生成失败：' + (error.response?.data?.detail || error.message))
    }
  } finally {
    generating.value = false
  }
}

// 组件挂载时加载声音列表
onMounted(() => {
  fetchVoices()
})
</script>

<style scoped>
/* 样式保持不变 */
.cosyvoice-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

h1 {
  text-align: center;
  color: #333;
  margin-bottom: 30px;
}

.tabs {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
  border-bottom: 2px solid #eee;
  padding-bottom: 10px;
}

.tab-btn {
  padding: 10px 20px;
  border: none;
  background: none;
  cursor: pointer;
  font-size: 16px;
  border-radius: 5px;
  transition: all 0.3s;
}

.tab-btn:hover {
  background: #f0f0f0;
}

.tab-btn.active {
  background: #667eea;
  color: white;
}

.tab-content {
  background: white;
  border-radius: 10px;
  padding: 30px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

.form {
  margin-top: 20px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
  color: #555;
}

.form-group input,
.form-group textarea {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 5px;
  font-size: 14px;
}

.form-group input:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #667eea;
}

.form-group small {
  display: block;
  margin-top: 5px;
  color: #999;
  font-size: 12px;
}

.audio-preview {
  margin: 20px 0;
}

.audio-preview audio {
  width: 100%;
}

.submit-btn {
  width: 100%;
  padding: 12px;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 5px;
  font-size: 16px;
  cursor: pointer;
  transition: background 0.3s;
}

.submit-btn:hover {
  background: #5a67d8;
}

.submit-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.result {
  margin-top: 20px;
  padding: 20px;
  border-radius: 5px;
}

.result.success {
  background: #f0f9f0;
  border: 1px solid #4caf50;
}

.voice-list {
  margin-bottom: 30px;
}

.voice-item {
  padding: 15px;
  border: 1px solid #ddd;
  border-radius: 5px;
  margin-bottom: 10px;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.voice-item:hover {
  background: #f5f5f5;
}

.voice-item.selected {
  background: #667eea;
  color: white;
  border-color: #667eea;
}

.voice-item.selected small {
  color: rgba(255,255,255,0.8);
}

.audio-preview-small {
  margin-top: 10px;
}

.audio-preview-small audio {
  width: 100%;
  height: 30px;
}

.loading, .empty {
  text-align: center;
  padding: 20px;
  color: #999;
}
</style>