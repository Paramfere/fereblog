import fs from 'fs'
import path from 'path'
import axios from 'axios'

const SEED_KEYWORDS = [
  'AI crypto trading',
  'crypto trading bots',
  'DeFi tools',
  'blockchain analytics',
  'on-chain signals',
  'AI DeFi',
  'crypto trading strategies',
  'AI trading',
  'crypto research',
  'autonomous trading agents',
]

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function scoreKeyword(query: string, source: string): number {
  let score = 0
  if (source === 'suggest') score += 2
  if (query.length > 20) score += 1
  if (query.match(/how|best|buy|tool|guide|free|platform|bot/i)) score += 1
  return score
}

async function fetchSuggest(keyword: string): Promise<string[]> {
  const url = `https://suggestqueries.google.com/complete/search?client=firefox&q=${encodeURIComponent(keyword)}`
  const res = await axios.get(url)
  if (Array.isArray(res.data) && Array.isArray(res.data[1])) {
    return res.data[1]
  }
  return []
}

async function main() {
  const all: { query: string; source: string; score: number }[] = []
  for (const kw of SEED_KEYWORDS) {
    try {
      const suggestions = await fetchSuggest(kw)
      for (const s of suggestions) {
        if (s.length > 15) {
          all.push({ query: s, source: 'suggest', score: scoreKeyword(s, 'suggest') })
        }
      }
      await delay(1500)
    } catch (e) {
      console.error('Error for', kw, e)
    }
  }
  // Deduplicate
  const seen = new Set()
  const unique = all.filter((item) => {
    if (seen.has(item.query)) return false
    seen.add(item.query)
    return true
  })
  fs.writeFileSync(
    path.join(process.cwd(), 'data', 'suggest-keywords.json'),
    JSON.stringify(unique, null, 2)
  )
  console.log('Saved', unique.length, 'Google Suggest keywords to data/suggest-keywords.json')
}

main()
