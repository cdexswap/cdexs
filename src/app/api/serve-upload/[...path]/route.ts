import { NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import path from 'path';
import mime from 'mime-types';

export async function GET(
  request: Request,
  { params }: { params: { path: string[] } }
) {
  try {
    // Get the file path from params
    const filePath = params.path.join('/');
    
    // Determine upload directory based on platform and environment
    let uploadDir;
    if (process.env.NODE_ENV === 'production') {
      if (process.platform === 'win32') {
        uploadDir = process.env.UPLOAD_DIR || 'C:\\uploads';
      } else {
        uploadDir = process.env.UPLOAD_DIR || '/var/www/uploads';
      }
    } else {
      uploadDir = path.join(process.cwd(), 'public', 'uploads');
    }

    // Read the file
    const fullPath = path.join(uploadDir, filePath);
    const file = await readFile(fullPath);
    
    // Determine content type
    const contentType = mime.lookup(fullPath) || 'application/octet-stream';
    
    // Return file with proper content type
    return new NextResponse(file, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000',
      },
    });
  } catch (error) {
    console.error('Error serving upload:', error);
    return new NextResponse('File not found', { status: 404 });
  }
}
