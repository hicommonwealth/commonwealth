import { $createHeadingNode, $createQuoteNode } from '@lexical/rich-text';
import {
  convertSelectionToNode$,
  currentBlockType$,
  useCellValue,
  usePublisher,
} from 'commonwealth-mdxeditor';
import { $createParagraphNode } from 'lexical';
import React, { useCallback } from 'react';
import CWIconButton from 'views/components/component_kit/new_designs/CWIconButton';
import { CWTooltip } from 'views/components/component_kit/new_designs/CWTooltip';

export type HeadingButtonProps = Readonly<{
  blockType: 'h1' | 'h2' | 'h3' | 'quote';
}>;

export const CWHeadingButton = (props: HeadingButtonProps) => {
  const { blockType } = props;

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
    <CWTooltip
      content={blockType}
      renderTrigger={(handleInteraction) => (
        <CWIconButton
          className={active ? 'CWHeadingButtonActive' : ''}
          buttonSize="lg"
          iconName={blockType}
          onMouseEnter={handleInteraction}
          onMouseLeave={handleInteraction}
          onClick={toggleFormat}
        />
      )}
    />
  );
};
