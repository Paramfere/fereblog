'use client'
import React, { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'

interface Keyword {
  query: string
  source: string
  voice_friendly: boolean
  rising: boolean
  pain_points: boolean
  social_buzz: number
  cluster: string
  priority_score?: number
  raw_score?: number
}

const ALL_SOURCES = [
  { label: 'Reddit', value: 'reddit' },
  { label: 'Google Suggest', value: 'suggest' },
  { label: 'SerpApi', value: 'serpapi' },
  { label: 'Manual', value: 'manual' },
  { label: 'Pytrends', value: 'pytrends' },
  { label: 'Discovered', value: 'discovered' },
]

const GenerateBlogAdmin = dynamic(() => import('./generate-blog'), { ssr: false })

export default function AdminDashboard() {
  const [keywords, setKeywords] = useState<Keyword[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedSources, setSelectedSources] = useState<string[]>([])
  const [minScore, setMinScore] = useState<number>(0)
  const [sortField, setSortField] = useState<keyof Keyword | 'priority_score'>('priority_score')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [activeTab, setActiveTab] = useState<'keywords' | 'clusters' | 'generate'>('keywords')
  const [expandedCluster, setExpandedCluster] = useState<string | null>(null)
  const [fetching, setFetching] = useState(false)

  // Load keywords from local enriched file
  async function loadEnriched() {
    setLoading(true)
    try {
      const res = await fetch('/data/enriched-keywords.json?ts=' + Date.now())
      const data: Keyword[] = await res.json()
      // Use backend-calculated raw_score for normalization
      const maxScore = data.reduce(
        (max, k) => (k.raw_score && k.raw_score > max ? k.raw_score : max),
        0
      )
      const withNorm = data.map((k) => ({
        ...k,
        priority_score: maxScore > 0 ? Math.round((k.raw_score! / maxScore) * 100) : 0,
      }))
      setKeywords(withNorm)
    } catch (e) {
      setKeywords([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadEnriched()
  }, [])

  // Fetch fresh keywords (non-blocking, does not clear table)
  async function fetchFreshKeywords() {
    setFetching(true)
    try {
      await fetch('/api/refresh-keywords', { method: 'POST' })
      setTimeout(() => {
        loadEnriched()
        setFetching(false)
      }, 3000)
    } catch {
      setFetching(false)
    }
  }

  // Filtering and sorting for Keywords tab
  let filtered = keywords
  if (selectedSources.length > 0) {
    filtered = filtered.filter((k) => selectedSources.includes(k.source))
  }
  if (minScore > 0) {
    filtered = filtered.filter((k) => (k.priority_score ?? 0) >= minScore)
  }
  filtered = [...filtered].sort((a, b) => {
    const aVal =
      typeof (sortField === 'priority_score' ? a.priority_score : a[sortField]) === 'number'
        ? ((sortField === 'priority_score' ? a.priority_score : (a[sortField] as number)) ?? 0)
        : 0
    const bVal =
      typeof (sortField === 'priority_score' ? b.priority_score : b[sortField]) === 'number'
        ? ((sortField === 'priority_score' ? b.priority_score : (b[sortField] as number)) ?? 0)
        : 0
    return sortOrder === 'asc' ? aVal - bVal : bVal - aVal
  })

  // Clustering logic for Clusters tab
  const clusters: { [cluster: string]: Keyword[] } = {}
  for (const k of keywords) {
    if (!clusters[k.cluster]) clusters[k.cluster] = []
    clusters[k.cluster].push(k)
  }
  const clusterList = Object.entries(clusters).sort((a, b) => b[1].length - a[1].length)

  return (
    <div className="min-h-screen bg-white p-8 font-sans text-black dark:bg-black dark:text-white">
      {/* Tab Navigation */}
      <div className="mb-8 flex border-b border-gray-300 dark:border-gray-700">
        <button
          className={`px-4 py-2 font-semibold ${activeTab === 'keywords' ? 'border-b-2 border-blue-500' : 'text-gray-500'}`}
          onClick={() => setActiveTab('keywords')}
        >
          Keywords
        </button>
        <button
          className={`ml-4 px-4 py-2 font-semibold ${activeTab === 'clusters' ? 'border-b-2 border-blue-500' : 'text-gray-500'}`}
          onClick={() => setActiveTab('clusters')}
        >
          Clusters
        </button>
        <button
          className={`ml-4 px-4 py-2 font-semibold ${activeTab === 'generate' ? 'border-b-2 border-blue-500' : 'text-gray-500'}`}
          onClick={() => setActiveTab('generate')}
        >
          Generate Blog
        </button>
      </div>
      {/* Fetch Fresh Keywords Button */}
      {activeTab !== 'generate' && (
        <div className="mb-4 flex items-center gap-4">
          <button
            onClick={fetchFreshKeywords}
            disabled={fetching}
            className="rounded bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {fetching ? 'Fetching...' : 'Fetch Fresh Keywords'}
          </button>
          <button
            onClick={loadEnriched}
            className="rounded bg-gray-200 px-4 py-2 font-semibold text-black hover:bg-gray-300"
          >
            Reload Local Trends
          </button>
        </div>
      )}
      {/* Normalization Note */}
      {activeTab !== 'generate' && (
        <div className="mb-4 text-sm text-gray-600 dark:text-gray-400">
          <span className="font-semibold">Priority Score:</span> Normalized 0-100. The top keyword
          is 100, others are scaled pro rata.{' '}
          <span title="Raw score = (rising?3)+(pain_points?2)+(voice_friendly?1)+(social_buzz/10)+(pytrends:2, reddit:1)">
            (?)
          </span>
        </div>
      )}
      {/* Keywords Tab */}
      {activeTab === 'keywords' && (
        <div>
          <div className="mb-4 flex flex-wrap items-center gap-4">
            {/* Source filter */}
            <div>
              <span className="mr-2 font-medium">Source:</span>
              {ALL_SOURCES.map((s) => (
                <label key={s.value} className="mr-2">
                  <input
                    type="checkbox"
                    checked={selectedSources.includes(s.value)}
                    onChange={() => {
                      setSelectedSources((prev) =>
                        prev.includes(s.value)
                          ? prev.filter((v) => v !== s.value)
                          : [...prev, s.value]
                      )
                    }}
                  />
                  <span className="ml-1">{s.label}</span>
                </label>
              ))}
            </div>
            {/* Min score filter */}
            <div>
              <span className="mr-2 font-medium">Min Priority Score:</span>
              <input
                type="number"
                value={minScore}
                min={0}
                onChange={(e) => setMinScore(Number(e.target.value))}
                className="w-16 rounded border px-2 py-1"
              />
            </div>
            {/* Sort controls */}
            <div>
              <span className="mr-2 font-medium">Sort by:</span>
              <select
                value={sortField}
                onChange={(e) => setSortField(e.target.value as any)}
                className="rounded border px-2 py-1"
              >
                <option value="priority_score">Priority Score</option>
                <option value="social_buzz">Social Buzz</option>
                <option value="voice_friendly">Voice Friendly</option>
                <option value="rising">Rising</option>
                <option value="pain_points">Pain Points</option>
                <option value="source">Source</option>
                <option value="cluster">Cluster</option>
              </select>
              <button
                className="ml-2 rounded border px-2 py-1"
                onClick={() => setSortOrder((o) => (o === 'asc' ? 'desc' : 'asc'))}
              >
                {sortOrder === 'asc' ? '↑' : '↓'}
              </button>
            </div>
          </div>
          {loading ? (
            <div className="text-gray-500">Loading...</div>
          ) : filtered.length === 0 ? (
            <div className="text-gray-500">
              No keywords found.{' '}
              <button onClick={loadEnriched} className="text-blue-600 underline">
                Reload Local Trends
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full border border-gray-300 dark:border-gray-700">
                <thead>
                  <tr className="bg-gray-100 dark:bg-gray-800">
                    <th className="px-4 py-2 text-left">Keyword</th>
                    <th className="px-4 py-2 text-left">Source</th>
                    <th className="px-4 py-2 text-left">Cluster</th>
                    <th className="px-4 py-2 text-left">Priority Score</th>
                    <th className="px-4 py-2 text-left">Rising</th>
                    <th className="px-4 py-2 text-left">Pain Point</th>
                    <th className="px-4 py-2 text-left">Voice</th>
                    <th className="px-4 py-2 text-left">Social Buzz</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((k, i) => (
                    <tr
                      key={k.query}
                      className={
                        i % 2 === 0 ? 'bg-white dark:bg-black' : 'bg-gray-50 dark:bg-gray-900'
                      }
                    >
                      <td className="px-4 py-2 font-mono text-sm">{k.query}</td>
                      <td className="px-4 py-2 capitalize">{k.source}</td>
                      <td className="px-4 py-2">{k.cluster}</td>
                      <td className="px-4 py-2 font-bold">{k.priority_score}</td>
                      <td className="px-4 py-2">{k.rising ? 'Yes' : ''}</td>
                      <td className="px-4 py-2">{k.pain_points ? 'Yes' : ''}</td>
                      <td className="px-4 py-2">{k.voice_friendly ? 'Yes' : ''}</td>
                      <td className="px-4 py-2">{k.social_buzz}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
      {/* Clusters Tab */}
      {activeTab === 'clusters' && (
        <div>
          <h2 className="mb-4 text-xl font-semibold">Keyword Clusters</h2>
          {clusterList.length === 0 ? (
            <div className="text-gray-500">No clusters found.</div>
          ) : (
            <div>
              {clusterList.map(([cluster, kws]) => (
                <div
                  key={cluster}
                  className="mb-4 border-b border-gray-300 pb-2 dark:border-gray-700"
                >
                  <button
                    className="text-lg font-bold text-blue-600 hover:underline focus:outline-none"
                    onClick={() => setExpandedCluster(expandedCluster === cluster ? null : cluster)}
                  >
                    {cluster} <span className="font-normal text-gray-500">({kws.length})</span>
                  </button>
                  {expandedCluster === cluster && (
                    <div className="mt-2 ml-4">
                      <table className="min-w-full border border-gray-200 dark:border-gray-800">
                        <thead>
                          <tr className="bg-gray-50 dark:bg-gray-900">
                            <th className="px-2 py-1 text-left">Keyword</th>
                            <th className="px-2 py-1 text-left">Priority Score</th>
                            <th className="px-2 py-1 text-left">Rising</th>
                            <th className="px-2 py-1 text-left">Pain Point</th>
                            <th className="px-2 py-1 text-left">Voice</th>
                            <th className="px-2 py-1 text-left">Social Buzz</th>
                          </tr>
                        </thead>
                        <tbody>
                          {kws
                            .sort((a, b) => (b.priority_score ?? 0) - (a.priority_score ?? 0))
                            .map((k) => (
                              <tr key={k.query}>
                                <td className="px-2 py-1 font-mono text-sm">{k.query}</td>
                                <td className="px-2 py-1 font-bold">{k.priority_score}</td>
                                <td className="px-2 py-1">{k.rising ? 'Yes' : ''}</td>
                                <td className="px-2 py-1">{k.pain_points ? 'Yes' : ''}</td>
                                <td className="px-2 py-1">{k.voice_friendly ? 'Yes' : ''}</td>
                                <td className="px-2 py-1">{k.social_buzz}</td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      {/* Generate Blog Tab */}
      {activeTab === 'generate' && <GenerateBlogAdmin />}
    </div>
  )
}
