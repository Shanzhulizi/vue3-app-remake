<!-- components/LikeButton.vue -->
<template>
  <div class="like-button" :class="{ liked: isLiked }" @click.stop="toggleLike">
    <span class="heart">{{ isLiked ? '❤️' : '🤍' }}</span>
    <span class="count">{{ likeCount }}</span>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { likeCharacter, unlikeCharacter } from '@/api/like'

const props = defineProps({
  characterId: {
    type: [Number, String],
    required: true
  },
  initialLiked: {
    type: Boolean,
    default: false
  },
  initialCount: {
    type: Number,
    default: 0
  }
})

const emit = defineEmits(['update'])

const isLiked = ref(props.initialLiked)
const likeCount = ref(props.initialCount)
const loading = ref(false)

const toggleLike = async () => {
  if (loading.value) return
  
  loading.value = true
  try {
    if (isLiked.value) {
      await unlikeCharacter(props.characterId)
      likeCount.value -= 1
      isLiked.value = false
    } else {
      const res = await likeCharacter(props.characterId)
      likeCount.value = res.data.data.like_count
      isLiked.value = true
    }
    emit('update', {
      id: props.characterId,
      isLiked: isLiked.value,
      count: likeCount.value
    })
  } catch (err) {
    console.error('点赞操作失败:', err)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.like-button {
  position: absolute;
  bottom: 8px;
  right: 8px;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  border-radius: 20px;
  color: white;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
  z-index: 10;
}

.like-button:hover {
  background: rgba(0, 0, 0, 0.8);
  transform: scale(1.05);
}

.like-button.liked {
  background: #ff4d4f;
}

.like-button.liked:hover {
  background: #ff7875;
}

.heart {
  font-size: 16px;
  line-height: 1;
}

.count {
  font-weight: 500;
  min-width: 20px;
  text-align: center;
}
</style>