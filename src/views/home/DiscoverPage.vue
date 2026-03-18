<template>
  <main class="content">
    <div class="content-inner">
      <h2 class="title">角色推荐</h2>
      
      <div v-if="loading" class="loading">
        <div class="spinner"></div>
        <p>加载推荐中...</p>
      </div>

      <div v-else class="recommend-container">
        <!-- 1. 热门推荐 -->
        <RecommendRow
          type="hot"
          :items="recommendations.hot"
          title="🔥 热门推荐"
          desc="总热度最高的角色"
          @click-more="goToMore('hot')"
          @click-item="goChat"
          @toggle-like="toggleLike"
        />
        
        <!-- 2. 近期流行 -->
        <RecommendRow
          type="popular"
          :items="recommendations.popular"
          title="📈 近期流行"
          desc="最近7天最受欢迎"
          @click-more="goToMore('popular')"
          @click-item="goChat"
          @toggle-like="toggleLike"
        />
        
        <!-- 3. 近期飙升 -->
        <RecommendRow
          type="trending"
          :items="recommendations.trending"
          title="⚡ 近期飙升"
          desc="最近24小时飙升最快"
          @click-more="goToMore('trending')"
          @click-item="goChat"
          @toggle-like="toggleLike"
        />
        
        <!-- 4. 个性化推荐 -->
        <RecommendRow
         
          type="personalized"
          :items="recommendations.personalized"
          title="🎯 猜你喜欢"
          desc="根据你的偏好推荐"
          @click-more="goToMore('personalized')"
          @click-item="goChat"
          @toggle-like="toggleLike"
        />
        
        <!-- 5. 向量推荐 -->
        <RecommendRow
         
          type="vector"
          :items="recommendations.vector"
          title="🧠 智能推荐"
          desc="基于向量相似度"
          @click-more="goToMore('vector')"
          @click-item="goChat"
          @toggle-like="toggleLike"
        />
        
        <!-- 6. 协同过滤 -->
        <RecommendRow
          
          type="similar"
          :items="recommendations.similar"
          title="👥 相似用户喜欢"
          desc="和你品味相投的人也在聊"
          @click-more="goToMore('similar')"
          @click-item="goChat"
          @toggle-like="toggleLike"
        />
        
        <!-- 7. 混合推荐 -->
        <RecommendRow
          type="mix"
          :items="recommendations.mix"
          title="🎲 混合推荐"
          desc="多种算法综合推荐"
          @click-more="goToMore('mix')"
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
  hot: [],
  popular: [],
  trending: [],
  personalized: [],
  vector: [],
  similar: [],
  mix: []
})

const fetchRecommendations = async () => {
  try {
    loading.value = true
    const res = await getAllRecommends({
      hot_limit: 10,
      popular_limit: 10,
      trending_limit: 10,
      personalized_limit: 10,
      vector_limit: 10,
      similar_limit: 10,
      mix_limit: 10,
      popular_hours: 168,
      trending_hours: 24,
      personalized_days: 30,
      vector_days: 30,
      vector_threshold: 0.1,
      similar_days: 30
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
      ...recommendations.value.hot.map(c => c.id),
      ...recommendations.value.popular.map(c => c.id),
      ...recommendations.value.trending.map(c => c.id),
      ...recommendations.value.personalized.map(c => c.id),
      ...recommendations.value.vector.map(c => c.id),
      ...recommendations.value.similar.map(c => c.id),
      ...recommendations.value.mix.map(c => c.id)
    ]
    
    if (allIds.length === 0) return
    
    const res = await batchGetLikeStatus(allIds)
    const likedMap = res.data.data?.liked_map || {}
    
    Object.keys(recommendations.value).forEach(key => {
      recommendations.value[key].forEach(char => {
        char.is_liked = likedMap[char.id] || false
      })
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