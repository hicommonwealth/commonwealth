import { isLinkValid } from './link';

export function replaceBucketWithCDN(url: string) {
  return url.replace(
    's3.amazonaws.com/assets.commonwealth.im',
    'assets.commonwealth.im',
  );
}

const S3_URL_REGEX = /^https:\/\/s3(\.[^.]+)?\.amazonaws\.com(\/.*)?$/;

export function isS3URL(url: string) {
  return isLinkValid(url) && S3_URL_REGEX.test(url);
}
