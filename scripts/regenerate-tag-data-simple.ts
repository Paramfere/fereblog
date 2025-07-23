import fs from 'fs'
import path from 'path'
import { slug } from 'github-slugger'
import matter from 'gray-matter'

// Function to read all MDX files and extract tags
function extractTagsFromMDX() {
  const tagCounts: Record<string, number> = {}

  // Read regular blog posts
  const blogDir = path.join(process.cwd(), 'data', 'blog')
  if (fs.existsSync(blogDir)) {
    const blogFiles = fs
      .readdirSync(blogDir, { recursive: true })
      .filter((file: string) => file.endsWith('.mdx'))

    blogFiles.forEach((file: string) => {
      const filePath = path.join(blogDir, file as string)
      const content = fs.readFileSync(filePath, 'utf8')
      const { data } = matter(content)

      if (data.tags) {
        data.tags.forEach((tag: string) => {
          const normalizedTag = slug(tag).toLowerCase()
          tagCounts[normalizedTag] = (tagCounts[normalizedTag] || 0) + 1
        })
      }
    })
  }

  // Read AI blog posts
  const aiBlogDir = path.join(process.cwd(), 'data', 'ai-blogs')
  if (fs.existsSync(aiBlogDir)) {
    const aiBlogFiles = fs.readdirSync(aiBlogDir).filter((file: string) => file.endsWith('.mdx'))

    aiBlogFiles.forEach((file: string) => {
      const filePath = path.join(aiBlogDir, file)
      const content = fs.readFileSync(filePath, 'utf8')
      const { data } = matter(content)

      if (data.tags) {
        data.tags.forEach((tag: string) => {
          const normalizedTag = slug(tag).toLowerCase()
          tagCounts[normalizedTag] = (tagCounts[normalizedTag] || 0) + 1
        })
      }
    })
  }

  return tagCounts
}

// Generate tag data
const tagCounts = extractTagsFromMDX()

// Write to tag-data.json
const tagDataPath = path.join(process.cwd(), 'app', 'tag-data.json')
fs.writeFileSync(tagDataPath, JSON.stringify(tagCounts, null, 2))

console.log('Tag data regenerated successfully!')
console.log('Tags found:', Object.keys(tagCounts))
console.log('Total tags:', Object.keys(tagCounts).length)
console.log('Tag counts:', tagCounts)
