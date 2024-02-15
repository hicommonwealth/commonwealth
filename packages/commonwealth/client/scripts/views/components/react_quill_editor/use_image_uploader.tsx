import { DeltaStatic } from 'quill';
import { MutableRefObject, useCallback } from 'react';
import ReactQuill from 'react-quill';
import { SerializableDeltaStatic, uploadFileToS3 } from './utils';

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
          app.user.jwt,
        );

        // insert image op at the selected index
        // for some reason, must prefix with 3 spaces or else text will be truncated
        editor.insertText(selectedIndex, `   ![image](${uploadedFileUrl})`);

        setContentDelta({
          ...editor.getContents(),
          ___isMarkdown: true,
        } as SerializableDeltaStatic); // sync state with editor content

        return uploadedFileUrl;
      } catch (err) {
        console.error(err);
      } finally {
        editor.enable();
        setIsUploading(false);
      }
    },
    [editorRef, setContentDelta, setIsUploading],
  );

  return { handleImageUploader };
};
