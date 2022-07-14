/* @jsx m */

import m from 'mithril';

import 'components/component_kit/cw_text.scss';

import { ComponentType } from './types';
import { getClasses } from './helpers';

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
  className?: string;
  disabled?: boolean;
  fontStyle?: FontStyle;
  fontWeight: FontWeight;
  isCentered?: boolean;
  noWrap?: boolean; // parent must be flex container and have definite width for this to work
  title?: string;
  type: FontType;
};

const getFontWeight = (type: FontType) =>
  type === 'buttonSm' || type === 'buttonLg' ? 'semiBold' : 'regular';

export class CWText implements m.ClassComponent<TextAttrs> {
  view(vnode) {
    const {
      className,
      disabled = false,
      isCentered,
      fontStyle,
      noWrap = false,
      title,
      type = 'b1',
      fontWeight = getFontWeight(type),
    } = vnode.attrs;

    return (
      <div
        class={getClasses<TextAttrs>(
          {
            type,
            fontWeight,
            disabled,
            fontStyle,
            noWrap,
            isCentered,
            className,
          },
          ComponentType.Text
        )}
        title={title}
      >
        {vnode.children}
      </div>
    );
  }
}
