'use client'

/* eslint-disable react-hooks/set-state-in-effect */

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import { ArrowRight, Bot, CalendarDays, CheckCircle2, FileCode2, FolderCode, GitBranch, History, Shield, Sparkles, X } from 'lucide-react'
import AppShell from '../components/AppShell'
import AnimatedCounter from '../components/AnimatedCounter'
import { useToast } from '../components/ToastProvider'
import { loadUserProfile, providerLabel } from '../lib/userProfile'

type Project = {
  id: number
  name: string
  description?: string
  created_at: string
  fileCount?: number
  reviewCount?: number
  lastReviewAt?: string | null
}

type ReviewEntry = {
  id: number
  created_at: string
}

const API_BASE = 'https://code-review-assistant-api-i4ws.onrender.com/api'

export default function Dashboard() {
  const router = useRouter()
  const { notify } = useToast()
  const [username, setUsername] = useState('')
  const [projects, setProjects] = useState<Project[]>([])
  const [newProject, setNewProject] = useState({ name: '', description: ''})
  const [creating, setCreating] = useState(false)
  const [loadingProjects, setLoadingProjects] = useState(true)
  const [token, setToken] = useState('')
  const [search, setSearch] = useState('')
  const [role, setRole] = useState<string | null>(null)
  const [aiProvider, setAiProvider] = useState('Ollama / Local')
  const [onboardingStep, setOnboardingStep] = useState(0)
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [onboardingDismissing, setOnboardingDismissing] = useState(false)

  const authHeaders = useCallback(
    (authToken = token) => ({ Authorization: `Bearer ${authToken}` }),
    [token]
  )

  const fetchProjects = useCallback(
    async (authToken: string) => {
      setLoadingProjects(true)
      try {
        const res = await axios.get(`${API_BASE}/projects/`, {
          headers: authHeaders(authToken),
        })

        const enrichedProjects = await Promise.all(
          (res.data as Project[]).map(async (project) => {
            const [filesRes, reviewsRes] = await Promise.allSettled([
              axios.get(`${API_BASE}/files/${project.id}`, { headers: authHeaders(authToken) }),
              axios.get(`${API_BASE}/reviews/${project.id}`, { headers: authHeaders(authToken) }),
            ])

            const files = filesRes.status === 'fulfilled' && Array.isArray(filesRes.value.data) ? filesRes.value.data : []
            const reviews = reviewsRes.status === 'fulfilled' && Array.isArray(reviewsRes.value.data) ? (reviewsRes.value.data as ReviewEntry[]) : []

            return {
              ...project,
              fileCount: files.length,
              reviewCount: reviews.length,
              lastReviewAt: reviews[0]?.created_at || null,
            }
          })
        )

        setProjects(enrichedProjects)
      } catch (err) {
        console.error(err)
        notify('Could not load projects. Check that the backend is running.', 'error')
      } finally {
        setLoadingProjects(false)
      }
    },
    [authHeaders, notify]
  )

  useEffect(() => {
    const savedToken = localStorage.getItem('token')
    if (!savedToken) {
      router.push('/login')
      return
    }

    setToken(savedToken)
    void loadUserProfile(savedToken)
      .then((profile) => {
        setUsername(profile.username || 'Member')
        setRole(profile.role || null)
        setAiProvider(providerLabel(profile.ai_settings.provider))
      })
      .catch((err) => console.error(err))

    setShowOnboarding(localStorage.getItem('onboardingDismissed') !== 'true')
    void fetchProjects(savedToken)
  }, [fetchProjects, router])

  const createProject = async () => {
    if (!newProject.name.trim()) {
      notify('Project name is required.', 'error')
      return
    }

    setCreating(true)
    try {
      const description = newProject.description.trim()
   

      await axios.post(
        `${API_BASE}/projects/`,
        { name: newProject.name.trim(), description },
        { headers: authHeaders() }
      )

      setNewProject({ name: '', description: '' })
      await fetchProjects(token)
      notify('Project created successfully.')
    } catch (err) {
      console.error(err)
      notify('Project creation failed.', 'error')
    } finally {
      setCreating(false)
    }
  }

  const deleteProject = async (id: number) => {
    try {
      await axios.delete(`${API_BASE}/projects/${id}`, {
        headers: authHeaders(),
      })
      await fetchProjects(token)
      notify('Project deleted.')
    } catch (err) {
      console.error(err)
      notify('Could not delete project.', 'error')
    }
  }

  const filteredProjects = useMemo(
    () =>
      projects.filter((project) =>
        `${project.name} ${project.description}`.toLowerCase().includes(search.toLowerCase())
      ),
    [projects, search]
  )

  const recentActivity = useMemo(() => {
    const created = projects.map((project) => ({
      id: `project-${project.id}`,
      title: `${project.name} created`,
      detail: `${project.fileCount || 0} files linked`,
      date: project.created_at,
    }))

    const reviewed = projects
      .filter((project) => project.lastReviewAt)
      .map((project) => ({
        id: `review-${project.id}`,
        title: `${project.name} reviewed`,
        detail: `${project.reviewCount || 0} total reviews`,
        date: project.lastReviewAt || project.created_at,
      }))

    return [...created, ...reviewed]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5)
  }, [projects])

  const onboarding = [
    {
      title: 'Create a workspace',
      body: 'Start with a project name and optional GitHub URL, then upload source files inside the project workspace.',
    },
    {
      title: 'Run focused reviews',
      body: 'Open a workspace to review a file or the full project with security, performance, or quality modes.',
    },
    {
      title: 'Tune the model',
      body: 'Use AI Settings to switch between Ollama, Gemini, OpenAI-compatible, or custom endpoints.',
    },
  ]
  const isFinalOnboardingStep = onboardingStep === onboarding.length - 1
  const onboardingProgress = `${((onboardingStep + 1) / onboarding.length) * 100}%`

  const dismissOnboarding = () => {
    localStorage.setItem('onboardingDismissed', 'true')
    setOnboardingDismissing(true)
    window.setTimeout(() => {
      setShowOnboarding(false)
      setOnboardingDismissing(false)
    }, 220)
  }

  const advanceOnboarding = () => {
    if (isFinalOnboardingStep) {
      dismissOnboarding()
      return
    }
    setOnboardingStep((step) => Math.min(step + 1, onboarding.length - 1))
  }

  const healthFor = (project: Project) => {
    const reviews = project.reviewCount || 0
    const files = project.fileCount || 0
    if (reviews > 0 && files > 0) return { label: 'Healthy', className: 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200' }
    if (files > 0) return { label: 'Needs review', className: 'border-amber-400/30 bg-amber-400/10 text-amber-200' }
    return { label: 'Setup needed', className: 'border-rose-400/30 bg-rose-400/10 text-rose-200' }
  }

  const formatDate = (value?: string | null) => {
    if (!value) return 'None yet'
    return new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  return (
    <AppShell username={username} role={role} aiProvider={aiProvider}>
      <div className="animate-[fadeIn_280ms_ease-out]">
        <section className="overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-slate-900/95 via-slate-900/70 to-slate-950 p-6 shadow-[0_24px_90px_rgba(2,6,23,0.45)] backdrop-blur-xl sm:p-8">
          <div className="grid gap-7 xl:grid-cols-[minmax(0,1.2fr)_minmax(360px,0.8fr)] xl:items-end">
            <div className="max-w-3xl space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-xs font-medium uppercase tracking-[0.28em] text-cyan-200">
                <Sparkles className="h-3.5 w-3.5" />
                AI Code Review Assistant
              </div>
              <h1 className="font-display text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                Manage every review from a high-trust engineering workspace.
              </h1>
              <p className="max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">
                Create projects, upload code, run AI reviews, and keep a crisp trail of what changed across your workspace.
              </p>
            </div>

            <div className="grid min-w-0 gap-3 sm:grid-cols-2">
              {[
                { label: 'Projects', value: projects.length, icon: FolderCode },
                { label: 'Active user', value: username || 'Guest', icon: Bot },
                { label: 'AI provider', value: aiProvider, icon: Shield },
                { label: 'Workspace', value: 'Production-ready', icon: CheckCircle2 },
              ].map((stat) => (
                <div key={stat.label} className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-lg shadow-slate-950/20 backdrop-blur transition duration-200 hover:-translate-y-0.5 hover:border-cyan-400/20 hover:shadow-cyan-950/20">
                  <div className="flex items-center justify-between gap-4 text-slate-400">
                    <p className="text-sm">{stat.label}</p>
                    <stat.icon className="h-4 w-4 text-cyan-300" />
                  </div>
                  <p className="mt-3 break-words font-display text-xl font-semibold text-white">
                    {typeof stat.value === 'number' ? <AnimatedCounter value={stat.value} /> : stat.value}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
          <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-2xl shadow-slate-950/30 backdrop-blur-xl transition duration-200 hover:-translate-y-0.5 hover:border-white/15">
            <div>
              <p className="text-sm uppercase tracking-[0.22em] text-cyan-300/80">Projects</p>
              <h2 className="mt-2 font-display text-2xl font-semibold text-white">Create a new workspace</h2>
            </div>

            <div className="mt-5 grid gap-3 lg:grid-cols-2">
              <input
                className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-400/50"
                placeholder="Project name"
                value={newProject.name}
                onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
              />
              
              <input
                className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-400/50 lg:col-span-2"
                placeholder="Description (optional)"
                value={newProject.description}
                onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
              />
              <button
                onClick={createProject}
                disabled={creating}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-cyan-400 px-5 py-3 font-semibold text-slate-950 shadow-lg shadow-cyan-500/20 transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-60 lg:col-span-2"
              >
                {creating ? 'Creating...' : 'Create project'}
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-2xl shadow-slate-950/30 backdrop-blur-xl">
            <p className="text-sm uppercase tracking-[0.22em] text-cyan-300/80">Recent activity</p>
            <h2 className="mt-2 font-display text-2xl font-semibold text-white">Workspace pulse</h2>
            <div className="mt-5 space-y-3">
              {loadingProjects ? (
                Array.from({ length: 3 }).map((_, index) => <div key={index} className="h-16 animate-pulse rounded-2xl bg-white/10" />)
              ) : recentActivity.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-white/10 bg-slate-950/40 px-5 py-8 text-center text-sm text-slate-400">
                  Activity will appear after you create projects and run reviews.
                </div>
              ) : (
                recentActivity.map((item) => (
                  <div key={item.id} className="rounded-2xl border border-white/10 bg-slate-950/50 p-4 transition duration-200 hover:-translate-y-0.5 hover:border-cyan-400/20">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium text-white">{item.title}</p>
                        <p className="mt-1 text-sm text-slate-400">{item.detail}</p>
                      </div>
                      <History className="h-4 w-4 text-cyan-300" />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>

        <section className="mt-6 rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-2xl shadow-slate-950/30 backdrop-blur-xl">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.22em] text-cyan-300/80">Project list</p>
              <h2 className="mt-2 font-display text-2xl font-semibold text-white">Recent workspaces</h2>
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {loadingProjects &&
              Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="h-64 animate-pulse rounded-2xl border border-white/10 bg-white/10" />
              ))}

            {!loadingProjects && filteredProjects.length === 0 && (
              <div className="md:col-span-2 xl:col-span-3">
                <div className="rounded-2xl border border-dashed border-white/10 bg-slate-950/40 px-6 py-14 text-center text-slate-400">
                  <FolderCode className="mx-auto h-12 w-12 text-cyan-300/70" />
                  <p className="mt-4 font-display text-xl font-semibold text-white">No projects yet</p>
                  <p className="mt-2 text-sm">Create your first workspace above to begin reviewing code.</p>
                </div>
              </div>
            )}

            {!loadingProjects &&
              filteredProjects.map((project) => {
                const health = healthFor(project)
                return (
                  <article key={project.id} className="group flex min-h-64 flex-col rounded-2xl border border-white/10 bg-slate-950/50 p-5 transition duration-200 hover:-translate-y-0.5 hover:border-cyan-400/25 hover:bg-slate-950/80 hover:shadow-[0_18px_50px_rgba(8,15,38,0.5)]">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-cyan-400/15 text-cyan-200">
                          <FolderCode className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="truncate font-display text-lg font-semibold text-white">{project.name}</h3>
                          <p className="mt-1 line-clamp-2 text-sm text-slate-400">{project.description || 'No description provided'}</p>
                        </div>
                      </div>
                      <span className={`shrink-0 rounded-full border px-3 py-1 text-xs font-semibold ${health.className}`}>
                        {health.label}
                      </span>
                    </div>

                    <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
                      <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                        <FileCode2 className="h-4 w-4 text-cyan-300" />
                        <p className="mt-2 text-slate-400">Files</p>
                        <p className="font-display text-xl text-white">{project.fileCount || 0}</p>
                      </div>
                      <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                        <History className="h-4 w-4 text-cyan-300" />
                        <p className="mt-2 text-slate-400">Reviews</p>
                        <p className="font-display text-xl text-white">{project.reviewCount || 0}</p>
                      </div>
                      <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                        <CalendarDays className="h-4 w-4 text-cyan-300" />
                        <p className="mt-2 text-slate-400">Created</p>
                        <p className="text-white">{formatDate(project.created_at)}</p>
                      </div>
                      <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                        <Sparkles className="h-4 w-4 text-cyan-300" />
                        <p className="mt-2 text-slate-400">Last review</p>
                        <p className="text-white">{formatDate(project.lastReviewAt)}</p>
                      </div>
                    </div>

                    <div className="mt-auto flex items-center gap-3 pt-5">
                      <button
                        onClick={() => router.push(`/dashboard/projects?id=${project.id}&name=${encodeURIComponent(project.name)}`)}
                        className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-cyan-400 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:scale-[1.01]"
                      >
                        Open
                        <ArrowRight className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => deleteProject(project.id)}
                        className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-slate-200 transition hover:border-rose-400/30 hover:bg-rose-400/10 hover:text-rose-200"
                      >
                        Delete
                      </button>
                    </div>
                  </article>
                )
              })}
          </div>
        </section>

        {showOnboarding && (
          <div className={`fixed bottom-5 right-5 z-30 hidden w-[min(360px,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-cyan-400/20 bg-slate-950/90 p-4 shadow-2xl shadow-cyan-950/30 backdrop-blur-xl md:block ${onboardingDismissing ? 'animate-[onboardingFadeOut_220ms_ease-in_forwards]' : 'animate-[onboardingSlideIn_320ms_ease-out]'}`}>
            <div className="absolute left-0 top-0 h-1 w-full bg-white/10">
              <div className="h-full bg-cyan-400 shadow-[0_0_18px_rgba(0,212,255,0.55)] transition-all duration-300" style={{ width: onboardingProgress }} />
            </div>

            <div className="flex items-start justify-between gap-4 pt-2">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-cyan-300">Step {onboardingStep + 1} of {onboarding.length}</p>
                <h3 className="mt-2 font-display text-lg font-semibold text-white">{onboarding[onboardingStep].title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-300">{onboarding[onboardingStep].body}</p>
              </div>
              <button type="button" aria-label="Dismiss onboarding" onClick={dismissOnboarding}
                className="rounded-full p-1 text-slate-400 transition hover:bg-white/10 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 flex items-center gap-2">
              {onboarding.map((step) => (
                <span key={step.title}
                  className={`h-2 rounded-full transition-all duration-300 ${onboarding[onboardingStep].title === step.title ? 'w-6 bg-cyan-300 shadow-[0_0_12px_rgba(0,212,255,0.6)]' : 'w-2 bg-slate-600'}`}
                />
              ))}
            </div>

            <div className="mt-4 flex items-center justify-between gap-3">
              <button type="button" onClick={dismissOnboarding}
                className="text-sm font-medium text-slate-400 transition hover:text-cyan-200">
                Skip all
              </button>
              <button type="button" onClick={advanceOnboarding}
                className="inline-flex items-center justify-center rounded-2xl border border-cyan-400/25 bg-cyan-400/10 px-4 py-3 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-400/15">
                {isFinalOnboardingStep ? 'Get started →' : 'Next tip'}
              </button>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  )
}