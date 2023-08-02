export function replaceBucketWithCDN(url) {
  return url.replace(
    's3.amazonaws.com/assets.commonwealth.im',
    'assets.commonwealth.im'
  );
}
