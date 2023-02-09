/* @jsx m */

import m from 'mithril';
import ClassComponent from 'class_component';

import 'components/linked_addresses.scss';

import app from 'state';
import { AddressInfo, NewProfile as Profile } from 'models';
import { CWPopoverMenu } from './component_kit/cw_popover/cw_popover_menu';
import { CWIconButton } from './component_kit/cw_icon_button';
import { MoveAddressModal } from '../modals/move_address_modal';
import { DeleteAddressModal } from '../modals/delete_address_modal';
import { CWTruncatedAddress } from './component_kit/cw_truncated_address';
import { CWAddressTooltip } from './component_kit/cw_popover/cw_address_tooltip';

type AddressAttrs = {
  profiles: Profile[];
  profile: Profile;
  addressInfo: AddressInfo;
  refreshProfiles: () => Promise<void>;
};

type LinkedAddressesAttrs = {
  profiles: Profile[];
  profile: Profile;
  addresses: AddressInfo[];
  refreshProfiles: () => Promise<void>;
};

class Address extends ClassComponent<AddressAttrs> {
  view(vnode: m.Vnode<AddressAttrs>) {
    const { profiles, profile, addressInfo, refreshProfiles } = vnode.attrs;
    const { address, chain } = addressInfo;

    return (
      <div className="AddressContainer">
        <CWAddressTooltip
          address={address}
          trigger={<CWTruncatedAddress address={address} />}
        />
        <CWPopoverMenu
          menuItems={[
            {
              label: 'Transfer to another Profile',
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
                    refreshProfiles();
                  },
                });
              },
            },
            {
              label: 'Remove',
              iconLeft: 'trash',
              onclick: (e) => {
                e.preventDefault();
                app.modals.create({
                  modal: DeleteAddressModal,
                  data: {
                    profile,
                    address,
                    chain: chain.id,
                  },
                  completeCallback: () => {
                    refreshProfiles();
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
    const { profiles, profile, addresses, refreshProfiles } = vnode.attrs;

    return (
      <div className="LinkedAddresses">
        {addresses.map((address) => {
          return (
            <Address
              profiles={profiles}
              profile={profile}
              addressInfo={address}
              refreshProfiles={refreshProfiles}
            />
          );
        })}
      </div>
    );
  }
}
