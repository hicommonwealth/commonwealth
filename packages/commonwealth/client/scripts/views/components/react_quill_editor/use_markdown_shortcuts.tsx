import { DeltaStatic } from 'quill';
import { MutableRefObject, useMemo } from 'react';
import ReactQuill from 'react-quill';
import { SerializableDeltaStatic } from './utils';

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
          const text = editor.getText(selection.index, selection.length);
          editor.deleteText(selection.index, selection.length);
          editor.insertText(
            selection.index,
            `${markdownChars}${text.trim()}${markdownChars}`
          );
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
