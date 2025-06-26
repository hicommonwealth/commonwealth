import { S3_ASSET_BUCKET_CDN } from '@hicommonwealth/shared';
import { describe, expect, test } from 'vitest';
import { getFileSizeBytes } from '../src/utils';

describe('checkIconSize', () => {
  test("should return zero if url provided doesn't exist", async () => {
    const fileSizeBytes = await getFileSizeBytes('badUrl');
    expect(fileSizeBytes).toBe(0);
  });

  // TODO: make this test not require a remote HTTP request?
  test('should return the image size', async () => {
    const fileSizeBytes = await getFileSizeBytes(
      `https://${S3_ASSET_BUCKET_CDN}/39115039-f3dc-4723-8813-f8a09107ca27.jpeg`,
    );
    expect(fileSizeBytes).toBe(155407);
  });
});
