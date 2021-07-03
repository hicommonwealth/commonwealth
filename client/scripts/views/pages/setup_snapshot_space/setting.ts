import 'pages/setup_snapshot_space.scss';

import m from 'mithril';
import { Input, Button, FormGroup, Icon, Icons } from 'construct-ui';

import app from 'state';
import Sublayout from 'views/sublayout';
import { getSpaceUri } from 'helpers/snapshot_utils/snapshot_utils';

const SearchPage : m.Component<{scope: string}, {
  isOwner: boolean,
  isAdmin: boolean,
  currentContentHash: String
}> = {
  oninit: async (vnode) => {
    vnode.state.isOwner = false;
    vnode.state.isAdmin = false;
    vnode.state.currentContentHash = await getSpaceUri(vnode.attrs.scope);
  },
  view: (vnode) => {
    const contentHash = () => {
      const key = encodeURIComponent(vnode.attrs.scope);
      const address = app.activeId()
        ? app.user.activeAccount.address
        : '<your-address>';
      return `ipns://storage.snapshot.page/registry/${address}/${key}`;
    }

    const isAdmin = () => {
      if (!app.snapshot.spaces[vnode.attrs.scope]) return false;
      const admins = (app.snapshot.spaces[vnode.attrs.scope].admins || []).map(admin =>
        admin.toLowerCase()
      );
      return admins.includes(app.user.activeAccount?.address.toLowerCase());
    }

    vnode.state.isOwner = vnode.state.currentContentHash === contentHash();
    vnode.state.isAdmin = isAdmin();
    return m(Sublayout, {
        class: 'SetupSnapshotPage',
        title: [
          'Create a new snapshot space'
        ],
        alwaysShowTitle: true,
        hideSearch: true,
      },
      m('.setup-container', [
        m('h2', 'ENS'),
        m(FormGroup, [
          m(Input, {
            name: 'title',
            autofocus: true,
            autocomplete: 'off',
            readonly: true,
            value: contentHash(),
          }),
        ]),
        m(FormGroup, [
          m(Button, {
            intent: 'primary',
            rounded: true,
            label: vnode.state.isOwner || vnode.state.isAdmin ? m('span', ['See record on ENS', m(Icon, {style: 'margin: -5px 0 0 10px;', name: Icons.EXTERNAL_LINK })])
              : m('span', ['See record on ENS', m(Icon, {style: 'margin: -5px 0 0 10px;', name: Icons.EXTERNAL_LINK })]),
            onclick: (e) => {
              e.preventDefault();
              document.location = `https://app.ens.domains/name/${vnode.attrs.scope}` as any;
            },
          }),
        ]),
      ]),
      vnode.state.isOwner || vnode.state.isAdmin && m('.profile', 
        m('h2', 'Profile'),
        m(FormGroup, [
          m(Input, {
            name: 'Name',
            autofocus: true,
            autocomplete: 'off',
            required: true,
          }),
        ]),
        m(FormGroup, [
          m(Input, {
            name: 'About',
            autofocus: true,
            autocomplete: 'off',
            required: true,
          }),
        ]),
        m(FormGroup, [
          m(Input, {
            name: 'title',
            autofocus: true,
            autocomplete: 'off',
            required: true,
          }),
        ]),
        m(FormGroup, [
          m(Input, {
            name: 'Avatar',
            autofocus: true,
            autocomplete: 'off',
          }),
        ]),
        m(FormGroup, [
          m(Input, {
            name: 'Network',
            autofocus: true,
            autocomplete: 'off',
          }),
        ]),
        m(FormGroup, [
          m(Input, {
            name: 'Symbol',
            autofocus: true,
            autocomplete: 'off',
            required: true,
          }),
        ]),
        m(FormGroup, [
          m(Button, {
            intent: 'primary',
            rounded: true,
            label: 'Default Skin',
            onclick: (e) => {
              e.preventDefault();
            },
          }),
        ]),
        m(FormGroup, [
          m(Input, {
            name: 'Twitter',
            autofocus: true,
            autocomplete: 'off',
            required: true,
          }),
        ]),
        m(FormGroup, [
          m(Input, {
            name: 'Github',
            autofocus: true,
            autocomplete: 'off',
            required: true,
          }),
        ]),
      )
    );
  }
};

export default SearchPage;
