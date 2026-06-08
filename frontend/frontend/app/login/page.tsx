'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import { ArrowRight, Bot, Check, Eye, EyeOff, Sparkles } from 'lucide-react'
import { OLLAMA_DEFAULTS, syncAISettingsToLocalStorage } from '../lib/userProfile'

export default function LoginPage() {
  const router = useRouter()
  const passwordInputRef = useRef<HTMLInputElement | null>(null)
  const countdownTimerRef = useRef<number | null>(null)

  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [registerLoading, setRegisterLoading] = useState(false)
  const [registrationSuccess, setRegistrationSuccess] = useState(false)
  const [registeredEmail, setRegisteredEmail] = useState('')
  const [countdown, setCountdown] = useState(3)

  useEffect(() => {
    return () => {
      if (countdownTimerRef.current) {
        window.clearInterval(countdownTimerRef.current)
      }
    }
  }, [])

  const focusPasswordField = () => {
    window.setTimeout(() => passwordInputRef.current?.focus(), 80)
  }

  const switchToLoginTab = (prefillEmail = registeredEmail) => {
    if (countdownTimerRef.current) {
      window.clearInterval(countdownTimerRef.current)
      countdownTimerRef.current = null
    }

    setRegistrationSuccess(false)
    setIsLogin(true)
    setEmail(prefillEmail)
    setPassword('')
    setErrorMessage('')
    focusPasswordField()
  }

  const startRegistrationCountdown = (createdEmail: string) => {
    if (countdownTimerRef.current) {
      window.clearInterval(countdownTimerRef.current)
    }

    let count = 3
    setCountdown(count)

    countdownTimerRef.current = window.setInterval(() => {
      count -= 1
      setCountdown(count)

      if (count === 0) {
        switchToLoginTab(createdEmail)
      }
    }, 1000)
  }

  const mapRegistrationError = (detail?: string) => {
    const value = (detail || '').toLowerCase()
    if (value.includes('email') && (value.includes('registered') || value.includes('use'))) {
      return 'Email already in use. Try logging in instead.'
    }
    return detail || 'Something went wrong'
  }

  const handleSubmit = async () => {
    setErrorMessage('')

    try {
      if (isLogin) {
        const res = await axios.post(
          'http://localhost:8000/api/auth/login',
          {
            email,
            password
          }
        )

        localStorage.setItem('token', res.data.access_token)
        localStorage.setItem('username', res.data.username)
        localStorage.setItem('role', res.data.role || '')
        syncAISettingsToLocalStorage(res.data.ai_settings || OLLAMA_DEFAULTS)

        router.push('/dashboard')
      } else {
        if (!username.trim() || !email.trim() || !password.trim()) {
          setErrorMessage('All fields are required.')
          return
        }

        if (password.length < 8) {
          setErrorMessage('Password must be at least 8 characters.')
          return
        }

        setRegisterLoading(true)
        await axios.post(
          'http://localhost:8000/api/auth/register',
          {
            email: email.trim(),
            username: username.trim(),
            password
          }
        )

        const createdEmail = email.trim()
        setRegisteredEmail(createdEmail)
        setRegistrationSuccess(true)
        startRegistrationCountdown(createdEmail)
      }
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setErrorMessage(isLogin ? err.response?.data?.detail || 'Something went wrong' : mapRegistrationError(err.response?.data?.detail))
      } else {
        setErrorMessage('Something went wrong')
      }
    } finally {
      setRegisterLoading(false)
    }
  }

  return (
    <div className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto grid min-h-[calc(100vh-3rem)] max-w-6xl items-center gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-slate-900/60 p-8 shadow-[0_32px_120px_rgba(2,6,23,0.75)] backdrop-blur-xl sm:p-10 lg:p-12">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(56,189,248,0.22),_transparent_30%),radial-gradient(circle_at_bottom_left,_rgba(99,102,241,0.18),_transparent_28%)]" />
          <div className="relative flex h-full flex-col justify-between gap-10">
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-xs font-medium uppercase tracking-[0.28em] text-cyan-200">
              <Sparkles className="h-3.5 w-3.5" />
              AI Code Review Assistant
            </div>

            <div className="max-w-xl space-y-6">
              <p className="font-display text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:text-6xl">
                Review code like a premium SaaS product, not a demo.
              </p>
              <p className="max-w-lg text-base leading-7 text-slate-300 sm:text-lg">
                Analyze, review, and understand your codebase with local and cloud AI models. Designed for fast navigation, crisp hierarchy, and recruiter-grade polish.
              </p>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Trusted workflow</p>
                  <p className="mt-2 text-sm text-slate-200">Login, register, and get into the review workspace in seconds.</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Powered by AI</p>
                  <p className="mt-2 text-sm text-slate-200">Connect Ollama, OpenAI-compatible APIs, or custom providers.</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-3 text-sm text-slate-400">
                <Bot className="h-5 w-5 text-cyan-300" />
                Built for speed, clarity, and a polished first impression.
              </div>

             
            </div>
          </div>
        </section>

        <section className="rounded-[2rem] border border-white/10 bg-slate-950/80 p-6 shadow-[0_24px_80px_rgba(2,6,23,0.7)] backdrop-blur-xl sm:p-8">
          <div className="mb-8 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-cyan-300/80">Workspace access</p>
              <h1 className="mt-2 text-3xl font-semibold text-white">
                {registrationSuccess ? 'You are all set' : isLogin ? 'Welcome back' : 'Create your account'}
              </h1>
            </div>
            <div className="rounded-full border border-white/10 bg-white/5 p-3 text-cyan-200">
              <Sparkles className="h-5 w-5" />
            </div>
          </div>

          <div className="mb-6 grid grid-cols-2 rounded-2xl border border-white/10 bg-white/5 p-1 text-sm">
            <button
              onClick={() => switchToLoginTab(email)}
              className={`rounded-xl px-4 py-3 transition ${isLogin ? 'bg-cyan-400 text-slate-950 shadow-lg shadow-cyan-500/20' : 'text-slate-300 hover:text-white'}`}
            >
              Login
            </button>
            <button
              onClick={() => {
                setIsLogin(false)
                setRegistrationSuccess(false)
                setErrorMessage('')
              }}
              className={`rounded-xl px-4 py-3 transition ${!isLogin ? 'bg-cyan-400 text-slate-950 shadow-lg shadow-cyan-500/20' : 'text-slate-300 hover:text-white'}`}
            >
              Register
            </button>
          </div>

          {registrationSuccess ? (
            <div className="animate-[authPanelIn_260ms_ease-out] rounded-[1.75rem] border border-emerald-400/20 bg-emerald-400/10 p-6 text-center">
              <div className="mx-auto flex h-20 w-20 animate-[successPop_420ms_cubic-bezier(0.2,1.35,0.35,1)_both] items-center justify-center rounded-full border border-emerald-300/30 bg-emerald-400/15 text-emerald-200 shadow-[0_0_42px_rgba(52,211,153,0.22)]">
                <Check className="h-11 w-11 [stroke-dasharray:80] [stroke-dashoffset:80] animate-[checkDraw_520ms_ease-out_180ms_forwards]" />
              </div>

              <h2 className="mt-6 font-display text-2xl font-semibold text-white">Account created successfully!</h2>
              <p className="mt-3 text-sm leading-6 text-slate-300">
                Welcome aboard! You can now log in to your workspace.
              </p>
              <p className="mt-4 text-sm font-medium text-emerald-100">
                Redirecting to login in {countdown}...
              </p>

              <button
                type="button"
                onClick={() => switchToLoginTab(registeredEmail)}
                className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-cyan-400 px-4 py-3 font-semibold text-slate-950 shadow-[0_20px_50px_rgba(34,211,238,0.2)] transition hover:scale-[1.01] hover:shadow-[0_24px_60px_rgba(34,211,238,0.28)]"
              >
                Proceed to Login →
              </button>
            </div>
          ) : (
          <div className="animate-[authPanelIn_260ms_ease-out] space-y-4">
            {!isLogin && (
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-300">Username</span>
                <input
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-slate-500 outline-none transition focus:border-cyan-400/50 focus:bg-white/10"
                  placeholder="Your display name"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </label>
            )}

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-300">Email</span>
              <input
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-slate-500 outline-none transition focus:border-cyan-400/50 focus:bg-white/10"
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-300">Password</span>
              <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 transition focus-within:border-cyan-400/50 focus-within:bg-white/10">
                <input
                  ref={passwordInputRef}
                  type={showPassword ? 'text' : 'password'}
                  className="w-full bg-transparent text-white placeholder:text-slate-500 outline-none"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-slate-400 transition hover:text-white"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </label>

            <button
              onClick={handleSubmit}
              disabled={!isLogin && registerLoading}
              className="group inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-400 via-sky-400 to-indigo-400 px-4 py-3 font-semibold text-slate-950 shadow-[0_20px_50px_rgba(34,211,238,0.2)] transition hover:scale-[1.01] hover:shadow-[0_24px_60px_rgba(34,211,238,0.28)]"
            >
              {!isLogin && registerLoading ? 'Creating account...' : isLogin ? 'Login to workspace' : 'Create account'}
              <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
            </button>

            {errorMessage && (
              <div className="rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-200">
                {errorMessage}
              </div>
            )}

            <p className="text-center text-sm text-slate-400">
              {isLogin ? "Don't have an account?" : 'Already have an account?'}{' '}
              <button
                onClick={() => setIsLogin(!isLogin)}
                className="font-medium text-cyan-300 transition hover:text-cyan-200"
              >
                {isLogin ? 'Register now' : 'Login instead'}
              </button>
            </p>
          </div>
          )}
        </section>
      </div>
    </div>
  )
}