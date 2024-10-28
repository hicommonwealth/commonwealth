import { useCallback } from 'react';
import { useUploadFileMutation } from 'state/api/general';
import { ImageURL } from './MarkdownEditor';

/**
 * @Deprecated See `useUploadFileMutation` instead.
 * This is the main/default image handler for S3.
 */
export function useImageUploadHandlerS3() {
  const { mutateAsync: uploadImage } = useUploadFileMutation({});

  return useCallback(async (file: File): Promise<ImageURL> => {
    return await uploadImage({
      file,
    });
  }, []);
}
