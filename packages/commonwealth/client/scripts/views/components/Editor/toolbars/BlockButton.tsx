import {
  BlockType,
  ToggleSingleGroupWithItem,
  currentBlockType$,
  useCellValue,
} from 'commonwealth-mdxeditor';
import React, { ReactNode } from 'react';

export type BlockButtonProps = Readonly<{
  blockType: BlockType;
  addTitle: string;
  removeTitle: string;
  onClick: () => void;
  children: ReactNode;
}>;

export const BlockButton = (props: BlockButtonProps) => {
  const { blockType, removeTitle, addTitle, onClick } = props;

  const currentBlockType = useCellValue(currentBlockType$);

  const active = currentBlockType === blockType;

  return (
    <ToggleSingleGroupWithItem
      title={active ? removeTitle : addTitle}
      on={active}
      onValueChange={onClick}
    >
      {props.children}
    </ToggleSingleGroupWithItem>
  );
};
