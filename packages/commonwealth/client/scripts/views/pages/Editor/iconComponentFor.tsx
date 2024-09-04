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
  // to add new custom icons, just jump to the IconKey symbol name, then
  // implement one of the icons below.
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
