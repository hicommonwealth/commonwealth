/* @jsx jsx */
import React from 'react';

import {
  ClassComponent,
  ResultNode,
  render,
  setRoute,
  getRoute,
  getRouteParam,
  redraw,
  Component,
  jsx,
} from 'mithrilInterop';
import $ from 'jquery';
import { notifyError, notifySuccess } from 'controllers/app/notifications';
import { orderAccountsByAddress } from 'helpers';
import { navigateToSubpage } from 'router';

import 'modals/confirm_invite_modal.scss';
import type { AddressInfo } from 'models';

import app from 'state';
import type { InviteCodeAttributes } from 'types';
import { ModalExitButton } from 'views/components/component_kit/cw_modal';
import { confirmationModalWithText } from 'views/modals/confirm_modal';
import { CWButton } from '../components/component_kit/cw_button';
import { CWText } from '../components/component_kit/cw_text';
import { UserBlock } from '../components/user/user_block';
import {
  getClasses,
  isWindowSmallInclusive,
} from '../components/component_kit/helpers';

type SideMenuAttrs = {
  invites: Array<InviteCodeAttributes>;
  location: number;
  onChangeHandler: (selected: number) => void;
};

class SideMenu extends ClassComponent<SideMenuAttrs> {
  view(vnode: ResultNode<SideMenuAttrs>) {
    const { invites, location, onChangeHandler } = vnode.attrs;

    return (
      <div className="SideMenu">
        {invites.map((invite, i) => {
          return (
            <div
              className={getClasses<{ selected: boolean }>(
                { selected: location === i },
                'invite-title'
              )}
              onClick={() => {
                onChangeHandler(i);
              }}
            >
              {invite.community_name}
            </div>
          );
        })}
      </div>
    );
  }
}

export class ConfirmInviteModal extends ClassComponent {
  private accepted: Array<number>;
  private addresses: Array<AddressInfo>;
  private invites: Array<InviteCodeAttributes>;
  private isComplete: boolean;
  private location: number;
  private rejected: Array<number>;
  private selectedAddress: string | null;

  oninit() {
    this.invites = app.config.invites;
    this.location = 0;
    this.isComplete = false;
    this.selectedAddress = null;
    this.addresses = app.user.addresses;
    this.accepted = [];
    this.rejected = [];
  }

