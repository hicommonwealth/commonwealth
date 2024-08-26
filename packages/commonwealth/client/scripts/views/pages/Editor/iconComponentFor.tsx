import {
  Code,
  ListChecks,
  ListDashes,
  ListNumbers,
  Table,
  TextB,
  TextItalic,
  TextStrikethrough,
  TextSubscript,
  TextSuperscript,
  TextUnderline,
} from '@phosphor-icons/react';
import { IconKey, defaultSvgIcons } from 'commonwealth-mdxeditor';
import React from 'react';

const DEFAULT_ICON_SIZE = 22;

export const iconComponentFor = (name: IconKey) => {
  // 'undo' | 'redo' | 'format_bold' | 'format_italic' |
  // 'format_underlined' | 'code' | 'strikeThrough' | 'superscript' |
  // 'subscript' | 'format_list_bulleted' | 'format_list_numbered' |
  // 'format_list_checked' | 'link' | 'add_photo' | 'table' |
  // 'horizontal_rule' | 'frontmatter' | 'frame_source' |
  // 'arrow_drop_down' | 'admonition' | 'sandpack' | 'rich_text' |
  // 'difference' | 'markdown' | 'open_in_new' | 'link_off' | 'edit' |
  // 'content_copy' | 'more_horiz' | 'more_vert' | 'close' | 'settings' |
  // 'delete_big' | 'delete_small' | 'format_align_center' |
  // 'format_align_left' | 'format_align_right' | 'add_row' | 'add_column'
  // | 'insert_col_left' | 'insert_row_above' | 'insert_row_below' |
  // 'insert_col_right' | 'check';

  switch (name) {
    case 'format_bold':
      return <TextB size={DEFAULT_ICON_SIZE} />;
    case 'format_italic':
      return <TextItalic size={DEFAULT_ICON_SIZE} />;
    case 'format_underlined':
      return <TextUnderline size={DEFAULT_ICON_SIZE} />;
    case 'strikeThrough':
      return <TextStrikethrough size={DEFAULT_ICON_SIZE} />;
    case 'superscript':
      return <TextSuperscript size={DEFAULT_ICON_SIZE} />;
    case 'subscript':
      return <TextSubscript size={DEFAULT_ICON_SIZE} />;
    case 'format_list_bulleted':
      return <ListDashes size={DEFAULT_ICON_SIZE} />;
    case 'format_list_numbered':
      return <ListNumbers size={DEFAULT_ICON_SIZE} />;
    case 'format_list_checked':
      return <ListChecks size={DEFAULT_ICON_SIZE} />;
    case 'frame_source':
    case 'code':
      return <Code size={DEFAULT_ICON_SIZE} />;
    case 'table':
      return <Table size={DEFAULT_ICON_SIZE + 2} />;

    default:
      return defaultSvgIcons[name];
  }
};
