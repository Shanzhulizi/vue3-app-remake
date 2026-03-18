<template>
  <div class="create-role">
    <h1>{{ isEdit ? '编辑角色' : '创建角色' }}</h1>

    <div class ="main-content">
  

<!-- 角色头像 -->
    <section>
      <label>角色头像</label>
      <div class="avatar-upload">
        <div class="avatar-preview" @click="triggerFileInput">
          <img v-if="avatarUrl" :src="avatarUrl" />
          <div v-else class="avatar-placeholder">+</div>
        </div>
        <input type="file" ref="fileInput" accept="image/*" @change="onAvatarChange" style="display: none" />
        <div class="avatar-tip">点击上传头像 (建议 200x200)</div>
      </div>
    </section>

    <!-- 角色名称 -->
    <section>
      <label>角色名称 <span class="required">*</span></label>
      <input v-model="form.name" type="text" placeholder="例如：哈基米" maxlength="50" />
    </section>

    <!-- 角色介绍 -->
    <section>
      <label>角色介绍</label>
      <textarea v-model="form.description" rows="3" placeholder="介绍你的角色的特点和性格（最多500字）" maxlength="500" />
    </section>

    <!-- 背景世界观 -->
    <section>
      <label>背景世界观</label>
      <textarea v-model="form.worldview" rows="5" placeholder="角色所处的世界、经历、背景设定（最多500字）" maxlength="500" />
    </section>

    <!-- 开场白 -->
    <section>
      <label>开场白</label>
      <input v-model="form.greeting" type="text" placeholder="角色第一次见面会说什么（最多200字）" maxlength="200" />
    </section>

    <!-- 类别选择（多选） -->
    <section>
      <label>角色类别 <span class="tip">（可多选）</span></label>
      <div class="categories">
        <div v-for="category in categories" :key="category.id" class="category-item"
          :class="{ active: form.category_ids.includes(category.id) }" @click="toggleCategory(category.id)">
          {{ category.name }}
        </div>
        <div v-if="categories.length === 0" class="loading-text">加载类别中...</div>
      </div>
    </section>

    <!-- 标签选择（多选） -->
    <section>
      <label>角色标签 <span class="tip">（可多选）</span></label>
      <div class="tags">
        <div v-for="tag in tags" :key="tag.id" class="tag-item" :class="{ active: form.tag_ids.includes(tag.id) }"
          @click="toggleTag(tag.id)">
          {{ tag.name }}
        </div>
        <div v-if="tags.length === 0" class="loading-text">加载标签中...</div>
      </div>
    </section>

    <!-- 语音选择 -->
    <section>
      <label>角色声音 <span class="required">*</span></label>
      <div class="voice-select-button">
        <button type="button" @click="showVoiceModal = true" class="select-voice-btn">
          {{ selectedVoiceName || '点击选择声音' }}
        </button>
      </div>
    </section>

    <!-- 提交按钮 -->
    <div class="form-actions">
      <button class="cancel-btn" @click="goBack">取消</button>
      <button class="submit" @click="submit" :disabled="loading">
        {{ loading ? '提交中...' : (isEdit ? '保存修改' : '创建角色') }}
      </button>
    </div>

    </div>

    <!-- 语音选择弹窗 -->
    <VoiceModal :show="showVoiceModal" :voices="voices" :loading="loadingVoices" :selected-id="form.voice_id"
      @select="selectVoice" @close="showVoiceModal = false" @play="playVoice" />


  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'

import {
  createCharacter,
  updateCharacter,
  getCharacterDetail,

} from '@/api/character'
import { getCategories } from '@/api/category'
import { getTags } from '@/api/tag'
import { getVoices } from '@/api/voice'
import VoiceModal from '@/components/VoiceModal.vue'

const router = useRouter()
const route = useRoute()
const characterId = computed(() => route.params.id)
const isEdit = computed(() => !!characterId.value)

// 表单数据
const form = reactive({
  name: '',
  description: '',
  worldview: '',
  greeting: '',
  avatar: '',
  voice_id: '',
  category_ids: [],
  tag_ids: []
})

const avatarUrl = ref(null)
const avatarFile = ref(null)
const fileInput = ref(null)
const loading = ref(false)

// 类别和标签数据
const categories = ref([])
const tags = ref([])

// 声音相关
const voices = ref([])
const loadingVoices = ref(false)
const showVoiceModal = ref(false)
const selectedVoiceName = ref('')

// 获取初始化数据
onMounted(async () => {
  await Promise.all([
    fetchCategories(),
    fetchTags(),
    fetchVoices()
  ])

  if (isEdit.value) {
    fetchCharacterDetail()
  }
})

// 获取类别
const fetchCategories = async () => {
  try {
    const res = await getCategories()
    if (res.data.code === 200) {
      categories.value = res.data.data
    }
  } catch (err) {
    console.error('获取类别失败:', err)
    alert('获取类别列表失败')
  }
}

// 获取标签
const fetchTags = async () => {
  try {
    const res = await getTags()
    if (res.data.code === 200) {
      tags.value = res.data.data
    }
  } catch (err) {
    console.error('获取标签失败:', err)
    alert('获取标签列表失败')
  }
}


