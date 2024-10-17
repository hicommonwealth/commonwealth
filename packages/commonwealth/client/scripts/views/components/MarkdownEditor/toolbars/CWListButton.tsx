import {
  applyListType$,
  currentListType$,
  useCellValues,
  usePublisher,
} from 'commonwealth-mdxeditor';
import React, { useCallback } from 'react';
import CWIconButton from 'views/components/component_kit/new_designs/CWIconButton';
import { CWTooltip } from 'views/components/component_kit/new_designs/CWTooltip';
import './CWListButton.scss';

export type ListType = 'number' | 'bullet' | 'check';

export type CWListButtonProps = Readonly<{
  listType: ListType;
  onClick?: (event: React.MouseEvent<HTMLElement, MouseEvent>) => void;
}>;

function listTypeToIconName(listType: ListType) {
  switch (listType) {
    case 'number':
      return 'listNumbers';
    case 'bullet':
      return 'listDashes';
    case 'check':
      return 'listChecks';
  }
}

export const CWListButton = (props: CWListButtonProps) => {
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
    <CWTooltip
      content={`Change to ${listType} list`}
      renderTrigger={(handleInteraction) => (
        <CWIconButton
          className={active ? 'CWListButtonActive' : ''}
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
