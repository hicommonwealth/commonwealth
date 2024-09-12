import { $createHeadingNode, $createQuoteNode } from '@lexical/rich-text';
import {
  ToggleSingleGroupWithItem,
  convertSelectionToNode$,
  currentBlockType$,
  useCellValue,
  usePublisher,
} from 'commonwealth-mdxeditor';
import { $createParagraphNode } from 'lexical';
import React, { ReactNode, useCallback } from 'react';

export type BlockButtonProps = Readonly<{
  blockType: 'h1' | 'h2' | 'h3' | 'quote';
  addTitle: string;
  removeTitle: string;
  children: ReactNode;
}>;

export const BlockButton = (props: BlockButtonProps) => {
  const { blockType, removeTitle, addTitle, children } = props;

  const currentBlockType = useCellValue(currentBlockType$);
  const convertSelectionToNode = usePublisher(convertSelectionToNode$);

  const active = currentBlockType === blockType;

  const toggleFormat = useCallback(() => {
    if (!active) {
      switch (blockType) {
        case 'h1':
        case 'h2':
        case 'h3':
          convertSelectionToNode(() => $createHeadingNode(blockType));
          break;
        case 'quote':
          convertSelectionToNode(() => $createQuoteNode());
          break;
      }
    } else {
      convertSelectionToNode(() => $createParagraphNode());
    }
  }, [active, blockType, convertSelectionToNode]);

  return (
    <ToggleSingleGroupWithItem
      title={active ? removeTitle : addTitle}
      on={active}
      onValueChange={toggleFormat}
    >
      {children}
    </ToggleSingleGroupWithItem>
  );
};