const selectVoice = (voice) => {
  form.voice_id = voice.voice_id
  selectedVoiceName.value = voice.voice_name
}
// 获取声音列表
// 获取声音列表
const fetchVoices = async () => {
  try {
    loadingVoices.value = true
    const res = await getVoices({ skip: 0, limit: 50 })
    console.log('声音响应:', res.data)  // 先看看结构

    if (res.data.code === 200) {
      // 根据你之前贴出的响应，数据在 res.data.data.voices 里
      voices.value = res.data.data.voices || []
      console.log('声音数据:', voices.value)
    }
  } catch (err) {
    console.error('获取声音列表失败:', err)
    alert('获取声音列表失败')
  } finally {
    loadingVoices.value = false
  }
}

// 获取角色详情（编辑时）
const fetchCharacterDetail = async () => {
  try {
    const res = await getCharacterDetail(characterId.value)
    const data = res.data.data

    form.name = data.name
    form.description = data.description || ''
    form.worldview = data.worldview || ''
    form.greeting = data.greeting || ''
    form.avatar = data.avatar || ''
    form.voice_id = data.voice_id || ''

    // 处理类别和标签ID
    form.category_ids = data.categories?.map(c => c.id) || []
    form.tag_ids = data.tags?.map(t => t.id) || []

    // 显示头像
    if (data.avatar) {
      avatarUrl.value = data.avatar
    }

    // 显示声音名称 - 这里也需要改
    if (data.voice_id && voices.value.length > 0) {
      const voice = voices.value.find(v => v.voice_id === data.voice_id)  // 用 voice_id
      if (voice) selectedVoiceName.value = voice.voice_name  // 用 voice_name
    }

  } catch (err) {
    console.error('获取角色详情失败:', err)
    alert('获取角色详情失败')
    router.back()
  }
}

// 切换类别
const toggleCategory = (categoryId) => {
  const idx = form.category_ids.indexOf(categoryId)
  if (idx > -1) {
    form.category_ids.splice(idx, 1)
  } else {
    form.category_ids.push(categoryId)
  }
}

// 切换标签
const toggleTag = (tagId) => {
  const idx = form.tag_ids.indexOf(tagId)
  if (idx > -1) {
    form.tag_ids.splice(idx, 1)
  } else {
    form.tag_ids.push(tagId)
  }
}

// 触发文件选择
const triggerFileInput = () => {
  fileInput.value.click()
}

// 头像上传
const onAvatarChange = async (e) => {
  const file = e.target.files[0]
  if (!file) return

  // 检查文件类型
  if (!file.type.startsWith('image/')) {
    alert('请上传图片文件')
    return
  }

  // 检查文件大小 (2MB)
  if (file.size > 2 * 1024 * 1024) {
    alert('图片大小不能超过2MB')
    return
  }

  // 预览
  avatarFile.value = file
  avatarUrl.value = URL.createObjectURL(file)

  // 自动上传
  // try {
  //   const formData = new FormData()
  //   formData.append('file', file)

  //   const res = await uploadAvatar(formData)
  //   form.avatar = res.data.avatar_url
  //   alert('头像上传成功')
  // } catch (err) {
  //   console.error('头像上传失败:', err)
  //   alert('头像上传失败')
  // }
}

// 播放声音
const playVoice = (voice) => {
  if (voice.voice_url) {  // 直接用 voice_url
    const audio = new Audio(voice.voice_url)
    audio.play()
  }
}
// 提交表单
const submit = async () => {
  // 验证
  if (!form.name.trim()) {
    alert('请输入角色名称')
    return
  }

  if (!form.voice_id) {
    alert('请选择角色声音')
    return
  }

  try {
    loading.value = true

    const formData = new FormData()
    formData.append('name', form.name)
    formData.append('description', form.description || '')
    formData.append('worldview', form.worldview || '')
    formData.append('greeting', form.greeting || '')
    formData.append('voice_id', form.voice_id)
    formData.append('category_ids', JSON.stringify(form.category_ids))
    formData.append('tag_ids', JSON.stringify(form.tag_ids))

    // if (form.avatar) {
    //   formData.append('avatar', form.avatar)
    // }
    if (avatarFile.value) {  // avatarFile 是文件对象
      formData.append('avatar', avatarFile.value)
    }

    let res
    if (isEdit.value) {
      res = await updateCharacter(characterId.value, formData)
      console.log('更新角色响应:', res)
      alert('更新成功')
    } else {
      res = await createCharacter(formData)
      console.log('创建角色响应:', res)
      alert('创建成功')
    }

    // 跳转到角色详情页或列表页
    if (isEdit.value) {
      router.push(`/chat/${characterId.value}`)
    } else {
      router.push(`/chat/${res.data.data.id}`)
    }

  } catch (err) {
    console.error('提交失败:', err)
    alert(isEdit.value ? '更新失败' : '创建失败')
  } finally {
    loading.value = false
  }
}

// 返回
const goBack = () => {
  router.back()
}
</script>

<style scoped>
@import '../../assets/styles/create/createchar.css';
</style>