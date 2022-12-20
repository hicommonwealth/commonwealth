/* @jsx m */

import m from 'mithril';
import { ClassComponent, ResultNode, render } from 'mithrilInterop';

import 'components/component_kit/cw_dropdown.scss';

import { CWTextInput } from './cw_text_input';
import { CWPopoverMenuItem } from './cw_popover/cw_popover_menu';
import { DefaultMenuItem } from './types';

type DropdownAttrs = {
  inputOptions: Array<DefaultMenuItem>;
  onSelect?: (optionLabel: string, index?: number) => void;
  initialValue?: string;
};

export class CWDropdown extends ClassComponent<DropdownAttrs> {
  private showDropdown: boolean;
  private selectedValue: string;

  oninit(vnode: ResultNode<DropdownAttrs>) {
    this.showDropdown = false;
    this.selectedValue =
      vnode.attrs.initialValue ?? vnode.attrs.inputOptions[0].label;
  }

  view(vnode: ResultNode<DropdownAttrs>) {
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
