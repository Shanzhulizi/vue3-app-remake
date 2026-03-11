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
      <button 
        class="scroll-arrow left" 
        :class="{ hidden: !canScrollLeft }"
        @click="scrollLeft"
        :disabled="!canScrollLeft"
      >
        ←
      </button>
      
      <!-- 滚动区域 -->
      <div class="horizontal-scroll" ref="scrollContainer" @scroll="checkScroll">
        <div
          v-for="item in items"
          :key="item.id"
          class="scroll-item"
          :style="{ width: cardWidth + 'px' }"
          @click="$emit('click-item', item.id)"
        >
          <div class="recommend-card">
            <div class="card-avatar">
              <img
                v-if="item.avatar"
                :src="item.avatar"
                :alt="item.name"
                @error="handleImageError"
              />
              <div v-else class="avatar-placeholder">
                {{ item.name.slice(0, 1) }}
              </div>
              
              <!-- 极简徽章 - 只有黑白灰 -->
              <div :class="['badge', config.badgeClass]">
                <span class="badge-text">
                  <span v-if="type === 'comprehensive'">HOT</span>
                  <span v-else-if="type === 'trending'">TREND</span>
                  <span v-else>PICK</span>
                </span>
              </div>
              
              <!-- 点赞按钮 - 黑白灰风格 -->
              <div 
                class="like-button" 
                :class="{ liked: item.is_liked }"
                @click.stop="$emit('toggle-like', item)"
              >
                <span class="heart">{{ item.is_liked ? '♥' : '♡' }}</span>
                <span class="count">{{ item.like_count || 0 }}</span>
              </div>
            </div>
            
            <div class="card-info">
              <h4 class="card-name">{{ item.name }}</h4>
              <p class="card-desc">{{ item.description || '暂无描述' }}</p>
              
              <!-- 统计信息 - 黑白灰 -->
              <div class="card-stats">
                <template v-if="type === 'comprehensive'">
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
      <button 
        class="scroll-arrow right" 
        :class="{ hidden: !canScrollRight }"
        @click="scrollRight"
        :disabled="!canScrollRight"
      >
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
    required: true,
    validator: (value) => ['comprehensive', 'trending', 'mixed'].includes(value)
  },
  items: {
    type: Array,
    required: true
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
  comprehensive: {
    icon: 'HOT',
    title: '综合热门',
    desc: '总热度最高的角色',
    badgeClass: 'badge-hot'
  },
  trending: {
    icon: 'TREND',
    title: '近期飙升',
    desc: '最近7天热度飙升最快',
    badgeClass: 'badge-trend'
  },
  mixed: {
    icon: 'PICK',
    title: '猜你喜欢',
    desc: '为你精选的角色',
    badgeClass: 'badge-pick'
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
.recommend-section {
  width: 100%;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  border-bottom: 1px solid #eaeaea;
  padding-bottom: 12px;
}

.header-left {
  display: flex;
  align-items: baseline;
  gap: 12px;
}

.section-title {
  font-size: 18px;
  font-weight: 500;
  color: #111;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
  letter-spacing: 0.5px;
}

.title-icon {
  font-size: 14px;
  font-weight: 600;
  color: #555;
  background: #f0f0f0;
  padding: 2px 8px;
  border-radius: 12px;
}

.section-desc {
  font-size: 13px;
  color: #777;
  font-weight: 400;
}

.more-btn {
  padding: 4px 12px;
  background: none;
  border: 1px solid #ddd;
  border-radius: 16px;
  color: #555;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.more-btn:hover {
  background: #f5f5f5;
  border-color: #999;
  color: #333;
}

.arrow {
  font-size: 14px;
  line-height: 1;
}


.scroll-container {
  position: relative;
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%; /* 确保占满宽度 */
}

.horizontal-scroll {
  flex: 1;
  display: flex;
  gap: 16px;
  overflow-x: auto;
  scroll-behavior: smooth;
  padding: 4px 0 16px;
  scrollbar-width: none;
  -ms-overflow-style: none;
  width: 100%; /* 确保占满宽度 */
}


.horizontal-scroll::-webkit-scrollbar {
  display: none;
}

.scroll-arrow {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: white;
  border: 1px solid #ddd;
  color: #555;
  font-size: 18px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  flex-shrink: 0; /* 防止被压缩 */
  z-index: 10;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.02);
}


.scroll-arrow:hover:not(:disabled) {
  background: #f5f5f5;
  border-color: #999;
  color: #333;
}

.scroll-arrow.hidden {
  opacity: 0;
  pointer-events: none;
  visibility: hidden;
}

.scroll-arrow:disabled {
  opacity: 0.2;
  cursor: not-allowed;
}

.scroll-item {
  flex: 0 0 v-bind(cardWidth + 'px');
  cursor: pointer;
  transition: transform 0.2s;
}

.scroll-item:hover {
  transform: translateY(-2px);
}

.recommend-card {
  background: white;
  border: 1px solid #f0f0f0;
  border-radius: 8px;
  overflow: hidden;
  transition: all 0.2s;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.recommend-card:hover {
  border-color: #ccc;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);
}

.card-avatar {
  position: relative;
  width: 100%;
  aspect-ratio: 1 / 1;
  overflow: hidden;
  background: #fafafa;
  border-bottom: 1px solid #f0f0f0;
}

.card-avatar img {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  filter: grayscale(20%);
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
  background: #f5f5f5;
  color: #999;
  font-size: 42px;
  font-weight: 300;
}

.badge {
  position: absolute;
  top: 8px;
  left: 8px;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 10px;
  font-weight: 500;
  color: white;
  z-index: 2;
  letter-spacing: 0.3px;
}

.badge-hot {
  background: #333;
}

.badge-trend {
  background: #555;
}

.badge-pick {
  background: #777;
}

.badge-text {
  font-size: 9px;
  font-weight: 600;
}

.like-button {
  position: absolute;
  bottom: 8px;
  right: 8px;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(2px);
  border: 1px solid #eee;
  border-radius: 16px;
  color: #333;
  font-size: 11px;
  cursor: pointer;
  transition: all 0.2s;
  z-index: 10;
}

.like-button:hover {
  background: white;
  border-color: #ccc;
}

.like-button.liked {
  background: #f5f5f5;
  border-color: #aaa;
  color: #000;
}

.heart {
  font-size: 12px;
  color: #888;
}

.like-button.liked .heart {
  color: #333;
}

.count {
  font-weight: 400;
  min-width: 14px;
  text-align: center;
  color: #666;
}

.card-info {
  padding: 12px;
  flex: 1;
  display: flex;
  flex-direction: column;
}

.card-name {
  font-size: 14px;
  font-weight: 500;
  margin: 0 0 4px;
  color: #222;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.card-desc {
  font-size: 11px;
  color: #888;
  margin: 0 0 10px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-height: 1.4;
  min-height: 30px;
  flex: 1;
}

.card-stats {
  display: flex;
  gap: 12px;
  color: #777;
  font-size: 10px;
  border-top: 1px solid #f0f0f0;
  padding-top: 8px;
  margin-top: auto;
}

.card-stats span {
  display: flex;
  align-items: center;
  gap: 3px;
}

@media (max-width: 768px) {
  .scroll-arrow {
    width: 28px;
    height: 28px;
    font-size: 16px;
  }
  
  .card-name {
    font-size: 13px;
  }
  
  .card-stats {
    gap: 8px;
  }
}
</style>