import React from 'react';
import { BlockButton } from 'views/components/MarkdownEditor/toolbars/BlockButton';
import { DEFAULT_ICON_SIZE } from 'views/components/MarkdownEditor/utils/iconComponentFor';
import { CWIcon } from 'views/components/component_kit/cw_icons/cw_icon';

export type HeadingButtonProps = Readonly<{
  headingTag: 'h1' | 'h2' | 'h3';
}>;

export const HeadingButton = (props: HeadingButtonProps) => {
  const { headingTag } = props;

  return (
    <BlockButton
      addTitle={`Change to ${headingTag}`}
      removeTitle={`Remove ${headingTag}`}
      blockType={headingTag}
    >
      <CWIcon iconName={headingTag} iconSize={DEFAULT_ICON_SIZE} />
    </BlockButton>
  );
};
