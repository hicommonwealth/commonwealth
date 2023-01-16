/* @jsx m */

import m from 'mithril';
import ClassComponent from 'class_component';

import 'components/component_kit/cw_label.scss';

import { ComponentType } from './types';
import { CWText } from './cw_text';

type LabelAttrs = {
  label: string | m.Vnode;
};

export class CWLabel extends ClassComponent<LabelAttrs> {
  view(vnode: m.Vnode<LabelAttrs>) {
    const { label } = vnode.attrs;
    return (
      <CWText type="caption" className={ComponentType.Label}>
        {label}
      </CWText>
    );
  }
}
