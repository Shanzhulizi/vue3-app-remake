<!-- components/VoiceClone.vue -->
<template>
  <div class="voice-clone">
    <h3>声音克隆</h3>
    
    <!-- 上传声音样本 -->
    <div class="upload-section">
      <label>上传你的声音样本（3-10秒）</label>
      <input 
        type="file" 
        accept="audio/*" 
        @change="onAudioUpload"
        ref="audioInput"
      />
      
      <div v-if="audioFile" class="audio-preview">
        <audio :src="audioPreviewUrl" controls />
        <button @click="clearAudio" class="clear-btn">×</button>
      </div>
    </div>
    
    <!-- 要生成的文本 -->
    <div class="text-section">
      <label>输入文本</label>
      <textarea 
        v-model="text" 
        rows="3"
        placeholder="输入要生成的文本..."
      />
    </div>
    
    <!-- 语言选择 -->
    <div class="language-section">
      <label>语言</label>
      <select v-model="language">
        <option value="zh">中文</option>
        <option value="en">英文</option>
        <option value="ja">日文</option>
        <option value="ko">韩文</option>
      </select>
    </div>
    
    <!-- 生成按钮 -->
    <button 
      @click="generateClone" 
      :disabled="!audioFile || !text || loading"
      class="generate-btn"
    >
      {{ loading ? '生成中...' : '生成克隆语音' }}
    </button>
    
    <!-- 生成的音频 -->
    <div v-if="generatedAudio" class="result-section">
      <h4>生成结果</h4>
      <audio :src="generatedAudio" controls />
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { cloneVoice } from '@/api/xtts'

const audioFile = ref(null)
const audioPreviewUrl = ref('')
const text = ref('')
const language = ref('zh')
const loading = ref(false)
const generatedAudio = ref('')

const onAudioUpload = (e) => {
  const file = e.target.files[0]
  if (!file) return
  
  audioFile.value = file
  audioPreviewUrl.value = URL.createObjectURL(file)
}

const clearAudio = () => {
  audioFile.value = null
  audioPreviewUrl.value = ''
}

const generateClone = async () => {
  try {
    loading.value = true
    
    const formData = new FormData()
    formData.append('audio', audioFile.value)
    formData.append('text', text.value)
    formData.append('language', language.value)
    
    const res = await cloneVoice(formData)
    
    if (res.data.code === 200) {
      generatedAudio.value = res.data.data.audio_url
    }
  } catch (err) {
    console.error('克隆失败:', err)
    alert('克隆失败')
  } finally {
    loading.value = false
  }
}
</script>