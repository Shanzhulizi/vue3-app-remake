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
/* =========================
   ChatGPT 风格声音创作页 - 淡雅高级
========================= */

.cosyvoice-container {
  max-width: 2000px;
  margin: 0 auto;
  padding: 32px 24px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif;
  background: #f9fafb;
  min-height: 100vh;
}

h1 {
  text-align: center;
  color: #1e293b;
  margin-bottom: 32px;
  font-size: 28px;
  font-weight: 500;
  letter-spacing: -0.3px;
}

h2 {
  color: #1e293b;
  margin-bottom: 24px;
  font-size: 20px;
  font-weight: 500;
  letter-spacing: -0.2px;
}

/* =========================
   创建声音区域 - 极简白色卡片
========================= */
.create-voice-section {
  background: #ffffff;
  border-radius: 28px;
  padding: 32px 36px;
  margin-bottom: 48px;
  border: 1px solid #eef2f6;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.02);
}

.create-voice-section h2 {
  color: #1e293b;
  margin-bottom: 28px;
  text-align: center;
  font-weight: 500;
}

.form {
  max-width: 560px;
  margin: 0 auto;
}

.form-group {
  margin-bottom: 24px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  font-size: 14px;
  color: #1e293b;
}

.form-group input,
.form-group textarea {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  font-size: 14px;
  background: #ffffff;
  transition: all 0.2s ease;
  font-family: inherit;
}

.form-group input:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #cbd5e1;
  box-shadow: 0 0 0 3px rgba(0, 0, 0, 0.02);
}

.form-group input::placeholder,
.form-group textarea::placeholder {
  color: #94a3b8;
}

.form-group small {
  display: block;
  margin-top: 6px;
  font-size: 12px;
  color: #64748b;
}

/* 文件上传区域 */
.file-upload-area {
  cursor: pointer;
}

.upload-placeholder {
  background: #f8fafc;
  border: 1px dashed #cbd5e1;
  border-radius: 20px;
  padding: 32px;
  text-align: center;
  transition: all 0.2s ease;
}

.upload-placeholder:hover {
  background: #f1f5f9;
  border-color: #94a3b8;
}

.upload-icon {
  font-size: 48px;
  display: block;
  margin-bottom: 12px;
  opacity: 0.6;
}

.upload-placeholder p {
  margin: 8px 0;
  color: #475569;
  font-size: 14px;
}

.upload-placeholder small {
  color: #94a3b8;
  font-size: 12px;
}

/* 音频预览区域 */
.audio-preview {
  position: relative;
  background: #f8fafc;
  border-radius: 20px;
  padding: 16px;
  border: 1px solid #e2e8f0;
}

.audio-preview audio {
  width: 100%;
  border-radius: 12px;
}

.remove-btn {
  position: absolute;
  top: 12px;
  right: 12px;
  background: #ffffff;
  color: #64748b;
  border: 1px solid #e2e8f0;
  border-radius: 50%;
  width: 28px;
  height: 28px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.remove-btn:hover {
  background: #fee2e2;
  border-color: #fecaca;
  color: #e5484d;
}

/* 提交按钮 - 深色精致 */
.submit-btn {
  width: 100%;
  padding: 14px;
  background: #1e293b;
  color: white;
  border: none;
  border-radius: 32px;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-top: 8px;
}

.submit-btn:hover:not(:disabled) {
  background: #334155;
  transform: translateY(-1px);
}

.submit-btn:disabled {
  background: #cbd5e1;
  cursor: not-allowed;
  transform: none;
}

/* 结果区域 */
.result {
  margin-top: 32px;
  padding: 24px;
  border-radius: 20px;
  background: #f8fafc;
  color: #1e293b;
  border: 1px solid #e2e8f0;
}

.result.success {
  border-left: 3px solid #22c55e;
}

.result-info {
  margin: 16px 0;
  padding: 12px 16px;
  background: #ffffff;
  border-radius: 16px;
  border: 1px solid #eef2f6;
}

.result-info p {
  margin: 8px 0;
  font-size: 14px;
  color: #475569;
}

.result-info p strong {
  color: #1e293b;
  font-weight: 500;
}

.result-audio {
  margin: 20px 0;
  text-align: center;
}

.result-audio audio {
  width: 100%;
  max-width: 400px;
  border-radius: 12px;
}

.create-another-btn {
  padding: 10px 24px;
  background: transparent;
  color: #475569;
  border: 1px solid #e2e8f0;
  border-radius: 32px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 450;
  transition: all 0.2s ease;
  width: auto;
  margin-top: 8px;
}

.create-another-btn:hover {
  background: #f1f5f9;
  border-color: #cbd5e1;
  color: #1e293b;
}

/* =========================
   声音列表区域
========================= */
.voice-list-section {
  width:1800px;
  margin: 0 auto;
  background: #ffffff;
  border-radius: 28px;
  padding: 32px 28px;
  border: 1px solid #eef2f6;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.02);
}

.voice-list-section h2 {
  color: #1e293b;
  text-align: center;
  margin-bottom: 32px;
  font-weight: 500;
}

.voice-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: 24px;
}

