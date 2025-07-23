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

  // Clean up any malformed tables
  content = content.replace(/\|<1s\s*\|/g, '| Under 1s |')
  content = content.replace(/\|<1s\s*\|/g, '| Under 1s |')

  return content.trim()
}

function extractFrontmatterAndBody(content: string) {
  const firstDash = content.indexOf('---')
  if (firstDash > 0) content = content.slice(firstDash)

  const matches = [...content.matchAll(/---\s*([\s\S]*?)---/g)]
  if (!matches.length) return { frontmatter: '', body: content }

  const frontmatter = matches[0][1]
  let body = content.slice(matches[0][0].length).replace(/^\s+/, '')

  // Remove any remaining code blocks or frontmatter from body
  body = cleanMdxContent(body)

  return { frontmatter, body }
}

function getFirstParagraph(body: string): string {
  const lines = body.split('\n')
  for (const line of lines) {
    const trimmed = line.trim()
    if (trimmed && !trimmed.startsWith('#') && !trimmed.startsWith('```')) {
      return trimmed.replace(/[#>*`\[\]]/g, '').trim()
    }
  }
  return 'AI-powered crypto trading insights and strategies.'
}

function extractKeywords(title: string): string[] {
  return title
    .replace(/[^a-zA-Z0-9 ]/g, '')
    .split(' ')
    .filter(Boolean)
    .map((w) => w.toLowerCase())
    .filter((v, i, a) => a.indexOf(v) === i)
    .slice(0, 5)
}

function ensureValidFrontmatter(frontmatter: any, title: string, body: string) {
  // Ensure required fields
  if (!frontmatter.title) frontmatter.title = title
  if (!frontmatter.date) frontmatter.date = '2025-07-22'
  if (!frontmatter.summary) frontmatter.summary = getFirstParagraph(body)
  if (!frontmatter.tags) frontmatter.tags = extractKeywords(title)

  // Remove problematic fields
  delete frontmatter.schema
  delete frontmatter.excerpt
  delete frontmatter.description
  delete frontmatter.keywords
  delete frontmatter.category
  delete frontmatter.image
  delete frontmatter.howTo

  return frontmatter
}

function fixMdxFile(filePath: string) {
  try {
    const content = fs.readFileSync(filePath, 'utf8')
    const { frontmatter, body } = extractFrontmatterAndBody(content)

    let data: any = {}
    try {
      data = yaml.load(frontmatter) || {}
    } catch (e) {
      console.error('YAML parse error in', filePath)
      return false
    }

    // Get title from filename if not in frontmatter
    const filename = path.basename(filePath, '.mdx')
    const title =
      data.title ||
      filename
        .replace(/-/g, ' ')
        .replace(/\d{4}-\d{2}-\d{2}$/, '')
        .trim()

    // Clean and validate frontmatter
    data = ensureValidFrontmatter(data, title, body)

    // Create clean content
    const normalized = yaml.dump(data, { lineWidth: 1000 })
    const cleanContent = `---\n${normalized}---\n\n${body}`

    fs.writeFileSync(filePath, cleanContent)
    console.log(`✅ Fixed: ${path.basename(filePath)}`)
    return true
  } catch (e) {
    console.error(`❌ Error fixing ${filePath}:`, e)
    return false
  }
}

function generateNewWorkingBlog(keyword: string) {
  const today = new Date().toISOString().split('T')[0]
  const slug = keyword
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
  const filename = `${slug}-${today}.mdx`
  const filePath = path.join(BLOG_DIR, filename)

  const title = keyword.charAt(0).toUpperCase() + keyword.slice(1)
  const summary = `Comprehensive guide to ${keyword.toLowerCase()} in crypto trading, featuring AI-powered strategies and real-world applications.`
  const tags = extractKeywords(keyword)

  const frontmatter = {
    title,
    date: today,
    summary,
    tags,
  }

  const body = `# ${title}

## Introduction

${keyword} has become increasingly important in the crypto trading landscape. This comprehensive guide explores the latest developments, strategies, and practical applications.

## Why ${keyword} Matters

The crypto market continues to evolve, and understanding ${keyword.toLowerCase()} is crucial for successful trading. Here's what you need to know:

- **Market Dynamics**: Understanding how ${keyword.toLowerCase()} affects trading decisions
- **Risk Management**: Implementing proper risk controls
- **Performance Optimization**: Maximizing returns while minimizing losses

## Key Strategies

### 1. Technical Analysis
Modern trading requires sophisticated analysis techniques that incorporate ${keyword.toLowerCase()} into decision-making processes.

### 2. Risk Management
Proper risk management is essential when dealing with ${keyword.toLowerCase()} in volatile markets.

### 3. Performance Tracking
Regular monitoring and adjustment of strategies based on ${keyword.toLowerCase()} performance metrics.

## Real-World Applications

Many successful traders have integrated ${keyword.toLowerCase()} into their strategies with impressive results. The key is understanding both the opportunities and risks involved.

## Conclusion

${keyword} represents a significant opportunity for crypto traders who take the time to understand its complexities and implement proper strategies.

---

*Source: FereAI Research Team*`

  const content = `---\n${yaml.dump(frontmatter, { lineWidth: 1000 })}---\n\n${body}`

  fs.writeFileSync(filePath, content)
  console.log(`✅ Generated new blog: ${filename}`)
  return filename
}

// Main execution
console.log('🔧 Fixing all MDX issues...')

const files = fs.readdirSync(BLOG_DIR).filter((f) => f.endsWith('.mdx'))
let fixedCount = 0

for (const file of files) {
  const fullPath = path.join(BLOG_DIR, file)
  if (fixMdxFile(fullPath)) {
    fixedCount++
  }
}

console.log(`\n📊 Fixed ${fixedCount} out of ${files.length} files`)

// Generate a few new working blogs
const newKeywords = [
  'AI Trading Strategies',
  'Crypto Risk Management',
  'DeFi Yield Optimization',
  'Solana Trading Bots',
  'Cross-Chain Arbitrage',
]

console.log('\n🚀 Generating new working blogs...')
for (const keyword of newKeywords) {
  generateNewWorkingBlog(keyword)
}

console.log('\n✅ All MDX issues fixed and new content generated!')
