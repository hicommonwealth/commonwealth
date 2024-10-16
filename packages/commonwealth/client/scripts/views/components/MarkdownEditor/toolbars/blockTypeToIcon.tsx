import { BlockType } from 'commonwealth-mdxeditor';
import React, { ReactNode } from 'react';
import { CWIcon } from 'views/components/component_kit/cw_icons/cw_icon';

export function blockTypeToIcon(blockType: BlockType): ReactNode {
  switch (blockType) {
    case 'paragraph':
      return <CWIcon iconName="p" />;
    case 'quote':
      return <CWIcon iconName="q" />;
    case 'h1':
      return <CWIcon iconName="h1" />;
    case 'h2':
      return <CWIcon iconName="h2" />;
    case 'h3':
      return <CWIcon iconName="h3" />;
    case 'h4':
    case 'h5':
    case 'h6':
    case '':
      return null;
  }
}
