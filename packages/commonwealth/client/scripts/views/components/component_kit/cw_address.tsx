/* @jsx m */

import ClassComponent from 'class_component';

import 'components/component_kit/cw_address.scss';
import m from 'mithril';

import { CWText } from './cw_text';
import { getClasses } from './helpers';

type AddressAttrs = {
  address: string;
  darkMode?: boolean;
};

export class CWAddress extends ClassComponent<AddressAttrs> {
  view(vnode: m.Vnode<AddressAttrs>) {
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
