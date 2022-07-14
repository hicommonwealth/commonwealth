/* @jsx m */

import m from 'mithril';

import 'components/component_kit/cw_address.scss';

import { CWText } from './cw_text';
import { getClasses } from './helpers';

type AddressAttrs = {
  address: string;
  darkMode?: boolean;
};

export class CWAddress implements m.ClassComponent<AddressAttrs> {
  view(vnode) {
    const { address, darkMode } = vnode.attrs;
    return (
      <div class={getClasses<{ darkMode?: boolean }>({ darkMode }, 'Address')}>
        <CWText type="caption" className="address-text">
          {address}
        </CWText>
      </div>
    );
  }
}
