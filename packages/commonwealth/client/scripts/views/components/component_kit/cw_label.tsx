/* @jsx jsx */


import { ClassComponent, ResultNode, render, setRoute, getRoute, getRouteParam, redraw, Component, jsx } from 'mithrilInterop';

import 'components/component_kit/cw_label.scss';

import { ComponentType } from './types';
import { CWText } from './cw_text';

type LabelAttrs = {
  label: string;
};

export class CWLabel extends ClassComponent<LabelAttrs> {
  view(vnode: ResultNode<LabelAttrs>) {
    const { label } = vnode.attrs;
    return (
      <CWText type="caption" className={ComponentType.Label}>
        {label}
      </CWText>
    );
  }
}
