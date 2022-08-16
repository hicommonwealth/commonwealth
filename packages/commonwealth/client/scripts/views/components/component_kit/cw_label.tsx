/* @jsx m */

import m from 'mithril';

import 'components/component_kit/cw_label.scss';

import { ComponentType } from './types';
import { CWText } from './cw_text';

type LabelAttrs = {
  label: string;
};

export class CWLabel implements m.ClassComponent<LabelAttrs> {
  view(vnode) {
    const { label } = vnode.attrs;
    return (
      <CWText type="caption" className={ComponentType.Label}>
        {label}
      </CWText>
    );
  }
}
