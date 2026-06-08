'use client'

/* eslint-disable react-hooks/set-state-in-effect */

import { useCallback, useEffect, useMemo, useRef, useState, type DragEvent } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import axios from 'axios'
import {
  ArrowRight,
  Bot,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Download,
  FileCode2,
  FileText,
  FolderCode,
  History,
  LayoutDashboard,
  Paperclip,
  Search,
  Settings,
  ShieldAlert,
  Sparkles,
  Upload,
  X,
} from 'lucide-react'
import SyntaxHighlighter from 'react-syntax-highlighter'
import { atomOneDark } from 'react-syntax-highlighter/dist/esm/styles/hljs'
import ReviewHistory from './components/ReviewHistory'
import ChatWithCode from './components/ChatWithCode'
import AISettings from './components/AISettings'
import { useToast } from '../../components/ToastProvider'
import { loadUserProfile, providerLabel, type AISettingsPayload } from '../../lib/userProfile'

type FileItem = { id: number; filename: string }
type Issue = { severity?: string; description?: string }
type ReviewSummary = {
  id: number
  review_type?: string
  summary?: string
  issues?: Issue[]
  recommendations?: Array<string | { description?: string }>
}
type FileContent = FileItem & { content: string }
type UploadBanner = { fileId: number; fileName: string; fading: boolean }

const ALLOWED_EXTENSIONS = ['.py', '.js', '.ts', '.tsx', '.java', '.cpp', '.c']

function getLanguage(filename: string): string {
  if (filename.endsWith('.py')) return 'python'
  if (filename.endsWith('.js')) return 'javascript'
  if (filename.endsWith('.ts') || filename.endsWith('.tsx')) return 'typescript'
  if (filename.endsWith('.java')) return 'java'
  if (filename.endsWith('.cpp') || filename.endsWith('.c')) return 'cpp'
  return 'plaintext'
}

