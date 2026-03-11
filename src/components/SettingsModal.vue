<template>
    
    <teleport to="body">
        <div class="mask" @click.self="close">
            <div class="modal">
                <!-- 关闭 -->
                <div class="close" @click="close">×</div>

                <!-- 左侧 -->
                <aside class="left">
                    <div class="menu-item" :class="{ active: tab === 'profile' }" @click="tab = 'profile'">
                        公开个人资料
                    </div>
                    <div class="menu-item" :class="{ active: tab === 'preference' }" @click="tab = 'preference'">
                        偏好设置
                    </div>
                </aside>

                <!-- 右侧 -->
                <main class="right">
                    <!-- 个人资料 -->
                    <section v-if="tab === 'profile'">
                        <h2>公开个人资料</h2>

                        <div class="avatar-row">
                            <div class="avatar" :style="{ background: avatarBg }">
                                {{ avatarChar }}
                            </div>
                            <button class="icon-btn">✎</button>
                        </div>

                        <div class="form-item">
                            <label>用户名</label>
                            <input v-model="form.username" maxlength="20" />
                            <span class="counter">{{ form.username.length }}/20</span>
                        </div>

                        <div class="form-item">
                            <label>显示名称</label>
                            <input v-model="form.displayName" maxlength="20" />
                            <span class="counter">{{ form.displayName.length }}/20</span>
                        </div>

                        <div class="form-item">
                            <label>简介</label>
                            <textarea v-model="form.bio" maxlength="500" />
                            <span class="counter">{{ form.bio.length }}/500</span>
                        </div>
                    </section>

                    <!-- 偏好设置 -->
                    <section v-else>
                        <h2>偏好设置</h2>

                        <div class="switch-item">
                            <span>深色模式</span>
                            <input type="checkbox" v-model="form.darkMode" />
                        </div>

                        <div class="switch-item">
                            <span>允许推荐内容</span>
                            <input type="checkbox" v-model="form.recommend" />
                        </div>
                    </section>
                </main>
            </div>
        </div>
    </teleport>
</template>
<script setup>
import { ref, computed } from 'vue'
import { useUserStore } from '@/stores/user'

const emit = defineEmits(['close'])
const close = () => emit('close')

const userStore = useUserStore()

const tab = ref('profile')

const form = ref({
    username: userStore.user?.username || '',
    displayName: userStore.user?.displayName || '',
    bio: userStore.user?.bio || '',
    darkMode: false,
    recommend: true,
})

/* 文字头像 */
const avatarChar = computed(() =>
    form.value.username ? form.value.username[0].toUpperCase() : '?'
)

const avatarBg = '#e6f089'
</script>
<style scoped>
.mask {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.2);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 999;
}

.modal {
    width: 720px;
    height: 520px;
    background: #ededee;
    border-radius: 16px;
    display: flex;
    position: relative;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
}

.close {
    position: absolute;
    right: 16px;
    top: 12px;
    font-size: 20px;
    cursor: pointer;
    color: #666;
}

/* 左侧 */
.left {
    width: 200px;
    padding: 16px;
    border-right: 1px solid #ddd;
}

.menu-item {
    padding: 10px 12px;
    border-radius: 10px;
    cursor: pointer;
    color: #444;
    margin-bottom: 6px;
}

.menu-item.active {
    background: #d8d8db;
    font-weight: 600;
}

/* 右侧 */
.right {
    flex: 1;
    padding: 24px 32px;
    overflow-y: auto;
}

h2 {
    margin-bottom: 20px;
}

/* 头像 */
.avatar-row {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 20px;
}

.avatar {
    width: 64px;
    height: 64px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 24px;
    font-weight: 600;
}

.icon-btn {
    border: none;
    background: #d8d8db;
    border-radius: 8px;
    padding: 6px 8px;
    cursor: pointer;
}

/* 表单 */
.form-item {
    position: relative;
    margin-bottom: 16px;
}

label {
    display: block;
    font-size: 13px;
    color: #666;
    margin-bottom: 6px;
}

input,
textarea {
    width: 100%;
    border: none;
    border-radius: 10px;
    padding: 10px 12px;
    background: #dedee1;
    outline: none;
}

textarea {
    min-height: 80px;
    resize: none;
}

.counter {
    position: absolute;
    right: 10px;
    bottom: 8px;
    font-size: 12px;
    color: #888;
}

/* 偏好 */
.switch-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 0;
    border-bottom: 1px solid #ddd;
}
</style>
