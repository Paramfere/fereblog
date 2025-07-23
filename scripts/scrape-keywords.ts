import fs from 'fs'
import path from 'path'
import axios from 'axios'

const SERPAPI_KEY = 'b48a5c2c124dd5339edce7a6e56089d10bfde02eca09cbb32de2ab9098bc2f78'
const QUERIES = [
  'AI crypto trading',
  'AI trading bots',
  'crypto trading research',
  'AI DeFi tools',
  'best AI crypto strategies',
  'AI crypto research',
  'AI DeFi yield',
  'AI trading for Solana',
  'AI trading for Base chain',
  'AI crypto execution',
]

async function fetchSerpApiResults(query: string) {
  const url = `https://serpapi.com/search.json?q=${encodeURIComponent(query)}&api_key=${SERPAPI_KEY}&hl=en&gl=us`
  const { data } = await axios.get(url)
  // Extract organic result titles, People Also Ask, related searches
  const results: string[] = []
  if (data.organic_results) {
    for (const r of data.organic_results) {
      if (r.title) results.push(r.title)
    }
  }
  if (data.related_questions) {
    for (const q of data.related_questions) {
      if (q.question) results.push(q.question)
    }
  }
  if (data.related_searches) {
    for (const r of data.related_searches) {
      if (r.query) results.push(r.query)
    }
  }
  return results
}

async function main() {
  let allKeywords: string[] = []
  for (const query of QUERIES) {
    try {
      const keywords = await fetchSerpApiResults(query)
      allKeywords = allKeywords.concat(keywords)
    } catch (e) {
      console.error('Error fetching for query:', query, e)
    }
  }
  // Deduplicate and filter for long-tail, high-intent keywords
  const unique = Array.from(new Set(allKeywords.map((k) => k.trim()))).filter(
    (k) => k.length > 15 && !k.match(/^(https?:|www\.)/i)
  )
  // Save to data/discovered-keywords.json
  fs.writeFileSync(
    path.join(process.cwd(), 'data', 'discovered-keywords.json'),
    JSON.stringify(unique, null, 2)
  )
  console.log('Discovered keywords:', unique.slice(0, 20))
}

main()
