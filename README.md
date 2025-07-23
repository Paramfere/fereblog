# 🚀 FereBlog - AI-Powered Crypto Trading Blog Platform

> **Automated SEO-optimized blog generation for FereAI.xyz with humanized content and LLM optimization**

[![Next.js](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Contentlayer](https://img.shields.io/badge/Contentlayer-0.5.5-purple?style=for-the-badge)](https://www.contentlayer.dev/)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)

## 🌟 Highlights

- **🤖 AI-Powered Content Generation**: Automated blog post creation using Claude AI with humanized content
- **🔍 Advanced SEO Optimization**: E-E-A-T analysis, competitor research, and keyword clustering
- **📊 Real-time Data Integration**: Pytrends, Reddit, and X (Twitter) data for trending topics
- **🎯 LLM-Optimized Content**: Structured for AI pickup with Q&A, tables, and schema markup
- **⚡ Automated Workflows**: Daily generation scripts and admin panel for manual triggers
- **📱 Modern UI/UX**: Responsive design with dark/light theme support
- **🔧 Comprehensive Tooling**: Post-processing scripts, cleanup utilities, and content validation

## 📖 Overview

FereBlog is a highly automated, SEO-optimized blog platform for FereAI.xyz, focusing on long-term AI crypto trading content. The platform leverages advanced AI techniques to generate humanized, LLM-tuned content that ranks well on Google and is optimized for AI pickup.

### 🎯 Key Features

- **Humanized Content Generation**: Varied tones, anecdotes, specific examples, and fact-checking
- **E-E-A-T Boost**: Author bios, expertise signals, and competitor analysis
- **Multi-Source Research**: Pytrends, Reddit, X (Twitter) for comprehensive keyword research
- **Automated Post-Processing**: Cleanup scripts for MDX formatting and content validation
- **Admin Dashboard**: Manual blog generation with custom or random keywords
- **Real-time Analytics**: Search volume tracking and performance monitoring

### 🏗️ Architecture

- **Frontend**: Next.js 14 with App Router
- **Content Management**: Contentlayer for MDX processing
- **AI Integration**: Anthropic Claude API for content generation
- **Data Sources**: SerpApi for competitor analysis, Pytrends for keyword research
- **Styling**: Tailwind CSS with custom components

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- API keys for:
  - Anthropic Claude
  - SerpApi
  - (Optional) Reddit API

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/FereBlog.git
cd FereBlog

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your API keys

# Start development server
npm run dev
```

### Environment Variables

Create a `.env.local` file with:

```env
ANTHROPIC_API_KEY=your_claude_api_key
SERPAPI_KEY=your_serpapi_key
REDDIT_CLIENT_ID=your_reddit_client_id
REDDIT_CLIENT_SECRET=your_reddit_client_secret
```

## 📁 Project Structure

```
FereBlog/
├── app/                    # Next.js App Router
│   ├── api/               # API routes for blog generation
│   ├── blog/              # Blog post pages
│   └── admin/             # Admin dashboard
├── components/            # React components
├── data/                 # Content and configuration
│   ├── ai-blogs/         # Generated blog posts
│   └── authors/          # Author information
├── lib/                  # Utility functions
├── scripts/              # Automation scripts
└── layouts/              # Page layouts
```

## 🔧 Usage

### Generate Blog Posts

#### Automated Daily Generation

```bash
npm run generate:daily
```

#### Manual Generation via Admin Panel

1. Navigate to `/admin`
2. Click "Generate Blog Post"
3. Enter custom keyword or use random selection

#### API Endpoint

```bash
curl -X POST http://localhost:3000/api/generate-blog \
  -H "Content-Type: application/json" \
  -d '{"keyword": "your-keyword"}'
```

### Content Management

#### Fix MDX Issues

```bash
npx ts-node scripts/fix-all-mdx-issues.ts
```

#### Clean Up Content

```bash
npx ts-node scripts/comprehensive-cleanup.ts
```

## 🛠️ Development

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run type-check   # Run TypeScript checks
```

### Content Generation Workflow

1. **Keyword Research**: Scripts fetch trending topics from Pytrends, Reddit, and X
2. **Competitor Analysis**: SerpApi analyzes top-ranking content for E-E-A-T signals
3. **Content Generation**: Claude AI creates humanized, structured content
4. **Post-Processing**: Cleanup scripts ensure proper MDX formatting
5. **Deployment**: Content is automatically published to the blog

## 📊 Performance & SEO

### SEO Features

- **Structured Data**: Schema markup for blog posts and how-to guides
- **Meta Tags**: Optimized title, description, and Open Graph tags
- **Sitemap**: Automatic sitemap generation
- **RSS Feed**: RSS feed for content syndication

### Performance Optimizations

- **Image Optimization**: Next.js Image component with lazy loading
- **Code Splitting**: Automatic code splitting for optimal loading
- **Caching**: Built-in caching strategies
- **CDN Ready**: Optimized for CDN deployment

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

### Development Setup

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Contentlayer](https://www.contentlayer.dev/) for content management
- [Anthropic](https://www.anthropic.com/) for AI content generation
- [SerpApi](https://serpapi.com/) for competitor analysis
- [Next.js](https://nextjs.org/) for the amazing framework

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/FereBlog/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/FereBlog/discussions)
- **Email**: support@fereai.xyz

---

**Made with ❤️ by the FereAI Team**
