import apiClient from './axios'



export const chat = (data) =>
  apiClient.post('/chat/send', data)


export const voiceChat = (formData) => 
  apiClient.post("/chat/voice", formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });



export const tts = (data) =>
  apiClient.post("/voice/tts", data)


