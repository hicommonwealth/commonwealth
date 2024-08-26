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
import React, { useCallback } from 'react';

import './Editor.scss';

import clsx from 'clsx';
import 'commonwealth-mdxeditor/style.css';
import { SERVER_URL } from 'state/api/config';
import useUserStore from 'state/ui/user';
import { uploadFileToS3 } from 'views/components/react_quill_editor/utils';
import { codeBlockLanguages } from 'views/pages/Editor/codeBlockLanguages';
import { DesktopEditorFooter } from 'views/pages/Editor/DesktopEditorFooter';
import { fileToText } from 'views/pages/Editor/fileToText';
import { iconComponentFor } from 'views/pages/Editor/iconComponentFor';
import { ToolbarForDesktop } from 'views/pages/Editor/ToolbarForDesktop';
import { ToolbarForMobile } from 'views/pages/Editor/ToolbarForMobile';
import { useEditorErrorHandler } from 'views/pages/Editor/useEditorErrorHandler';
import supported from './supported.md?raw';

type ImageURL = string;

function useImageUploadHandlerS3() {
  const user = useUserStore();

  return useCallback(async (file: File): Promise<ImageURL> => {
    const uploadedFileUrl = await uploadFileToS3(
      file,
      SERVER_URL,
      user.jwt || '',
    );
    return uploadedFileUrl;
  }, []);
}

/**
 * Just a basic local image handler that uses a file URL.
 */
function useImageUploadHandlerLocal() {
  return useCallback(async (file: File) => {
    return URL.createObjectURL(file);
  }, []);
}

type EditorMode = 'desktop' | 'mobile';

type EditorProps = {
  readonly mode?: EditorMode;
  readonly placeholder?: string;
};

export const Editor = (props: EditorProps) => {
  const imageUploadHandler = useImageUploadHandlerLocal();
  const errorHandler = useEditorErrorHandler();

  const mode = props.mode ?? 'desktop';
  // const mode = props.mode ?? 'mobile';

  const placeholder = props.placeholder ?? 'Share your thoughts...';

  const mdxEditorRef = React.useRef<MDXEditorMethods>(null);

  const handleFile = useCallback(async (file: File) => {
    const text = await fileToText(file);
    mdxEditorRef.current?.setMarkdown(text);
  }, []);

  // TODO: handle html but I'm not sure about the correct way to handle it
  // because I have to convert to markdown
  const handleDrop = useCallback(
    (event: React.DragEvent) => {
      async function doAsync() {
        console.log(event.dataTransfer.files.length);

        const nrFiles = event.dataTransfer.files.length;

        if (nrFiles === 1) {
          const type = event.dataTransfer.files[0].type;

          if (['text/markdown', 'text/plain'].includes(type)) {
            await handleFile(event.dataTransfer.files[0]);
          } else {
            // TODO: use a snackbar
            console.log('File not markdown');
          }
        }

        if (nrFiles <= 0) {
          // TODO: use a snackbar
          console.log('No files given');
          return;
        }

        if (nrFiles > 1) {
          // TODO: use a snackbar
          console.log('Too many files given');
          return;
        }
      }

      doAsync().catch(console.error);
    },
    [handleFile],
  );

  const handleImportMarkdown = useCallback(
    (file: File) => {
      async function doAsync() {
        await handleFile(file);
      }

      doAsync().catch(console.error);
    },
    [handleFile],
  );

  return (
    <div
      className={clsx(
        'mdxeditor-container',
        'mdxeditor-container-mode-' + mode,
      )}
      onDrop={handleDrop}
    >
      <MDXEditor
        onError={errorHandler}
        ref={mdxEditorRef}
        markdown={supported}
        placeholder={placeholder}
        iconComponentFor={iconComponentFor}
        translation={(key, defaultValue, interpolations) => {
          switch (key) {
            case 'toolbar.blockTypeSelect.placeholder':
              // show the default placeholder that's active here..
              return 'H1';
            case 'toolbar.blockTypes.heading':
              if (interpolations?.level) {
                // eslint-disable-next-line @typescript-eslint/restrict-plus-operands
                return 'H' + interpolations.level;
              }
              return 'H1';
            case 'toolbar.blockTypes.quote':
              return 'Q';
            case 'toolbar.blockTypes.paragraph':
              return 'P';
            default:
              return defaultValue;
          }
        }}
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
    </div>
  );
};
