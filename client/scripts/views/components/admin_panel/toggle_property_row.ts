import m from 'mithril';
import { Switch } from 'construct-ui';

interface ITogglePropertyRowAttrs {
  title: string;
  defaultValue: boolean;
  disabled?: boolean;
  onToggle: Function;
}

interface ITogglePropertyRowState {
  toggled: boolean;
  checked: boolean;
}

const TogglePropertyRow: m.Component<ITogglePropertyRowAttrs, ITogglePropertyRowState> = {
  oninit: (vnode) => {
    vnode.state.toggled = false;
    vnode.state.checked = vnode.attrs.defaultValue;
  },
  view: (vnode) => {
    return m('tr', {
      class: 'TogglePropertyRow',
    }, [
      m('td', vnode.attrs.title),
      m('td', [
        m(Switch, {
          checked: vnode.state.checked,
          disabled: vnode.attrs.disabled || false,
          onchange: () => {
            vnode.state.toggled = !vnode.state.toggled;
            vnode.state.checked = !vnode.state.checked;
            vnode.attrs.onToggle(vnode.state.toggled);
          },
        })
      ])
    ]);
  },
};

export default TogglePropertyRow;
