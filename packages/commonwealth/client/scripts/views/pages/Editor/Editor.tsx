import {
  BlockTypeSelect,
  BoldItalicUnderlineToggles,
  CodeBlockEditorDescriptor,
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
  useCodeBlockEditorContext,
} from 'commonwealth-mdxeditor';
import React from 'react';

import './Editor.scss';

import 'commonwealth-mdxeditor/style.css';

import markdown from './markdown.md?raw';

const PlainTextCodeEditorDescriptor: CodeBlockEditorDescriptor = {
  match: () => true,
  priority: 0,
  Editor: (props) => {
    const cb = useCodeBlockEditorContext();
    return (
      <div
        onKeyDown={(e) => {
          e.nativeEvent.stopImmediatePropagation();
        }}
      >
        <textarea
          rows={3}
          cols={20}
          defaultValue={props.code}
          onChange={(e) => {
            cb.setCode(e.target.value);
          }}
        />
      </div>
    );
  },
};

export const Editor = () => {
  return (
    <MDXEditor
      markdown={markdown}
      translation={(key, defaultValue, interpolations) => {
        console.log(`${key}=${defaultValue}`);
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
        imagePlugin(),
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
