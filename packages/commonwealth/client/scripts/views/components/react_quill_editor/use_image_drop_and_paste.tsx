import { MutableRefObject, useCallback } from 'react';
import ReactQuill, { Quill } from 'react-quill';
import { DeltaOperation, DeltaStatic } from 'quill';
import imageDropAndPaste from 'quill-image-drop-and-paste';

import app from 'state';
import {
  SerializableDeltaStatic,
  VALID_IMAGE_TYPES,
  base64ToFile,
  uploadFileToS3,
} from './utils';

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

        const selectedIndex = editor.getSelection()?.index;
        const text: string = editor.getText();
        let blankEditor = false;
        let lineBreak = '\n';

        // When Quill editor is blank, getLength returns 1
        if (editor.getLength() > 1) {
          if (text[selectedIndex - 1] && text[selectedIndex]) {
            lineBreak = '\n\n';
          }
        } else {
          blankEditor = true;
        }

        // Insert image op at the selected index.
        // If editor is not blank, must insert a line break
        // for the image to be in the middle of text
        if (isMarkdownEnabled) {
          editor.insertText(selectedIndex, `![image](${uploadedFileUrl})`);
        } else {
          if (!blankEditor) {
            editor.insertText(selectedIndex, lineBreak);
          }
          if (selectedIndex === 0) {
            editor.insertEmbed(selectedIndex, 'image', uploadedFileUrl);
          } else {
            editor.insertEmbed(selectedIndex + 1, 'image', uploadedFileUrl);
          }
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
    [editorRef, isMarkdownEnabled, setContentDelta, setIsUploading]
  );

  return { handleImageDropAndPaste };
};
