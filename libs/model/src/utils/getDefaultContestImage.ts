import { S3_ASSET_BUCKET_CDN } from '@hicommonwealth/shared';

const defaultImages = [
  `https://${S3_ASSET_BUCKET_CDN}/42b9d2d9-79b8-473d-b404-b4e819328ded.png`,
  `https://${S3_ASSET_BUCKET_CDN}/496806e3-f662-4fb5-8da6-24a969f161f1.png`,
  `https://${S3_ASSET_BUCKET_CDN}/e4111236-8bdb-48bd-8821-4f03e8e978a6.png`,
  `https://${S3_ASSET_BUCKET_CDN}/fab3f073-9bf1-4ac3-8625-8b2ee258b5a8.png`,
];

export function getDefaultContestImage() {
  return defaultImages[Math.floor(Math.random() * defaultImages.length)];
}
