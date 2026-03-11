<template>
  <div class="voice-studio">

    <h1>声音创作测试1</h1>

    <!-- 上传声音 -->
    <div class="card">
      <h2>1 创建声音</h2>

      <input type="file" accept="audio/*" @change="onFileChange" />

      <button @click="createVoice">创建声音</button>

      <div v-if="voiceId">
        voice_id: {{ voiceId }}
      </div>
    </div>


    <!-- 生成语音 -->
    <div class="card">

      <h2>2 生成语音</h2>

      <textarea
        v-model="text"
        placeholder="输入要生成的文本"
      />

      <button @click="generateVoice">
        生成语音
      </button>

      <div v-if="audioUrl">

        <h3>播放</h3>

        <audio
          controls
          :src="audioUrl"
        />

      </div>

    </div>

  </div>
</template>

<script setup>

import { ref } from "vue"
import axios from "axios"

const file = ref(null)

const voiceId = ref("")

const text = ref("你好，我是你的AI角色")

const audioUrl = ref("")

function onFileChange(e) {

  file.value = e.target.files[0]

}

async function createVoice() {
  if (!file.value) {
    alert("请选择音频")
    return
  }

  const form = new FormData()
  
  form.append("name", "我的声音")  // 添加 name 字段
  form.append("audio", file.value)  // 改为 audio

  const res = await axios.post(
    "http://127.0.0.1:8000/api/xtts/create",
    form
  )

  if (res.data.code === 200) {
    voiceId.value = res.data.data.voice_id
  } else {
    alert(res.data.msg)
  }
}

async function generateVoice() {
  if (!voiceId.value) {
    alert("请先创建声音")
    return
  }

  const form = new FormData()
  form.append("text", text.value)
  form.append("voice_id", voiceId.value)

  const res = await axios.post(
    "http://127.0.0.1:8000/api/xtts/speak",
    form,
    {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    }
  )
    console.log(res.data)
  if (res.data.code === 200) {
    audioUrl.value = "http://127.0.0.1:8000" + res.data.data.audio_url
  } else {
    alert(res.data.msg)
  }
}

</script>


<style scoped>

.voice-studio{
  max-width:700px;
  margin:auto;
}

.card{
  border:1px solid #ddd;
  padding:20px;
  margin-bottom:20px;
}

textarea{
  width:100%;
  height:100px;
}

button{
  margin-top:10px;
}

</style>