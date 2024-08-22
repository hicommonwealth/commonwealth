import {
  BlockTypeSelect,
  BoldItalicUnderlineToggles,
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
import React from 'react';

import './Editor.scss';

export const Editor = () => {
  return (
    <MDXEditor
      markdown={'hello world'}
      translation={(key, defaultValue, interpolations) => {
        console.log(`${key}=${defaultValue}`);
        switch (key) {
          case 'toolbar.blockTypeSelect.placeholder':
            // show the default placeholder that's active here..
            return 'H1';
          case 'toolbar.blockTypes.heading':
            console.log('FIXME: ', { key, defaultValue, interpolations });

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
        imagePlugin(),
        tablePlugin(),
        thematicBreakPlugin(),
        frontmatterPlugin(),
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
