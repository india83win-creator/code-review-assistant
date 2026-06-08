'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  Bot,
  Brain,
  Code2,
  ExternalLink,
  GitBranch,
  Globe,
  Layers,
  Rocket,
  Satellite,
  Shield,
  Sparkles,
  Terminal,
  Zap,
} from 'lucide-react'
import AppShell from '../components/AppShell'
import { loadUserProfile, providerLabel } from '../lib/userProfile'

const techStack = [
  { name: 'Python', color: 'text-yellow-300 border-yellow-400/20 bg-yellow-400/10' },
  { name: 'C++', color: 'text-blue-300 border-blue-400/20 bg-blue-400/10' },
  { name: 'JavaScript', color: 'text-yellow-200 border-yellow-300/20 bg-yellow-300/10' },
  { name: 'TypeScript', color: 'text-sky-300 border-sky-400/20 bg-sky-400/10' },
  { name: 'React', color: 'text-cyan-300 border-cyan-400/20 bg-cyan-400/10' },
  { name: 'Next.js', color: 'text-white border-white/20 bg-white/10' },
  { name: 'FastAPI', color: 'text-emerald-300 border-emerald-400/20 bg-emerald-400/10' },
  { name: 'PostgreSQL', color: 'text-indigo-300 border-indigo-400/20 bg-indigo-400/10' },
  { name: 'Git & GitHub', color: 'text-orange-300 border-orange-400/20 bg-orange-400/10' },
  { name: 'Artificial Intelligence', color: 'text-violet-300 border-violet-400/20 bg-violet-400/10' },
  { name: 'Machine Learning', color: 'text-pink-300 border-pink-400/20 bg-pink-400/10' },
]

const interests = [
  { label: 'Software Engineering', icon: Code2 },
  { label: 'Artificial Intelligence', icon: Brain },
  { label: 'Machine Learning', icon: Sparkles },
  { label: 'Full Stack Development', icon: Layers },
  { label: 'Developer Tools', icon: Terminal },
  { label: 'Open Source Software', icon: Globe },
  { label: 'Defense Technology', icon: Shield },
  { label: 'Space Technology', icon: Satellite },
]

