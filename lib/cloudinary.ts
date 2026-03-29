import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Upload image to Cloudinary
 * @param file - File or base64 string to upload
 * @param folder - Folder name in Cloudinary (default: 'canteen-logos')
 * @returns URL of uploaded image
 */
export async function uploadToCloudinary(
  file: string,
  folder: string = 'canteen-logos'
): Promise<string> {
  try {
    const result = await cloudinary.uploader.upload(file, {
      folder,
      resource_type: 'image',
      transformation: [
        { width: 400, height: 400, crop: 'fill', gravity: 'center' },
        { quality: 'auto', fetch_format: 'auto' },
      ],
    });

    return result.secure_url;
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw new Error('Failed to upload image to Cloudinary');
  }
}

/**
 * Upload video to Cloudinary using streaming
 * @param buffer - File buffer to upload
 * @param folder - Folder name in Cloudinary (default: 'verification-videos')
 * @returns Object containing URL and public_id
 */
export async function uploadVideoToCloudinary(
  buffer: Buffer,
  folder: string = 'verification-videos'
): Promise<{ url: string; public_id: string }> {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: 'video',
        folder,
        chunk_size: 6000000, // 6MB chunk size for better reliability with larger videos
      },
      (error, result) => {
        if (error) {
          console.error('Cloudinary video upload error:', error);
          reject(new Error('Failed to upload video to Cloudinary'));
        } else if (result) {
          resolve({
            url: result.secure_url,
            public_id: result.public_id,
          });
        } else {
          reject(new Error('Upload completed but no result was returned'));
        }
      }
    );

    // End the stream with the buffer data
    uploadStream.end(buffer);
  });
}

/**
 * Delete image from Cloudinary
 * @param publicId - Public ID of the image to delete
 */
export async function deleteFromCloudinary(publicId: string): Promise<void> {
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error('Cloudinary delete error:', error);
    throw new Error('Failed to delete image from Cloudinary');
  }
}

/**
 * Extract public ID from Cloudinary URL
 * @param url - Cloudinary URL
 * @returns Public ID
 */
export function extractPublicId(url: string): string {
  const parts = url.split('/');
  const filename = parts[parts.length - 1];
  return filename.split('.')[0];
}

export default cloudinary;
