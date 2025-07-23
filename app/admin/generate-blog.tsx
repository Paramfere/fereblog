import { useState } from 'react'

// TODO: Add real admin authentication/authorization here
export default function GenerateBlogAdmin() {
  const [keyword, setKeyword] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [url, setUrl] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setSuccess(null)
    setError(null)
    setUrl(null)
    try {
      const res = await fetch('/api/generate-blog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword }),
      })
      const data = await res.json()
      if (data.success) {
        setSuccess('Blog generated!')
        setUrl(data.url)
      } else {
        setError(data.error || 'Unknown error')
      }
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      style={{
        maxWidth: 500,
        margin: '2rem auto',
        padding: 24,
        border: '1px solid #eee',
        borderRadius: 8,
      }}
    >
      <h2>Generate Blog Post (Admin)</h2>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <input
          type="text"
          placeholder="Enter custom keyword (optional)"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          style={{ padding: 8, fontSize: 16 }}
        />
        <button
          type="submit"
          disabled={loading}
          style={{
            padding: 10,
            fontSize: 16,
            background: '#0070f3',
            color: '#fff',
            border: 'none',
            borderRadius: 4,
          }}
        >
          {loading ? 'Generating...' : 'Generate Blog'}
        </button>
      </form>
      {success && (
        <p style={{ color: 'green', marginTop: 16 }}>
          {success}{' '}
          {url && (
            <a href={url} target="_blank" rel="noopener noreferrer">
              View Post
            </a>
          )}
        </p>
      )}
      {error && <p style={{ color: 'red', marginTop: 16 }}>{error}</p>}
    </div>
  )
}
