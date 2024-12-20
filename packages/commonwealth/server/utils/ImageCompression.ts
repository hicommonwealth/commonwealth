import sharp from 'sharp';

export async function compressServerImage(buffer: Buffer): Promise<Buffer> {
  try {
    return await sharp(buffer)
      .resize(1000, 1000, {
        fit: 'inside',
        withoutEnlargement: true,
      })
      .jpeg({
        quality: 80,
        progressive: true,
      })
      .toBuffer();
  } catch (e) {
    console.error('Image compression failed:', e);
    throw e;
  }
}
