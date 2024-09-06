import { useCallback } from 'react';
import { ImageHandler, ImageURL } from 'views/pages/Editor/Editor';
import { useImageUploadHandlerLocal } from 'views/pages/Editor/useImageUploadHandlerLocal';
import { useImageUploadHandlerS3 } from 'views/pages/Editor/useImageUploadHandlerS3';

/**
 * Handles supporting either of our image handlers.
 */
export function useImageUploadHandler(imageHandler: ImageHandler) {
  const imageUploadHandlerDelegateLocal = useImageUploadHandlerLocal();
  const imageUploadHandlerDelegateS3 = useImageUploadHandlerS3();

  return useCallback(
    async (file: File): Promise<ImageURL> => {
      switch (imageHandler) {
        case 'S3':
          return await imageUploadHandlerDelegateS3(file);
        case 'local':
          return await imageUploadHandlerDelegateLocal(file);
      }

      throw new Error('Unknown image handler: ' + imageHandler);
    },
    [
      imageHandler,
      imageUploadHandlerDelegateLocal,
      imageUploadHandlerDelegateS3,
    ],
  );
}
