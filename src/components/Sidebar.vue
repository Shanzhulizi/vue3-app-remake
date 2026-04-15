<template>
  <aside class="sidebar">
    <div class="sidebar-top">
      <div class="brand">AI-Chat</div>
      <!-- 创建（带悬浮子菜单） -->
      <!-- <div class="nav-item create" @mouseenter="openCreate" @mouseleave="closeCreate">
        创建

        <div v-show="showCreate" class="create-menu">
          <div class="create-item" @click="create('role')">角色</div>


          <div class="create-item" @click="create('voice')">语音</div>

        </div>
      </div> -->


      <nav class="nav">

        <div class="nav-item" @click="create('role')">创建角色</div>
        <div class="nav-item" @click="create('voice')">创建语音</div>
        <div class="nav-item" @click="go('/')">发现</div>
        <!-- <div class="nav-item" @click="go('/feed')">动态</div> -->
        <!--<div class="nav-item" @click="go('/avatarfx')">AvatarFX</div>-->
      </nav>
    </div>

    <div class="sidebar-bottom">
      <div class="menu-item" @click="go('/profile')">个人中心</div>
      <div class="menu-item" @click="$emit('open-settings')">设置</div>
      <div class="menu-item">政策</div>
      <div class="menu-item danger" @click="$emit('logout')">退出</div>
    </div>
  </aside>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
const router = useRouter()

const showCreate = ref(false)
let hideTimer = null

const go = (path) => {
  router.push(path)
}

const openCreate = () => {
  if (hideTimer) {
    clearTimeout(hideTimer)
    hideTimer = null
  }
  showCreate.value = true
}

const closeCreate = () => {
  hideTimer = setTimeout(() => {
    showCreate.value = false
  }, 150)
}
const create = (type) => {
  showCreate.value = false
  router.push(`/create/${type}`)
}


</script>




<style scoped>
@import '@/assets/styles/layout/sidebar.css';
</style>
