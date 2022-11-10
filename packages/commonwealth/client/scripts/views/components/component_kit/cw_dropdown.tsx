/* @jsx m */

import m, { VnodeDOM } from 'mithril';

import 'components/component_kit/cw_dropdown.scss';

import { CWTextInput, TextInputAttrs } from './cw_text_input';
import { CWPopoverMenuItem } from './cw_popover/cw_popover_menu';
import { DefaultMenuItem } from './types';

export type DropdownInputAttrs = {
  defaultActiveIndex?: number;
  defaultMenuItems: DefaultMenuItem[];
  label: string;
  placeholder?: string;
  onSelect?: (optionLabel: string, index?: number) => void;
  textInputAttrs?: TextInputAttrs;
  uniqueId: string; // Allows for identification of the dropdown in a form
};

export class CWDropdown implements m.ClassComponent<DropdownInputAttrs> {
  private showDropdown: boolean;
  private value: string;

  oninit(vnode: VnodeDOM<DropdownInputAttrs, this>) {
    this.showDropdown = false;

    document.body.addEventListener('click', (event) => {
      const $dropdown = document.getElementById(vnode.attrs.uniqueId);
      if (!$dropdown) return;
      if (!$dropdown.contains(event.target as Node)) {
        this.showDropdown = false;
        m.redraw();
      }
    });
  }

  view(vnode: VnodeDOM<DropdownInputAttrs, this>) {
    const {
      defaultActiveIndex,
      defaultMenuItems,
      label,
      onSelect,
      placeholder,
    } = vnode.attrs;

    if (!this.value) {
      this.value = defaultMenuItems[defaultActiveIndex ?? 0].label;
    }
    const { showDropdown, value } = this;

    return (
      <div id={vnode.attrs.uniqueId} class="dropdown-wrapper">
        <CWTextInput
          iconRight="chevronDown"
          displayOnly={true}
          iconRightonclick={(e: MouseEvent) => {
            this.showDropdown = !showDropdown;
            e.stopPropagation();
          }}
          onclick={() => {
            this.showDropdown = !showDropdown;
          }}
          label={label}
          placeholder={placeholder}
          value={value}
        />
        {showDropdown && (
          <div class="dropdown-options-display">
            {defaultMenuItems.map((item, idx) => {
              return (
                <CWPopoverMenuItem
                  {...item}
                  type="default"
                  onclick={() => {
                    this.showDropdown = false;
                    this.value = item.label;
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
