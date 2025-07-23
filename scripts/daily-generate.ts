import fetch from 'node-fetch'

async function main() {
  const res = await fetch('http://localhost:3000/api/generate-blogs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  })
  const data = await res.json()
  if (data.success) {
    console.log('Generated blog files:', data.filenames)
  } else {
    console.error('Some blogs failed to generate:', data.errors)
    if (data.filenames && data.filenames.length > 0) {
      console.log('Successfully generated:', data.filenames)
    }
  }
}

main()
