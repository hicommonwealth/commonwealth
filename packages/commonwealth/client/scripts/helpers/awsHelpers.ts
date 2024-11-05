import { isLinkValid } from './link';

const S3_URL_REGEX = /^https:\/\/s3(\.[^.]+)?\.amazonaws\.com(\/.*)?$/;

export function isS3URL(url: string) {
  return isLinkValid(url) && S3_URL_REGEX.test(url);
}
