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
import React, { MouseEventHandler, MutableRefObject, useMemo } from 'react';
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
  selectedFormat?: MouseEventHandler;
};

export const CustomQuillToolbar = ({
  toolbarId,
  isDisabled = false,
  selectedFormat,
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
      </div>
      <div className="section">
        <button className="ql-list" value="ordered" onClick={selectedFormat} />
        <button className="ql-list" value="bullet" onClick={selectedFormat} />
        <button className="ql-list" value="check" onClick={selectedFormat} />
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

  /**
   * Replaces the selections list item prefixes in the given text with the specified prefix.
   * @param {string} text - The input text containing list items.
   * @param {string} prefix - The new prefix to be applied to the list items.
   * @returns {string} The text with list item prefixes replaced or added.
   */
  const handleListText = (text: string, prefix: string) => {
    let counter = 1;
    let hasIncremented = false;

    return text
      .split('\n')
      .map((line) => {
        if (line.trim().length === 0) {
          return line;
        }

        const startsWithPrefix = Object.values(LIST_ITEM_PREFIX).some((p) =>
          line.trim().startsWith(p),
        );

        if (startsWithPrefix) {
          return Object.keys(LIST_ITEM_PREFIX).reduce((modifiedLine, key) => {
            if (line.trim().startsWith(LIST_ITEM_PREFIX[key])) {
              return modifiedLine.replace(
                new RegExp(`^\\s*(${LIST_ITEM_PREFIX[key]})`),
                prefix,
              );
            }

            return modifiedLine;
          }, line);
        }
        if (/^\s*\d+\./.test(line)) {
          return line.replace(/^\s*\d+\./, prefix);
        }

        if (line.startsWith(prefix)) {
          return line;
        }

        if (prefix === LIST_ITEM_PREFIX.ordered) {
          const numberedPrefix = `${counter++}.`;
          if (line.trim() === '' && !hasIncremented) {
            hasIncremented = true; // Mark the counter as incremented
            return `${numberedPrefix} ${line}`;
          }
          hasIncremented = false;
          return `${numberedPrefix} ${line}`;
        }

        return `${prefix} ${line}`;
      })
      .join('\n');
  };

  /**
   * Creates a handler for applying list markdown to the text in the editor.
   * @returns {Function} A function that applies list markdown to the text in line or selected text.
   */
  const createListHandler = () => {
    /**
     * Applies list markdown to the selected text in the editor.
     * @param {string} value - The value representing the type of list (e.g., 'ordered', 'bullet', 'check').
     */
    let toggledList = null;
    return (value: string) => {
      const editor = editorRef?.current?.getEditor();

      if (toggledList === value) {
        toggledList = null;
      } else {
        toggledList = value;
      }

      if (!editor) return;

      const selection = editor.getSelection();
      if (!selection) return;

      const prefix = LIST_ITEM_PREFIX[value];

      if (!prefix) {
        throw new Error(`could not get prefix for value: ${value}`);
      }

      const selectedText = editor.getText(selection.index, selection.length);

      const editorLength = editor.getLength() || 0;

      // If there is a selection, format the selected text
      if (selectedText.length > 0) {
        const newText = handleListText(selectedText, prefix);
        editor.deleteText(selection.index, selection.length);
        editor.insertText(selection.index, newText);
      } else {
        const [currentLine] = editor.getLeaf(selection.index);
        const currentLineIdx = editor.getIndex(currentLine);

        //if there is no text in the editor, insert the prefix and a space
        if (currentLineIdx === 0 && prefix !== currentLine.text?.trim()) {
          editor.setText(`${prefix} `);
          editor.setSelection(prefix.length + 1, prefix.length + 1);
          return;
        }

        //if the current line has a prefix and there is text after the prefix, replace the prefix
        Object.values(LIST_ITEM_PREFIX).forEach((p) => {
          if (p === prefix) {
            //If the current line is a br tag, insert the prefix and a space
            if (currentLine.domNode.outerHTML === '<br>') {
              editor.insertText(currentLineIdx, `${prefix} `);
              return;
            }
            const currentLineText = currentLine.text.replace(prefix, '');
            editor.deleteText(currentLineIdx, currentLine.text.length);
            editor.insertText(currentLineIdx, currentLineText.trim());
          }
          if (currentLine.text.startsWith(p)) {
            const currentLineText = currentLine.text.replace(p, '');
            editor.deleteText(currentLineIdx, currentLine.text.length);
            editor.insertText(currentLineIdx, currentLineText.trim());
            return;
          }
        });

        //if the current line has a prefix and there is no text after the prefix, remove the prefix
        if (currentLine.text && currentLine.text.trim() === prefix) {
          editor.deleteText(currentLineIdx, editorLength || prefix.length);
          return;
        }

        return editor.insertText(currentLineIdx || 0, `${prefix} `);
      }

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