export default function ProjectWorkspaceClient() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { notify } = useToast()
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const fileExplorerRef = useRef<HTMLDivElement | null>(null)
  const reviewActionsRef = useRef<HTMLDivElement | null>(null)
  const reviewButtonRef = useRef<HTMLButtonElement | null>(null)
  const fileButtonRefs = useRef<Record<number, HTMLDivElement | null>>({})
  const uploadBannerTimerRef = useRef<number | null>(null)
  const uploadBannerFadeTimerRef = useRef<number | null>(null)
  const reviewPulseTimerRef = useRef<number | null>(null)
  const reviewsRef = useRef<HTMLDivElement | null>(null)
  const chatRef = useRef<HTMLDivElement | null>(null)
  const settingsRef = useRef<HTMLDivElement | null>(null)

  const projectId = searchParams.get('id')
  const projectName = searchParams.get('name')

  const [files, setFiles] = useState<FileItem[]>([])
  const [selectedFile, setSelectedFile] = useState<FileContent | null>(null)
  const [review, setReview] = useState<ReviewSummary | null>(null)
  const [loadingReview, setLoadingReview] = useState(false)
  const [reviewType, setReviewType] = useState('general')
  const [aiProvider, setAiProvider] = useState('Ollama / Local')
  const [reviewCount, setReviewCount] = useState(0)
  const [lastReviewAt, setLastReviewAt] = useState<string | null>(null)
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [uploadLoading, setUploadLoading] = useState(false)
  const [uploadSuccess, setUploadSuccess] = useState<UploadBanner | null>(null)
  const [uploadBannerProgress, setUploadBannerProgress] = useState(100)
  const [uploadError, setUploadError] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  const [fileSearch, setFileSearch] = useState('')
  const [fileExplorerOpen, setFileExplorerOpen] = useState(true)
  const [autoReviewAfterUpload, setAutoReviewAfterUpload] = useState(false)
  const [autoReviewLoaded, setAutoReviewLoaded] = useState(false)
  const [reviewButtonPulse, setReviewButtonPulse] = useState(false)
  const [pendingUploadedFileId, setPendingUploadedFileId] = useState<number | null>(null)
  const [showFileContent, setShowFileContent] = useState(false)
  const [downloadOpen, setDownloadOpen] = useState(false)
  const downloadRef = useRef<HTMLDivElement | null>(null)

  const fetchFiles = useCallback(async () => {
    try {
      const token = localStorage.getItem('token')
      const res = await axios.get(`https://code-review-assistant-api-i4ws.onrender.com/api/files/${projectId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setFiles(res.data)
    } catch (err) { console.error(err) }
  }, [projectId])

  const fetchReviewEntries = useCallback(async () => {
    try {
      const token = localStorage.getItem('token')
      const res = await axios.get(`https://code-review-assistant-api-i4ws.onrender.com/api/reviews/${projectId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const entries = Array.isArray(res.data) ? res.data : []
      setReviewCount(entries.length)
      setLastReviewAt(entries[0]?.created_at || null)
      return entries
    } catch (err) { console.error(err); return [] }
  }, [projectId])

  const clearUploadSuccessTimers = useCallback(() => {
    if (uploadBannerTimerRef.current) { window.clearTimeout(uploadBannerTimerRef.current); uploadBannerTimerRef.current = null }
    if (uploadBannerFadeTimerRef.current) { window.clearTimeout(uploadBannerFadeTimerRef.current); uploadBannerFadeTimerRef.current = null }
  }, [])

  const clearReviewPulseTimer = useCallback(() => {
    if (reviewPulseTimerRef.current) { window.clearTimeout(reviewPulseTimerRef.current); reviewPulseTimerRef.current = null }
  }, [])

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) { router.push('/login'); return }
    void loadUserProfile(token).then((p) => setAiProvider(providerLabel(p.ai_settings.provider))).catch(console.error)
  }, [router])

  useEffect(() => { if (projectId) { void fetchFiles(); void fetchReviewEntries() } }, [projectId, fetchFiles, fetchReviewEntries])

  useEffect(() => {
    const stored = localStorage.getItem('auto_review_file_after_upload')
    if (stored !== null) setAutoReviewAfterUpload(stored === 'true')
    setAutoReviewLoaded(true)
  }, [])

  useEffect(() => { if (!autoReviewLoaded) return; localStorage.setItem('auto_review_file_after_upload', String(autoReviewAfterUpload)) }, [autoReviewAfterUpload, autoReviewLoaded])

  useEffect(() => {
    if (!uploadSuccess) { clearUploadSuccessTimers(); setUploadBannerProgress(100); return }
    setUploadBannerProgress(100)
    const af = window.requestAnimationFrame(() => setUploadBannerProgress(0))
    clearUploadSuccessTimers()
    uploadBannerTimerRef.current = window.setTimeout(() => {
      setUploadSuccess((c) => c ? { ...c, fading: true } : c)
      uploadBannerFadeTimerRef.current = window.setTimeout(() => setUploadSuccess(null), 320)
    }, 6000)
    return () => window.cancelAnimationFrame(af)
  }, [uploadSuccess, clearUploadSuccessTimers])

  useEffect(() => {
    if (!pendingUploadedFileId) return
    const el = fileButtonRefs.current[pendingUploadedFileId]
    if (el) { el.scrollIntoView({ behavior: 'smooth', block: 'center' }); setPendingUploadedFileId(null) }
  }, [files, pendingUploadedFileId])

  useEffect(() => {
    if (!reviewButtonPulse) return
    clearReviewPulseTimer()
    reviewPulseTimerRef.current = window.setTimeout(() => { setReviewButtonPulse(false) }, 1200)
  }, [reviewButtonPulse, clearReviewPulseTimer])

  useEffect(() => { return () => { clearUploadSuccessTimers(); clearReviewPulseTimer() } }, [clearUploadSuccessTimers, clearReviewPulseTimer])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (downloadRef.current && !downloadRef.current.contains(e.target as Node)) {
        setDownloadOpen(false)
      }
    }
    if (downloadOpen) document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [downloadOpen])

  const resetUploadMessages = () => { setUploadSuccess(null); setUploadError('') }
  const clearUploadSelection = () => { setUploadFile(null); if (fileInputRef.current) fileInputRef.current.value = '' }
  const dismissUploadSuccess = () => { clearUploadSuccessTimers(); setUploadSuccess(null); setUploadBannerProgress(100) }

  const handleFileSelection = (file: File | null) => {
    resetUploadMessages()
    if (!file) { clearUploadSelection(); return }
    const isAllowed = ALLOWED_EXTENSIONS.some((ext) => file.name.toLowerCase().endsWith(ext))
    if (!isAllowed) { setUploadError('Unsupported file type. Allowed: .py, .js, .ts, .tsx, .java, .cpp, .c'); clearUploadSelection(); return }
    setUploadFile(file)
  }

  const uploadSelectedFile = async () => {
    if (!uploadFile || !projectId) { setUploadError('Choose a file before uploading.'); return }
    try {
      setUploadLoading(true); resetUploadMessages()
      const token = localStorage.getItem('token')
      const formData = new FormData()
      formData.append('file', uploadFile)
      const response = await axios.post(`https://code-review-assistant-api-i4ws.onrender.com/api/files/${projectId}/upload`, formData, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' },
      })
      const uploadedId = Number(response.data?.id)
      const uploadedName = response.data?.filename || uploadFile.name
      setUploadSuccess({ fileId: uploadedId, fileName: uploadedName, fading: false })
      notify(`Uploaded ${uploadedName} successfully.`)
      setSelectedFile({ id: uploadedId, filename: uploadedName, content: '' })
      setReview(null)
      setPendingUploadedFileId(uploadedId)
      clearUploadSelection()
      await fetchFiles()
      if (autoReviewAfterUpload) { notify('Starting review...', 'success'); void generateReview(uploadedId) }
    } catch (err) {
      console.error(err); setUploadError('Upload failed. Please try again.'); notify('Upload failed. Please try again.', 'error')
    } finally { setUploadLoading(false) }
  }

  const onDropFiles = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault(); setIsDragging(false)
    const droppedFiles = event.dataTransfer.files
    handleFileSelection(droppedFiles?.[0] || null)
  }

  const loadFile = async (fileId: number) => {
    try {
      const token = localStorage.getItem('token')
      const res = await axios.get(`https://code-review-assistant-api-i4ws.onrender.com/api/files/content/${fileId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setSelectedFile({ ...res.data, id: fileId })
      setReview(null)
      setShowFileContent(false)
      setTimeout(() => { reviewActionsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }); setReviewButtonPulse(true) }, 100)
      if (autoReviewAfterUpload) { notify('Starting review...', 'success'); void generateReview(fileId) }
    } catch (err) { console.error(err) }
  }

  const generateReview = async (fileId?: number) => {
    const targetFileId = fileId ?? selectedFile?.id
    if (!targetFileId) { notify('Select a file first.', 'error'); return }
    try {
      setLoadingReview(true)
      const token = localStorage.getItem('token')
      const res = await axios.post('https://code-review-assistant-api-i4ws.onrender.com/api/reviews/', {
        project_id: Number(projectId), file_id: targetFileId, review_type: reviewType,
        ai_base_url: localStorage.getItem('ai_base_url') || '',
        ai_api_key: localStorage.getItem('ai_api_key') || '',
        ai_model: localStorage.getItem('ai_model') || '',
      }, { headers: { Authorization: `Bearer ${token}` } })
      setReview(res.data); void fetchReviewEntries()
    } catch (err) { console.error(err); notify('Review generation failed.', 'error') }
    finally { setLoadingReview(false) }
  }

  const generateProjectReview = async () => {
    try {
      setLoadingReview(true)
      const token = localStorage.getItem('token')
      const res = await axios.post('https://code-review-assistant-api-i4ws.onrender.com/api/reviews/', {
        project_id: Number(projectId), review_type: reviewType,
        ai_base_url: localStorage.getItem('ai_base_url') || '',
        ai_api_key: localStorage.getItem('ai_api_key') || '',
        ai_model: localStorage.getItem('ai_model') || '',
      }, { headers: { Authorization: `Bearer ${token}` } })
      setReview(res.data); void fetchReviewEntries()
    } catch (err) { console.error(err); notify('Project review failed.', 'error') }
    finally { setLoadingReview(false) }
  }

  const exportMarkdown = () => {
    if (!review) return
    const issues = (review.issues || []) as Issue[]
    const recs = review.recommendations || []
    const md = `# Code Review Report
**Project:** ${projectName || 'Unknown'}
**File:** ${selectedFile?.filename || 'Entire project'}
**Review Type:** ${review.review_type || reviewType}
**Date:** ${new Date().toLocaleDateString()}

## Summary
${review.summary || 'N/A'}

## Issues (${issues.length})
${issues.map((i, idx) => `### ${idx + 1}. [${(i.severity || 'low').toUpperCase()}] \n${i.description || ''}`).join('\n\n')}

## Recommendations (${recs.length})
${recs.map((r, idx) => `${idx + 1}. ${typeof r === 'string' ? r : r.description || ''}`).join('\n')}
`
    const blob = new Blob([md], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `review-${projectName || 'project'}-${Date.now()}.md`
    a.click(); URL.revokeObjectURL(url)
    notify('Downloaded as Markdown.')
  }

  const exportPDF = () => {
    if (!review) return
    const issues = (review.issues || []) as Issue[]
    const recs = review.recommendations || []
    const html = `<!DOCTYPE html><html><head><title>Code Review Report</title>
<style>body{font-family:system-ui,sans-serif;max-width:800px;margin:40px auto;color:#1e293b;line-height:1.6}
h1{color:#0f172a;border-bottom:2px solid #e2e8f0;padding-bottom:8px}
h2{color:#1e40af;margin-top:32px}.meta{color:#64748b;font-size:14px;margin-bottom:24px}
.issue{border:1px solid #e2e8f0;border-radius:8px;padding:16px;margin:12px 0}
.severity{display:inline-block;padding:2px 10px;border-radius:999px;font-size:12px;font-weight:600;text-transform:uppercase}
.critical{background:#fee2e2;color:#991b1b}.high{background:#ffedd5;color:#9a3412}
.medium{background:#fef9c3;color:#854d0e}.low{background:#dcfce7;color:#166534}
.rec{border-left:3px solid #3b82f6;padding:8px 16px;margin:8px 0;background:#eff6ff}</style>
</head><body>
<h1>Code Review Report</h1>
<div class="meta">
  <strong>Project:</strong> ${projectName || 'Unknown'}<br>
  <strong>File:</strong> ${selectedFile?.filename || 'Entire project'}<br>
  <strong>Review Type:</strong> ${review.review_type || reviewType}<br>
  <strong>Date:</strong> ${new Date().toLocaleDateString()}
</div>
<h2>Summary</h2><p>${review.summary || 'N/A'}</p>
<h2>Issues (${issues.length})</h2>
${issues.map((i) => `<div class="issue"><span class="severity ${i.severity?.toLowerCase() || 'low'}">${i.severity || 'Low'}</span><p>${i.description || ''}</p></div>`).join('')}
<h2>Recommendations (${recs.length})</h2>
${recs.map((r) => `<div class="rec">${typeof r === 'string' ? r : r.description || ''}</div>`).join('')}
</body></html>`
    const w = window.open('', '_blank')
    if (w) { w.document.write(html); w.document.close(); w.print() }
    notify('PDF export opened — use browser Print → Save as PDF.')
  }

  const severityStyle = (severity?: string) => {
    const v = (severity || 'low').toLowerCase()
    if (v.includes('critical')) return 'border-rose-400/30 bg-rose-400/10 text-rose-200'
    if (v.includes('high')) return 'border-orange-400/30 bg-orange-400/10 text-orange-200'
    if (v.includes('medium')) return 'border-amber-400/30 bg-amber-400/10 text-amber-200'
    return 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200'
  }

  const reviewIssues = (review?.issues || []) as Issue[]
  const reviewRecommendations = review?.recommendations || []
  const filteredFiles = useMemo(() => files.filter((f) => f.filename.toLowerCase().includes(fileSearch.toLowerCase())), [files, fileSearch])
  const visibleReview = review || null
  const handleSettingsSaved = (settings: AISettingsPayload) => setAiProvider(providerLabel(settings.provider))

  const navItems = [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Projects', href: '/projects', icon: FolderCode },
    { label: 'Reviews', href: '/reviews', icon: History },
    { label: 'AI Settings', href: '/ai-settings', icon: Settings },
   ]

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto flex min-h-screen max-w-[1800px] flex-col lg:flex-row">
        {/* Sidebar */}
        <aside className="border-b border-white/10 bg-slate-950/90 px-4 py-5 backdrop-blur-xl lg:sticky lg:top-0 lg:h-screen lg:w-[260px] lg:border-b-0 lg:border-r lg:px-4">
          <div className="flex h-full flex-col rounded-[1.75rem] border border-white/10 bg-white/5 p-4 shadow-2xl shadow-slate-950/40">
            <div className="flex items-center gap-3 px-1">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 to-indigo-400 text-slate-950 shadow-lg shadow-cyan-500/20">
                <Bot className="h-6 w-6" />
              </div>
              <div className="min-w-0">
                <p className="font-display text-base font-semibold text-white">Code Review AI</p>
                <p className="truncate text-xs text-slate-400">Professional SaaS workspace</p>
              </div>
            </div>
            <nav className="mt-6 space-y-2 text-sm">
              {navItems.map((item) => {
                const active = pathname === item.href
                return (
                  <button key={item.label} onClick={() => router.push(item.href)}
                    className={`relative flex w-full items-center justify-between overflow-hidden rounded-2xl border px-3 py-3 text-left transition duration-200 hover:-translate-y-0.5 ${active ? 'border-cyan-400/30 bg-cyan-400/10 text-white shadow-[0_0_28px_rgba(0,212,255,0.14)]' : 'border-white/5 bg-white/5 text-slate-300 hover:border-cyan-400/25 hover:bg-cyan-400/10 hover:text-white'}`}>
                    {active && <span className="absolute left-0 top-2 h-[calc(100%-1rem)] w-1 rounded-r-full bg-[#00D4FF] shadow-[0_0_18px_#00D4FF]" />}
                    <span className="flex items-center gap-3"><item.icon className="h-4 w-4" />{item.label}</span>
                    <ArrowRight className="h-4 w-4 opacity-40" />
                  </button>
                )
              })}
            </nav>
            <div className="mt-6 rounded-2xl border border-white/10 bg-gradient-to-br from-cyan-400/10 to-indigo-400/10 p-4">
              <p className="text-[11px] uppercase tracking-[0.24em] text-cyan-300">Project</p>
              <p className="mt-2 line-clamp-2 text-sm font-medium text-white">{projectName || 'Unnamed project'}</p>
              <p className="mt-1 text-xs text-slate-400">ID: {projectId || 'N/A'}</p>
            </div>
            <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.24em] text-slate-400">AI provider</p>
              <p className="mt-2 text-sm font-medium text-white">{aiProvider}</p>
            </div>
            <button onClick={() => router.push('/dashboard')}
              className="mt-auto inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm font-medium text-slate-200 transition hover:border-cyan-400/30 hover:bg-cyan-400/10 hover:text-white">
              <ChevronRight className="h-4 w-4" />Back to dashboard
            </button>
          </div>
        </aside>

        <main className="flex-1 px-4 py-5 sm:px-6 lg:px-8 lg:py-8">
          {/* Hero */}
          <section className="overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-slate-900/95 via-slate-900/70 to-slate-950 p-6 shadow-[0_24px_90px_rgba(2,6,23,0.45)] backdrop-blur-xl sm:p-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-3xl space-y-4">
                <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-xs font-medium uppercase tracking-[0.28em] text-cyan-200">
                  <Sparkles className="h-3.5 w-3.5" />AI Code Review Assistant
                </div>
                <h1 className="font-display text-4xl font-semibold tracking-tight text-white sm:text-5xl">{projectName || 'Project workspace'}</h1>
                <p className="max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">Upload files, generate reviews, chat with the codebase, and track findings in a clean SaaS workspace.</p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {[
                  { label: 'Files Uploaded', value: files.length.toString().padStart(2, '0'), icon: FolderCode, tone: 'from-cyan-400/20 to-cyan-400/5' },
                  { label: 'Reviews Generated', value: reviewCount.toString().padStart(2, '0'), icon: History, tone: 'from-indigo-400/20 to-indigo-400/5' },
                  { label: 'AI Provider', value: aiProvider, icon: Bot, tone: 'from-fuchsia-400/20 to-fuchsia-400/5' },
                  { label: 'Last Review', value: lastReviewAt ? new Date(lastReviewAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'None', icon: Sparkles, tone: 'from-emerald-400/20 to-emerald-400/5' },
                ].map((stat) => (
                  <div key={stat.label} className={`rounded-2xl border border-white/10 bg-gradient-to-br ${stat.tone} p-4 shadow-lg shadow-slate-950/20 backdrop-blur transition duration-200 hover:-translate-y-0.5 hover:border-white/15`}>
                    <div className="flex items-start justify-between gap-4 text-slate-400">
                      <p className="text-[11px] uppercase tracking-[0.22em]">{stat.label}</p>
                      <stat.icon className="h-4 w-4" />
                    </div>
                    <p className="mt-3 font-display text-xl font-semibold text-white">{stat.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="mt-6 grid gap-6 xl:grid-cols-[1.02fr_0.98fr]">
            {/* LEFT COLUMN */}
            <div className="space-y-6">
              {/* Upload */}
              <section className="rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-2xl shadow-slate-950/30 backdrop-blur-xl">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm uppercase tracking-[0.22em] text-cyan-300/80">Upload files</p>
                    <h2 className="mt-2 font-display text-2xl font-semibold text-white">Add source files</h2>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">Supports .py, .js, .ts, .tsx, .java, .cpp, .c</p>
                  </div>
                  <div className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-slate-950/60 px-3 py-2 text-xs uppercase tracking-[0.22em] text-slate-400">
                    <Upload className="h-4 w-4 text-cyan-300" />Multipart upload
                  </div>
                </div>

                <label className="mt-4 flex cursor-pointer items-center gap-3 rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-slate-200 transition hover:border-cyan-400/20">
                  <input type="checkbox" checked={autoReviewAfterUpload} onChange={(e) => setAutoReviewAfterUpload(e.target.checked)}
                    className="h-4 w-4 rounded border-white/20 bg-transparent text-cyan-400 focus:ring-cyan-400" />
                  <span>Auto-review file after upload</span>
                </label>

                <div
                  onDragEnter={(e) => { e.preventDefault(); setIsDragging(true) }}
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
                  onDragLeave={(e) => { e.preventDefault(); setIsDragging(false) }}
                  onDrop={onDropFiles}
                  className={`mt-5 rounded-[1.75rem] border-2 border-dashed p-5 transition duration-200 ${isDragging ? 'border-cyan-300 bg-cyan-400/10' : 'border-white/10 bg-slate-950/40 hover:border-cyan-400/20'}`}
                >
                  <div className="flex flex-col items-center gap-4 text-center">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400/20 to-indigo-400/20 text-cyan-200">
                      <Paperclip className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="font-display text-lg font-semibold text-white">{uploadFile ? uploadFile.name : 'Drop a file here or choose manually'}</p>
                      <p className="mt-2 text-sm text-slate-400">Drag and drop or use the button below.</p>
                    </div>
                    <div className="flex flex-wrap items-center justify-center gap-3">
                      <input ref={fileInputRef} type="file" accept=".py,.js,.ts,.tsx,.java,.cpp,.c"
                        onChange={(e) => handleFileSelection(e.target.files?.[0] || null)} className="hidden" />
                      <button type="button" onClick={() => fileInputRef.current?.click()}
                        className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition duration-200 hover:border-cyan-400/30 hover:bg-cyan-400/10">
                        <FileCode2 className="h-4 w-4" />Choose File
                      </button>
                      <button type="button" onClick={uploadSelectedFile} disabled={!uploadFile || uploadLoading}
                        className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-400 to-indigo-400 px-5 py-3 text-sm font-semibold text-slate-950 transition duration-200 hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-60">
                        {uploadLoading ? 'Uploading...' : 'Upload File'}
                      </button>
                      {uploadFile && !uploadLoading && (
                        <button type="button" onClick={clearUploadSelection}
                          className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm font-medium text-slate-300 transition duration-200 hover:border-white/20 hover:text-white">
                          <X className="h-4 w-4" />Clear
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {uploadSuccess && (
                  <div className={`mt-4 overflow-hidden rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100 transition-all duration-300 ${uploadSuccess.fading ? 'opacity-0 translate-y-1' : 'opacity-100 translate-y-0'}`}>
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-medium">{uploadSuccess.fileName} uploaded</span>
                          <span className="text-emerald-200/70">→</span>
                          {autoReviewAfterUpload ? (
                            <span className="rounded-full border border-cyan-300/20 bg-cyan-400/10 px-3 py-1 text-xs uppercase tracking-[0.2em] text-cyan-200">Starting review automatically</span>
                          ) : (
                            <button type="button" onClick={() => void generateReview(uploadSuccess.fileId)} disabled={loadingReview}
                              className="inline-flex items-center rounded-full border border-cyan-300/20 bg-cyan-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-200 transition hover:border-cyan-300/40 hover:bg-cyan-400/20 disabled:cursor-not-allowed disabled:opacity-60">
                              Review now
                            </button>
                          )}
                        </div>
                        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
                          <div className="h-full rounded-full bg-gradient-to-r from-cyan-300 to-emerald-300 transition-[width] duration-[6000ms] ease-linear" style={{ width: `${uploadBannerProgress}%` }} />
                        </div>
                      </div>
                      <button type="button" onClick={dismissUploadSuccess} className="rounded-full p-1 text-emerald-100/80 transition hover:bg-white/10 hover:text-white">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )}
                {uploadError && <div className="mt-4 rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-200">{uploadError}</div>}
                {uploadLoading && <div className="mt-4 rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-slate-300">Uploading file...</div>}
              </section>

              {/* File Explorer */}
              <section ref={fileExplorerRef} className="rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-2xl shadow-slate-950/30 backdrop-blur-xl">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm uppercase tracking-[0.22em] text-cyan-300/80">File explorer</p>
                    <h2 className="mt-2 font-display text-2xl font-semibold text-white">Uploaded files</h2>
                  </div>
                  <button onClick={() => setFileExplorerOpen(!fileExplorerOpen)}
                    className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-slate-950/60 px-3 py-2 text-sm text-slate-300 transition hover:border-cyan-400/30 hover:text-white">
                    {fileExplorerOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    {fileExplorerOpen ? 'Collapse' : 'Expand'}
                  </button>
                </div>
                {fileExplorerOpen && (
                  <div className="mt-5 space-y-4">
                    <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3">
                      <Search className="h-4 w-4 text-slate-400" />
                      <input value={fileSearch} onChange={(e) => setFileSearch(e.target.value)} placeholder="Search uploaded files"
                        className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-500" />
                    </div>
                    <div className="grid gap-3">
                      {filteredFiles.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-white/10 bg-slate-950/40 px-5 py-10 text-center text-sm text-slate-400">No matching files found.</div>
                      ) : (
                        filteredFiles.map((file) => {
                          const active = selectedFile?.id === file.id
                          return (
                            <div key={file.id} ref={(node) => { fileButtonRefs.current[file.id] = node }}
                              onClick={() => loadFile(file.id)} role="button" tabIndex={0}
                              onKeyDown={(e) => e.key === 'Enter' && loadFile(file.id)}
                              className={`group flex items-center gap-4 rounded-2xl border px-4 py-4 text-left transition duration-200 cursor-pointer ${active ? 'border-cyan-400/30 bg-cyan-400/10 shadow-lg shadow-cyan-950/10' : 'border-white/10 bg-slate-950/40 hover:-translate-y-0.5 hover:border-white/20 hover:bg-slate-950/70'}`}>
                              <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${active ? 'bg-cyan-400/20 text-cyan-200' : 'bg-white/5 text-slate-300'}`}>
                                <FileText className="h-5 w-5" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="truncate font-medium text-white">{file.filename}</p>
                                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{active ? 'Selected — ready to review' : 'Click to select'}</p>
                              </div>
                              {active ? (
                                <button type="button" onClick={(e) => { e.stopPropagation(); void generateReview(file.id) }} disabled={loadingReview}
                                  className="inline-flex items-center gap-1 rounded-xl border border-cyan-400/30 bg-cyan-400/10 px-3 py-1.5 text-xs font-semibold text-cyan-200 transition hover:bg-cyan-400/20 disabled:opacity-60 whitespace-nowrap">
                                  {loadingReview ? 'Running...' : 'Review now →'}
                                </button>
                              ) : (
                                <ArrowRight className="h-4 w-4 text-slate-500 transition group-hover:translate-x-0.5 group-hover:text-white" />
                              )}
                            </div>
                          )
                        })
                      )}
                    </div>
                  </div>
                )}
              </section>

              {/* Syntax Highlighted File Viewer */}
              {selectedFile && selectedFile.content && (
                <section className="rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-2xl shadow-slate-950/30 backdrop-blur-xl">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm uppercase tracking-[0.22em] text-cyan-300/80">File viewer</p>
                      <h2 className="mt-2 font-display text-xl font-semibold text-white">{selectedFile.filename}</h2>
                    </div>
                    <button onClick={() => setShowFileContent(!showFileContent)}
                      className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-slate-950/60 px-3 py-2 text-sm text-slate-300 transition hover:border-cyan-400/30 hover:text-white">
                      {showFileContent ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                      {showFileContent ? 'Collapse' : 'View code'}
                    </button>
                  </div>
                  {showFileContent && (
                    <div className="mt-4 overflow-hidden rounded-2xl border border-white/10">
                      <SyntaxHighlighter
                        language={getLanguage(selectedFile.filename)}
                        style={atomOneDark}
                        showLineNumbers
                        customStyle={{ margin: 0, borderRadius: '1rem', fontSize: '13px', maxHeight: '500px' }}
                      >
                        {selectedFile.content}
                      </SyntaxHighlighter>
                    </div>
                  )}
                </section>
              )}

              {/* Chat */}
              <section ref={chatRef}>
                <ChatWithCode projectId={projectId} />
              </section>
            </div>

            {/* RIGHT COLUMN */}
            <div className="space-y-6 xl:sticky xl:top-8 xl:self-start">
              {/* Review Actions */}
              <section ref={reviewActionsRef} className="rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-2xl shadow-slate-950/30 backdrop-blur-xl">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm uppercase tracking-[0.22em] text-cyan-300/80">Review actions</p>
                    <h3 className="mt-2 font-display text-2xl font-semibold text-white">Generate reviews</h3>
                  </div>
                  <div className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-slate-950/60 px-3 py-2 text-xs uppercase tracking-[0.22em] text-slate-400">
                    <ShieldAlert className="h-4 w-4 text-cyan-300" />Existing functionality preserved
                  </div>
                </div>
                {selectedFile && (
                  <div className="mt-4 flex items-center gap-3 rounded-2xl border border-cyan-400/20 bg-cyan-400/5 px-4 py-3">
                    <FileText className="h-4 w-4 text-cyan-300" />
                    <span className="text-sm text-cyan-200 truncate">{selectedFile.filename}</span>
                    <span className="ml-auto text-xs text-cyan-400/60 uppercase tracking-widest">Selected</span>
                  </div>
                )}
                <div className="mt-5 grid gap-3">
                  <select value={reviewType} onChange={(e) => setReviewType(e.target.value)}
                    className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400/50">
                    <option value="general">General Review</option>
                    <option value="security">Security Review</option>
                    <option value="performance">Performance Review</option>
                    <option value="quality">Code Quality Review</option>
                  </select>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <button ref={reviewButtonRef} onClick={() => void generateReview()} disabled={loadingReview || !selectedFile}
                      className={`inline-flex flex-col items-center justify-center gap-1 rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition duration-200 hover:border-cyan-400/30 hover:bg-cyan-400/10 disabled:cursor-not-allowed disabled:opacity-60 ${reviewButtonPulse ? 'animate-pulse shadow-[0_0_0_1px_rgba(103,232,249,0.35),0_0_28px_rgba(34,211,238,0.25)]' : ''}`}>
                      <span>{loadingReview ? 'Generating...' : 'Review selected file'}</span>
                      {!selectedFile && !loadingReview && <span className="text-[10px] font-normal text-slate-500 uppercase tracking-widest">Select a file first</span>}
                      {selectedFile && !loadingReview && <span className="text-[10px] font-normal text-cyan-400/70 uppercase tracking-widest truncate max-w-full px-2">{selectedFile.filename}</span>}
                    </button>
                    <button onClick={generateProjectReview} disabled={loadingReview}
                      className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-400 to-indigo-400 px-5 py-3 text-sm font-semibold text-slate-950 transition duration-200 hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-60">
                      {loadingReview ? 'Generating...' : 'Review entire project'}
                    </button>
                  </div>
                </div>
              </section>

              {/* Review Results */}
              <section ref={reviewsRef} className="rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-2xl shadow-slate-950/30 backdrop-blur-xl">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-sm uppercase tracking-[0.22em] text-cyan-300/80">Review results</p>
                    <h2 className="mt-2 font-display text-2xl font-semibold text-white">Insight cards</h2>
                  </div>
                  <div className="flex items-center gap-2">
                    {visibleReview?.review_type && (
                      <div className="rounded-2xl border border-white/10 bg-slate-950/60 px-3 py-2 text-xs uppercase tracking-[0.22em] text-slate-400">{visibleReview.review_type}</div>
                    )}
                    {visibleReview && (
                      <div className="relative" ref={downloadRef}>
                        <button
                          onClick={() => setDownloadOpen((o) => !o)}
                          className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-400 to-indigo-400 px-4 py-2 text-sm font-semibold text-slate-950 transition duration-200 hover:scale-[1.02] shadow-lg shadow-cyan-500/20">
                          <Download className="h-4 w-4" />
                          Download Report
                          <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${downloadOpen ? 'rotate-180' : ''}`} />
                        </button>
                        {downloadOpen && (
                          <div className="absolute right-0 top-full z-50 mt-2 w-52 overflow-hidden rounded-2xl border border-white/10 bg-slate-900 shadow-2xl shadow-slate-950/60">
                            <div className="px-3 py-2 text-[10px] uppercase tracking-[0.22em] text-slate-500">Export format</div>
                            <button
                              onClick={() => { exportPDF(); setDownloadOpen(false) }}
                              className="flex w-full items-center gap-3 px-4 py-3 text-sm font-medium text-slate-200 transition hover:bg-cyan-400/10 hover:text-white">
                              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-400/10 text-rose-300">
                                <Download className="h-4 w-4" />
                              </div>
                              <div className="text-left">
                                <p className="font-semibold">Download PDF</p>
                                <p className="text-xs text-slate-500">Print-ready report</p>
                              </div>
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {visibleReview ? (
                  <div className="mt-6 space-y-4">
                    <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-5">
                      <div className="flex items-center justify-between gap-4">
                        <h3 className="font-display text-lg font-semibold text-white">Summary</h3>
                        <Sparkles className="h-4 w-4 text-cyan-300" />
                      </div>
                      <p className="mt-4 text-sm leading-7 text-slate-300">{visibleReview.summary}</p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-5">
                      <h3 className="font-display text-lg font-semibold text-white">Issues</h3>
                      <div className="mt-4 space-y-3">
                        {reviewIssues.length > 0 ? reviewIssues.map((issue, i) => (
                          <div key={i} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                            <span className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${severityStyle(issue.severity)}`}>{issue.severity || 'Low'}</span>
                            <p className="mt-3 text-sm leading-7 text-slate-300">{issue.description}</p>
                          </div>
                        )) : <p className="text-sm text-slate-400">No issues found.</p>}
                      </div>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-5">
                      <h3 className="font-display text-lg font-semibold text-white">Recommendations</h3>
                      <div className="mt-4 space-y-3">
                        {reviewRecommendations.length > 0 ? reviewRecommendations.map((rec, i) => (
                          <div key={i} className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm leading-7 text-slate-300">
                            {typeof rec === 'string' ? rec : rec.description || JSON.stringify(rec)}
                          </div>
                        )) : <p className="text-sm text-slate-400">No recommendations yet.</p>}
                      </div>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-cyan-400/10 to-indigo-400/10 p-5">
                      <p className="text-xs uppercase tracking-[0.24em] text-cyan-300">Metrics</p>
                      <div className="mt-4 grid grid-cols-2 gap-3">
                        {[
                          { label: 'Issues', value: reviewIssues.length },
                          { label: 'Recommendations', value: reviewRecommendations.length },
                          { label: 'Mode', value: reviewType },
                          { label: 'Provider', value: aiProvider },
                        ].map((m) => (
                          <div key={m.label} className="rounded-2xl border border-white/10 bg-slate-950/50 p-3">
                            <p className="text-xs uppercase tracking-[0.22em] text-slate-500">{m.label}</p>
                            <p className="mt-2 font-display text-xl text-white capitalize">{m.value}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="mt-6 rounded-2xl border border-dashed border-white/10 bg-slate-950/40 px-6 py-10 text-center">
                    <Sparkles className="mx-auto h-8 w-8 text-slate-600" />
                    <p className="mt-3 text-sm text-slate-400">Run a review to see summary, issues, and recommendations.</p>
                    {!selectedFile && <p className="mt-1 text-xs text-slate-600">Select a file from the explorer first.</p>}
                  </div>
                )}
              </section>
            </div>
          </section>

          <section className="mt-6">
            <div ref={reviewsRef}><ReviewHistory projectId={projectId} /></div>
          </section>
          <section ref={settingsRef} className="mt-6">
            <AISettings onSettingsSaved={handleSettingsSaved} />
          </section>
        </main>
      </div>
    </div>
  )
}