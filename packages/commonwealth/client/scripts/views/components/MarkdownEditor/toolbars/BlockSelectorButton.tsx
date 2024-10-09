import { currentBlockType$, useCellValue } from 'commonwealth-mdxeditor';
import React from 'react';
import { CWHeadingButton } from 'views/components/MarkdownEditor/toolbars/CWHeadingButton';
import CWPopover, {
  usePopover,
} from 'views/components/component_kit/new_designs/CWPopover';

import './BlockSelectorButton.scss';

export const BlockSelectorButton = () => {
  const formattingPopoverProps = usePopover();

  const currentBlockType = useCellValue(currentBlockType$);

  return (
    <div className="BlockSelectorButton">
      <button onClick={formattingPopoverProps.handleInteraction}>
        {currentBlockType}
      </button>

      <CWPopover
        className="FormattingPopover"
        body={
          <div onMouseLeave={formattingPopoverProps.handleInteraction}>
            <CWHeadingButton blockType="h1" />
            <CWHeadingButton blockType="h2" />
            <CWHeadingButton blockType="h3" />
            <CWHeadingButton blockType="quote" />
          </div>
        }
        {...formattingPopoverProps}
      />
    </div>
  );
};
