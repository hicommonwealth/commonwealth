/* @jsx m */

import m from 'mithril';

import 'components/component_kit/cw_address.scss';

import { CWText } from './cw_text';

export class CWAddress implements m.ClassComponent<{ address: string }> {
  view(vnode) {
    const { address } = vnode.attrs;
    return (
      <div class="Address">
        <CWText type="caption">{address}</CWText>
      </div>
    );
  }
}
