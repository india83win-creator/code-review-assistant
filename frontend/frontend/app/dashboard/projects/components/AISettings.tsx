'use client'
import { useState, useEffect } from 'react'
import axios from 'axios'
import { ArrowRight, Bot, CheckCircle2, Cpu, KeyRound, RotateCcw, Server, Sparkles } from 'lucide-react'
import { useToast } from '../../../components/ToastProvider'
import { loadUserProfile, OLLAMA_DEFAULTS, syncAISettingsToLocalStorage, type AISettingsPayload } from '../../../lib/userProfile'

export default function AISettings({ onSettingsSaved }: { onSettingsSaved?: (settings: AISettingsPayload) => void }) {
  const { notify } = useToast()
  const [baseUrl, setBaseUrl] = useState(OLLAMA_DEFAULTS.baseUrl)
  const [apiKey, setApiKey] = useState(OLLAMA_DEFAULTS.apiKey)
  const [model, setModel] = useState(OLLAMA_DEFAULTS.modelName)
  const [selectedProvider, setSelectedProvider] = useState(OLLAMA_DEFAULTS.provider)
  const [saving, setSaving] = useState(false)

  const providers = [
    {
      id: 'ollama',
      name: 'Ollama',
      description: 'Local models with a private endpoint',
      baseUrl: OLLAMA_DEFAULTS.baseUrl,
      model: OLLAMA_DEFAULTS.modelName,
      icon: Cpu,
    },
    {
      id: 'openai',
      name: 'OpenAI Compatible',
      description: 'Use an OpenAI-style API provider',
      baseUrl: 'https://api.openai.com/v1',
      model: 'gpt-4o-mini',
      icon: Bot,
    },
    {
      id: 'gemini',
      name: 'Gemini',
      description: 'Google AI with OpenAI-compatible endpoint',
      baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai/',
      model: 'gemini-2.5-flash',
      icon: Sparkles,
    },
    {
      id: 'custom',
      name: 'Custom',
      description: 'Bring your own hosted AI endpoint',
      baseUrl: 'https://your-domain.com/v1',
      model: 'custom-model',
      icon: Server,
    },
  ]

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) return

    void loadUserProfile(token)
      .then((profile) => {
        setSelectedProvider(profile.ai_settings.provider)
        setBaseUrl(profile.ai_settings.baseUrl)
        setApiKey(profile.ai_settings.apiKey)
        setModel(profile.ai_settings.modelName)
      })
      .catch((err) => console.error(err))
  }, [])

  const persistSettings = async (settings: AISettingsPayload) => {
    const token = localStorage.getItem('token')
    if (!token) {
      notify('Failed to save settings. Please try again.', 'error')
      return false
    }

    setSaving(true)
    try {
      await axios.put('http://localhost:8000/api/auth/settings', settings, {
        headers: { Authorization: `Bearer ${token}` },
      })
      syncAISettingsToLocalStorage(settings)
      onSettingsSaved?.(settings)
      notify('Settings saved successfully ✓')
      return true
    } catch (err) {
      console.error(err)
      notify('Failed to save settings. Please try again.', 'error')
      return false
    } finally {
      setSaving(false)
    }
  }

  const saveSettings = async () => {
    await persistSettings({
      provider: selectedProvider,
      baseUrl,
      modelName: model,
      apiKey,
    })
  }

  const applyProvider = (provider: typeof providers[number]) => {
    setSelectedProvider(provider.id)
    setBaseUrl(provider.baseUrl)
    setModel(provider.model)
    setApiKey('')  // ← clears stale API key when switching providers
  }

  const resetToDefaults = async () => {
    setSelectedProvider(OLLAMA_DEFAULTS.provider)
    setBaseUrl(OLLAMA_DEFAULTS.baseUrl)
    setModel(OLLAMA_DEFAULTS.modelName)
    setApiKey(OLLAMA_DEFAULTS.apiKey)
    await persistSettings(OLLAMA_DEFAULTS)
  }

  return (
    <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-2xl shadow-slate-950/30 backdrop-blur-xl">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.22em] text-cyan-300/80">AI provider settings</p>
          <h2 className="mt-2 font-display text-2xl font-semibold text-white">Connect your preferred model endpoint</h2>
        </div>

        <div className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-slate-950/60 px-3 py-2 text-sm text-slate-400">
          <KeyRound className="h-4 w-4" />
          Synced to your account
        </div>
      </div>

      <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {providers.map((provider) => (
          <button
            key={provider.id}
            onClick={() => applyProvider(provider)}
            className={`rounded-2xl border p-4 text-left transition ${selectedProvider === provider.id ? 'border-cyan-400/30 bg-cyan-400/10 shadow-lg shadow-cyan-950/10' : 'border-white/10 bg-slate-950/50 hover:border-white/20 hover:bg-slate-950/80'}`}
          >
            <div className="flex items-center justify-between gap-3">
              <provider.icon className="h-5 w-5 text-cyan-300" />
              {selectedProvider === provider.id && <CheckCircle2 className="h-4 w-4 text-emerald-300" />}
            </div>
            <h3 className="mt-4 font-display text-lg font-semibold text-white">{provider.name}</h3>
            <p className="mt-2 text-sm leading-6 text-slate-400">{provider.description}</p>
          </button>
        ))}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <label className="block lg:col-span-1">
          <span className="mb-2 block text-xs uppercase tracking-[0.22em] text-slate-400">Base URL</span>
          <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3">
            <Server className="h-4 w-4 text-cyan-300" />
            <input
              type="text"
              placeholder="Base URL"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
            />
          </div>
        </label>

        <label className="block lg:col-span-1">
          <span className="mb-2 block text-xs uppercase tracking-[0.22em] text-slate-400">API Key</span>
          <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3">
            <KeyRound className="h-4 w-4 text-cyan-300" />
            <input
              type="text"
              placeholder="API Key"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
            />
          </div>
        </label>

        <label className="block lg:col-span-1">
          <span className="mb-2 block text-xs uppercase tracking-[0.22em] text-slate-400">Model name</span>
          <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3">
            <Sparkles className="h-4 w-4 text-cyan-300" />
            <input
              type="text"
              placeholder="Model Name"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
            />
          </div>
        </label>
      </div>

      <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-slate-400">
          These settings are used by file review and chat requests.
        </p>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={resetToDefaults}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-5 py-3 font-semibold text-slate-200 transition hover:border-cyan-400/30 hover:bg-cyan-400/10 hover:text-white"
          >
            <RotateCcw className="h-4 w-4" />
            Reset to defaults
          </button>
          <button
            onClick={saveSettings}
            disabled={saving}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-400 to-indigo-400 px-5 py-3 font-semibold text-slate-950 transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <ArrowRight className="h-4 w-4" />
            {saving ? 'Saving...' : 'Save settings'}
          </button>
        </div>
      </div>
    </div>
  )
}