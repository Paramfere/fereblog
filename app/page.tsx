import { sortPosts, allCoreContent } from 'pliny/utils/contentlayer'
import { allBlogs, allAiBlogs } from 'contentlayer/generated'
import { unstable_cache } from 'next/cache'
import Main from './Main'

// Cache the main page data with tags for revalidation
const getMainPageData = unstable_cache(
  async () => {
    // Merge both blog types
    const merged = [...allBlogs, ...allAiBlogs]
    // Sort by date descending
    const sortedPosts = merged.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    )
    return allCoreContent(sortedPosts)
  },
  ['main-page'],
  {
    tags: ['blog-posts', 'ai-blogs', 'main-page'],
    revalidate: 60, // Revalidate every 60 seconds
  }
)

export default async function Page() {
  const posts = await getMainPageData()
  return <Main posts={posts} />
}
