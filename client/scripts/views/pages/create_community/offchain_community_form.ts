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
import { ChainFormState, initChainForm, defaultChainRows } from './chain_input_rows';

type OffchainCommunityFormAttrs = Record<string, unknown>;

interface OffchainCommunityFormState extends ChainFormState {
  disabled: boolean;
  error: string;
  success: string | boolean;
  name: string;
  invitesEnabled: boolean;
  privacyEnabled: boolean;
  isAuthenticatedForum: boolean;
  defaultChain: string;
  saving: boolean;
}

const OffchainCommunityForm: m.Component<
  OffchainCommunityFormAttrs,
  OffchainCommunityFormState
> = {
  oninit: (vnode) => {
    vnode.state.name = '';
    initChainForm(vnode.state);
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
    if (!defaultChains.includes('ethereum')) {
      defaultChains.splice(0, 0, 'ethereum');
    }

    return m('.CommunityMetadataManagementTable', [
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
          ...defaultChainRows(vnode.state),
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
            icon_url,
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
            icon_url,
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
    ]);
  },
};

export default OffchainCommunityForm;
