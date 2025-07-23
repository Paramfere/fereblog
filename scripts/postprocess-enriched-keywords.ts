import fs from 'fs'
import path from 'path'

const src = path.join(process.cwd(), 'data', 'enriched-keywords.json')
const destDir = path.join(process.cwd(), 'public', 'data')
const dest = path.join(destDir, 'enriched-keywords.json')

try {
  if (!fs.existsSync(src)) {
    console.error('Source file does not exist:', src)
    process.exit(1)
  }
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true })
  }
  fs.copyFileSync(src, dest)
  console.log('Copied enriched-keywords.json to public/data/')
} catch (e) {
  console.error('Error copying enriched-keywords.json:', e)
  process.exit(1)
}
