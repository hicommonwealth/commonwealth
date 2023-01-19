/* @jsx jsx */
import React from 'react';


import { ClassComponent, ResultNode, render, setRoute, getRoute, getRouteParam, redraw, Component, jsx } from 'mithrilInterop';

import 'components/component_kit/cw_dropdown.scss';

import { CWTextInput } from './cw_text_input';
import { CWText } from './cw_text';

export type DropdownItemType = {
  label: string;
  value: string;
};

type DropdownAttrs = {
  initialValue?: DropdownItemType;
  label: string;
  onSelect?: (item: DropdownItemType) => void;
  options: Array<DropdownItemType>;
};

export class CWDropdown extends ClassComponent<DropdownAttrs> {
  private showDropdown: boolean;
  private selectedValue: DropdownItemType;

  oninit(vnode: ResultNode<DropdownAttrs>) {
    this.showDropdown = false;
    this.selectedValue = vnode.attrs.initialValue ?? vnode.attrs.options[0];
  }

  view(vnode: ResultNode<DropdownAttrs>) {
    const { label, options, onSelect } = vnode.attrs;

    return (
      <div className="dropdown-wrapper">
        <CWTextInput
          iconRight="chevronDown"
          placeholder={this.selectedValue.label}
          displayOnly
          iconRightonClick={() => {
            // Only here because it makes TextInput display correctly
          }}
          label={label}
          onClick={() => {
            this.showDropdown = !this.showDropdown;
          }}
        />
        {this.showDropdown && (
          <div className="dropdown-options-display">
            {options.map((item) => {
              return (
                <div
                  className="dropdown-item"
                  onClick={() => {
                    this.showDropdown = false;
                    this.selectedValue = item;
                    if (onSelect) {
                      onSelect(item);
                    }
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
