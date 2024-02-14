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

  const createListHandler = () => {
    return (value) => {
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

      const newText = text
        .split('\n')
        .map((line) => {
          const trimmedLine = line.trim();

          if (trimmedLine.length === 0) {
            return '';
          }

          let updatedLine = trimmedLine;

          // Remove previous prefixes
          Object.values(LIST_ITEM_PREFIX).forEach((p) => {
            if (trimmedLine.startsWith(p)) {
              updatedLine = updatedLine.substring(p.length);
            }
          });

          if (value === 'check' && !updatedLine.startsWith('[ ]')) {
            updatedLine = `${prefix} ${updatedLine}`;
          } else {
            updatedLine = `${prefix} ${updatedLine}`;
          }

          return updatedLine;
        })
        .join('\n');

      editor.deleteText(selection.index, selection.length);
      editor.insertText(selection.index, newText);
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
