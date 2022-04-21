/* @jsx m */

import m from 'mithril';

import 'components/component_kit/cw_text.scss';

import { ComponentType } from './types';

type FontStyle = 'regular' | 'semi-bold' | 'bold' | 'black' | 'italic';
type FontType = 'd1' | 'd2' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'b1' | 'b2';

type TextAttrs = {
  disabled?: boolean;
  fontStyle: FontStyle;
  noWrap?: boolean;
  type: FontType;
};

export const getTextClasses = (
  componentType: string,
  styleAttrs: TextAttrs
): string =>
  `${componentType} ${Object.entries(styleAttrs)
    .filter(([key, value]) => key && value)
    .map(([key, value]) =>
      typeof value === 'boolean' ? (value ? key.toString() : null) : value
    )
    .join(' ')}`;

export class CWText implements m.ClassComponent<TextAttrs> {
  view(vnode) {
    const {
      disabled = false,
      fontStyle = 'regular',
      noWrap = true,
      type,
    } = vnode.attrs;

    return (
      <div
        class={getTextClasses(ComponentType.Text, {
          type,
          fontStyle,
          disabled,
          noWrap,
        })}
      >
        {vnode.children}
      </div>
    );
  }
}
