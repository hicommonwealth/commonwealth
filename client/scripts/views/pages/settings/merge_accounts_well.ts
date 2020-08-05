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
import SelectAddressModal from '../../modals/select_address_modal';

interface IAddressSelectListAttrs {
  addresses: AddressInfo[];
  onSelect: Function;
  label: string;
}

const AddressSelectList: m.Component<IAddressSelectListAttrs, { selectedAddress: AddressInfo, }> = {
  view: (vnode) => {
    return m(SelectList, {
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
          selected: (vnode.state.selectedAddress === address),
        });
      },
      items: vnode.attrs.addresses,
      onSelect: (address: AddressInfo) => { vnode.attrs.onSelect(address); vnode.state.selectedAddress = address; m.redraw(); },
      trigger: m(Button, {
        align: 'left',
        class: 'tag-selection-drop-menu',
        compact: true,
        iconRight: Icons.CHEVRON_DOWN,
        label: vnode.state.selectedAddress
          ? [
            // m(Icon, { name: Icons.CHEVRON_DOWN, }),
            m('span.tag-name', vnode.state.selectedAddress.address)
          ]
          : vnode.attrs.label,
      }),
    });
  },
};

const MergeAccountsWell: m.Component<{}, {address1: AddressInfo; address2: AddressInfo;}> = {
  oninit: (vnode) => {
  },
  view: (vnode) => {
    const addresses = app.user.addresses;

    return m('.MergeAccountsWell', [
      m('h4', 'Merge Addresses'),
      m('p', 'Warning: This will merge all of your threads, comments, reactions, and roles from the first address to the second address. This is not reversible.'),
      m(AddressSelectList, {
        label: 'Select address to be merged',
        addresses,
        onSelect: (address: AddressInfo) => { vnode.state.address1 = address; m.redraw(); }
      }),
      m(Icon, { name: Icons.ARROW_RIGHT }),
      m(AddressSelectList, {
        label: 'Select final address to own all content',
        addresses,
        onSelect: (address: AddressInfo) => { vnode.state.address2 = address; m.redraw(); }
      }),
    ]);
  }
};

export default MergeAccountsWell;
