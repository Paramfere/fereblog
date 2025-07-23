import { NextResponse } from 'next/server'
import { revalidateTag } from 'next/cache'
import fs from 'fs'
import path from 'path'
import { generateBlogPost } from '../../../lib/generateBlogPost'
import matter from 'gray-matter'
import yaml from 'js-yaml'

// Load enriched keywords from JSON file
const enrichedKeywordsPath = path.join(process.cwd(), 'data', 'enriched-keywords.json')
const enrichedKeywords = JSON.parse(fs.readFileSync(enrichedKeywordsPath, 'utf-8'))

function slugify(str: string) {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

function ensureValidFrontmatter(mdxContent: string, keyword: string, today: string) {
  // 1. Try to extract frontmatter from code block or inline JSON
  let frontmatter: any = {}
  let body = mdxContent
  // Extract --- frontmatter anywhere in the file
  const fmMatch = mdxContent.match(/---[\s\S]*?---/)
  if (fmMatch) {
    try {
      frontmatter = yaml.load(fmMatch[0].replace(/---/g, '')) || {}
      body = mdxContent.replace(fmMatch[0], '').trim()
    } catch (error) {
      console.log('Failed to parse YAML frontmatter:', error)
    }
  } else {
    // Try to extract JSON frontmatter in a code block
    const jsonBlock = mdxContent.match(/```[a-zA-Z]*[\s\n]*({[\s\S]*?})[\s\n]*```/)
    if (jsonBlock) {
      try {
        frontmatter = JSON.parse(jsonBlock[1])
        body = mdxContent.replace(jsonBlock[0], '').trim()
      } catch (error) {
        console.log('Failed to parse JSON block frontmatter:', error)
      }
    } else {
      // Try to extract inline JSON frontmatter at the top
      const jsonInline = mdxContent.match(/^{[\s\S]*?}\s*\n/)
      if (jsonInline) {
        try {
          frontmatter = JSON.parse(jsonInline[0])
          body = mdxContent.replace(jsonInline[0], '').trim()
        } catch (error) {
          console.log('Failed to parse inline JSON frontmatter:', error)
        }
      }
    }
  }
  // 2. Use gray-matter to parse any remaining frontmatter
  const { data, content } = matter(body)
  // Merge extracted frontmatter with gray-matter data
  const merged = { ...frontmatter, ...data }
  merged.title =
    merged.title && typeof merged.title === 'string'
      ? merged.title
      : keyword
          .replace(/\b(ai|blog|post|article)\b/gi, '')
          .replace(/\s+/g, ' ')
          .trim()
          .replace(/(^|\s)\w/g, (m) => m.toUpperCase())
  merged.date = merged.date || today
  if (merged.type) delete merged.type
  if (merged.schema && typeof merged.schema === 'object' && merged.schema['@type']) {
    if (Array.isArray(merged.schema['@type'])) {
      merged.schema['@type'] = merged.schema['@type'].filter(
        (t: string) => t.toLowerCase() !== 'blogposting' && t.toLowerCase() !== 'aiblog'
      )
    } else if (
      typeof merged.schema['@type'] === 'string' &&
      (merged.schema['@type'].toLowerCase() === 'blogposting' ||
        merged.schema['@type'].toLowerCase() === 'aiblog')
    ) {
      delete merged.schema['@type']
    }
  }
  // 3. Stringify as YAML frontmatter and prepend to content
  return matter.stringify(content, merged)
}

export async function POST() {
  const today = new Date().toISOString().split('T')[0]
  // Sort keywords by raw_score descending, take top 10, then pick 3 randomly
  const sorted = enrichedKeywords
    .filter((k: any) => typeof k.raw_score === 'number')
    .sort((a: any, b: any) => b.raw_score - a.raw_score)
    .slice(0, 10)
  const shuffled = sorted.sort(() => 0.5 - Math.random())
  const selected = shuffled.slice(0, 3)
  const filenames: string[] = []
  const errors: string[] = []
  const generatedContents: any[] = []

  for (const kwObj of selected) {
    const kw = kwObj.query
    try {
      let content = await generateBlogPost(kw)
      if (!content || content.startsWith('# Error')) {
        errors.push(`Failed for "${kw}": ${content}`)
        continue
      }
      // Post-process frontmatter
      content = ensureValidFrontmatter(content, kw, today)
      const filename = `${slugify(kw)}-${today}.mdx`

      // Store content in JSON instead of writing to filesystem
      const generatedContent = {
        filename,
        content,
        keyword: kw,
        date: today,
        timestamp: new Date().toISOString(),
      }
      generatedContents.push(generatedContent)
      filenames.push(filename)
    } catch (e: any) {
      errors.push(`Exception for "${kw}": ${e.message}`)
    }
  }

  // Try to save all generated content to JSON file
  if (generatedContents.length > 0) {
    try {
      const pendingContentPath = path.join(process.cwd(), 'data', 'pending-content.json')
      let pendingContent: any[] = []

      // Try to read existing content
      try {
        if (fs.existsSync(pendingContentPath)) {
          pendingContent = JSON.parse(fs.readFileSync(pendingContentPath, 'utf-8'))
        }
      } catch (e) {
        console.log('Could not read existing pending content:', e)
      }

      // Add new content
      pendingContent.push(...generatedContents)

      // Try to write (this might fail on Vercel)
      try {
        fs.writeFileSync(pendingContentPath, JSON.stringify(pendingContent, null, 2))
      } catch (writeError) {
        console.log('Could not write to filesystem:', writeError)
      }
    } catch (fsError) {
      console.log('Filesystem operations failed:', fsError)
    }
  }

  // Invalidate cache for dynamic content after all posts are generated
  if (filenames.length > 0) {
    revalidateTag('blog-posts')
    revalidateTag('ai-blogs')
    revalidateTag('tag-data')
    revalidateTag('blog-listing')

    // Also call the revalidation webhook for Vercel deployment
    try {
      const baseUrl = process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : 'http://localhost:3000'
      await fetch(`${baseUrl}/api/revalidate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tag: 'blog-posts' }),
      })
    } catch (webhookError) {
      console.log('Webhook revalidation failed:', webhookError)
    }
  }

  if (errors.length > 0) {
    return NextResponse.json({
      success: false,
      filenames,
      errors,
      generatedContents, // Return content in case filesystem write failed
    })
  }
  return NextResponse.json({
    success: true,
    filenames,
    generatedContents, // Return content in case filesystem write failed
    message: 'Content generated successfully. Check pending-content.json for file creation.',
  })
}
