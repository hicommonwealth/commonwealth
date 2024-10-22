import React from 'react';
import { EditorTooltip } from 'views/components/MarkdownEditor/toolbars/EditorTooltip';
import { CWIconButton } from 'views/components/component_kit/cw_icon_button';

interface SaveButtonProps {
  readonly onClick: () => void;
}

export const SaveButton = (props: SaveButtonProps) => {
  return (
    <EditorTooltip
      content="Save"
      renderTrigger={(handleInteraction) => (
        <CWIconButton
          iconName="check"
          onClick={props.onClick}
          onMouseEnter={handleInteraction}
          onMouseLeave={handleInteraction}
        />
      )}
    />
  );
};
