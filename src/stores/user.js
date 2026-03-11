import { defineStore } from 'pinia'
import { getCurrentUser } from '@/api/auth'

export const useUserStore = defineStore('user', {
  state: () => ({
    // ⭐ 从 localStorage 恢复
    token: localStorage.getItem('token') || '',
    user: null
  }),

  getters: {
    isLoggedIn: (state) => !!state.token
  },

  actions: {
    setToken(token) {
      this.token = token
      // ⭐ 同步写入 localStorage
      localStorage.setItem('token', token)
    },

    async fetchUser() {
      if (!this.token) return

      const res = await getCurrentUser()
      this.user = res.data.data
    },

    logout() {
      this.token = ''
      this.user = null
      localStorage.removeItem('token')
    }
  }
})
