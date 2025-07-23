import fs from 'fs'
import path from 'path'
import axios from 'axios'

const SEED_KEYWORDS = [
  'AI crypto trading',
  'crypto trading bots',
  'DeFi tools',
  'blockchain analytics',
  'on-chain signals',
  'AI DeFi',
  'crypto trading strategies',
  'AI trading',
  'crypto research',
  'autonomous trading agents',
]

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function fetchRedditPosts(keyword: string) {
  const url = `https://www.reddit.com/search.json?q=${encodeURIComponent(keyword)}&sort=new&limit=20`
  try {
    const res = await axios.get(url, { headers: { 'User-Agent': 'FereAI/1.0' } })
    if (res.data && res.data.data && Array.isArray(res.data.data.children)) {
      return res.data.data.children.map((c: any) => c.data)
    }
  } catch (e) {
    console.error('Error fetching Reddit for', keyword, e.message)
  }
  return []
}

async function fetchRedditComments(postId: string) {
  const url = `https://www.reddit.com/comments/${postId}.json?limit=5`
  try {
    const res = await axios.get(url, { headers: { 'User-Agent': 'FereAI/1.0' } })
    if (Array.isArray(res.data) && res.data[1]?.data?.children) {
      // Top-level comments only
      return res.data[1].data.children
        .map((c: any) => c.data?.body)
        .filter((body: string) => typeof body === 'string' && body.length > 15)
    }
  } catch (e) {
    console.error('Error fetching comments for', postId, e.message)
  }
  return []
}

const PAIN_WORDS = [
  'frustrated',
  'overwhelmed',
  'missed',
  'scam',
  'rug pull',
  'confused',
  'lost',
  'stuck',
  'problem',
  'issue',
  'pain',
  'struggle',
  'slow',
  'late',
  'error',
  'fail',
  'warning',
  'regret',
  'wish',
  'should have',
  "didn't",
  "couldn't",
  "can't",
  'hard',
  'difficult',
]
function hasPainPoint(text: string) {
  if (!text) return false
  const lower = text.toLowerCase()
  return PAIN_WORDS.some((p) => lower.includes(p))
}

async function main() {
  const all: {
    query: string
    source: string
    upvotes: number
    body?: string
    top_comments?: string[]
    pain_points?: boolean
  }[] = []
  for (const kw of SEED_KEYWORDS) {
    const posts = await fetchRedditPosts(kw)
    for (const post of posts) {
      if (post.title && post.title.length > 15) {
        const body = post.selftext && post.selftext.length > 15 ? post.selftext : ''
        let top_comments: string[] = []
        let pain_points = false
        if (post.id) {
          top_comments = await fetchRedditComments(post.id)
        }
        // Check for pain points in title, body, or comments
        pain_points =
          hasPainPoint(post.title) || hasPainPoint(body) || top_comments.some(hasPainPoint)
        all.push({
          query: post.title,
          source: 'reddit',
          upvotes: typeof post.score === 'number' ? post.score : 0,
          body,
          top_comments,
          pain_points,
        })
      }
    }
    await delay(1500)
  }
  // Deduplicate by query
  const seen = new Set()
  const unique = all.filter((item) => {
    if (seen.has(item.query)) return false
    seen.add(item.query)
    return true
  })
  fs.writeFileSync(
    path.join(process.cwd(), 'data', 'reddit-keywords.json'),
    JSON.stringify(unique, null, 2)
  )
  console.log(
    'Saved',
    unique.length,
    'Reddit keywords with upvotes, bodies, comments, and pain points to data/reddit-keywords.json'
  )
}

main()
