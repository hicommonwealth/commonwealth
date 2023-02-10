import React from 'react';

import type { ResultNode } from 'mithrilInterop';
import { ClassComponent } from 'mithrilInterop';

import 'components/linked_addresses.scss';

import type { AddressInfo, NewProfile as Profile } from 'models';
import { PopoverMenu } from './component_kit/cw_popover/cw_popover_menu';
import { Modal } from './component_kit/cw_modal';
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
  toggleTransferModal: (val: boolean, address: AddressInfo) => void;
  toggleRemoveModal: (val: boolean, address: AddressInfo) => void;
};

type LinkedAddressesAttrs = {
  profiles: Profile[];
  profile: Profile;
  addresses: AddressInfo[];
  refreshProfiles: () => Promise<void>;
};

class Address extends ClassComponent<AddressAttrs> {
  view(vnode: ResultNode<AddressAttrs>) {
    const { addressInfo, toggleTransferModal, toggleRemoveModal } = vnode.attrs;
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
              label: 'Transfer to another Profile',
              iconLeft: 'externalLink',
              onClick: () => toggleTransferModal(true, addressInfo),
            },
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
  private isTransferModalOpen: boolean;
  private isRemoveModalOpen: boolean;
  private currentAddress: AddressInfo;

  oninit() {
    this.isTransferModalOpen = false;
    this.isRemoveModalOpen = false;
  }

  view(vnode: ResultNode<LinkedAddressesAttrs>) {
    const { profiles, profile, addresses, refreshProfiles } = vnode.attrs;

    return (
      <div className="LinkedAddresses">
        {addresses.map((address, i) => {
          return (
            <Address
              key={i}
              profiles={profiles}
              profile={profile}
              addressInfo={address}
              refreshProfiles={refreshProfiles}
              toggleTransferModal={(
                val: boolean,
                currentAddress: AddressInfo
              ) => {
                this.isTransferModalOpen = val;
                this.currentAddress = currentAddress;
              }}
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
            <MoveAddressModal
              profile={profile}
              profiles={profiles}
              address={this.currentAddress?.address}
              closeModal={() => {
                this.isTransferModalOpen = false;
                refreshProfiles();
              }}
            />
          }
          onClose={() => (this.currentAddress = null)}
          open={this.isTransferModalOpen}
        />
        <Modal
          content={
            <DeleteAddressModal
              profile={profile}
              address={this.currentAddress?.address}
              chain={this.currentAddress?.chain.id}
              closeModal={() => {
                this.isRemoveModalOpen = false;
                refreshProfiles();
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
