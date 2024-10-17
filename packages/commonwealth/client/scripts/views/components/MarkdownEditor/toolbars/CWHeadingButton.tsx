import { $createHeadingNode, $createQuoteNode } from '@lexical/rich-text';
import {
  applyFormat$,
  convertSelectionToNode$,
  currentBlockType$,
  useCellValue,
  usePublisher,
} from 'commonwealth-mdxeditor';
import { $createParagraphNode } from 'lexical';
import React, { useCallback } from 'react';
import CWIconButton from 'views/components/component_kit/new_designs/CWIconButton';
import { CWTooltip } from 'views/components/component_kit/new_designs/CWTooltip';
import './CWHeadingButton.scss';

export type HeadingButtonProps = Readonly<{
  blockType: 'h1' | 'h2' | 'h3' | 'quote' | 'p';
  onClick?: (event: React.MouseEvent<HTMLElement, MouseEvent>) => void;
}>;

export const CWHeadingButton = (props: HeadingButtonProps) => {
  const { blockType, onClick } = props;

  const currentBlockType = useCellValue(currentBlockType$);
  const convertSelectionToNode = usePublisher(convertSelectionToNode$);
  const applyFormat = usePublisher(applyFormat$);

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
    [active, applyFormat, blockType, convertSelectionToNode, onClick],
  );

  // TODO: there's a bug in handleInteraction here where it's not going away
  // TODO: same thing with onMouseLeave. It doesn't reliably seem to nuke
  // the tooltip

  return (
    <CWTooltip
      content={`Change to ${blockType.toUpperCase()}`}
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
