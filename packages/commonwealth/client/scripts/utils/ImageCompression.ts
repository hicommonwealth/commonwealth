import imageCompression from 'browser-image-compression';

export async function compressImage(file: File): Promise<File> {
  try {
    if (!file.type.startsWith('image/')) {
      console.log('Not an image file, skipping compression.');
      return file;
    }

    const options = {
      maxSizeMB: 10,
      maxWidthOrHeight: 1000,
      useWebWorker: true,
    };

    return imageCompression(file, options);
  } catch (e) {
    console.error(e);
    throw e;
  }
}
