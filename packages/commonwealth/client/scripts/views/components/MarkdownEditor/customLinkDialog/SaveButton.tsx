import React from 'react';
import { IconButtonWithTooltip } from 'views/components/MarkdownEditor/customLinkDialog/IconButtonWithTooltip';

interface SaveButtonProps {
  readonly onClick: () => void;
}

export const SaveButton = (props: SaveButtonProps) => {
  const { onClick } = props;
  return (
    <IconButtonWithTooltip onClick={onClick} tooltip="Save" iconName="check" />
  );
};
