import $ from 'jquery';
import m from 'mithril';
import { Table, Button } from 'construct-ui';

import { CommunityInfo, ChainInfo } from 'models';
import { notifyError } from 'controllers/app/notifications';
import { InputPropertyRow, TogglePropertyRow, ManageRolesRow } from './metadata_rows';

interface ICommunityMetadataManagementState {
  name: string;
  description: string;
  iconUrl: string;
  invitesEnabled: boolean;
  privacyEnabled: boolean;
  website: string;
  discord: string;
  element: string;
  telegram: string;
  github: string;
  stagesEnabled: boolean;
  additionalStages: string;
  customDomain: string;
  terms: string;
}

export interface IChainOrCommMetadataManagementAttrs {
  community?: CommunityInfo;
  chain?: ChainInfo;
  onRoleUpdate: Function;
  admins;
  mods;
}

const CommunityMetadataManagementTable:
m.Component<IChainOrCommMetadataManagementAttrs, ICommunityMetadataManagementState> = {
  oninit: (vnode) => {
    vnode.state.name = vnode.attrs.community.name;
    vnode.state.description = vnode.attrs.community.description;
    vnode.state.iconUrl = vnode.attrs.community.iconUrl;
    vnode.state.website = vnode.attrs.community.website;
    vnode.state.discord = vnode.attrs.community.discord;
    vnode.state.element = vnode.attrs.community.element;
    vnode.state.telegram = vnode.attrs.community.telegram;
    vnode.state.github = vnode.attrs.community.github;
    vnode.state.stagesEnabled = vnode.attrs.community.stagesEnabled;
    vnode.state.additionalStages = vnode.attrs.community.additionalStages;
    vnode.state.customDomain = vnode.attrs.community.customDomain;
    vnode.state.terms = vnode.attrs.community.terms;
  },
  view: (vnode) => {
    return m('.CommunityMetadataManagementTable', [m(Table, {
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
        title: 'Stages',
        defaultValue: vnode.attrs.community.stagesEnabled,
        onToggle: (checked) => { vnode.state.stagesEnabled = checked; },
        caption: (checked) => checked
          ? 'Show proposal progress on threads'
          : 'Don\'t show progress on threads',
      }),
      m(InputPropertyRow, {
        title: 'Custom Stages',
        defaultValue: vnode.state.additionalStages,
        placeholder: '["Temperature Check", "Consensus Check"]',
        onChangeHandler: (v) => { vnode.state.additionalStages = v; },
      }),
      m(InputPropertyRow, {
        title: 'Domain',
        defaultValue: vnode.state.customDomain,
        placeholder: 'gov.edgewa.re',
        onChangeHandler: (v) => { vnode.state.customDomain = v; },
      }),
      m(InputPropertyRow, {
        title: 'Terms of Service',
        defaultValue: vnode.state.terms,
        placeholder: 'Url that new users see',
        onChangeHandler: (v) => { vnode.state.terms = v; },
      }),
      m(TogglePropertyRow, {
        title: 'Privacy',
        defaultValue: vnode.attrs.community.privacyEnabled,
        onToggle: (checked) => { vnode.state.privacyEnabled = checked; },
        caption: (checked) => checked ? 'Threads are private to members' : 'Threads are visible to the public',
      }),
      m(TogglePropertyRow, {
        title: 'Invites',
        defaultValue: vnode.attrs.community.invitesEnabled,
        onToggle: (checked) => { vnode.state.invitesEnabled = checked; },
        caption: (checked) => checked ? 'Anyone can invite new members' : 'Admins/mods can invite new members',
      }),
      m('tr', [
        m('td', 'Admins'),
        m('td', [ m(ManageRolesRow, {
          roledata: vnode.attrs.admins,
          onRoleUpdate: (oldRole, newRole) => { vnode.attrs.onRoleUpdate(oldRole, newRole); },
        }), ]),
      ]),
      vnode.attrs.mods.length > 0
        && m('tr', [
          m('td', 'Moderators'),
          m('td', [ m(ManageRolesRow, {
            roledata: vnode.attrs.mods,
            onRoleUpdate: (oldRole, newRole) => { vnode.attrs.onRoleUpdate(oldRole, newRole); },
          }), ])
        ]),
    ]),
    m(Button, {
      label: 'Save changes',
      intent: 'primary',
      rounded: true,
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
          stagesEnabled,
          additionalStages,
          customDomain,
          terms,
          invitesEnabled,
          privacyEnabled,
        } = vnode.state;
        try {
          await vnode.attrs.community.updateCommunityData({
            name,
            description,
            iconUrl,
            website,
            discord,
            element,
            telegram,
            github,
            stagesEnabled,
            additionalStages,
            customDomain,
            terms,
            privacyEnabled,
            invitesEnabled,
          });
          $(e.target).trigger('modalexit');
        } catch (err) {
          notifyError(err.responseJSON?.error || 'Community update failed');
        }
      },
    }),
    ]);
  },
};

export default CommunityMetadataManagementTable;
