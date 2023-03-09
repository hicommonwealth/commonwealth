/* @jsx m */

import ClassComponent from 'class_component';

import 'components/component_kit/cw_label.scss';
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import m from 'mithril';
import { CWText } from './cw_text';

import { ComponentType } from './types';

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
