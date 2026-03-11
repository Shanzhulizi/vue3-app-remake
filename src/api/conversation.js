import apiClient from './axios'



// export const getCharacters = () =>
//   apiClient.get('/characters/list')

export const getHistoryConversation = (character_id) =>
  apiClient.get(`/conversation/history/${character_id}`)