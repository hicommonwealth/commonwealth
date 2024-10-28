import { insertCodeBlock$, usePublisher } from 'commonwealth-mdxeditor';
import React, { useCallback } from 'react';
import { EditorTooltip } from 'views/components/MarkdownEditor/toolbars/EditorTooltip';
import CWIconButton from 'views/components/component_kit/new_designs/CWIconButton';
import './HeadingButton.scss';

export type CWInsertCodeBlockButtonProps = Readonly<{
  onClick?: (event: React.MouseEvent<HTMLElement, MouseEvent>) => void;
}>;

export const InsertCodeBlockButton = (props: CWInsertCodeBlockButtonProps) => {
  const { onClick } = props;
  const insertCodeBlock = usePublisher(insertCodeBlock$);

  const handleClick = useCallback(
    (event: React.MouseEvent<HTMLElement, MouseEvent>) => {
      insertCodeBlock({});
      onClick?.(event);
    },
    [onClick, insertCodeBlock],
  );

  return (
    <EditorTooltip
      content="Create code block"
      renderTrigger={(handleInteraction) => (
        <CWIconButton
          buttonSize="lg"
          iconName="code"
          onMouseEnter={handleInteraction}
          onMouseLeave={handleInteraction}
          onClick={handleClick}
        />
      )}
    />
  );
};
