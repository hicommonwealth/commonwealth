import {
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
import { CWHeadingButton } from 'views/components/MarkdownEditor/toolbars/CWHeadingButton';
import { ImageButton } from 'views/components/MarkdownEditor/toolbars/ImageButton';
import { QuoteButton } from 'views/components/MarkdownEditor/toolbars/QuoteButton';
import './ToolbarForDesktop.scss';

type ToolbarForDesktopProps = Readonly<{
  onImage?: (file: File) => void;
  focus: () => void;
}>;

export const ToolbarForDesktop = (props: ToolbarForDesktopProps) => {
  const { onImage, focus } = props;

  return (
    <>
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
                    <CWHeadingButton blockType="h1" />
                    <CWHeadingButton blockType="h2" />
                    <CWHeadingButton blockType="h3" />
                  </div>

                  <Separator />
                  <CWHeadingButton blockType="bold" />
                  <CWHeadingButton blockType="underline" />
                  <CWHeadingButton blockType="italic" />
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
