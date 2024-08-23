import {
  BlockTypeSelect,
  BoldItalicUnderlineToggles,
  codeBlockPlugin,
  codeMirrorPlugin,
  CreateLink,
  diffSourcePlugin,
  frontmatterPlugin,
  headingsPlugin,
  imagePlugin,
  InsertImage,
  linkDialogPlugin,
  linkPlugin,
  listsPlugin,
  ListsToggle,
  markdownShortcutPlugin,
  MDXEditor,
  quotePlugin,
  Separator,
  tablePlugin,
  thematicBreakPlugin,
  toolbarPlugin,
} from 'commonwealth-mdxeditor';
import React, { useCallback } from 'react';

import './Editor.scss';

import 'commonwealth-mdxeditor/style.css';

import { SERVER_URL } from 'state/api/config';
import useUserStore from 'state/ui/user';
import { uploadFileToS3 } from 'views/components/react_quill_editor/utils';
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

export const Editor = () => {
  const imageUploadHandler = useImageUploadHandlerLocal();
  // const imageUploadHandler = useImageUploadHandlerS3();

  return (
    <MDXEditor
      markdown={supported}
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
          location: 'bottom',
          toolbarContents: () => (
            <>
              <div className="mdxeditor-block-type-select">
                <BlockTypeSelect />
              </div>
              {/*<UndoRedo />*/}
              <BoldItalicUnderlineToggles />
              <CreateLink />
              <ListsToggle />
              <Separator />
              <InsertImage />
              <div
                style={{
                  justifyContent: 'flex-end',
                  flexGrow: 1,
                  display: 'flex',
                }}
              >
                <button>➤</button>
              </div>
            </>
          ),
        }),
        listsPlugin(),
        quotePlugin(),
        headingsPlugin(),
        linkPlugin(),
        linkDialogPlugin(),
        codeBlockPlugin({ defaultCodeBlockLanguage: 'js' }),
        codeMirrorPlugin({
          codeBlockLanguages: { js: 'JavaScript', css: 'CSS' },
        }),
        imagePlugin({ imageUploadHandler }),
        tablePlugin(),
        thematicBreakPlugin(),
        frontmatterPlugin(),
        // codeMirrorPlugin(),
        // codeBlockPlugin({ defaultCodeBlockLanguage: 'txt' }),
        // sandpackPlugin({ sandpackConfig: virtuosoSampleSandpackConfig }),
        // codeMirrorPlugin({ codeBlockLanguages: { js: 'JavaScript', css: 'CSS', txt: 'text' } }),
        // directivesPlugin({ directiveDescriptors: [YoutubeDirectiveDescriptor, AdmonitionDirectiveDescriptor] }),
        diffSourcePlugin({ viewMode: 'rich-text', diffMarkdown: 'boo' }),
        markdownShortcutPlugin(),
      ]}
    />
  );
};
