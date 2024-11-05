import { $createHeadingNode, $createQuoteNode } from '@lexical/rich-text';
import clsx from 'clsx';
import {
  convertSelectionToNode$,
  currentBlockType$,
  useCellValue,
  usePublisher,
} from 'commonwealth-mdxeditor';
import { $createParagraphNode } from 'lexical';
import React, { useCallback } from 'react';
import { EditorTooltip } from 'views/components/MarkdownEditor/toolbars/EditorTooltip';
import CWIconButton from 'views/components/component_kit/new_designs/CWIconButton';
import './HeadingButton.scss';

export type HeadingButtonProps = Readonly<{
  blockType: 'h1' | 'h2' | 'h3' | 'quote' | 'p';
  onClick?: (event: React.MouseEvent<HTMLElement, MouseEvent>) => void;
}>;

export const HeadingButton = (props: HeadingButtonProps) => {
  const { blockType, onClick } = props;

  const currentBlockType = useCellValue(currentBlockType$);
  const convertSelectionToNode = usePublisher(convertSelectionToNode$);

  const active = currentBlockType === blockType;

  const toggleFormat = useCallback(
    (event: React.MouseEvent<HTMLElement, MouseEvent>) => {
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

      onClick?.(event);
    },
    [active, blockType, convertSelectionToNode, onClick],
  );

  return (
    <EditorTooltip
      content={`Change to ${blockType}`}
      renderTrigger={(handleInteraction) => (
        <CWIconButton
          className={clsx({ HeadingButtonActive: active })}
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
