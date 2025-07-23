import fs from 'fs'
import path from 'path'

// This script processes pending content from JSON and converts it to MDX files
// It should be run during the build process or manually

const pendingContentPath = path.join(process.cwd(), 'data', 'pending-content.json')
const aiBlogsDir = path.join(process.cwd(), 'data', 'ai-blogs')

function processPendingContent() {
  try {
    // Check if pending content exists
    if (!fs.existsSync(pendingContentPath)) {
      console.log('No pending content found')
      return
    }

    // Read pending content
    const pendingContent = JSON.parse(fs.readFileSync(pendingContentPath, 'utf-8'))

    if (!Array.isArray(pendingContent) || pendingContent.length === 0) {
      console.log('No pending content to process')
      return
    }

    // Ensure ai-blogs directory exists
    if (!fs.existsSync(aiBlogsDir)) {
      fs.mkdirSync(aiBlogsDir, { recursive: true })
    }

    // Process each pending content item
    let processedCount = 0
    for (const item of pendingContent) {
      if (item.filename && item.content) {
        const filePath = path.join(aiBlogsDir, item.filename)

        // Check if file already exists
        if (fs.existsSync(filePath)) {
          console.log(`File ${item.filename} already exists, skipping`)
          continue
        }

        // Write the MDX file
        fs.writeFileSync(filePath, item.content)
        console.log(`Created: ${item.filename}`)
        processedCount++
      }
    }

    if (processedCount > 0) {
      console.log(`Processed ${processedCount} files`)

      // Clear the pending content file after successful processing
      fs.writeFileSync(pendingContentPath, JSON.stringify([], null, 2))
      console.log('Cleared pending content file')
    } else {
      console.log('No new files to process')
    }
  } catch (error) {
    console.error('Error processing pending content:', error)
  }
}

// Run the script
processPendingContent()
