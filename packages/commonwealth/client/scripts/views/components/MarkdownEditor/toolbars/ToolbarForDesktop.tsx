import {
  BoldItalicUnderlineToggles,
  ChangeCodeMirrorLanguage,
  ConditionalContents,
  CreateLink,
  InsertCodeBlock,
  InsertTable,
  ListsToggle,
  Separator,
  StrikeThroughSupSubToggles,
} from 'commonwealth-mdxeditor';
import React from 'react';
import { HeadingButton } from 'views/components/MarkdownEditor/toolbars/HeadingButton';
import { ImageButton } from 'views/components/MarkdownEditor/toolbars/ImageButton';
import { NewDesktopToolbar } from 'views/components/MarkdownEditor/toolbars/NewDesktopToolbar';
import { QuoteButton } from 'views/components/MarkdownEditor/toolbars/QuoteButton';
import './ToolbarForDesktop.scss';

type ToolbarForDesktopProps = Readonly<{
  onImage?: (file: File) => void;
}>;

export const ToolbarForDesktop = (props: ToolbarForDesktopProps) => {
  const { onImage } = props;

  return (
    <>
      <NewDesktopToolbar />
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
                    <ImageButton onImage={onImage} />
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
    </>
  );
};
