import { slug } from 'github-slugger'
import { allCoreContent, sortPosts } from 'pliny/utils/contentlayer'
import siteMetadata from '@/data/siteMetadata'
import ListLayout from '@/layouts/ListLayoutWithTags'
import { allBlogs, allAiBlogs } from 'contentlayer/generated'
import tagData from 'app/tag-data.json'
import { genPageMetadata } from 'app/seo'
import { Metadata } from 'next'
import { unstable_cache } from 'next/cache'

const POSTS_PER_PAGE = 5

export async function generateMetadata(props: {
  params: Promise<{ tag: string }>
}): Promise<Metadata> {
  const params = await props.params
  const tag = decodeURI(params.tag)
  return genPageMetadata({
    title: tag,
    description: `${siteMetadata.title} ${tag} tagged content`,
    alternates: {
      canonical: './',
      types: {
        'application/rss+xml': `${siteMetadata.siteUrl}/tags/${tag}/feed.xml`,
      },
    },
  })
}

export const generateStaticParams = async () => {
  const tagCounts = tagData as Record<string, number>
  const tagKeys = Object.keys(tagCounts)
  return tagKeys.map((tag) => ({
    tag: encodeURI(tag),
  }))
}

// Cache the tag data with tags for revalidation
const getTagPosts = unstable_cache(
  async (tag: string) => {
    const allPosts = [...allBlogs, ...allAiBlogs]
    return allCoreContent(
      sortPosts(
        allPosts.filter((post) => {
          if (!post.tags) return false
          return post.tags.some((t) => {
            // Handle different tag formats: "Crypto Trading" vs "crypto-trading"
            const normalizedTag = slug(t).toLowerCase()
            const normalizedParam = slug(tag).toLowerCase()
            return normalizedTag === normalizedParam
          })
        })
      )
    )
  },
  ['tag-posts'],
  {
    tags: ['blog-posts', 'ai-blogs', 'tag-data', 'tag-posts'],
    revalidate: 60, // Revalidate every 60 seconds
  }
)

export default async function TagPage(props: { params: Promise<{ tag: string }> }) {
  const params = await props.params
  const tag = decodeURI(params.tag)
  const title = tag[0].toUpperCase() + tag.split(' ').join('-').slice(1)

  const filteredPosts = await getTagPosts(tag)
  const totalPages = Math.ceil(filteredPosts.length / POSTS_PER_PAGE)
  const initialDisplayPosts = filteredPosts.slice(0, POSTS_PER_PAGE)
  const pagination = {
    currentPage: 1,
    totalPages: totalPages,
  }

  return (
    <>
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        <div className="space-y-2 pt-6 pb-8 md:space-y-5">
          <h1 className="text-3xl leading-9 font-extrabold tracking-tight text-gray-900 sm:text-4xl sm:leading-10 md:text-6xl md:leading-14 dark:text-gray-100">
            {title}
          </h1>
        </div>
        <ListLayout
          posts={filteredPosts as any}
          initialDisplayPosts={initialDisplayPosts as any}
          pagination={pagination}
          title={title}
        />
      </div>
    </>
  )
}
