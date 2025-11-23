import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';

cloudinary.config({

  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dshfshyhs',
  api_key: process.env.CLOUDINARY_API_KEY || '762454494361861',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'LkFJb6nstGJOBoXzMBXAwZ8N458',
});

export interface UploadResult {
  secure_url: string;
  public_id: string;
  width?: number;
  height?: number;
}

export const uploadToCloudinary = async (
  file: Express.Multer.File,
  folder: string = 'cafecare'
): Promise<UploadResult> => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: folder,
        resource_type: 'image',
        transformation: [
          { width: 800, height: 800, crop: 'limit' },
          { quality: 'auto' },
        ],
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else if (result) {
          resolve({
            secure_url: result.secure_url,
            public_id: result.public_id,
            width: result.width,
            height: result.height,
          });
        } else {
          reject(new Error('Upload failed: No result returned'));
        }
      }
    );

    const bufferStream = new Readable();
    bufferStream.push(file.buffer);
    bufferStream.push(null);
    bufferStream.pipe(uploadStream);
  });
};

export const extractPublicId = (url: string): string | null => {
  try {
    const parts = url.split('/');
    const filename = parts[parts.length - 1];
    const publicId = filename.split('.')[0];
    const folderParts = parts.slice(parts.indexOf('upload') + 1, -1);
    if (folderParts.length > 0) {
      return `${folderParts.join('/')}/${publicId}`;
    }
    return publicId;
  } catch (error) {
    return null;
  }
};

export const deleteFromCloudinary = async (url: string): Promise<void> => {
  try {
    const publicId = extractPublicId(url);
    if (publicId) {
      await cloudinary.uploader.destroy(publicId);
    }
  } catch (error) {
    console.error('Error deleting from Cloudinary:', error);
  }
};

export default cloudinary;

