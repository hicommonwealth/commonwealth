import React from 'react';
import { BlockButton } from 'views/components/Editor/toolbars/BlockButton';
import { DEFAULT_ICON_SIZE } from 'views/components/Editor/utils/iconComponentFor';
import { CWIcon } from 'views/components/component_kit/cw_icons/cw_icon';

export type HeadingButtonProps = {
  headingTag: 'h1' | 'h2' | 'h3';
};

export const HeadingButton = (props: HeadingButtonProps) => {
  const { headingTag } = props;

  return (
    <BlockButton
      addTitle={'Change to ' + headingTag}
      removeTitle={'Remove ' + headingTag}
      blockType={props.headingTag}
    >
      <CWIcon iconName={headingTag} iconSize={DEFAULT_ICON_SIZE} />
    </BlockButton>
  );
};
