import React from 'react';

import type { ResultNode } from 'mithrilInterop';
import { ClassComponent } from 'mithrilInterop';

import 'components/linked_addresses.scss';

import type { AddressInfo, NewProfile as Profile } from 'models';
import { PopoverMenu } from './component_kit/cw_popover/cw_popover_menu';
import { Modal } from './component_kit/cw_modal';
import { CWIconButton } from './component_kit/cw_icon_button';
import { DeleteAddressModal } from '../modals/delete_address_modal';
import { CWTruncatedAddress } from './component_kit/cw_truncated_address';
import { CWAddressTooltip } from './component_kit/cw_popover/cw_address_tooltip';

type AddressAttrs = {
  profile: Profile;
  addressInfo: AddressInfo;
  refreshProfiles: (address: string) => void;
  toggleRemoveModal: (val: boolean, address: AddressInfo) => void;
};

type LinkedAddressesAttrs = {
  profile: Profile;
  addresses: AddressInfo[];
  refreshProfiles: (address: string) => void;
};

class Address extends ClassComponent<AddressAttrs> {
  view(vnode: ResultNode<AddressAttrs>) {
    const { addressInfo, toggleRemoveModal } = vnode.attrs;
    const { address } = addressInfo;

    return (
      <div className="AddressContainer">
        <CWAddressTooltip
          address={address}
          renderTrigger={() => <CWTruncatedAddress address={address} />}
        />
        <PopoverMenu
          menuItems={[
            {
              label: 'Remove',
              iconLeft: 'trash',
              onClick: () => toggleRemoveModal(true, addressInfo),
            },
          ]}
          renderTrigger={(onclick) => (
            <CWIconButton iconName="dotsVertical" onClick={onclick} />
          )}
        />
      </div>
    );
  }
}

export class LinkedAddresses extends ClassComponent<LinkedAddressesAttrs> {
  private isRemoveModalOpen: boolean;
  private currentAddress: AddressInfo;

  oninit() {
    this.isRemoveModalOpen = false;
  }

  view(vnode: ResultNode<LinkedAddressesAttrs>) {
    const { profile, addresses, refreshProfiles } = vnode.attrs;

    return (
      <div className="LinkedAddresses">
        {addresses.map((address, i) => {
          return (
            <Address
              key={i}
              profile={profile}
              addressInfo={address}
              refreshProfiles={refreshProfiles}
              toggleRemoveModal={(
                val: boolean,
                currentAddress: AddressInfo
              ) => {
                this.isRemoveModalOpen = val;
                this.currentAddress = currentAddress;
              }}
            />
          );
        })}
        <Modal
          content={
            <DeleteAddressModal
              profile={profile}
              addresses={addresses}
              address={this.currentAddress?.address}
              chain={this.currentAddress?.chain.id}
              closeModal={() => {
                this.isRemoveModalOpen = false;
                refreshProfiles(this.currentAddress.address);
              }}
            />
          }
          onClose={() => (this.currentAddress = null)}
          open={this.isRemoveModalOpen}
        />
      </div>
    );
  }
}
