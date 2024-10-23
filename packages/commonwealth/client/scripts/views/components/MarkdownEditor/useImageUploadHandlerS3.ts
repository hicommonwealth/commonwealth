import { useCallback } from 'react';
import { SERVER_URL } from 'state/api/config';
import useUserStore from 'state/ui/user';
import { uploadFileToS3 } from 'views/components/react_quill_editor/utils';
import { ImageURL } from './MarkdownEditor';

/**
 * This is the main/default image handler for S3.
 */
export function useImageUploadHandlerS3() {
  const user = useUserStore();

  return useCallback(
    async (file: File): Promise<ImageURL> => {
      const uploadedFileUrl = await uploadFileToS3(
        file,
        SERVER_URL,
        user.jwt || '',
      );
      return uploadedFileUrl;
    },
    [user.jwt],
  );
}
