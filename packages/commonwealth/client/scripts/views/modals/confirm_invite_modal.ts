import 'modals/confirm_invite_modal.scss';

import m from 'mithril';
import ClassComponent from 'class_component';
import $ from 'jquery';
import app from 'state';
import { Button } from 'construct-ui';

import { orderAccountsByAddress } from 'helpers';
import { notifyError, notifySuccess } from 'controllers/app/notifications';
import { UserBlock } from 'views/components/widgets/user';
import { confirmationModalWithText } from 'views/modals/confirm_modal';
import { navigateToSubpage } from 'app';
import { InviteCodeAttributes } from 'types';
import { AddressInfo } from 'models';
import { ModalExitButton } from 'views/components/component_kit/cw_modal';
import LoginWithWalletDropdown from 'views/components/login_with_wallet_dropdown';
import { isWindowSmallInclusive } from '../components/component_kit/helpers';

class SideMenu extends ClassComponent<{ invites; onChangeHandler; location }> {
  public view(vnode) {
    const { location } = vnode.attrs;
    return m('.SideMenu', [
      vnode.attrs.invites.map((invite, index) => {
        return m(
          '.inviteTitle',
          {
            class: location === index ? 'selected' : '',
            onclick: () => {
              vnode.attrs.onChangeHandler(index);
            },
          },
          `${invite.community_name}`
        );
      }),
    ]);
  }
};

class ConfirmInviteModal extends ClassComponent<
  {}
