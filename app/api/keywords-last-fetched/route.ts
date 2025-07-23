import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function GET() {
  try {
    const file = fs.readFileSync(
      path.join(process.cwd(), 'data', 'keywords-last-fetched.json'),
      'utf-8'
    )
    const { lastFetched } = JSON.parse(file)
    return NextResponse.json({ lastFetched })
  } catch {
    return NextResponse.json({ lastFetched: null })
  }
}
