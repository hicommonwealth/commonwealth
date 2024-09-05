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
import React, { memo, useCallback, useRef, useState } from 'react';

import './Editor.scss';

import clsx from 'clsx';
import 'commonwealth-mdxeditor/style.css';
import { notifyError } from 'controllers/app/notifications';
import { DesktopEditorFooter } from 'views/pages/Editor/DesktopEditorFooter';
import { DragIndicator } from 'views/pages/Editor/indicators/DragIndicator';
import { UploadIndicator } from 'views/pages/Editor/indicators/UploadIndicator';
import { ToolbarForDesktop } from 'views/pages/Editor/toolbars/ToolbarForDesktop';
import { ToolbarForMobile } from 'views/pages/Editor/toolbars/ToolbarForMobile';
import { useEditorErrorHandler } from 'views/pages/Editor/useEditorErrorHandler';
import { useImageUploadHandler } from 'views/pages/Editor/useImageUploadHandler';
import { canAcceptFileForImport } from 'views/pages/Editor/utils/canAcceptFileForImport';
import { codeBlockLanguages } from 'views/pages/Editor/utils/codeBlockLanguages';
import { editorTranslator } from 'views/pages/Editor/utils/editorTranslator';
import { fileToText } from 'views/pages/Editor/utils/fileToText';
import { iconComponentFor } from 'views/pages/Editor/utils/iconComponentFor';
import supported from './markdown/supported.md?raw';

export type ImageURL = string;

export type EditorMode = 'desktop' | 'mobile';

export type ImageHandler = 'S3' | 'local';

type EditorProps = {
  readonly mode?: EditorMode;
  readonly placeholder?: string;
  readonly imageHandler?: ImageHandler;
};

export const Editor = memo(function Editor(props: EditorProps) {
  const errorHandler = useEditorErrorHandler();
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);

  const dragCounterRef = useRef(0);

  const mode = props.mode ?? 'desktop';
  const imageHandler: ImageHandler = props.imageHandler ?? 'S3';

  const placeholder = props.placeholder ?? 'Share your thoughts...';

  const mdxEditorRef = React.useRef<MDXEditorMethods>(null);

  const imageUploadHandlerDelegate = useImageUploadHandler(imageHandler);

  const imageUploadHandler = useCallback(
    async (file: File) => {
      try {
        // TODO:
        setUploading(true);
        return await imageUploadHandlerDelegate(file);
      } finally {
        setUploading(false);
      }
    },
    [imageUploadHandlerDelegate],
  );

  const handleFile = useCallback(async (file: File) => {
    if (!file.name.endsWith('.md')) {
      notifyError('Not a markdown file.');
      return;
    }

    const text = await fileToText(file);
    mdxEditorRef.current?.setMarkdown(text);
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

  const handleFiles = useCallback(async (files: FileList) => {
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
  }, []);

  const handleDropAsync = useCallback(
    async (event: React.DragEvent) => {
      try {
        const files = event.dataTransfer.files;

        if (files.length <= 0) {
          // for drag and drop... no files is an error.
          notifyError('No files given');
          return;
        }

        await handleFiles(files);
      } finally {
        setDragging(false);
        dragCounterRef.current = 0;
      }
    },
    [handleFiles],
  );

  // TODO: handle html files but I'm not sure about the correct way to handle it
  // because I have to convert to markdown.  This isn't really a typical use
  // case though
  const handleDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      handleDropAsync(event).catch(console.error);
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

  return (
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
        markdown={supported}
        placeholder={placeholder}
        iconComponentFor={iconComponentFor}
        translation={editorTranslator}
        plugins={[
          toolbarPlugin({
            location: mode === 'mobile' ? 'bottom' : 'top',
            toolbarContents: () =>
              mode === 'mobile' ? <ToolbarForMobile /> : <ToolbarForDesktop />,
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
        <DesktopEditorFooter onImportMarkdown={handleImportMarkdown} />
      )}

      {dragging && <DragIndicator />}
      {uploading && <UploadIndicator />}
    </div>
  );
});
