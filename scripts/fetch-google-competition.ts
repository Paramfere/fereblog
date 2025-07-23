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

function parseAllintitleResults(html: string): number {
  // Google result count is in: <div id="result-stats">About 1,230 results</div>
  const match = html.match(/About ([\d,]+) results|([\d,]+) results/)
  if (match) {
    const num = match[1] || match[2]
    return parseInt(num.replace(/,/g, ''), 10)
  }
  return 0
}

async function fetchAllintitle(keyword: string): Promise<number> {
  const url = `https://www.google.com/search?q=allintitle:%22${encodeURIComponent(keyword)}%22`
  try {
    const res = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; FereAI/1.0)',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    })
    return parseAllintitleResults(res.data)
  } catch (e: any) {
    console.error('Error fetching', keyword, e?.response?.status || e.message)
    return 0
  }
}

async function main() {
  const keywords = readAllKeywords()
  console.log('Total unique keywords:', keywords.length)
  const results: { query: string; allintitle_results: number }[] = []
  for (const [i, kw] of keywords.entries()) {
    const count = await fetchAllintitle(kw)
    results.push({ query: kw, allintitle_results: count })
    console.log(`[${i + 1}/${keywords.length}]`, kw, '->', count)
    await new Promise((res) => setTimeout(res, 3000)) // 3s delay to avoid rate limits
  }
  fs.writeFileSync(
    path.join(process.cwd(), 'data', 'competition-keywords.json'),
    JSON.stringify(results, null, 2)
  )
  console.log('Saved', results.length, 'competition keywords to data/competition-keywords.json')
}

main()
