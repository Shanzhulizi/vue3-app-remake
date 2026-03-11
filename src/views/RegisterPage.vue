<template>
  <div class="register-page">
    <div class="container">
      <div class="auth-card">
        <div class="auth-header">
          <h2>创建账号</h2>
          <p>加入我们，开始您的旅程</p>
        </div>

        <form @submit.prevent="handleRegister" class="auth-form">
          <div class="form-row">
            <div class="form-group">
              <label for="username">用户名 *</label>
              <input type="text" id="username" v-model="formData.username" placeholder="请输入用户名" required />
              <div v-if="errors.username" class="error-message">
                {{ errors.username }}
              </div>
            </div>

            <div class="form-group">
              <label for="email">邮箱 *</label>
              <input type="email" id="email" v-model="formData.email" placeholder="请输入邮箱" required />
              <div v-if="errors.email" class="error-message">
                {{ errors.email }}
              </div>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="password">密码 *</label>
              <input type="password" id="password" v-model="formData.password" placeholder="请输入密码" required />
              <div v-if="errors.password" class="error-message">
                {{ errors.password }}
              </div>
            </div>

            <div class="form-group">
              <label for="confirmPassword">确认密码 *</label>
              <input type="password" id="confirmPassword" v-model="formData.confirmPassword" placeholder="请再次输入密码"
                required />
              <div v-if="errors.confirmPassword" class="error-message">
                {{ errors.confirmPassword }}
              </div>
            </div>
          </div>

          <div class="password-requirements">
            <p class="requirements-title">密码要求：</p>
            <ul class="requirements-list">
              <li :class="{ valid: passwordStrength.length }">
                至少8个字符
              </li>
              <li :class="{ valid: passwordStrength.hasUppercase }">
                包含大写字母
              </li>
              <li :class="{ valid: passwordStrength.hasLowercase }">
                包含小写字母
              </li>
              <li :class="{ valid: passwordStrength.hasNumber }">
                包含数字
              </li>
              <li :class="{ valid: passwordStrength.hasSpecial }">
                包含特殊字符
              </li>
            </ul>
          </div>

          <div class="form-options">
            <label class="checkbox-label">
              <input type="checkbox" v-model="formData.agreeTerms" required />
              <span>我已阅读并同意 <a href="#">服务条款</a> 和 <a href="#">隐私政策</a></span>
            </label>
          </div>

          <button type="submit" class="btn-submit" :disabled="loading">
            {{ loading ? '注册中...' : '注册账号' }}
          </button>
        </form>

        <div class="auth-divider">
          <span>已有账号？</span>
        </div>

        <div class="auth-footer">
          <button class="btn-login" @click="goToLogin">
            立即登录
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
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { register } from '@/api/auth'

const router = useRouter()
const loading = ref(false)

const formData = ref({
  username: '',
  email: '',
  password: '',
  //确认密码
  confirmPassword: '',
  //确认协议
  agreeTerms: false
})

const errors = ref({
  username: '',
  email: '',
  password: '',
  confirmPassword: ''
})

// 计算密码强度
const passwordStrength = computed(() => {
  const password = formData.value.password
  return {
    length: password.length >= 8,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /\d/.test(password),
    hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(password)
  }
})

// 监听密码变化，实时验证
watch(() => formData.value.password, () => {
  validatePassword()
})

watch(() => formData.value.confirmPassword, () => {
  validateConfirmPassword()
})

//数据可行验证
const validateForm = () => {
  let isValid = true
  errors.value = { username: '', email: '', password: '', confirmPassword: '' }

  // 用户名验证
  if (!formData.value.username.trim()) {
    errors.value.username = '请输入用户名'
    isValid = false
  } else if (formData.value.username.length < 3) {
    errors.value.username = '用户名至少3个字符'
    isValid = false
  }

  // 邮箱验证
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!formData.value.email) {
    errors.value.email = '请输入邮箱'
    isValid = false
  } else if (!emailRegex.test(formData.value.email)) {
    errors.value.email = '邮箱格式不正确'
    isValid = false
  }

  // 密码验证
  if (!validatePassword()) {
    isValid = false
  }

  // 确认密码验证
  if (!validateConfirmPassword()) {
    isValid = false
  }

  // 条款同意验证
  if (!formData.value.agreeTerms) {
    alert('请同意服务条款和隐私政策')
    isValid = false
  }

  return isValid
}

const validatePassword = () => {
  const password = formData.value.password
  if (!password) {
    errors.value.password = '请输入密码'
    return false
  }

  if (password.length < 8) {
    errors.value.password = '密码至少8个字符'
    return false
  }

  if (!/[A-Z]/.test(password)) {
    errors.value.password = '密码必须包含大写字母'
    return false
  }

  if (!/[a-z]/.test(password)) {
    errors.value.password = '密码必须包含小写字母'
    return false
  }

  if (!/\d/.test(password)) {
    errors.value.password = '密码必须包含数字'
    return false
  }

  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.value.password = '密码必须包含特殊字符'
    return false
  }

  errors.value.password = ''
  return true
}

const validateConfirmPassword = () => {
  if (!formData.value.confirmPassword) {
    errors.value.confirmPassword = '请确认密码'
    return false
  }

  if (formData.value.password !== formData.value.confirmPassword) {
    errors.value.confirmPassword = '两次输入的密码不一致'
    return false
  }

  errors.value.confirmPassword = ''
  return true
}

const handleRegister = async () => {
  // 1. 表单验证
  if (!validateForm()) {
    return
  }

  // 2. 开始加载
  loading.value = true
  try {
    // 3. 准备请求数据（只发送需要的字段）
    const requestData = {
      username: formData.value.username.trim(),
      email: formData.value.email.trim(),
      password: formData.value.password
      // 不需要发送 confirmPassword 和 agreeTerms 到后端
    }

    console.log('发送注册请求:', requestData)

    // 4. 调用真实的 API
    const axiosResponse  =await register(requestData)
    
    const response = axiosResponse.data

    console.log('注册响应:', response)
    // console.log('注册响应码1:', response.data)
    console.log('注册响应码2:', response.code)
    // 5. 根据后端返回的响应码处理
    if (response.code === 200) {
      // 注册成功
      alert(`注册成功！\n用户名: ${response.data.username}\n邮箱: ${response.data.email}`)

      // 可以在这里保存 token 到本地存储
      if (response.token) {
        localStorage.setItem('token', response.data.token)
        localStorage.setItem('user', JSON.stringify(response.data))
      }

      // 跳转到登录页
      router.push('/login')
    } else {
      // 注册失败，显示后端返回的错误信息
      alert(`注册失败：${response.msg}`)

      // 可以根据不同的错误码设置具体的错误提示
      if (response.code === 40001) {
        // 用户名已存在
        errors.value.username = response.msg
      } else if (response.code === 40002) {
        // 邮箱已注册
        errors.value.email = response.msg
      }
    }

  } catch (error) {
    // 6. 捕获网络错误或异常
    console.error('注册异常:', error)

    // 显示错误信息
    if (error.code === -1) {
      alert('网络连接失败，请检查网络设置')
    } else if (error.code === 401) {
      alert('认证失败，请重新登录')
    } else {
      alert(`注册失败：${error.msg || '未知错误'}`)
    }

  } finally {
    // 7. 无论成功失败，都要停止加载
    loading.value = false
  }
}

const goToLogin = () => {
  router.push('/login')
}
</script>

<style scoped>
@import '@/assets/styles/register.css';
</style>