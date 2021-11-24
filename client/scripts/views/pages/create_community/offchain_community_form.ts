import 'pages/create_community.scss';

import m from 'mithril';
import app from 'state';
import { Table, Button } from 'construct-ui';
import $ from 'jquery';
import { initAppState } from 'app';
import { notifyError } from 'controllers/app/notifications';
import {
  InputPropertyRow,
  TogglePropertyRow,
  SelectPropertyRow,
} from 'views/components/metadata_rows';

type OffchainCommunityFormAttrs = Record<string, unknown>;

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
  defaultChain: string;
  saving: boolean;
}

const OffchainCommunityForm: m.Component<
  OffchainCommunityFormAttrs,
  OffchainCommunityFormState
> = {
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
    vnode.state.saving = false;
    const defaultChains = app.config.chains
      .getAll()
      .map((_) => _.id)
      .filter((chain) => app.user.getAllRolesInCommunity({ chain }).length > 0);
    vnode.state.defaultChain =
      defaultChains.length > 0 ? defaultChains[0] : 'ethereum';
  },
  view: (vnode) => {
    const defaultChains = app.config.chains
      .getAll()
      .map((_) => _.id)
      .filter((chain) => app.user.getAllRolesInCommunity({ chain }).length > 0);

    return m('.offchain-community-creation-form', [
      m('.CommunityMetadataManagementTable', [
        m(
          Table,
          {
            bordered: false,
            interactive: false,
            striped: false,
            class: 'metadata-management-table',
          },
          [
            m(InputPropertyRow, {
              title: 'Name',
              defaultValue: vnode.state.name,
              onChangeHandler: (v) => {
                vnode.state.name = v;
              },
            }),
            m(InputPropertyRow, {
              title: 'Description',
              defaultValue: vnode.state.description,
              onChangeHandler: (v) => {
                vnode.state.description = v;
              },
              textarea: true,
            }),
            m(InputPropertyRow, {
              title: 'Website',
              defaultValue: vnode.state.website,
              placeholder: 'https://example.com',
              onChangeHandler: (v) => {
                vnode.state.website = v;
              },
            }),
            m(InputPropertyRow, {
              title: 'Discord',
              defaultValue: vnode.state.discord,
              placeholder: 'https://discord.com/invite',
              onChangeHandler: (v) => {
                vnode.state.discord = v;
              },
            }),
            m(InputPropertyRow, {
              title: 'Element',
              defaultValue: vnode.state.element,
              placeholder: 'https://matrix.to/#',
              onChangeHandler: (v) => {
                vnode.state.element = v;
              },
            }),
            m(InputPropertyRow, {
              title: 'Telegram',
              defaultValue: vnode.state.telegram,
              placeholder: 'https://t.me',
              onChangeHandler: (v) => {
                vnode.state.telegram = v;
              },
            }),
            m(InputPropertyRow, {
              title: 'Github',
              defaultValue: vnode.state.github,
              placeholder: 'https://github.com',
              onChangeHandler: (v) => {
                vnode.state.github = v;
              },
            }),
            m(TogglePropertyRow, {
              title: 'Privacy',
              defaultValue: vnode.state.privacyEnabled,
              onToggle: (checked) => {
                vnode.state.privacyEnabled = checked;
              },
              caption: (checked) =>
                checked
                  ? 'Threads are private to members'
                  : 'Threads are visible to the public',
            }),
            m(TogglePropertyRow, {
              title: 'Invites',
              defaultValue: vnode.state.invitesEnabled,
              onToggle: (checked) => {
                vnode.state.invitesEnabled = checked;
              },
              caption: (checked) =>
                checked
                  ? 'Anyone can invite new members'
                  : 'Admins/mods can invite new members',
            }),
            m(SelectPropertyRow, {
              title: 'Default Chain',
              options: defaultChains,
              value: vnode.state.defaultChain,
              onchange: (value) => {
                vnode.state.defaultChain = value;
              },
            }),
          ]
        ),
        m(Button, {
          class: 'mt-3',
          label: 'Save changes',
          intent: 'primary',
          disabled: vnode.state.saving,
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
              defaultChain,
            } = vnode.state;

            vnode.state.saving = true;

            $.post(`${app.serverUrl()}/createCommunity`, {
              name,
              description,
              icon_url: iconUrl,
              website,
              discord,
              element,
              telegram,
              github,
              invites_enabled: invitesEnabled,
              privacy_enabled: privacyEnabled,
              is_authenticated_forum: isAuthenticatedForum,
              default_chain: defaultChain,
              jwt: app.user.jwt,
            })
              .then(async (res) => {
                await initAppState(false);
                m.route.set(`/${res.result.id}`);
              })
              .catch((err: any) => {
                notifyError(
                  err.responseJSON?.error || 'Creating new community failed'
                );
              })
              .always(() => {
                vnode.state.saving = false;
              });
          },
        }),
      ]),
    ]);
  },
};

export default OffchainCommunityForm;
