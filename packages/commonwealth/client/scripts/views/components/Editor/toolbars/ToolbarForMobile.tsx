import {
  BlockTypeSelect,
  BoldItalicUnderlineToggles,
  CreateLink,
  InsertImage,
  ListsToggle,
  Separator,
} from 'commonwealth-mdxeditor';
import React from 'react';

import './ToolbarForMobile.scss';

type ToolbarForMobileProps = Readonly<{
  onSubmit?: () => void;
}>;

export const ToolbarForMobile = (props: ToolbarForMobileProps) => {
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
      <InsertImage />
      <div className="end">
        <button onClick={() => props.onSubmit?.()}>➤</button>
      </div>
    </div>
  );
};
