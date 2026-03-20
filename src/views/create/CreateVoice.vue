<template>
  <div class="cosyvoice-container">
    <h1>🎵 声音创作</h1>
    
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
              <small>支持 WAV、MP3 格式，建议 3-10 秒</small>
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
          <span v-else>🎤 创建声音</span>
        </button>
      </form>

      <!-- 创建成功提示 -->
      <div v-if="createResult" class="result success">
        <h3>✅ 创建成功！</h3>
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
          🎨 创建另一个声音
        </button>
      </div>
    </div>

    <!-- 声音列表 -->
    <div class="voice-list-section">
      <h2>📚 已有声音库</h2>
      
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
            <span class="voice-icon">🎤</span>
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
const handleFileSelect = (event) => {
  const file = event.target.files[0]
  if (file) {
    audioPreview.value = URL.createObjectURL(file)
  }
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
.cosyvoice-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
}

h1 {
  text-align: center;
  color: #333;
  margin-bottom: 30px;
  font-size: 2rem;
}

h2 {
  color: #555;
  margin-bottom: 20px;
  font-size: 1.5rem;
}

/* 创建声音区域 */
.create-voice-section {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 20px;
  padding: 30px;
  margin-bottom: 40px;
  color: white;
  box-shadow: 0 10px 30px rgba(0,0,0,0.1);
}

.create-voice-section h2 {
  color: white;
  margin-bottom: 25px;
  text-align: center;
}

.form {
  max-width: 600px;
  margin: 0 auto;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: bold;
  font-size: 14px;
}

.form-group input,
.form-group textarea {
  width: 100%;
  padding: 12px;
  border: none;
  border-radius: 10px;
  font-size: 14px;
  background: rgba(255,255,255,0.95);
  transition: all 0.3s;
}

.form-group input:focus,
.form-group textarea:focus {
  outline: none;
  box-shadow: 0 0 0 3px rgba(255,255,255,0.3);
  background: white;
}

.form-group small {
  display: block;
  margin-top: 5px;
  font-size: 12px;
  opacity: 0.8;
}

/* 文件上传区域 */
.file-upload-area {
  cursor: pointer;
}

.upload-placeholder {
  background: rgba(255,255,255,0.95);
  border-radius: 10px;
  padding: 30px;
  text-align: center;
  transition: all 0.3s;
}

.upload-placeholder:hover {
  background: white;
  transform: translateY(-2px);
}

.upload-icon {
  font-size: 48px;
  display: block;
  margin-bottom: 10px;
}

.upload-placeholder p {
  margin: 10px 0;
  color: #666;
}

.audio-preview {
  position: relative;
  background: rgba(255,255,255,0.95);
  border-radius: 10px;
  padding: 15px;
}

.audio-preview audio {
  width: 100%;
  border-radius: 5px;
}

.remove-btn {
  position: absolute;
  top: 10px;
  right: 10px;
  background: #ff4444;
  color: white;
  border: none;
  border-radius: 50%;
  width: 30px;
  height: 30px;
  cursor: pointer;
  font-size: 16px;
  transition: all 0.3s;
}

.remove-btn:hover {
  background: #cc0000;
  transform: scale(1.05);
}

/* 提交按钮 */
.submit-btn {
  width: 100%;
  padding: 14px;
  background: #ff6b6b;
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s;
  margin-top: 20px;
}

.submit-btn:hover {
  background: #ff5252;
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(0,0,0,0.2);
}

.submit-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
  transform: none;
}

/* 结果区域 */
.result {
  margin-top: 30px;
  padding: 20px;
  border-radius: 15px;
  background: rgba(255,255,255,0.95);
  color: #333;
}

.result.success {
  border-left: 4px solid #4caf50;
}

.result-info {
  margin: 15px 0;
  padding: 10px;
  background: #f5f5f5;
  border-radius: 8px;
}

.result-info p {
  margin: 8px 0;
}

.result-audio {
  margin: 20px 0;
  text-align: center;
}

.result-audio audio {
  width: 100%;
  max-width: 400px;
}

.create-another-btn {
  padding: 10px 20px;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s;
  width: auto;
  margin-top: 15px;
}

.create-another-btn:hover {
  background: #5a67d8;
  transform: translateY(-2px);
}

/* 声音列表区域 */
.voice-list-section {
  width:1300px;
  margin:auto;
  background: white;
  border-radius: 20px;
  padding: 30px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.05);
}

.voice-list-section h2 {
  color: #333;
  text-align: center;
  margin-bottom: 30px;
}

.voice-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 20px;
}

.voice-card {
  background: #f9f9f9;
  border-radius: 15px;
  overflow: hidden;
  transition: all 0.3s;
  border: 1px solid #eee;
}

.voice-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 25px rgba(0,0,0,0.1);
  border-color: #667eea;
}

.voice-card-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 15px;
  color: white;
  display: flex;
  align-items: center;
  gap: 10px;
}

.voice-icon {
  font-size: 24px;
}

.voice-card-header h3 {
  margin: 0;
  font-size: 18px;
  flex: 1;
}

.voice-card-body {
  padding: 15px;
}

.voice-card-body p {
  margin: 8px 0;
  font-size: 14px;
  color: #666;
}

.voice-id {
  font-family: monospace;
  background: #eee;
  padding: 2px 6px;
  border-radius: 4px;
  display: inline-block;
  font-size: 12px;
}

.voice-preview {
  margin: 12px 0;
}

.voice-preview audio {
  width: 100%;
  border-radius: 8px;
}

.voice-text-preview {
  background: #f0f0f0;
  padding: 10px;
  border-radius: 8px;
  font-size: 13px;
  line-height: 1.4;
  color: #555;
  margin-top: 10px;
}

/* 加载和空状态 */
.loading {
  text-align: center;
  padding: 40px;
  color: #999;
}

.loading-spinner {
  display: inline-block;
  width: 30px;
  height: 30px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-right: 10px;
  vertical-align: middle;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.empty {
  text-align: center;
  padding: 60px;
  color: #999;
}

.empty-icon {
  font-size: 64px;
  display: block;
  margin-bottom: 20px;
  opacity: 0.5;
}

.empty p {
  font-size: 16px;
}

/* 响应式 */
@media (max-width: 768px) {
  .cosyvoice-container {
    padding: 15px;
  }
  
  .voice-grid {
    grid-template-columns: 1fr;
  }
  
  .create-voice-section {
    padding: 20px;
  }
}
</style>