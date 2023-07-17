import { useCallback, MutableRefObject } from 'react';
import { SerializableDeltaStatic, uploadFileToS3 } from './utils';
import { DeltaStatic } from 'quill';
import ReactQuill from 'react-quill';

import app from 'state';
import { compressImage } from 'utils/ImageCompression';

type UseImageUploaderProps = {
  editorRef: MutableRefObject<ReactQuill>;
  setIsUploading: (value: boolean) => void;
  isMarkdownEnabled: boolean;
  setContentDelta: (value: DeltaStatic) => void;
};

export const useImageUploader = ({
  editorRef,
  setIsUploading,
  isMarkdownEnabled,
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
          app.user.jwt
        );

        // insert image op at the selected index
        if (isMarkdownEnabled) {
          // for some reason, must prefix with 3 spaces or else text will be truncated
          editor.insertText(selectedIndex, `   ![image](${uploadedFileUrl})`);
        } else {
          editor.insertEmbed(selectedIndex, 'image', uploadedFileUrl);
        }
        setContentDelta({
          ...editor.getContents(),
          ___isMarkdown: isMarkdownEnabled,
        } as SerializableDeltaStatic); // sync state with editor content

        return uploadedFileUrl;
      } catch (err) {
        console.error(err);
      } finally {
        editor.enable();
        setIsUploading(false);
      }
    },
    [editorRef, isMarkdownEnabled, setContentDelta, setIsUploading]
  );

  return { handleImageUploader };
};
