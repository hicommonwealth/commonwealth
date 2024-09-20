import { defaultSvgIcons, IconKey } from 'commonwealth-mdxeditor';
import React from 'react';
import { IconSize } from 'views/components/component_kit/cw_icons/types';
import { CWIcon } from '../../component_kit/cw_icons/cw_icon';

export const DEFAULT_ICON_SIZE: IconSize = 'medium';

export const iconComponentFor = (name: IconKey) => {
  // to add new custom icons, just jump to the IconKey symbol name, then
  // implement one of the icons below.
  switch (name) {
    case 'format_bold':
      return <CWIcon iconName="bold" iconSize={DEFAULT_ICON_SIZE} />;
    case 'format_italic':
      return <CWIcon iconName="italic" iconSize={DEFAULT_ICON_SIZE} />;
    case 'format_underlined':
      return <CWIcon iconName="underline" iconSize={DEFAULT_ICON_SIZE} />;
    case 'strikeThrough':
      return <CWIcon iconName="strikethrough" iconSize={DEFAULT_ICON_SIZE} />;
    case 'superscript':
      return <CWIcon iconName="superscript" iconSize={DEFAULT_ICON_SIZE} />;
    case 'subscript':
      return <CWIcon iconName="subscript" iconSize={DEFAULT_ICON_SIZE} />;
    case 'format_list_bulleted':
      return <CWIcon iconName="listDashes" iconSize={DEFAULT_ICON_SIZE} />;
    case 'format_list_numbered':
      return <CWIcon iconName="listNumbers" iconSize={DEFAULT_ICON_SIZE} />;
    case 'format_list_checked':
      return <CWIcon iconName="listChecks" iconSize={DEFAULT_ICON_SIZE} />;
    case 'frame_source':
    case 'code':
      return <CWIcon iconName="code" iconSize={DEFAULT_ICON_SIZE} />;
    case 'table':
      return <CWIcon iconName="table" iconSize={DEFAULT_ICON_SIZE} />;

    default:
      return defaultSvgIcons[name];
  }
};
