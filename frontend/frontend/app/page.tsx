'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function Home() {
  const router = useRouter()
  useEffect(() => {
    router.push('/login')
  }, [router])
  return (
    <div className="min-h-screen flex items-center justify-center px-6 text-slate-100">
      <div className="rounded-[2rem] border border-white/10 bg-white/5 px-6 py-4 text-sm text-slate-300 shadow-2xl backdrop-blur">
        Redirecting to your workspace...
      </div>
    </div>
  )
}