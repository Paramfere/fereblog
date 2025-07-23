import { NextResponse } from 'next/server'
import { execSync } from 'child_process'

export async function POST() {
  try {
    // Run the process-pending script
    execSync('npm run process-pending', {
      stdio: 'pipe',
      cwd: process.cwd(),
    })

    return NextResponse.json({
      success: true,
      message: 'Pending content processed successfully',
    })
  } catch (error: any) {
    console.error('Error processing pending content:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to process pending content',
    })
  }
}
