// api/recommend.js
import apiClient from './axios'

// 获取热门推荐（基于总热度）
export const getHotRecommend = (params = {}) => {
  return apiClient.get('/recommend/hot', { params })
}

// 获取近期流行（基于近期互动量）
export const getPopularRecommend = (params = {}) => {
  return apiClient.get('/recommend/popular', { params })
}

// 获取近期飙升（基于增长率）
export const getTrendingRecommend = (params = {}) => {
  return apiClient.get('/recommend/trending', { params })
}

// 获取个性化推荐（猜你喜欢）
export const getPersonalizedRecommend = (params = {}) => {
  return apiClient.get('/recommend/pretend', { params })
}

// 获取向量推荐
export const getVectorRecommend = (params = {}) => {
  return apiClient.get('/recommend/pretend-vector', { params })
}

// 获取协同过滤推荐
export const getSimilarRecommend = (params = {}) => {
  return apiClient.get('/recommend/similar', { params })
}

// 获取混合推荐
export const getMixRecommend = (params = {}) => {
  return apiClient.get('/recommend/mix', { params })
}

// 8. 获取所有推荐（首页用）
export const getAllRecommends = async (params = {}) => {
  try {
    const [
      hotRes,
      popularRes,
      trendingRes,
      personalizedRes,
      vectorRes,
      similarRes,
      mixRes
    ] = await Promise.all([
      getHotRecommend({ limit: params.hot_limit || 10 }),
      getPopularRecommend({ limit: params.popular_limit || 10, hours: params.popular_hours || 168 }),
      getTrendingRecommend({ limit: params.trending_limit || 10, hours: params.trending_hours || 24 }),
      getPersonalizedRecommend({ limit: params.personalized_limit || 10, days: params.personalized_days || 30 }),
      getVectorRecommend({ limit: params.vector_limit || 10, days: params.vector_days || 30, threshold: params.vector_threshold || 0.1 }),
      getSimilarRecommend({ limit: params.similar_limit || 10, days: params.similar_days || 30 }),
      getMixRecommend({ limit: params.mix_limit || 10 })
    ])
    
    return {
      data: {
        code: 200,
        data: {
          hot: hotRes.data.data || [],
          popular: popularRes.data.data || [],
          trending: trendingRes.data.data || [],
          personalized: personalizedRes.data.data || [],
          vector: vectorRes.data.data || [],
          similar: similarRes.data.data || [],
          mix: mixRes.data.data || []
        }
      }
    }
  } catch (err) {
    console.error('获取所有推荐失败:', err)
    throw err
  }
}