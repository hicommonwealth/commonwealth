/* @jsx m */
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import m from 'mithril';
import ClassComponent from 'class_component';

import 'components/linked_addresses.scss';

import app from 'state';
import type { AddressInfo, NewProfile as Profile } from 'models';
import { CWPopoverMenu } from './component_kit/cw_popover/cw_popover_menu';
import { CWIconButton } from './component_kit/cw_icon_button';
import { DeleteAddressModal } from '../modals/delete_address_modal';
import { CWTruncatedAddress } from './component_kit/cw_truncated_address';
import { CWAddressTooltip } from './component_kit/cw_popover/cw_address_tooltip';

type AddressAttrs = {
  profile: Profile;
  addresses: AddressInfo[];
  addressInfo: AddressInfo;
  refreshProfiles: (address: string) => void;
};

type LinkedAddressesAttrs = {
  profile: Profile;
  addresses: AddressInfo[];
  refreshProfiles: (address: string) => void;
};

class Address extends ClassComponent<AddressAttrs> {
  view(vnode: m.Vnode<AddressAttrs>) {
    const { profile, addresses, addressInfo, refreshProfiles } = vnode.attrs;
    const { address, chain } = addressInfo;

    return (
      <div className="AddressContainer">
        <CWAddressTooltip
          address={address}
          trigger={
            <CWTruncatedAddress address={address} communityInfo={chain} />
          }
        />
        <CWPopoverMenu
          menuItems={[
            {
              label: 'Remove',
              iconLeft: 'trash',
              onclick: (e) => {
                e.preventDefault();
                app.modals.create({
                  modal: DeleteAddressModal,
                  data: {
                    profile,
                    addresses,
                    address,
                    chain: chain.id,
                  },
                  completeCallback: () => {
                    refreshProfiles(address);
                  },
                });
              },
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
    const { profile, addresses, refreshProfiles } = vnode.attrs;

    return (
      <div className="LinkedAddresses">
        {addresses.map((address) => {
          return (
            <Address
              profile={profile}
              addresses={addresses}
              addressInfo={address}
              refreshProfiles={refreshProfiles}
            />
          );
        })}
      </div>
    );
  }
}
