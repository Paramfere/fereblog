import { NextResponse } from 'next/server'
import { generateBlogPost } from '../../../lib/generateBlogPost'

export async function POST(request: Request) {
  const { keyword } = await request.json()
  const content = await generateBlogPost(keyword)
  return NextResponse.json({ content })
}
