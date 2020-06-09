import 'modals/create_invite_modal.scss';

import m from 'mithril';
import $ from 'jquery';
import mixpanel from 'mixpanel-browser';

import app from 'state';
import { formatAsTitleCase } from 'helpers';
import { CreateInviteLink } from 'views/pages/admin';

import { CommunityInfo } from 'models';

import { inputModalWithText } from 'views/modals/input_modal';
import { CompactModalExitButton } from 'views/modal';
import { DropdownFormField } from 'views/components/forms';

interface ICreateInviteModalAttrs {
  communityInfo: CommunityInfo;
}

interface ICreateInviteModalState {
  success: boolean;
  failure: boolean;
  disabled: boolean;
  error: string;
  selectedChain: string;
}

const CreateInviteModal: m.Component<ICreateInviteModalAttrs, ICreateInviteModalState> = {
  oncreate: (vnode) => {
    mixpanel.track('New Invite', {
      'Step No': 1,
      'Step': 'Modal Opened'
    });
  },
  view: (vnode: m.VnodeDOM<ICreateInviteModalAttrs, ICreateInviteModalState>) => {
    const { communityInfo } = vnode.attrs;
    const { name, id, privacyEnabled, invitesEnabled, defaultChain } = communityInfo;

    const chains = app.config.chains.getAll().map((chain) => ({
      name: 'invitedAddressChain',
      label: chain.name,
      value: chain.id,
    }));

    const getInviteButton = (selection) => {
      return m('button.create-invite-button', {
        class: vnode.state.disabled ? 'disabled' : '',
        type: 'submit',
        label: selection,
        onclick: (e) => {
          e.preventDefault();
          const address = $(vnode.dom).find('[name="address"]').val();
          const emailAddress = $(vnode.dom).find('[name="emailAddress"]').val();

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
            address: app.vm.activeAccount.address,
            author_chain: app.vm.activeAccount.chain,
            community: id,
            invitedAddress: selection === 'address' ? address : '',
            invitedAddressChain: selection === 'address' ? vnode.state.selectedChain : '',
            invitedEmail: selection === 'email' ? emailAddress : '',
            auth: true,
            jwt: app.login.jwt,
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
      }, selection === 'address' ? 'Add member' : selection === 'email' ? 'Invite email' : 'Add');
    };

    return m('.CreateInviteModal', [
      m('h3', 'Invite members'),
      m(CompactModalExitButton),
      m('form.login-option', [
        m('p.selected-community', [
          m('.community-name', [
            name,
            privacyEnabled && m('span.icon-lock'),
          ]),
          m('.community-url', `commonwealth.im/${id}`),
        ]),
        m('form', [
          m('h4', 'Option 1: Add member by address'),
          m(DropdownFormField, {
            name: 'invitedAddressChain',
            choices: chains,
            oncreate: (vnode2) => {
              const result = $(vnode2.dom).find('select').val().toString();
              vnode.state.selectedChain = result;
              m.redraw();
            },
            callback: (result) => {
              vnode.state.selectedChain = result;
              m.redraw();
            },
          }),
          m('input[type="text"]', {
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
          m('input[type="text"]', {
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
    ]);
  }
};

export default CreateInviteModal;