> {
  private invites: InviteCodeAttributes[];
  private location: number;
  private isComplete: boolean;
  private selectedAddress: string;
  private addresses: AddressInfo[];
  private accepted: number[];
  private rejected: number[];
  public oninit(vnode) {
    this.invites = app.config.invites;
    this.location = 0;
    this.isComplete = false;
    this.selectedAddress = null;
    this.addresses = app.user.addresses;
    this.accepted = [];
    this.rejected = [];
  }
  public oncreate: () => {}
  public view(vnode) {
    const SelectAddress = (account) => {
      const isMobile = isWindowSmallInclusive(window.innerWidth);
      return m(
        '.SwitchAddress.account-menu-item',
        {
          key: `${account.chain.id}-${account.address}`,
          class:
            this.selectedAddress === account.address
              ? isMobile
                ? 'selected mobile'
                : 'selected'
              : isMobile
              ? 'mobile'
              : '',
          onclick: (e) => {
            e.preventDefault();
            this.selectedAddress = account.address;
          },
        },
        [
          m(UserBlock, {
            user: account,
            showChainName: true,
            addressDisplayOptions: { showFullAddress: !isMobile },
          }),
        ]
      );
    };

    const { invites, location } = this;
    let addresses;
    if (
      this.accepted.length + this.rejected.length ===
      invites.length
    ) {
      this.isComplete = true;
    } else {
      addresses = (this.addresses || [])
        .sort(orderAccountsByAddress)
        .map((account) => SelectAddress(account));
    }

    const activeInvite = app.config.chains.getById(invites[location].chain_id);
    const hasTermsOfService = !!activeInvite?.terms;

    return m('.ConfirmInviteModal', [
      m('.compact-modal-title', [
        !this.isComplete
          ? m('h3', 'Manage Invites')
          : m('h3', 'No more invites'),
        m(ModalExitButton),
      ]),
      !this.isComplete &&
        m(SideMenu, {
          invites,
          location,
          onChangeHandler: (result) => {
            this.location = result;
            this.selectedAddress = null;
          },
        }),
      invites.length > 0 && !this.isComplete
        ? m('.compact-modal-body', [
            m('p', [
              "You've been invited to the ",
              m('strong', invites[location].community_name),
              ' community. ',
              addresses.length > 0
                ? 'Select an address to accept the invite:'
                : 'To get started, connect an address:',
            ]),
            hasTermsOfService &&
              m('p.terms-of-service', [
                `By linking an address, you agree to ${activeInvite.name}'s `,
                m(
                  'a',
                  { href: activeInvite.terms, target: '_blank' },
                  'terms of service'
                ),
                '.',
              ]),
            this.accepted.includes(location)
              ? m('h4', "You've accepted this invite!")
              : this.rejected.includes(location)
              ? m('h4', "You've already deleted this invite!")
              : [
                  m('.invite-addresses', [addresses]),
                  addresses.length > 0 &&
                    m('.invite-actions', [
                      m(Button, {
                        class: 'submit',
                        intent: 'primary',
                        rounded: true,
                        disabled:
                          this.accepted.includes(location) ||
                          !this.selectedAddress,
                        onclick: (e) => {
                          e.preventDefault();
                          const communityName =
                            invites[location].community_name;
                          if (this.selectedAddress) {
                            app.roles
                              .acceptInvite({
                                address: this.selectedAddress,
                                inviteCode: invites[location].id,
                              })
                              .then(
                                () => {
                                  app.config.invites =
                                    app.config.invites.filter(
                                      (invite) =>
                                        invite.community_name !== communityName
                                    );
                                  this.accepted.push(location);
                                  this.selectedAddress = null;

                                  if (app.config.invites.length === 0) {
                                    $(e.target).trigger('modalexit');
                                  }
                                  const chainId = invites[location].chain_id;
                                  console.log({ chainId });
                                  // if private community, re-init app
                                  m.route.set(`/${chainId}`);
                                  notifySuccess(
                                    `Successfully joined ${communityName}.`
                                  );
                                },
                                (err) => {
                                  notifyError('Error accepting invite');
                                }
                              );
                          }
                        },
                        label: 'Accept invite',
                      }),
                      m('.invite-actions-or', 'or'),
                      m(Button, {
                        class: 'reject',
                        intent: 'negative',
                        rounded: true,
                        disabled: this.accepted.includes(location),
                        onclick: async (e) => {
                          e.preventDefault();
                          const confirmed = await confirmationModalWithText(
                            'Reject this invite? You will need to be invited again.'
                          )();
                          if (!confirmed) return;
                          app.roles
                            .rejectInvite({ inviteCode: invites[location].id })
                            .then(
                              (result) => {
                                app.config.invites = app.config.invites.filter(
                                  (invite) =>
                                    invite.community_name !==
                                    invites[location].community_name
                                );
                                this.rejected.push(location);
                                this.selectedAddress = null;
                                m.redraw();
                              },
                              (err) => {
                                notifyError('Error rejecting invite.');
                              }
                            );
                        },
                        label: 'Reject invite',
                      }),
                    ]),
                  addresses.length === 0 &&
                    m(
                      'a.btn.add-account',
                      {
                        href: '#',
                        onclick: (e) => {
                          e.preventDefault();

                          // set defaults for the web3 login modal
                          // TODO: let the user select between different crypto wallets for linking an address
                          const defaultChainId = 'edgeware';
                          const joiningCommunity =
                            invites[this.location].chain_id;
                          const targetCommunity = joiningCommunity;
                          const prev = m.route.get();
                          const next = `/${joiningCommunity}`;
                          // TODO: implement joiningChain once confirm_invite_modal supports chains
                          const web3loginParams = joiningCommunity
                            ? { prev, next, joiningCommunity }
                            : { prev, next };

                          // redirect to /web3login to connect to the chain
                          if (app.activeChainId()) {
                            navigateToSubpage('/web3login', web3loginParams);
                          } else {
                            m.route.set(
                              `${defaultChainId}/web3login`,
                              web3loginParams
                            );
                          }

                          // show web3 login modal
                          app.modals.lazyCreate('link_new_address_modal', {
                            joiningCommunity,
                            targetCommunity,
                            successCallback: () => {
                              m.route.set(next);
                              $(e.target).trigger('modalexit');
                            },
                          });
                        },
                      },
                      'Connect a new address'
                    ),
                  // addresses.length === 0 &&
                  //   m(LoginWithWalletDropdown, {
                  //     loggingInWithAddress: false,
                  //     joiningChain: app.chain?.id || 'edgeware',
                  //     label: 'Connect an address',
                  //     onSuccess: (e) => {
                  //       // $('.ConfirmInviteModal').trigger('modalexit');
                  //       m.route.set(
                  //         `/${invites[this.location].chain_id}`
                  //       );
                  //     },
                  //   }),
                ],
          ])
        : m('.compact-modal-body', [
            m('div', [
              m('p', 'No more invites!'),
              m('p', 'Click anywhere outside this window to close it.'),
            ]),
          ]),
    ]);
  }
};

export default ConfirmInviteModal;
