import {
  ChangeCodeMirrorLanguage,
  ConditionalContents,
  IS_BOLD,
  IS_ITALIC,
  IS_STRIKETHROUGH,
  IS_SUBSCRIPT,
  IS_SUPERSCRIPT,
  IS_UNDERLINE,
  Separator,
} from 'commonwealth-mdxeditor';
import React from 'react';
import { CreateLinkButton } from 'views/components/MarkdownEditor/toolbars/CreateLinkButton';
import { FormatButton } from 'views/components/MarkdownEditor/toolbars/FormatButton';
import { HeadingButton } from 'views/components/MarkdownEditor/toolbars/HeadingButton';
import { ImageButton } from 'views/components/MarkdownEditor/toolbars/ImageButton';
import { InsertCodeBlockButton } from 'views/components/MarkdownEditor/toolbars/InsertCodeBlockButton';
import { ListButton } from 'views/components/MarkdownEditor/toolbars/ListButton';
import { TableButton } from 'views/components/MarkdownEditor/toolbars/TableButton';
import './ToolbarForDesktop.scss';

type ToolbarForDesktopProps = Readonly<{
  onImage?: (file: File) => void;
  focus: () => void;
}>;

export const ToolbarForDesktop = (props: ToolbarForDesktopProps) => {
  const { onImage } = props;

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
                    <HeadingButton blockType="h1" />
                    <HeadingButton blockType="h2" />
                    <HeadingButton blockType="h3" />
                  </div>

                  <Separator />
                  <FormatButton format={IS_BOLD} formatName="bold" />
                  <FormatButton format={IS_UNDERLINE} formatName="underline" />
                  <FormatButton format={IS_ITALIC} formatName="italic" />
                  <Separator />

                  <FormatButton
                    format={IS_STRIKETHROUGH}
                    formatName="strikethrough"
                  />

                  <FormatButton
                    format={IS_SUPERSCRIPT}
                    formatName="superscript"
                  />

                  <FormatButton format={IS_SUBSCRIPT} formatName="subscript" />

                  <Separator />

                  <ListButton listType="bullet" />
                  <ListButton listType="number" />
                  <ListButton listType="check" />

                  <Separator />

                  <div className="button-container">
                    <CreateLinkButton />
                    <ImageButton onImage={onImage} />
                    <InsertCodeBlockButton />
                    <HeadingButton blockType="quote" />
                    <TableButton />
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
