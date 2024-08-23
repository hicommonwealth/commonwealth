import {
  BlockTypeSelect,
  BoldItalicUnderlineToggles,
  CreateLink,
  InsertImage,
  ListsToggle,
  Separator,
} from 'commonwealth-mdxeditor';
import React from 'react';

export const ToolbarForMobile = () => {
  return (
    <>
      <div className="mdxeditor-block-type-select">
        <BlockTypeSelect />
      </div>
      {/*<UndoRedo />*/}
      <BoldItalicUnderlineToggles />
      <CreateLink />
      <ListsToggle />
      <Separator />
      <InsertImage />
      <div
        style={{
          justifyContent: 'flex-end',
          flexGrow: 1,
          display: 'flex',
        }}
      >
        <button>➤</button>
      </div>
    </>
  );
};
