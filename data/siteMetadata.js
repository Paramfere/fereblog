/** @type {import("pliny/config").PlinyConfig } */
const siteMetadata = {
  title: 'FereAI Crypto Blog',
  author: 'FereAI Crypto Expert',
  headerTitle: 'FereAI Blog',
  description:
    'Automated blog for FereAI’s long-term AI crypto trading strategies and 0xMONK agents.',
  language: 'en-us',
  theme: 'system',
  siteUrl: 'https://blog.fereai.xyz',
  siteRepo: 'https://github.com/fereai/blog-fereai',
  siteLogo: `${process.env.BASE_PATH || ''}/static/images/logo.png`,
  socialBanner: `${process.env.BASE_PATH || ''}/static/images/twitter-card.png`,
  mastodon: '',
  email: 'info@fereai.xyz',
  github: 'https://github.com/fereai',
  x: 'https://x.com/fere_ai',
  twitter: 'https://x.com/fere_ai',
  facebook: '',
  youtube: '',
  linkedin: 'https://www.linkedin.com/company/fereai',
  threads: '',
  instagram: '',
  medium: '',
  bluesky: '',
  locale: 'en-US',
  stickyNav: false,
  analytics: {
    umamiAnalytics: {
      umamiWebsiteId: process.env.NEXT_UMAMI_ID,
    },
  },
  newsletter: {
    provider: 'buttondown',
  },
  comments: {
    provider: 'giscus',
    giscusConfig: {
      repo: process.env.NEXT_PUBLIC_GISCUS_REPO,
      repositoryId: process.env.NEXT_PUBLIC_GISCUS_REPOSITORY_ID,
      category: process.env.NEXT_PUBLIC_GISCUS_CATEGORY,
      categoryId: process.env.NEXT_PUBLIC_GISCUS_CATEGORY_ID,
      mapping: 'pathname',
      reactions: '1',
      metadata: '0',
      theme: 'light',
      darkTheme: 'transparent_dark',
      themeURL: '',
      lang: 'en',
    },
  },
  search: {
    provider: 'kbar',
    kbarConfig: {
      searchDocumentsPath: `${process.env.BASE_PATH || ''}/search.json`,
    },
  },
}

module.exports = siteMetadata
