import fs from 'fs'
import path from 'path'
import { execSync } from 'child_process'

const stopwords = new Set([
  'the',
  'a',
  'an',
  'to',
  'for',
  'with',
  'of',
  'in',
  'on',
  'at',
  'by',
  'and',
  'or',
])
const voiceStarters = [
  'how',
  'what',
  'best',
  'why',
  'can',
  'is',
  'are',
  'should',
  'which',
  'when',
  'where',
  'who',
]
const painWords = [
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
]
const NICHE_TERMS = [
  'ai',
  'crypto',
  'defi',
  'on-chain',
  'trading',
  'agent',
  'solana',
  'base',
  'yield',
]

function getCluster(query: string) {
  const words = query
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => !stopwords.has(w))
  return words.slice(0, 3).join(' ')
}

function isVoiceFriendly(query: string) {
  const first = query.trim().toLowerCase().split(' ')[0]
  return voiceStarters.includes(first)
}

function hasPainPoint(text: string) {
  if (!text) return false
  const lower = text.toLowerCase()
  return painWords.some((p) => lower.includes(p))
}

function isNicheRelevant(query: string): boolean {
  const q = query.toLowerCase()
  return NICHE_TERMS.some((term) => q.includes(term))
}

function readJson(file: string): any[] {
  try {
    return JSON.parse(fs.readFileSync(path.join(process.cwd(), 'data', file), 'utf-8'))
  } catch {
    return []
  }
}

const discovered: any[] = readJson('discovered-keywords.json')
const suggest: any[] = readJson('suggest-keywords.json')
const reddit: any[] = readJson('reddit-keywords.json')
const pytrends: any[] = readJson('pytrends-keywords.json')

const all: any[] = []
for (const k of discovered) {
  const niche_relevant = isNicheRelevant(k.query)
  all.push({
    query: k.query,
    source: 'discovered',
    voice_friendly: isVoiceFriendly(k.query),
    rising: false,
    pain_points: false,
    social_buzz: 0,
    cluster: getCluster(k.query),
    niche_relevant,
  })
}
for (const k of suggest) {
  const niche_relevant = isNicheRelevant(k.query)
  all.push({
    query: k.query,
    source: 'suggest',
    voice_friendly: isVoiceFriendly(k.query),
    rising: false,
    pain_points: false,
    social_buzz: 0,
    cluster: getCluster(k.query),
    niche_relevant,
  })
}
for (const k of reddit) {
  const niche_relevant = isNicheRelevant(k.query)
  all.push({
    query: k.query,
    source: 'reddit',
    voice_friendly: isVoiceFriendly(k.query),
    rising: false,
    pain_points: hasPainPoint(k.query),
    social_buzz: typeof k.upvotes === 'number' ? k.upvotes : 0,
    cluster: getCluster(k.query),
    niche_relevant,
  })
}
for (const k of pytrends) {
  const niche_relevant = isNicheRelevant(k.query)
  all.push({
    query: k.query,
    source: 'pytrends',
    voice_friendly: isVoiceFriendly(k.query),
    rising: true,
    pain_points: false,
    social_buzz: 0,
    cluster: getCluster(k.query),
    niche_relevant,
  })
}
// Deduplicate by query
const seen = new Set<string>()
const unique = all.filter((k) => {
  if (seen.has(k.query)) return false
  seen.add(k.query)
  return true
})

// Add raw_score with niche boost (3x for niche, 0.5x for non-niche)
for (const k of unique) {
  let raw =
    (k.rising ? 3 : 0) +
    (k.pain_points ? 2 : 0) +
    (k.voice_friendly ? 1 : 0) +
    // Social buzz is now divided by 100, so 62 upvotes = 0.62 points
    (k.social_buzz ? k.social_buzz / 100 : 0) +
    (k.source === 'pytrends' ? 2 : k.source === 'reddit' ? 1 : 0)
  // If both pain_points and voice_friendly, add a 5 point bonus
  if (k.pain_points && k.voice_friendly) raw += 5
  if (k.niche_relevant) raw *= 3
  else raw *= 0.33 // Apply a 0.33 penalty for non-niche keywords
  // If neither pain_points nor voice_friendly, apply a 0.1 multiplier
  if (!k.pain_points && !k.voice_friendly) raw *= 0.1
  k.raw_score = raw
}

fs.writeFileSync(
  path.join(process.cwd(), 'data', 'enriched-keywords.json'),
  JSON.stringify(unique, null, 2)
)
console.log('Wrote data/enriched-keywords.json with', unique.length, 'keywords.')

// Automatically copy to public/data for dashboard
try {
  execSync('npx ts-node scripts/postprocess-enriched-keywords.ts', { stdio: 'inherit' })
  console.log('Synced enriched-keywords.json to public/data/')
} catch (e) {
  console.error('Failed to sync enriched-keywords.json to public/data:', e)
}
