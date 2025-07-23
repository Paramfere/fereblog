import { allCoreContent } from 'pliny/utils/contentlayer'
import { allBlogs, allAiBlogs } from 'contentlayer/generated'
import { genPageMetadata } from 'app/seo'
import ListLayoutWithTags from '@/layouts/ListLayoutWithTags'
import { unstable_cache } from 'next/cache'

const POSTS_PER_PAGE = 5

export const metadata = genPageMetadata({ title: 'Blog' })

// Cache the blog data with tags for revalidation
const getBlogData = unstable_cache(
  async () => {
    const merged = [...allBlogs, ...allAiBlogs]
    const sortedPosts = merged.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    )
    return allCoreContent(sortedPosts)
  },
  ['blog-listing'],
  {
    tags: ['blog-posts', 'ai-blogs', 'blog-listing'],
    revalidate: 60, // Revalidate every 60 seconds
  }
)

export default async function BlogPage(props: { searchParams: Promise<{ page: string }> }) {
  const posts = await getBlogData()
  const pageNumber = 1
  const totalPages = Math.ceil(posts.length / POSTS_PER_PAGE)
  const initialDisplayPosts = posts.slice(0, POSTS_PER_PAGE * pageNumber)
  const pagination = {
    currentPage: pageNumber,
    totalPages,
  }
  return (
    <>
      <h1 className="mb-6 text-3xl font-bold">Blog</h1>
      <ListLayoutWithTags
        posts={posts as any}
        initialDisplayPosts={initialDisplayPosts as any}
        pagination={pagination}
        title="Blog"
      />
    </>
  )
}
