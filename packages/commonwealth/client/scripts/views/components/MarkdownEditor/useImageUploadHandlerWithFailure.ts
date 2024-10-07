import { delay } from '@hicommonwealth/shared';
import { useCallback } from 'react';

/**
 * Fake image upload handler that just fails
 */
export function useImageUploadHandlerWithFailure() {
  return useCallback(async () => {
    await delay(1000);
    throw new Error('Image upload failed successfully.');
  }, []);
}
