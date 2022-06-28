/* @jsx m */

import m from 'mithril';

import 'pages/login/login_address.scss';

import { CWText } from '../../components/component_kit/cw_text';

export class LoginAddress implements m.ClassComponent<{ address: string }> {
  view(vnode) {
    const { address } = vnode.attrs;
    return (
      <div class="LoginAddress">
        <CWText type="caption">{address}</CWText>
      </div>
    );
  }
}
