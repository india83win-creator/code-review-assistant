'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import { ArrowRight, FolderCode, History } from 'lucide-react'
import AppShell from '../components/AppShell'
import { useToast } from '../components/ToastProvider'
import { loadUserProfile, providerLabel } from '../lib/userProfile'

type Project = {
  id: number
  name: string
  description?: string
}

export default function ReviewsPage() {
  const router = useRouter()
  const { notify } = useToast()
  const [username, setUsername] = useState('Member')
  const [role, setRole] = useState<string | null>(null)
  const [aiProvider, setAiProvider] = useState('Ollama / Local')
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)

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

    axios
      .get('https://code-review-assistant-api-i4ws.onrender.com/api/projects/', {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setProjects(res.data))
      .catch((err) => {
        console.error(err)
        notify('Could not load review workspaces.', 'error')
      })
      .finally(() => setLoading(false))
  }, [notify, router])

  return (
    <AppShell username={username} role={role} aiProvider={aiProvider}>
      <div className="animate-[fadeIn_280ms_ease-out] rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-2xl shadow-slate-950/30 backdrop-blur-xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.22em] text-cyan-300/80">Reviews</p>
            <h1 className="mt-2 font-display text-3xl font-semibold text-white">Review history by workspace</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
              Open a project to inspect its review timeline, selected findings, and recommendations.
            </p>
          </div>
          <History className="h-10 w-10 text-cyan-300" />
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {loading &&
            Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="h-36 animate-pulse rounded-2xl border border-white/10 bg-white/10" />
            ))}

          {!loading && projects.length === 0 && (
            <div className="md:col-span-2 xl:col-span-3 rounded-2xl border border-dashed border-white/10 bg-slate-950/40 px-6 py-14 text-center text-slate-400">
              No projects yet. Create a project before running reviews.
            </div>
          )}

          {!loading &&
            projects.map((project) => (
              <button
                key={project.id}
                onClick={() => router.push(`/dashboard/projects?id=${project.id}&name=${encodeURIComponent(project.name)}`)}
                className="group rounded-2xl border border-white/10 bg-slate-950/50 p-5 text-left transition duration-200 hover:-translate-y-0.5 hover:border-cyan-400/25 hover:bg-slate-950/80 hover:shadow-[0_18px_50px_rgba(8,15,38,0.5)]"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-400/15 text-cyan-200">
                      <FolderCode className="h-5 w-5" />
                    </div>
                    <div>
                      <h2 className="font-display text-lg font-semibold text-white">{project.name}</h2>
                      <p className="mt-1 line-clamp-2 text-sm text-slate-400">{project.description || 'Open review timeline'}</p>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-slate-500 transition group-hover:translate-x-0.5 group-hover:text-cyan-200" />
                </div>
              </button>
            ))}
        </div>
      </div>
    </AppShell>
  )
}
