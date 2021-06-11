// import 'modals/create_community_modal.scss';
import 'modals/manage_community_modal.scss';

import m from 'mithril';
import $ from 'jquery';
import app from 'state';
import mixpanel from 'mixpanel-browser';
import { Table, Button } from 'construct-ui';
import { CompactModalExitButton } from 'views/modal';
import { notifyError } from 'controllers/app/notifications';
import { InputPropertyRow, TogglePropertyRow } from './manage_community_modal/metadata_rows';
import { initAppState } from '../../app';


interface IAttrs {}

interface IState {
  disabled: boolean;
  error: string;
  success: string | boolean;
  name: string;
  description: string;
  iconUrl: string;
  invitesEnabled: boolean;
  privacyEnabled: boolean;
  isAuthenticatedForum: boolean;
  website: string;
  discord: string;
  element: string;
  telegram: string;
  github: string;
}

const CreateCommunityModal: m.Component<IAttrs, IState> = {
  oncreate: () => {
    mixpanel.track('New Community', {
      'Step No': 1,
      'Step': 'Modal Opened'
    });
  },
  oninit: (vnode) => {
    vnode.state.name = '';
    vnode.state.description = '';
    vnode.state.iconUrl = '';
    vnode.state.website = '';
    vnode.state.discord = '';
    vnode.state.element = '';
    vnode.state.telegram = '';
    vnode.state.github = '';
    vnode.state.isAuthenticatedForum = false;
    vnode.state.privacyEnabled = false;
    vnode.state.invitesEnabled = false;
  },
  view: (vnode: m.VnodeDOM<IAttrs, IState>) => {
    return m('.ManageCommunityModal', [
      m('.compact-modal-title', [
        m('h3', 'New Commonwealth Community'),
        m(CompactModalExitButton),
      ]),
      m('.compact-modal-body-max', [
        m('.CommunityMetadataManagementTable', [m(Table, {
          bordered: false,
          interactive: false,
          striped: false,
          class: 'metadata-management-table',
        }, [
          m(InputPropertyRow, {
            title: 'Name',
            defaultValue: vnode.state.name,
            onChangeHandler: (v) => { vnode.state.name = v; },
          }),
          m(InputPropertyRow, {
            title: 'Description',
            defaultValue: vnode.state.description,
            onChangeHandler: (v) => { vnode.state.description = v; },
            textarea: true,
          }),
          m(InputPropertyRow, {
            title: 'Website',
            defaultValue: vnode.state.website,
            placeholder: 'https://example.com',
            onChangeHandler: (v) => { vnode.state.website = v; },
          }),
          m(InputPropertyRow, {
            title: 'Discord',
            defaultValue: vnode.state.discord,
            placeholder: 'https://discord.com/invite',
            onChangeHandler: (v) => { vnode.state.discord = v; },
          }),
          m(InputPropertyRow, {
            title: 'Element',
            defaultValue: vnode.state.element,
            placeholder: 'https://matrix.to/#',
            onChangeHandler: (v) => { vnode.state.element = v; },
          }),
          m(InputPropertyRow, {
            title: 'Telegram',
            defaultValue: vnode.state.telegram,
            placeholder: 'https://t.me',
            onChangeHandler: (v) => { vnode.state.telegram = v; },
          }),
          m(InputPropertyRow, {
            title: 'Github',
            defaultValue: vnode.state.github,
            placeholder: 'https://github.com',
            onChangeHandler: (v) => { vnode.state.github = v; },
          }),
          m(TogglePropertyRow, {
            title: 'Privacy',
            defaultValue: vnode.state.privacyEnabled,
            onToggle: (checked) => { vnode.state.privacyEnabled = checked; },
            caption: (checked) => checked ? 'Threads are private to members' : 'Threads are visible to the public',
          }),
          m(TogglePropertyRow, {
            title: 'Invites',
            defaultValue: vnode.state.invitesEnabled,
            onToggle: (checked) => { vnode.state.invitesEnabled = checked; },
            caption: (checked) => checked ? 'Anyone can invite new members' : 'Admins/mods can invite new members',
          }),
        ]),
        m(Button, {
          label: 'Save changes',
          intent: 'primary',
          onclick: async (e) => {
            const {
              name,
              description,
              iconUrl,
              website,
              discord,
              element,
              telegram,
              github,
              invitesEnabled,
              privacyEnabled,
              isAuthenticatedForum,
            } = vnode.state;
            try {
              $.post(`${app.serverUrl()}/createCommunity`, {
                name,
                description,
                iconUrl,
                website,
                discord,
                element,
                telegram,
                github,
                invitesEnabled,
                privacyEnabled,
                isAuthenticatedForum,
                jwt: app.user.jwt,
              }).then(async (res) => {
                await initAppState(false);
                $(e.target).trigger('modalexit');
                m.route.set(`/${res.result.id}`);
              });
            } catch (err) {
              notifyError(err.responseJSON?.error || 'Creating new community failed');
            }
          },
        }),
        ]),
      ]),
    ]);
  }
};

export default CreateCommunityModal;
