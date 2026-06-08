'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import AppShell from '../components/AppShell'
import AISettings from '../dashboard/projects/components/AISettings'
import { loadUserProfile, providerLabel, type AISettingsPayload } from '../lib/userProfile'

export default function AISettingsPage() {
  const router = useRouter()
  const [username, setUsername] = useState('Member')
  const [role, setRole] = useState<string | null>(null)
  const [aiProvider, setAiProvider] = useState('Ollama / Local')

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
      return
    }

    void loadUserProfile(token)
      .then((profile) => {
        setUsername(profile.username || 'Member')
        setRole(profile.role || null)
        setAiProvider(providerLabel(profile.ai_settings.provider))
      })
      .catch((err) => console.error(err))
  }, [router])

  const handleSettingsSaved = (settings: AISettingsPayload) => {
    setAiProvider(providerLabel(settings.provider))
  }

  return (
    <AppShell username={username} role={role} aiProvider={aiProvider}>
      <div className="animate-[fadeIn_280ms_ease-out]">
        <AISettings onSettingsSaved={handleSettingsSaved} />
      </div>
    </AppShell>
  )
}
