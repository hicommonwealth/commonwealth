import 'modals/create_invite_modal.scss';

import m from 'mithril';
import $ from 'jquery';
import mixpanel from 'mixpanel-browser';
import { Button, Input, Form, FormGroup, FormLabel, Select, CustomSelect } from 'construct-ui';

import app from 'state';
import { CommunityInfo } from 'models';
import { CompactModalExitButton } from 'views/modal';
import { DropdownFormField } from 'views/components/forms';

const CreateInviteLink: m.Component<{ onChangeHandler?: Function }, {
  link: string,
  inviteUses: string,
  inviteTime: string,
}> = {
  oninit: (vnode) => {
    vnode.state.link = '';
    vnode.state.inviteUses = 'none';
    vnode.state.inviteTime = 'none';
  },
  view: (vnode) => {
    return m(Form, { class: 'CreateInviteLink' }, [
      m(FormGroup, { span: 4 }, [
        m(FormLabel, { for: 'uses', }, 'Generate invite link'),
        m(Select, {
          name: 'uses',
          defaultValue: vnode.state.inviteUses,
          options: [
            { value: 'none', label: 'Unlimited uses' },
            { value: 1, label: 'One time use' },
            // { value: 2, label: 'Twice' },
          ],
          onchange: (e) => {
            vnode.state.inviteUses = (e.target as any).value;
          },
        }),
      ]),
      m(FormGroup, { span: 4 }, [
        m(FormLabel, { for: 'time' }, 'Expires after'),
        m(Select, {
          name: 'time',
          defaultValue: vnode.state.inviteTime,
          options: [
            { value: 'none', label: 'Never expires' },
            { value: '24h', label: '24 hours' },
            { value: '48h', label: '48 hours' },
            { value: '1w', label: '1 week' },
            { value: '30d', label: '30 days' },
          ],
          onchange: (e) => {
            vnode.state.inviteTime = (e.target as any).value;
          },
        }),
      ]),
      m(FormGroup, { span: 4 }),
      m(FormGroup, { span: 4 }, [
        m(Button, {
          type: 'submit',
          intent: 'primary',
          onclick: (e) => {
            e.preventDefault();
            // TODO: Change to POST /inviteLink
            $.post(`${app.serverUrl()}/createInviteLink`, {
              community_id: app.activeCommunityId(),
              time: vnode.state.inviteTime,
              uses: vnode.state.inviteUses,
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
      ]),
      m(FormGroup, { span: 8 }, [
        m(Input, {
          class: 'invite-link-pastebin',
          fluid: true,
          readonly: true,
          placeholder: 'Click to generate a link',
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
  invitedAddress: string;
  invitedAddressChain: string;
  invitedEmail: string;
}> = {
  oncreate: (vnode) => {
    vnode.state.invitedAddressChain = 'none';
    mixpanel.track('New Invite', {
      'Step No': 1,
      'Step': 'Modal Opened'
    });
  },
  view: (vnode) => {
    const { communityInfo } = vnode.attrs;
    const { name, id, privacyEnabled, invitesEnabled, defaultChain } = communityInfo;

    const getInviteButton = (selection) => {
      return m(Button, {
        class: 'create-invite-button',
        intent: 'primary',
        loading: vnode.state.disabled,
        type: 'submit',
        label: selection === 'address'
          ? 'Invite Commonwealth user' : selection === 'email' ? 'Invite email' : 'Add',
        onclick: (e) => {
          e.preventDefault();
          const address = vnode.state.invitedAddress;
          const emailAddress = vnode.state.invitedEmail;
          const selectedChain = vnode.state.invitedAddressChain;

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
            invitedAddressChain: selection === 'address' ? selectedChain : '',
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
        m(Form, [
          m(FormGroup, { span: 4 }, [
            m(FormLabel, 'Chain'),
            m(Select, {
              name: 'invitedAddressChain',
              defaultValue: app.config.chains.getAll()[0].id,
              options: app.config.chains.getAll().map((chain) => ({
                label: chain.name.toString(),
                value: chain.id.toString(),
              })),
              oncreate: (vvnode) => {
                vnode.state.invitedAddressChain = (vvnode.dom as any).value;
              },
              onchange: (e) => {
                vnode.state.invitedAddressChain = (e.target as any).value;
              }
            }),
          ]),
          m(FormGroup, { span: 8 }, [
            m(FormLabel, 'Address'),
            m(Input, {
              fluid: true,
              name: 'address',
              autocomplete: 'off',
              placeholder: 'Address',
              onchange: (e) => {
                vnode.state.invitedAddress = (e.target as any).value;
              }
            }),
          ]),
          getInviteButton('address'),
        ]),
        m(Form, [
          m(FormGroup, [
            m(FormLabel, 'Email'),
            m(Input, {
              fluid: true,
              name: 'emailAddress',
              autocomplete: 'off',
              placeholder: 'satoshi@protonmail.com',
              onchange: (e) => {
                vnode.state.invitedEmail = (e.target as any).value;
              }
            }),
          ]),
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
