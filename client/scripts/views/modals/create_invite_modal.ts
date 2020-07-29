import 'modals/create_invite_modal.scss';

import m from 'mithril';
import $ from 'jquery';
import mixpanel from 'mixpanel-browser';
import { Button, Input, CustomSelect } from 'construct-ui';

import app from 'state';

import { CommunityInfo } from 'models';
import { CompactModalExitButton } from 'views/modal';
import { DropdownFormField } from 'views/components/forms';

const CreateInviteLink: m.Component<{ onChangeHandler?: Function }, { link: string }> = {
  oninit: (vnode) => {
    vnode.state.link = '';
  },
  view: (vnode) => {
    return m('.CreateInviteLink', [
      m('h4', 'Option 3: Create invite link'),
      m('form.invite-link-parameters', [
        m('label', { for: 'uses', }, 'Number of uses:'),
        m('select', { name: 'uses' }, [
          m('option', { value: 'none', }, 'Unlimited'),
          m('option', { value: 1, }, 'Once'),
          // m('option', { value: 2, }, 'Twice'),
        ]),
        m('label', { for: 'time', }, 'Expires after:'),
        m('select', { name: 'time' }, [
          m('option', { value: 'none', }, 'None'),
          m('option', { value: '24h', }, '24 hours'),
          m('option', { value: '48h', }, '48 hours'),
          m('option', { value: '1w', }, '1 week'),
          m('option', { value: '30d', }, '30 days'),
        ]),
        m(Button, {
          type: 'submit',
          intent: 'primary',
          onclick: (e) => {
            e.preventDefault();
            const $form = $(e.target).closest('form');
            const time = $form.find('[name="time"] option:selected').val();
            const uses = $form.find('[name="uses"] option:selected').val();
            // TODO: Change to POST /inviteLink
            $.post(`${app.serverUrl()}/createInviteLink`, {
              community_id: app.activeCommunityId(),
              time,
              uses,
              jwt: app.user.jwt,
            }).then((response) => {
              const linkInfo = response.result;
              const url = (app.isProduction) ? 'commonwealth.im' : 'localhost:8080';
              if (vnode.attrs.onChangeHandler) vnode.attrs.onChangeHandler(linkInfo);
              vnode.state.link = `${url}${app.serverUrl()}/acceptInviteLink?id=${linkInfo.id}`;
              m.redraw();
            });
          },
          label: 'Get invite link'
        }),
        m(Input, {
          class: 'invite-link-pastebin',
          disabled: true,
          value: `${vnode.state.link}`,
        }),
      ]),
    ]);
  }
};

const CreateInviteModal: m.Component<{
  communityInfo: CommunityInfo;
}, {
  success: boolean;
  failure: boolean;
  disabled: boolean;
  error: string;
  selectedChain: string;
}> = {
  oncreate: (vnode) => {
    mixpanel.track('New Invite', {
      'Step No': 1,
      'Step': 'Modal Opened'
    });
  },
  view: (vnode) => {
    const { communityInfo } = vnode.attrs;
    const { name, id, privacyEnabled, invitesEnabled, defaultChain } = communityInfo;

    const chains = app.config.chains.getAll().map((chain) => ({
      name: 'invitedAddressChain',
      label: chain.name,
      value: chain.id,
    }));

    const getInviteButton = (selection) => {
      return m(Button, {
        class: 'create-invite-button',
        intent: 'primary',
        loading: vnode.state.disabled,
        type: 'submit',
        label: selection === 'address' ? 'Add member' : selection === 'email' ? 'Invite email' : 'Add',
        onclick: (e) => {
          e.preventDefault();
          const $form = $(e.target).closest('form');
          const address = $form.find('[name="address"]').val();
          const emailAddress = $form.find('[name="emailAddress"]').val();

          if (selection !== 'address' && selection !== 'email') return;
          if (selection === 'address' && (address === '' || address === null)) return;
          if (selection === 'email' && (emailAddress === '' || emailAddress === null)) return;

          vnode.state.disabled = true;
          vnode.state.success = false;
          vnode.state.failure = false;

          let postType: string;
          if (selection === 'address') {
            // TODO: Change to POST /member
            postType = '/addMember';
          } else if (selection === 'email') {
            // TODO: Change to POST /invite
            postType = '/createInvite';
          } else {
            return;
          }

          $.post(app.serverUrl() + postType, {
            address: app.user.activeAccount.address,
            author_chain: app.user.activeAccount.chain,
            community: id,
            invitedAddress: selection === 'address' ? address : '',
            invitedAddressChain: selection === 'address' ? vnode.state.selectedChain : '',
            invitedEmail: selection === 'email' ? emailAddress : '',
            auth: true,
            jwt: app.user.jwt,
          }).then((result) => {
            vnode.state.disabled = false;
            if (result.status === 'Success') {
              vnode.state.success = true;
            } else {
              vnode.state.failure = true;
              vnode.state.error = result.message;
            }
            m.redraw();
            mixpanel.track('Invite Sent', {
              'Step No': 2,
              'Step': 'Invite Sent (Completed)'
            });
          }, (err) => {
            vnode.state.failure = true;
            vnode.state.disabled = false;
            if (err.responseJSON) vnode.state.error = err.responseJSON.error;
            m.redraw();
          });
        }
      });
    };

    return m('.CreateInviteModal', [
      m('.compact-modal-title', [
        m('h3', 'Invite members'),
        m(CompactModalExitButton),
      ]),
      m('.compact-modal-body', [
        m('form.login-option', [
          m('form', [
            m('h4', 'Option 1: Add member by address'),
            m(DropdownFormField, {
              name: 'invitedAddressChain',
              choices: chains,
              oncreate: (vvnode) => {
                const result = $(vvnode.dom).find('select').val().toString();
                vnode.state.selectedChain = result;
                m.redraw();
              },
              callback: (result) => {
                vnode.state.selectedChain = result;
                m.redraw();
              },
            }),
            m(Input, {
              name: 'address',
              autocomplete: 'off',
              placeholder: 'Address',
              oncreate: (vvnode) => {
                $(vvnode.dom).focus();
              }
            }),
            getInviteButton('address'),
          ]),
          m('form', [
            m('h4', 'Option 2: Invite member by email'),
            m(Input, {
              name: 'emailAddress',
              autocomplete: 'off',
              placeholder: 'satoshi@protonmail.com',
            }),
            getInviteButton('email'),
          ]),
          m(CreateInviteLink),
          vnode.state.success && m('.success-message', [
            'Success! Your invite was sent',
          ]),
          vnode.state.failure && m('.error-message', [
            vnode.state.error || 'An error occurred',
          ]),
        ]),
      ]),
    ]);
  }
};

export default CreateInviteModal;
