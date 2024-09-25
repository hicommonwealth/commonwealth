import { DeltaOperation, DeltaStatic } from 'quill';
import imageDropAndPaste from 'quill-image-drop-and-paste';
import { MutableRefObject, useCallback } from 'react';
import ReactQuill, { Quill } from 'react-quill';
import { SERVER_URL } from 'state/api/config';

import useUserStore from 'state/ui/user';
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
  setContentDelta: (value: DeltaStatic) => void;
};

export const useImageDropAndPaste = ({
  editorRef,
  setIsUploading,
  setContentDelta,
}: UseImageDropAndPasteProps) => {
  const user = useUserStore();

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

        const file = base64ToFile(imageDataUrl, imageType);

        const uploadedFileUrl = await uploadFileToS3(
          file,
          SERVER_URL,
          user.jwt || '',
        );

        const selectedIndex = editor.getSelection()?.index || 0;

        editor.insertText(selectedIndex, `![image](${uploadedFileUrl})`);

        setContentDelta({
          ops: opsWithoutBase64Images,
          ...editor.getContents(),
          ___isMarkdown: true,
        } as SerializableDeltaStatic); // sync state with editor content
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

  return { handleImageDropAndPaste };
};
