/* @jsx m */

import m from 'mithril';
import $ from 'jquery';
import { InputSelect, ListItem } from 'construct-ui';

import 'components/address_input_typeahead.scss';

import app from 'state';
import User from 'views/components/widgets/user';
import { AddressInfo } from 'models';
import { CWText } from './component_kit/cw_text';

type AddressInputTypeaheadItem = {
  address: string;
  chain: string;
  name: string;
  permission: string;
};

export class AddressInputTypeahead
  implements m.ClassComponent<{ options: any; oninput }>
{
  private initialized: boolean;
  private loading: boolean;
  private selectedItem: AddressInputTypeaheadItem;
  private typeaheadAddresses: Array<AddressInputTypeaheadItem>;

  oncreate(vnode) {
    if (vnode.attrs.options.placeholder) {
      $(vnode.dom)
        .find('input')
        .attr('placeholder', vnode.attrs.options.placeholder)
        .attr('autocomplete', 'xyz123');
    }
  }

  view(vnode) {
    const { options, oninput } = vnode.attrs;

    if (!this.initialized) {
      this.initialized = true;
      this.loading = true;

      $.get(`${app.serverUrl()}/bulkMembers`, {
        chain: app.activeChainId(),
      })
        .then((response) => {
          this.typeaheadAddresses = response.result.map((role) => {
            const res = {
              chain: role.Address.chain,
              address: role.Address.address,
              name: role.Address.name,
              permission: role.permission,
            };
            return res;
          });
          this.loading = false;
          m.redraw();
        })
        .catch(() => {
          console.error('bulkMembers did not return');
          this.loading = false;
          m.redraw();
        });
    }

    return m(InputSelect, {
      class: 'AddressInputTypeahead',
      cacheItems: true,
      checkmark: false,
      closeOnSelect: true,
      itemRender: (item: AddressInputTypeaheadItem) =>
        m(ListItem, {
          label: (
            <div class="item-container">
              {m(User, {
                user: new AddressInfo(null, item.address, item.chain, null),
                avatarOnly: true,
                avatarSize: 18,
              })}
              {item.name ? (
                <div class="item-and-address">
                  <CWText noWrap type="caption" fontWeight="medium">
                    {item.name}
                  </CWText>
                  <CWText noWrap type="caption" className="address-text">
                    {item.address}
                  </CWText>
                </div>
              ) : (
                <CWText noWrap type="caption" fontWeight="medium">
                  {item.address}
                </CWText>
              )}
            </div>
          ),
          selected:
            this.selectedItem && this.selectedItem.address === item.address,
        }),
      itemPredicate: (query: string, item: AddressInputTypeaheadItem) => {
        return (
          item.address.toLowerCase().includes(query.toLowerCase()) ||
          item.name?.toLowerCase().includes(query.toLowerCase())
        );
      },
      onSelect: (item: AddressInputTypeaheadItem) => {
        this.selectedItem = item;
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
        },
      },
      value: this.selectedItem?.address,
      items: this.typeaheadAddresses,
      loading: this.loading,
    });
  }
}
