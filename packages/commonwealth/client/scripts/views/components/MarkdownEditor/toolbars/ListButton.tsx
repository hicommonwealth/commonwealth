import clsx from 'clsx';
import {
  applyListType$,
  currentListType$,
  useCellValues,
  usePublisher,
} from 'commonwealth-mdxeditor';
import React, { useCallback } from 'react';
import { EditorTooltip } from 'views/components/MarkdownEditor/toolbars/EditorTooltip';
import { listTypeToIconName } from 'views/components/MarkdownEditor/toolbars/listTypeToIconName';
import CWIconButton from 'views/components/component_kit/new_designs/CWIconButton';
import './ListButton.scss';

export type ListType = 'number' | 'bullet' | 'check';

export type ListButtonProps = Readonly<{
  listType: ListType;
  onClick?: (event: React.MouseEvent<HTMLElement, MouseEvent>) => void;
}>;

export const ListButton = (props: ListButtonProps) => {
  const { listType, onClick } = props;

  const [currentListType] = useCellValues(currentListType$);

  const applyListType = usePublisher(applyListType$);

  const active = listType === currentListType;

  const handleClick = useCallback(
    (event: React.MouseEvent<HTMLElement, MouseEvent>) => {
      if (active) {
        applyListType('');
      } else {
        applyListType(listType);
      }
      onClick?.(event);
    },
    [active, applyListType, listType, onClick],
  );

  return (
    <EditorTooltip
      content={`Change to ${listType} list`}
      renderTrigger={(handleInteraction) => (
        <CWIconButton
          className={clsx({ ListButtonActive: active })}
          buttonSize="lg"
          iconName={listTypeToIconName(listType)}
          onMouseEnter={handleInteraction}
          onMouseLeave={handleInteraction}
          onClick={handleClick}
        />
      )}
    />
  );
};
