// GET /api/keywords?source=reddit,suggest&minScore=2
// Returns keywords filtered by source(s) and minimum score (if provided)
import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

function readJson(filePath: string) {
  try {
    const file = fs.readFileSync(filePath, 'utf-8')
    return JSON.parse(file)
  } catch (e) {
    console.log(`Could not read ${filePath}:`, e)
    return []
  }
}

export async function GET(request: Request) {
  const url = new URL(request.url)
  const sourceParam = url.searchParams.get('source') // e.g. 'reddit,suggest'
  const minScoreParam = url.searchParams.get('minScore') // e.g. '2'
  const sourceFilter = sourceParam
    ? sourceParam.split(',').map((s) => s.trim().toLowerCase())
    : null
  const minScore = minScoreParam ? parseInt(minScoreParam, 10) : null

  const discovered = readJson(path.join(process.cwd(), 'data', 'discovered-keywords.json'))
  const suggest = readJson(path.join(process.cwd(), 'data', 'suggest-keywords.json'))
  const reddit = readJson(path.join(process.cwd(), 'data', 'reddit-keywords.json'))
  const competition = readJson(path.join(process.cwd(), 'data', 'competition-keywords.json'))

  // Build a map for competition by query (case-insensitive)
  const compMap = new Map<string, number>()
  for (const c of competition) {
    if (c.query && typeof c.allintitle_results === 'number') {
      compMap.set(c.query.toLowerCase(), c.allintitle_results)
    }
  }

  // Normalize all to { query, source, score, allintitle_results }
  const all = [...discovered, ...suggest, ...reddit].map((k: any) => {
    const allintitle = compMap.has(k.query.toLowerCase())
      ? compMap.get(k.query.toLowerCase())
      : null
    return {
      query: k.query,
      source: k.source || 'manual',
      score: typeof k.score === 'number' ? k.score : 0,
      allintitle_results: allintitle,
    }
  })

  // Deduplicate by query
  const seen = new Set()
  let unique = all.filter((k) => {
    if (seen.has(k.query)) return false
    seen.add(k.query)
    return true
  })

  // Filter by source and minScore
  if (sourceFilter) {
    unique = unique.filter((k) => sourceFilter.includes(k.source.toLowerCase()))
  }
  if (minScore !== null) {
    unique = unique.filter((k) => k.score >= minScore)
  }

  // Sort by score descending by default
  unique.sort((a, b) => b.score - a.score)

  return NextResponse.json({ keywords: unique })
}
