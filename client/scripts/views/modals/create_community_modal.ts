import 'modals/create_community_modal.scss';

import m from 'mithril';
import $ from 'jquery';
import _ from 'lodash';
import mixpanel from 'mixpanel-browser';
import { Button, Table, Switch } from 'construct-ui';

import app from 'state';

// import User from 'views/components/widgets/user';
import { CompactModalExitButton } from 'views/modal';
import { CommunityInfo } from 'models';
import { notifyError } from 'client/scripts/controllers/app/notifications';
import { TogglePropertyRow } from './manage_community_modal/metadata_rows';

interface IAttrs { community?: CommunityInfo; }


interface IState {
  disabled: boolean;
  error: string;
  success: string | boolean;
  selectedAddress: string;
  selectedChain: string;
  privacyEnabled: boolean;
  invitesEnabled: boolean;
  iconObject: object;
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

        m(Table, {
          bordered: false,
          interactive: false,
          striped: false,
          class: 'metadata-management-table',
        }, [

          m('span', 'logos: '),
          m('input[type="file"]', {
            title: 'logo',
            name: 'iconUrl',
            lable: 'logo',
            class: 'AvtarUpload',
            placeholder: 'HELLO',
            onchange: (e) => {
              vnode.state.iconObject = e.target.files[0];
              console.log('iconurl value:', e.target.files[0]);
            },
            oncreate: (vvnode) => {
              $(vvnode.dom).focus();
            },
          }),
          m('input[type="text"]', {
            name: 'name',
            placeholder: 'Community name',
            oncreate: (vvnode) => {
              $(vvnode.dom).focus();
            },
            autocomplete: 'off',
          }),
          m('textarea', {
            title: 'Description',
            name: 'description',
            placeholder: 'Community description',
            textarea: true,
            class: 'w-100',
            oncreate: (vvnode) => {
              $(vvnode.dom).focus();
            },
          }),

          m('input[type="text"]', {
            title: 'Website',
            name: 'website',
            placeholder: 'https://example.com',
          }),
          m('input[type="text"]', {
            title: 'Discord',
            name: 'discord',
            placeholder: 'https://discord.com/invite',
          }),
          m('input[type="text"]', {
            title: 'Element',
            name: 'element',
            placeholder: 'https://matrix.to/#',
          }),
          m('input[type="text"]', {
            title: 'Telegram',
            name: 'telegram',
            placeholder: 'https://t.me',
          }),
          m('input[type="text"]', {
            title: 'Github',
            name: 'github',
            placeholder: 'https://github.com',
          }),
          // m(Button, {
          //   title: 'ADDBUTTON',
          //   name: 'addButton',
          //   onclick: (e) => {
          //     console.log("AAA", e);
          //   },
          // }),

        ]),
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
            m('label', { for: 'invites' }, ' Allow members to invite others'),
          ]),
          m('.form-field', [
            m('input[type="checkbox"]', {
              name: 'private_forum',
              id: 'private_forum',
            }),
            m('label', { for: 'private_forum' }, ' Private: Only visible to members'),
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
        m(Button, {
          class: (vnode.state.disabled || !vnode.state.selectedAddress || !vnode.state.selectedChain)
            ? 'disabled' : '',
          type: 'submit',
          onclick: (e) => {
            e.preventDefault();
            const name = $(vnode.dom).find('[name="name"]').val();
            const description = $(vnode.dom).find('[name="description"]').val();
            const chain = vnode.state.selectedChain;
            const telegram = $(vnode.dom).find('[name="telegram"]').val();
            const discord = $(vnode.dom).find('[name="discord"]').val();
            const element = $(vnode.dom).find('[name="element"]').val();
            const website = $(vnode.dom).find('[name="website"]').val();
            const github = $(vnode.dom).find('[name="github"]').val();
            // const iconUrl = vnode.state.iconObject;
            const iconUrl = $(vnode.dom).find('[name="iconUrl"]').val();
            const address = vnode.state.selectedAddress;
            // const isAuthenticatedForum = $(vnode.dom).find('[name="auth_forum"]').prop('checked');
            const privacyEnabled = $(vnode.dom).find('[name="private_forum"]').prop('checked');
            const invitesEnabled = $(vnode.dom).find('[name="invites"]').prop('checked');
            console.log('inside:');
            vnode.state.disabled = true;
            vnode.state.success = false;
            // TODO: Change to POST /community
            $.post(`${app.serverUrl()}/createCommunity`, {
              creator_address: vnode.state.selectedAddress,
              creator_chain: vnode.state.selectedChain,
              name,
              iconUrl,
              description,
              default_chain: chain,
              website,
              discord,
              element,
              telegram,
              github,
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
                result.result.iconUrl,
                result.result.website,
                result.result.discord,
                result.result.element,
                result.result.telegram,
                result.result.github,
                result.result.default_chain,
                false, // visible
                null, // customDomain
                result.result.invitesEnabled,
                result.result.privacyEnabled,
                true, // collapsedOnHomepage
                result.featured_topics,
                result.topics,
              );
              app.config.communities.add(newCommunityInfo);
              vnode.state.success = 'Sucessfully added';
              m.redraw();
              vnode.state.disabled = false;
              if (result.status === 'Success') {
                console.log('success', result);
                if (vnode.state.iconObject) {
                  const sampleFile = vnode.state.iconObject;
                  const uploadPath = `${__dirname}/static/img/protocols/${result?.id}`;
                  // sampleFile.mv(uploadPath, function (err) {
                  //   if (err) return;
                  // app.activeCommunityId()=result?.id
                  // try {
                  //   newCommunityInfo.updateCommunityData({
                  //     description,
                  //     invitesEnabled,
                  //     name,
                  //     iconUrl: uploadPath,
                  //     privacyEnabled,
                  //     website,
                  //     discord,
                  //     element,
                  //     telegram,
                  //     github,
                  //   });
                  // } catch (err) {
                  //   notifyError(err.responseJSON?.error || 'Community image upload failed');
                  // }
                  // });
                }
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
          },
          label: 'Create Create community'
        }),
        vnode.state.error && m('.create-community-message.error', [
          vnode.state.error || 'An error occurred'
        ]),
      ]),
    ]);
  }
};

export default CreateCommunityModal;
