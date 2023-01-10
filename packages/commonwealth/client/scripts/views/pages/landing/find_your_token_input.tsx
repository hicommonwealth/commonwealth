/* @jsx m */

import ClassComponent from 'class_component';
import m from 'mithril';

type FindYourTokenInputComponentAttrs = {
  onchangeValue: (event: any) => void;
  onkeyupValue: (event: any) => void;
};

export class FindYourTokenInputComponent extends ClassComponent<FindYourTokenInputComponentAttrs> {
  view(vnode: m.Vnode<FindYourTokenInputComponentAttrs>) {
    return (
      <input
        autocomplete="off"
        class="p-2 flex-grow mr-2 text-xl text-gray-400 pt-3.5 focus:outline-none"
        id="token-input"
        type="text"
        placeholder="Find your favorite token"
        oninput={vnode.attrs.onchangeValue}
        onkeyup={vnode.attrs.onkeyupValue}
      />
    );
  }
}
