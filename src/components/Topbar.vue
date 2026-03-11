<template>
  <header class="topbar">
    <div class="search-box">
      <input placeholder="搜索角色 / 内容" />
    </div>

    <div class="user-box" @click="goProfile">
      <template v-if="!isLoggedIn">
        <span>登录</span>
      </template>
      <template v-else>
        <div class="avatar" :style="{ backgroundColor: avatarBgColor }">
          {{ avatarChar }}
        </div>
        <span>{{ user.username }}</span>
      </template>
    </div>
  </header>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const store = useUserStore()

const user = computed(() => store.user || {})
const isLoggedIn = computed(() => store.isLoggedIn)



const goProfile = () => {
  router.push(isLoggedIn.value ? '/profile' : '/login')
}


// 计算头像的背景颜色和文字

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
    '#6366f1', // indigo
    '#10b981', // emerald
    '#f59e0b', // amber
    '#ef4444', // red
    '#8b5cf6', // violet
    '#0ea5e9', // sky
  ]

  return colors[Math.abs(hash) % colors.length]
})
</script>
<style scoped>
@import '@/assets/styles/layout/topbar.css';
@import '@/assets/styles/components/avatar.css';
</style>