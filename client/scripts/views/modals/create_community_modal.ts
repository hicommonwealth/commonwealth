// import 'modals/create_community_modal.scss';
import 'modals/manage_community_modal.scss';

import m from 'mithril';
import $ from 'jquery';
import app from 'state';
import { slugify } from 'utils';
import mixpanel from 'mixpanel-browser';
import { Table, Tabs, TabItem, Button } from 'construct-ui';
import { CompactModalExitButton } from 'views/modal';
import { notifyError } from 'controllers/app/notifications';
import { InputPropertyRow, TogglePropertyRow } from './manage_community_modal/metadata_rows';
import { initAppState } from '../../app';



interface OffchainCommunityFormAttrs {}
interface OffchainCommunityFormState {
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

const OffchainCommunityForm: m.Component<OffchainCommunityFormAttrs, OffchainCommunityFormState> = {
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
  view: (vnode) => {
    return m('.compact-modal-body-max', [
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
    ]);
  }
};

interface SubstrateFormAttrs {}

interface SubstrateFormState {
  name: string,
  nodeUrl: string,
  symbol: string,
  website: string,
  discord: string,
  element: string,
  telegram: string,
  github: string,
  description: string,
}

const SubstrateForm: m.Component<SubstrateFormAttrs, SubstrateFormState> = {
  oninit: (vnode) => {
    vnode.state.name = '';
    vnode.state.nodeUrl = '';
    vnode.state.symbol = '';
    vnode.state.website = '';
    vnode.state.discord = '';
    vnode.state.element = '';
    vnode.state.telegram = '';
    vnode.state.github = '';
    vnode.state.description = '';
  },
  view: (vnode) => {
    return m('.compact-modal-body-max', [
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
          title: 'Node URL',
          defaultValue: vnode.state.nodeUrl,
          placeholder: 'wss://',
          onChangeHandler: (v) => { vnode.state.nodeUrl = v; },
        }),
        m(InputPropertyRow, {
          title: 'Symbol',
          defaultValue: vnode.state.symbol,
          placeholder: 'XYZ',
          onChangeHandler: (v) => { vnode.state.symbol = v; },
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
      ]),
      m(Button, {
        label: 'Save changes',
        intent: 'primary',
        onclick: async (e) => {
          const {
            name,
            description,
            nodeUrl,
            symbol,
            website,
            discord,
            element,
            telegram,
            github,
          } = vnode.state;
          try {
            $.post(`${app.serverUrl()}/addChainNode`, {
              name,
              description,
              node_url : nodeUrl,
              symbol,
              website,
              discord,
              element,
              telegram,
              github,
              jwt: app.user.jwt,
              type: 'chain',
              id: slugify(name),
              base: 'substrate',
              network: slugify(name)
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
    ]);
  }
};


interface CreateCommunityAttrs {}
interface CreateCommunityState {
  activeForm: string;
}

const CreateCommunityModal: m.Component<CreateCommunityAttrs, CreateCommunityState> = {
  oncreate: () => {
    mixpanel.track('New Community', {
      'Step No': 1,
      'Step': 'Modal Opened'
    });
  },
  oninit: (vnode) => {
    vnode.state.activeForm = 'offchain';
  },
  view: (vnode: m.VnodeDOM<CreateCommunityAttrs, CreateCommunityState>) => {
    return m('.ManageCommunityModal', [
      m('.compact-modal-title', [
        m('h3', 'New Commonwealth Community'),
        m(CompactModalExitButton),
      ]),
      m(Tabs, {
        align: 'center',
        bordered: false,
        fluid: true,
      }, [
        m(TabItem, {
          label: 'Offchain Community',
          active: vnode.state.activeForm === 'offchain',
          onclick: () => { vnode.state.activeForm = 'offchain'; return null; },
        }),
        m(TabItem, {
          label: 'Substrate',
          active: vnode.state.activeForm === 'substrate',
          onclick: () => { vnode.state.activeForm = 'substrate'; return null; },
        }),
      ]),
      vnode.state.activeForm === 'offchain' ? m(OffchainCommunityForm) : m(SubstrateForm)
    ]);
  }
};

export default CreateCommunityModal;
