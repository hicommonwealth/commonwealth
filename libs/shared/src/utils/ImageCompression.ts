import imageCompression from 'browser-image-compression';

export const compressImage = async (
  input: Buffer | string | File | undefined,
): Promise<Buffer | string | File> => {
  if (!input) {
    throw new Error('No image data provided');
  }

  // Handle Buffer input (server-side)
  if (Buffer.isBuffer(input)) {
    // TODO: Implement buffer compression if needed
    return input;
  }

  // Handle File input (client-side)
  if (input instanceof File) {
    if (!input.type.startsWith('image/')) {
      console.log('Not an image file, skipping compression.');
      return input;
    }

    const options = {
      maxSizeMB: 10,
      maxWidthOrHeight: 1000,
      useWebWorker: true,
    };

    return imageCompression(input, options);
  }

  // Handle string input (data URL)
  if (typeof input === 'string') {
    if (!input.startsWith('data:image/')) {
      throw new Error('Invalid image format. Image must be a valid data URL');
    }

    try {
      const options = {
        maxSizeMB: 10,
        maxWidthOrHeight: 1000,
        useWebWorker: true,
      };

      // Convert data URL to blob, compress, and return as data URL
      const blob = await fetch(input).then((r) => r.blob());
      const compressedBlob = await imageCompression(
        new File([blob], 'image.jpg', { type: blob.type }),
        options,
      );
      return await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(compressedBlob);
      });
    } catch (e) {
      console.error('Image compression failed:', e);
      throw e;
    }
  }

  throw new Error('Unsupported input type');
};
