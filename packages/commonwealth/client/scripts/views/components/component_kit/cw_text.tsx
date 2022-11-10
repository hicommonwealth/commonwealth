/* @jsx m */

import m from 'mithril';
import ClassComponent from 'class_component';

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
  | 'buttonLg'
  | 'buttonMini';

type TextStyleAttrs = {
  className?: string;
  disabled?: boolean;
  fontStyle?: FontStyle;
  fontWeight?: FontWeight;
  isCentered?: boolean;
  noWrap?: boolean; // parent must be flex container and have definite width for this to work
  type?: FontType;
};

type TextAttrs = {
  onclick?: () => void;
  title?: string;
} & TextStyleAttrs;

const getFontWeight = (type: FontType) => {
  if (type === 'buttonSm' || type === 'buttonLg') {
    return 'semiBold';
  } else if (type === 'buttonMini') {
    return 'medium';
  } else {
    return 'regular';
  }
};

export class CWText extends ClassComponent<TextAttrs> {
  view(vnode: m.Vnode<TextAttrs>) {
    const {
      className,
      disabled = false,
      isCentered,
      fontStyle,
      onclick,
      noWrap = false,
      title,
      type = 'b1',
      fontWeight = getFontWeight(type),
    } = vnode.attrs;

    return (
      <div
        class={getClasses<TextStyleAttrs & { onclick?: boolean }>(
          {
            type,
            fontWeight,
            disabled,
            fontStyle,
            noWrap,
            onclick: !!onclick,
            isCentered,
            className,
          },
          ComponentType.Text
        )}
        title={title}
        onclick={onclick}
      >
        {vnode.children}
      </div>
    );
  }
}
