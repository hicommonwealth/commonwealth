import React from 'react';
import { BlockSelectorButton } from 'views/components/MarkdownEditor/toolbars/BlockSelectorButton';
import './NewToolbar.scss';

export const NewDesktopToolbar = () => {
  return (
    <div className="NewToolbar">
      <BlockSelectorButton />
    </div>
  );
};
