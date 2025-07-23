import fs from 'fs'
import path from 'path'
import axios from 'axios'

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

async function fetchSearchVolumeIO(keywords: string[]): Promise<any[]> {
  // SearchVolume.io free endpoint: https://searchvolume.io/
  // They allow up to 800 keywords per request
  const url = 'https://searchvolume.io/api'
  const batchSize = 800
  const results: any[] = []
  for (let i = 0; i < keywords.length; i += batchSize) {
    const batch = keywords.slice(i, i + batchSize)
    try {
      const { data } = await axios.post(
        url,
        { keywords: batch },
        { headers: { 'Content-Type': 'application/json' } }
      )
      if (data && Array.isArray(data)) {
        for (const item of data) {
          if (item.keyword && typeof item.search_volume === 'number') {
            results.push({ query: item.keyword, volume: item.search_volume })
          }
        }
      }
    } catch (e: any) {
      console.error('Error fetching batch:', e?.response?.data || e.message)
    }
    // Respect rate limits
    await new Promise((res) => setTimeout(res, 2000))
  }
  return results
}

async function main() {
  const keywords = readAllKeywords()
  console.log('Total unique keywords:', keywords.length)
  const results = await fetchSearchVolumeIO(keywords)
  fs.writeFileSync(
    path.join(process.cwd(), 'data', 'volume-keywords.json'),
    JSON.stringify(results, null, 2)
  )
  console.log('Saved', results.length, 'volume keywords to data/volume-keywords.json')
}

main()
