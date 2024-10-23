import React from 'react';
import { BlockButton } from 'views/components/MarkdownEditor/toolbars/BlockButton';
import { DEFAULT_ICON_SIZE } from 'views/components/MarkdownEditor/utils/iconComponentFor';
import { CWIcon } from 'views/components/component_kit/cw_icons/cw_icon';

export const QuoteButton = () => {
  return (
    <BlockButton
      addTitle="Change to quote"
      removeTitle="Change back to paragraph."
      blockType="quote"
    >
      <CWIcon iconName="quotes" iconSize={DEFAULT_ICON_SIZE} />
    </BlockButton>
  );
};
