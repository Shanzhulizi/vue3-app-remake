<template>
  <div class="home-root">
    <Sidebar
      @open-settings="showSettings = true"
      @logout="logout"
    />

    <div class="main">
      <Topbar v-if="showTopbar"  />
      <router-view />
    </div>

    <SettingsModal
      v-if="showSettings"
      @close="showSettings = false"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useUserStore } from '@/stores/user'

import { useRouter, useRoute } from 'vue-router'

import Sidebar from '@/components/Sidebar.vue'
import Topbar from '@/components/Topbar.vue'
import SettingsModal from '@/components/SettingsModal.vue'
const route = useRoute()

const router = useRouter()
const userStore = useUserStore()
const showSettings = ref(false)
const showTopbar = computed(() => {
  return route.meta.showTopbar !== false
})
onMounted(async () => {
  if (userStore.token && !userStore.user) {
    await userStore.fetchUser()
  }
})

const logout = () => {
  userStore.logout()
  router.push('/login')
}
</script>
<style scoped>
@import '@/assets/styles/layout/home.css';
</style>