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

import './ToolbarForDesktop.scss';

export const ToolbarForDesktop = () => {
  return (
    <div className="ToolbarForDesktop">
      <div className="mdxeditor-block-type-select">
        <BlockTypeSelect />
      </div>
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
    </div>
  );
};
