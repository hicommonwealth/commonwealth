import { MutableRefObject, useCallback } from 'react';
import ReactQuill, { Quill } from 'react-quill';
import { DeltaOperation, DeltaStatic } from 'quill';
import imageDropAndPaste from 'quill-image-drop-and-paste';

import app from 'state';
import { SerializableDeltaStatic, base64ToFile, uploadFileToS3 } from './utils';

const VALID_IMAGE_TYPES = ['jpeg', 'gif', 'png'];

Quill.register('modules/imageDropAndPaste', imageDropAndPaste);

type UseImageDropAndPasteProps = {
  editorRef: MutableRefObject<ReactQuill>;
  setIsUploading: (value: boolean) => void;
  isMarkdownEnabled: boolean;
  setContentDelta: (value: DeltaStatic) => void;
};

export const useImageDropAndPaste = ({
  editorRef,
  setIsUploading,
  isMarkdownEnabled,
  setContentDelta,
}: UseImageDropAndPasteProps) => {
  // must be memoized or else infinite loop
  const handleImageDropAndPaste = useCallback(
    async (imageDataUrl, imageType) => {
      const editor = editorRef.current?.editor;

      try {
        if (!editor) {
          throw new Error('editor is not set');
        }

        setIsUploading(true);

        editor.disable();

        if (!imageType) {
          imageType = 'image/png';
        }

        const selectedIndex =
          editor.getSelection()?.index || editor.getLength() || 0;

        // filter out ops that contain a base64 image
        const opsWithoutBase64Images: DeltaOperation[] = (
          editor.getContents() || []
        ).filter((op) => {
          for (const opImageType of VALID_IMAGE_TYPES) {
            const base64Prefix = `data:image/${opImageType};base64`;
            if (op.insert?.image?.startsWith(base64Prefix)) {
              return false;
            }
          }
          return true;
        });
        setContentDelta({
          ops: opsWithoutBase64Images,
          ___isMarkdown: isMarkdownEnabled,
        } as SerializableDeltaStatic);

        const file = base64ToFile(imageDataUrl, imageType);

        const uploadedFileUrl = await uploadFileToS3(
          file,
          app.serverUrl(),
          app.user.jwt
        );

        // insert image op at the selected index
        if (isMarkdownEnabled) {
          editor.insertText(selectedIndex, `![image](${uploadedFileUrl})`);
        } else {
          editor.insertEmbed(selectedIndex, 'image', uploadedFileUrl);
        }
        setContentDelta({
          ...editor.getContents(),
          ___isMarkdown: isMarkdownEnabled,
        } as SerializableDeltaStatic); // sync state with editor content
      } catch (err) {
        console.error(err);
      } finally {
        editor.enable();
        setIsUploading(false);
      }
    },
    [editorRef, isMarkdownEnabled, setContentDelta]
  );

  return { handleImageDropAndPaste };
};
