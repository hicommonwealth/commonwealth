import clsx from 'clsx';
import {
  codeBlockPlugin,
  codeMirrorPlugin,
  diffSourcePlugin,
  frontmatterPlugin,
  headingsPlugin,
  imagePlugin,
  linkDialogPlugin,
  linkPlugin,
  listsPlugin,
  markdownShortcutPlugin,
  MDXEditor,
  MDXEditorMethods,
  quotePlugin,
  tablePlugin,
  thematicBreakPlugin,
  toolbarPlugin,
} from 'commonwealth-mdxeditor';
import 'commonwealth-mdxeditor/style.css';
import { notifyError } from 'controllers/app/notifications';
import React, { memo, useCallback, useRef, useState } from 'react';
import { DesktopEditorFooter } from './DesktopEditorFooter';
import { DragIndicator } from './indicators/DragIndicator';
import { UploadIndicator } from './indicators/UploadIndicator';
import { ToolbarForDesktop } from './toolbars/ToolbarForDesktop';
import { ToolbarForMobile } from './toolbars/ToolbarForMobile';
import { useEditorErrorHandler } from './useEditorErrorHandler';
import { useImageUploadHandler } from './useImageUploadHandler';
import { canAcceptFileForImport } from './utils/canAcceptFileForImport';
import { codeBlockLanguages } from './utils/codeBlockLanguages';
import { editorTranslator } from './utils/editorTranslator';
import { fileToText } from './utils/fileToText';
import { iconComponentFor } from './utils/iconComponentFor';

import './MarkdownEditor.scss';

export type ImageURL = string;

export type MarkdownEditorMode = 'desktop' | 'mobile';

export type ImageHandler = 'S3' | 'local' | 'failure';

/**
 * A string that contains markdown.
 */
export type MarkdownStr = string;

export type UpdateContentStrategy = 'insert' | 'replace';

/**
 * Allows us to easily set the strategy back to replace but I suspect we will
 * have insert used for some things and replace used for others.  File uploads
 * seem like they should be 'replace'
 */
export const DEFAULT_UPDATE_CONTENT_STRATEGY =
  'insert' as UpdateContentStrategy;

type EditorProps = {
  readonly markdown?: MarkdownStr;
  readonly mode?: MarkdownEditorMode;
  readonly placeholder?: string;
  readonly imageHandler?: ImageHandler;
  readonly onSubmit?: (markdown: MarkdownStr) => void;
};

