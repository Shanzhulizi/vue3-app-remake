import apiClient from './axios'



export const chat = (data) =>
  apiClient.post('/chat/send', data)


export const voiceChat = (formData) => 
  apiClient.post("/chat/voice_chat", formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    },
    timeout: 300000,
  
  });


