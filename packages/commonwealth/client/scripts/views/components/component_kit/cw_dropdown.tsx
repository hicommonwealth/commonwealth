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
    const { defaultActiveIndex, defaultMenuItems } = vnode.attrs;
    this.showDropdown = false;
    this.activeMenuItems = defaultMenuItems;

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
    const { activeMenuItems, showDropdown, ...value } = this;

    return (
      <div class="dropdown-wrapper">
        {/* Check with design re: Some sort of visual indicator that this is a typeable field */}
        <CWTextInput
          iconRight="chevronDown"
          defaultValue={defaultMenuItems[defaultActiveIndex ?? 0].label}
          displayOnly={!searchable}
          // Be sure you haven't damaged non-searchable functionality
          iconRightonclick={(e: MouseEvent) => {
            this.showDropdown = !showDropdown;
            e.stopPropagation();
          }}
          inputValidationFn={inputValidationFn}
          onclick={() => {
            this.value = null;
            this.showDropdown = true;
          }}
          oninput={(e) => {
            // TODO: Debounce
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
            }
          }}
          label={label}
          placeholder={placeholder}
          {...value}
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
