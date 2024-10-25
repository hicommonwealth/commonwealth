import React from 'react';
import { EditorTooltip } from 'views/components/MarkdownEditor/toolbars/EditorTooltip';
import { CWIconButton } from 'views/components/component_kit/cw_icon_button';
import { IconName } from 'views/components/component_kit/cw_icons/cw_icon_lookup';

interface IconButtonWithTooltipProps {
  readonly onClick: () => void;
  readonly tooltip: string;
  readonly iconName: IconName;
}

export const IconButtonWithTooltip = (props: IconButtonWithTooltipProps) => {
  const { onClick, tooltip, iconName } = props;
  return (
    <EditorTooltip
      content={tooltip}
      renderTrigger={(handleInteraction) => (
        <CWIconButton
          iconName={iconName}
          onClick={onClick}
          onMouseEnter={handleInteraction}
          onMouseLeave={handleInteraction}
        />
      )}
    />
  );
};
