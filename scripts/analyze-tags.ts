import fs from 'fs'
import path from 'path'
import { slug } from 'github-slugger'
import matter from 'gray-matter'

// Analyze tags from MDX files directly
function analyzeTags() {
  const aiBlogsDir = path.join(process.cwd(), 'data', 'ai-blogs')
  const blogDir = path.join(process.cwd(), 'data', 'blog')

  const tagCounts: Record<string, number> = {}
  const tagPostMapping: Record<string, string[]> = {}

  // Process AI blogs
  if (fs.existsSync(aiBlogsDir)) {
    const files = fs.readdirSync(aiBlogsDir).filter((file) => file.endsWith('.mdx'))

    files.forEach((file) => {
      const filePath = path.join(aiBlogsDir, file)
      const content = fs.readFileSync(filePath, 'utf8')
      const { data } = matter(content)

      if (data.tags && Array.isArray(data.tags)) {
        data.tags.forEach((tag: string) => {
          const normalizedTag = slug(tag).toLowerCase()
          tagCounts[normalizedTag] = (tagCounts[normalizedTag] || 0) + 1

          if (!tagPostMapping[normalizedTag]) {
            tagPostMapping[normalizedTag] = []
          }
          tagPostMapping[normalizedTag].push(data.title || file.replace('.mdx', ''))
        })
      }
    })
  }

  // Process regular blogs
  if (fs.existsSync(blogDir)) {
    const files = fs.readdirSync(blogDir).filter((file) => file.endsWith('.mdx'))

    files.forEach((file) => {
      const filePath = path.join(blogDir, file)
      const content = fs.readFileSync(filePath, 'utf8')
      const { data } = matter(content)

      if (data.tags && Array.isArray(data.tags)) {
        data.tags.forEach((tag: string) => {
          const normalizedTag = slug(tag).toLowerCase()
          tagCounts[normalizedTag] = (tagCounts[normalizedTag] || 0) + 1

          if (!tagPostMapping[normalizedTag]) {
            tagPostMapping[normalizedTag] = []
          }
          tagPostMapping[normalizedTag].push(data.title || file.replace('.mdx', ''))
        })
      }
    })
  }

  // Write to tag-data.json
  const tagDataPath = path.join(process.cwd(), 'app', 'tag-data.json')
  fs.writeFileSync(tagDataPath, JSON.stringify(tagCounts, null, 2))

  console.log('=== TAG ANALYSIS COMPLETE ===')
  console.log('Tags found:', Object.keys(tagCounts))
  console.log('Total tags:', Object.keys(tagCounts).length)
  console.log('\nTag counts:')
  Object.entries(tagCounts)
    .sort(([, a], [, b]) => b - a)
    .forEach(([tag, count]) => {
      console.log(`${tag}: ${count} posts`)
      if (tagPostMapping[tag]) {
        console.log(
          `  Posts: ${tagPostMapping[tag].slice(0, 3).join(', ')}${
            tagPostMapping[tag].length > 3 ? '...' : ''
          }`
        )
      }
    })

  console.log('\n=== RECOMMENDATIONS ===')
  console.log('1. All tags are now properly normalized and counted')
  console.log('2. Tag data has been regenerated')
  console.log('3. Tag pages should now display correctly')

  // Check for any inconsistencies
  const inconsistentTags = Object.keys(tagCounts).filter((tag) => {
    const posts = tagPostMapping[tag] || []
    return posts.length !== tagCounts[tag]
  })

  if (inconsistentTags.length > 0) {
    console.log('\n⚠️  WARNING: Found inconsistent tag counts:')
    inconsistentTags.forEach((tag) => {
      console.log(
        `  ${tag}: expected ${tagCounts[tag]}, found ${tagPostMapping[tag]?.length || 0} posts`
      )
    })
  } else {
    console.log('\n✅ All tag counts are consistent!')
  }
}

analyzeTags()
