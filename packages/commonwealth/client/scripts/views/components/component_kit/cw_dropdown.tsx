/* @jsx m */

import m, { VnodeDOM } from 'mithril';

import 'components/component_kit/cw_dropdown.scss';

import { CWTextInput, TextInputAttrs } from './cw_text_input';
import { CWPopoverMenuItem } from './cw_popover/cw_popover_menu';
import { DefaultMenuItem } from './types';
import { ValidationStatus } from './cw_validation_text';

export type DropdownInputAttrs = {
  customFilter: (item: DefaultMenuItem, query: string) => DefaultMenuItem[];
  defaultActiveIndex?: number;
  defaultMenuItems: DefaultMenuItem[];
  inputValidationFn?: (value: string) => [ValidationStatus, string];
  label: string;
  placeholder?: string;
  onSelect?: (optionLabel: string, index?: number) => void;
  searchable?: boolean;
  textInputAttrs?: TextInputAttrs;
};

export class CWDropdown implements m.ClassComponent<DropdownInputAttrs> {
  private showDropdown: boolean;
  private activeMenuItems: DefaultMenuItem[];
  private value: string;

  filterMenuItems(
    items: DefaultMenuItem[],
    query: string,
    customFilter?: (item: DefaultMenuItem, query: string) => DefaultMenuItem[]
  ) {
    const defaultFilter = (item: DefaultMenuItem) => {
      return item.label.toLowerCase().includes(query.toLowerCase());
    };
    const filterFn = customFilter
      ? (item: DefaultMenuItem) => customFilter(item, query)
      : defaultFilter;

    return items.filter(filterFn);
  }

  oninit(vnode: VnodeDOM<DropdownInputAttrs, this>) {
    this.showDropdown = false;
    this.activeMenuItems = vnode.attrs.defaultMenuItems;

    document.body.addEventListener('click', (event) => {
      const $dropdown = document.querySelector('.dropdown-wrapper');
      if (!$dropdown) return;
      if (!$dropdown.contains(event.target as Node)) {
        this.showDropdown = false;
        m.redraw();
      }
    });
  }

  view(vnode: VnodeDOM<DropdownInputAttrs, this>) {
    const {
      customFilter,
      defaultActiveIndex,
      defaultMenuItems,
      inputValidationFn,
      label,
      onSelect,
      placeholder,
      searchable,
    } = vnode.attrs;

    // Input value must be passed as spread to CWTextInput, or it will
    // always overwrite the defaultValue prop

    if (!this.activeMenuItems.length) this.showDropdown = false;
    const { activeMenuItems, showDropdown, ...thisParams } = this;

    return (
      <div class="dropdown-wrapper">
        <CWTextInput
          iconRight="chevronDown"
          defaultValue={defaultMenuItems[defaultActiveIndex ?? 0].label}
          displayOnly={!searchable}
          iconRightonclick={(e: MouseEvent) => {
            this.showDropdown = !showDropdown;
            e.stopPropagation();
          }}
          inputValidationFn={(val: string) => {
            if (defaultMenuItems.find((i) => i.label === val)) {
              return ['success', 'Input validated'];
            } else {
              return inputValidationFn(val);
            }
          }}
          onclick={() => {
            if (searchable) {
              delete this.value;
            }
            this.showDropdown = !showDropdown;
          }}
          oninput={(e) => {
            this.showDropdown = true;
            if (e.target.value?.length > 0) {
              const inputText = e.target.value;
              this.activeMenuItems = this.filterMenuItems(
                defaultMenuItems,
                inputText,
                customFilter
              );
            } else {
              this.activeMenuItems = defaultMenuItems;
              m.redraw();
            }
          }}
          label={label}
          placeholder={placeholder}
          {...thisParams}
        />
        {showDropdown && (
          <div class="dropdown-options-display">
            {activeMenuItems.map((item, idx) => {
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
