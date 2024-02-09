import {
  Code,
  Image,
  Link,
  ListBullets,
  ListChecks,
  ListNumbers,
  Quotes,
  TextB,
  TextHOne,
  TextHThree,
  TextHTwo,
  TextItalic,
  TextStrikethrough,
} from '@phosphor-icons/react';
import clsx from 'clsx';
import 'components/react_quill/react_quill_editor.scss';
import { DeltaStatic } from 'quill';
import React, { MutableRefObject, useMemo } from 'react';
import ReactQuill from 'react-quill';
import { SerializableDeltaStatic, renderToolbarIcon } from './utils';

const quillIcons = ReactQuill.Quill.import('ui/icons');

Object.assign(quillIcons, {
  header: {
    1: renderToolbarIcon(TextHOne),
    2: renderToolbarIcon(TextHTwo),
    3: renderToolbarIcon(TextHThree),
  },
  bold: renderToolbarIcon(TextB),
  italic: renderToolbarIcon(TextItalic),
  strike: renderToolbarIcon(TextStrikethrough),
  link: renderToolbarIcon(Link),
  'code-block': renderToolbarIcon(Code),
  blockquote: renderToolbarIcon(Quotes),
  image: renderToolbarIcon(Image),
  list: {
    ordered: renderToolbarIcon(ListNumbers),
    bullet: renderToolbarIcon(ListBullets),
    check: renderToolbarIcon(ListChecks),
  },
});

const LIST_ITEM_PREFIX = {
  ordered: '1.',
  bullet: '-',
  check: '- [ ]',
};

type CustomQuillToolbarProps = {
  toolbarId: string;
  isDisabled?: boolean;
};

export const CustomQuillToolbar = ({
  toolbarId,
  isDisabled = false,
}: CustomQuillToolbarProps) => (
  <div id={toolbarId} className="CustomQuillToolbar">
    <div className={clsx('formatting-buttons-container', { isDisabled })}>
      <div className="section">
        <button className="ql-header" value={1} />
        <button className="ql-header" value={2} />
        <button className="ql-header" value={3} />
      </div>
      <div className="section">
        <button className="ql-bold"></button>
        <button className="ql-italic"></button>
        <button className="ql-strike"></button>
      </div>
      <div className="section">
        <button className="ql-link"></button>
        <button className="ql-code-block"></button>
        <button className="ql-blockquote"></button>
        <button className="ql-image">image</button>
      </div>
      <div className="section">
        <button className="ql-list" value="ordered" />
        <button className="ql-list" value="bullet" />
        <button className="ql-list" value="check" />
      </div>
    </div>
  </div>
);

type UseMarkdownToolbarHandlersProps = {
  editorRef: MutableRefObject<ReactQuill>;
  setContentDelta: (value: DeltaStatic) => void;
};

