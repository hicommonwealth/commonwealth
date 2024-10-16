import { BlockType } from 'commonwealth-mdxeditor';
import React, { ReactNode } from 'react';
import { CWIcon } from 'views/components/component_kit/cw_icons/cw_icon';

export function blockTypeToIconName(blockType: BlockType): ReactNode {
  switch (blockType) {
    case 'paragraph':
      return 'P';
    case 'quote':
      return 'Q';
    case 'h1':
      return <CWIcon iconName="h1" />;
    case 'h2':
      return <CWIcon iconName="h2" />;
    case 'h3':
      return <CWIcon iconName="h3" weight="fill" />;
    case 'h4':
    case 'h5':
    case 'h6':
    case '':
      return '';
  }
}
