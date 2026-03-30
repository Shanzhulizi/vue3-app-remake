import apiClient from './axios'



// export const getCharacters = () =>
//   apiClient.get('/characters/list')

// export const getHistoryConversation = (character_id) =>
//   apiClient.get(`/conversation/history/${character_id}`)


export const getHistoryConversation = (characterId, page = 1, pageSize = 20) => {
  return apiClient.get(`/conversation/history/${characterId}`, {
    params: { page, page_size: pageSize }
  })
}