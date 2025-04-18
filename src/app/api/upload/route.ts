import { NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import streamifier from 'streamifier';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

cloudinary.config();

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Only image files are allowed' }, { status: 400 });
    }
  
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);


    const uniqueFilename = `${uuidv4()}${path.extname(file.name)}`;

    const uploadResult = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          public_id: uniqueFilename,
          folder: 'chat_uploads', 
        },
        (error, result) => {
          if (result) {
            resolve(result);
          } else {
            reject(error);
          }
        }
      );
      streamifier.createReadStream(buffer).pipe(uploadStream);
    });

    const result = uploadResult as any;
    return NextResponse.json({
      url: result.secure_url,
      type: file.type,
      filename: file.name,
      size: file.size,
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json({ error: 'Error uploading file' }, { status: 500 });
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
};
