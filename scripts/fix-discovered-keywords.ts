import fs from 'fs'
import path from 'path'

const filePath = path.join(process.cwd(), 'data', 'discovered-keywords.json')

try {
  const raw = fs.readFileSync(filePath, 'utf-8')
  const arr = JSON.parse(raw)
  if (Array.isArray(arr) && typeof arr[0] === 'string') {
    const fixed = arr.map((q) => ({ query: q, source: 'discovered', score: 0 }))
    fs.writeFileSync(filePath, JSON.stringify(fixed, null, 2))
    console.log('Converted discovered-keywords.json to array of objects.')
  } else {
    console.log('No conversion needed. File is already in correct format.')
  }
} catch (e) {
  console.error('Error processing discovered-keywords.json:', e)
}
