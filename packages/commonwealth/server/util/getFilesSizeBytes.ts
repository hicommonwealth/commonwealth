import fetch from 'node-fetch';

export async function getFileSizeBytes(url: string): Promise<number> {
  if (!url) {
    return 0;
  }
  // Range header is to prevent it from reading any bytes from the GET request because we only want the headers.
  const resp = await fetch(url, { headers: { Range: 'bytes=0-0' } });
  if (!resp) {
    return 0;
  }
  return parseInt(resp.headers.get('content-range').split('/')[1], 10);
}
