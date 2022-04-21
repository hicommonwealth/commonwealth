/* @jsx m */

import m from 'mithril';

import 'components/component_kit/cw_text.scss';

import { ComponentType } from './types';

type BaseTextAttrs = {
  //   color?: string; // not sure how to do this one using a scss color variable
  disabled?: boolean;
  noWrap?: boolean;
};

type BodyTextAttrs = {
  fontStyle: 'regular' | 'bold' | 'italic';
  type: 'body-01' | 'body-02';
} & BaseTextAttrs;

export class CWBodyText implements m.ClassComponent<BodyTextAttrs> {
  view(vnode) {
    const {
      disabled = false,
      fontStyle = 'regular',
      noWrap = true,
      type = 'body-01',
    } = vnode.attrs;

    return (
      <div
        class={`${ComponentType.BodyText} ${type} ${fontStyle} ${
          disabled ? 'disabled' : ''
        } ${noWrap ? 'no-wrap' : ''}`}
      >
        {vnode.children}
      </div>
    );
  }
}

type HeadingTextAttrs = {
  fontStyle: 'medium' | 'semi-bold' | 'bold';
  type:
    | 'heading-01'
    | 'heading-02'
    | 'heading-03'
    | 'heading-04'
    | 'heading-05';
} & BaseTextAttrs;

export class CWHeadingText implements m.ClassComponent<HeadingTextAttrs> {
  view(vnode) {
    const {
      disabled = false,
      fontStyle = 'medium',
      noWrap = true,
      type = 'heading-01',
    } = vnode.attrs;

    return (
      <div
        class={`${ComponentType.HeadingText} ${type} ${fontStyle} ${
          disabled ? 'disabled' : ''
        } ${noWrap ? 'no-wrap' : ''}`}
      >
        {vnode.children}
      </div>
    );
  }
}

type DisplayTextAttrs = {
  fontStyle: 'semi-bold' | 'bold' | 'black';
  type: 'display-01' | 'display-02';
} & BaseTextAttrs;

export class CWDisplayText implements m.ClassComponent<DisplayTextAttrs> {
  view(vnode) {
    const {
      disabled = false,
      fontStyle = 'semi-bold',
      noWrap = true,
      type = 'display-01',
    } = vnode.attrs;

    return (
      <div
        class={`${ComponentType.DisplayText} ${type} ${fontStyle} ${
          disabled ? 'disabled' : ''
        } ${noWrap ? 'no-wrap' : ''}`}
      >
        {vnode.children}
      </div>
    );
  }
}