/* 声音卡片 - 极简风格 */
.voice-card {
  background: #ffffff;
  border-radius: 20px;
  overflow: hidden;
  transition: all 0.25s ease;
  border: 1px solid #eef2f6;
}

.voice-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.04);
  border-color: #e2e8f0;
}

.voice-card-header {
  background: #f8fafc;
  padding: 14px 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  border-bottom: 1px solid #eef2f6;
}

.voice-icon {
  font-size: 22px;
  color: #475569;
}

.voice-card-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 500;
  color: #1e293b;
  flex: 1;
}

.voice-card-body {
  padding: 16px;
}

.voice-card-body p {
  margin: 6px 0;
  font-size: 13px;
  color: #64748b;
}

.voice-id {
  font-family: monospace;
  background: #f1f5f9;
  padding: 2px 8px;
  border-radius: 20px;
  display: inline-block;
  font-size: 11px;
  color: #475569;
}

.voice-duration {
  color: #64748b;
}

.voice-preview {
  margin: 12px 0;
}

.voice-preview audio {
  width: 100%;
  border-radius: 12px;
}

.voice-text-preview {
  background: #f8fafc;
  padding: 12px;
  border-radius: 16px;
  font-size: 12px;
  line-height: 1.45;
  color: #475569;
  margin-top: 12px;
  border: 1px solid #eef2f6;
}

/* 加载和空状态 */
.loading {
  text-align: center;
  padding: 60px;
  color: #94a3b8;
}

.loading-spinner {
  display: inline-block;
  width: 28px;
  height: 28px;
  border: 2px solid #e2e8f0;
  border-top-color: #1e293b;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-right: 10px;
  vertical-align: middle;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.empty {
  text-align: center;
  padding: 60px;
  color: #94a3b8;
}

.empty-icon {
  font-size: 56px;
  display: block;
  margin-bottom: 16px;
  opacity: 0.5;
}

.empty p {
  font-size: 14px;
  margin: 0;
}

/* =========================
   响应式适配
========================= */
@media (max-width: 900px) {
  .voice-list-section {
    padding: 24px 20px;
  }
  
  .voice-grid {
    gap: 20px;
  }
}

@media (max-width: 768px) {
  .cosyvoice-container {
    padding: 20px 16px;
  }
  
  .create-voice-section {
    padding: 24px 20px;
  }
  
  .voice-grid {
    grid-template-columns: 1fr;
  }
  
  h1 {
    font-size: 24px;
  }
  
  h2 {
    font-size: 18px;
  }
}

@media (max-width: 480px) {
  .create-voice-section {
    padding: 20px 16px;
  }
  
  .upload-placeholder {
    padding: 24px;
  }
  
  .result-info {
    padding: 8px 12px;
  }
}
</style>