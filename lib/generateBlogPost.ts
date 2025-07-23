import fetch from 'node-fetch'
import * as cheerio from 'cheerio'
import { Anthropic } from '@anthropic-ai/sdk'
import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import yaml from 'js-yaml'
import slugify from 'slugify'

// Real E-E-A-T competitor analysis and gap extraction using SerpApi and Cheerio
async function analyze_top_blogs(
  keyword: string
): Promise<{ eeat_summary: string; gap_summary: string }> {
  const serpApiKey = process.env.SERPAPI_KEY
  if (!serpApiKey) {
    return {
      eeat_summary: 'SERPAPI_KEY not set. Skipping competitor analysis.',
      gap_summary: '',
    }
  }
  // 1. Fetch top 5 organic results from Google
  // Temporarily disabled serpapi for deployment
  let results: any[] = []
  try {
    // Mock results for now
    results = []
  } catch (e) {
    return {
      eeat_summary: 'Failed to fetch SERP results.',
      gap_summary: '',
    }
  }
  // 2. For each result, fetch the page and extract E-E-A-T signals
  const eatSignals: any[] = []
  for (const r of results) {
    const url = r.link
    try {
      const resp = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } })
      const html = await resp.text()
      const $ = cheerio.load(html)
      // Author
      const author =
        $('meta[name="author"]').attr('content') ||
        $('[class*="author"], [id*="author"]').first().text().trim()
      // Date
      const date = $('time').attr('datetime') || $('time').text().trim()
      // Sources (outbound links)
      const sources = [] as string[]
      $('a[href^="http"]').each((_, el) => {
        const href = $(el).attr('href')
        if (href && !href.includes(url)) sources.push(href)
      })
      // FAQ/Schema
      let faq_schema = false
      $('script[type="application/ld+json"]').each((_, el) => {
        if ($(el).text().includes('FAQPage')) faq_schema = true
      })
      // Badges/Trust
      const trust = /award|badge|certified|trust/i.test(html)
      eatSignals.push({ url, author, date, sources: sources.slice(0, 5), faq_schema, trust })
    } catch (e) {
      eatSignals.push({ url, error: 'Failed to fetch or parse.' })
    }
  }
  // 3. Summarize E-E-A-T findings
  const eeat_summary = eatSignals
    .map((sig) => {
      if (sig.error) return `- ${sig.url}: [Error: ${sig.error}]`
      return `- ${sig.url}: Author: ${sig.author || 'N/A'}, Date: ${sig.date || 'N/A'}, Sources: ${sig.sources.length}, FAQ Schema: ${sig.faq_schema ? 'Yes' : 'No'}, Trust: ${sig.trust ? 'Yes' : 'No'}`
    })
    .join('\n')
  // 4. Simple gap analysis: look for missing author, sources, trust
  const missing: string[] = []
  if (eatSignals.every((sig) => !sig.author)) missing.push('author references')
  if (eatSignals.every((sig) => !sig.trust)) missing.push('trust badges or certifications')
  if (eatSignals.every((sig) => (sig.sources || []).length < 2))
    missing.push('reputable sources/citations')
  const gap_summary = missing.length
    ? `Competitors are missing: ${missing.join(', ')}. Please address these in your article.`
    : 'No major E-E-A-T gaps detected, but strive for originality and depth.'
  return { eeat_summary, gap_summary }
}

function summarizeIfLong(text: string, maxLength: number = 200): string {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength).trim() + '...'
}

