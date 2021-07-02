import 'pages/setup_snapshot_space.scss';

import m from 'mithril';
import { Input, Button, FormGroup } from 'construct-ui';

import Sublayout from 'views/sublayout';

const SearchPage : m.Component<{}, { ensName: string }> = {
  oninit: (vnode) => {
    vnode.state.ensName = '';
  },
  view: (vnode) => {
    return m(Sublayout, {
        class: 'SetupSnapshotPage',
        title: [
          'Create a new snapshot space'
        ],
        alwaysShowTitle: true,
        hideSearch: true,
      },
      m('.setup-container', [
        m('h2', 'Use an existing ENS name to create your space with.'),
        m(FormGroup, [
          m(Input, {
            placeholder: 'e.g. sushi.eth',
            name: 'title',
            autofocus: true,
            autocomplete: 'off',
            oninput: (e) => {
              const result = (e.target as any).value;
              vnode.state.ensName = result;
              m.redraw();
            },
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
