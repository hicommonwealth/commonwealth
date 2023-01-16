/* @jsx m */

import m from 'mithril';
import ClassComponent from 'class_component';

import 'components/linked_addresses.scss';

import app from 'state';
import { AddressInfo, NewProfile as Profile } from 'models';
import { formatAddressShort } from '../../helpers';
import { CWPopoverMenu } from './component_kit/cw_popover/cw_popover_menu';
import { CWIconButton } from './component_kit/cw_icon_button';
import { MoveAddressModal } from '../modals/move_address_modal';

type AddressAttrs = {
  profiles: Profile[];
  profile: Profile;
  address: string;
}

type LinkedAddressesAttrs = {
  profiles: Profile[];
  profile: Profile;
  addresses: AddressInfo[];
};

class Address extends ClassComponent<AddressAttrs> {
  view (vnode: m.Vnode<AddressAttrs>) {
    const { profiles, profile, address } = vnode.attrs;

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
              onclick: (e) => {
                e.preventDefault();
                app.modals.create({
                  modal: MoveAddressModal,
                  data: {
                    profile,
                    profiles,
                    address,
                  },
                  completeCallback: () => {
                    // call get profiles again to refresh?
                  },
                });
              }
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
    const { profiles, profile, addresses } = vnode.attrs;

    return (
      <div className="LinkedAddresses">
        {addresses.map((address) => {
          return <Address profiles={profiles} profile={profile} address={address.address} />
        })}
      </div>
    );
  }
}
