import { NextResponse } from 'next/server'
import { exec } from 'child_process'
import fs from 'fs'
import path from 'path'

function runScript(cmd: string) {
  return new Promise<{ success: boolean; error?: string }>((resolve) => {
    exec(cmd, (error, stdout, stderr) => {
      if (error) {
        resolve({ success: false, error: stderr || error.message })
      } else {
        resolve({ success: true })
      }
    })
  })
}

export async function POST() {
  // Run all scrapers in sequence for simplicity
  const scripts = [
    'npx ts-node scripts/scrape-keywords.ts',
    'npx ts-node scripts/scrape-suggest.ts',
    'npx ts-node scripts/scrape-reddit.ts',
  ]
  for (const cmd of scripts) {
    const result = await runScript(cmd)
    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error })
    }
  }
  // Update last fetched time
  const lastFetched = new Date().toISOString()
  fs.writeFileSync(
    path.join(process.cwd(), 'data', 'keywords-last-fetched.json'),
    JSON.stringify({ lastFetched }, null, 2)
  )
  return NextResponse.json({ success: true, lastFetched })
}
