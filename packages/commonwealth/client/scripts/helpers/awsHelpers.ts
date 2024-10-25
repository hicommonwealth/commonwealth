import { isLinkValid } from './link';

export function replaceBucketWithCDN(url: string) {
  const fileName = url.split('/').pop() || '';
  if (process.env.APP_ENV === 'production')
    return `assets.commonwealth.im/${fileName}`;
  return url;
}

const S3_URL_REGEX = /^https:\/\/s3(\.[^.]+)?\.amazonaws\.com(\/.*)?$/;

export function isS3URL(url: string) {
  return isLinkValid(url) && S3_URL_REGEX.test(url);
}
