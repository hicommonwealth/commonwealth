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

export const ToolbarForMobile = () => {
  return (
    <>
      <div className="mdxeditor-block-type-select ToolbarForMobile">
        <BlockTypeSelect />
      </div>
      {/*<UndoRedo />*/}
      <BoldItalicUnderlineToggles />
      <CreateLink />
      <ListsToggle />
      <Separator />
      <InsertImage />
      <div className="end">
        <button>➤</button>
      </div>
    </>
  );
};
