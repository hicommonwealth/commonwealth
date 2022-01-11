import 'components/addresses/address_input_typeahead.scss';

import m from 'mithril';
import $ from 'jquery';
import User from 'views/components/widgets/user';
import { AddressInfo } from 'models';
import { InputSelect, ListItem } from 'construct-ui';

import app from 'state';

interface AddressInputTypeaheadItem {
  name: string;
  address: string;
  chain: string;
  permission: string;
}

const AddressInputTypeahead: m.Component<{ options: any, oninput }, { selectedItem, typeaheadAddresses, loading, initialized }> = {
  oncreate: (vnode) => {
    if (vnode.attrs.options.placeholder) {
      $(vnode.dom).find('input').attr('placeholder', vnode.attrs.options.placeholder).attr('autocomplete', 'xyz123');
    }
  },
  view: (vnode) => {
    const { options, oninput } = vnode.attrs;

    if (!vnode.state.initialized) {
      vnode.state.initialized = true;
      vnode.state.loading = true;
      $.get(`${app.serverUrl()}/bulkMembers`, {
        chain: app.activeChainId(),
      }).then((response) => {
        vnode.state.typeaheadAddresses = response.result.map((role) => {
          const res = {
            chain: role.Address.chain,
            address: role.Address.address,
            name: role.Address.name,
            permission: role.permission,
          };
          return res;
        });
        vnode.state.loading = false;
        m.redraw();
      }).catch((err) => {
        console.error('bulkMembers did not return');
        vnode.state.loading = false;
        m.redraw();
      });
    }

    return m(InputSelect, {
      class: `AddressInputTypeahead ${options.class}`,
      cacheItems: true,
      checkmark: false,
      closeOnSelect: true,
      itemRender: (item: AddressInputTypeaheadItem) => m(ListItem, {
        label: [
          m(User, {
            user: new AddressInfo(null, item.address, item.chain, null),
            avatarOnly: true,
            avatarSize: 18,
          }),
          item.name ? [
            m('strong', item.name),
            ' ',
            m('span.lighter', item.address),
          ] : item.address
        ],
        selected: vnode.state.selectedItem && vnode.state.selectedItem.address === item.address
      }),
      itemPredicate: (query: string, item: AddressInputTypeaheadItem) => {
        return item.address.toLowerCase().includes(query.toLowerCase())
          || item.name?.toLowerCase().includes(query.toLowerCase());
      },
      onSelect: (item: AddressInputTypeaheadItem) => {
        vnode.state.selectedItem = item;
        if (oninput) oninput(item);
        m.redraw();
      },
      inputAttrs: {
        fluid: options.fluid,
        placeholder: options.placeholder,
        autocomplete: 'xyz123',
      },
      popoverAttrs: {
        hasArrow: false,
        class: 'AddressInputTypeaheadPopover',
        portalAttrs: {
          class: 'AddressInputTypeaheadPopoverPortal',
        }
      },
      value: vnode.state.selectedItem?.address,
      items: vnode.state.typeaheadAddresses,
      loading: vnode.state.loading,
    });
  }
};

export default AddressInputTypeahead;
