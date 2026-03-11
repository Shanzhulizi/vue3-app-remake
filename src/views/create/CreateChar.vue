<template>
  <div class="create-role">
    <h1>创建角色</h1>

    <!-- 角色头像 -->
    <section>
      <label>角色头像</label>
      <div class="avatar-upload">
        <div class="avatar-preview">
          <img v-if="avatarUrl" :src="avatarUrl" />
          <div v-else class="avatar-placeholder">+</div>
        </div>
        <input type="file" accept="image/*" @change="onAvatarChange" />
      </div>
    </section>

    <!-- 角色名称 -->
    <section>
      <label>角色名称</label>
      <input
        v-model="form.name"
        type="text"
        placeholder="例如：牢大"
        maxlength="20"
      />
    </section>

    <!-- 角色介绍 -->
    <section>
      <label>角色介绍</label>
      <textarea
        v-model="form.description"
        rows="3"
        placeholder="介绍你的角色的特点和性格"
      />
    </section>

    <!-- 背景世界观 -->
    <section>
      <label>背景世界观</label>
      <textarea
        v-model="form.worldview"
        rows="5"
        placeholder="角色所处的世界、经历、背景设定"
      />
    </section>

    <!-- 标签 -->
    <section>
      <label>标签</label>
      <div class="tags">
        <div
          v-for="tag in tags"
          :key="tag"
          class="tag"
          :class="{ active: form.tags.includes(tag) }"
          @click="toggleTag(tag)"
        >
          {{ tag }}
        </div>
      </div>
    </section>

    <!-- 语音选择 -->
    <section>
      <label>角色声音</label>
      <div class="voice-selector">
        <!-- 筛选标签 -->
        <div class="voice-filter">
          <button 
            v-for="filter in voiceFilters" 
            :key="filter.value"
            class="filter-btn"
            :class="{ active: currentFilter === filter.value }"
            @click="currentFilter = filter.value"
          >
            {{ filter.label }}
          </button>
        </div>

        <!-- 加载状态 -->
        <div v-if="loadingVoices" class="voice-loading">
          <div class="spinner-small"></div>
          <span>加载声音中...</span>
        </div>

        <!-- 声音列表 -->
        <div v-else class="voice-grid">
          <div
            v-for="voice in filteredVoices"
            :key="voice.code"
            class="voice-card"
            :class="{ 
              selected: form.voice === voice.code,
              playing: playingVoice === voice.code
            }"
            @click="selectVoice(voice)"
          >
            <div class="voice-header">
              <span class="voice-name">{{ voice.name }}</span>
              <span class="voice-gender" :class="voice.gender.toLowerCase()">
                {{ voice.gender === 'Female' ? '♀' : '♂' }}
              </span>
            </div>
            
            <div class="voice-actions">
              <button 
                class="preview-btn"
                @click.stop="playPreview(voice)"
                :disabled="previewLoading === voice.code"
              >
                <span v-if="previewLoading === voice.code" class="loading"></span>
                <span v-else>{{ playingVoice === voice.code ? '⏸️' : '▶️' }}</span>
              </button>
              
              <button 
                class="select-btn"
                :class="{ selected: form.voice === voice.code }"
                @click.stop="selectVoice(voice)"
              >
                {{ form.voice === voice.code ? '✓ 已选' : '选择' }}
              </button>
            </div>
          </div>
        </div>

        <!-- 试听播放器（隐藏） -->
        <audio ref="audioPlayer" @ended="onAudioEnded" @error="onAudioError" />
      </div>
    </section>

    <!-- 创建按钮 -->
    <button class="submit" @click="submit" :disabled="loading">
      {{ loading ? '创建中...' : '创建角色' }}
    </button>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { TAGS } from '@/config/tags'
import { useRouter } from 'vue-router'
import { createCharacter } from '@/api/character'
import { getChineseVoices, previewVoice } from '@/api/voice'

const tags = TAGS
const router = useRouter()

// 表单数据
const avatarUrl = ref(null)
const avatarFile = ref(null)
const loading = ref(false)

const form = ref({
  name: '',
  avatar: '',
  description: '',
  worldview: '',
  tags: [],
  voice: ''  // 存储声音代码
})

// 声音相关
const voices = ref([])
const loadingVoices = ref(false)
const previewLoading = ref('')
const playingVoice = ref('')
const currentFilter = ref('all')
const audioPlayer = ref(null)

// 声音筛选选项
const voiceFilters = [
  { value: 'all', label: '全部' },
  { value: 'Female', label: '女声' },
  { value: 'Male', label: '男声' }
]

// 筛选后的声音
const filteredVoices = computed(() => {
  if (currentFilter.value === 'all') return voices.value
  return voices.value.filter(v => v.gender === currentFilter.value)
})

