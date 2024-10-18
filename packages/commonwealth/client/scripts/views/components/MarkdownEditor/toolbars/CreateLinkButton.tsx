import { openLinkEditDialog$, usePublisher } from 'commonwealth-mdxeditor';
import React, { useCallback } from 'react';
import CWIconButton from 'views/components/component_kit/new_designs/CWIconButton';
import { CWTooltip } from 'views/components/component_kit/new_designs/CWTooltip';
import './HeadingButton.scss';

export type CWCreateLinkButtonProps = Readonly<{
  onClick?: (event: React.MouseEvent<HTMLElement, MouseEvent>) => void;
}>;

export const CreateLinkButton = (props: CWCreateLinkButtonProps) => {
  const { onClick } = props;
  const openLinkDialog = usePublisher(openLinkEditDialog$);

  const handleClick = useCallback(
    (event: React.MouseEvent<HTMLElement, MouseEvent>) => {
      openLinkDialog();
      onClick?.(event);
    },
    [onClick, openLinkDialog],
  );

  return (
    <CWTooltip
      content="Create link"
      renderTrigger={(handleInteraction) => (
        <CWIconButton
          buttonSize="lg"
          iconName="linkPhosphor"
          onMouseEnter={handleInteraction}
          onMouseLeave={handleInteraction}
          onClick={handleClick}
        />
      )}
    />
  );
};
