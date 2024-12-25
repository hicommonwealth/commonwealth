import { S3_ASSET_BUCKET_CDN } from '@hicommonwealth/shared';

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
