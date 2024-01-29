import {
  Code,
  Image,
  LinkSimple,
  ListBullets,
  ListChecks,
  ListNumbers,
  Quotes,
  TextB,
  TextHOne,
  TextHTwo,
  TextItalic,
  TextStrikethrough,
} from '@phosphor-icons/react';
import clsx from 'clsx';
import { DeltaStatic } from 'quill';
import React, { MutableRefObject, useMemo } from 'react';
import ReactQuill from 'react-quill';
import { SerializableDeltaStatic, renderToolbarIcon } from './utils';

import 'components/react_quill/react_quill_editor.scss';

import { CWIconButton } from 'views/components/component_kit/cw_icon_button';

const quillIcons = ReactQuill.Quill.import('ui/icons');

Object.assign(quillIcons, {
  header: {
    1: renderToolbarIcon(TextHOne),
    2: renderToolbarIcon(TextHTwo),
  },
  bold: renderToolbarIcon(TextB),
  italic: renderToolbarIcon(TextItalic),
  strike: renderToolbarIcon(TextStrikethrough),
  link: renderToolbarIcon(LinkSimple),
  'code-block': renderToolbarIcon(Code),
  blockquote: renderToolbarIcon(Quotes, { weight: 'fill' }),
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
  isMarkdownEnabled: boolean;
  handleToggleMarkdown: () => void;
  setIsPreviewVisible: React.Dispatch<React.SetStateAction<boolean>>;
  isDisabled?: boolean;
  isPreviewDisabled: boolean;
};

export const CustomQuillToolbar = ({
  toolbarId,
  setIsPreviewVisible,
  handleToggleMarkdown,
  isMarkdownEnabled,
  isDisabled = false,
  isPreviewDisabled,
}: CustomQuillToolbarProps) => (
  <div id={toolbarId} className="CustomQuillToolbar">
    <div className={clsx('left-buttons', { isDisabled })}>
      <div className="section">
        <button className="ql-header" value={1} />
        <button className="ql-header" value={2} />
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
    <div className={clsx('right-buttons', { isDisabled })}>
      <button
        className={clsx('markdown-button', { enabled: isMarkdownEnabled })}
        onClick={handleToggleMarkdown}
      >
        Markdown
      </button>
      <div className="eye-icon">
        <CWIconButton
          iconName="eye"
          iconSize="small"
          onClick={() => setIsPreviewVisible(true)}
          disabled={isPreviewDisabled}
        />
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
      const hashChar = headerValue === '2' ? '##' : '#';
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
      const newText = text.split('\n').reduce((acc, line) => {
        // remove empty lines
        if (line.trim().length === 0) {
          return acc;
        }
        // don't add prefix if already has it
        if (line.startsWith(prefix)) {
          return acc + `${line.trim()}\n`;
        }
        return acc + `${prefix} ${line}\n`;
      }, '');
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
