import fs from 'fs'
import path from 'path'

const files = [
  { name: 'discovered-keywords.json', source: 'discovered' },
  { name: 'suggest-keywords.json', source: 'suggest' },
  { name: 'reddit-keywords.json', source: 'reddit' },
]

for (const { name, source } of files) {
  const filePath = path.join(process.cwd(), 'data', name)
  try {
    if (!fs.existsSync(filePath)) continue
    const raw = fs.readFileSync(filePath, 'utf-8')
    const arr = JSON.parse(raw)
    if (Array.isArray(arr) && typeof arr[0] === 'string') {
      const fixed = arr.map((q) => ({ query: q, source, score: 0 }))
      fs.writeFileSync(filePath, JSON.stringify(fixed, null, 2))
      console.log(`Converted ${name} to array of objects.`)
    }
  } catch (e) {
    console.error(`Error processing ${name}:`, e)
  }
}
