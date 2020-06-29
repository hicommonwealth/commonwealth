import 'modals/confirm_invite_modal.scss';

import m from 'mithril';
import $ from 'jquery';
import app from 'state';
import mixpanel from 'mixpanel-browser';

import { orderAccountsByAddress } from 'helpers';

import User from 'views/components/widgets/user';
import { CompactModalExitButton } from 'views/modal';

const SideMenu: m.Component<{invites, onChangeHandler, location}, {}> = {
  view: (vnode) => {
    const { location } = vnode.attrs;
    return m('.SideMenu', [
      vnode.attrs.invites.map((invite, index) => {
        return m('.inviteTitle', {
          class: (location === index) ? 'selected' : '',
          onclick: () => {
            vnode.attrs.onChangeHandler(index);
          }
        }, `${invite.community_name}`);
      })
    ]);
  },
};

const ConfirmInviteModal = {
  oninit: (vnode) => {
    vnode.state.invites = app.config.invites;
    vnode.state.location = 0;
    vnode.state.isComplete = false;
    vnode.state.selectedAddress = null;
    vnode.state.addresses = app.user.addresses;
    vnode.state.accepted = [];
  },
  oncreate: (vnode) => {
    mixpanel.track('Accepting Invite', {
      'Step No': 1,
      'Step': 'Modal Opened',
    });
  },
  view: (vnode) => {
    const SelectAddress = (account) => {
      return m('.SwitchAddress.account-menu-item', {
        key: `${account.chain.id}-${account.address}`,
        class: vnode.state.selectedAddress === account.address ? 'selected' : '',
        onclick: (e) => {
          e.preventDefault();
          vnode.state.selectedAddress = account.address;
        },
      }, [
        m(User, { user: account, linkify: false, avatarSize: 16 })
      ]);
    };

    const invites = vnode.state.invites;
    let addresses;
    if (vnode.state.accepted.length === invites.length) {
      vnode.state.isComplete = true;
    } else {
      addresses = (vnode.state.addresses || [])
        .sort(orderAccountsByAddress)
        .map((account) => SelectAddress(account));
    }
    return m('.ConfirmInviteModal', [
      m('.compact-modal-title', [
        !vnode.state.isComplete
          ? m('h3', (vnode.state.invites.length > 1) ? 'Manage Invites' : 'Accept or reject invite')
          : m('h3', 'No more invites'),
        m(CompactModalExitButton),
      ]),
      !vnode.state.isComplete
        && m(SideMenu, {
          invites,
          location: vnode.state.location,
          onChangeHandler: (result) => { vnode.state.location = result; vnode.state.selectedAddress = null; }
        }),
      invites.length > 0 && !vnode.state.isComplete
        ? m('.compact-modal-body', [
          m('p', 'You\'ve been invited to a community on Commonwealth:'),
          m('.CommunityBlock', [
            m('.community-block-top', `${invites[vnode.state.location].community_name}`),
            m('span.icon-lock.community-block-top'),
            m('.community-block-bottom', `commonwealth.im/${invites[vnode.state.location].community_id}`)
          ]),
          vnode.state.accepted.includes(vnode.state.location) ? [
            m('h4', 'You\'ve already accepted this invite!')
          ] : [
            addresses.length > 0
              && m('p', 'Accept the invite with any of your addresses:'),
            addresses,
            addresses.length > 0
              && m('button.formular-button-primary.submit', {
                disabled: vnode.state.accepted.includes(vnode.state.location) || !vnode.state.selectedAddress,
                onclick: (e) => {
                  e.preventDefault();
                  if (vnode.state.selectedAddress) {
                    app.user.acceptInvite({
                      address: vnode.state.selectedAddress,
                      inviteCode: invites[vnode.state.location].id
                    }).then(() => {
                      app.config.invites = app.config.invites.filter(
                        (invite) => invite.community_name !== invites[vnode.state.location].community_name
                      );
                      vnode.state.accepted.push(vnode.state.location);
                      vnode.state.selectedAddress = null;
                      m.redraw();
                      mixpanel.track('Address Selected', {
                        'Step': 'Address Selected for Invite',
                      });
                    }, (err) => {
                      console.error('Error accepting invite');
                    });
                  }
                }
              }, 'Accept invite'),
            addresses.length > 0
              && m('p', 'Or, reject the invite (you will need to be invited again to join the community):'),
            addresses.length > 0
              && m('button.formular-button-negative.reject', {
                disabled: vnode.state.accepted.includes(vnode.state.location),
                onclick: (e) => {
                  e.preventDefault();
                  $.post(`${app.serverUrl()}/acceptInvite`, {
                    inviteCode: invites[vnode.state.location].id,
                    reject: true,
                    jwt: app.user.jwt,
                  }).then((result) => {
                    app.config.invites = app.config.invites.filter(
                      (invite) => invite.community_name !== invites[vnode.state.location].community_name
                    );
                    vnode.state.accepted.push(vnode.state.location);
                    vnode.state.selectedAddress = null;
                    m.redraw();
                    mixpanel.track('Address Selected', {
                      'Step': 'Address Selected for Invite',
                    });
                  }, (err) => {
                    console.error('Error accepting invite.');
                  });
                }
              }, 'Reject invite'),
            addresses.length === 0
              && m('.no-accounts', 'You must link a new address to join this community.'),
            addresses.length === 0
            && m('a.btn.add-account', {
              href: '#',
              onclick: (e) => {
                e.preventDefault();
                app.modals.lazyCreate('link_new_address_modal');
                $(vnode.dom).trigger('modalexit');
              }
            }, `Link new ${(app.chain && app.chain.chain && app.chain.chain.denom) || ''} address`),
          ],
        ])
        : m('.compact-modal-body', [
          m('div', [
            m('p', 'No more invites!'),
            m('p', 'Click anywhere outside this window to close it.'),
          ]),
        ])
    ]);
  }
};

export default ConfirmInviteModal;
