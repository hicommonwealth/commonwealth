/* @jsx m */

import m from 'mithril';

export type DropdownInputAttrs = {
  inputOptions: { label: string; value: string }[];
  onSelect: () => void;
};

export class CWDropdown implements m.ClassComponent<DropdownInputAttrs> {
  view(vnode) {}
}
