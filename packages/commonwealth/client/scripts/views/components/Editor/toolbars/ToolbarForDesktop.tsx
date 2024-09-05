import {
  BlockTypeSelect,
  BoldItalicUnderlineToggles,
  CreateLink,
  InsertCodeBlock,
  InsertImage,
  InsertTable,
  ListsToggle,
  Separator,
  StrikeThroughSupSubToggles,
} from 'commonwealth-mdxeditor';
import React from 'react';

export const ToolbarForDesktop = () => {
  return (
    <>
      <div className="mdxeditor-block-type-select">
        <BlockTypeSelect />
      </div>
      {/*<UndoRedo />*/}
      <BoldItalicUnderlineToggles />
      <Separator />
      <StrikeThroughSupSubToggles />
      <Separator />
      <ListsToggle />
      <Separator />
      <CreateLink />
      <InsertImage />
      <InsertCodeBlock />
      <InsertTable />
    </>
  );
};
