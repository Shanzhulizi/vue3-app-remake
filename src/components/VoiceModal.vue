<!-- components/VoiceModal.vue -->
<template>
  <Teleport to="body">
    <div v-if="show" class="modal-overlay" @click.self="handleClose">
      <div class="modal-content">
        <!-- 头部 -->
        <div class="modal-header">
          <h3>🎤 选择声音</h3>
          <button class="close-btn" @click="handleClose">×</button>
        </div>
        
        <!-- 搜索框 -->
        <div class="search-box">
          <input 
            type="text" 
            v-model="searchKeyword" 
            placeholder="搜索声音名称..."
            class="search-input"
          />
        </div>
        
        <!-- 声音列表 -->
        <div class="modal-body">
          <div v-if="loading" class="loading-state">
            <div class="spinner"></div>
            <p>加载声音中...</p>
          </div>
          
          <div v-else-if="filteredVoices.length === 0" class="empty-state">
            <span class="empty-icon">🎵</span>
            <p>暂无声音数据</p>
          </div>
          
          <div v-else class="voice-list">
            <div
              v-for="voice in filteredVoices"
              :key="voice.voice_id"
              class="voice-item"
              :class="{ selected: selectedId === voice.voice_id }"
              @click="selectVoice(voice)"
            >
              <div class="voice-info">
                <div class="voice-name-wrapper">
                  <span class="voice-name">{{ voice.voice_name }}</span>
                  <span class="voice-badge" v-if="voice.duration">⏱️ {{ formatDuration(voice.duration) }}</span>
                </div>
                <!-- <p class="voice-text">{{ voice.voice_text || '暂无描述' }}</p> -->
              </div>
              
              <div class="voice-actions">
                <button 
                  class="play-btn" 
                  @click.stop="playVoice(voice)"
                  :title="'播放 ' + voice.voice_name"
                >
                  <span v-if="playingId === voice.voice_id">⏸️</span>
                  <span v-else>▶</span>
                </button>
                <div class="selected-check" v-if="selectedId === voice.voice_id">✓</div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- 底部 -->
        <div class="modal-footer">
          <div class="selected-info" v-if="selectedVoice">
            已选择: <strong>{{ selectedVoice.voice_name }}</strong>
          </div>
          <div class="footer-actions">
            <button class="cancel-btn" @click="handleClose">取消</button>
            <button 
              class="confirm-btn" 
              @click="handleConfirm"
              :disabled="!selectedId"
            >
              确认选择
            </button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

const props = defineProps({
  show: {
    type: Boolean,
    default: false
  },
  voices: {
    type: Array,
    default: () => []
  },
  loading: {
    type: Boolean,
    default: false
  },
  selectedId: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['select', 'close', 'play'])

// 搜索关键词
const searchKeyword = ref('')
// 当前播放的ID
const playingId = ref(null)

// 过滤后的声音列表
const filteredVoices = computed(() => {
  if (!searchKeyword.value) return props.voices
  return props.voices.filter(voice => 
    voice.voice_name.toLowerCase().includes(searchKeyword.value.toLowerCase())
  )
})

// 当前选中的声音对象
const selectedVoice = computed(() => {
  return props.voices.find(v => v.voice_id === props.selectedId)
})

// 选择声音
const selectVoice = (voice) => {
  emit('select', voice)  
}

// 确认选择
const handleConfirm = () => {
  if (props.selectedId) {
    emit('close')
  }
}

// 关闭
const handleClose = () => {
  searchKeyword.value = ''
  emit('close')
}

// 播放声音
const playVoice = (voice) => {
  if (playingId.value === voice.voice_id) {
    // 如果正在播放，停止
    playingId.value = null
    // 这里应该实际停止音频
  } else {
    playingId.value = voice.voice_id
    emit('play', voice)
    // 播放完成后清除状态
    setTimeout(() => {
      playingId.value = null
    }, voice.duration * 1000 || 3000)
  }
}

// 格式化时长
const formatDuration = (seconds) => {
  if (!seconds) return ''
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

// 监听显示状态，重置搜索
watch(() => props.show, (newVal) => {
  if (!newVal) {
    searchKeyword.value = ''
    playingId.value = null
  }
})
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.modal-content {
  background: white;
  border-radius: 20px;
  width: 600px;
  max-width: 90vw;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
  animation: slideUp 0.3s ease;
}

@keyframes slideUp {
  from {
    transform: translateY(30px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.modal-header {
  padding: 20px 24px;
  border-bottom: 1px solid #eef2f6;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h3 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: #1a1a1a;
}

.close-btn {
  background: none;
  border: none;
  font-size: 28px;
  cursor: pointer;
  color: #999;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.2s;
}

.close-btn:hover {
  background: #f5f5f5;
  color: #666;
}

.search-box {
  padding: 16px 24px;
  border-bottom: 1px solid #eef2f6;
}

.search-input {
  width: 100%;
  padding: 12px 16px;
  border: 2px solid #eef2f6;
  border-radius: 30px;
  font-size: 14px;
  transition: all 0.2s;
  outline: none;
}

.search-input:focus {
  border-color: #4096ff;
  box-shadow: 0 0 0 3px rgba(64, 150, 255, 0.1);
}

.modal-body {
  padding: 20px 24px;
  overflow-y: auto;
  flex: 1;
  min-height: 300px;
}

.voice-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.voice-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border: 2px solid #eef2f6;
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.2s;
  background: white;
}

.voice-item:hover {
  border-color: #4096ff;
  transform: translateY(-2px);
  box-shadow: 0 8px 16px rgba(64, 150, 255, 0.1);
}

.voice-item.selected {
  border-color: #4096ff;
  background: #f0f9ff;
}

.voice-info {
  flex: 1;
  margin-right: 16px;
}

.voice-name-wrapper {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 6px;
}

.voice-name {
  font-weight: 600;
  font-size: 16px;
  color: #1a1a1a;
}

.voice-badge {
  font-size: 12px;
  color: #666;
  background: #f5f5f5;
  padding: 2px 8px;
  border-radius: 20px;
}

.voice-text {
  margin: 0;
  font-size: 13px;
  color: #666;
  line-height: 1.5;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.voice-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.play-btn {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: none;
  background: #f5f5f5;
  color: #4096ff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  transition: all 0.2s;
}

.play-btn:hover {
  background: #4096ff;
  color: white;
  transform: scale(1.1);
}

.selected-check {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #4096ff;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: bold;
}

.loading-state {
  text-align: center;
  padding: 60px 20px;
  color: #666;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #f0f0f0;
  border-top-color: #4096ff;
  border-radius: 50%;
  margin: 0 auto 16px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #999;
}

.empty-icon {
  font-size: 48px;
  display: block;
  margin-bottom: 16px;
  opacity: 0.5;
}

.modal-footer {
  padding: 20px 24px;
  border-top: 1px solid #eef2f6;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.selected-info {
  font-size: 14px;
  color: #666;
}

.selected-info strong {
  color: #4096ff;
}

.footer-actions {
  display: flex;
  gap: 12px;
}

.cancel-btn, .confirm-btn {
  padding: 10px 24px;
  border-radius: 30px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.cancel-btn {
  border: 2px solid #eef2f6;
  background: white;
  color: #666;
}

.cancel-btn:hover {
  border-color: #999;
  background: #f5f5f5;
}

.confirm-btn {
  border: none;
  background: #4096ff;
  color: white;
}

.confirm-btn:hover:not(:disabled) {
  background: #1677ff;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(64, 150, 255, 0.3);
}

.confirm-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}
</style>