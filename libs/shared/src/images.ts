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
