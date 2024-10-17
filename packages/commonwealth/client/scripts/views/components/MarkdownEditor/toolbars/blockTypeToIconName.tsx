import { BlockType } from 'commonwealth-mdxeditor';
import { IconName } from 'views/components/component_kit/cw_icons/cw_icon_lookup';

export function blockTypeToIconName(blockType: BlockType): IconName | null {
  switch (blockType) {
    case 'paragraph':
      return 'p';
    case 'quote':
      return 'q';
    case 'h1':
      return 'h1';
    case 'h2':
      return 'h2';
    case 'h3':
      return 'h3';
    case 'h4':
    case 'h5':
    case 'h6':
    case '':
      return null;
  }
}
