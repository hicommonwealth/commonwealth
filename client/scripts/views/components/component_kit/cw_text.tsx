/* @jsx m */

import m from 'mithril';

import 'components/component_kit/cw_text.scss';

import { ComponentType } from './types';

type BodyTextAttrs = {
  fontStyle: 'regular' | 'bold' | 'italic';
  type: 'body-01' | 'body-02';
};

export class CWBodyText implements m.ClassComponent<BodyTextAttrs> {
  view(vnode) {
    const { fontStyle = 'regular', type = 'body-01' } = vnode.attrs;

    return (
      <div class={`${ComponentType.BodyText} ${type} ${fontStyle}`}>
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
};

export class CWHeadingText implements m.ClassComponent<HeadingTextAttrs> {
  view(vnode) {
    const { fontStyle = 'medium', type = 'heading-01' } = vnode.attrs;

    return (
      <div class={`${ComponentType.HeadingText} ${type} ${fontStyle}`}>
        {vnode.children}
      </div>
    );
  }
}

type DisplayTextAttrs = {
  fontStyle: 'semi-bold' | 'bold' | 'black';
  type: 'display-01' | 'display-02';
};

export class CWDisplayText implements m.ClassComponent<DisplayTextAttrs> {
  view(vnode) {
    const { fontStyle = 'semi-bold', type = 'display-01' } = vnode.attrs;

    return (
      <div class={`${ComponentType.DisplayText} ${type} ${fontStyle}`}>
        {vnode.children}
      </div>
    );
  }
}
