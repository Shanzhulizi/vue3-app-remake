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
        查看更多 <span class="arrow">→</span>
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
        <div v-for="item in items" :key="item.id" class="scroll-item" :style="{ width: cardWidth + 'px' }"
          @click="$emit('click-item', item.id)">
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
                  <span>👥 {{ item.usage_count || 0 }}</span>
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
  }
})

defineEmits(['click-more', 'click-item', 'toggle-like'])

const scrollContainer = ref(null)
const canScrollLeft = ref(false)
const canScrollRight = ref(true)
const isMobile = ref(window.innerWidth <= 768)

// 卡片宽度响应式
const cardWidth = computed(() => isMobile.value ? 180 : 220)
const itemWidth = computed(() => cardWidth.value + 16) // 卡片宽度 + gap

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

.recommend-section {
  width: 100%;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif;
}

/* 头部区域 - 极简克制 */
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 1px solid #eef2f6;
}

.header-left {
  display: flex;
  align-items: baseline;
  gap: 12px;
  flex-wrap: wrap;
}

.section-title {
  font-size: 18px;
  font-weight: 500;
  color: #1e293b;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
  letter-spacing: -0.2px;
}

.title-icon {
  font-size: 12px;
  font-weight: 500;
  color: #64748b;
  background: #f1f5f9;
  padding: 2px 8px;
  border-radius: 20px;
  letter-spacing: 0.3px;
}

.section-desc {
  font-size: 13px;
  color: #64748b;
  font-weight: 400;
}

/* 更多按钮 - 柔和边框 */
.more-btn {
  padding: 6px 14px;
  background: transparent;
  border: 1px solid #e2e8f0;
  border-radius: 24px;
  color: #475569;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 13px;
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 450;
}

.more-btn:hover {
  background: #ffffff;
  border-color: #cbd5e1;
  color: #1e293b;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.02);
}

.arrow {
  font-size: 13px;
  transition: transform 0.2s ease;
}

.more-btn:hover .arrow {
  transform: translateX(2px);
}

/* =========================
   滚动容器 - 优雅横向滚动
========================= */
.scroll-container {
  position: relative;
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
}

.horizontal-scroll {
  flex: 1;
  display: flex;
  gap: 20px;
  overflow-x: auto;
  scroll-behavior: smooth;
  padding: 4px 0 20px;
  scrollbar-width: thin;
  scrollbar-color: #cbd5e1 #f1f5f9;
}

.horizontal-scroll::-webkit-scrollbar {
  height: 4px;
}

.horizontal-scroll::-webkit-scrollbar-track {
  background: #f1f5f9;
  border-radius: 10px;
}

.horizontal-scroll::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 10px;
}

.horizontal-scroll::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}

/* 滚动箭头 - 优雅圆形 */
.scroll-arrow {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  color: #475569;
  font-size: 18px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  flex-shrink: 0;
  z-index: 10;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.02);
}

.scroll-arrow:hover:not(:disabled) {
  background: #f8fafc;
  border-color: #cbd5e1;
  color: #1e293b;
}

.scroll-arrow.hidden {
  opacity: 0;
  pointer-events: none;
  visibility: hidden;
}

.scroll-arrow:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

/* =========================
   卡片 - ChatGPT 精致风格
========================= */
.scroll-item {
  flex: 0 0 v-bind(cardWidth + 'px');
  cursor: pointer;
  transition: transform 0.25s ease, opacity 0.2s ease;
}

.scroll-item:hover {
  transform: translateY(-4px);
}

.recommend-card {
  background: #ffffff;
  border: 1px solid #eef2f6;
  border-radius: 16px;
  overflow: hidden;
  transition: all 0.25s ease;
  height: 100%;
  display: flex;
  flex-direction: column;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.02);
}

.recommend-card:hover {
  border-color: #e2e8f0;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.04);
}

/* 头像区域 */
.card-avatar {
  position: relative;
  width: 100%;
  aspect-ratio: 1 / 1;
  overflow: hidden;
  background: #f8fafc;
  border-bottom: 1px solid #f1f5f9;
}

.card-avatar img {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.scroll-item:hover .card-avatar img {
  transform: scale(1.02);
}

.avatar-placeholder {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f1f5f9;
  color: #94a3b8;
  font-size: 48px;
  font-weight: 400;
}

/* 徽章 - 高级灰 */
.badge {
  position: absolute;
  top: 12px;
  left: 12px;
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 10px;
  font-weight: 500;
  color: #ffffff;
  z-index: 2;
  letter-spacing: 0.3px;
  backdrop-filter: blur(4px);
  background: rgba(0, 0, 0, 0.6);
}

.badge-hot { background: rgba(0, 0, 0, 0.65); }
.badge-popular { background: rgba(0, 0, 0, 0.6); }
.badge-trend { background: rgba(0, 0, 0, 0.6); }
.badge-personalized { background: rgba(0, 0, 0, 0.6); }
.badge-vector { background: rgba(0, 0, 0, 0.6); }
.badge-similar { background: rgba(0, 0, 0, 0.6); }
.badge-mix { background: rgba(0, 0, 0, 0.6); }

.badge-text {
  font-size: 10px;
  font-weight: 500;
}

/* 点赞按钮 - 极简灰 */
.like-button {
  position: absolute;
  bottom: 12px;
  right: 12px;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(4px);
  border: 1px solid #eef2f6;
  border-radius: 24px;
  color: #475569;
  font-size: 11px;
  cursor: pointer;
  transition: all 0.2s ease;
  z-index: 10;
}

.like-button:hover {
  background: #ffffff;
  border-color: #cbd5e1;
}

.like-button.liked {
  background: #f8fafc;
  border-color: #cbd5e1;
}

.heart {
  font-size: 13px;
  color: #94a3b8;
  transition: color 0.2s ease;
}

.like-button.liked .heart {
  color: #e5484d;
}

.count {
  font-weight: 450;
  min-width: 18px;
  text-align: center;
  color: #475569;
}

/* 卡片信息 */
.card-info {
  padding: 14px;
  flex: 1;
  display: flex;
  flex-direction: column;
  background: #ffffff;
}

.card-name {
  font-size: 15px;
  font-weight: 500;
  margin: 0 0 4px;
  color: #1e293b;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  letter-spacing: -0.2px;
}

.card-desc {
  font-size: 12px;
  color: #64748b;
  margin: 0 0 12px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-height: 1.45;
  min-height: 36px;
  flex: 1;
}

/* 统计信息 - 极简分割 */
.card-stats {
  display: flex;
  gap: 16px;
  color: #64748b;
  font-size: 11px;
  border-top: 1px solid #f1f5f9;
  padding-top: 10px;
  margin-top: auto;
}

.card-stats span {
  display: flex;
  align-items: center;
  gap: 4px;
  font-weight: 450;
}

/* =========================
   移动端适配
========================= */
@media (max-width: 768px) {
  .scroll-arrow {
    width: 28px;
    height: 28px;
    font-size: 16px;
  }
  
  .section-header {
    flex-wrap: wrap;
    gap: 12px;
  }
  
  .more-btn {
    padding: 4px 12px;
    font-size: 12px;
  }
  
  .card-name {
    font-size: 14px;
  }
  
  .card-stats {
    gap: 12px;
    font-size: 10px;
  }
  
  .like-button {
    padding: 3px 8px;
  }
}

@media (max-width: 480px) {
  .section-title {
    font-size: 16px;
  }
  
  .title-icon {
    font-size: 10px;
    padding: 2px 6px;
  }
  
  .section-desc {
    font-size: 11px;
  }
}
</style>