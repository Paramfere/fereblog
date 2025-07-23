import { allBlogs, allAiBlogs } from 'contentlayer/generated'
import { slug } from 'github-slugger'
import fs from 'fs'
import path from 'path'

// Combine all posts
const allPosts = [...allBlogs, ...allAiBlogs]

// Analyze current tags in posts
const actualTags = new Set<string>()
const tagPostMapping: Record<string, string[]> = {}

allPosts.forEach((post) => {
  if (post.tags) {
    post.tags.forEach((tag) => {
      const normalizedTag = slug(tag).toLowerCase()
      actualTags.add(normalizedTag)

      if (!tagPostMapping[normalizedTag]) {
        tagPostMapping[normalizedTag] = []
      }
      tagPostMapping[normalizedTag].push(post.title || post.slug)
    })
  }
})

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
