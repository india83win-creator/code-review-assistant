'use client'

import { useEffect, useRef, useState } from 'react'
import axios from 'axios'
import { Bot, Loader2, MessageSquareText, Send, Sparkles, UserRound } from 'lucide-react'

interface Props {
  projectId: string | null
}

export default function ChatWithCode({ projectId }: Props) {
  const [question, setQuestion] = useState('')
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([])
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement | null>(null)

  // Auto-scroll to latest message
  useEffect(() => {
    if (messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, loading])

  const askAI = async () => {
    if (!question.trim()) return

    try {
      setLoading(true)
      setMessages((current) => [...current, { role: 'user', content: question }])

      const token = localStorage.getItem('token')
      const aiBaseUrl = localStorage.getItem('ai_base_url') || ''
      const aiApiKey = localStorage.getItem('ai_api_key') || ''
      const aiModel = localStorage.getItem('ai_model') || ''

      const nextQuestion = question
      setQuestion('')

      const res = await axios.post(
        'https://code-review-assistant-api-i4ws.onrender.com/api/chat/',
        {
          project_id: projectId ? Number(projectId) : null,
          question: nextQuestion,
          ai_base_url: aiBaseUrl,
          ai_api_key: aiApiKey,
          ai_model: aiModel,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      )

      setMessages((current) => [...current, { role: 'assistant', content: res.data.answer }])
    } catch (err) {
      console.error(err)
      alert('Chat failed')
    } finally {
      setLoading(false)
    }
  }

  // Send on Ctrl+Enter
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault()
      void askAI()
    }
  }

  return (
    <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-2xl shadow-slate-950/30 backdrop-blur-xl">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.22em] text-cyan-300/80">AI chat</p>
          <h2 className="mt-2 font-display text-2xl font-semibold text-white">Talk to your codebase</h2>
        </div>
        <div className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-slate-950/60 px-3 py-2 text-sm text-slate-400">
          <MessageSquareText className="h-4 w-4" />
          Context-aware Q&A
        </div>
      </div>

      {/* Message history — only shown when there are messages */}
      {messages.length > 0 && (
        <div className="mt-5 max-h-[420px] overflow-y-auto rounded-2xl border border-white/10 bg-slate-950/70 p-4 space-y-4 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10">
          {messages.map((message, index) => (
            <div
              key={`${message.role}-${index}`}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-[1.5rem] px-4 py-3 text-sm leading-7 shadow-lg ${
                  message.role === 'user'
                    ? 'rounded-tr-md bg-cyan-400 text-slate-950'
                    : 'rounded-tl-md border border-white/10 bg-white/5 text-slate-200'
                }`}
              >
                <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-[0.22em] opacity-80">
                  {message.role === 'user' ? (
                    <UserRound className="h-3.5 w-3.5" />
                  ) : (
                    <Bot className="h-3.5 w-3.5 text-cyan-300" />
                  )}
                  {message.role === 'user' ? 'You' : 'AI'}
                </div>
                <p className="whitespace-pre-wrap">{message.content}</p>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="rounded-[1.5rem] rounded-tl-md border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300 shadow-lg">
                <div className="flex items-center gap-3">
                  <Loader2 className="h-4 w-4 animate-spin text-cyan-300" />
                  Thinking through the codebase...
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      )}

      {/* Show loading indicator inline if no messages yet */}
      {loading && messages.length === 1 && (
        <div className="mt-5 rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-4">
          <div className="flex items-center gap-3 text-sm text-slate-300">
            <Loader2 className="h-4 w-4 animate-spin text-cyan-300" />
            Thinking through the codebase...
          </div>
        </div>
      )}

      {/* Input area */}
      <div className={`grid gap-3 lg:grid-cols-[1fr_auto] ${messages.length > 0 ? 'mt-4' : 'mt-5'}`}>
        <div className="flex flex-col gap-1">
          <span className="text-xs uppercase tracking-[0.22em] text-slate-400">
            Message <span className="normal-case tracking-normal text-slate-600">(Ctrl+Enter to send)</span>
          </span>
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              messages.length === 0
                ? 'Ask for an explanation, architecture overview, bug hunt, or code walkthrough...'
                : 'Ask a follow-up question...'
            }
            rows={3}
            className="w-full rounded-2xl border border-white/10 bg-slate-950/70 p-4 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-400/50 resize-none"
          />
        </div>

        <button
          onClick={askAI}
          disabled={loading || !question.trim()}
          className="self-end inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-400 to-indigo-400 px-6 py-4 font-semibold text-slate-950 transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          {loading ? 'Thinking...' : 'Send'}
        </button>
      </div>

      <div className="mt-4 flex items-center gap-2 text-xs uppercase tracking-[0.24em] text-slate-500">
        <Sparkles className="h-3.5 w-3.5 text-cyan-300" />
        Uses the same AI provider configured in settings.
      </div>
    </div>
  )
}