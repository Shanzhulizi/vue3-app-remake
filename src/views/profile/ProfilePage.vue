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

.home-root {
  display: flex;
  height: 100vh;
  background: #fafafa;
  color: #111;
  font-family: system-ui, -apple-system, BlinkMacSystemFont;
}

/* ====== 左侧栏 ====== */

.sidebar {
  width: 240px;
  background: #f5f5f5;
  border-right: 1px solid #e5e7eb;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.sidebar-top {
  padding: 16px;
}

.brand {
  font-weight: 600;
  margin-bottom: 20px;
}

.nav {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.nav-item {
  padding: 8px 12px;
  border-radius: 8px;
  cursor: pointer;
  color: #444;
}

.nav-item:hover {
  background: #e5e7eb;
}

.nav-item.active {
  background: #e5e7eb;
  font-weight: 600;
}

/* ====== 左下菜单 ====== */

.sidebar-bottom {
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.menu-item {
  padding: 8px 12px;
  border-radius: 8px;
  cursor: pointer;
  color: #444;
}

.menu-item:hover {
  background: #e5e7eb;
}

.menu-item.danger {
  color: #dc2626;
}

/* ====== 右侧主体 ====== */

.main {
  flex: 1;
  display: flex;
  flex-direction: column;
}

/* 顶部栏（你原来的） */
.topbar {
  height: 56px;
  padding: 0 20px;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 16px;
  border-bottom: 1px solid #e5e7eb;
  background: #fff;
}

/* 搜索框 */
.search-box input {
  height: 32px;
  padding: 0 12px;
  border-radius: 16px;
  border: 1px solid #e5e7eb;
  outline: none;
}

/* 用户盒子 */
.user-box {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
}

/* ====== 个人页主体 ====== */

.profile-root {
  flex: 1;
  padding: 48px 0;
  display: flex;
  flex-direction: column;
  align-items: center;
}

/* 顶部信息区 */
.profile-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.profile-header .avatar {
  width: 96px;
  height: 96px;
  font-size: 36px;
}

.username {
  font-size: 20px;
  font-weight: 600;
}

.email {
  font-size: 14px;
  color: #6b7280;
}

/* 统计 */
.stats {
  font-size: 14px;
  color: #6b7280;
}

/* 操作按钮 */
.actions {
  display: flex;
  gap: 8px;
  margin-top: 8px;
}

.action-btn {
  padding: 6px 14px;
  border-radius: 999px;
  border: 1px solid #e5e7eb;
  background: #fff;
  cursor: pointer;
}

.action-btn:hover {
  background: #f3f4f6;
}

.action-btn.icon {
  width: 36px;
  padding: 0;
}

/* ====== Tabs ====== */

.profile-tabs {
  display: flex;
  gap: 24px;
  margin-top: 32px;
  border-bottom: 1px solid #e5e7eb;
}

.tab {
  padding: 12px 0;
  cursor: pointer;
  color: #6b7280;
}

.tab.active {
  color: #111;
  font-weight: 600;
  border-bottom: 2px solid #111;
}

/* ====== 内容区 ====== */

.profile-content {
  padding: 40px 0;
  color: #6b7280;
}

.empty {
  font-size: 14px;
}
</style>