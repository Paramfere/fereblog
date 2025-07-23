import { NextRequest, NextResponse } from 'next/server'
import { revalidateTag } from 'next/cache'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { tag } = body

    if (tag) {
      // Revalidate specific tag
      revalidateTag(tag)
      return NextResponse.json({ revalidated: true, tag })
    } else {
      // Revalidate all content-related tags
      revalidateTag('blog-posts')
      revalidateTag('ai-blogs')
      revalidateTag('tag-data')
      revalidateTag('blog-listing')
      revalidateTag('main-page')
      revalidateTag('tag-posts')

      return NextResponse.json({
        revalidated: true,
        tags: ['blog-posts', 'ai-blogs', 'tag-data', 'blog-listing', 'main-page', 'tag-posts'],
      })
    }
  } catch (err) {
    return NextResponse.json({ message: 'Error revalidating' }, { status: 500 })
  }
}