  view() {
    const selectAddress = (account: AddressInfo) => {
      const isMobile = isWindowSmallInclusive(window.innerWidth);

      return (
        <div
          className={getClasses<{ selected: boolean; mobile: boolean }>(
            {
              selected: this.selectedAddress === account.address,
              mobile: isMobile,
            },
            'SwitchAddress'
          )}
          key={`${account.chain.id}-${account.address}`}
          onClick={(e) => {
            e.preventDefault();
            this.selectedAddress = account.address;
          }}
        >
          <UserBlock
            user={account}
            showChainName
            addressDisplayOptions={{ showFullAddress: !isMobile }}
          />
        </div>
      );
    };

    const { invites, location } = this;

    let addresses;

    if (this.accepted.length + this.rejected.length === invites.length) {
      this.isComplete = true;
    } else {
      addresses = (this.addresses || [])
        .sort(orderAccountsByAddress)
        .map((account) => selectAddress(account));
    }

    const activeInvite = app.config.chains.getById(invites[location].chain_id);
    const hasTermsOfService = !!activeInvite?.terms;

    return (
      <div className="ConfirmInviteModal">
        <div className="compact-modal-title">
          <h3>{!this.isComplete ? 'Manage Invites' : 'No more invites'}</h3>
          <ModalExitButton />
        </div>
        {!this.isComplete && (
          <SideMenu
            invites={invites}
            location={location}
            onChangeHandler={(result) => {
              this.location = result;
              this.selectedAddress = null;
            }}
          />
        )}
        {invites.length > 0 && !this.isComplete ? (
          <div className="compact-modal-body">
            <CWText>
              You've been invited to the{' '}
              <strong>{invites[location].community_name}</strong> community.{' '}
              {addresses.length > 0
                ? 'Select an address to accept the invite:'
                : 'To get started, connect an address:'}
            </CWText>
            {hasTermsOfService && (
              <CWText>
                By linking an address, you agree to {activeInvite.name}'s{' '}
                <a href={activeInvite.terms} target="_blank">
                  terms of service
                </a>
                .
              </CWText>
            )}
            {this.accepted.includes(location) ? (
              <CWText type="h5">You've accepted this invite!</CWText>
            ) : this.rejected.includes(location) ? (
              <CWText type="h5">You've already deleted this invite!</CWText>
            ) : (
              <React.Fragment>
                <div className="invite-addresses">{addresses}</div>
                {addresses.length > 0 && (
                  <div className="invite-actions">
                    <CWButton
                      disabled={
                        this.accepted.includes(location) ||
                        !this.selectedAddress
                      }
                      onClick={(e) => {
                        e.preventDefault();

                        const communityName = invites[location].community_name;

                        if (this.selectedAddress) {
                          app.roles
                            .acceptInvite({
                              address: this.selectedAddress,
                              inviteCode: invites[location].id,
                            })
                            .then(
                              () => {
                                app.config.invites = app.config.invites.filter(
                                  (invite) =>
                                    invite.community_name !== communityName
                                );
                                this.accepted.push(location);
                                this.selectedAddress = null;

                                if (app.config.invites.length === 0) {
                                  $(e.target).trigger('modalexit');
                                }
                                const chainId = invites[location].chain_id;
                                // if private community, re-init app
                                setRoute(`/${chainId}`);
                                notifySuccess(
                                  `Successfully joined ${communityName}.`
                                );
                              },
                              () => {
                                notifyError('Error accepting invite');
                              }
                            );
                        }
                      }}
                      label="Accept invite"
                    />
                    <CWText>or</CWText>
                    <CWButton
                      disabled={this.accepted.includes(location)}
                      onClick={async (e) => {
                        e.preventDefault();

                        const confirmed = await confirmationModalWithText(
                          'Reject this invite? You will need to be invited again.'
                        )();

                        if (!confirmed) return;

                        app.roles
                          .rejectInvite({ inviteCode: invites[location].id })
                          .then(
                            () => {
                              app.config.invites = app.config.invites.filter(
                                (invite) =>
                                  invite.community_name !==
                                  invites[location].community_name
                              );
                              this.rejected.push(location);
                              this.selectedAddress = null;
                              redraw();
                            },
                            () => {
                              notifyError('Error rejecting invite.');
                            }
                          );
                      }}
                      label="Reject invite"
                    />
                  </div>
                )}
                {addresses.length === 0 && (
                  <a
                    onClick={(e) => {
                      e.preventDefault();

                      // set defaults for the web3 login modal
                      // TODO: let the user select between different crypto wallets for linking an address
                      const defaultChainId = 'edgeware';
                      const joiningCommunity = invites[this.location].chain_id;
                      const targetCommunity = joiningCommunity;
                      const prev = getRoute();
                      const next = `/${joiningCommunity}`;
                      // TODO: implement joiningChain once confirm_invite_modal supports chains
                      const web3loginParams = joiningCommunity
                        ? { prev, next, joiningCommunity }
                        : { prev, next };

                      // redirect to /web3login to connect to the chain
                      if (app.activeChainId()) {
                        navigateToSubpage('/web3login', web3loginParams);
                      } else {
                        setRoute(
                          `${defaultChainId}/web3login`,
                          web3loginParams
                        );
                      }
                    }}
                  >
                    Connect a new address
                  </a>
                )}
              </React.Fragment>
            )}
          </div>
        ) : (
          <div className="compact-modal-body">
            <CWText>No more invites!</CWText>
            <CWText>Click anywhere outside this window to close it.</CWText>
          </div>
        )}
      </div>
    );
  }
}
