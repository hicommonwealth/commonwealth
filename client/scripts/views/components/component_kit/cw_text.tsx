/* @jsx m */

import m from 'mithril';

import 'components/component_kit/cw_text.scss';

import { ComponentType } from './types';

type FontWeight =
  | 'regular'
  | 'medium'
  | 'semiBold'
  | 'bold'
  | 'black'
  | 'italic'
  | 'uppercase';

type FontStyle = 'italic' | 'uppercase';

type FontType =
  | 'd1'
  | 'd2'
  | 'h1'
  | 'h2'
  | 'h3'
  | 'h4'
  | 'h5'
  | 'b1'
  | 'b2'
  | 'caption'
  | 'buttonSm'
  | 'buttonLg';

type TextAttrs = {
  disabled?: boolean;
  fontStyle?: FontStyle;
  fontWeight: FontWeight;
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
      typeof value === 'boolean' ? (value ? key : null) : value
    )
    .join(' ')}`;

export class CWText implements m.ClassComponent<TextAttrs> {
  view(vnode) {
    const {
      disabled = false,
      fontStyle,
      fontWeight = 'regular',
      noWrap = true, // parent must be flex container for this to work
      type,
    } = vnode.attrs;

    return (
      <div
        class={getTextClasses(ComponentType.Text, {
          type,
          fontWeight,
          disabled,
          fontStyle,
          noWrap,
        })}
      >
        {vnode.children}
      </div>
    );
  }
}
