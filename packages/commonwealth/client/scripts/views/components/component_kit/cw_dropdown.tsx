/* @jsx m */

import m, { VnodeDOM } from 'mithril';

import 'components/component_kit/cw_dropdown.scss';

import { CWTextInput } from './cw_text_input';
import { CWPopoverMenuItem } from './cw_popover/cw_popover_menu';
import { DefaultMenuItem } from './types';

export type DropdownInputAttrs = {
  initialValue?: string;
  defaultMenuItems: Array<DefaultMenuItem>;
  onSelect?: (optionLabel: string, index?: number) => void;
  searchable?: boolean;
};

export class CWDropdown implements m.ClassComponent<DropdownInputAttrs> {
  private showDropdown: boolean;
  private selectedValue: string;
  private activeMenuItems: Array<DefaultMenuItem>;

  oninit(vnode: VnodeDOM<DropdownInputAttrs, this>) {
    this.showDropdown = false;
    this.selectedValue =
      vnode.attrs.initialValue ?? vnode.attrs.defaultMenuItems[0].label;
  }

  view(vnode: VnodeDOM<DropdownInputAttrs, this>) {
    const { defaultMenuItems, onSelect, searchable } = vnode.attrs;
    if (!this.selectedValue) this.activeMenuItems = defaultMenuItems;

    return (
      <div class="dropdown-wrapper">
        <CWTextInput
          iconRight="chevronDown"
          placeholder={this.selectedValue}
          displayOnly={!searchable}
          iconRightonclick={() => {
            // Only here because it makes TextInput display correctly
          }}
          onclick={() => {
            this.showDropdown = !this.showDropdown;
          }}
          oninput={(e) => {
            if (e.target.value?.length > 0) {
              const inputText = e.target.value;
              this.activeMenuItems = defaultMenuItems.filter((item: DefaultMenuItem) => item.label.includes(inputText))
              this.selectedValue = this.activeMenuItems[0].label;

            }
          }}
        />
        {this.showDropdown && (
          <div class="dropdown-options-display">
            {this.activeMenuItems.map((item, idx) => {
              return (
                <CWPopoverMenuItem
                  {...item}
                  type="default"
                  onclick={() => {
                    this.showDropdown = false;
                    this.selectedValue = item.label;
                    if (onSelect) onSelect(item.label, idx);
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
