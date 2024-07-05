import { DeltaStatic } from 'quill';
import { MutableRefObject, useCallback } from 'react';
import ReactQuill from 'react-quill';
import { SerializableDeltaStatic, uploadFileToS3 } from './utils';

import useUserStore from 'client/scripts/state/ui/user';
import app from 'state';
import { compressImage } from 'utils/ImageCompression';

type UseImageUploaderProps = {
  editorRef: MutableRefObject<ReactQuill>;
  setIsUploading: (value: boolean) => void;
  setContentDelta: (value: DeltaStatic) => void;
};

export const useImageUploader = ({
  editorRef,
  setIsUploading,
  setContentDelta,
}: UseImageUploaderProps) => {
  const user = useUserStore();

  const handleImageUploader = useCallback(
    async (file: File) => {
      const editor = editorRef.current?.editor;

      try {
        if (!editor) {
          throw new Error('editor is not set');
        }

        setIsUploading(true);

        editor.disable();

        const selectedIndex =
          editor.getSelection()?.index || editor.getLength() || 0;

        // Compress the image before uploading
        const compressedFile = await compressImage(file);

        const uploadedFileUrl = await uploadFileToS3(
          compressedFile,
          app.serverUrl(),
          user.jwt || '',
        );

        // insert image op at the selected index
        editor.insertText(selectedIndex, `![image](${uploadedFileUrl})`);

        setContentDelta({
          ...editor.getContents(),
          ___isMarkdown: true,
        } as SerializableDeltaStatic); // sync state with editor content

        return uploadedFileUrl;
      } catch (err) {
        console.error(err);
      } finally {
        // @ts-expect-error <StrictNullChecks/>
        editor.enable();
        setIsUploading(false);
      }
    },
    [editorRef, setContentDelta, setIsUploading, user.jwt],
  );

  return { handleImageUploader };
};
