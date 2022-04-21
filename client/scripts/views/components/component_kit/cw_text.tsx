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
  disabled?: boolean;
  fontStyle?: FontStyle;
  fontWeight: FontWeight;
  noWrap?: boolean;
  type: FontType;
};

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
        class={getClasses<TextAttrs>(
          {
            type,
            fontWeight,
            disabled,
            fontStyle,
            noWrap,
          },
          ComponentType.Text
        )}
      >
        {vnode.children}
      </div>
    );
  }
}
