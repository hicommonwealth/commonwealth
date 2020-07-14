import 'modals/create_community_modal.scss';

import m from 'mithril';
import $ from 'jquery';
import _ from 'lodash';
import mixpanel from 'mixpanel-browser';

import app from 'state';
import { inputModalWithText } from 'views/modals/input_modal';

// import User from 'views/components/widgets/user';
import { CompactModalExitButton } from 'views/modal';
import { CommunityInfo } from 'models';

interface IAttrs {}

interface IState {
  disabled: boolean;
  error: string;
  success: string | boolean;
  selectedAddress: string;
  selectedChain: string;
}

const CreateCommunityModal: m.Component<IAttrs, IState> = {
  oncreate: (vnode) => {
    mixpanel.track('New Community', {
      'Step No': 1,
      'Step': 'Modal Opened'
    });
  },
  view: (vnode: m.VnodeDOM<IAttrs, IState>) => {
    return m('.CreateCommunityModal', [
      m('h3', 'New Commonwealth community'),
      m(CompactModalExitButton),
      m('form.login-option', [
        m('input[type="text"]', {
          name: 'name',
          placeholder: 'Community name',
          oncreate: (vvnode) => {
            $(vvnode.dom).focus();
          },
          autocomplete: 'off',
        }),
        m('textarea', {
          name: 'description',
          placeholder: 'Community description',
        }),
        m('.auth-features', [
          // Removed this until Auth_conditions exist bc must match "invite" otherwise
          // m('.form-field', [
          //   m('input[type="checkbox"]', {
          //     name: 'auth_forum',
          //     id: 'auth_forum',
          //   }),
          //   m('label', { for: 'auth_forum' } , 'Only members can post (Invites Required)'),
          // ]),
          m('.form-field', [
            m('input[type="checkbox"]', {
              name: 'invites',
              id: 'invites',
            }),
            m('label', { for: 'invites' }, 'Allow members to invite others'),
          ]),
          m('.form-field', [
            m('input[type="checkbox"]', {
              name: 'private_forum',
              id: 'private_forum',
            }),
            m('label', { for: 'private_forum' }, 'Private: Only visible to members'),
          ]),
          m('br'),
          m('h4', 'Select an admin'),
          app.user.addresses.length === 0
            && m('.no-active-address', 'No address found. You must have an address before creating a community.'),
          app.user.addresses.map((addr) => {
            return m('.form-field', [
              m('input[type="radio"]', {
                name: 'addr_select',
                value: `addr_select_${addr.address}_${addr.chain}`,
                id: `addr_select_${addr.address}_${addr.chain}`,
                oninput: (e) => {
                  vnode.state.selectedAddress = addr.address;
                  vnode.state.selectedChain = addr.chain;
                },
              }),
              m('label', { for: `addr_select_${addr.address}_${addr.chain}` }, [
                `${addr.address.slice(0, 6)}${addr.address.length > 6 ? '...' : ''} (${addr.chain})`,
                // m(User, { user: [addr.address, addr.chain] }),
              ]),
            ]);
          }),
        ]),
        m('button', {
          class: (vnode.state.disabled || !vnode.state.selectedAddress || !vnode.state.selectedChain)
            ? 'disabled' : '',
          type: 'submit',
          onclick: (e) => {
            e.preventDefault();
            const name = $(vnode.dom).find('[name="name"]').val();
            const description = $(vnode.dom).find('[name="description"]').val();
            const chain = vnode.state.selectedChain;
            const address = vnode.state.selectedAddress;
            // const isAuthenticatedForum = $(vnode.dom).find('[name="auth_forum"]').prop('checked');
            const privacyEnabled = $(vnode.dom).find('[name="private_forum"]').prop('checked');
            const invitesEnabled = $(vnode.dom).find('[name="invites"]').prop('checked');

            vnode.state.disabled = true;
            vnode.state.success = false;
            // TODO: Change to POST /community
            $.post(`${app.serverUrl()}/createCommunity`, {
              creator_address: vnode.state.selectedAddress,
              creator_chain: vnode.state.selectedChain,
              name,
              description,
              default_chain: chain,
              isAuthenticatedForum: 'false', // TODO: fetch from isAuthenticatedForum
              privacyEnabled: privacyEnabled ? 'true' : 'false',
              invitesEnabled: invitesEnabled ? 'true' : 'false',
              auth: true,
              jwt: app.user.jwt,
            }).then((result) => {
              const newCommunityInfo = new CommunityInfo(
                result.result.id,
                result.result.name,
                result.result.description,
                null,
                null,
                result.result.default_chain,
                result.result.invitesEnabled,
                result.result.privacyEnabled,
                result.featured_tags,
                result.tags,
              );
              app.config.communities.add(newCommunityInfo);
              vnode.state.success = 'Sucessfully added';
              m.redraw();
              vnode.state.disabled = false;
              if (result.status === 'Success') {
                if (!app.isLoggedIn()) {
                  mixpanel.track('New Community', {
                    'Step No': 2,
                    'Step': 'Created Community'
                  });
                }
                m.route.set(`/${newCommunityInfo.id}/`);
                $(vnode.dom).trigger('modalexit');
              } else {
                vnode.state.error = result.message;
              }
              m.redraw();
            }, (err) => {
              vnode.state.disabled = false;
              if (err.responseJSON) vnode.state.error = err.responseJSON.error;
              m.redraw();
            });
          }
        }, 'Create community'),
        vnode.state.error && m('.create-community-message.error', [
          vnode.state.error || 'An error occurred'
        ]),
      ]),
    ]);
  }
};

export default CreateCommunityModal;
