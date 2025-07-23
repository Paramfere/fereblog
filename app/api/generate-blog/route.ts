import { NextResponse } from 'next/server'
import { revalidateTag } from 'next/cache'
import fs from 'fs'
import path from 'path'
import { generateBlogPost } from '../../../lib/generateBlogPost'
import matter from 'gray-matter'
import yaml from 'js-yaml'

const enrichedKeywordsPath = path.join(process.cwd(), 'data', 'enriched-keywords.json')
const enrichedKeywords = JSON.parse(fs.readFileSync(enrichedKeywordsPath, 'utf-8'))

function slugify(str: string) {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

function ensureValidFrontmatter(mdxContent: string, keyword: string, today: string) {
  let frontmatter: any = {}
  let body = mdxContent.trim()

  // Remove all code blocks or --- YAML blocks at the very top, repeatedly
  let changed = true
  while (changed) {
    changed = false
    // Remove code block at the top
    const codeBlockMatch = body.match(/^```(yaml|json)?\s*([\s\S]*?)\s*```\s*/i)
    if (codeBlockMatch) {
      try {
        if (codeBlockMatch[1] && codeBlockMatch[1].toLowerCase() === 'json') {
          frontmatter = { ...frontmatter, ...(JSON.parse(codeBlockMatch[2]) || {}) }
        } else {
          frontmatter = { ...frontmatter, ...(yaml.load(codeBlockMatch[2]) || {}) }
        }
      } catch (error) {
        console.log('Failed to parse code block frontmatter:', error)
      }
      body = body.replace(codeBlockMatch[0], '').trim()
      changed = true
      continue
    }
    // Remove --- YAML block at the top
    const fmMatch = body.match(/^---[\s\S]*?---\s*/)
    if (fmMatch) {
      try {
        frontmatter = { ...frontmatter, ...(yaml.load(fmMatch[0].replace(/---/g, '')) || {}) }
      } catch (error) {
        console.log('Failed to parse YAML frontmatter:', error)
      }
      body = body.replace(fmMatch[0], '').trim()
      changed = true
      continue
    }
    // Remove inline JSON frontmatter at the top
    const jsonInline = body.match(/^{[\s\S]*?}\s*\n/)
    if (jsonInline) {
      try {
        frontmatter = { ...frontmatter, ...(JSON.parse(jsonInline[0]) || {}) }
      } catch (error) {
        console.log('Failed to parse inline JSON frontmatter:', error)
      }
      body = body.replace(jsonInline[0], '').trim()
      changed = true
      continue
    }
  }

  // Use gray-matter to parse any remaining frontmatter
  const { data, content } = matter(body)
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
  return matter.stringify(content, merged)
}

export async function POST(req: Request) {
  const today = new Date().toISOString().split('T')[0]
  let keyword = ''
  try {
    const body = await req.json()
    keyword = (body.keyword || '').trim()
  } catch {
    keyword = ''
  }
  let kw = keyword
  if (!kw) {
    // Pick a random keyword from top 10 by raw_score
    const sorted = enrichedKeywords
      .filter((k: any) => typeof k.raw_score === 'number')
      .sort((a: any, b: any) => b.raw_score - a.raw_score)
      .slice(0, 10)
    const random = sorted[Math.floor(Math.random() * sorted.length)]
    kw = random.query
  }
  try {
    let content = await generateBlogPost(kw)
    if (!content || content.startsWith('# Error')) {
      return NextResponse.json({ success: false, error: `Failed for "${kw}": ${content}` })
    }
    content = ensureValidFrontmatter(content, kw, today)
    const filename = `${slugify(kw)}-${today}.mdx`

    // Instead of writing to filesystem, store in a JSON file for later processing
    const generatedContent = {
      filename,
      content,
      keyword: kw,
      date: today,
      timestamp: new Date().toISOString(),
    }

    // Try to append to a JSON file (this might work in some environments)
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
      pendingContent.push(generatedContent)

      // Try to write (this might fail on Vercel)
      try {
        fs.writeFileSync(pendingContentPath, JSON.stringify(pendingContent, null, 2))
      } catch (writeError) {
        console.log('Could not write to filesystem, storing in response:', writeError)
        // If we can't write, we'll return the content in the response
      }
    } catch (fsError) {
      console.log('Filesystem operations failed:', fsError)
    }

    // Invalidate cache for dynamic content
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

    const url = `/blog/${slugify(kw)}-${today}`
    return NextResponse.json({
      success: true,
      filename,
      url,
      content: generatedContent, // Return the content in case filesystem write failed
      message: 'Content generated successfully. Check pending-content.json for file creation.',
    })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message })
  }
}
