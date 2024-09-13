import {
  BlockTypeSelect,
  BoldItalicUnderlineToggles,
  CreateLink,
  ListsToggle,
  Separator,
} from 'commonwealth-mdxeditor';
import React from 'react';

import { ImageButton } from 'views/components/MarkdownEditor/toolbars/ImageButton';
import './ToolbarForMobile.scss';

type ToolbarForMobileProps = Readonly<{
  onSubmit?: () => void;
}>;

export const ToolbarForMobile = (props: ToolbarForMobileProps) => {
  const { onSubmit } = props;

  return (
    <div className="ToolbarForMobile">
      <div className="mdxeditor-block-type-select">
        <BlockTypeSelect />
      </div>
      {/*<UndoRedo />*/}
      <BoldItalicUnderlineToggles />
      <CreateLink />
      <ListsToggle />
      <Separator />
      <ImageButton />
      <div className="end">
        <button onClick={() => onSubmit?.()}>➤</button>
      </div>
    </div>
  );
};
