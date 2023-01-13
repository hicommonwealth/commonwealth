/* @jsx m */

import m from 'mithril';
import ClassComponent from 'class_component';

import 'components/linked_addresses.scss';

import { AddressInfo } from 'models';
import { formatAddressShort } from '../../helpers';
import { CWPopoverMenu } from './component_kit/cw_popover/cw_popover_menu';
import { CWIconButton } from './component_kit/cw_icon_button';

type AddressAttrs = {
  address: string;
}

type LinkedAddressesAttrs = {
  addresses: AddressInfo[];
};

class Address extends ClassComponent<AddressAttrs> {
  view (vnode: m.Vnode<AddressAttrs>) {
    const { address } = vnode.attrs;

    return (
      <div className="AddressContainer">
      <div className="address">
          {formatAddressShort(address)}

      </div>
      <CWPopoverMenu
          menuItems={[
            {
              label: 'Move',
              iconLeft: 'externalLink',
              onclick: () => {} // Implement Move Address
            },
            {
              label: 'Delete',
              iconLeft: 'trash',
              onclick: () => {} // Implement Delete Address
            },
          ]}
          trigger={<CWIconButton iconName="dotsVertical" />}
        />
      </div>
    );
  }
}

export class LinkedAddresses extends ClassComponent<LinkedAddressesAttrs> {
  view(vnode: m.Vnode<LinkedAddressesAttrs>) {
    const { addresses } = vnode.attrs;

    return (
      <div className="LinkedAddresses">
        {addresses.map((address) => {
          return <Address address={address.address} />
        })}
      </div>
    );
  }
}
