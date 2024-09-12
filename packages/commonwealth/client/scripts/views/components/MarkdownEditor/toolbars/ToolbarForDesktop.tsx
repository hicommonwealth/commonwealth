import {
  BoldItalicUnderlineToggles,
  ChangeCodeMirrorLanguage,
  ConditionalContents,
  CreateLink,
  InsertCodeBlock,
  InsertImage,
  InsertTable,
  ListsToggle,
  Separator,
  StrikeThroughSupSubToggles,
} from 'commonwealth-mdxeditor';
import React from 'react';
import { HeadingButton } from 'views/components/MarkdownEditor/toolbars/HeadingButton';
import { QuoteButton } from 'views/components/MarkdownEditor/toolbars/QuoteButton';
import './ToolbarForDesktop.scss';

export const ToolbarForDesktop = () => {
  return (
    <div className="ToolbarForDesktop">
      <ConditionalContents
        options={[
          {
            when: (editor) => editor?.editorType === 'codeblock',
            contents: () => <ChangeCodeMirrorLanguage />,
          },
          {
            fallback: () => (
              <>
                <div className="button-container">
                  <HeadingButton headingTag="h1" />
                  <HeadingButton headingTag="h2" />
                  <HeadingButton headingTag="h3" />
                </div>

                <Separator />
                <BoldItalicUnderlineToggles />
                <Separator />

                <StrikeThroughSupSubToggles />

                <Separator />

                <ListsToggle />

                <Separator />

                <div className="button-container">
                  <CreateLink />
                  <InsertImage />
                  <InsertCodeBlock />
                  <QuoteButton />
                  <InsertTable />
                </div>
              </>
            ),
          },
        ]}
      />
    </div>
  );
};
