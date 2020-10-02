import 'modals/create_invite_modal.scss';

import m from 'mithril';
import $ from 'jquery';
import mixpanel from 'mixpanel-browser';
import { Button, Input, Form, FormGroup, FormLabel, Select } from 'construct-ui';

import app from 'state';
import { CommunityInfo, ChainInfo } from 'models';
import { CompactModalExitButton } from 'views/modal';

interface IInviteButtonAttrs {
  selection: string,
  successCallback: Function,
  failureCallback: Function,
  invitedAddress?: string,
  invitedEmail?: string,
  invitedAddressChain?: string,
  community?: CommunityInfo,
  chain?: ChainInfo,
}

const InviteButton: m.Component<IInviteButtonAttrs, { disabled: boolean, }> = {
  oninit: (vnode) => {
    vnode.state.disabled = false;
  },
  view: (vnode) => {
    const { selection, successCallback, failureCallback,
      invitedAddress, invitedEmail, invitedAddressChain, community, chain } = vnode.attrs;
    return m(Button, {
      class: 'create-invite-button',
      intent: 'primary',
      name: selection,
      loading: vnode.state.disabled,
      type: 'submit',
      label: selection === 'address'
        ? 'Invite Commonwealth user' : selection === 'email' ? 'Invite email' : 'Add',
      onclick: (e) => {
        e.preventDefault();
        console.log(vnode.attrs);
        const address = invitedAddress;
        const emailAddress = invitedEmail;
        const selectedChain = invitedAddressChain;

        if (selection !== 'address' && selection !== 'email') return;
        if (selection === 'address' && (address === '' || address === null)) return;
        if (selection === 'email' && (emailAddress === '' || emailAddress === null)) return;

        vnode.state.disabled = true;
        successCallback(false);
        failureCallback(false);

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

        const chainOrCommunityObj = chain ? { chain: chain.id }
          : community ? { community:  community.id }
            : null;
        if (!chainOrCommunityObj) return;

        $.post(app.serverUrl() + postType, {
          address: app.user.activeAccount.address,
          ...chainOrCommunityObj,
          invitedAddress: selection === 'address' ? address : '',
          invitedAddressChain: selection === 'address' ? selectedChain : '',
          invitedEmail: selection === 'email' ? emailAddress : '',
          auth: true,
          jwt: app.user.jwt,
        }).then((result) => {
          vnode.state.disabled = false;
          if (result.status === 'Success') {
            successCallback(true);
          } else {
            failureCallback(true, result.message);
          }
          m.redraw();
          mixpanel.track('Invite Sent', {
            'Step No': 2,
            'Step': 'Invite Sent (Completed)'
          });
        }, (err) => {
          failureCallback(true, err.responseJSON.error);
          vnode.state.disabled = false;
          m.redraw();
        });
      }
    });
  }
};

const CreateInviteLink: m.Component<{
  chain?: ChainInfo,
  community?: CommunityInfo,
  onChangeHandler?: Function,
}, {
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
    const { chain, community, onChangeHandler } = vnode.attrs;
    const chainOrCommunityObj = chain ? { chain: chain.id }
      : { community: community.id }
    return m(Form, { class: 'CreateInviteLink' }, [
      m(FormGroup, { span: 4 }, [
        m(FormLabel, { for: 'uses', }, 'Generate invite link'),
        m(Select, {
          name: 'uses',
          defaultValue: vnode.state.inviteUses,
          options: [
            { value: 'none', label: 'Unlimited uses' },
            { value: '1', label: 'One time use' },
            // { value: '2', label: 'Twice' },
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
              // community_id: app.activeCommunityId(),
              ...chainOrCommunityObj,
              time: vnode.state.inviteTime,
              uses: vnode.state.inviteUses,
              jwt: app.user.jwt,
            }).then((response) => {
              const linkInfo = response.result;
              const url = (app.isProduction) ? 'commonwealth.im' : 'localhost:8080';
              if (onChangeHandler) onChangeHandler(linkInfo);
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
  communityInfo?: CommunityInfo;
  chainInfo?: ChainInfo;
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
    const { communityInfo, chainInfo } = vnode.attrs;
    const chainOrCommunityObj = chainInfo ? { chain: chainInfo }
      : communityInfo ? { community: communityInfo }
        : null;
    if (!chainOrCommunityObj) return;
    return m('.CreateInviteModal', [
      m('.compact-modal-title', [
        m('h3', 'Invite members'),
        m(CompactModalExitButton),
      ]),
      m('.compact-modal-body', [
        m(Form, [
          m(FormGroup, { span: 4 }, [
            m(FormLabel, { class: 'chainSelectLabel' }, 'Chain'),
            m(Select, {
              name: 'invitedAddressChain',
              defaultValue: chainInfo ? chainInfo.id : app.config.chains.getAll()[0].id,
              options: chainInfo
                ? [{ label: chainInfo.name, value: chainInfo.id, }]
                : app.config.chains.getAll().map((chain) => ({
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
              oninput: (e) => {
                vnode.state.invitedAddress = (e.target as any).value;
              }
            }),
          ]),
          m(InviteButton, {
            selection: 'address',
            successCallback: (v: boolean) => {
              vnode.state.success = v;
              m.redraw();
            },
            failureCallback: (v: boolean, err?: string,) => {
              vnode.state.failure = v;
              if (err) vnode.state.error = err;
              m.redraw();
            },
            invitedAddress: vnode.state.invitedAddress,
            invitedAddressChain: vnode.state.invitedAddressChain,
            ...chainOrCommunityObj
          }),
        ]),
        m(Form, [
          m(FormGroup, [
            m(FormLabel, 'Email'),
            m(Input, {
              fluid: true,
              name: 'emailAddress',
              autocomplete: 'off',
              placeholder: 'satoshi@protonmail.com',
              oninput: (e) => {
                vnode.state.invitedEmail = (e.target as any).value;
              }
            }),
          ]),
          m(InviteButton, {
            selection: 'email',
            successCallback: (v: boolean) => {
              vnode.state.success = v;
              m.redraw();
            },
            failureCallback: (v: boolean, err?: string,) => {
              vnode.state.failure = v;
              if (err) vnode.state.error = err;
              m.redraw();
            },
            invitedEmail: vnode.state.invitedEmail,
            ...chainOrCommunityObj
          }),
        ]),
        m(CreateInviteLink, { ...chainOrCommunityObj }),
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
