import React from 'react';

import { ClassComponent, ResultNode, redraw } from 'mithrilInterop';

import 'components/address_input_typeahead.scss';
import $ from 'jquery';

import app from 'state';
import { User } from 'views/components/user/user';
import { CWText } from './component_kit/cw_text';

type AddressInputTypeaheadItem = {
  address: string;
  chain: string;
  name: string;
  permission: string;
};

type AddressInputTypeaheadAttrs = {
  onInput: (item: AddressInputTypeaheadItem) => void;
  options: { placeholder: string; fluid: boolean };
};

export class AddressInputTypeahead extends ClassComponent<AddressInputTypeaheadAttrs> {
  private initialized: boolean;
  private loading: boolean;
  private selectedItem: AddressInputTypeaheadItem;
  private typeaheadAddresses: Array<AddressInputTypeaheadItem>;

  oncreate(vnode: ResultNode<AddressInputTypeaheadAttrs>) {
    if (vnode.attrs.options.placeholder) {
      $(vnode.dom)
        .find('input')
        .attr('placeholder', vnode.attrs.options.placeholder)
        .attr('autoComplete', 'xyz123');
    }
  }

  view(vnode: ResultNode<AddressInputTypeaheadAttrs>) {
    const { options, onInput } = vnode.attrs;

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
          redraw();
        })
        .catch(() => {
          console.error('bulkMembers did not return');
          this.loading = false;
          redraw();
        });
    }
    return null;
    // return render(InputSelect, {
    //   class: 'AddressInputTypeahead',
    //   cacheItems: true,
    //   checkmark: false,
    //   closeOnSelect: true,
    //   itemRender: (item: AddressInputTypeaheadItem) =>
    //     render(ListItem, {
    //       label: (
    //         <div className="item-container">
    //           {render(User, {
    //             user: new AddressInfo(null, item.address, item.chain, null),
    //             avatarOnly: true,
    //             avatarSize: 18,
    //           })}
    //           {item.name ? (
    //             <div className="item-and-address">
    //               <CWText noWrap type="caption" fontWeight="medium">
    //                 {item.name}
    //               </CWText>
    //               <CWText noWrap type="caption" className="address-text">
    //                 {item.address}
    //               </CWText>
    //             </div>
    //           ) : (
    //             <CWText noWrap type="caption" fontWeight="medium">
    //               {item.address}
    //             </CWText>
    //           )}
    //         </div>
    //       ),
    //       selected:
    //         this.selectedItem && this.selectedItem.address === item.address,
    //     }),
    //   itemPredicate: (query: string, item: AddressInputTypeaheadItem) => {
    //     return (
    //       item.address.toLowerCase().includes(query.toLowerCase()) ||
    //       item.name?.toLowerCase().includes(query.toLowerCase())
    //     );
    //   },
    //   onSelect: (item: AddressInputTypeaheadItem) => {
    //     this.selectedItem = item;
    //     if (onInput) onInput(item);
    //     redraw();
    //   },
    //   inputAttrs: {
    //     fluid: options.fluid,
    //     placeholder: options.placeholder,
    //     autoComplete: 'xyz123',
    //   },
    //   popoverAttrs: {
    //     hasArrow: false,
    //     class: 'AddressInputTypeaheadPopover',
    //     portalAttrs: {
    //       class: 'AddressInputTypeaheadPopoverPortal',
    //     },
    //   },
    //   value: this.selectedItem?.address,
    //   items: this.typeaheadAddresses,
    //   loading: this.loading,
    // });
  }
}
