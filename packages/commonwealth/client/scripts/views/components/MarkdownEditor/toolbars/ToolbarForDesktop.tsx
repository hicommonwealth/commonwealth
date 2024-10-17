import {
  ChangeCodeMirrorLanguage,
  ConditionalContents,
  InsertCodeBlock,
  InsertTable,
  IS_BOLD,
  IS_ITALIC,
  IS_STRIKETHROUGH,
  IS_SUBSCRIPT,
  IS_SUPERSCRIPT,
  IS_UNDERLINE,
  ListsToggle,
  Separator,
} from 'commonwealth-mdxeditor';
import React from 'react';
import { CWCreateLinkButton } from 'views/components/MarkdownEditor/toolbars/CWCreateLinkButton';
import { CWFormatButton } from 'views/components/MarkdownEditor/toolbars/CWFormatButton';
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
                  <CWFormatButton format={IS_BOLD} formatName="bold" />
                  <CWFormatButton
                    format={IS_UNDERLINE}
                    formatName="underline"
                  />
                  <CWFormatButton format={IS_ITALIC} formatName="italic" />
                  <Separator />

                  <CWFormatButton
                    format={IS_STRIKETHROUGH}
                    formatName="strikethrough"
                  />

                  <CWFormatButton
                    format={IS_SUPERSCRIPT}
                    formatName="superscript"
                  />

                  <CWFormatButton
                    format={IS_SUBSCRIPT}
                    formatName="subscript"
                  />

                  <Separator />

                  <ListsToggle />

                  <Separator />

                  <div className="button-container">
                    <CWCreateLinkButton />
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
