import 'modals/confirm_invite_modal.scss';

import m from 'mithril';
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

const SideMenu: m.Component<{ invites; onChangeHandler; location }, {}> = {
  view: (vnode) => {
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
  },
};

const ConfirmInviteModal: m.Component<
  {},
  {
    invites: InviteCodeAttributes[];
    location: number;
    isComplete: boolean;
    selectedAddress: string;
    addresses: AddressInfo[];
    accepted: number[];
    rejected: number[];
  }
> = {
  oninit: (vnode) => {
    vnode.state.invites = app.config.invites;
    vnode.state.location = 0;
    vnode.state.isComplete = false;
    vnode.state.selectedAddress = null;
    vnode.state.addresses = app.user.addresses;
    vnode.state.accepted = [];
    vnode.state.rejected = [];
  },
  oncreate: () => {},
  view: (vnode) => {
    const SelectAddress = (account) => {
      const isMobile = isWindowSmallInclusive(window.innerWidth);
      return m(
        '.SwitchAddress.account-menu-item',
        {
          key: `${account.chain.id}-${account.address}`,
          class:
            vnode.state.selectedAddress === account.address
              ? isMobile
                ? 'selected mobile'
                : 'selected'
              : isMobile
              ? 'mobile'
              : '',
          onclick: (e) => {
            e.preventDefault();
            vnode.state.selectedAddress = account.address;
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

    const { invites, location } = vnode.state;
    let addresses;
    if (
      vnode.state.accepted.length + vnode.state.rejected.length ===
      invites.length
    ) {
      vnode.state.isComplete = true;
    } else {
      addresses = (vnode.state.addresses || [])
        .sort(orderAccountsByAddress)
        .map((account) => SelectAddress(account));
    }

    const activeInvite = app.config.chains.getById(invites[location].chain_id);
    const hasTermsOfService = !!activeInvite?.terms;

    return m('.ConfirmInviteModal', [
      m('.compact-modal-title', [
        !vnode.state.isComplete
          ? m('h3', 'Manage Invites')
          : m('h3', 'No more invites'),
        m(ModalExitButton),
      ]),
      !vnode.state.isComplete &&
        m(SideMenu, {
          invites,
          location,
          onChangeHandler: (result) => {
            vnode.state.location = result;
            vnode.state.selectedAddress = null;
          },
        }),
      invites.length > 0 && !vnode.state.isComplete
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
            vnode.state.accepted.includes(location)
              ? m('h4', "You've accepted this invite!")
              : vnode.state.rejected.includes(location)
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
                          vnode.state.accepted.includes(location) ||
                          !vnode.state.selectedAddress,
                        onclick: (e) => {
                          e.preventDefault();
                          const communityName =
                            invites[location].community_name;
                          if (vnode.state.selectedAddress) {
                            app.roles
                              .acceptInvite({
                                address: vnode.state.selectedAddress,
                                inviteCode: invites[location].id,
                              })
                              .then(
                                () => {
                                  app.config.invites =
                                    app.config.invites.filter(
                                      (invite) =>
                                        invite.community_name !== communityName
                                    );
                                  vnode.state.accepted.push(location);
                                  vnode.state.selectedAddress = null;

                                  if (app.config.invites.length === 0) {
                                    $(e.target).trigger('modalexit');
                                  }
                                  const chainId = invites[location].chain_id;
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
                        disabled: vnode.state.accepted.includes(location),
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
                                vnode.state.rejected.push(location);
                                vnode.state.selectedAddress = null;
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
                            invites[vnode.state.location].chain_id;
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
                  //         `/${invites[vnode.state.location].chain_id}`
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
  },
};

export default ConfirmInviteModal;
