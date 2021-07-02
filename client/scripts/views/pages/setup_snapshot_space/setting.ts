import 'pages/setup_snapshot_space.scss';

import m from 'mithril';
import { Input, Button, FormGroup } from 'construct-ui';

import app from 'state';
import Sublayout from 'views/sublayout';

const SearchPage : m.Component<{scope: string}, { ensName: string }> = {
  
  oninit: (vnode) => {
    vnode.state.ensName = '';
  },
  view: (vnode) => {
    const contentHash = () => {
      const key = encodeURIComponent(vnode.attrs.scope);
      const address = app.activeId()
        ? app.user.activeAccount.address
        : '<your-address>';
      return `ipns://storage.snapshot.page/registry/${address}/${key}`;
    }
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
            label: 'Next',
            disabled: !vnode.state.ensName.includes('.eth') && !vnode.state.ensName.includes('.xyz'),
            onclick: (e) => {
              e.preventDefault();
              m.route.set(`/${vnode.state.ensName}/setting-snapshot-space`);
            },
            tabindex: 4,
            type: 'submit',
          }),
        ]),
      ])
    );
  }
};

export default SearchPage;
