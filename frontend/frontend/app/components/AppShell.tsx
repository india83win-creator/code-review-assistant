'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Bot, ChevronsLeft, ChevronsRight, FolderCode, History, LayoutDashboard, LogOut, Settings, UserCircle } from 'lucide-react'
import type { ReactNode } from 'react'
import { useState } from 'react'

const navItems = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Projects', href: '/projects', icon: FolderCode },
  { label: 'Reviews', href: '/reviews', icon: History },
  { label: 'AI Settings', href: '/ai-settings', icon: Settings },
]

const roleBadgeText = (role?: string | null) => {
  const normalized = role?.toLowerCase()
  if (normalized === 'founder') return 'FOUNDER ADMIN'
  if (normalized === 'admin') return 'ADMIN'
  if (normalized === 'member') return 'MEMBER'
  return ''
}

export default function AppShell({ children, username = 'Member', role, aiProvider = 'Ollama / Local' }: { children: ReactNode; username?: string; role?: string | null; aiProvider?: string }) {
  const pathname = usePathname()
  const router = useRouter()
  const [collapsed, setCollapsed] = useState(false)
  const badgeText = roleBadgeText(role)

  const logout = () => {
    localStorage.clear()
    router.push('/login')
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto flex min-h-screen max-w-[1800px] flex-col lg:flex-row">
        <aside className={`border-b border-white/10 bg-slate-950/90 px-4 py-5 backdrop-blur-xl transition-all duration-300 lg:sticky lg:top-0 lg:h-screen lg:border-b-0 lg:border-r ${collapsed ? 'lg:w-[104px]' : 'lg:w-80'}`}>
          <div className="flex h-full flex-col rounded-[1.75rem] border border-white/10 bg-white/5 p-4 shadow-2xl shadow-slate-950/40">
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-cyan-400 text-slate-950 shadow-lg shadow-cyan-500/20">
                  <Bot className="h-6 w-6" />
                </div>
                {!collapsed && (
                  <div className="min-w-0">
                    <p className="font-display text-base font-semibold text-white">Code Review AI</p>
                    <p className="truncate text-xs text-slate-400">AI review workspace</p>
                  </div>
                )}
              </div>

              <button
                type="button"
                aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                onClick={() => setCollapsed((value) => !value)}
                className="hidden rounded-xl border border-white/10 bg-slate-950/60 p-2 text-slate-300 transition hover:border-cyan-400/35 hover:bg-cyan-400/10 hover:text-white lg:inline-flex"
              >
                {collapsed ? <ChevronsRight className="h-4 w-4" /> : <ChevronsLeft className="h-4 w-4" />}
              </button>
            </div>

            <nav className="mt-6 space-y-2 text-sm">
              {navItems.map((item) => {
                const active = pathname === item.href || (item.href === '/dashboard' && pathname.startsWith('/dashboard'))

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    title={collapsed ? item.label : undefined}
                    className={`relative flex items-center gap-3 overflow-hidden rounded-2xl border px-3 py-3 transition duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-slate-950/30 ${active ? 'border-cyan-400/30 bg-cyan-400/10 text-white shadow-[0_0_28px_rgba(0,212,255,0.14)]' : 'border-white/5 bg-white/5 text-slate-300 hover:border-cyan-400/20 hover:bg-cyan-400/10 hover:text-white'}`}
                  >
                    {active && <span className="absolute left-0 top-2 h-[calc(100%-1rem)] w-1 rounded-r-full bg-[#00D4FF] shadow-[0_0_18px_#00D4FF]" />}
                    <item.icon className="h-4 w-4 shrink-0" />
                    {!collapsed && <span>{item.label}</span>}
                  </Link>
                )
              })}
            </nav>

            <div className="mt-auto space-y-3">
              {/* About Developer nav item */}
              <Link
                href="/about"
                title={collapsed ? 'About Developer' : undefined}
                className={`relative flex items-center gap-3 overflow-hidden rounded-2xl border px-3 py-3 text-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-slate-950/30 ${pathname === '/about' ? 'border-cyan-400/30 bg-cyan-400/10 text-white shadow-[0_0_28px_rgba(0,212,255,0.14)]' : 'border-white/5 bg-white/5 text-slate-300 hover:border-cyan-400/20 hover:bg-cyan-400/10 hover:text-white'}`}
              >
                {pathname === '/about' && <span className="absolute left-0 top-2 h-[calc(100%-1rem)] w-1 rounded-r-full bg-[#00D4FF] shadow-[0_0_18px_#00D4FF]" />}
                <UserCircle className="h-4 w-4 shrink-0" />
                {!collapsed && <span>About Developer</span>}
              </Link>

              <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-cyan-400/15 text-sm font-semibold text-cyan-100 ring-1 ring-cyan-400/25">
                    {(username || 'M').slice(0, 1).toUpperCase()}
                  </div>
                  {!collapsed && (
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-white">{username || 'Member'}</p>
                      {badgeText && (
                        <p className="mt-1 inline-flex rounded-full border border-cyan-400/20 bg-cyan-400/10 px-2 py-0.5 text-[10px] uppercase tracking-[0.18em] text-cyan-200">
                          {badgeText}
                        </p>
                      )}
                    </div>
                  )}
                </div>
                {!collapsed && <p className="mt-3 truncate text-xs text-slate-400">Provider: {aiProvider}</p>}
              </div>

              <button
                onClick={logout}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm font-medium text-rose-200 transition hover:bg-rose-400/15"
              >
                <LogOut className="h-4 w-4" />
                {!collapsed && 'Logout'}
              </button>
            </div>
          </div>
        </aside>

        <main className="flex-1 px-4 py-5 transition-opacity duration-300 sm:px-6 lg:px-8 lg:py-8">{children}</main>
      </div>
    </div>
  )
}