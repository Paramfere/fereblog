import fs from 'fs'
import path from 'path'
import axios from 'axios'

const API_KEY = process.env.KEYWORDS_API_KEY
if (!API_KEY) {
  console.error('KEYWORDS_API_KEY not set in environment!')
  process.exit(1)
}

// Helper to read and merge all keywords from the three sources
function readAllKeywords() {
  const files = ['discovered-keywords.json', 'suggest-keywords.json', 'reddit-keywords.json']
  const all: Set<string> = new Set()
  for (const file of files) {
    try {
      const arr = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'data', file), 'utf-8'))
      for (const k of arr) {
        if (k.query && typeof k.query === 'string') all.add(k.query.trim())
      }
    } catch (e) {
      // Ignore missing files
    }
  }
  return Array.from(all)
}

async function fetchKEVolume(keywords: string[]): Promise<any[]> {
  // Keywords Everywhere API: https://keywordseverywhere.com/api.html
  const url = 'https://api.keywordseverywhere.com/v1/get_keyword_data'
  const batchSize = 100
  const results: any[] = []
  for (let i = 0; i < keywords.length; i += batchSize) {
    const batch = keywords.slice(i, i + batchSize)
    try {
      const { data } = await axios.post(
        url,
        {
          country: 'us',
          currency: 'usd',
          dataSource: 'gkp',
          kw: batch,
        },
        {
          headers: {
            Authorization: API_KEY,
            'Content-Type': 'application/json',
          },
        }
      )
      if (data && data.data) {
        for (const k of Object.keys(data.data)) {
          const v = data.data[k]
          results.push({
            query: k,
            volume: v.vol || 0,
            cpc: v.cpc || 0,
            competition: v.comp || 0,
          })
        }
      }
    } catch (e: any) {
      console.error('Error fetching batch:', e?.response?.data || e.message)
    }
    // Respect rate limits
    await new Promise((res) => setTimeout(res, 1500))
  }
  return results
}

async function main() {
  const keywords = readAllKeywords()
  console.log('Total unique keywords:', keywords.length)
  const results = await fetchKEVolume(keywords)
  fs.writeFileSync(
    path.join(process.cwd(), 'data', 'volume-keywords.json'),
    JSON.stringify(results, null, 2)
  )
  console.log('Saved', results.length, 'volume keywords to data/volume-keywords.json')
}

main()