function findRelevantRedditStory(keyword: string): string {
  try {
    const stories = JSON.parse(fs.readFileSync('data/reddit-keywords.json', 'utf-8'))
    // Simple relevance: match keyword in title or body, prioritize pain_points
    const matches = stories.filter(
      (s: any) =>
        s.pain_points &&
        ((s.query && keyword.toLowerCase().includes(s.query.toLowerCase())) ||
          (s.body && keyword.toLowerCase().includes(s.body.toLowerCase())))
    )
    if (matches.length > 0) {
      const story = matches[Math.floor(Math.random() * matches.length)]
      const summary = summarizeIfLong(story.body || story.query)
      return `Real Reddit story (summarized if long):\n---\n${summary}`
    }
    // Fallback: any pain_point story
    const painStories = stories.filter((s: any) => s.pain_points && s.body)
    if (painStories.length > 0) {
      const story = painStories[Math.floor(Math.random() * painStories.length)]
      const summary = summarizeIfLong(story.body)
      return `Real Reddit story (summarized if long):\n---\n${summary}`
    }
  } catch {}
  // If no real story, invent a plausible one
  return 'Hypothetical scenario:\n---\nImagine a trader struggling with manual tracking, missing key moves until they switched to an AI-powered tool.'
}

function cleanIntro(mdx: string, keyword: string): string {
  // Remove LLM prompt artifacts at the start
  let cleaned = mdx.replace(/^(Here'?s a [^\n]*blog post[^\n]*\n?)/i, '')
  cleaned = cleaned.replace(/^(Below is a [^\n]*blog post[^\n]*\n?)/i, '')
  // If the first non-frontmatter line is not a heading, add a keyword-rich intro
  const frontmatterMatch = cleaned.match(/^(---[\s\S]*?---\n)/)
  let body = cleaned
  let frontmatter = ''
  if (frontmatterMatch) {
    frontmatter = frontmatterMatch[1]
    body = cleaned.slice(frontmatter.length)
  }
  // If the first line is not a heading, add a custom intro
  if (!/^#/.test(body.trim())) {
    const intro = `AI is revolutionizing crypto trading in 2026. In this guide, you'll discover how to leverage the latest AI tools for smarter, safer, and more profitable trades.\n\n`
    body = intro + body.trimStart()
  }
  return frontmatter + body
}

export async function generateBlogPost(keyword: string): Promise<string> {
  const anthropicApiKey = process.env.ANTHROPIC_API_KEY
  if (!anthropicApiKey) {
    console.error('ANTHROPIC_API_KEY is NOT loaded!')
    return '# Error: Anthropic API key is not set in environment.'
  }
  const anthropicEndpoint = 'https://api.anthropic.com/v1/messages'

  // Run E-E-A-T competitor analysis and gap extraction
  const { eeat_summary, gap_summary } = await analyze_top_blogs(keyword)

  // Find a relevant Reddit story for this keyword
  const communityStory = findRelevantRedditStory(keyword)

  // FereAI/0xMONK reference for LLM context
  const fereaiReference = `# FereAI/0xMONK Reference (for context)
FereAI is an AI-powered crypto trading platform. Its 0xMONK agent provides automated, multi-chain trading signals (Solana, Base, etc.), backtesting, and risk management. The dashboard is available at fereai.xyz/dashboard.`

  const prompt = `${fereaiReference}

Generate a 2,000-word MDX blog post for "${keyword}".
- Use markdown/MDX formatting only.
- Do NOT include <script> tags or raw JSON-LD in the body.
- Add BlogPosting/HowTo schema ONLY in the MDX frontmatter.

---

# Structure Requirements (MANDATORY):

1. **Intro**
   - Start with a direct, LLM-friendly answer to the main question or topic.
   - Set the context for why this topic matters in 2026.

2. **H2: Why This Topic Matters**
   - Explain the relevance of the topic (e.g., crypto for retirement, AI for trading, etc.).
   - Use real-world stats or trends (cite CoinDesk or similar if possible).

3. **H2: How [Relevant Tool/Concept] Works**
   - If, in the course of the article, a solution like FereAI’s 0xMONK agent would naturally address the pain points or challenges discussed, introduce it organically as an example. Explain its features and how it solves the problem, but only if it makes sense in context. Do not force the mention if it’s not relevant.

4. **H2: Real Stories from the Community**
   - Inject at least one real, applicable anecdote or pain point from Reddit/X (provided below).
   - If no real story is available, invent a plausible, clearly-labeled hypothetical.

5. **H2: Data-Driven Results & Backtesting**
   - Share backtesting results, performance stats, or forecasts (invent if not available, but label as hypothetical).

6. **H2: Q&A Section**
   - Include at least 2-3 direct Q&A pairs targeting likely voice or LLM queries (e.g., “How does FereAI ensure sustainable yields?”).

7. **H2: Comparison Table**
   - Add a markdown table comparing FereAI/0xMONK (if relevant) to manual trading or competitors on key features (speed, chains, yields, etc.).

8. **Conclusion & CTA**
   - Summarize the actionable takeaway.
   - If relevant, include a CTA to fereai.xyz/dashboard or to share on X with @fere_ai.

---

# Humanization Requirements (MANDATORY):
- Vary your tone: mix short, punchy sentences with longer, reflective ones.
- Use at least one “I remember when…” or similar anecdote (real or plausible).
- Use relatable hooks and pain points from the provided community story.
- Avoid repetitive phrases and fact-check everything.
- Maintain a confident, actionable, and human-like style throughout.

# Tag Generation Requirements (MANDATORY):
Generate 3-5 contextual tags that are meaningful categories, not just words from the title. Use tags like:
- "AI Trading" (not just "AI" and "Trading" separately)
- "Crypto Trading" (not just "Crypto" and "Trading" separately)  
- "DeFi" (for decentralized finance topics)
- "Risk Management" (for safety/risk topics)
- "Yield Optimization" (for yield farming topics)
- "Solana" (for Solana-specific content)
- "Cross-Chain" (for multi-chain topics)
- "Backtesting" (for strategy testing topics)
- "Trading Bots" (for bot-related content)
- "Sustainable Yields" (for long-term yield strategies)
- "Crypto IRA" (for retirement/investment topics)
- "Arbitrage" (for arbitrage strategies)
- "Machine Learning" (for AI/ML topics)

---

# Community Story for Injection (if applicable):
${communityStory}

---

# Competitor E-E-A-T Analysis:
${eeat_summary}

# Gap Analysis:
${gap_summary}

---

Use this information to make your article more authoritative, original, and comprehensive than the current top results. End with a byline: “Source: FereAI Research Team, leveraging 10+ years in crypto.”`

  // Save the prompt for reference
  try {
    const logPath = 'data/generated-prompts.log'
    const timestamp = new Date().toISOString()
    const logEntry = `\n---\n[${timestamp}]\nKeyword: ${keyword}\n\n${prompt}\n`
    fs.appendFileSync(logPath, logEntry)
  } catch (e) {
    console.error('Failed to log prompt:', e)
  }

  let content = ''
  try {
    if (!prompt.trim()) {
      console.error('Prompt is empty!')
      return '# Error: Prompt is empty.'
    }
    const requestBody = {
      model: 'claude-3-5-sonnet-latest',
      max_tokens: 4096,
      messages: [{ role: 'user', content: prompt }],
    }
    const response = await fetch(anthropicEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicApiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(requestBody),
    })
    const data = await response.json()
    if (data?.content?.[0]?.text) {
      content = data.content[0].text
    } else if (data?.error) {
      content = `# Error: ${data.error.type || ''} - ${data.error.message || JSON.stringify(data.error)}`
    } else {
      content = '# Error: No content generated.'
    }
    // Remove any <script type="application/ld+json"> blocks if present
    content = content.replace(
      /<script[^>]*type=["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>/gi,
      ''
    )
  } catch (e: any) {
    console.error('Anthropic API fetch error:', e)
    content = `# Error: ${e}`
  }
  // After generating the MDX content (e.g., after LLM response):
  let mdxContent = content
  mdxContent = cleanIntro(mdxContent, keyword)
  return mdxContent
}
