import { delay } from '@hicommonwealth/shared';
import { useCallback } from 'react';

/**
 * Just a basic local image handler that uses a file URL.
 */
export function useImageUploadHandlerLocal() {
  return useCallback(async (file: File) => {
    await delay(1000);
    return URL.createObjectURL(file);
  }, []);
}
