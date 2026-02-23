import { S3_ASSET_BUCKET_CDN } from '@hicommonwealth/shared';

/**
 * Valid image extensions for user-generated content.
 * Images must have one of these extensions to be rendered.
 */
export const VALID_IMAGE_EXTENSIONS = [
  '.jpg',
  '.jpeg',
  '.png',
  '.gif',
  '.webp',
  '.svg',
  '.bmp',
  '.ico',
  '.avif',
] as const;

/**
 * Checks if an image URL is valid for rendering in user-generated content.
 * A valid image URL must:
 * 1. Use HTTPS protocol (or be a data: URL for inline images, or ipfs:// which gets converted)
 * 2. Have a valid image file extension
 *
 * @param url - The image URL to validate
 * @returns true if the URL is valid for rendering, false otherwise
 */
export const isValidImageUrl = (url: string | undefined | null): boolean => {
  if (!url || typeof url !== 'string') {
    return false;
  }

  const trimmedUrl = url.trim();
  if (!trimmedUrl) {
    return false;
  }

  // Allow data URLs (base64 encoded images)
  if (trimmedUrl.startsWith('data:image/')) {
    return true;
  }

  // Allow IPFS URLs (they get converted to HTTPS later)
  if (trimmedUrl.startsWith('ipfs://')) {
    return true;
  }

  // Must be HTTPS for all other URLs
  if (!trimmedUrl.startsWith('https://')) {
    return false;
  }

  // Check for valid image extension
  // Parse URL to handle query strings and fragments
  try {
    const urlObj = new URL(trimmedUrl);
    const pathname = urlObj.pathname.toLowerCase();

    // Check if pathname ends with a valid image extension
    return VALID_IMAGE_EXTENSIONS.some((ext) => pathname.endsWith(ext));
  } catch {
    // If URL parsing fails, try a simple check on the URL string
    const lowerUrl = trimmedUrl.toLowerCase();
    // Remove query string and fragment for extension check
    const cleanUrl = lowerUrl.split('?')[0].split('#')[0];
    return VALID_IMAGE_EXTENSIONS.some((ext) => cleanUrl.endsWith(ext));
  }
};

const defaultAvatars: string[] = [
  `https://${S3_ASSET_BUCKET_CDN}/fb3289b0-38cb-4883-908b-7af0c1626ece.png`,
  `https://${S3_ASSET_BUCKET_CDN}/794bb7a3-17d7-407a-b52e-2987501221b5.png`,
  `https://${S3_ASSET_BUCKET_CDN}/181e25ad-ce08-427d-8d3a-d290af3be44b.png`,
  `https://${S3_ASSET_BUCKET_CDN}/9f40b221-e2c7-4052-a7de-e580222baaa9.png`,
  `https://${S3_ASSET_BUCKET_CDN}/ef919936-8554-42e5-8590-118e8cb68101.png`,
  `https://${S3_ASSET_BUCKET_CDN}/0847e7f5-4d96-4406-8f30-c3082fa2f27c.png`,
];

export function getRandomAvatar(): string {
  const randomIndex = Math.floor(Math.random() * defaultAvatars.length);
  return defaultAvatars[randomIndex];
}

const defaultContestImages = [
  `https://${S3_ASSET_BUCKET_CDN}/42b9d2d9-79b8-473d-b404-b4e819328ded.png`,
  `https://${S3_ASSET_BUCKET_CDN}/496806e3-f662-4fb5-8da6-24a969f161f1.png`,
  `https://${S3_ASSET_BUCKET_CDN}/e4111236-8bdb-48bd-8821-4f03e8e978a6.png`,
  `https://${S3_ASSET_BUCKET_CDN}/fab3f073-9bf1-4ac3-8625-8b2ee258b5a8.png`,
];

export function getDefaultContestImage() {
  return defaultContestImages[
    Math.floor(Math.random() * defaultContestImages.length)
  ];
}
