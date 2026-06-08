'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'

export default function Dashboard() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [projects, setProjects] = useState([])
  const [newProject, setNewProject] = useState({ name: '', description: '' })
  const [loading, setLoading] = useState(false)

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : ''
  const headers = { Authorization: `Bearer ${token}` }

  useEffect(() => {
    const u = localStorage.getItem('username')
    if (!token) { router.push('/login'); return }
    setUsername(u || '')
    fetchProjects()
  }, [])

  const fetchProjects = async () => {
    const res = await axios.get('https://code-review-assistant-api-i4ws.onrender.com/api/projects/', { headers })
    setProjects(res.data)
  }

  const createProject = async () => {
    if (!newProject.name) return
    setLoading(true)
    await axios.post('https://code-review-assistant-api-i4ws.onrender.com/api/projects/', newProject, { headers })
    setNewProject({ name: '', description: '' })
    await fetchProjects()
    setLoading(false)
  }

  const deleteProject = async (id: number) => {
    await axios.delete(`https://code-review-assistant-api-i4ws.onrender.com/api/projects/${id}`, { headers })
    await fetchProjects()
  }

  const logout = () => {
    localStorage.clear()
    router.push('/login')
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <nav className="bg-gray-900 border-b border-gray-800 px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-blue-400">Code Review AI</h1>
        <div className="flex items-center gap-4">
          <span className="text-gray-400">Hello, {username}</span>
          <button onClick={logout} className="text-sm text-red-400 hover:text-red-300">Logout</button>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto p-6">
        <h2 className="text-2xl font-bold mb-6">My Projects</h2>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-8">
          <h3 className="text-lg font-semibold mb-4">Create New Project</h3>
          <div className="flex gap-3">
            <input
              className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
              placeholder="Project name"
              value={newProject.name}
              onChange={e => setNewProject({ ...newProject, name: e.target.value })}
            />
            <input
              className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
              placeholder="Description (optional)"
              value={newProject.description}
              onChange={e => setNewProject({ ...newProject, description: e.target.value })}
            />
            <button
              onClick={createProject}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-lg font-semibold disabled:opacity-50"
            >
              {loading ? '...' : 'Create'}
            </button>
          </div>
        </div>

        <div className="grid gap-4">
          {projects.length === 0 && (
            <div className="text-center text-gray-500 py-12">No projects yet. Create one above!</div>
          )}
          {projects.map((p: any) => (
            <div key={p.id} className="bg-gray-900 border border-gray-800 rounded-xl p-6 flex justify-between items-center hover:border-gray-600 transition">
              <div>
                <h3 className="text-lg font-semibold">{p.name}</h3>
                <p className="text-gray-400 text-sm">{p.description}</p>
                <p className="text-gray-600 text-xs mt-1">{new Date(p.created_at).toLocaleDateString()}</p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => router.push(`/dashboard/projects?id=${p.id}&name=${p.name}`)}
                  className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-sm font-semibold"
                >
                  Open
                </button>
                <button
                  onClick={() => deleteProject(p.id)}
                  className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg text-sm font-semibold"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}