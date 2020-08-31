import 'modals/confirm_invite_modal.scss';

import m from 'mithril';
import $ from 'jquery';
import app from 'state';
import mixpanel from 'mixpanel-browser';
import { Button } from 'construct-ui';

import { orderAccountsByAddress } from 'helpers';
import { notifyError } from 'controllers/app/notifications';
import User, { UserBlock } from 'views/components/widgets/user';
import { CompactModalExitButton } from 'views/modal';
import { confirmationModalWithText } from 'views/modals/confirm_modal';

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

const ConfirmInviteModal: m.Component<{}, {
  invites;
  location;
  isComplete;
  selectedAddress;
  addresses;
  accepted;
  rejected;
}> = {
  oninit: (vnode) => {
    vnode.state.invites = app.config.invites;
    vnode.state.location = 0;
    vnode.state.isComplete = false;
    vnode.state.selectedAddress = null;
    vnode.state.addresses = app.user.addresses;
    vnode.state.accepted = [];
    vnode.state.rejected = [];
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
        m(UserBlock, { user: account })
      ]);
    };

    const invites = vnode.state.invites;
    let addresses;
    if (vnode.state.accepted.length + vnode.state.rejected.length === invites.length) {
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
          vnode.state.accepted.includes(vnode.state.location) ? m('h4', 'You\'ve accepted this invite!')
            : vnode.state.rejected.includes(vnode.state.location) ? m('h4', 'You\'ve already deleted this invite!') : [
              addresses.length > 0
                && m('p', 'Accept the invite with any of your addresses:'),
              addresses,
              addresses.length > 0
                && m(Button, {
                  class: 'submit',
                  intent: 'primary',
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
                        notifyError('Error accepting invite');
                      });
                    }
                  },
                  label: 'Accept invite',
                }),
              addresses.length > 0
                && m(Button, {
                  class: 'reject',
                  intent: 'negative',
                  disabled: vnode.state.accepted.includes(vnode.state.location),
                  onclick: async (e) => {
                    e.preventDefault();
                    const confirmed = await confirmationModalWithText('Really delete this invite?')();
                    if (!confirmed) return;
                    $.post(`${app.serverUrl()}/acceptInvite`, {
                      inviteCode: invites[vnode.state.location].id,
                      reject: true,
                      jwt: app.user.jwt,
                    }).then((result) => {
                      app.config.invites = app.config.invites.filter(
                        (invite) => invite.community_name !== invites[vnode.state.location].community_name
                      );
                      vnode.state.rejected.push(vnode.state.location);
                      vnode.state.selectedAddress = null;
                      m.redraw();
                    }, (err) => {
                      notifyError('Error deleting invite.');
                    });
                  },
                  label: 'Delete invite'
                }),
              addresses.length === 0
                && m('.no-accounts', 'You must connect an address to join this community.'),
              addresses.length === 0
              && m('a.btn.add-account', {
                href: '#',
                onclick: (e) => {
                  e.preventDefault();
                  app.modals.lazyCreate('link_new_address_modal', {
                    successCallback: () => {
                      // TODO XX: set membership
                      $(e.target).trigger('modalexit');
                    }
                  });
                }
              }, 'Connect a new address'),
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