export const MarkdownEditor = memo(function MarkdownEditor(props: EditorProps) {
  const { onSubmit } = props;
  const errorHandler = useEditorErrorHandler();
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);

  const dragCounterRef = useRef(0);

  const mode = props.mode ?? 'desktop';
  const imageHandler: ImageHandler = props.imageHandler ?? 'S3';

  const placeholder = props.placeholder ?? 'Share your thoughts...';

  const mdxEditorRef = React.useRef<MDXEditorMethods>(null);

  const imageUploadHandlerDelegate = useImageUploadHandler(imageHandler);

  /**
   * When we've stopped dragging, we also need to decrement the drag counter.
   */
  const terminateDragging = useCallback(() => {
    setDragging(false);
    dragCounterRef.current = 0;
  }, []);

  const imageUploadHandler = useCallback(
    async (file: File) => {
      try {
        terminateDragging();
        setUploading(true);
        return await imageUploadHandlerDelegate(file);
      } finally {
        setUploading(false);
      }
    },
    [imageUploadHandlerDelegate, terminateDragging],
  );

  const handleFile = useCallback(async (file: File) => {
    if (!file.name.endsWith('.md')) {
      notifyError('Not a markdown file.');
      return;
    }

    const text = await fileToText(file);

    switch (DEFAULT_UPDATE_CONTENT_STRATEGY) {
      case 'insert':
        mdxEditorRef.current?.insertMarkdown(text);
        break;

      case 'replace':
        mdxEditorRef.current?.setMarkdown(text);
        break;
    }
  }, []);

  const handleImportMarkdown = useCallback(
    (file: File) => {
      async function doAsync() {
        await handleFile(file);
      }

      doAsync().catch(console.error);
    },
    [handleFile],
  );

  const handleFiles = useCallback(
    async (files: FileList) => {
      if (files.length === 1) {
        const file = files[0];

        if (canAcceptFileForImport(file)) {
          await handleFile(file);
        } else {
          notifyError('File not markdown. Has invalid type: ' + file.type);
        }
      }

      if (files.length > 1) {
        notifyError('Too many files given');
        return;
      }
    },
    [handleFile],
  );

  const handleDropAsync = useCallback(
    async (event: React.DragEvent) => {
      try {
        const files = event.dataTransfer.files;

        await handleFiles(files);
      } finally {
        terminateDragging();
      }
    },
    [handleFiles, terminateDragging],
  );

  const handleDrop = useCallback(
    (event: React.DragEvent) => {
      // ONLY handle this if it is markdown, else, allow the default paste
      // handler to work

      const files = event.dataTransfer.files;

      if (files.length === 1) {
        if (canAcceptFileForImport(files[0])) {
          handleDropAsync(event).catch(console.error);
          event.preventDefault();
        }
      }
    },
    [handleDropAsync],
  );

  const handleDragEnter = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    dragCounterRef.current = dragCounterRef.current + 1;

    if (dragCounterRef.current === 1) {
      setDragging(true);
    }
  }, []);

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    // This is necessary to allow a drop
    event.dataTransfer!.dropEffect = 'copy'; // Shows a copy cursor when dragging files
  }, []);

  const handleDragLeave = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    dragCounterRef.current = dragCounterRef.current - 1;

    if (dragCounterRef.current === 0) {
      setDragging(false);
    }
  }, []);

  const handlePaste = useCallback(
    (event: React.ClipboardEvent<HTMLDivElement>) => {
      const files = event.clipboardData.files;

      if (files.length === 0) {
        // now files here is acceptable because this could be a paste of other
        // data like text/markdown, and we're relying on the MDXEditor paste
        // handler to work
        return;
      }

      if (canAcceptFileForImport(files[0])) {
        // if we can accept this file for import, go ahead and do so...
        event.preventDefault();
        handleFiles(files).catch(console.error);
      }
    },
    [handleFiles],
  );

  const handleSubmit = useCallback(() => {
    if (mdxEditorRef.current) {
      const markdown = mdxEditorRef.current.getMarkdown();
      onSubmit?.(markdown);
    }
  }, [onSubmit]);

  return (
    <div className={clsx('mdxeditor-parent', 'mdxeditor-parent-mode-' + mode)}>
      <div
        className={clsx(
          'mdxeditor-container',
          'mdxeditor-container-mode-' + mode,
        )}
        onDrop={handleDrop}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onPaste={(event) => handlePaste(event)}
      >
        <MDXEditor
          onError={errorHandler}
          ref={mdxEditorRef}
          markdown={props.markdown ?? ''}
          placeholder={placeholder}
          iconComponentFor={iconComponentFor}
          translation={editorTranslator}
          plugins={[
            toolbarPlugin({
              location: mode === 'mobile' ? 'bottom' : 'top',
              toolbarContents: () =>
                mode === 'mobile' ? (
                  <ToolbarForMobile onSubmit={handleSubmit} />
                ) : (
                  <ToolbarForDesktop />
                ),
            }),
            listsPlugin(),
            quotePlugin(),
            headingsPlugin(),
            linkPlugin(),
            linkDialogPlugin(),
            codeBlockPlugin({ defaultCodeBlockLanguage: 'js' }),
            codeMirrorPlugin({
              codeBlockLanguages,
            }),
            imagePlugin({ imageUploadHandler }),
            tablePlugin(),
            thematicBreakPlugin(),
            frontmatterPlugin(),
            diffSourcePlugin({ viewMode: 'rich-text', diffMarkdown: 'boo' }),
            markdownShortcutPlugin(),
          ]}
        />

        {mode === 'desktop' && (
          <DesktopEditorFooter
            onImportMarkdown={handleImportMarkdown}
            onSubmit={handleSubmit}
          />
        )}

        {dragging && <DragIndicator />}
        {uploading && <UploadIndicator />}
      </div>
    </div>
  );
});
