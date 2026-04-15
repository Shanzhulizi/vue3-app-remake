<!-- components/RecommendRow.vue -->
<template>
  <section class="recommend-section">
    <div class="section-header">
      <div class="header-left">
        <h3 class="section-title">
          <span class="title-icon">{{ config.icon }}</span>
          {{ config.title }}
        </h3>
        <span class="section-desc">{{ config.desc }}</span>
      </div>
      <button class="more-btn" @click="$emit('click-more')">
        查看更多
      </button>
    </div>

    <div class="scroll-container">
      <!-- 左箭头 - 极简风格 -->
      <button class="scroll-arrow left" :class="{ hidden: !canScrollLeft }" @click="scrollLeft"
        :disabled="!canScrollLeft">
        ←
      </button>

      <!-- 滚动区域 -->
      <div class="horizontal-scroll" ref="scrollContainer" @scroll="checkScroll">
       <div 
          v-for="item in items" 
          :key="item.id" 
          class="scroll-item" 
          :style="{ width: cardWidth + 'px', flex: '0 0 ' + cardWidth + 'px' }"
          @click="$emit('click-item', item.id)"
        >
          <div class="recommend-card">
            <div class="card-avatar">
              <img v-if="item.avatar" :src="item.avatar" :alt="item.name" @error="handleImageError" />
              <div v-else class="avatar-placeholder">
                {{ item.name.slice(0, 1) }}
              </div>

              <!-- 极简徽章 - 只有黑白灰 -->
              <div :class="['badge', config.badgeClass]">
                <span class="badge-text">
                  <span class="badge-text">{{ config.icon }}</span>
                </span>
              </div>

              <!-- 点赞按钮 - 黑白灰风格 -->
              <div class="like-button" :class="{ liked: item.is_liked }" @click.stop="$emit('toggle-like', item)">
                <span class="heart">{{ item.is_liked ? '♥' : '♡' }}</span>
                <span class="count">{{ item.like_count || 0 }}</span>
              </div>
            </div>

            <div class="card-info">
              <h4 class="card-name">{{ item.name }}</h4>
              <p class="card-desc">{{ item.description || '暂无描述' }}</p>

              <!-- 统计信息 - 黑白灰 -->
              <div class="card-stats">
                <template v-if="type === 'hot' || type === 'popular'">
                  <span>👥 {{ item.view_count || 0 }}</span>
                  <span>💬 {{ item.chat_count || 0 }}</span>
                </template>

                <template v-else-if="type === 'trending'">
                  <span>📊 {{ item.recent_usage || 0 }}</span>
                  <span>📈 {{ (item.growth_rate * 100).toFixed(0) }}%</span>
                </template>

                <template v-else>
                  <span>👥 {{ item.usage_count || 0 }}</span>
                  <span>♥ {{ item.like_count || 0 }}</span>
                </template>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 右箭头 - 极简风格 -->
      <button class="scroll-arrow right" :class="{ hidden: !canScrollRight }" @click="scrollRight"
        :disabled="!canScrollRight">
        →
      </button>
    </div>
  </section>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick, computed } from 'vue'


const props = defineProps({
  type: {
    type: String,
    required: true
  },
  items: {
    type: Array,
    required: true
  },
  title: {
    type: String,
    default: ''
  },
  desc: {
    type: String,
    default: ''
  },
   // 新增：允许外部传入卡片宽度
  cardWidth: {
    type: Number,
    default: 260  // 统一默认值 260px
  }
})

defineEmits(['click-more', 'click-item', 'toggle-like'])

const scrollContainer = ref(null)
const canScrollLeft = ref(false)
const canScrollRight = ref(true)
const isMobile = ref(window.innerWidth <= 768)

// 卡片宽度响应式

const itemWidth = computed(() => props.cardWidth + 16)
// 极简配置 - 只有文字，没有彩色
const configMap = {
  hot: {  // 对应后端的 /hot
    icon: 'HOT',
    title: '综合热门',
    desc: '总热度最高的角色',
    badgeClass: 'badge-hot'
  },
  popular: {  // 对应后端的 /popular
    icon: 'POP',
    title: '近期流行',
    desc: '最近7天最受欢迎',
    badgeClass: 'badge-popular'
  },
  trending: {  // 对应后端的 /trending
    icon: 'TREND',
    title: '近期飙升',
    desc: '最近24小时飙升最快',
    badgeClass: 'badge-trend'
  },
  personalized: {  // 对应后端的 /pretend
    icon: 'YOU',
    title: '猜你喜欢',
    desc: '根据你的偏好推荐',
    badgeClass: 'badge-personalized'
  },
  vector: {  // 对应后端的 /pretend-vector
    icon: 'VEC',
    title: '智能推荐',
    desc: '基于向量相似度',
    badgeClass: 'badge-vector'
  },
  similar: {  // 对应后端的 /similar
    icon: 'SIM',
    title: '相似用户喜欢',
    desc: '和你品味相投的人也在聊',
    badgeClass: 'badge-similar'
  },
  mix: {  // 对应后端的 /mix
    icon: 'MIX',
    title: '混合推荐',
    desc: '多种算法综合推荐',
    badgeClass: 'badge-mix'
  }
}

const config = configMap[props.type]

const checkScroll = () => {
  if (!scrollContainer.value) return

  const { scrollLeft, scrollWidth, clientWidth } = scrollContainer.value
  canScrollLeft.value = scrollLeft > 1
  canScrollRight.value = scrollLeft < scrollWidth - clientWidth - 1
}

const scrollLeft = () => {
  if (!scrollContainer.value || !canScrollLeft.value) return

  const currentScroll = scrollContainer.value.scrollLeft
  const targetScroll = Math.max(0, currentScroll - itemWidth.value)

  scrollContainer.value.scrollTo({
    left: targetScroll,
    behavior: 'smooth'
  })

  setTimeout(checkScroll, 300)
}

const scrollRight = () => {
  if (!scrollContainer.value || !canScrollRight.value) return

  const currentScroll = scrollContainer.value.scrollLeft
  const maxScroll = scrollContainer.value.scrollWidth - scrollContainer.value.clientWidth
  const targetScroll = Math.min(maxScroll, currentScroll + itemWidth.value)

  scrollContainer.value.scrollTo({
    left: targetScroll,
    behavior: 'smooth'
  })

  setTimeout(checkScroll, 300)
}

const handleImageError = (e) => {
  e.target.style.display = 'none'
  e.target.parentNode.innerHTML = `<div class="avatar-placeholder">${e.target.alt?.slice(0, 1) || '?'}</div>`
}

// 监听窗口大小变化
const handleResize = () => {
  isMobile.value = window.innerWidth <= 768
  nextTick(() => {
    checkScroll()
  })
}

onMounted(() => {
  window.addEventListener('resize', handleResize)
  nextTick(() => {
    checkScroll()
    if (scrollContainer.value) {
      scrollContainer.value.addEventListener('scroll', checkScroll)
    }
  })
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  if (scrollContainer.value) {
    scrollContainer.value.removeEventListener('scroll', checkScroll)
  }
})
</script>

<style scoped>
/* =========================
   RecommendRow 组件 - ChatGPT 风格
========================= */
@import '@/assets/styles/recommendRow.css';
</style>