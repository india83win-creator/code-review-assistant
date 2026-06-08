import { Suspense } from 'react'
import ProjectWorkspaceClient from './ProjectWorkspaceClient'

export default function ProjectPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
          <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm text-slate-300">
            Loading project workspace...
          </div>
        </div>
      }
    >
      <ProjectWorkspaceClient />
    </Suspense>
  )
}
