import { delay } from '@hicommonwealth/shared';
import { useCallback } from 'react';

/**
 * Just a basic local image handler that uses a file URL.
 *
 * This should remain and not be removed, otherwise, in dev mode, we'll
 * constantly be uploading to S3.
 */
export function useImageUploadHandlerLocal() {
  return useCallback(async (file: File) => {
    await delay(1000);
    return URL.createObjectURL(file);
  }, []);
}
