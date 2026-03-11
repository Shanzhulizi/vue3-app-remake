<template>
  <div class="login-page">
    <div class="container">
      <div class="auth-card">
        <div class="auth-header">
          <h2>登录账号</h2>
          <p>请输入您的凭证以继续</p>
        </div>

        <form @submit.prevent="handleLogin" class="auth-form">
          <div class="form-group">
            <label for="email">邮箱或用户名</label>
            <input type="text" id="email" v-model="formData.identifier" placeholder="请输入邮箱或用户名" required />
          </div>

          <div class="form-group">
            <div class="label-row">
              <label for="password">密码</label>
              <a href="#" class="forgot-password">忘记密码？</a>
            </div>
            <input type="password" id="password" v-model="formData.password" placeholder="请输入密码" required />
          </div>

          <div class="form-options">
            <label class="checkbox-label">
              <input type="checkbox" v-model="formData.rememberMe" />
              <span>记住我</span>
            </label>
          </div>

          <button type="submit" class="btn-submit" :disabled="loading">
            {{ loading ? '登录中...' : '登录' }}
          </button>
        </form>

        <div class="auth-divider">
          <span>或</span>
        </div>

        <div class="auth-footer">
          <p>还没有账号？</p>
          <button class="btn-register" @click="goToRegister">
            立即注册
          </button>
        </div>

        <div class="back-home">
          <router-link to="/" class="back-link">
            ← 返回首页
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { login } from '@/api/auth' // 导入登录 API

import { useUserStore } from '@/stores/user'



const router = useRouter()
const loading = ref(false)
const userStore = useUserStore()
const formData = ref({
  identifier: '',
  password: '',
  rememberMe: false
})

// 真实的登录函数
const handleLogin = async () => {
  if (!formData.value.identifier || !formData.value.password) {
    alert('请输入用户名/邮箱和密码')
    return
  }

  loading.value = true

  try {
    // 判断是邮箱还是用户名
    const isEmail = formData.value.identifier.includes('@')

    const requestData = {
      [isEmail ? 'email' : 'username']: formData.value.identifier,
      password: formData.value.password
    }

    const res = await login(requestData)
    const response = res.data

    if (response.code !== 200) {
      alert(response.msg || '登录失败')
      return
    }

    const token = response.data.access_token
    if (!token) {
      throw new Error('后端未返回 token')
    }

    // 1️⃣ 存 token
    userStore.setToken(token)
    localStorage.setItem('token', token)

    // 2️⃣ 拉当前用户信息（/me）
    await userStore.fetchUser()

    // 3️⃣ 跳转主页
    router.push('/')

  } catch (error) {
    console.error('登录异常:', error)

    if (error.code === -1) {
      alert('网络连接失败，请检查网络设置')
    } else if (error.code === 401) {
      alert('用户名或密码错误')
    } else {
      alert(`登录失败：${error.msg || '未知错误'}`)
    }

  } finally {
    loading.value = false
  }
}

const goToRegister = () => {
  router.push('/register')
}
</script>

<style scoped>
@import '@/assets/styles/login.css';
</style>