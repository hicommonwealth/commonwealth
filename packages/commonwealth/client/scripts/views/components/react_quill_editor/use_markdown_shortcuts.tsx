import { DeltaStatic } from 'quill';
import { MutableRefObject, useMemo } from 'react';
import ReactQuill from 'react-quill';

type UseMarkdownShortcutsProps = {
  editorRef: MutableRefObject<ReactQuill>;
  setContentDelta: (value: DeltaStatic) => void;
};

export const useMarkdownShortcuts = ({
  editorRef,
  setContentDelta,
}: UseMarkdownShortcutsProps) => {
  const keyboard = useMemo(() => {
    const createBinding = (keyboardKey: string, markdownChars: string) => {
      return {
        key: keyboardKey,
        shortKey: true,
        handler: () => {
          const editor = editorRef?.current?.getEditor();
          if (!editor) {
            return;
          }
          const selection = editor.getSelection();
          if (!selection) {
            return;
          }
          // TODO: remove leading/trailing spaces from selection?
          const start = selection.index;
          const end = start + selection.length;
          editor.insertText(end, markdownChars);
          editor.insertText(start, markdownChars);
          setContentDelta({
            ...editor.getContents(),
            ___isMarkdown: true,
          } as SerializableDeltaStatic);
        },
      };
    };

    return {
      bindings: {
        bold: createBinding('b', '**'),
        italic: createBinding('i', '_'),
      },
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return keyboard;
};
