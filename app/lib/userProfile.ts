import axios from 'axios'

export type AISettingsPayload = {
  provider: string
  baseUrl: string
  modelName: string
  apiKey: string
}

export type UserProfile = {
  username: string
  role?: string | null
  ai_settings: AISettingsPayload
}

export const OLLAMA_DEFAULTS: AISettingsPayload = {
  provider: 'ollama',
  baseUrl: 'http://localhost:11434/v1',  // ✅ /v1 required for OpenAI-compatible client
  modelName: 'llama3.2',
  apiKey: 'ollama',  // ✅ Ollama requires a non-empty string
}

export const providerLabel = (provider?: string) => {
  if (provider === 'ollama') return 'Ollama / Local'
  if (provider === 'openai') return 'OpenAI Compatible'
  if (provider === 'gemini') return 'Gemini'
  if (provider === 'custom') return 'Custom'
  return 'Ollama / Local'
}

export const syncAISettingsToLocalStorage = (settings: AISettingsPayload) => {
  localStorage.setItem('ai_provider', settings.provider ?? OLLAMA_DEFAULTS.provider)
  localStorage.setItem('ai_base_url', settings.baseUrl ?? OLLAMA_DEFAULTS.baseUrl)
  localStorage.setItem('ai_api_key', settings.apiKey ?? OLLAMA_DEFAULTS.apiKey)
  localStorage.setItem('ai_model', settings.modelName ?? OLLAMA_DEFAULTS.modelName)
}

export const loadUserProfile = async (token: string) => {
  const res = await axios.get<UserProfile>('http://localhost:8000/api/auth/me', {
    headers: { Authorization: `Bearer ${token}` },
  })

  const settings = { ...OLLAMA_DEFAULTS, ...res.data.ai_settings }
  syncAISettingsToLocalStorage(settings)

  return {
    ...res.data,
    ai_settings: settings,
  }
}