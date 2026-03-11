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

    <!-- 语音选择 - 按钮 -->
    <section>
      <label>角色声音</label>
      <div class="voice-select-button">
        <button type="button" @click="showVoiceModal = true" class="select-voice-btn">
          {{ selectedVoiceName || '点击选择声音' }}
        </button>
      </div>
    </section>

    <!-- 创建按钮 -->
    <button class="submit" @click="submit" :disabled="loading">
      {{ loading ? '创建中...' : '创建角色' }}
    </button>

    <!-- 语音选择弹窗 -->
    <div v-if="showVoiceModal" class="modal-overlay" @click.self="showVoiceModal = false">
      <div class="modal-content">
        <div class="modal-header">
          <h3>选择声音</h3>
          <button class="close-btn" @click="showVoiceModal = false">×</button>
        </div>
        
        <div class="modal-body">
          <div v-if="loadingVoices" class="loading-text">加载中...</div>
          
          <div v-else class="voice-list">
            <div
              v-for="voice in voices"
              :key="voice.voice_id"
              class="voice-item"
              :class="{ selected: form.voice === voice.voice_id }"
              @click="selectVoice(voice)"
            >
              {{ voice.voice_name }}
            </div>
          </div>
        </div>
        
        <div class="modal-footer">
          <button class="cancel-btn" @click="showVoiceModal = false">取消</button>
          <button class="confirm-btn" @click="confirmVoice">确认</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { TAGS } from '@/config/tags'
import { useRouter } from 'vue-router'
import { createCharacter } from '@/api/character'
import { getGreatVoices } from '@/api/voice'

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
  voice: ''
})

// 声音相关
const voices = ref([])
const loadingVoices = ref(false)
const showVoiceModal = ref(false)
const selectedVoiceName = ref('')
const tempSelectedVoice = ref(null)

// 获取声音列表
const fetchVoices = async () => {
  try {
    loadingVoices.value = true
    const res = await getGreatVoices({ skip: 0, limit: 50 })
    if (res.data.code === 200) {
      voices.value = res.data.data.voices
    }
  } catch (err) {
    console.error('获取声音列表失败:', err)
  } finally {
    loadingVoices.value = false
  }
}

// 选择声音（临时）
const selectVoice = (voice) => {
  tempSelectedVoice.value = voice
}

// 确认选择
const confirmVoice = () => {
  if (tempSelectedVoice.value) {
    form.value.voice = tempSelectedVoice.value.voice_id
    selectedVoiceName.value = tempSelectedVoice.value.voice_name
    showVoiceModal.value = false
    tempSelectedVoice.value = null
  } else {
    alert('请选择一个声音')
  }
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
    
    if (form.value.voice) {
      fd.append("voice_id", form.value.voice)
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

/* 选择按钮样式 */
.select-voice-btn {
  width: 100%;
  padding: 10px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: white;
  color: #333;
  cursor: pointer;
  text-align: left;
}

.select-voice-btn:hover {
  border-color: #4096ff;
}

/* 弹窗样式 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 12px;
  width: 400px;
  max-width: 90%;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
}

.modal-header {
  padding: 16px 20px;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h3 {
  margin: 0;
  font-size: 18px;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #999;
}

.modal-body {
  padding: 20px;
  overflow-y: auto;
  flex: 1;
}

.voice-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.voice-item {
  padding: 10px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  cursor: pointer;
}

.voice-item:hover {
  border-color: #4096ff;
}

.voice-item.selected {
  background: #f0f9ff;
  border-color: #4096ff;
}

.loading-text {
  text-align: center;
  color: #999;
  padding: 20px;
}

.modal-footer {
  padding: 16px 20px;
  border-top: 1px solid #e5e7eb;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.cancel-btn, .confirm-btn {
  padding: 8px 20px;
  border-radius: 6px;
  cursor: pointer;
}

.cancel-btn {
  border: 1px solid #e5e7eb;
  background: white;
}

.confirm-btn {
  border: none;
  background: #4096ff;
  color: white;
}

.confirm-btn:hover {
  background: #1677ff;
}
</style>