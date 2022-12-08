/* @jsx m */

import m from 'mithril';
import ClassComponent from 'class_component';

import 'components/component_kit/cw_dropdown.scss';

import { CWTextInput } from './cw_text_input';
import { CWText } from './cw_text';

type DropdownAttrs = {
  initialValue?: string;
  label: string;
  onSelect?: (label: string, index: number) => void;
  options: Array<{ label: string }>;
};

export class CWDropdown extends ClassComponent<DropdownAttrs> {
  private showDropdown: boolean;
  private selectedValue: string;

  oninit(vnode: m.Vnode<DropdownAttrs>) {
    this.showDropdown = false;
    this.selectedValue =
      vnode.attrs.initialValue ?? vnode.attrs.options[0].label;
  }

  view(vnode: m.Vnode<DropdownAttrs>) {
    const { label, options, onSelect } = vnode.attrs;

    return (
      <div class="dropdown-wrapper">
        <CWTextInput
          iconRight="chevronDown"
          placeholder={this.selectedValue}
          displayOnly
          iconRightonclick={() => {
            // Only here because it makes TextInput display correctly
          }}
          label={label}
          onclick={() => {
            this.showDropdown = !this.showDropdown;
          }}
        />
        {this.showDropdown && (
          <div class="dropdown-options-display">
            {options.map((item, idx) => {
              return (
                <div
                  class="dropdown-item"
                  onclick={() => {
                    this.showDropdown = false;
                    this.selectedValue = item.label;
                    if (onSelect) onSelect(item.label, idx);
                  }}
                >
                  <CWText className="dropdown-item-text">{item.label}</CWText>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }
}
