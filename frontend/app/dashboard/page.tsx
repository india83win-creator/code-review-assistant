'use client'
import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import axios from 'axios'
import { Suspense } from 'react'

function ProjectPage() {
  const router = useRouter()
  const params = useSearchParams()
  const projectId = params.get('id')
  const projectName = params.get('name')

  const [files, setFiles] = useState([])
  const [selectedFile, setSelectedFile] = useState<any>(null)
  const [fileContent, setFileContent] = useState('')
  const [uploading, setUploading] = useState(false)
  const [reviews, setReviews] = useState([])
  const [selectedReview, setSelectedReview] = useState<any>(null)
  const [reviewType, setReviewType] = useState('general')
  const [aiConfig, setAiConfig] = useState({ base_url: 'https://api.openai.com/v1', api_key: '', model: 'gpt-3.5-turbo' })
  const [reviewing, setReviewing] = useState(false)
  const [activeTab, setActiveTab] = useState('files')

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : ''
  const headers = { Authorization: `Bearer ${token}` }

  useEffect(() => {
    if (!token) { router.push('/login'); return }
    fetchFiles()
    fetchReviews()
  }, [])

  const fetchFiles = async () => {
    const res = await axios.get(`https://code-review-assistant-api-i4ws.onrender.com/api/files/${projectId}`, { headers })
    setFiles(res.data)
  }

  const fetchReviews = async () => {
    const res = await axios.get(`https://code-review-assistant-api-i4ws.onrender.com/api/reviews/${projectId}`, { headers })
    setReviews(res.data)
  }

  const uploadFile = async (e: any) => {
    const file = e.target.files[0]
    if (!file) return
    setUploading(true)
    const formData = new FormData()
    formData.append('file', file)
    await axios.post(`https://code-review-assistant-api-i4ws.onrender.com/api/files/upload/${projectId}`, formData, {
      headers: { ...headers, 'Content-Type': 'multipart/form-data' }
    })
    await fetchFiles()
    setUploading(false)
  }

  const viewFile = async (file: any) => {
    setSelectedFile(file)
    const res = await axios.get(`https://code-review-assistant-api-i4ws.onrender.com/api/files/content/${file.id}`, { headers })
    setFileContent(res.data.content)
  }

  const runReview = async () => {
    setReviewing(true)
    try {
      const res = await axios.post('https://code-review-assistant-api-i4ws.onrender.com/api/reviews/', {
        project_id: parseInt(projectId!),
        file_id: selectedFile?.id || null,
        review_type: reviewType,
        ai_base_url: aiConfig.base_url,
        ai_api_key: aiConfig.api_key,
        ai_model: aiConfig.model
      }, { headers })
      setSelectedReview(res.data)
      await fetchReviews()
      setActiveTab('reviews')
    } catch (e: any) {
      alert(e.response?.data?.detail || 'Review failed')
    }
    setReviewing(false)
  }

  const severityColor: any = { critical: 'text-red-400', high: 'text-orange-400', medium: 'text-yellow-400', low: 'text-green-400' }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <nav className="bg-gray-900 border-b border-gray-800 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/dashboard')} className="text-gray-400 hover:text-white">← Back</button>
          <h1 className="text-xl font-bold text-blue-400">{projectName}</h1>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto p-6">
        <div className="flex gap-4 mb-6">
          {['files', 'review', 'reviews'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg font-semibold capitalize ${activeTab === tab ? 'bg-blue-600' : 'bg-gray-800 hover:bg-gray-700'}`}>
              {tab}
            </button>
          ))}
        </div>

        {activeTab === 'files' && (
          <div className="grid grid-cols-3 gap-6">
            <div className="col-span-1 bg-gray-900 border border-gray-800 rounded-xl p-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold">Files</h3>
                <label className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded-lg text-sm cursor-pointer">
                  {uploading ? '...' : '+ Upload'}
                  <input type="file" className="hidden" onChange={uploadFile} />
                </label>
              </div>
              {files.length === 0 && <p className="text-gray-500 text-sm">No files yet</p>}
              {files.map((f: any) => (
                <div key={f.id} onClick={() => viewFile(f)}
                  className={`p-3 rounded-lg cursor-pointer mb-2 text-sm ${selectedFile?.id === f.id ? 'bg-blue-900 border border-blue-500' : 'bg-gray-800 hover:bg-gray-700'}`}>
                  📄 {f.filename}
                </div>
              ))}
            </div>
            <div className="col-span-2 bg-gray-900 border border-gray-800 rounded-xl p-4">
              {selectedFile ? (
                <>
                  <h3 className="font-semibold mb-3">{selectedFile.filename}</h3>
                  <pre className="text-sm text-gray-300 overflow-auto max-h-96 bg-gray-950 p-4 rounded-lg">{fileContent}</pre>
                </>
              ) : (
                <div className="flex items-center justify-center h-48 text-gray-500">Select a file to preview</div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'review' && (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <h3 className="text-lg font-semibold mb-6">Run AI Review</h3>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <label className="text-sm text-gray-400 mb-1 block">Review Type</label>
                <select value={reviewType} onChange={e => setReviewType(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white">
                  <option value="general">General Review</option>
                  <option value="security">Security Review</option>
                  <option value="performance">Performance Review</option>
                  <option value="quality">Code Quality Review</option>
                </select>
              </div>
              <div>
                <label className="text-sm text-gray-400 mb-1 block">File (optional)</label>
                <select onChange={e => setSelectedFile(files.find((f: any) => f.id === parseInt(e.target.value)) || null)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white">
                  <option value="">All files</option>
                  {files.map((f: any) => <option key={f.id} value={f.id}>{f.filename}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm text-gray-400 mb-1 block">AI Base URL</label>
                <input value={aiConfig.base_url} onChange={e => setAiConfig({ ...aiConfig, base_url: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white" />
              </div>
              <div>
                <label className="text-sm text-gray-400 mb-1 block">Model</label>
                <input value={aiConfig.model} onChange={e => setAiConfig({ ...aiConfig, model: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white" />
              </div>
              <div className="col-span-2">
                <label className="text-sm text-gray-400 mb-1 block">API Key</label>
                <input type="password" value={aiConfig.api_key} onChange={e => setAiConfig({ ...aiConfig, api_key: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white" placeholder="sk-..." />
              </div>
            </div>
            <button onClick={runReview} disabled={reviewing}
              className="bg-blue-600 hover:bg-blue-700 px-8 py-3 rounded-lg font-semibold disabled:opacity-50">
              {reviewing ? 'Reviewing...' : 'Run Review'}
            </button>
          </div>
        )}

        {activeTab === 'reviews' && (
          <div className="grid grid-cols-3 gap-6">
            <div className="col-span-1 bg-gray-900 border border-gray-800 rounded-xl p-4">
              <h3 className="font-semibold mb-4">Review History</h3>
              {reviews.length === 0 && <p className="text-gray-500 text-sm">No reviews yet</p>}
              {reviews.map((r: any) => (
                <div key={r.id} onClick={() => setSelectedReview(r)}
                  className={`p-3 rounded-lg cursor-pointer mb-2 text-sm ${selectedReview?.id === r.id ? 'bg-blue-900 border border-blue-500' : 'bg-gray-800 hover:bg-gray-700'}`}>
                  <div className="font-semibold capitalize">{r.review_type}</div>
                  <div className="text-gray-400 text-xs">{new Date(r.created_at).toLocaleString()}</div>
                </div>
              ))}
            </div>
            <div className="col-span-2 bg-gray-900 border border-gray-800 rounded-xl p-4">
              {selectedReview ? (
                <div>
                  <h3 className="font-semibold mb-3 capitalize">{selectedReview.review_type} Review</h3>
                  <div className="bg-gray-800 rounded-lg p-4 mb-4">
                    <h4 className="text-blue-400 font-semibold mb-2">Summary</h4>
                    <p className="text-gray-300 text-sm">{selectedReview.summary}</p>
                  </div>
                  {selectedReview.issues?.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-orange-400 font-semibold mb-2">Issues</h4>
                      {selectedReview.issues.map((issue: any, i: number) => (
                        <div key={i} className="bg-gray-800 rounded-lg p-3 mb-2">
                          <span className={`text-xs font-bold uppercase ${severityColor[issue.severity] || 'text-gray-400'}`}>{issue.severity}</span>
                          <p className="text-gray-300 text-sm mt-1">{issue.description}</p>
                        </div>
                      ))}
                    </div>
                  )}
                  {selectedReview.recommendations?.length > 0 && (
                    <div>
                      <h4 className="text-green-400 font-semibold mb-2">Recommendations</h4>
                      {selectedReview.recommendations.map((rec: string, i: number) => (
                        <div key={i} className="bg-gray-800 rounded-lg p-3 mb-2 text-gray-300 text-sm">✓ {rec}</div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-center h-48 text-gray-500">Select a review to see details</div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function ProjectPageWrapper() {
  return <Suspense><ProjectPage /></Suspense>
}