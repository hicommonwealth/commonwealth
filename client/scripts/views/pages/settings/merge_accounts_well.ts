import 'pages/settings/settings_well.scss';

import m from 'mithril';
import app from 'state';
import $ from 'jquery';

import { DropdownFormField, RadioSelectorFormField } from 'views/components/forms';
import { notifySuccess } from 'controllers/app/notifications';
import SettingsController from 'controllers/app/settings';
import { selectNode, initChain } from 'app';
import { AddressInfo } from 'models';
import { Icon, Icons, Button, Input, SelectList, ListItem } from 'construct-ui';

const MergeAccountsWell: m.Component<{}, {address1: AddressInfo; address2: AddressInfo;}> = {
  oninit: (vnode) => {
  },
  view: (vnode) => {
    const addresses = app.user.addresses;

    return m('.MergeAccountsWell', [
      m('h4', 'Merge Addresses'),
      m('p', 'Warning: This will merge all of your threads, comments, reactions, and roles from the first address to the second address. This is not reversible.'),
      m(SelectList, {
        class: 'TagSelector',
        filterable: false,
        checkmark: false,
        closeOnSelect: true,
        itemRender: (address: AddressInfo) => {
          return m(ListItem, {
            class: 'account',
            label: [
              m(Icon, { name: Icons.USER, }),
              m('span', address.address),
            ],
            selected: (vnode.state.address1 === address),
          });
        },
        items: addresses,
        onSelect: (address: AddressInfo) => { vnode.state.address1 = address; m.redraw(); console.dir(vnode.state.address1); },
        trigger: m(Button, {
          align: 'left',
          class: 'tag-selection-drop-menu',
          compact: true,
          iconRight: Icons.CHEVRON_DOWN,
          label: vnode.state.address1
            ? [
              // m(Icon, { name: Icons.CHEVRON_DOWN, }),
              m('span.tag-name', vnode.state.address1.address)
            ]
            : '',
        }),
      })
    ]);
  }
};

export default MergeAccountsWell;
