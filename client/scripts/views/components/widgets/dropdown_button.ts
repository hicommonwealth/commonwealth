import 'components/widgets/dropdown_button.scss';

import m from 'mithril';
import $ from 'jquery';

import { featherIcon } from 'helpers';

interface IAttrs {
  label: string;
  disabled: boolean;
}

interface IState {
  dropdownOpen: boolean;
}

const DropdownButton: m.Component<IAttrs, IState> = {
  view: (vnode: m.VnodeDOM<IAttrs, IState>) => {
    const label = vnode.attrs.label || 'Button';
    const blurMenu = () => {
      if (!vnode.state.dropdownOpen) return;
      vnode.state.dropdownOpen = false;
      m.redraw();
    };

    return m('.DropdownButton', {
      class: vnode.attrs.disabled ? 'disabled' : '',
      oncreate: (e) => { $('body').on('click', blurMenu); },
      onremove: (e) => { $('body').off('click', blurMenu); },
    }, [
      m('button', {
        type: 'submit',
        onclick: (e) => {
          e.stopPropagation();
          e.preventDefault();
          vnode.state.dropdownOpen = !vnode.state.dropdownOpen;
        },
        onblur: (e) => {
          e.stopPropagation();
          e.preventDefault();
          vnode.state.dropdownOpen = false;
        }
      }, [
        label,
        featherIcon('chevron-down', 14, 3, '#fff'),
      ]),
      m('.dropdown', {
        class: vnode.state.dropdownOpen ? 'open' : '',
      }, [
        m('ul', vnode.children),
      ]),
    ]);
  }
};

export default DropdownButton;
