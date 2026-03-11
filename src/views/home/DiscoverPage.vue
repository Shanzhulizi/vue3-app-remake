<template>
  <main class="content">
    <div class="content-inner">
      <h2 class="title">角色推荐</h2>
      
      <div v-if="loading" class="loading">
        <div class="spinner"></div>
        <p>加载推荐中...</p>
      </div>

      <div v-else class="recommend-container">
        <!-- 使用组件，通过 type 区分 -->
        <RecommendRow
          type="comprehensive"
          :items="recommendations.comprehensive"
          @click-more="goToMore('comprehensive')"
          @click-item="goChat"
          @toggle-like="toggleLike"
        />
        
        <RecommendRow
          type="trending"
          :items="recommendations.trending"
          @click-more="goToMore('trending')"
          @click-item="goChat"
          @toggle-like="toggleLike"
        />
        
        <RecommendRow
          type="mixed"
          :items="recommendations.mixed"
          @click-more="goToMore('mixed')"
          @click-item="goChat"
          @toggle-like="toggleLike"
        />
      </div>
    </div>
  </main>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getAllRecommends } from '@/api/recommend'
import { likeCharacter, unlikeCharacter, batchGetLikeStatus } from '@/api/like'
import RecommendRow from '@/components/RecommendRow.vue'

const router = useRouter()
const loading = ref(true)
const recommendations = ref({
  comprehensive: [],
  trending: [],
  mixed: []
})

const fetchRecommendations = async () => {
  try {
    loading.value = true
    const res = await getAllRecommends({
      comprehensive_limit: 10,
      trending_limit: 10,
      mixed_limit: 10,
      trending_days: 7
    })
    
    if (res.data.code === 200) {
      recommendations.value = res.data.data
      await fetchAllLikeStatus()
    }
  } catch (err) {
    console.error('获取推荐失败:', err)
  } finally {
    loading.value = false
  }
}

const fetchAllLikeStatus = async () => {
  try {
    const allIds = [
      ...recommendations.value.comprehensive.map(c => c.id),
      ...recommendations.value.trending.map(c => c.id),
      ...recommendations.value.mixed.map(c => c.id)
    ]
    
    if (allIds.length === 0) return
    
    const res = await batchGetLikeStatus(allIds)
    const likedMap = res.data.data?.liked_map || {}
    
    // 更新每一行的点赞状态
    recommendations.value.comprehensive.forEach(char => {
      char.is_liked = likedMap[char.id] || false
    })
    recommendations.value.trending.forEach(char => {
      char.is_liked = likedMap[char.id] || false
    })
    recommendations.value.mixed.forEach(char => {
      char.is_liked = likedMap[char.id] || false
    })
  } catch (err) {
    console.error('获取点赞状态失败:', err)
  }
}

const toggleLike = async (char) => {
  const originalLiked = char.is_liked
  const originalCount = char.like_count || 0
  
  try {
    char.is_liked = !char.is_liked
    char.like_count = char.is_liked ? originalCount + 1 : Math.max(0, originalCount - 1)
    
    if (originalLiked) {
      await unlikeCharacter(char.id)
    } else {
      const res = await likeCharacter(char.id)
      if (res.data?.data?.like_count !== undefined) {
        char.like_count = res.data.data.like_count
      }
    }
  } catch (err) {
    char.is_liked = originalLiked
    char.like_count = originalCount
    console.error('点赞操作失败:', err)
    alert('操作失败：' + (err.response?.data?.msg || err.message))
  }
}

const goChat = (id) => {
  router.push(`/chat/${id}`)
}

const goToMore = (type) => {
  router.push(`/recommend/${type}`)
}

onMounted(() => {
  fetchRecommendations()
})
</script>

<style scoped>
.content {
  width: 1900px;
  /* min-height: 100vh; */
  background: #f5f6f8;
  overflow-y: auto;
  overflow-x: hidden;
}

.content-inner {
  max-width: 1700px;
  margin: 0 auto;
  padding: 24px 32px;
  width: 100%;
  box-sizing: border-box;
}

.title {
  font-size: 28px;
  font-weight: 700;
  margin-bottom: 32px;
  color: #1f2937;
}

.loading {
  text-align: center;
  padding: 60px;
  color: #999;
}

.spinner {
  display: inline-block;
  width: 40px;
  height: 40px;
  border: 3px solid #f3f3f3;
  border-top-color: #4096ff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.recommend-container {
  display: flex;
  flex-direction: column;
  gap: 48px;
  width: 100%;
}

/* 让滚动条在正确的位置 */
@media (max-width: 768px) {
  .content-inner {
    padding: 16px;
  }
  
  .title {
    font-size: 24px;
    margin-bottom: 24px;
  }
}
</style>