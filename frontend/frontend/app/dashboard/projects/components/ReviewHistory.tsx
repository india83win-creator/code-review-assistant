'use client'
/* eslint-disable react-hooks/set-state-in-effect */

import { useCallback, useEffect, useState } from 'react'
import axios from 'axios'
import { ChevronRight, Clock3, FileSearch, History, Search, Sparkles } from 'lucide-react'

type ReviewIssue = {
  severity?: string
  description?: string
}

type ReviewItem = {
  id: number
  review_type?: string
  summary?: string
  created_at: string
  issues?: ReviewIssue[]
  recommendations?: Array<string | { description?: string }>
}

interface Props {
  projectId: string | null
}

export default function ReviewHistory({ projectId }: Props) {
  const [reviews, setReviews] = useState<ReviewItem[]>([])
  const [selectedReview, setSelectedReview] = useState<ReviewItem | null>(null)
  const [search, setSearch] = useState('')
  const [visibleCount, setVisibleCount] = useState(5)

  const fetchReviews = useCallback(async () => {
    try {
      const token = localStorage.getItem('token')

      const res = await axios.get(
        `http://localhost:8000/api/reviews/${projectId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      )

      setReviews(res.data)
    } catch (err) {
      console.error(err)
    }
  }, [projectId])

  useEffect(() => {
    if (projectId) {
      void fetchReviews()
    }
  }, [projectId, fetchReviews])

  const loadReview = async (reviewId: number) => {
    try {
      const token = localStorage.getItem('token')

      const res = await axios.get(
        `http://localhost:8000/api/reviews/detail/${reviewId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      )

      console.log(res.data)

      setSelectedReview(res.data)
    } catch (err) {
      console.error(err)
    }
  }

  const filteredReviews = reviews.filter((review) =>
    review.summary?.toLowerCase().includes(search.toLowerCase())
  )

  const visibleReviews = filteredReviews.slice(0, visibleCount)

  const formatDate = (value: string) =>
    new Date(`${value}Z`).toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      dateStyle: 'medium',
      timeStyle: 'short',
    })

  const severityClass = (severity?: string) => {
    const value = (severity || 'low').toLowerCase()

    if (value.includes('critical')) return 'border-rose-400/30 bg-rose-400/10 text-rose-200'
    if (value.includes('high')) return 'border-orange-400/30 bg-orange-400/10 text-orange-200'
    if (value.includes('medium')) return 'border-amber-400/30 bg-amber-400/10 text-amber-200'
    return 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200'
  }

  const selectedIssues = selectedReview?.issues ?? []
  const selectedRecommendations = selectedReview?.recommendations ?? []

  return (
    <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-2xl shadow-slate-950/30 backdrop-blur-xl">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.22em] text-cyan-300/80">Review history</p>
          <h2 className="mt-2 font-display text-2xl font-semibold text-white">Timeline of past analysis</h2>
        </div>

        <div className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-slate-950/60 px-3 py-2 text-sm text-slate-400">
          <History className="h-4 w-4" />
          {filteredReviews.length} reviews
        </div>
      </div>

      <div className="mt-5 flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3">
        <Search className="h-4 w-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search reviews by summary..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
        />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_0.95fr]">
        <div className="space-y-3">
          {visibleReviews.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/10 bg-slate-950/40 px-6 py-14 text-center text-slate-400">
              No reviews found.
            </div>
          ) : (
            visibleReviews.map((review) => {
              const isSelected = selectedReview?.id === review.id

              return (
                <button
                  key={review.id}
                  onClick={() => loadReview(review.id)}
                  className={`group w-full rounded-2xl border p-3 text-left transition duration-200 ${isSelected ? 'border-cyan-400/30 bg-cyan-400/10 shadow-lg shadow-cyan-950/10' : 'border-white/10 bg-slate-950/40 hover:-translate-y-0.5 hover:border-white/20 hover:bg-slate-950/70'}`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.22em] text-slate-300">
                          {review.review_type}
                        </span>
                        <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                          <Clock3 className="h-3.5 w-3.5" />
                          {formatDate(review.created_at)}
                        </span>
                      </div>
                      <p className="mt-3 text-sm leading-6 text-slate-300">
                        {review.summary || 'No summary provided.'}
                      </p>
                    </div>

                    <ChevronRight className={`mt-1 h-4 w-4 transition ${isSelected ? 'text-cyan-300' : 'text-slate-500 group-hover:translate-x-0.5 group-hover:text-white'}`} />
                  </div>
                </button>
              )
            })
          )}

          {filteredReviews.length > visibleCount && (
            <button
              onClick={() => setVisibleCount((current) => current + 5)}
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm font-medium text-slate-200 transition duration-200 hover:border-cyan-400/30 hover:bg-cyan-400/10 hover:text-white"
            >
              Load more reviews
            </button>
          )}
        </div>

        {selectedReview ? (
          <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-5 shadow-inner shadow-black/20">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-cyan-300/80">Selected review</p>
                <h3 className="mt-2 font-display text-xl font-semibold text-white">Review details</h3>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-xs uppercase tracking-[0.22em] text-slate-400">
                <Sparkles className="mr-1 inline h-3.5 w-3.5 text-cyan-300" />
                Details
              </div>
            </div>

            <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Summary</p>
              <p className="mt-3 text-sm leading-7 text-slate-300">{selectedReview.summary}</p>
            </div>

            <div className="mt-4 space-y-3">
              <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Issues</p>
              {selectedIssues.length > 0 ? (
                selectedIssues.map((issue: ReviewIssue, index: number) => (
                  <div key={index} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="flex items-center gap-3">
                      <span className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${severityClass(issue.severity)}`}>
                        {issue.severity || 'Low'}
                      </span>
                    </div>
                    <p className="mt-3 text-sm leading-7 text-slate-300">{issue.description}</p>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-white/10 bg-slate-950/40 px-5 py-8 text-sm text-slate-400">
                  No issues found.
                </div>
              )}
            </div>

            <div className="mt-4 space-y-3">
              <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Recommendations</p>
              {selectedRecommendations.length > 0 ? (
                selectedRecommendations.map((rec: string | { description?: string }, index: number) => (
                  <div key={index} className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm leading-7 text-slate-300">
                    {typeof rec === 'string' ? rec : rec.description || JSON.stringify(rec)}
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-white/10 bg-slate-950/40 px-5 py-8 text-sm text-slate-400">
                  No recommendations available.
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-white/10 bg-slate-950/40 px-6 py-14 text-center text-slate-400">
            <FileSearch className="mx-auto h-10 w-10 text-slate-500" />
            <p className="mt-4 text-sm">Select a review on the left to inspect details, severity, and recommendations.</p>
          </div>
        )}
      </div>
    </div>
  )
}