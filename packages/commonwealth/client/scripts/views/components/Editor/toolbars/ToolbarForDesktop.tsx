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
import { HeadingButton } from 'views/components/Editor/toolbars/HeadingButton';
import { QuoteButton } from 'views/components/Editor/toolbars/QuoteButton';
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
                <HeadingButton headingTag="h1" />
                <HeadingButton headingTag="h2" />
                <HeadingButton headingTag="h3" />
                <Separator />
                <BoldItalicUnderlineToggles />
                <Separator />
                <StrikeThroughSupSubToggles />
                <Separator />
                <Separator />
                <CreateLink />
                <InsertImage />
                <InsertCodeBlock />
                <QuoteButton />
                <ListsToggle />
                <InsertTable />
              </>
            ),
          },
        ]}
      />
    </div>
  );
};
