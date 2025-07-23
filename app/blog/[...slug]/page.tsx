import 'css/prism.css'
import 'katex/dist/katex.css'

import PageTitle from '@/components/PageTitle'
import { components } from '@/components/MDXComponents'
import { MDXLayoutRenderer } from 'pliny/mdx-components'
import { sortPosts, coreContent, allCoreContent } from 'pliny/utils/contentlayer'
import { allAiBlogs, allAuthors } from 'contentlayer/generated'
import type { Authors, AiBlog } from 'contentlayer/generated'
import PostSimple from '@/layouts/PostSimple'
import PostLayout from '@/layouts/PostLayout'
import PostBanner from '@/layouts/PostBanner'
import { Metadata } from 'next'
import siteMetadata from '@/data/siteMetadata'
import { notFound } from 'next/navigation'
import Head from 'next/head'

const defaultLayout = 'PostLayout'
const layouts = {
  PostSimple,
  PostLayout,
  PostBanner,
}

export async function generateMetadata(props: {
  params: Promise<{ slug: string[] }>
}): Promise<Metadata | undefined> {
  const params = await props.params
  const slug = decodeURI(params.slug.join('/'))
  const post = allAiBlogs.find((p) => p.slug === slug)
  const authorList = post?.authors || ['default']
  const authorDetails = authorList.map((author) => {
    const authorResults = allAuthors.find((p) => p.slug === author)
    return coreContent(authorResults as Authors)
  })
  if (!post) {
    return
  }

  const publishedAt = new Date(post.date).toISOString()
  const modifiedAt = new Date(post.lastmod || post.date).toISOString()
  const authors = authorDetails.map((author) => author.name)
  let imageList = [siteMetadata.socialBanner]
  if (post.images) {
    imageList =
      typeof post.images === 'string'
        ? [post.images]
        : Array.isArray(post.images)
          ? post.images
          : []
  }
  const ogImages = Array.isArray(imageList)
    ? imageList.map((img) => {
        return {
          url: img && img.includes('http') ? img : siteMetadata.siteUrl + img,
        }
      })
    : []

  return {
    title: post.title,
    description: post.summary,
    openGraph: {
      title: post.title,
      description: post.summary,
      siteName: siteMetadata.title,
      locale: 'en_US',
      type: 'article',
      publishedTime: publishedAt,
      modifiedTime: modifiedAt,
      url: './',
      images: ogImages,
      authors: authors.length > 0 ? authors : [siteMetadata.author],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.summary,
      images: imageList,
    },
  }
}

export const generateStaticParams = async () => {
  return allAiBlogs.map((p) => ({ slug: p.slug.split('/').map((name) => decodeURI(name)) }))
}

export default async function Page(props: { params: Promise<{ slug: string[] }> }) {
  const params = await props.params
  const slug = decodeURI(params.slug.join('/'))
  // Debug: log all slugs and the incoming slug
  console.log(
    'allAiBlogs slugs:',
    allAiBlogs.map((p) => p.slug)
  )
  console.log('params.slug:', params.slug, 'joined:', slug)
  // Filter out drafts in production
  const sortedCoreContents = allCoreContent(sortPosts(allAiBlogs))
  const postIndex = sortedCoreContents.findIndex((p) => p.slug === slug)
  if (postIndex === -1) {
    return notFound()
  }

  const prev = sortedCoreContents[postIndex + 1]
  const next = sortedCoreContents[postIndex - 1]
  const post = allAiBlogs.find((p) => p.slug === slug) as AiBlog
  const authorList = Array.isArray(post?.authors) ? post.authors : ['default']
  const authorDetails = Array.isArray(authorList)
    ? authorList.map((author) => {
        const authorResults = allAuthors.find((p) => p.slug === author)
        return coreContent(authorResults as Authors)
      })
    : []
  const mainContent = coreContent(post)
  const jsonLd = post.structuredData
  jsonLd['author'] = Array.isArray(authorDetails)
    ? authorDetails.map((author) => {
        return {
          '@type': 'Person',
          name: author.name,
        }
      })
    : []

  // SEO meta
  const canonicalUrl = `${siteMetadata.siteUrl}/blog/${slug}`
  const keywords = [
    'AI crypto trading',
    '0xMONK agents',
    'long-term AI crypto strategies',
    'FereAI',
    'autonomous agents',
    'crypto execution',
    'DeFi planning',
    'sustainable crypto yields',
  ]

  const Layout = layouts[post.layout || defaultLayout]

  return (
    <>
      <Head>
        <title>
          {post.title} | {siteMetadata.title}
        </title>
        <meta name="description" content={post.summary || siteMetadata.description} />
        <meta name="keywords" content={keywords.join(', ')} />
        <link rel="canonical" href={canonicalUrl} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'BlogPosting',
              headline: post.title,
              description: post.summary,
              datePublished: post.date,
              dateModified: post.lastmod || post.date,
              author: jsonLd['author'],
              mainEntityOfPage: canonicalUrl,
              url: canonicalUrl,
              publisher: {
                '@type': 'Organization',
                name: siteMetadata.author,
                url: siteMetadata.siteUrl,
              },
              ...jsonLd,
            }),
          }}
        />
      </Head>
      <Layout content={mainContent} authorDetails={authorDetails} next={next} prev={prev}>
        {/* CTA for conversions */}
        <div className="my-6 rounded-lg bg-blue-100 p-4 text-center dark:bg-blue-900">
          <a
            href="https://fereai.xyz/dashboard"
            className="text-lg font-bold text-blue-700 underline hover:text-blue-900 dark:text-blue-300 dark:hover:text-white"
            target="_blank"
            rel="noopener noreferrer"
          >
            🚀 Start Trading with FereAI’s 0xMONK Agents
          </a>
        </div>
        <MDXLayoutRenderer code={post.body.code} components={components} toc={post.toc} />
      </Layout>
    </>
  )
}
