/* @jsx m */

import m from 'mithril';
import 'components/component_kit/icons.scss';

export enum IconSize {
  'SM' = '14x14',
  'MD' = '20x20',
  'LG' = '28x28',
}

export enum IconType {
  Primary = 'primary',
  Secondary = 'secondary',
}

export type IconAttrs = {
  size?: IconSize;
  iconType: IconType;
  disabled?: boolean;
};

const appendTags = (attrs) => {
  const { iconType, disabled, size } = attrs;
  let tag = `svg.Icon`;
  if (disabled) tag += '.disabled';
  else if (iconType === IconType.Primary) tag += '.primary';
  else if (iconType === IconType.Secondary) tag += '.secondary';
  if (size === IconSize.SM) tag += '.sm';
  if (size === IconSize.MD) tag += '.md';
  if (size === IconSize.LG) tag += '.lg';
  return tag;
};

export const CWIcon: m.Component<IconAttrs> = {
  view: (vnode) => {
    return m(
      appendTags(vnode.attrs),
      {
        width: '17',
        height: '16',
        fill: 'none',
      },
      [
        m('path', {
          d: 'm14.036 3.671-6.464 7.66-6.465-7.66',
          'stroke-width': '2',
          'stroke-linecap': 'round',
        }),
      ]
    );
  },
};
