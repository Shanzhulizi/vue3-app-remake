<template>
  <div class="home-root">



    <div class="profile-root">
      <!-- 顶部用户信息 -->
      <div class="profile-header">
        <!-- 头像 -->
        <div class="avatar" :style="{ backgroundColor: avatarBgColor }">
          {{ avatarChar }}
        </div>

        <!-- 用户名 -->
        <div class="username">
          {{ user.username }}
        </div>

        <!-- 邮箱（你要求新增的） -->
        <div class="email">
          {{ user.email }}
        </div>

        <!-- 统计信息 -->
        <div class="stats">
          <span>0 个粉丝</span>
          <span>·</span>
          <span>0 个关注</span>
          <span>·</span>
          <span>0 次互动</span>
        </div>

        <!-- 操作按钮 -->
        <div class="actions">
          <!-- <div class="menu-item" @click="showSettings = true">设置</div> -->


          <button class="action-btn" @click="showSettings = true">设置</button>
          <button class="action-btn icon">⤴</button>
        </div>
      </div>

      <!-- Tab -->
      <div class="profile-tabs">
        <div class="tab active">角色</div>
        <div class="tab">已点赞</div>
        <div class="tab">形象</div>
        <div class="tab">语音</div>
        <div class="tab">场景</div>
      </div>

      <!-- 内容区域 -->
      <div class="profile-content">
        <div class="empty">
          您尚未创建任何角色。
        </div>
      </div>
    </div>
  </div>

  <SettingsModal v-if="showSettings" @close="showSettings = false" />

</template>
<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import SettingsModal from '../../components/SettingsModal.vue'
import { onMounted } from 'vue'
const router = useRouter()
const userStore = useUserStore()

/* ========= 用户状态 ========= */

const isLoggedIn = computed(() => userStore.isLoggedIn)
const user = computed(() => userStore.user || {})

/* ========= 路由跳转 ========= */


onMounted(async () => {
  if (userStore.token && !userStore.user) {
    await userStore.fetchUser()
  }
})
const showSettings = ref(false)
/* ========= 文字头像逻辑 ========= */

const avatarChar = computed(() => {
  if (!user.value?.username) return '?'
  return user.value.username.trim()[0].toUpperCase()
})

const avatarBgColor = computed(() => {
  const name = user.value?.username || ''
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }

  const colors = [
    '#d9f99d', // lime
    '#a7f3d0', // emerald
    '#bfdbfe', // blue
    '#ddd6fe', // violet
    '#fde68a', // amber
    '#fecaca', // red
  ]

  return colors[Math.abs(hash) % colors.length]
})
</script>

<style scoped="">
/* ====== 全局布局 ====== */
@import '@/assets/styles/profile.css';
</style>