export const useMarkdownToolbarHandlers = ({
  editorRef,
  setContentDelta,
}: UseMarkdownToolbarHandlersProps) => {
  const createHandler = (markdownChars: string) => {
    return () => {
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
        `${markdownChars}${text.trim()}${markdownChars}`,
      );
      setContentDelta({
        ...editor.getContents(),
        ___isMarkdown: true,
      } as SerializableDeltaStatic);
    };
  };

  const createHeaderHandler = () => {
    return (headerValue: string) => {
      const editor = editorRef?.current?.getEditor();
      if (!editor) {
        return;
      }
      const selection = editor.getSelection();
      if (!selection) {
        return;
      }
      const start = selection.index;
      const prefix = start === 0 ? '' : '\n';
      const hashChar = '#'.repeat(parseInt(headerValue));
      editor.insertText(start, `${prefix}${hashChar} `);
      setContentDelta({
        ...editor.getContents(),
        ___isMarkdown: true,
      } as SerializableDeltaStatic);
    };
  };

  const createLinkHandler = () => {
    return () => {
      const editor = editorRef?.current?.getEditor();
      if (!editor) {
        return;
      }
      const selection = editor.getSelection();
      if (!selection) {
        return;
      }
      const linkText =
        selection.length === 0
          ? prompt('Enter link text:')
          : editor.getText(selection.index, selection.length);
      let linkUrl = prompt('Enter link URL:');
      if (!linkUrl.startsWith('https://')) {
        if (linkUrl.startsWith('http://')) {
          // convert HTTP to HTTPS
          linkUrl = `https://${linkUrl.substring('http://'.length)}`;
        } else {
          linkUrl = `https://${linkUrl}`;
        }
      }
      const linkMarkdown = `[${linkText}](${linkUrl})`;
      editor.deleteText(selection.index, selection.length);
      editor.insertText(selection.index, linkMarkdown);
      setContentDelta({
        ...editor.getContents(),
        ___isMarkdown: true,
      } as SerializableDeltaStatic);
    };
  };

  const createBlockquoteHandler = () => {
    return () => {
      const editor = editorRef?.current?.getEditor();
      if (!editor) {
        return;
      }
      const selection = editor.getSelection();
      if (!selection) {
        return;
      }
      const start = selection.index;
      const prefix = start === 0 ? '' : '\n';
      editor.insertText(start, `${prefix}> `);
      setContentDelta({
        ...editor.getContents(),
        ___isMarkdown: true,
      } as SerializableDeltaStatic);
    };
  };

  // // Handles selecting and formatting ordered lists
  const handleListText = (text: string, prefix: string) => {
    let counter = 1;
    let hasIncremented = false;

    return text.split('\n').reduce((acc, line) => {
      if (line.trim().length === 0) {
        return acc;
      }

      if (line.startsWith(prefix)) {
        return acc + `${line.trim()}\n`;
      }

      if (prefix === '1.') {
        const numberedPrefix = `${counter++}.`;
        if (line.trim() === '' && !hasIncremented) {
          hasIncremented = true; // Mark the counter as incremented
          return acc + `${numberedPrefix} ${line}\n`;
        }
        hasIncremented = false;
        return acc + `${numberedPrefix} ${line}\n`;
      }
      return acc + `${prefix} ${line}\n`;
    }, '');
  };

  // const createListHandler = () => {
  //   return (value: string) => {
  //     const editor = editorRef?.current?.getEditor();
  //
  //     if (!editor) {
  //       return;
  //     }
  //     const selection = editor.getSelection();
  //     if (!selection) {
  //       return;
  //     }
  //     const prefix = LIST_ITEM_PREFIX[value];
  //
  //     if (!prefix) {
  //       throw new Error(`could not get prefix for value: ${value}`);
  //     }
  //     const text = editor.getText(selection.index, selection.length);
  //
  //     let newText;
  //
  //     if (text.length > 0) {
  //       newText = handleListText(text, prefix);
  //     } else {
  //       editor.insertText(0, `${prefix} `);
  //     }
  //
  //     editor.deleteText(selection.index, selection.length);
  //     editor.insertText(selection.index, newText);
  //     setContentDelta({
  //       ...editor.getContents(),
  //       ___isMarkdown: true,
  //     } as SerializableDeltaStatic);
  //   };
  // };

  const createListHandler = () => {
    return (value: string) => {
      const editor = editorRef?.current?.getEditor();

      if (!editor) {
        return;
      }

      const selection = editor.getSelection();

      if (!selection) {
        return;
      }

      const prefix = LIST_ITEM_PREFIX[value];

      if (!prefix) {
        throw new Error(`could not get prefix for value: ${value}`);
      }

      const text = editor.getText(selection.index, selection.length);
      let newText;

      if (text.length > 0) {
        newText = handleListText(text, prefix);
      } else {
        editor.insertText(selection.index, `${prefix} `);
      }

      // Detect Enter key press
      editor.on('keydown', (event) => {
        if (event.key === 'Enter') {
          event.preventDefault(); // Prevent default behavior of Enter key

          const currentLineIndex = editor.getLines(selection.index, 1)[0].index;
          const previousLineIndex = currentLineIndex - 1;

          if (previousLineIndex >= 0) {
            const previousLine = editor.getText(
              previousLineIndex,
              editor.getLine(previousLineIndex).length,
            );

            // Check if the previous line contains a list prefix
            if (
              Object.values(LIST_ITEM_PREFIX).some((listPrefix) =>
                previousLine.trim().startsWith(listPrefix),
              )
            ) {
              // Continue the list by inserting a new line with the same prefix
              const nextPrefix = `${prefix} `;
              editor.insertText(editor.getSelection().index, `\n${nextPrefix}`);
              return;
            }
          }

          // If the previous line doesn't contain a list prefix, insert a new list item
          editor.insertText(editor.getSelection().index, `\n${prefix} `);
        }
      });

      // Delete the selected text and insert the new list
      editor.deleteText(selection.index, selection.length);
      editor.insertText(selection.index, newText);

      // Update contentDelta
      setContentDelta({
        ...editor.getContents(),
        ___isMarkdown: true,
      } as SerializableDeltaStatic);
    };
  };

  const handlers = useMemo(() => {
    return {
      bold: createHandler('**'),
      italic: createHandler('_'),
      strike: createHandler('~~'),
      code: createHandler('`'),
      'code-block': createHandler('\n```\n'),
      header: createHeaderHandler(),
      link: createLinkHandler(),
      blockquote: createBlockquoteHandler(),
      list: createListHandler(),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return handlers;
};
