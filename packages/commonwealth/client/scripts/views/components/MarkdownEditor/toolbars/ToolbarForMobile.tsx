import {
  IS_BOLD,
  IS_ITALIC,
  linkDialogState$,
  Separator,
  useCellValues,
} from 'commonwealth-mdxeditor';
import React, { ReactNode, useCallback } from 'react';

import { CustomLinkDialogForMobile } from 'views/components/MarkdownEditor/customLinkDialog/CustomLinkDialogForMobile';
import { BlockSelectorButton } from 'views/components/MarkdownEditor/toolbars/BlockSelectorButton';
import { CreateLinkButton } from 'views/components/MarkdownEditor/toolbars/CreateLinkButton';
import { FormatButton } from 'views/components/MarkdownEditor/toolbars/FormatButton';
import { HeadingButton } from 'views/components/MarkdownEditor/toolbars/HeadingButton';
import { ImageButton } from 'views/components/MarkdownEditor/toolbars/ImageButton';
import { ListButton } from 'views/components/MarkdownEditor/toolbars/ListButton';
import { MobileOverflowButton } from 'views/components/MarkdownEditor/toolbars/MobileOverflowButton';
import './ToolbarForMobile.scss';

type ToolbarForMobileProps = Readonly<{
  SubmitButton?: () => ReactNode;
  focus: () => void;

  onImage: (file: File) => void;
}>;

export const ToolbarForMobile = (props: ToolbarForMobileProps) => {
  const { SubmitButton, focus, onImage } = props;

  const [linkDialogState] = useCellValues(linkDialogState$);

  const preventKeyboardDeactivation = useCallback(
    (event: React.MouseEvent) => {
      event.stopPropagation();

      if (focus) {
        focus();
      } else {
        console.warn('No focus');
      }
    },
    [focus],
  );

  if (linkDialogState.type !== 'inactive') {
    // do not use a toolbar when the link dialog is active.
    return <CustomLinkDialogForMobile />;
  }

  return (
    <div
      className="ToolbarForMobile"
      onMouseDown={preventKeyboardDeactivation}
      onPointerDown={preventKeyboardDeactivation}
      onMouseDownCapture={preventKeyboardDeactivation}
    >
      <div className="mdxeditor-block-type-select">
        <BlockSelectorButton focus={focus} />
      </div>

      <FormatButton format={IS_BOLD} formatName="bold" />
      <FormatButton format={IS_ITALIC} formatName="italic" />
      <CreateLinkButton />
      <HeadingButton blockType="quote" />
      <ListButton listType="bullet" />
      <ListButton listType="number" />

      <Separator />
      <ImageButton onImage={onImage} />
      <MobileOverflowButton focus={focus} />

      <div className="end">{SubmitButton && <SubmitButton />}</div>
    </div>
  );
};
