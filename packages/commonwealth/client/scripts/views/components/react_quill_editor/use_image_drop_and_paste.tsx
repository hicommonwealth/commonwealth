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

        const selectedIndex: number = editor.getSelection()?.index;
        const text: string = editor.getText();
        const blankEditor: boolean = editor.getLength() === 1;
        const isEndOfLine: boolean = text[selectedIndex].endsWith('\n');
        let middleOfText = false;

        // adds line break to insert image above or below text
        if (!blankEditor) {
          let lineBreak = '\n';
          if (text[selectedIndex - 1] && text[selectedIndex]) {
            lineBreak = '\n\n';
            middleOfText = true;
          }

          editor.setText(
            text
              .slice(0, selectedIndex)
              .concat(lineBreak)
              .concat(text.slice(selectedIndex))
          );
        } else {
          editor.setText('\n'.concat(text));
        }

        const destinationIndex: number =
          (isEndOfLine && !blankEditor) || middleOfText
            ? selectedIndex + 1
            : selectedIndex;

        // insert image op at the selected index
        if (isMarkdownEnabled) {
          editor.insertText(destinationIndex, `![image](${uploadedFileUrl})`);
        } else {
          editor.insertEmbed(destinationIndex, 'image', uploadedFileUrl);
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
