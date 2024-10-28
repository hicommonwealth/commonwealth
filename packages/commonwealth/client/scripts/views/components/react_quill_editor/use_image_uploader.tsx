import { DeltaStatic } from 'quill';
import { MutableRefObject, useCallback } from 'react';
import ReactQuill from 'react-quill';
import { useUploadFileMutation } from 'state/api/general';
import { SerializableDeltaStatic } from './utils';

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
  const { mutateAsync: uploadImage } = useUploadFileMutation({});

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

        const uploadedFileUrl = await uploadImage({
          file,
        });

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
    [editorRef, setContentDelta, setIsUploading],
  );

  return { handleImageUploader };
};
