import fs from 'fs'
import path from 'path'
import yaml from 'js-yaml'

const BLOG_DIR = 'data/ai-blogs/'

function cleanMdxContent(content: string): string {
  // Remove any code blocks that contain frontmatter-like content
  content = content.replace(/```mdx\s*[\s\S]*?```/g, '')
  content = content.replace(/```yaml\s*[\s\S]*?```/g, '')
  content = content.replace(/```json\s*[\s\S]*?```/g, '')

  // Remove any stray frontmatter blocks in the body
  content = content.replace(/---\s*[\s\S]*?---\s*/g, '')

  // Remove any TypeScript/JS type definitions that aren't in code blocks
  content = content.replace(/^\s*(interface|type|const|let|var)\s+[\s\S]*?;/gm, '')

  // Fix malformed tables - replace <1s with Under 1s
  content = content.replace(/\|<1s/g, '|Under 1s')
  content = content.replace(/\|<1S/g, '|Under 1s')
  content = content.replace(/\|<1 s/g, '|Under 1s')

  // Fix any other malformed table cells
  content = content.replace(/\|([^|]*)\|([^|]*)\|([^|]*)\|/g, (match, cell1, cell2, cell3) => {
    return `|${cell1.trim()}|${cell2.trim()}|${cell3.trim()}|`
  })

  // Remove any empty table rows
  content = content.replace(/\|\s*\|\s*\|\s*\|/g, '')

  // Clean up any malformed headers
  content = content.replace(/^#{1,6}\s*$/gm, '')

  return content.trim()
}

function extractFrontmatterAndBody(content: string) {
  const firstDash = content.indexOf('---')
  if (firstDash > 0) content = content.slice(firstDash)
  const matches = [...content.matchAll(/---\s*([\s\S]*?)---/g)]
  if (!matches.length) return { frontmatter: '', body: content }
  const frontmatter = matches[0][1]
  let body = content.slice(matches[0][0].length).replace(/^\s+/, '')

  // Remove any code blocks at the top that look like frontmatter
  let changed = true
  while (changed) {
    changed = false
    const codeBlockMatch = body.match(/^```(mdx|yaml|json)?\s*([\s\S]*?)\s*```\s*/i)
    if (codeBlockMatch) {
      const lang = codeBlockMatch[1] ? codeBlockMatch[1].toLowerCase() : ''
      const code = codeBlockMatch[2]
      if (
        (lang === 'mdx' || lang === 'yaml' || lang === 'json' || lang === '') &&
        /---[\s\S]*---/.test(code)
      ) {
        body = body.slice(codeBlockMatch[0].length).replace(/^\s+/, '')
        changed = true
        continue
      }
    }
    const dashBlockMatch = body.match(/^---\s*[\s\S]*?---\s*/)
    if (dashBlockMatch) {
      body = body.slice(dashBlockMatch[0].length).replace(/^\s+/, '')
      changed = true
    }
  }
  return { frontmatter, body }
}

function getFirstParagraph(body: string): string {
  const idx = body.indexOf('\n\n')
  const para = idx !== -1 ? body.slice(0, idx) : body
  return para.replace(/[#>*`\[\]]/g, '').trim()
}

function extractKeywords(title: string): string[] {
  return title
    .replace(/[^a-zA-Z0-9 ]/g, '')
    .split(' ')
    .filter(Boolean)
    .map((w) => w.toLowerCase())
    .filter((v, i, a) => a.indexOf(v) === i)
}

function ensureValidFrontmatter(frontmatter: string, title: string, date: string): string {
  let data: any = {}
  try {
    data = yaml.load(frontmatter) || {}
  } catch (e) {
    console.error('YAML parsing error, creating new frontmatter')
    data = {}
  }

  // Ensure required fields
  if (!data.title) data.title = title
  if (!data.date) data.date = date
  if (!data.summary) {
    // We'll add this after processing the body
    data.summary = ''
  }
  if (!data.tags) {
    data.tags = extractKeywords(title)
  }

  // Clean up any malformed fields
  if (typeof data.summary === 'string' && data.summary.includes('```mdx')) {
    data.summary = ''
  }

  return yaml.dump(data)
}

function processFile(filePath: string) {
  console.log(`Processing: ${filePath}`)
  const content = fs.readFileSync(filePath, 'utf8')
  const { frontmatter, body } = extractFrontmatterAndBody(content)

  // Clean the body content
  const cleanedBody = cleanMdxContent(body)

  // Extract title from filename if not in frontmatter
  const filename = path.basename(filePath, '.mdx')
  const title = filename
    .replace(/-/g, ' ')
    .replace(/\d{4}-\d{2}-\d{2}$/, '')
    .trim()
  const date = '2025-07-22'

  // Create valid frontmatter
  const validFrontmatter = ensureValidFrontmatter(frontmatter, title, date)

  // Get summary from first paragraph
  const firstParagraph = getFirstParagraph(cleanedBody)
  const summary =
    firstParagraph.length > 200 ? firstParagraph.substring(0, 200) + '...' : firstParagraph

  // Update frontmatter with summary
  let data: any = {}
  try {
    data = yaml.load(validFrontmatter) || {}
  } catch (e) {
    data = {}
  }
  data.summary = summary

  // Write the cleaned file
  const finalContent = `---\n${yaml.dump(data)}---\n\n${cleanedBody}`
  fs.writeFileSync(filePath, finalContent)
  console.log(`✓ Fixed: ${filePath}`)
}

// Main execution
console.log('Starting comprehensive MDX cleanup...')

const files = fs.readdirSync(BLOG_DIR).filter((f) => f.endsWith('.mdx'))
console.log(`Found ${files.length} MDX files to process`)

for (const file of files) {
  const fullPath = path.join(BLOG_DIR, file)
  try {
    processFile(fullPath)
  } catch (error) {
    console.error(`Error processing ${file}:`, error)
  }
}

console.log('Comprehensive cleanup completed!')
