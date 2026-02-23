import imageCompression from 'browser-image-compression';

export async function compressImage(file: File): Promise<File> {
  try {
    if (!file.type.startsWith('image/')) {
      console.log('Not an image file, skipping compression.');
      return file;
    }

    const options = {
      maxSizeMB: 10,
      maxWidthOrHeight: 1000, // in pixels, due to cloudflare polish limit
      useWebWorker: true, // allows compression to run in separate thread in browser
    };

    return imageCompression(file, options);
  } catch (e) {
    console.error(e);
    throw new Error(e);
  }
}
