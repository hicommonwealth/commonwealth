/* @jsx m */

import m from 'mithril';

import 'components/component_kit/cw_dropdown.scss';

import { MenuItemAttrs } from '../../menus/types';
import { CWPopoverMenu } from './cw_popover/cw_popover_menu';
import { CWPopoverMenuItem } from './cw_popover_menu_item';
import { CWTextInput } from './cw_text_input';

export type DropdownInputAttrs = {
  inputOptions: Array<MenuItemAttrs>;
  onSelect: () => void;
  initialValue?: string;
};

export class CWDropdown implements m.ClassComponent<DropdownInputAttrs> {
  private showDropdown: boolean;
  private selectedValue: string;

  oninit(vnode) {
    // eslint-disable-next-line no-restricted-globals
    // addEventListener('click', (data) => {});
    this.showDropdown = false;
    this.selectedValue =
      vnode.attrs.initialValue ?? vnode.attrs.inputOptions[0].label;
  }

  onremove(vnode) {
    // eslint-disable-next-line no-restricted-globals
    // removeEventListener('click', (data) => {});
  }

  view(vnode) {
    return (
      <div class="dropdown-wrapper">
        <CWTextInput
          iconRight="chevronDown"
          placeholder={this.selectedValue}
          displayOnly
          iconRightonclick={() => {
            // Only here because it displays the color correctly
          }}
          onclick={() => {
            this.showDropdown = !this.showDropdown;
          }}
        ></CWTextInput>
        {this.showDropdown && (
          <div class="dropdown-options-display">
            {vnode.attrs.inputOptions.map((item, idx) => {
              return (
                <CWPopoverMenuItem
                  {...item}
                  onclick={() => {
                    this.showDropdown = false;
                    this.selectedValue = item.label;
                  }}
                />
              );
            })}
          </div>
        )}
      </div>
    );
  }
}
