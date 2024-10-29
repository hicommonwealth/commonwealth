import {
  FORMAT,
  IS_BOLD,
  IS_CODE,
  IS_ITALIC,
  IS_STRIKETHROUGH,
  IS_SUBSCRIPT,
  IS_SUPERSCRIPT,
  IS_UNDERLINE,
} from 'commonwealth-mdxeditor';
import { IconName } from 'views/components/component_kit/cw_icons/cw_icon_lookup';

export function formatToIconName(format: FORMAT): IconName {
  switch (format) {
    case IS_BOLD:
      return 'bold';
    case IS_ITALIC:
      return 'italic';
    case IS_STRIKETHROUGH:
      return 'strikethrough';
    case IS_UNDERLINE:
      return 'underline';
    case IS_CODE:
      return 'code';
    case IS_SUBSCRIPT:
      return 'subscript';
    case IS_SUPERSCRIPT:
      return 'superscript';
    default:
      throw new Error('not supported');
  }
}