export default function AboutPage() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [role, setRole] = useState<string | null>(null)
  const [aiProvider, setAiProvider] = useState('Ollama / Local')

  useEffect(() => {
    const savedToken = localStorage.getItem('token')
    if (!savedToken) {
      router.push('/login')
      return
    }

    void loadUserProfile(savedToken)
      .then((profile) => {
        setUsername(profile.username || 'Member')
        setRole(profile.role || null)
        setAiProvider(providerLabel(profile.ai_settings.provider))
      })
      .catch((err) => console.error(err))
  }, [router])

  return (
    <AppShell username={username} role={role} aiProvider={aiProvider}>
      <div className="animate-[fadeIn_280ms_ease-out] mx-auto max-w-4xl">

        {/* Back button */}
        <Link
          href="/dashboard"
          className="mb-6 inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-slate-300 transition hover:border-cyan-400/20 hover:bg-cyan-400/5 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>

        {/* Hero section */}
        <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-slate-900/60 p-8 shadow-[0_32px_120px_rgba(2,6,23,0.75)] backdrop-blur-xl sm:p-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(56,189,248,0.18),_transparent_35%),radial-gradient(circle_at_bottom_left,_rgba(139,92,246,0.15),_transparent_30%)]" />

          <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:gap-8">
            {/* Avatar */}
            <div className="relative shrink-0">
              <div className="flex h-24 w-24 items-center justify-center rounded-[1.5rem] bg-gradient-to-br from-cyan-400 to-indigo-500 text-3xl font-bold text-slate-950 shadow-[0_0_40px_rgba(34,211,238,0.3)]">
                D
              </div>
              <div className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full border border-white/10 bg-slate-900 shadow-lg">
                <Bot className="h-3.5 w-3.5 text-cyan-300" />
              </div>
            </div>

            {/* Info */}
            <div className="flex-1 space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1.5 text-xs font-medium uppercase tracking-[0.24em] text-cyan-200">
                <Sparkles className="h-3 w-3" />
                Developer Profile
              </div>
              <h1 className="font-display text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                Dhananjay Baral
              </h1>
              <p className="text-base text-cyan-300/80 tracking-wide">
                Software Engineering & AI Enthusiast
              </p>
            </div>
          </div>
        </section>

        {/* About */}
        <section className="mt-6 rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-2xl shadow-slate-950/30 backdrop-blur-xl sm:p-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-400/10 text-cyan-300">
              <Zap className="h-4 w-4" />
            </div>
            <p className="text-sm uppercase tracking-[0.22em] text-cyan-300/80">About</p>
          </div>
          <p className="text-base leading-8 text-slate-300">
            Passionate about building intelligent software systems, AI-powered developer tools, and modern web applications. Focused on combining software engineering principles with artificial intelligence to create practical solutions that improve developer productivity and software quality.
          </p>
        </section>

        {/* Current Focus & Philosophy */}
        <div className="mt-6 grid gap-6 sm:grid-cols-2">
          <section className="rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-2xl shadow-slate-950/30 backdrop-blur-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-400/10 text-emerald-300">
                <Rocket className="h-4 w-4" />
              </div>
              <p className="text-sm uppercase tracking-[0.22em] text-cyan-300/80">Current Focus</p>
            </div>
            <p className="text-sm leading-7 text-slate-300">
              Building AI-powered software products, contributing to technical projects, and continuously expanding expertise in modern software engineering and intelligent systems.
            </p>
          </section>

          <section className="rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-2xl shadow-slate-950/30 backdrop-blur-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-400/10 text-violet-300">
                <Brain className="h-4 w-4" />
              </div>
              <p className="text-sm uppercase tracking-[0.22em] text-cyan-300/80">Philosophy</p>
            </div>
            <p className="text-sm leading-7 text-slate-300">
              Great software is built through strong engineering fundamentals, continuous learning, and solving real-world problems with practical technology.
            </p>
          </section>
        </div>

        {/* Tech Stack */}
        <section className="mt-6 rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-2xl shadow-slate-950/30 backdrop-blur-xl sm:p-8">
          <div className="flex items-center gap-3 mb-5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-400/10 text-sky-300">
              <Terminal className="h-4 w-4" />
            </div>
            <p className="text-sm uppercase tracking-[0.22em] text-cyan-300/80">Core Technologies</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {techStack.map((tech) => (
              <span
                key={tech.name}
                className={`rounded-xl border px-3 py-1.5 text-sm font-medium transition hover:-translate-y-0.5 ${tech.color}`}
              >
                {tech.name}
              </span>
            ))}
          </div>
        </section>

        {/* Areas of Interest */}
        <section className="mt-6 rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-2xl shadow-slate-950/30 backdrop-blur-xl sm:p-8">
          <div className="flex items-center gap-3 mb-5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-400/10 text-indigo-300">
              <Layers className="h-4 w-4" />
            </div>
            <p className="text-sm uppercase tracking-[0.22em] text-cyan-300/80">Areas of Interest</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {interests.map((item) => (
              <div
                key={item.label}
                className="flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 transition hover:-translate-y-0.5 hover:border-cyan-400/20"
              >
                <item.icon className="h-4 w-4 shrink-0 text-cyan-300" />
                <span className="text-sm text-slate-200">{item.label}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Links */}
        <section className="mt-6 rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-2xl shadow-slate-950/30 backdrop-blur-xl sm:p-8">
          <div className="flex items-center gap-3 mb-5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-400/10 text-orange-300">
              <ExternalLink className="h-4 w-4" />
            </div>
            <p className="text-sm uppercase tracking-[0.22em] text-cyan-300/80">Connect</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <a
              href="https://github.com/india83win-creator"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-slate-950/60 px-5 py-3 text-sm font-medium text-slate-200 transition hover:-translate-y-0.5 hover:border-cyan-400/20 hover:text-white"
            >
              <GitBranch className="h-4 w-4" />
              GitHub
              <ExternalLink className="h-3 w-3 text-slate-500" />
            </a>
            <a
              href="https://www.linkedin.com/in/dhananjay-baral-62150337a"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-slate-950/60 px-5 py-3 text-sm font-medium text-slate-200 transition hover:-translate-y-0.5 hover:border-cyan-400/20 hover:text-white"
            >
              <Globe className="h-4 w-4" />
              LinkedIn
              <ExternalLink className="h-3 w-3 text-slate-500" />
            </a>
          </div>
          <p className="mt-4 text-xs text-slate-500">
            This product was built by Dhananjay Baral as a showcase of AI-powered developer tooling.
          </p>
        </section>

      </div>
    </AppShell>
  )
}