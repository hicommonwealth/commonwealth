import { $createHeadingNode } from '@lexical/rich-text';
import { convertSelectionToNode$, usePublisher } from 'commonwealth-mdxeditor';
import React from 'react';
import { BlockButton } from 'views/components/Editor/toolbars/BlockButton';
import { DEFAULT_ICON_SIZE } from 'views/components/Editor/utils/iconComponentFor';
import { CWIcon } from 'views/components/component_kit/cw_icons/cw_icon';

export type HeadingButtonProps = {
  headingTag: 'h1' | 'h2' | 'h3';
};

export const HeadingButton = (props: HeadingButtonProps) => {
  const { headingTag } = props;

  const convertSelectionToNode = usePublisher(convertSelectionToNode$);

  return (
    <BlockButton
      addTitle={'Change to ' + headingTag}
      removeTitle={'Remove ' + headingTag}
      blockType={props.headingTag}
      onClick={() => convertSelectionToNode(() => $createHeadingNode('h1'))}
    >
      <CWIcon iconName={headingTag} iconSize={DEFAULT_ICON_SIZE} />
    </BlockButton>
  );
};
