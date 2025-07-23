import fs from 'fs'
import path from 'path'
import yaml from 'js-yaml'

const BLOG_DIR = 'data/ai-blogs/'
const files = fs.readdirSync(BLOG_DIR).filter((f) => f.endsWith('.mdx'))

function extractFrontmatterAndBody(content: string) {
  // Only keep the first YAML frontmatter block at the top
  const firstDash = content.indexOf('---')
  if (firstDash > 0) content = content.slice(firstDash)
  const matches = [...content.matchAll(/---\s*([\s\S]*?)---/g)]
  if (!matches.length) return { frontmatter: '', body: content }
  const frontmatter = matches[0][1]
  let body = content.slice(matches[0][0].length).replace(/^\s+/, '')

  // Remove only code blocks at the very top of the body if they are mdx/yaml/json/blank and contain --- ... ---
  let changed = true
  while (changed) {
    changed = false
    const codeBlockMatch = body.match(/^```(mdx|yaml|json)?\s*([\s\S]*?)```\s*/i)
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
    // Remove any duplicate --- YAML block at the top of the body
    const dashBlockMatch = body.match(/^---\s*[\s\S]*?---\s*/)
    if (dashBlockMatch) {
      body = body.slice(dashBlockMatch[0].length).replace(/^\s+/, '')
      changed = true
    }
  }
  return { frontmatter, body }
}

function getFirstParagraph(body: string): string {
  // Find the first paragraph (up to the first double newline or end of string)
  const idx = body.indexOf('\n\n')
  const para = idx !== -1 ? body.slice(0, idx) : body
  return para.replace(/[#>*`\-\[\]]/g, '').trim()
}

function extractKeywords(title: string): string[] {
  return title
    .replace(/[^a-zA-Z0-9 ]/g, '')
    .split(' ')
    .filter(Boolean)
    .map((w) => w.toLowerCase())
    .filter((v, i, a) => a.indexOf(v) === i)
}

for (const file of files) {
  const fullPath = path.join(BLOG_DIR, file)
  const content = fs.readFileSync(fullPath, 'utf8')
  const { frontmatter, body } = extractFrontmatterAndBody(content)
  let data: any = {}
  try {
    data = yaml.load(frontmatter) || {}
  } catch (e) {
    console.error('YAML parse error in', file)
  }
  // Add summary if missing
  if (!data.summary) {
    data.summary = getFirstParagraph(body)
  }
  // Add tags if missing
  if (!data.tags) {
    data.tags = extractKeywords(data.title || '')
  }
  // Write back clean file
  const normalized = yaml.dump(data, { lineWidth: 1000 })
  fs.writeFileSync(fullPath, `---\n${normalized}---\n\n${body}`)
}
console.log('All ai-blogs cleaned and normalized.')
