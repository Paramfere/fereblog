import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'

// List of keywords with their corresponding dates (Jan 1-20, 2025)
const keywords = [
  'AI Backtesting Tools',
  'AI Crypto Agents Solana',
  'AI Trading Strategies',
  'AI Trading vs Competitors',
  'Autonomous Agents for Crypto Execution',
  'Best Settings for Bloom Trading Bot',
  'Best Settings for Photon Trading Bot',
  'Best Solana Trading Bots Guide',
  'Cross Chain Arbitrage',
  'Crypto Risk Management',
  'DeFi Yield Optimization',
  'How to Use AI for Crypto Trading',
  'Is Copy Trading a Good Idea',
  'Is There an AI for Crypto Trading',
  'Long Term AI Crypto Strategies',
  'Should Crypto Be Part of Retirement',
  'Solana Trading Bots',
  'Sustainable Crypto Yields',
  'Tokenized AI Trends',
  'What is Your Biggest Crypto Regret',
  'Why Crypto IRA is the Next Big Thing',
]

function cleanFrontmatter(content: string): string {
  // Remove all nested frontmatter blocks
  let cleaned = content

  // Remove code blocks that contain frontmatter
  cleaned = cleaned.replace(/```(?:mdx|markdown|yaml|json)?\s*\n---[\s\S]*?---\s*```/g, '')

  // Remove any remaining YAML blocks that look like frontmatter
  cleaned = cleaned.replace(/---[\s\S]*?---\s*/g, '')

  // Remove inline JSON blocks that look like frontmatter
  cleaned = cleaned.replace(/^{[\s\S]*?"title"[\s\S]*?}\s*\n/g, '')

  return cleaned.trim()
}

function fixBlogPosts() {
  console.log('Fixing blog post dates...')

  const aiBlogsDir = path.join(process.cwd(), 'data', 'ai-blogs')

  if (!fs.existsSync(aiBlogsDir)) {
    console.log('No ai-blogs directory found')
    return
  }

  const files = fs.readdirSync(aiBlogsDir).filter((file) => file.endsWith('.mdx'))

  if (files.length === 0) {
    console.log('No MDX files found in ai-blogs directory')
    return
  }

  console.log(`Found ${files.length} blog posts to fix`)

  files.forEach((file, index) => {
    const filePath = path.join(aiBlogsDir, file)
    const content = fs.readFileSync(filePath, 'utf8')

    // Parse the content
    const { data, content: body } = matter(content)

    // Clean the body content
    const cleanedBody = cleanFrontmatter(body)

    // Update the frontmatter
    const newData = {
      ...data,
      title: data.title || keywords[index] || 'Blog Post',
      date: `2025-01-${String(index + 1).padStart(2, '0')}`, // Jan 1-20, 2025
    }

    // Generate new filename with correct date
    const slug = file.replace(/-\d{4}-\d{2}-\d{2}\.mdx$/, '')
    const newFilename = `${slug}-2025-01-${String(index + 1).padStart(2, '0')}.mdx`
    const newFilePath = path.join(aiBlogsDir, newFilename)

    // Write the cleaned content
    const newContent = matter.stringify(cleanedBody, newData)
    fs.writeFileSync(newFilePath, newContent)

    // Delete the old file if it's different
    if (file !== newFilename) {
      fs.unlinkSync(filePath)
    }

    console.log(`✅ Fixed: ${file} -> ${newFilename}`)
  })

  console.log('Blog posts fixed successfully!')
}

fixBlogPosts()
