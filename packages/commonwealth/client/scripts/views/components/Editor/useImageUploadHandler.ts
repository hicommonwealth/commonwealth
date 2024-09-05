import { notifyError } from 'controllers/app/notifications';
import { useCallback } from 'react';
import { ImageHandler, ImageURL } from 'views/pages/Editor/Editor';
import { useImageUploadHandlerLocal } from 'views/pages/Editor/useImageUploadHandlerLocal';
import { useImageUploadHandlerS3 } from 'views/pages/Editor/useImageUploadHandlerS3';
import { useImageUploadHandlerWithFailure } from 'views/pages/Editor/useImageUploadHandlerWithFailure';

/**
 * Handles supporting either of our image handlers.
 */
export function useImageUploadHandler(imageHandler: ImageHandler) {
  const imageUploadHandlerDelegateLocal = useImageUploadHandlerLocal();
  const imageUploadHandlerDelegateS3 = useImageUploadHandlerS3();
  const imageUploadHandlerDelegateWithFailure =
    useImageUploadHandlerWithFailure();

  return useCallback(
    async (file: File): Promise<ImageURL> => {
      try {
        switch (imageHandler) {
          case 'S3':
            return await imageUploadHandlerDelegateS3(file);
          case 'local':
            return await imageUploadHandlerDelegateLocal(file);
          case 'failure':
            return await imageUploadHandlerDelegateWithFailure(file);
        }
      } catch (e) {
        notifyError('Failed to upload image: ' + e.message);
      }

      throw new Error('Unknown image handler: ' + imageHandler);
    },
    [
      imageHandler,
      imageUploadHandlerDelegateLocal,
      imageUploadHandlerDelegateS3,
      imageUploadHandlerDelegateWithFailure,
    ],
  );
}
