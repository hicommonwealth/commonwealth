/* @jsx m */

import m from 'mithril';
import ClassComponent from 'class_component';

import 'components/component_kit/cw_dropdown.scss';

import { CWTextInput, BaseTextInputAttrs } from './cw_text_input';
import { CWPopoverMenuItem } from './cw_popover/cw_popover_menu';
import { DefaultMenuItem } from './types';

type DropdownAttrs = {
  inputOptions: Array<DefaultMenuItem>;
  onSelect?: (optionLabel: string, index?: number) => void;
  label: string;
  placeholder?: string;
  defaultActiveIndex?: number;
  textInputAttrs?: BaseTextInputAttrs;
  uniqueId: string; // Allows for identification of the dropdown in a form
};

export class CWDropdown extends ClassComponent<DropdownAttrs> {
  private showDropdown: boolean;
  private value: string;

  oninit(vnode: m.Vnode<DropdownAttrs>) {
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

  view(vnode: m.Vnode<DropdownAttrs>) {
    const { defaultActiveIndex, inputOptions, label, onSelect, placeholder } =
      vnode.attrs;

      if (!this.value) {
        this.value = inputOptions[defaultActiveIndex ?? 0].label;
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
            {inputOptions.map((item, idx) => {
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
