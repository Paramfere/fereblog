import { allBlogs, allAiBlogs } from 'contentlayer/generated'
import { slug } from 'github-slugger'
import fs from 'fs'
import path from 'path'

// Combine all posts
const allPosts = [...allBlogs, ...allAiBlogs]

// Count tags
const tagCounts: Record<string, number> = {}

allPosts.forEach((post) => {
  if (post.tags) {
    post.tags.forEach((tag) => {
      const normalizedTag = slug(tag).toLowerCase()
      tagCounts[normalizedTag] = (tagCounts[normalizedTag] || 0) + 1
    })
  }
})

// Write to tag-data.json
const tagDataPath = path.join(process.cwd(), 'app', 'tag-data.json')
fs.writeFileSync(tagDataPath, JSON.stringify(tagCounts, null, 2))

console.log('Tag data regenerated successfully!')
console.log('Tags found:', Object.keys(tagCounts))
console.log('Total tags:', Object.keys(tagCounts).length)