// 获取声音列表
const fetchVoices = async () => {
  try {
    loadingVoices.value = true
    const res = await getChineseVoices()
    if (res.data.code === 200) {
      voices.value = res.data.data
    }
  } catch (err) {
    console.error('获取声音列表失败:', err)
  } finally {
    loadingVoices.value = false
  }
}

// 试听声音
const playPreview = async (voice) => {
  if (previewLoading.value) return
  
  // 如果正在播放同一个声音，暂停
  if (playingVoice.value === voice.code) {
    audioPlayer.value.pause()
    playingVoice.value = ''
    return
  }
  
  try {
    previewLoading.value = voice.code
    const res = await previewVoice(voice.code)
    
    if (res.data.code === 200) {
      const audioUrl = res.data.data.audio_url
      
      // 停止当前播放
      if (playingVoice.value) {
        audioPlayer.value.pause()
      }
      
      // 播放新音频
      audioPlayer.value.src = audioUrl
      await audioPlayer.value.play()
      playingVoice.value = voice.code
    }
  } catch (err) {
    console.error('试听失败:', err)
    alert('试听失败，请稍后重试')
  } finally {
    previewLoading.value = ''
  }
}

// 选择声音
const selectVoice = (voice) => {
  form.value.voice = voice.code
}

// 音频事件处理
const onAudioEnded = () => {
  playingVoice.value = ''
}

const onAudioError = () => {
  console.error('音频播放错误')
  playingVoice.value = ''
}

// 标签选择
const toggleTag = (tag) => {
  const idx = form.value.tags.indexOf(tag)
  if (idx > -1) {
    form.value.tags.splice(idx, 1)
  } else {
    form.value.tags.push(tag)
  }
}

// 头像上传
const onAvatarChange = (e) => {
  const file = e.target.files[0]
  if (!file) return

  avatarFile.value = file
  avatarUrl.value = URL.createObjectURL(file)
}

// 提交表单
const submit = async () => {
  if (!form.value.name.trim()) {
    alert('请输入角色名称')
    return
  }

  try {
    loading.value = true

    const fd = new FormData()
    fd.append("name", form.value.name)
    fd.append("description", form.value.description)
    fd.append("worldview", form.value.worldview)
    fd.append("tags", form.value.tags.join(","))
    
    // 添加声音选择
    if (form.value.voice) {
      fd.append("voice_code", form.value.voice)
    }

    if (avatarFile.value) {
      fd.append("avatar", avatarFile.value)
    }

    const res = await createCharacter(fd)
    const charId = res.data.id
    router.push(`/chat/${charId}`)
  } catch (err) {
    console.error(err)
    alert('创建失败')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchVoices()
})
</script>

<style scoped>
@import '@/assets/styles/create/createchar.css';

/* 声音选择器样式 */
.voice-selector {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 16px;
  background: #f9fafb;
}

.voice-filter {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
}

.filter-btn {
  padding: 6px 14px;
  border: 1px solid #e5e7eb;
  border-radius: 20px;
  background: white;
  color: #666;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.filter-btn:hover {
  border-color: #4096ff;
  color: #4096ff;
}

.filter-btn.active {
  background: #4096ff;
  border-color: #4096ff;
  color: white;
}

.voice-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 40px;
  color: #999;
}

.spinner-small {
  width: 20px;
  height: 20px;
  border: 2px solid #f3f3f3;
  border-top-color: #4096ff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.voice-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 12px;
  max-height: 400px;
  overflow-y: auto;
  padding: 4px;
}

.voice-card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.voice-card:hover {
  border-color: #4096ff;
  box-shadow: 0 2px 8px rgba(64, 150, 255, 0.1);
}

.voice-card.selected {
  border-color: #4096ff;
  background: #f0f9ff;
}

.voice-card.playing {
  border-color: #ff4d4f;
  background: #fff1f0;
}

.voice-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.voice-name {
  font-weight: 500;
  color: #333;
}

.voice-gender {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  color: white;
}

.voice-gender.female {
  background: #ff85b3;
}

.voice-gender.male {
  background: #4096ff;
}

.voice-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.preview-btn {
  width: 32px;
  height: 32px;
  border: 1px solid #e5e7eb;
  border-radius: 50%;
  background: white;
  color: #666;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.preview-btn:hover:not(:disabled) {
  background: #f5f5f5;
  border-color: #4096ff;
  color: #4096ff;
}

.preview-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.loading {
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 2px solid #f3f3f3;
  border-top-color: #4096ff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.select-btn {
  flex: 1;
  padding: 6px 12px;
  border: 1px solid #4096ff;
  border-radius: 20px;
  background: white;
  color: #4096ff;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.select-btn:hover {
  background: #f0f9ff;
}

.select-btn.selected {
  background: #4096ff;
  color: white;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>