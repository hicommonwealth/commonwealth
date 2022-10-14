/* @jsx m */

import m from 'mithril';

import 'components/component_kit/cw_dropdown.scss';

import { CWTextInput } from './cw_text_input';
import { CWPopoverMenuItem } from './cw_popover/cw_popover_menu';
import { MenuItem } from './types';

export type DropdownInputAttrs = {
  inputOptions: Array<MenuItem>;
  onSelect?: (optionLabel: string, index?: number) => void;
  initialValue?: string;
};

export class CWDropdown implements m.ClassComponent<DropdownInputAttrs> {
  private showDropdown: boolean;
  private selectedValue: string;

  oninit(vnode) {
    this.showDropdown = false;
    this.selectedValue =
      vnode.attrs.initialValue ?? vnode.attrs.inputOptions[0].label;
  }

  view(vnode) {
    const { inputOptions, onSelect } = vnode.attrs;

    return (
      <div class="dropdown-wrapper">
        <CWTextInput
          iconRight="chevronDown"
          placeholder={this.selectedValue}
          displayOnly
          iconRightonclick={() => {
            // Only here because it makes TextInput display correctly
          }}
          onclick={() => {
            this.showDropdown = !this.showDropdown;
          }}
        />
        {this.showDropdown && (
          <div class="dropdown-options-display">
            {inputOptions.map((item, idx) => {
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
