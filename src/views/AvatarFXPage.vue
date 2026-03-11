<template>
    <div class="avatarfx-page">
        <h1>AvatarFX</h1>
        <p>这是一个完全独立的页面</p>
    </div>
    <button @click="goback">返回主页</button>

</template>


<script setup>

import { useRouter } from 'vue-router'
const router = useRouter()
const goback = () => {
    router.push('/')
}
</script>
